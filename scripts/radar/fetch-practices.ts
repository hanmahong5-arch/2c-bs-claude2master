#!/usr/bin/env bun
/**
 * fetch-practices.ts — 抓 Anthropic Engineering / Claude Code docs / OpenAI Codex blog
 *
 * 用法:
 *   bun run scripts/radar/fetch-practices.ts
 *   bun run scripts/radar/fetch-practices.ts --dry-run
 */

import { promises as fs } from "fs";
import path from "path";
import { radarFetchText } from "../../src/infra/radar-http";
import {
  TODAY,
  daysBetween,
  extractMain,
  extractPublishedAt,
  extractSitemapLocs,
  parseSourcesYaml,
  type PracticeOut,
  type Source,
} from "./fetch-practices-parser";

const SCRIPT_DIR = import.meta.dir;
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");
const SOURCES_FILE = path.join(SCRIPT_DIR, "sources.yaml");

const MAX_ITEMS_PER_SOURCE = Math.max(
  1,
  Number(process.env.RADAR_PRACTICE_MAX) || 6,
);

const PRACTICE_HEADERS = {
  "User-Agent": "claude2master-radar/1.0 (+https://claude2master.com; bot)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
};

async function fetchPracticePage(
  url: string,
): Promise<{ title: string; body: string; published_at: string }> {
  const html = await radarFetchText(url, PRACTICE_HEADERS);
  const { title, body } = extractMain(html);
  if (!title) throw new Error(`no title extracted from ${url}`);
  if (body.length < 500) {
    throw new Error(`body too short (${body.length} chars) for ${url}`);
  }
  const published_at = extractPublishedAt(html);
  return { title, body: body.slice(0, 8000), published_at };
}

interface StateShape {
  lastSeen: Record<string, string>;
  practicesSeen: Record<string, string[]>;
  practicesLastPolled: Record<string, string>;
  [k: string]: unknown;
}

async function loadState(): Promise<StateShape> {
  const raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as Record<
    string,
    unknown
  >;
  return {
    ...raw,
    lastSeen: (raw.lastSeen as Record<string, string>) ?? {},
    practicesSeen: (raw.practicesSeen as Record<string, string[]>) ?? {},
    practicesLastPolled:
      (raw.practicesLastPolled as Record<string, string>) ?? {},
  } as StateShape;
}

async function saveState(state: StateShape): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

async function discoverUrls(source: Source): Promise<string[]> {
  if (source.kind === "url") return source.urls;
  const xml = await radarFetchText(source.url, PRACTICE_HEADERS);
  return extractSitemapLocs(xml).filter((u) => u.startsWith(source.urlPrefix));
}

async function runUrlsMode(entries: string[]): Promise<void> {
  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const eq = entry.indexOf("=");
    const label = eq > 0 ? entry.slice(0, eq) : "anthropic-engineering";
    const url = eq > 0 ? entry.slice(eq + 1) : entry;
    try {
      const { title, body, published_at } = await fetchPracticePage(url);
      const out: PracticeOut = {
        kind: "practice",
        label,
        url,
        title,
        body,
        published_at,
      };
      process.stdout.write(JSON.stringify(out) + "\n");
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[practices] FAIL ${url}: ${msg}`);
      fail++;
    }
  }
  console.error(`[practices] urls-mode done: ${ok} ok, ${fail} failed`);
  if (fail > 0 && ok === 0) process.exit(1);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");

  const urlsIdx = argv.indexOf("--urls");
  if (urlsIdx >= 0) {
    const entries = argv
      .slice(urlsIdx + 1)
      .filter((a) => !a.startsWith("--"))
      .flatMap((a) => a.split(","))
      .map((a) => a.trim())
      .filter(Boolean);
    await runUrlsMode(entries);
    return;
  }

  const yamlRaw = await fs.readFile(SOURCES_FILE, "utf-8");
  const sources = parseSourcesYaml(yamlRaw);
  const state = await loadState();

  let okCount = 0;
  let failCount = 0;
  let attemptCount = 0;

  for (const src of sources) {
    const lastPoll = state.practicesLastPolled[src.label] ?? "";
    if (daysBetween(lastPoll, TODAY) < src.pollDays) {
      console.error(
        `[practices] skip ${src.label} (polled ${lastPoll}, < ${src.pollDays}d)`,
      );
      continue;
    }

    let urls: string[];
    try {
      urls = await discoverUrls(src);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[practices] FAIL discover ${src.label}: ${msg}`);
      failCount++;
      continue;
    }

    if (!state.practicesSeen[src.label]) state.practicesSeen[src.label] = [];
    const seen = new Set(state.practicesSeen[src.label]);
    const fresh = urls.filter((u) => !seen.has(u));
    const capped = fresh.slice(0, MAX_ITEMS_PER_SOURCE);
    const deferred = fresh.length - capped.length;
    console.error(
      `[practices] ${src.label}: ${urls.length} total, ${fresh.length} new, 本轮抓 ${capped.length}` +
        (deferred > 0 ? ` (剩 ${deferred} 篇下轮继续)` : ""),
    );

    for (const url of capped) {
      attemptCount++;
      try {
        const { title, body, published_at } = await fetchPracticePage(url);
        const out: PracticeOut = {
          kind: "practice",
          label: src.label,
          url,
          title,
          body,
          published_at,
        };
        process.stdout.write(JSON.stringify(out) + "\n");
        state.practicesSeen[src.label].push(url);
        okCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[practices] FAIL ${url}: ${msg}`);
        failCount++;
      }
    }

    state.practicesLastPolled[src.label] = TODAY;
  }

  if (!dryRun) await saveState(state);

  console.error(
    `[practices] done: ${okCount} new, ${failCount} failed, ${attemptCount} attempted`,
  );
  if (failCount > 0 && okCount === 0 && attemptCount > 0) process.exit(1);
}

await main();
