#!/usr/bin/env bun
/**
 * fetch-trending.ts — 发现"近期新建 + 高星"的热门 GitHub 项目(trending 代理)
 *
 * 为什么不扒 github.com/trending: 它无官方 API、只能爬 HTML(脆弱)。改用 GitHub
 * Search API(官方、结构化、契约稳定),按"创建时间窗口 + star 阈值 + 语言"分桶取热门:
 *   - Rust / Go: 中等 star 阈值(重点关注的技术栈)
 *   - 任意语言: 高 star 阈值("火得过分"的跨栈项目)
 *
 * 输出: stdout, JSON Lines, 每行一条(kind:"trending"), 喂给 summarize.ts:
 *   {"kind":"trending","repo":"owner/name","name":"name","description":"...",
 *    "language":"Rust","stars":1234,"html_url":"...","published_at":"YYYY-MM-DD"}
 *
 * 去重: 排除已追踪的 8 个工具仓库 + state.json.trendingSeen(已发布过的);
 *       trendingSeen 由 summarize.ts 在成功发布后追加(失败不标记, 下次可重试)。
 *
 * env: GITHUB_TOKEN(可选; 提供则 30req/min, 否则匿名 10req/min — 本脚本仅 3 次请求)
 */

import { promises as fs } from "fs";
import path from "path";

const SCRIPT_DIR = import.meta.dir;
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");

// 与 fetch-releases.sh REPOS / src/lib/tools.ts TOOLS 一致 —— 已单独追踪, 不重复进 trending。
const TRACKED_REPOS = new Set([
  "anthropics/claude-code",
  "openai/codex",
  "google-gemini/gemini-cli",
  "Aider-AI/aider",
  "cline/cline",
  "block/goose",
  "sst/opencode",
  "RooCodeInc/Roo-Code",
]);

// ── 可调参数(改这里即调收录口径)────────────────────────────────
const CREATED_WINDOW_DAYS = 30; // 只看近 N 天内新建的仓库(聚焦"新冒头")
const RUST_GO_MIN_STARS = 400; // Rust/Go 桶的 star 阈值
const VIRAL_MIN_STARS = 2000; // 跨栈"火得过分"桶的 star 阈值
const PER_BUCKET = 8; // 每桶取前 N(按 star 降序)
const MAX_PER_RUN = 5; // 每次运行最多产出 N 条(控成本 + 控噪音)

interface RepoItem {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

async function search(q: string): Promise<RepoItem[]> {
  const url =
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}` +
    `&sort=stars&order=desc&per_page=${PER_BUCKET}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    console.error(`[trending] search ${resp.status} for q="${q}"`);
    return [];
  }
  const json = (await resp.json()) as { items?: RepoItem[] };
  return json.items ?? [];
}

async function loadTrendingSeen(): Promise<Set<string>> {
  try {
    const raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as {
      trendingSeen?: string[];
    };
    return new Set(raw.trendingSeen ?? []);
  } catch {
    return new Set();
  }
}

async function main(): Promise<void> {
  const cutoff = daysAgoISO(CREATED_WINDOW_DAYS);
  const seen = await loadTrendingSeen();

  const queries = [
    `language:rust created:>${cutoff} stars:>${RUST_GO_MIN_STARS}`,
    `language:go created:>${cutoff} stars:>${RUST_GO_MIN_STARS}`,
    `created:>${cutoff} stars:>${VIRAL_MIN_STARS}`,
  ];

  // 跨桶去重: 同一仓库保留 star 更高的那条。
  const byRepo = new Map<string, RepoItem>();
  for (const q of queries) {
    for (const r of await search(q)) {
      if (!r || r.fork || r.archived) continue;
      if (!r.language) continue;
      if (!r.description || !r.description.trim()) continue;
      if (TRACKED_REPOS.has(r.full_name)) continue;
      if (seen.has(r.full_name)) continue;
      const prev = byRepo.get(r.full_name);
      if (!prev || r.stargazers_count > prev.stargazers_count) {
        byRepo.set(r.full_name, r);
      }
    }
  }

  const picks = [...byRepo.values()]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, MAX_PER_RUN);

  const today = new Date().toISOString().slice(0, 10);
  for (const r of picks) {
    const name = r.full_name.split("/")[1] ?? r.full_name;
    process.stdout.write(
      JSON.stringify({
        kind: "trending",
        repo: r.full_name,
        name,
        description: r.description ?? "",
        language: r.language ?? "",
        stars: r.stargazers_count,
        html_url: r.html_url,
        published_at: today,
      }) + "\n",
    );
  }

  console.error(
    `[trending] emitted ${picks.length} (cutoff ${cutoff}, ${byRepo.size} candidates after filter)`,
  );
}

await main();
