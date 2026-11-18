#!/usr/bin/env bun
/**
 * summarize.ts — 把 GitHub release notes 用 LLM 转中文摘要 + 写 MDX
 *
 * 用法:
 *   echo '<json>' | bun run scripts/radar/summarize.ts
 *   bun run scripts/radar/summarize.ts --release-url <url>
 *   bun run scripts/radar/summarize.ts --dry-run
 */

import { promises as fs } from "fs";
import path from "path";
import {
  callBroadcast,
  callCommentary,
  callLLM,
  callNewapi,
  fetchReleaseFromUrl,
} from "./summarize-llm";
import { buildMdx } from "./summarize-mdx";
import { BROADCAST_SYSTEM_PROMPT } from "./summarize-prompts";
import {
  deriveSlug,
  escapeYaml,
  inputLabel,
  isBlogger,
  isPractice,
  isTrending,
  titleLineFor,
  type Input,
} from "./summarize-types";

export { BROADCAST_SYSTEM_PROMPT, callBroadcast, callNewapi, escapeYaml };

const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");

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
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(raw, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, STATE_FILE);
}

async function processInput(
  input: Input,
  opts: { dryRun: boolean },
): Promise<{ slug: string; path: string }> {
  const summary = await callLLM(input);
  const insight =
    isTrending(input) || isBlogger(input)
      ? ""
      : await callCommentary(input, summary);
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const urlIdx = argv.indexOf("--release-url");
  const singleUrl = urlIdx >= 0 ? argv[urlIdx + 1] : undefined;

  const inputs: Input[] = singleUrl
    ? [await fetchReleaseFromUrl(singleUrl)]
    : await readStdinInputs();

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

if (import.meta.main) await main();
