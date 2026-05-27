#!/usr/bin/env bun
/**
 * summarize.ts — 把 GitHub release notes 用 LLM 转中文摘要 + 写 MDX
 *
 * 用法:
 *   echo '<json>' | bun run scripts/radar/summarize.ts        # 批量 (stdin JSON Lines, 来自 fetch-releases.sh)
 *   bun run scripts/radar/summarize.ts --release-url <url>    # 单条验证 (plan §11 step 1)
 *   bun run scripts/radar/summarize.ts --dry-run               # 打印 MDX, 不写文件 / 不更新 state
 *
 * env:
 *   NEWAPI_TRIAL_TOKEN — newapi.lurus.cn API key (复用 Phase 3 chat)
 *   NEWAPI_BASE_URL    — default https://newapi.lurus.cn
 *   GITHUB_TOKEN       — 抓 single release 时用 (匿名 60req/h)
 *   RADAR_MODEL_ID     — default deepseek-v3-2-251201 (Claude channel 接通后改 claude-haiku-4-5)
 */

import { promises as fs } from "fs";
import path from "path";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");

const NEWAPI_BASE_URL =
  process.env.NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
const MODEL_ID = process.env.RADAR_MODEL_ID ?? "deepseek-v3-2-251201";
const TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";

// ── 写死的 summarize prompt (审计可查 / 不动态拼接) ────────────────────
// 改动必须 commit 留 diff, 别 patch.
const SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的英文 release notes，输出严格 JSON，字段如下：

{
  "hook": "30 字内中文钩子，回答这条为什么值得看 30 秒",
  "body": "200 字内中文 markdown，3 个 bullet，每个一个事实变化 + 一句对 agent harness 设计的含义",
  "tags": ["最多 4 个英文 kebab-case"]
}

强约束：
- release notes 未明确提到的功能不写
- 不喊口号、不堆 emoji
- 不复制原文长段，只摘要
- 输出必须是合法 JSON，无任何前后说明文字`;

interface ReleaseInput {
  repo: string;
  tag: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

interface SummaryOutput {
  hook: string;
  body: string;
  tags: string[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/^v/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveSlug(release: ReleaseInput): string {
  const date = release.published_at.slice(0, 10);
  const repo = release.repo.split("/")[1] ?? release.repo;
  return `${date}-${slugify(repo)}-${slugify(release.tag)}`;
}

async function callLLM(release: ReleaseInput): Promise<SummaryOutput> {
  if (!TOKEN) throw new Error("NEWAPI_TRIAL_TOKEN missing");
  const userContent = `Repository: ${release.repo}
Tag: ${release.tag}
Title: ${release.name}
URL: ${release.html_url}

Release notes:
${release.body || "(no notes provided)"}`;

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
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800,
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

  let parsed: SummaryOutput;
  try {
    parsed = JSON.parse(content) as SummaryOutput;
  } catch {
    throw new Error(`LLM did not return valid JSON: ${content.slice(0, 200)}`);
  }
  if (!parsed.hook || !parsed.body || !Array.isArray(parsed.tags)) {
    throw new Error(`LLM JSON missing fields: ${content.slice(0, 200)}`);
  }
  return parsed;
}

function buildMdx(
  release: ReleaseInput,
  summary: SummaryOutput,
  slug: string,
): string {
  const tagsArr = `[${summary.tags.map((t) => `${t.trim()}`).join(", ")}]`;
  const title = `${release.repo.split("/")[1]} ${release.tag} — ${summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40)}`;
  return `---
slug: ${slug}
title: "${title}"
source: ${release.repo}
sourceUrl: ${release.html_url}
publishedAt: ${release.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: pending
hook: "${summary.hook.replace(/"/g, '\\"')}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文 release：[${release.repo} ${release.tag}](${release.html_url})
`;
}

async function fetchReleaseFromUrl(url: string): Promise<ReleaseInput> {
  // url 形如 https://github.com/anthropics/claude-code/releases/tag/v1.0.50
  const m = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/?#]+)/,
  );
  if (!m) throw new Error(`Cannot parse release URL: ${url}`);
  const [, owner, repo, tag] = m;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
  const auth: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    auth.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const resp = await fetch(apiUrl, { headers: auth });
  if (!resp.ok)
    throw new Error(`GitHub API ${resp.status}: ${await resp.text()}`);
  const data = (await resp.json()) as {
    tag_name: string;
    name: string;
    body: string;
    html_url: string;
    published_at: string;
  };
  return {
    repo: `${owner}/${repo}`,
    tag: data.tag_name,
    name: data.name,
    body: data.body,
    html_url: data.html_url,
    published_at: data.published_at,
  };
}

async function loadState(): Promise<{
  lastSeen: Record<string, string>;
  raw: Record<string, unknown>;
}> {
  const raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as Record<
    string,
    unknown
  >;
  return {
    lastSeen: (raw.lastSeen as Record<string, string>) ?? {},
    raw,
  };
}

async function saveState(
  raw: Record<string, unknown>,
  lastSeen: Record<string, string>,
): Promise<void> {
  raw.lastSeen = lastSeen;
  await fs.writeFile(STATE_FILE, JSON.stringify(raw, null, 2) + "\n", "utf-8");
}

async function processRelease(
  release: ReleaseInput,
  opts: { dryRun: boolean },
): Promise<{ slug: string; path: string }> {
  const summary = await callLLM(release);
  const slug = deriveSlug(release);
  const mdx = buildMdx(release, summary, slug);
  const filePath = path.join(CHANGELOG_DIR, `${slug}.mdx`);
  if (opts.dryRun) {
    console.log(`# ---- DRY RUN: ${filePath} ----`);
    console.log(mdx);
    return { slug, path: filePath };
  }
  await fs.mkdir(CHANGELOG_DIR, { recursive: true });
  await fs.writeFile(filePath, mdx, "utf-8");
  console.error(`[radar] wrote ${path.relative(ROOT, filePath)}`);
  return { slug, path: filePath };
}

async function readStdinReleases(): Promise<ReleaseInput[]> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  const text = Buffer.concat(chunks).toString("utf-8").trim();
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ReleaseInput);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const urlIdx = argv.indexOf("--release-url");
  const singleUrl = urlIdx >= 0 ? argv[urlIdx + 1] : undefined;

  let releases: ReleaseInput[];
  if (singleUrl) {
    releases = [await fetchReleaseFromUrl(singleUrl)];
  } else {
    releases = await readStdinReleases();
  }

  if (releases.length === 0) {
    console.error("[radar] no releases to process; exit 0");
    return;
  }

  const state = dryRun ? null : await loadState();
  let okCount = 0;
  const errors: { repo: string; tag: string; err: string }[] = [];

  for (const r of releases) {
    try {
      await processRelease(r, { dryRun });
      if (state) state.lastSeen[r.repo] = r.tag;
      okCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ repo: r.repo, tag: r.tag, err: msg });
      console.error(`[radar] FAIL ${r.repo}@${r.tag}: ${msg}`);
    }
  }

  if (state) await saveState(state.raw, state.lastSeen);

  console.error(
    `[radar] done: ${okCount} ok, ${errors.length} failed, ${releases.length} total`,
  );
  if (errors.length > 0 && okCount === 0) process.exit(1);
}

await main();
