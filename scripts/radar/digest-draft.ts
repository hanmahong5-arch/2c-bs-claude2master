#!/usr/bin/env bun
/**
 * digest-draft.ts — 把过去 7 天 changelog 综合成一份 weekly digest 草稿
 *
 * 用法:
 *   bun run scripts/radar/digest-draft.ts                    # 输出 MDX 到 src/content/digest/，stdout=slug
 *   bun run scripts/radar/digest-draft.ts --dry-run          # 打印 MDX 到 stdout，不写文件
 *   bun run scripts/radar/digest-draft.ts --week-of 2026-05-26  # 用指定日期作为 cutoff
 *   bun run scripts/radar/digest-draft.ts --since 7          # 回溯天数 (default 7)
 *
 * env:
 *   NEWAPI_TRIAL_TOKEN — newapi.lurus.cn API key
 *   NEWAPI_BASE_URL    — default https://newapi.lurus.cn
 *   RADAR_MODEL_ID     — default deepseek-chat (稳定别名, 不随版本号轮换)
 *
 * 退出码:
 *   0 — 正常 (含 "本周窗口内无 changelog" → 不产出 MDX, 也是 0)
 *   1 — LLM/IO 错误
 *
 * stdout 契约: 正常模式只输出 slug (一行)；dry-run 模式输出 MDX；所有 log 走 stderr。
 */

import { promises as fs } from "fs";
import path from "path";

// Bun 原生, 跨平台 (旧 URL.pathname 写法在 Linux CI 退化成相对路径 → ENOENT)
const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const DIGEST_DIR = path.join(ROOT, "src", "content", "digest");

const NEWAPI_BASE_URL =
  process.env.NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
const MODEL_ID = process.env.RADAR_MODEL_ID ?? "deepseek-chat";
const TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";

// ── 写死 prompt (审计可查 / 不动态拼接) ────────────────────────────────
const SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。给你过去若干天的 N 条 changelog 摘要（每条已是中文），请综合产出一份 "agentic 工具链周报" 草稿。编辑会在 PR 上做最后润色。

输出严格 JSON，字段如下：

{
  "title": "30 字内中文标题，按本周最大变化命名",
  "hook": "60 字内中文导语，回答 \\"这周值得关注的核心议题是什么\\"",
  "body": "1000-1500 字中文 markdown，固定五段结构：\\n\\n## 本周看点\\n2-3 句概述本周主基调\\n\\n## 逐条速览\\n每条 changelog 一段 (条目数=N, 不漏)。格式: '- **[源/标题]** (X min) — 一句话事实 + 原文 [链接](url)'。X min 按内容深度估 1-5 分钟阅读时长\\n\\n## 本周实测\\n挑 1 条本周 release 的具体功能, 用 100-200 字描述如果在 c2m 本地复现要做什么 (步骤简述 + 预期看到什么)。读者可以照着自己跑\\n\\n## 设计趋势\\n抽 1-2 条贯穿性的设计观察 + 对 agent harness 设计者的含义。必须有具体证据 (指向 changelog 条目)\\n\\n## 编辑没选它的原因\\n如果有 1-2 条 release 本周编辑刻意没展开, 简述为什么 (例: 仅文档调整 / 实验性 / 与本周主线无关)。如果全选了, 直接写'本周所有 release 都覆盖了, 无遗漏'",
  "tags": ["最多 5 个英文 kebab-case，贯穿本周主题"],
  "readingMinutes": "整个周报的总阅读时长 (整数, 4-12 之间)"
}

强约束：
- 引用具体 release 必须给原文 URL
- 不喊口号、不堆 emoji、不夸大
- 本周实测段必须可操作 (有命令 / URL / 具体动作)，不要写空话
- "编辑没选它的原因"段是 c2m 差异化栏目, 一定要有判断, 不要敷衍
- 设计趋势那段必须有具体证据 (指向 changelog 条目)
- 输出必须是合法 JSON，无任何前后说明文字`;

interface ChangelogSnapshot {
  slug: string;
  title: string;
  hook: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  body: string;
}

interface DigestOutput {
  title: string;
  hook: string;
  body: string;
  tags: string[];
  readingMinutes?: number;
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

function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: date.getUTCFullYear(), week };
}

function mondayOf(d: Date): string {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (dayNum - 1));
  return date.toISOString().slice(0, 10);
}

async function loadRecentChangelog(
  cutoff: Date,
  sinceDays: number,
): Promise<ChangelogSnapshot[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(CHANGELOG_DIR);
  } catch {
    return [];
  }
  const horizon = new Date(cutoff);
  horizon.setUTCDate(horizon.getUTCDate() - sinceDays);
  const items: ChangelogSnapshot[] = [];
  for (const f of entries) {
    if (!f.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(CHANGELOG_DIR, f), "utf-8");
    const { data, body } = parseFrontmatter(raw);
    const published = String(data.publishedAt ?? "");
    if (!published) continue;
    const pdate = new Date(`${published}T00:00:00Z`);
    if (pdate < horizon || pdate > cutoff) continue;
    items.push({
      slug: String(data.slug ?? f.replace(/\.mdx$/, "")),
      title: String(data.title ?? ""),
      hook: String(data.hook ?? ""),
      source: String(data.source ?? ""),
      sourceUrl: String(data.sourceUrl ?? ""),
      publishedAt: published,
      body: body.trim(),
    });
  }
  return items.sort((a, b) => (a.publishedAt < b.publishedAt ? -1 : 1));
}

function buildLLMInput(items: ChangelogSnapshot[]): string {
  return items
    .map(
      (i) => `## ${i.title}
