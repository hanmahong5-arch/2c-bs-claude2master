#!/usr/bin/env bun
/**
 * tts-generate.ts — 为 changelog 条目生成中文/英文播报音频 (edge-tts via msedge-tts)
 */

import { promises as fs } from "fs";
import path from "path";
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

const ZH_VOICE = "zh-CN-XiaoxiaoNeural";
const EN_VOICE = "en-US-AriaNeural";
const ZH_RATE = "+6%";
const ZH_PITCH = "-4%";
const EN_RATE = "+3%";
const EN_PITCH = "+0%";

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

interface EdgeTTS {
  setMetadata(voice: string, format: string): Promise<void>;
  toStream(
    text: string,
    options?: { rate?: string; pitch?: string },
  ): { audioStream: AsyncIterable<Uint8Array> };
}

interface MsEdgeMod {
  MsEdgeTTS: new () => EdgeTTS;
  OUTPUT_FORMAT: Record<string, string>;
}

async function loadTts(): Promise<MsEdgeMod> {
  const spec = "msedge-tts";
  try {
    return (await import(spec)) as MsEdgeMod;
  } catch {
    throw new Error(
      "msedge-tts not installed — required for tts-generate (CI 在 tts step `bun add msedge-tts`)",
    );
  }
}

async function synth(
  mod: MsEdgeMod,
  voice: string,
  text: string,
  outPath: string,
  rate: string,
  pitch: string,
): Promise<void> {
  const tts = new mod.MsEdgeTTS();
  await tts.setMetadata(
    voice,
    mod.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
  );
  const { audioStream } = tts.toStream(text, { rate, pitch });
  const chunks: Uint8Array[] = [];
  for await (const c of audioStream) chunks.push(c);
  if (chunks.length === 0) throw new Error("empty audio stream");
  await fs.writeFile(outPath, Buffer.concat(chunks));
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const limIdx = argv.indexOf("--limit");
  const limit =
    limIdx >= 0 ? Number(argv[limIdx + 1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const all = await loadItems();
  const keep = all.slice(0, limit);
  const keepSlugs = new Set(keep.map((i) => i.slug));

  const pruned = await prune(AUDIO_DIR, keepSlugs);

  let mod: MsEdgeMod | null = null;
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
        mod = mod ?? (await loadTts());
        await synth(mod, ZH_VOICE, zhText, zhPath, ZH_RATE, ZH_PITCH);
        zhOk = true;
        made++;
      } catch (e) {
        console.error(`[tts] FAIL zh ${item.slug}: ${(e as Error).message}`);
        failed++;
      }
    }

    let enOk = await exists(enPath);
    if (!enOk && wantEn && enText) {
      attempted++;
      try {
        mod = mod ?? (await loadTts());
        await synth(mod, EN_VOICE, enText, enPath, EN_RATE, EN_PITCH);
        enOk = true;
        made++;
      } catch (e) {
        console.error(`[tts] FAIL en ${item.slug}: ${(e as Error).message}`);
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
    `[tts] done: ${made} clip(s) made, ${failed} failed, ${pruned} pruned, ${manifest.length} item(s) in manifest`,
  );
  if (failed > 0 && made === 0 && attempted > 0) process.exit(1);
}

await main();
