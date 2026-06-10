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

const TRENDING_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的 GitHub 仓库信息（近期新建 + 高星的热门项目），输出严格 JSON，字段如下：

{
  "hook": "30 字内中文钩子，这个项目是什么 / 为什么突然火",
  "body": "180 字内中文 markdown，3 个 bullet：① 它是什么、解决什么问题 ② 为什么值得关注（场景 / star 速度 / 技术点）③ 对 agent / 工具链 / 后端开发者有无参考价值",
  "tags": ["最多 4 个英文 kebab-case，含主语言如 rust / go"]
}

强约束：
- 只基于给的仓库描述，不编造功能、不脑补未提到的能力
- 不喊口号、不堆 emoji
- 输出必须是合法 JSON，无任何前后说明文字`;

const BLOGGER_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的某位博主的一篇英文/中文博客原文（个人博客 / Substack / Medium 等），输出严格 JSON，字段如下：

{
  "hook": "30 字内中文钩子，回答这位博主这篇在讲什么、为什么值得读",
  "body": "200–240 字内中文 markdown，3 个 bullet，每个一条文章里的具体观点/事实 + 一句它对 agent / 工具链 / 开发者的含义",
  "tags": ["最多 4 个英文 kebab-case"]
}

强约束：
- 只摘要，绝不转载或大段复制原文（聚合器口径：标题 + 中文摘要 + 原文链接 + 署名）
- 文章里没写的观点不写、不引申、不脑补
- 不喊口号、不堆 emoji
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

// 语音播报口播稿: 给单人主播逐条朗读用 (替代裸 hook, 加代入感)。
// 改动必须 commit 留 diff, 别 patch.
export const BROADCAST_SYSTEM_PROMPT = `你是 claude2master.com 的语音播报撰稿人。基于已有的中文摘要，写一段给「单人主播口播」用的中文播报稿，硬约束：