- repo: ${i.source}
- 日期: ${i.publishedAt}
- 原文: ${i.sourceUrl}
- 钩子: ${i.hook}
- 摘要正文:
${i.body}`,
    )
    .join("\n\n---\n\n");
}

async function callLLM(input: string): Promise<DigestOutput> {
  if (!TOKEN) throw new Error("NEWAPI_TRIAL_TOKEN missing");
  const resp = await fetch(`${NEWAPI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2500,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`newapi ${resp.status}: ${text.slice(0, 300)}`);
  }
  const json = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("LLM returned empty content");
  let parsed: DigestOutput;
  try {
    parsed = JSON.parse(content) as DigestOutput;
  } catch {
    throw new Error(`LLM did not return valid JSON: ${content.slice(0, 200)}`);
  }
  if (!parsed.title || !parsed.hook || !parsed.body || !Array.isArray(parsed.tags)) {
    throw new Error(`LLM JSON missing fields: ${content.slice(0, 200)}`);
  }
  return parsed;
}

function buildMdx(args: {
  slug: string;
  weekOf: string;
  publishedAt: string;
  digest: DigestOutput;
}): string {
  const { slug, weekOf, publishedAt, digest } = args;
  const tagsArr = `[${digest.tags.map((t) => t.trim()).join(", ")}]`;
  // 兜底: LLM 没给就按 1 中文字 ≈ 0.5 秒读, 转换成分钟
  const reading =
    typeof digest.readingMinutes === "number" && digest.readingMinutes > 0
      ? Math.min(15, Math.max(3, Math.round(digest.readingMinutes)))
      : Math.max(3, Math.min(15, Math.round(digest.body.length / 400)));
  return `---
slug: ${slug}
title: "${digest.title.replace(/"/g, '\\"')}"
publishedAt: ${publishedAt}
weekOf: ${weekOf}
authored: hybrid
model: ${MODEL_ID}
readingMinutes: ${reading}
hook: "${digest.hook.replace(/"/g, '\\"')}"
tags: ${tagsArr}
---

${digest.body}

---

> 本周报由 LLM 起草、编辑润色（hybrid）。本草稿走 PR 审核流程，merge 前编辑会校稿。
`;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const weekOfIdx = argv.indexOf("--week-of");
  const sinceIdx = argv.indexOf("--since");

  let cutoff = new Date();
  if (weekOfIdx >= 0 && argv[weekOfIdx + 1]) {
    cutoff = new Date(`${argv[weekOfIdx + 1]}T23:59:59Z`);
    if (Number.isNaN(cutoff.getTime())) {
      throw new Error(`Invalid --week-of date: ${argv[weekOfIdx + 1]}`);
    }
  }
  const since =
    sinceIdx >= 0 && argv[sinceIdx + 1] ? parseInt(argv[sinceIdx + 1], 10) : 7;
  if (!Number.isFinite(since) || since <= 0) {
    throw new Error(`Invalid --since: ${since}`);
  }

  const items = await loadRecentChangelog(cutoff, since);
  console.error(
    `[digest] cutoff=${cutoff.toISOString().slice(0, 10)} since=${since}d items=${items.length}`,
  );

  if (items.length === 0) {
    console.error(
      "[digest] no changelog in lookback window; exit 0 (no digest produced)",
    );
    return;
  }

  const { year, week } = isoWeek(cutoff);
  const slug = `${year}-W${String(week).padStart(2, "0")}-agent-tooling-weekly`;
  const weekOf = mondayOf(cutoff);
  const publishedAt = cutoff.toISOString().slice(0, 10);
  const outPath = path.join(DIGEST_DIR, `${slug}.mdx`);

  if (!dryRun) {
    try {
      await fs.access(outPath);
      console.error(
        `[digest] ${path.relative(ROOT, outPath)} already exists; skipping LLM call`,
      );
      // 不打印 slug 到 stdout — CI 会据此判断跳过 PR
      return;
    } catch {
      // 不存在, 继续
    }
  }

  const input = buildLLMInput(items);
  const digest = await callLLM(input);
  const mdx = buildMdx({ slug, weekOf, publishedAt, digest });

  if (dryRun) {
    console.log(mdx);
    console.error(
      `[digest] dry-run: ${items.length} item(s) → would write ${path.relative(ROOT, outPath)}`,
    );
    return;
  }

  await fs.mkdir(DIGEST_DIR, { recursive: true });
  await fs.writeFile(outPath, mdx, "utf-8");
  console.error(`[digest] wrote ${path.relative(ROOT, outPath)}`);
  console.log(slug);
}

await main();
