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
 *   RADAR_MODEL_ID     — default deepseek-chat (稳定别名, 不随版本号轮换 → 渠道升级后不会撞 model-not-available)
 */

import { promises as fs } from "fs";
import path from "path";
import { sanitizeGraph, type ArticleGraph } from "../../src/lib/graph";

// Bun 原生, 跨平台 (旧 URL.pathname 写法在 Linux CI 退化成相对路径 → ENOENT)
const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const GRAPH_DIR = path.join(ROOT, "src", "content", "graph");
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");

const NEWAPI_BASE_URL =
  process.env.NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
const MODEL_ID = process.env.RADAR_MODEL_ID ?? "deepseek-chat";
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

const HN_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的一条 Hacker News 高分讨论（标题 + 按站内排名的顶层评论），提炼「一线开发者怎么看」，输出严格 JSON：

{
  "hook": "30 字内中文钩子：社区整体风向 + 最尖锐的一个点",
  "body": "280 字内中文 markdown：第一行「**整体风向**：一句话」；随后 3–4 个 bullet，每个 = 一个讨论焦点，写成「焦点：**@评论者用户名** 的代表性观点（中文转述）——一句对开发者的含义」；最后一个 bullet 必须写反对 / 质疑 / 分歧意见",
  "tags": ["最多 4 个英文 kebab-case"]
}

强约束：
- 观点只能来自给出的评论，用户名逐字保留，不编造、不张冠李戴
- 中文转述，不大段直译原评论
- 不喊口号、不堆 emoji
- 输出必须是合法 JSON，无任何前后说明文字`;

const VOICES_SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。读用户给的一组 AI 领域知名从业者今天在 Bluesky 上的原创帖子，整理成「今日大佬说」，输出严格 JSON：

{
  "hook": "30 字内中文钩子：今天大佬们最集中在聊什么",
  "body": "300 字内中文 markdown：按话题归为 2–4 组，每组一行「### 话题名」后跟 bullet，每个 bullet 写「**人名**：观点的中文转述（≤60 字）」；同一话题下不同人的观点对照着写",
  "tags": ["最多 4 个英文 kebab-case"]
}

强约束：
- 观点只能来自给出的帖子，人名逐字保留，不编造、不张冠李戴
- 中文转述，不直译全文；帖子是玩笑 / 反讽时如实点明
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

// 知识图谱抽取: 详情页动效思维导图 / 流程图 + 全站概念图 (/graph) 的数据源。
// 改动必须 commit 留 diff, 别 patch.
export const GRAPH_SYSTEM_PROMPT = `你是 claude2master.com 的知识图谱编辑。读用户给的文章（原文或摘要），把它拆成一张「看一眼就懂」的思维导图 + 实体关系，输出严格 JSON：

{
  "center": "≤14 字，文章核心主题（中文为主，产品/模型名保留英文原名）",
  "branches": [
    { "label": "≤7 字要点名", "detail": "≤40 字一句话讲清这个要点", "children": ["≤18 字的具体细节/例子/数字", "..."] }
  ],
  "flow": ["≤10 字步骤", "..."],
  "entities": [ { "name": "实体名", "type": "company|product|model|person|concept|technique" } ],
  "relations": [ { "from": "实体名", "to": "实体名", "label": "≤5 字关系动词" } ]
}

