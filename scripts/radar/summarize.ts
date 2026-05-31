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

// Bun 原生, 跨平台 (旧 URL.pathname 写法在 Linux CI 退化成相对路径 → ENOENT)
const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");

const NEWAPI_BASE_URL =
  process.env.NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
const MODEL_ID = process.env.RADAR_MODEL_ID ?? "deepseek-v3-2-251201";
const TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";

// ── 写死的 summarize prompt (审计可查 / 不动态拼接) ────────────────────
// 改动必须 commit 留 diff, 别 patch.
const RELEASE_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的英文 release notes，输出严格 JSON，字段如下：

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

const PRACTICE_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的英文最佳实践文章 (Anthropic 工程博客 / Claude Code 文档 / OpenAI Codex blog)，输出严格 JSON，字段如下：

{
  "hook": "30 字内中文钩子，回答这篇文章为什么值得读 5 分钟",
  "body": "240 字内中文 markdown，3 个 bullet，每个一条文章里的具体做法/结论 + 一句对 agent harness / prompt 设计的含义",
  "tags": ["最多 4 个英文 kebab-case"]
}

强约束：
- 文章里没写的方法不写、不引申、不脑补
- 不喊口号、不堆 emoji
- 不复制原文长段，只摘要
- 输出必须是合法 JSON，无任何前后说明文字`;

const INSIGHT_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手，国内开发者视角。基于已有的中文摘要，写一段 80–150 字的「Lurus 视角」，硬约束：

1. 必须给明确判断，覆盖下列至少一项（按相关度选）：
   - 现有用户值不值得升级 / 怎么升
   - 现有 prompt 或 hook 配置要不要改
   - 国内用户走 newapi.lurus.cn 代理是否受影响
2. 只能引用「输入摘要」里已经出现的事实，不引申、不脑补、不堆未提到的功能
3. 一段话，自然语言，不用 bullet、不堆 emoji
4. 输出严格 JSON：{ "insight": "<这段话>" }
5. 无任何前后说明文字`;

