#!/usr/bin/env bun
/**
 * tts-generate-cosy.ts — 用本地自托管 CosyVoice2-0.5B 生成带情感的播报音频。
 */

import { promises as fs } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { radarCheckHealth, radarPostBinary } from "../../src/infra/radar-http";
import { toolForSource } from "../../src/lib/tools";
import {
  AUDIO_DIR,
  DEFAULT_LIMIT,
  MANIFEST,
  cleanForTts,
  endEn,
  endZh,
  englishPart,
  enProse,
  exists,
  loadItems,
  prune,
  type Item,
} from "./tts-lib";

const SCRIPT_DIR = import.meta.dir;
const COSY_URL = process.env.COSY_URL ?? "http://localhost:8123";
const COSY_API_KEY = process.env.COSY_API_KEY ?? "";

const ZH_INSTRUCT =
  "用专业、热情的新闻主播语气播报，吐字清晰、节奏明快、富有感染力。";
const EN_INSTRUCT =
  "Read in a professional, upbeat news-anchor tone, clear and energetic.";

interface ManifestEntry {
  slug: string;
  zh: boolean;
  en: boolean;
  title: string;
  kind: string;
  author: string | null;
  source: string | null;
  tool: string | null;
  publishedAt: string;
}

async function cosyHealthy(): Promise<boolean> {
  return await radarCheckHealth(`${COSY_URL}/healthz`, 3000);
}

async function synthCosy(
  text: string,
  lang: "zh" | "en",
  instruct: string,
  outPath: string,
): Promise<void> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (COSY_API_KEY) headers.Authorization = `Bearer ${COSY_API_KEY}`;
  const bytes = await radarPostBinary(
    `${COSY_URL}/tts`,
    { text, lang, instruct },
    headers,
    120_000,
  );
  if (bytes.length === 0) throw new Error("empty audio");
  await fs.writeFile(outPath, Buffer.from(bytes));
}

function manifestEntry(item: Item, zh: boolean, en: boolean): ManifestEntry {
  return {
    slug: item.slug,
    zh,
    en,
    title: item.title,
    kind: item.kind,
    author: item.author || null,
    source: item.source || null,
    tool: item.source ? (toolForSource(item.source)?.key ?? null) : null,
    publishedAt: item.publishedAt,
  };
}

async function fallbackToEdge(argv: string[]): Promise<never> {
  console.error(
    `[cosy] ${COSY_URL}/healthz unreachable → fallback to edge-tts (tts-generate.ts)`,
  );
  const r = spawnSync(
    "bun",
    ["run", path.join(SCRIPT_DIR, "tts-generate.ts"), ...argv],
    { stdio: "inherit" },
  );
  process.exit(r.status ?? 1);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const limIdx = argv.indexOf("--limit");
  const limit =
    limIdx >= 0 ? Number(argv[limIdx + 1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

  if (!(await cosyHealthy())) {
    await fallbackToEdge(argv);
  }

  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const all = await loadItems();
  const keep = all.slice(0, limit);
  const keepSlugs = new Set(keep.map((i) => i.slug));

  const pruned = await prune(AUDIO_DIR, keepSlugs);

  let made = 0;
  let failed = 0;
  let attempted = 0;
  const manifest: ManifestEntry[] = [];

  for (const item of keep) {
    const zhPath = path.join(AUDIO_DIR, `${item.slug}.zh.mp3`);
    const enPath = path.join(AUDIO_DIR, `${item.slug}.en.mp3`);
    const zhSource = item.broadcast || item.hook;
    const zhText = zhSource ? endZh(cleanForTts(zhSource)) : "";
    const enRaw = englishPart(item.title);
    const wantEn = enProse(item, enRaw);
    const enText = wantEn ? endEn(cleanForTts(enRaw)) : "";

    let zhOk = await exists(zhPath);
    if (!zhOk && zhText) {
      attempted++;
      try {
        await synthCosy(zhText, "zh", ZH_INSTRUCT, zhPath);
        zhOk = true;
        made++;
      } catch (e) {
        console.error(`[cosy] FAIL zh ${item.slug}: ${(e as Error).message}`);
        failed++;
      }
    }

    let enOk = await exists(enPath);
    if (!enOk && wantEn && enText) {
      attempted++;
      try {
        await synthCosy(enText, "en", EN_INSTRUCT, enPath);
        enOk = true;
        made++;
      } catch (e) {
        console.error(`[cosy] FAIL en ${item.slug}: ${(e as Error).message}`);
        failed++;
      }
    }
    if (!wantEn && enOk) {
      await fs.rm(enPath).catch(() => {});
      enOk = false;
    }

    if (zhOk || enOk) manifest.push(manifestEntry(item, zhOk, enOk));
  }

  await fs.writeFile(
    MANIFEST,
    JSON.stringify({ items: manifest }, null, 2) + "\n",
  );

  console.error(
    `[cosy] done: ${made} clip(s) made, ${failed} failed, ${pruned} pruned, ${manifest.length} item(s) in manifest`,
  );
  if (failed > 0 && made === 0 && attempted > 0) process.exit(1);
}

await main();
