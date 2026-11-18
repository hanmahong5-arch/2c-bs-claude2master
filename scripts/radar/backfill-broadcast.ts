#!/usr/bin/env bun
/**
 * backfill-broadcast.ts — 给已有 changelog 条目补口播稿 (broadcast frontmatter).
 */

import { promises as fs } from "fs";
import path from "path";
import { callBroadcast, escapeYaml } from "./summarize";
import { CHANGELOG_DIR, DEFAULT_LIMIT, field } from "./tts-lib";

interface Candidate {
  file: string;
  raw: string;
  fm: string;
  publishedAt: string;
  hasBroadcast: boolean;
}

function extractBody(raw: string): string {
  const fmEnd = raw.indexOf("\n---", 3);
  const after = raw.slice(fmEnd + 4).replace(/^\r?\n/, "");
  const sepIdx = after.indexOf("\n---");
  return (sepIdx === -1 ? after : after.slice(0, sepIdx)).trim();
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const limIdx = argv.indexOf("--limit");
  const limit =
    limIdx >= 0 ? Number(argv[limIdx + 1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

  if (!process.env.NEWAPI_TRIAL_TOKEN) {
    console.error("[backfill] NEWAPI_TRIAL_TOKEN missing (见 重要信息.md)");
    process.exit(1);
  }

  let files: string[];
  try {
    files = await fs.readdir(CHANGELOG_DIR);
  } catch {
    console.error(`[backfill] changelog dir not found: ${CHANGELOG_DIR}`);
    process.exit(1);
  }

  const candidates: Candidate[] = [];
  for (const f of files) {
    if (!f.endsWith(".mdx") && !f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(CHANGELOG_DIR, f), "utf-8");
    if (!raw.startsWith("---")) continue;
    const end = raw.indexOf("\n---", 3);
    if (end === -1) continue;
    const fm = raw.slice(3, end);
    candidates.push({
      file: f,
      raw,
      fm,
      publishedAt: field(fm, "publishedAt"),
      hasBroadcast: /^broadcast:/m.test(fm),
    });
  }

  candidates.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
  const window = candidates.slice(0, limit);

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of window) {
    if (c.hasBroadcast) {
      skipped++;
      continue;
    }

    const title = field(c.fm, "title");
    const hook = field(c.fm, "hook");
    if (!hook) {
      console.error(`[backfill] SKIP ${c.file}: no hook field`);
      skipped++;
      continue;
    }
    const body = extractBody(c.raw);

    let broadcast: string;
    try {
      broadcast = await callBroadcast(title, hook, body || hook);
    } catch (e) {
      console.error(`[backfill] FAIL ${c.file}: ${(e as Error).message}`);
      failed++;
      continue;
    }

    const line = `broadcast: "${escapeYaml(broadcast)}"`;
    const updated = c.raw.replace(/^hook:.*$/m, (m) => `${m}\n${line}`);
    if (updated === c.raw) {
      console.error(`[backfill] FAIL ${c.file}: no hook: line to anchor`);
      failed++;
      continue;
    }

    if (dryRun) {
      console.log(`# ---- DRY RUN: ${c.file} ----\n${line}`);
    } else {
      await fs.writeFile(path.join(CHANGELOG_DIR, c.file), updated, "utf-8");
      console.error(`[backfill] wrote ${c.file}`);
    }
    written++;
  }

  console.error(
    `[backfill] done: ${written} written, ${skipped} skipped, ${failed} failed (window ${window.length}/${candidates.length})`,
  );
  if (failed > 0 && written === 0) process.exit(1);
}

await main();