硬约束：
1. branches 3–5 个，按「读者最该先知道」排序；每个 children 0–3 条，写具体事实而非空话
2. flow 仅当文章描述了一个流程 / 方法步骤 / 架构数据流时填 3–6 步，否则必须是空数组 []
3. entities 3–8 个：公司、产品、模型、人名一律保留英文原名（如 LangGraph、Claude Code、GPT-5、Andrej Karpathy）；概念用业内通行说法（如 RAG、MCP、上下文工程）
4. relations 0–6 条，from / to 必须逐字来自 entities 的 name
5. 字数上限是硬约束（英文单词约算半个字），宁短勿长，超长会被截断
6. 只用文章明确出现的信息，不引申、不脑补、不喊口号、不堆 emoji
7. 输出必须是合法 JSON，无任何前后说明文字`;

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
  /** blogs.yaml category: lab / company / person; 缺省 person (旧 feed-item 兼容) */
  category?: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

interface HnCommunityInput {
  kind: "community";
  sub: "hn";
  title: string;
  url: string;
  discussUrl: string;
  points: number;
  numComments: number;
  comments: { author: string; text: string }[];
  published_at: string;
}

interface VoicesCommunityInput {
  kind: "community";
  sub: "voices";
  title: string;
  url: string;
  posts: { author: string; handle: string; text: string; url: string; likes: number }[];
  published_at: string;
}

type CommunityInput = HnCommunityInput | VoicesCommunityInput;

type Input = ReleaseInput | PracticeInput | TrendingInput | BloggerInput | CommunityInput;

function isCommunity(x: Input): x is CommunityInput {
  return (x as CommunityInput).kind === "community";
}

function communityText(x: CommunityInput): string {
  return x.sub === "hn"
    ? x.comments.map((c, i) => `[${i + 1}] @${c.author}: ${c.text}`).join("\n\n")
    : x.posts.map((p) => `【${p.author}】(${p.likes} likes)\n${p.text}`).join("\n\n");
}

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
  if (isCommunity(input)) {
    if (input.sub === "voices") return `${date}-voices`;
    const id = input.discussUrl.split("id=")[1] ?? "0";
    const titleSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .split("-")
      .slice(0, 6)
      .join("-");
    return `${date}-hn-${id}-${titleSlug || "thread"}`;
  }
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
  const sysPrompt = isCommunity(input)
    ? input.sub === "hn"
      ? HN_SYSTEM_PROMPT
      : VOICES_SYSTEM_PROMPT
    : isPractice(input)
      ? PRACTICE_SYSTEM_PROMPT
      : isTrending(input)
        ? TRENDING_SYSTEM_PROMPT
        : isBlogger(input)
          ? BLOGGER_SYSTEM_PROMPT
          : RELEASE_SYSTEM_PROMPT;

  let userContent: string;
  if (isCommunity(input)) {
    userContent =
      input.sub === "hn"
        ? `Hacker News thread: ${input.title}
Link: ${input.url}
Points: ${input.points} · Comments: ${input.numComments}

Top-level comments (in HN ranking order):
${communityText(input).slice(0, 9000)}`
        : `Posts from AI practitioners on Bluesky (${input.published_at}):

${communityText(input).slice(0, 9000)}`;
  } else if (isPractice(input)) {
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
  if (isCommunity(input)) {
    return input.sub === "hn" ? `Hacker News 热议：${input.title}` : input.title;
  }
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

// 图谱: 第三次 LLM 调用。正文优先喂原文 (信息密度高), 无原文 (trending/backfill) 退摘要。
// 返回已 sanitize 的图谱; 骨架不成立抛错 → 调用方跳过 (图谱是增强, 不阻塞文章)。
export async function callGraph(
  titleLine: string,
  sourceText: string,
): Promise<ArticleGraph> {
  const userContent = `文章标题：${titleLine}

