#!/usr/bin/env bun
/**
 * digest-draft.ts — 把过去 7 天 changelog 综合成一份 weekly digest 草稿
 *
 * 用法:
 *   bun run scripts/radar/digest-draft.ts
 *   bun run scripts/radar/digest-draft.ts --dry-run
 *   bun run scripts/radar/digest-draft.ts --week-of 2026-05-26
 *   bun run scripts/radar/digest-draft.ts --since 7
 */

import { promises as fs } from "fs";
import path from "path";
import {
  buildLLMInput,
  buildMdx,
  callLLM,
  isoWeek,
  mondayOf,
  parseFrontmatter,
  type ChangelogSnapshot,
} from "./digest-draft-lib";

const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const DIGEST_DIR = path.join(ROOT, "src", "content", "digest");

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

  let alreadyExists = false;
  if (!dryRun) {
    try {
      await fs.access(outPath);
      alreadyExists = true;
    } catch {
      alreadyExists = false;
    }
  }
  if (alreadyExists) {
    console.error(
      `[digest] ${path.relative(ROOT, outPath)} already exists; skipping LLM call`,
    );
    return;
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
