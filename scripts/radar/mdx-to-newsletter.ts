#!/usr/bin/env bun
/**
 * mdx-to-newsletter.ts — 把最新一份 digest MDX 推到 buttondown 当邮件草稿
 *
 * 设计：
 *   - 读 src/content/digest/ 下按 slug 最新的 MDX
 *   - 转 markdown body (frontmatter 剥离 + 加 hook + 加 footer)
 *   - POST 到 buttondown /v1/emails as draft (owner 在 buttondown 手动 schedule)
 *   - Idempotent: GET /v1/emails 查 subject 已存在 → skip
 *
 * 用法:
 *   bun run scripts/radar/mdx-to-newsletter.ts                     # 用最新 digest
 *   bun run scripts/radar/mdx-to-newsletter.ts --slug 2026-W22...  # 指定 slug
 *   bun run scripts/radar/mdx-to-newsletter.ts --dry-run           # 打印 payload，不发
 *
 * env:
 *   BUTTONDOWN_API_KEY      — buttondown personal API key (required, 否则跳过)
 *   BUTTONDOWN_BASE_URL     — default https://api.buttondown.com/v1
 *   C2M_PUBLIC_BASE_URL     — default https://claude2master.com
 *
 * 退出码:
 *   0 — 正常 (含 "no digest" / "draft 已存在" / "no api key" 都是 0, CI 非阻塞)
 *   1 — 网络 / IO / 字段解析失败 (CI 失败但通过 || true 兜底)
 */

import { promises as fs } from "fs";
import path from "path";

// Bun 原生, 跨平台 (旧 URL.pathname 写法在 Linux CI 退化成相对路径 → ENOENT)
const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DIGEST_DIR = path.join(ROOT, "src", "content", "digest");

const TOKEN = process.env.BUTTONDOWN_API_KEY ?? "";
const BASE =
  process.env.BUTTONDOWN_BASE_URL ?? "https://api.buttondown.com/v1";
const SITE = process.env.C2M_PUBLIC_BASE_URL ?? "https://claude2master.com";

interface DigestFrontmatter {
  slug: string;
  title: string;
  hook: string;
  weekOf: string;
  publishedAt: string;
}

function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  body: string;
} {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const data: Record<string, unknown> = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value: unknown = m[2].trim();
    if (typeof value === "string") {
      const s = value as string;
      if (s.startsWith("[") && s.endsWith("]")) {
        value = s
          .slice(1, -1)
          .split(",")
          .map((x) => x.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (
        (s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))
      ) {
        value = s.slice(1, -1);
      }
    }
    data[key] = value;
  }
  return { data, body };
}

async function pickDigest(
  slugFilter?: string,
): Promise<{ fm: DigestFrontmatter; body: string } | null> {
  let entries: string[];
  try {
    entries = await fs.readdir(DIGEST_DIR);
  } catch {
    return null;
  }
  const mdxs = entries.filter((f) => f.endsWith(".mdx")).sort();
  if (mdxs.length === 0) return null;
  const target = slugFilter
    ? mdxs.find((f) => f.replace(/\.mdx$/, "") === slugFilter)
    : mdxs[mdxs.length - 1];
  if (!target) return null;
  const raw = await fs.readFile(path.join(DIGEST_DIR, target), "utf-8");
  const { data, body } = parseFrontmatter(raw);
  const fm: DigestFrontmatter = {
    slug: String(data.slug ?? target.replace(/\.mdx$/, "")),
    title: String(data.title ?? ""),
    hook: String(data.hook ?? ""),
    weekOf: String(data.weekOf ?? ""),
    publishedAt: String(data.publishedAt ?? ""),
  };
  return { fm, body: body.trim() };
}

function buildEmailBody(fm: DigestFrontmatter, body: string): string {
  const url = `${SITE}/weekly/${fm.slug}`;
  // 删除文章末尾的 "本周报由 LLM 起草" disclaimer (在邮件里冗余)
  const cleaned = body.replace(/\n---\n\n> 本周报由 LLM[\s\S]*$/, "").trim();
  return `> ${fm.hook}

${cleaned}

---

**网页版**：[${url}](${url})

**为什么收到这封邮件**：你在 [claude2master.com/subscribe](${SITE}/subscribe) 订阅了 Weekly Digest。所有邮件底部都有退订链接。
`;
}

async function buttondownEmailExists(subject: string): Promise<boolean> {
  // GET /emails?subject=... — buttondown 支持 ?subject= filter
  const resp = await fetch(
    `${BASE}/emails?subject=${encodeURIComponent(subject)}`,
    {
      headers: { Authorization: `Token ${TOKEN}` },
    },
  );
  if (!resp.ok) {
    // GET 失败不 block 创建 (worst case: 重复创建 draft, owner 删一份)
    console.error(
      `[newsletter] GET /emails ${resp.status}: ${(await resp.text()).slice(0, 200)}`,
    );
    return false;
  }
  const json = (await resp.json()) as { results?: { subject?: string }[] };
  return (json.results ?? []).some((e) => e.subject === subject);
}

async function createDraft(subject: string, body: string): Promise<void> {
  const resp = await fetch(`${BASE}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${TOKEN}`,
    },
    body: JSON.stringify({
      subject,
      body,
      status: "draft",
      email_type: "public",
    }),
  });
  if (!resp.ok && resp.status !== 201) {
    const text = await resp.text();
    throw new Error(
      `buttondown POST /emails ${resp.status}: ${text.slice(0, 400)}`,
    );
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const slugIdx = argv.indexOf("--slug");
  const slugFilter =
    slugIdx >= 0 && argv[slugIdx + 1] ? argv[slugIdx + 1] : undefined;

  if (!TOKEN && !dryRun) {
    console.error(
      "[newsletter] BUTTONDOWN_API_KEY missing; skipping (exit 0)",
    );
    return;
  }

  const picked = await pickDigest(slugFilter);
  if (!picked) {
    console.error(
      `[newsletter] no digest MDX found${slugFilter ? ` for slug=${slugFilter}` : ""}; exit 0`,
    );
    return;
  }

  const { fm, body } = picked;
  const subject = fm.title;
  const emailBody = buildEmailBody(fm, body);

  if (dryRun) {
    console.log(`# DRY RUN — would POST to buttondown:`);
    console.log(`subject: ${subject}`);
    console.log(`body:\n${emailBody}`);
    return;
  }

  if (await buttondownEmailExists(subject)) {
    console.error(
      `[newsletter] draft with subject "${subject}" already exists in buttondown; skipping`,
    );
    return;
  }

  await createDraft(subject, emailBody);
  console.error(
    `[newsletter] created buttondown draft (status: draft) for ${fm.slug}`,
  );
  console.log(fm.slug);
}

await main();
