#!/usr/bin/env bun
/**
 * fetch-community.ts — 社区热议: HN 高分 AI 讨论 + Bluesky 头部从业者当日发言 (radar「💭 热议」段)
 *
 * 用法:
 *   bun run scripts/radar/fetch-community.ts            # 增量, JSON Lines 写 stdout, 更新 state
 *   bun run scripts/radar/fetch-community.ts --dry-run  # 只打印, 不更新 state
 *
 * 为什么是这两个源 (2026-09-23 实测):
 *   - X / Discord 官方 API 贵且爬取违反 ToS → 不碰 (owner 决策)
 *   - Reddit JSON / RSS 对数据中心 IP 403/429 → 不可用
 *   - HN Algolia + Firebase API: 公开免鉴权, 评论按站内排名给出 → 「一线开发者怎么看」
 *   - Bluesky public API: 免鉴权, 大量 AI 从业者已迁居 → 「大佬怎么说」
 *
 * 输出两种 community 条目 (summarize.ts 转中文 + 图谱):
 *   {"kind":"community","sub":"hn",   "title","url","discussUrl","points","numComments","comments":[{author,text}],"published_at"}
 *   {"kind":"community","sub":"voices","title","url","posts":[{author,handle,text,url,likes}],"published_at"}
 *
 * 聚合器口径: 只摘要 + 署名 + 原帖链接, 不整段转载。
 */

import { promises as fs } from "fs";
import path from "path";
import { decodeEntities } from "./html-extract";

const STATE_FILE = path.join(import.meta.dir, "state.json");
const UA = { "User-Agent": "claude2master-radar/1.0 (+https://claude2master.com; bot)" };

// ── HN ──
const HN_MIN_POINTS = Number(process.env.RADAR_HN_MIN_POINTS) || 200;
const HN_MAX_PER_RUN = 3;
const HN_TOP_COMMENTS = 14;
// 标题须命中 AI 主题 (HN 首页一半不是 AI): 模型/厂商/工具名 + 通用术语
const HN_AI_RE =
  /\b(AI|LLMs?|GPT[-\w.]*|ChatGPT|OpenAI|Anthropic|Claude|Gemini|DeepMind|DeepSeek|Qwen|Kimi|Mistral|Llama|Grok|xAI|Copilot|Cursor|Codex|agents?|agentic|MCP|RAG|transformers?|diffusion|inference|fine-?tun\w*|prompt\w*|vibe[- ]cod\w*|LangChain|Hugging ?Face|Ollama|vLLM)\b/i;

// ── Bluesky ──
// 2026-09-23 逐个探测: 近 14 天有 ≥3 条长帖的 AI 从业者 (karpathy / swyx / jeremyphoward 等已不活跃, 不收)
const BSKY_PEOPLE: { handle: string; name: string }[] = [
  { handle: "emollick.bsky.social", name: "Ethan Mollick" },
  { handle: "natolambert.bsky.social", name: "Nathan Lambert" },
  { handle: "simonwillison.net", name: "Simon Willison" },
  { handle: "timkellogg.me", name: "Tim Kellogg" },
  { handle: "dbreunig.bsky.social", name: "Drew Breunig" },
  { handle: "minimaxir.bsky.social", name: "Max Woolf" },
  { handle: "hardmaru.bsky.social", name: "David Ha (hardmaru)" },
  { handle: "mmitchell.bsky.social", name: "Margaret Mitchell" },
];
const BSKY_MIN_LEN = 100;
const BSKY_MAX_POSTS = 14;
const BSKY_MIN_POSTS = 3;

interface HnOut {
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

interface VoicesOut {
  kind: "community";
  sub: "voices";
  title: string;
  url: string;
  posts: { author: string; handle: string; text: string; url: string; likes: number }[];
  published_at: string;
}

async function getJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return (await resp.json()) as T;
}