正文（截断至 ~8KB）：
${sourceText.slice(0, 8000) || "(empty)"}`;
  const content = await callNewapi(GRAPH_SYSTEM_PROMPT, userContent, 1200);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`graph LLM did not return valid JSON: ${content.slice(0, 200)}`);
  }
  const g = sanitizeGraph(parsed);
  if (!g) throw new Error(`graph skeleton invalid: ${content.slice(0, 200)}`);
  return g;
}

export async function writeGraph(slug: string, g: ArticleGraph): Promise<string> {
  await fs.mkdir(GRAPH_DIR, { recursive: true });
  const p = path.join(GRAPH_DIR, `${slug}.json`);
  await fs.writeFile(p, JSON.stringify(g, null, 2) + "\n", "utf-8");
  return p;
}

// 图谱输入正文: 有原文用原文, 否则用中文摘要 (release notes 本身即原文)。
function graphSourceFor(input: Input, summary: SummaryOutput): string {
  // 社区讨论: 用中文摘要 (已按焦点归纳 + 署名) 打头, 再补原评论供抽实体
  if (isCommunity(input)) return `${summary.hook}\n\n${summary.body}\n\n${communityText(input)}`;
  if (isPractice(input) || isBlogger(input)) {
    return input.body && input.body.length > 400
      ? input.body
      : `${summary.hook}\n\n${summary.body}\n\n${input.body ?? ""}`;
  }
  if (isTrending(input)) return `${input.description}\n\n${summary.hook}\n\n${summary.body}`;
  return `${input.body ?? ""}\n\n${summary.body}`;
}

// 标题尾巴: hook 去掉破折号/冒号后的补充语, 截 40 字 (按字素, 不切断英文单词)。
// 注: 不再把 "-" 当分隔符 —— 旧正则会把 "GPT-5 ..." 截成 "GPT"。
export function hookCore(hook: string): string {
  const s = hook.replace(/\s[-–]\s.*$|[—:：].*$/, "").trim();
  const chars = [...s];
  if (chars.length <= 40) return s;
  let cut = chars.slice(0, 40).join("");
  if (/[A-Za-z0-9]$/.test(cut) && /^[A-Za-z0-9]/.test(chars[40])) {
    cut = cut.replace(/[A-Za-z0-9._+-]+$/, "");
  }
  return cut.replace(/[\s，,、；;]+$/, "");
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

  if (isCommunity(input)) {
    const isHn = input.sub === "hn";
    const title = isHn
      ? `HN 热议：${input.title} — ${hookCore(summary.hook)}`
      : `今日大佬说 ${input.published_at} — ${hookCore(summary.hook)}`;
    const source = isHn ? "Hacker News" : "Bluesky";
    const footer = isHn
      ? `> 讨论原帖：[${input.title}](${input.discussUrl}) · 🔥 ${input.points} 分 · 💬 ${input.numComments} 条评论${
          input.url !== input.discussUrl ? ` · 原文：[链接](${input.url})` : ""
        }`
      : `> 原帖：${input.posts.map((p) => `[${p.author}](${p.url})`).join(" · ")}`;
    // 聚合器口径: 中文转述 + 署名 + 原帖链接, 不转载评论全文
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: "${source}"
sourceUrl: ${isHn ? input.discussUrl : input.url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: community
author: "${isHn ? "Hacker News 社区" : "AI 从业者"}"
category: community
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
tags: ${tagsArr}
---

${summary.body}

---

${footer}
`;
  }

  if (isBlogger(input)) {
    const titleCore = hookCore(summary.hook);
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
category: ${input.category === "lab" || input.category === "company" || input.category === "community" ? input.category : "person"}
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
    const titleCore = hookCore(summary.hook);
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
    const titleCore = hookCore(summary.hook);
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
  const title = `${release.repo.split("/")[1]} ${release.tag} — ${hookCore(summary.hook)}`;
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
    isTrending(input) || isBlogger(input) || isCommunity(input)
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
  // 知识图谱: trending 仅有一行仓库描述, 抽不出有信息量的图 → 跳过。失败同样不阻塞。
  let graph: ArticleGraph | null = null;
  if (!isTrending(input)) {
    try {
      graph = await callGraph(titleLineFor(input), graphSourceFor(input, summary));
    } catch (e) {
      console.error(
        `[radar] graph skipped for ${inputLabel(input)} (${(e as Error).message})`,
      );
    }
  }
  const slug = deriveSlug(input);
  const mdx = buildMdx(input, summary, insight, broadcast, slug);
  const filePath = path.join(CHANGELOG_DIR, `${slug}.mdx`);
  if (opts.dryRun) {
    console.log(`# ---- DRY RUN: ${filePath} ----`);
    console.log(mdx);
    if (graph) console.log(`# ---- graph ----\n${JSON.stringify(graph, null, 2)}`);
    return { slug, path: filePath };
  }
  await fs.mkdir(CHANGELOG_DIR, { recursive: true });
  await fs.writeFile(filePath, mdx, "utf-8");
  console.error(`[radar] wrote ${path.relative(ROOT, filePath)}`);
  if (graph) {
    const gp = await writeGraph(slug, graph);
    console.error(`[radar] wrote ${path.relative(ROOT, gp)}`);
  }
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
  if (isCommunity(x)) return `community:${x.sub}@${x.sub === "hn" ? x.discussUrl : x.published_at}`;
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

  // 并发池: 每条 3–4 次串行 LLM 调用 (~15–20s), 扩源后单批 30+ 条串行会顶穿 CI 时限。
  // state 只在内存里改 (JS 单线程, await 之间无竞态), 全部结束后一次落盘。
  const CONCURRENCY = Math.max(1, Number(process.env.RADAR_CONCURRENCY) || 4);
  let cursor = 0;
  const worker = async () => {
    while (cursor < inputs.length) {
      const input = inputs[cursor++];
      await processOne(input);
    }
  };
  const processOne = async (input: Input) => {
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
        } else if (!isPractice(input) && !isBlogger(input) && !isCommunity(input)) {
          state.lastSeen[input.repo] = input.tag;
        }
      }
      okCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ id, err: msg });
      console.error(`[radar] FAIL ${id}: ${msg}`);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, inputs.length) }, worker),
  );

  if (state) await saveState(state.raw, state.lastSeen);

  console.error(
    `[radar] done: ${okCount} ok, ${errors.length} failed, ${inputs.length} total`,
  );
  if (errors.length > 0 && okCount === 0) process.exit(1);
}

// import.meta.main: 仅当作为入口直接运行才跑 main(); 被 backfill-broadcast.ts import 时不触发。
if (import.meta.main) await main();