interface ReleaseInput {
  kind?: "release";
  repo: string;
  tag: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

interface PracticeInput {
  kind: "practice";
  label: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

type Input = ReleaseInput | PracticeInput;

function isPractice(x: Input): x is PracticeInput {
  return (x as PracticeInput).kind === "practice";
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

function deriveSlug(input: Input): string {
  const date = input.published_at.slice(0, 10);
  if (isPractice(input)) {
    const pathTail = input.url
      .replace(/^https?:\/\/[^/]+\//, "")
      .replace(/\/$/, "")
      .split("/")
      .slice(-1)[0];
    return `${date}-${slugify(input.label)}-${slugify(pathTail || "post")}`;
  }
  const repo = input.repo.split("/")[1] ?? input.repo;
  return `${date}-${slugify(repo)}-${slugify(input.tag)}`;
}

// 单次调用; 失败抛错, status 字段供重试层判定是否可重试。
async function callNewapiOnce(
  systemPrompt: string,
  userContent: string,
  maxTokens: number,
): Promise<string> {
  const resp = await fetch(`${NEWAPI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`newapi ${resp.status}: ${text.slice(0, 300)}`);
    (err as { status?: number }).status = resp.status;
    throw err;
  }

  const json = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("LLM returned empty content");
  return content;
}

// 重试包装: newapi 网关在 fresh runner 上首次连接常被 socket-close(冷启动),
// 后续复用连接即正常。对网络层错误(无 HTTP status)与 5xx 退避重试; 4xx(鉴权/配置)
// 立即抛出(重试无意义)。仅加韧性, 不改输出格式。
async function callNewapi(
  systemPrompt: string,
  userContent: string,
  maxTokens: number,
): Promise<string> {
  if (!TOKEN) throw new Error("NEWAPI_TRIAL_TOKEN missing");
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callNewapiOnce(systemPrompt, userContent, maxTokens);
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      const retryable = status === undefined || status >= 500;
      if (retryable && attempt < MAX_ATTEMPTS) {
        console.error(
          `[radar] newapi attempt ${attempt}/${MAX_ATTEMPTS} failed (${
            err instanceof Error ? err.message : String(err)
          }); retrying`,
        );
        await new Promise((r) => setTimeout(r, attempt * 1500));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function callLLM(input: Input): Promise<SummaryOutput> {
  const sysPrompt = isPractice(input)
    ? PRACTICE_SYSTEM_PROMPT
    : RELEASE_SYSTEM_PROMPT;

  const userContent = isPractice(input)
    ? `Source label: ${input.label}
URL: ${input.url}
Title: ${input.title}

Article body (truncated to ~8KB):
${input.body || "(empty)"}`
    : `Repository: ${input.repo}
Tag: ${input.tag}
Title: ${input.name}
URL: ${input.html_url}

Release notes:
${input.body || "(no notes provided)"}`;

  const content = await callNewapi(sysPrompt, userContent, 800);
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

async function callCommentary(
  input: Input,
  summary: SummaryOutput,
): Promise<string> {
  const titleLine = isPractice(input)
    ? `${input.title} (${input.label})`
    : `${input.repo} ${input.tag} — ${input.name}`;

  const userContent = `输入摘要标题：${titleLine}

中文 hook：${summary.hook}

中文摘要正文：
${summary.body}

请仅基于以上事实，给一段 80–150 字的 Lurus 视角判断。`;

  const content = await callNewapi(INSIGHT_SYSTEM_PROMPT, userContent, 400);
  let parsed: { insight?: string };
  try {
    parsed = JSON.parse(content) as { insight?: string };
  } catch {
    throw new Error(
      `insight LLM did not return valid JSON: ${content.slice(0, 200)}`,
    );
  }
  const insight = (parsed.insight ?? "").trim();
  if (insight.length < 40) {
    throw new Error(
      `insight too short (${insight.length} chars): ${insight.slice(0, 120)}`,
    );
  }
  return insight;
}

function escapeYaml(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildMdx(
  input: Input,
  summary: SummaryOutput,
  insight: string,
  slug: string,
): string {
  const tagsArr = `[${summary.tags.map((t) => `${t.trim()}`).join(", ")}]`;
  // §4.1 守: verified 只允许写 "pending"; "tested" 由编辑手动改
  const verified = "pending" as const;
  const kind: "changelog" | "practice" = isPractice(input)
    ? "practice"
    : "changelog";

  if (isPractice(input)) {
    const titleCore = summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40);
    const title = `${input.title.slice(0, 40)} — ${titleCore}`;
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: ${input.label}
sourceUrl: ${input.url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
hook: "${escapeYaml(summary.hook)}"
insight: "${escapeYaml(insight)}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文：[${input.title}](${input.url})
`;
  }

  const release = input as ReleaseInput;
  const title = `${release.repo.split("/")[1]} ${release.tag} — ${summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40)}`;
  return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: ${release.repo}
sourceUrl: ${release.html_url}
publishedAt: ${release.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
hook: "${escapeYaml(summary.hook)}"
insight: "${escapeYaml(insight)}"
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

async function processInput(
  input: Input,
  opts: { dryRun: boolean },
): Promise<{ slug: string; path: string }> {
  const summary = await callLLM(input);
  const insight = await callCommentary(input, summary);
  const slug = deriveSlug(input);
  const mdx = buildMdx(input, summary, insight, slug);
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

async function readStdinInputs(): Promise<Input[]> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  const text = Buffer.concat(chunks).toString("utf-8").trim();
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Input);
}

function inputLabel(x: Input): string {
  return isPractice(x) ? `${x.label}@${x.url}` : `${x.repo}@${x.tag}`;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const urlIdx = argv.indexOf("--release-url");
  const singleUrl = urlIdx >= 0 ? argv[urlIdx + 1] : undefined;

  let inputs: Input[];
  if (singleUrl) {
    inputs = [await fetchReleaseFromUrl(singleUrl)];
  } else {
    inputs = await readStdinInputs();
  }

  if (inputs.length === 0) {
    console.error("[radar] no inputs to process; exit 0");
    return;
  }

  const state = dryRun ? null : await loadState();
  let okCount = 0;
  const errors: { id: string; err: string }[] = [];

  for (const input of inputs) {
    const id = inputLabel(input);
    try {
      await processInput(input, { dryRun });
      // release 类型沿用 lastSeen 旧路径; practice 的 seen 由 fetch-practices.ts 写
      if (state && !isPractice(input)) {
        state.lastSeen[input.repo] = input.tag;
      }
      okCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ id, err: msg });
      console.error(`[radar] FAIL ${id}: ${msg}`);
    }
  }

  if (state) await saveState(state.raw, state.lastSeen);

  console.error(
    `[radar] done: ${okCount} ok, ${errors.length} failed, ${inputs.length} total`,
  );
  if (errors.length > 0 && okCount === 0) process.exit(1);
}

await main();
