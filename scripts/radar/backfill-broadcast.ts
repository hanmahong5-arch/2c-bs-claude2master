#!/usr/bin/env bun
/**
 * backfill-broadcast.ts — 给已有 changelog 条目补口播稿 (broadcast frontmatter).
 *
 * 二期上线前一次性把历史条目补上 broadcast, 使其语音播报走口播稿而非裸 hook.
 * 新条目由 summarize.ts 在写入时即带 broadcast → 本脚本只服务存量, 不进 cron。
 *
 * 用法:
 *   NEWAPI_TRIAL_TOKEN=... bun run scripts/radar/backfill-broadcast.ts            # 最新 80 条 (音频滚动窗口)
 *   NEWAPI_TRIAL_TOKEN=... bun run scripts/radar/backfill-broadcast.ts --limit 15 # 自定条数
 *   NEWAPI_TRIAL_TOKEN=... bun run scripts/radar/backfill-broadcast.ts --dry-run  # 只打印不写文件
 *
 * 幂等: 已含 `broadcast:` 行的条目跳过; 重跑等价。只在 `hook:` 行后插一行, 余字节原样保留历史。
 *
 * env: NEWAPI_TRIAL_TOKEN — newapi.lurus.cn API key (见 重要信息.md)
 */

import { promises as fs } from "fs";
import path from "path";
import { callBroadcast, escapeYaml } from "./summarize";
import { CHANGELOG_DIR, DEFAULT_LIMIT, field } from "./tts-lib";

interface Candidate {
  file: string;
  raw: string;
  fm: string; // frontmatter 内文 (--- 与 \n--- 之间)
  publishedAt: string;
  hasBroadcast: boolean;
}

// frontmatter 之后、footer 分隔线 (--- 前) 的正文 → 与 summarize 的 summary.body 同口径。
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

  // 最新 N (date-desc, 与 tts 音频滚动窗口一致)
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

    // 紧跟 hook: 行插入 broadcast: 行 (函数式 replace → 不让 broadcast 里的 $ 触发替换语义)
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
