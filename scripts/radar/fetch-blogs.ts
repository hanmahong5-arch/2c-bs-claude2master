#!/usr/bin/env bun
/**
 * fetch-blogs.ts — 抓头部博主每日发文, 归一化为 feed-item (radar「💬 观点」段)
 *
 * 用法:
 *   bun run scripts/radar/fetch-blogs.ts
 *   bun run scripts/radar/fetch-blogs.ts --dry-run
 */

import { promises as fs } from "fs";
import path from "path";
import { fetchSource } from "./fetch-blogs-adapters";
import {
  TODAY,
  daysBetween,
  parseBlogsYaml,
  type BloggerOut,
  type FeedItem,
} from "./fetch-blogs-parser";

const SCRIPT_DIR = import.meta.dir;
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");
const BLOGS_FILE = path.join(SCRIPT_DIR, "blogs.yaml");

const MAX_AGE_DAYS = Math.max(
  1,
  Number(process.env.RADAR_BLOG_MAX_AGE_DAYS) || 30,
);

interface StateShape {
  blogsSeen: Record<string, string[]>;
  blogsLastPolled: Record<string, string>;
  [k: string]: unknown;
}

async function loadState(): Promise<StateShape> {
  const raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as Record<
    string,
    unknown
  >;
  return {
    ...raw,
    blogsSeen: (raw.blogsSeen as Record<string, string[]>) ?? {},
    blogsLastPolled: (raw.blogsLastPolled as Record<string, string>) ?? {},
  } as StateShape;
}

async function saveState(state: StateShape): Promise<void> {
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, STATE_FILE);
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");

  const yamlRaw = await fs.readFile(BLOGS_FILE, "utf-8");
  const sources = parseBlogsYaml(yamlRaw);
  const state = await loadState();

  let okCount = 0;
  let failCount = 0;
  let attemptCount = 0;

  for (const src of sources) {
    const lastPoll = state.blogsLastPolled[src.handle] ?? "";
    if (daysBetween(lastPoll, TODAY) < src.pollDays) {
      console.error(
        `[blogs] skip ${src.handle} (polled ${lastPoll}, < ${src.pollDays}d)`,
      );
      continue;
    }

    if (!state.blogsSeen[src.handle]) state.blogsSeen[src.handle] = [];
    const seen = new Set(state.blogsSeen[src.handle]);

    attemptCount++;
    let items: FeedItem[];
    try {
      items = await fetchSource(src, seen);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[blogs] FAIL ${src.handle} (${src.type}): ${msg}`);
      failCount++;
      continue;
    }

    const stale = items.filter(
      (it) => daysBetween(it.published_at, TODAY) > MAX_AGE_DAYS,
    );
    for (const it of stale) {
      state.blogsSeen[src.handle].push(it.url);
      console.error(
        `[blogs] ${src.handle}: too old (${it.published_at}), mark seen: ${it.url}`,
      );
    }
    items = items.filter(
      (it) => daysBetween(it.published_at, TODAY) <= MAX_AGE_DAYS,
    );

    console.error(`[blogs] ${src.handle}: ${items.length} new`);
    for (const it of items) {
      const out: BloggerOut = {
        kind: "blogger",
        author: src.author,
        handle: src.handle,
        url: it.url,
        title: it.title,
        body: it.body,
        published_at: it.published_at,
      };
      process.stdout.write(JSON.stringify(out) + "\n");
      state.blogsSeen[src.handle].push(it.url);
      okCount++;
    }

    state.blogsLastPolled[src.handle] = TODAY;
  }

  if (!dryRun) await saveState(state);

  console.error(
    `[blogs] done: ${okCount} new, ${failCount} failed, ${attemptCount} source(s) attempted`,
  );
  if (
    failCount > 0 &&
    okCount === 0 &&
    attemptCount > 0 &&
    failCount === attemptCount
  ) {
    process.exit(1);
  }
}

await main();
