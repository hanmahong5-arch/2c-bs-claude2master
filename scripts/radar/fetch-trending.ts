#!/usr/bin/env bun
/**
 * fetch-trending.ts — 发现"近期新建 + 高星"的热门 GitHub 项目(trending 代理)
 */

import { promises as fs } from "fs";
import path from "path";
import { radarFetchJson } from "../../src/infra/radar-http";

const SCRIPT_DIR = import.meta.dir;
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");

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

const CREATED_WINDOW_DAYS = 30;
const RUST_GO_MIN_STARS = 400;
const VIRAL_MIN_STARS = 2000;
const PER_BUCKET = 8;
const MAX_PER_RUN = 5;

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
  const resp = await radarFetchJson<{ items?: RepoItem[] }>(url, { headers });
  if (!resp.ok) {
    console.error(`[trending] search ${resp.status} for q="${q}"`);
    return [];
  }
  return resp.data?.items ?? [];
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