function htmlToText(s: string): string {
  return decodeEntities(
    s
      .replace(/<p>/gi, "\n")
      .replace(/<a [^>]*href="([^"]+)"[^>]*>[^<]*<\/a>/gi, "$1")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ── HN: Algolia 找近 2 天高分 AI 故事 → Firebase 取按排名的顶层评论 ────────────
async function fetchHn(seen: Set<string>): Promise<HnOut[]> {
  const since = Math.floor(Date.now() / 1000) - 2 * 86400;
  const res = await getJson<{
    hits: { objectID: string; title: string; url: string | null; points: number; num_comments: number; created_at: string }[];
  }>(
    `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=200&numericFilters=points>${HN_MIN_POINTS},created_at_i>${since}`,
  );
  const candidates = res.hits
    .filter((h) => HN_AI_RE.test(h.title) && !seen.has(h.objectID) && h.num_comments >= 20)
    .sort((a, b) => b.points - a.points)
    .slice(0, HN_MAX_PER_RUN);

  const out: HnOut[] = [];
  for (const h of candidates) {
    try {
      const item = await getJson<{ kids?: number[] }>(
        `https://hacker-news.firebaseio.com/v0/item/${h.objectID}.json`,
      );
      const kids = (item.kids ?? []).slice(0, HN_TOP_COMMENTS * 2);
      const comments: { author: string; text: string }[] = [];
      for (const k of kids) {
        const c = await getJson<{ by?: string; text?: string; dead?: boolean; deleted?: boolean }>(
          `https://hacker-news.firebaseio.com/v0/item/${k}.json`,
        );
        if (!c || c.dead || c.deleted || !c.text || !c.by) continue;
        const text = htmlToText(c.text);
        if (text.length < 120) continue; // 「+1」「这个好」类短评没有信息量
        comments.push({ author: c.by, text: text.slice(0, 1200) });
        if (comments.length >= HN_TOP_COMMENTS) break;
      }
      if (comments.length < 4) {
        console.error(`[community] hn ${h.objectID}: only ${comments.length} substantive comments; skip`);
        continue;
      }
      out.push({
        kind: "community",
        sub: "hn",
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        discussUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        points: h.points,
        numComments: h.num_comments,
        comments,
        published_at: h.created_at.slice(0, 10),
      });
      console.error(`[community] hn ${h.objectID}: ${h.points} pts, ${comments.length} comments — ${h.title}`);
    } catch (err) {
      console.error(`[community] hn ${h.objectID}: FAIL ${(err as Error).message}`);
    }
  }
  return out;
}

// ── Bluesky: 头部从业者自上次以来的原创长帖 → 一期「今日大佬说」 ────────────────
interface BskyFeed {
  feed?: {
    reason?: unknown;
    post: {
      uri: string;
      likeCount?: number;
      record: { text?: string; createdAt?: string; reply?: unknown };
    };
  }[];
}

async function fetchVoices(sinceIso: string, today: string): Promise<VoicesOut | null> {
  const since = Date.parse(sinceIso) || Date.now() - 86400000;
  const posts: VoicesOut["posts"] = [];
  for (const p of BSKY_PEOPLE) {
    try {
      const d = await getJson<BskyFeed>(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${p.handle}&limit=30&filter=posts_no_replies`,
      );
      for (const x of d.feed ?? []) {
        if (x.reason || x.post.record.reply) continue; // 转发 / 回复不算本人观点
        const text = (x.post.record.text ?? "").trim();
        const at = Date.parse(x.post.record.createdAt ?? "");
        if (!(at > since) || text.length < BSKY_MIN_LEN) continue;
        const rkey = x.post.uri.split("/").pop();
        posts.push({
          author: p.name,
          handle: p.handle,
          text: text.slice(0, 900),
          url: `https://bsky.app/profile/${p.handle}/post/${rkey}`,
          likes: x.post.likeCount ?? 0,
        });
      }
    } catch (err) {
      console.error(`[community] bsky ${p.handle}: FAIL ${(err as Error).message}`);
    }
  }
  // 按热度取前 N, 但每人最多 3 条 (防一人刷屏)
  const perAuthor = new Map<string, number>();
  const picked = posts
    .sort((a, b) => b.likes - a.likes)
    .filter((p) => {
      const n = perAuthor.get(p.handle) ?? 0;
      if (n >= 3) return false;
      perAuthor.set(p.handle, n + 1);
      return true;
    })
    .slice(0, BSKY_MAX_POSTS);
  console.error(`[community] bsky: ${posts.length} candidate post(s), picked ${picked.length}`);
  if (picked.length < BSKY_MIN_POSTS) return null;
  return {
    kind: "community",
    sub: "voices",
    title: `今日大佬说 ${today}`,
    url: picked[0].url,
    posts: picked,
    published_at: today,
  };
}

interface StateShape {
  communitySeen?: { hn?: string[] };
  communityVoicesSince?: string;
  [k: string]: unknown;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const today = new Date().toISOString().slice(0, 10);
  const state = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as StateShape;
  const hnSeen = new Set(state.communitySeen?.hn ?? []);

  let emitted = 0;
  let failures = 0;
  try {
    for (const h of await fetchHn(hnSeen)) {
      process.stdout.write(JSON.stringify(h) + "\n");
      hnSeen.add(h.discussUrl.split("id=")[1]);
      emitted++;
    }
  } catch (err) {
    failures++;
    console.error(`[community] hn FAIL: ${(err as Error).message}`);
  }

  const nowIso = new Date().toISOString();
  const voices = await fetchVoices(state.communityVoicesSince ?? "", today);
  if (voices) {
    process.stdout.write(JSON.stringify(voices) + "\n");
    emitted++;
  }

  if (!dryRun) {
    // seen 只留最近 500 个 id, 防 state.json 无限增长
    state.communitySeen = { ...(state.communitySeen ?? {}), hn: [...hnSeen].slice(-500) };
    // 没凑够一期就不推进时间窗, 帖子留到下次一起出
    if (voices) state.communityVoicesSince = nowIso;
    const tmp = `${STATE_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2) + "\n", "utf-8");
    await fs.rename(tmp, STATE_FILE);
  }
  console.error(`[community] done: ${emitted} item(s)`);
  if (failures > 0 && emitted === 0 && !voices) process.exit(1);
}

await main();