1. 2–4 句、80–140 字的口语中文，像主播对听众讲话，自然成句、可直接朗读
2. 必须点出「是什么」+「为什么值得关注 / 对国内开发者或 agent 开发的影响」
3. 不要念英文标题、版本号、仓库名（听众听不懂字母数字）；要提到就用中文转述
4. 不用 bullet、不堆术语、不喊口号、不堆 emoji
5. 只能用「输入摘要」里已经出现的事实，不引申、不脑补
6. 输出严格 JSON：{ "broadcast": "<这段话>" }
7. 无任何前后说明文字`;

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

interface TrendingInput {
  kind: "trending";
  repo: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  html_url: string;
  published_at: string;
}

interface BloggerInput {
  kind: "blogger";
  author: string;
  handle: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

type Input = ReleaseInput | PracticeInput | TrendingInput | BloggerInput;

function isPractice(x: Input): x is PracticeInput {
  return (x as PracticeInput).kind === "practice";
}

function isTrending(x: Input): x is TrendingInput {
  return (x as TrendingInput).kind === "trending";
}

function isBlogger(x: Input): x is BloggerInput {
  return (x as BloggerInput).kind === "blogger";
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
  if (isTrending(input)) {
    // 注: 不用 slugify —— 它为版本号剥掉开头的 "v"(v2.1.0→2.1.0), 会误伤 v 开头的仓库名
    // (vercel/vue/vite ...)。repo slug 用不剥 v 的规整。
    const repoSlug = input.repo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${date}-trending-${repoSlug}`;
  }
  if (isBlogger(input)) {
    // handle 已是稳定 kebab 标识; title 取前几词避免 slug 过长 (同 trending 不剥 v)
    const handleSlug = input.handle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const titleSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .split("-")
      .slice(0, 8)
      .join("-");
    return `${date}-blog-${handleSlug}-${titleSlug || "post"}`;
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
export async function callNewapi(
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
    : isTrending(input)
      ? TRENDING_SYSTEM_PROMPT
      : isBlogger(input)
        ? BLOGGER_SYSTEM_PROMPT
        : RELEASE_SYSTEM_PROMPT;

  let userContent: string;
  if (isPractice(input)) {
    userContent = `Source label: ${input.label}
URL: ${input.url}
Title: ${input.title}

Article body (truncated to ~8KB):
${input.body || "(empty)"}`;
  } else if (isBlogger(input)) {
    userContent = `Blogger: ${input.author}
URL: ${input.url}
Title: ${input.title}

Post body (truncated to ~8KB):
${input.body || "(empty)"}`;
  } else if (isTrending(input)) {
    userContent = `Repository: ${input.repo}
Language: ${input.language}
Stars: ${input.stars}
URL: ${input.html_url}

Description:
${input.description || "(no description)"}`;
  } else {
    userContent = `Repository: ${input.repo}
Tag: ${input.tag}
Title: ${input.name}
URL: ${input.html_url}

Release notes:
${input.body || "(no notes provided)"}`;
  }

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

// 输入条目的人读标题行 (供 insight / broadcast 的 LLM 上下文); 覆盖全四类。
function titleLineFor(input: Input): string {
  return isPractice(input)
    ? `${input.title} (${input.label})`
    : isTrending(input)
      ? `${input.name} (${input.repo})`
      : isBlogger(input)
        ? `${input.title} (${input.author})`
        : `${input.repo} ${input.tag} — ${input.name}`;
}

async function callCommentary(
  input: Input,
  summary: SummaryOutput,
): Promise<string> {
  // 注: blogger 不走 commentary (processInput 跳过), 此分支仅为类型收敛与防御兜底。
  const titleLine = titleLineFor(input);

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

// 口播稿: 镜像 callCommentary 的「第二次 LLM 调用」。取 (titleLine, hook, body) 而非
// 整个 Input → 便于 backfill 脚本从已写 MDX 的 frontmatter 直接重用 (不必重建 Input)。
export async function callBroadcast(
  titleLine: string,
  hook: string,
  body: string,
): Promise<string> {
  const userContent = `输入摘要标题：${titleLine}

中文 hook：${hook}

中文摘要正文：
${body}

请仅基于以上事实，写一段 80–140 字的口语播报稿。`;

  const content = await callNewapi(BROADCAST_SYSTEM_PROMPT, userContent, 300);
  let parsed: { broadcast?: string };
  try {
    parsed = JSON.parse(content) as { broadcast?: string };
  } catch {
    throw new Error(
      `broadcast LLM did not return valid JSON: ${content.slice(0, 200)}`,
    );
  }
  const broadcast = (parsed.broadcast ?? "").trim();
  if (broadcast.length < 30) {
    throw new Error(
      `broadcast too short (${broadcast.length} chars): ${broadcast.slice(0, 120)}`,
    );
  }
  return broadcast;
}

export function escapeYaml(s: string): string {
  // YAML 双引号标量里的裸换行会被 content.ts 的逐行 parseFrontmatter 截断字段(甚至
  // 含 "\n---" 时提前终止 frontmatter 致正文丢失)。LLM 输出的 hook/insight/title 可能含
  // 换行 → 先折叠成空格(均为单行展示字段, 语义无损), 再转义反斜杠与引号。
  return s
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function buildMdx(
  input: Input,
  summary: SummaryOutput,
  insight: string,
  broadcast: string,
  slug: string,
): string {
  const tagsArr = `[${summary.tags.map((t) => `${t.trim()}`).join(", ")}]`;
  // §4.1 守: verified 只允许写 "pending"; "tested" 由编辑手动改
  const verified = "pending" as const;
  const kind: "changelog" | "practice" | "trending" | "blogger" = isPractice(
    input,
  )
    ? "practice"
    : isTrending(input)
      ? "trending"
      : isBlogger(input)
        ? "blogger"
        : "changelog";

  if (isBlogger(input)) {
    const titleCore = summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40);
    // 原文标题是最有 SEO 价值的 headline; 超 56 字时在词边界截断 (不切到单词中间)
    const head =
      input.title.length <= 56
        ? input.title
        : input.title.slice(0, 56).replace(/\s+\S*$/, "");
    const title = `${head} — ${titleCore}`;
    // source = author (详情页 source pill / RSS 复用); 另写 author 供「观点」段二级分组。
    // 聚合器口径: 标题 + 中文摘要 + 原文链接 + 署名, 不转载全文。
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: "${escapeYaml(input.author)}"
sourceUrl: ${input.url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
author: "${escapeYaml(input.author)}"
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文：[${input.title}](${input.url}) · 作者 ${input.author}
`;
  }

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
broadcast: "${escapeYaml(broadcast)}"
insight: "${escapeYaml(insight)}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文：[${input.title}](${input.url})
`;
  }

  if (isTrending(input)) {
    const titleCore = summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40);
    const title = `${input.name} — ${titleCore}`;
    // 注: trending 不写 insight(Lurus 视角面向"升级/配置", 不适配随机热门仓库)
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: ${input.repo}
sourceUrl: ${input.html_url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
tags: ${tagsArr}
---

${summary.body}

---

> 项目：[${input.repo}](${input.html_url}) · ⭐ ${input.stars} · ${input.language}
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
broadcast: "${escapeYaml(broadcast)}"
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
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as Record<
      string,
      unknown
    >;
  } catch (e) {
    // state.json 缺失或损坏(如上次写入被 SIGKILL 截断): 降级为空状态(全量 reseed),
    // 而非让异常上抛使整条管线 exit 1 永久卡死, 需人工修复才能恢复。
    console.error(
      `[state] load failed (${(e as Error).message}); degrading to empty state (full reseed)`,
    );
    raw = {};
  }
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
  // 原子写: 先写临时文件再 rename(同一文件系统上 POSIX 保证原子), 避免进程被 SIGKILL
  // 命中写入中途留下截断 JSON, 导致下次 loadState / fetch-releases.sh 解析失败卡死管线。
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(raw, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, STATE_FILE);
}

async function processInput(
  input: Input,
  opts: { dryRun: boolean },
): Promise<{ slug: string; path: string }> {
  const summary = await callLLM(input);
  // trending / blogger 跳过 Lurus 视角(insight 面向"升级/配置", 不适配热门仓库 / 博主观点)
  const insight =
    isTrending(input) || isBlogger(input)
      ? ""
      : await callCommentary(input, summary);
  // 口播稿: 全四类都生成 (纯音频用)。失败不阻塞整条 —— 音频是补充, tts 层缺 broadcast
  // 自动回退 hook (与 tts-generate-cosy.ts 的 broadcast ?? hook 一致), 不该丢掉已成的摘要。
  let broadcast = "";
  try {
    broadcast = await callBroadcast(
      titleLineFor(input),
      summary.hook,
      summary.body,
    );
  } catch (e) {
    console.error(
      `[radar] broadcast skipped for ${inputLabel(input)} (${(e as Error).message}); tts will fall back to hook`,
    );
  }
  const slug = deriveSlug(input);
  const mdx = buildMdx(input, summary, insight, broadcast, slug);
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
  if (isPractice(x)) return `${x.label}@${x.url}`;
  if (isTrending(x)) return `trending:${x.repo}`;
  if (isBlogger(x)) return `blog:${x.handle}@${x.url}`;
  return `${x.repo}@${x.tag}`;
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
      // release 沿用 lastSeen; practice 的 seen 由 fetch-practices.ts 写;
      // blogger 的 seen 由 fetch-blogs.ts 写; trending 在此成功后追加 trendingSeen。
      if (state) {
        if (isTrending(input)) {
          const seen = (state.raw.trendingSeen as string[] | undefined) ?? [];
          if (!seen.includes(input.repo)) seen.push(input.repo);
          state.raw.trendingSeen = seen;
        } else if (!isPractice(input) && !isBlogger(input)) {
          state.lastSeen[input.repo] = input.tag;
        }
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

// import.meta.main: 仅当作为入口直接运行才跑 main(); 被 backfill-broadcast.ts import 时不触发。
if (import.meta.main) await main();
