#!/usr/bin/env bun
/**
 * tts-generate-cosy.ts — 用本地自托管 CosyVoice2-0.5B 生成带情感的播报音频。
 *
 * 主路径(本地 cron, GPU): 调常驻 HTTP 服务 cosyvoice_server.py (WSL, RTX 4070)。
 * 情感靠 inference_instruct2 的自然语言指令(edge-tts 免费端点的中文情感被微软永久屏蔽)。
 *
 * 用法:
 *   bun run scripts/radar/tts-generate-cosy.ts              # 最新 N 条补齐 mp3
 *   bun run scripts/radar/tts-generate-cosy.ts --limit 5    # 自定保留条数(试听用)
 *   COSY_URL=http://localhost:8123 bun run ...              # 覆盖服务地址
 *
 * 服务端直接返回 mp3 (24kHz/48kbps mono) → Windows 侧免装 ffmpeg。
 *
 * fallback: COSY_URL/healthz 不可达 → 直接 exec tts-generate.ts (edge-tts) 兜底,
 *           保证"音频是补充、不阻塞"。两个脚本产出同一 enriched manifest 契约。
 *
 * 幂等 / 滚动保留 / en gating / enriched manifest 与 edge 版完全一致 (共享 tts-lib)。
 * 退出码: 0 正常; 1 仅当有尝试且全部失败。
 */

import { promises as fs } from "fs";
import path from "path";
import { spawnSync } from "child_process";
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

// 情感指令 (inference_instruct2 的 instruct_text)。B1 试听门禁通过后可再调。
const ZH_INSTRUCT = "用专业、热情的新闻主播语气播报，吐字清晰、节奏明快、富有感染力。";
const EN_INSTRUCT = "Read in a professional, upbeat news-anchor tone, clear and energetic.";

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
  try {
    const res = await fetch(`${COSY_URL}/healthz`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 服务端直接出 mp3 → 写盘。
async function synthCosy(
  text: string,
  lang: "zh" | "en",
  instruct: string,
  outPath: string,
): Promise<void> {
  const res = await fetch(`${COSY_URL}/tts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, lang, instruct }),
    // 单句 0.5B fp16 通常 <10s, 给足余量(含冷启动队列)。
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`tts ${res.status}: ${detail.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error("empty audio");
  await fs.writeFile(outPath, buf);
}

// enriched manifest: 复用 tools.ts 把 source → 工具 key (与前端筛选 chips 同源)。
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

// COSY 不可达 → 退回 edge-tts 脚本 (原样复用, 不重写情感无关的生成逻辑)。
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
  const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

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
    const zhText = item.hook ? endZh(cleanForTts(item.hook)) : "";
    const enRaw = englishPart(item.title);
    const wantEn = enProse(item, enRaw);
    const enText = wantEn ? endEn(cleanForTts(enRaw)) : "";

    // 中文: 读 hook (情感 via ZH_INSTRUCT)
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

    // 英文: 仅真·英文长句标题(博主/实践)才读 (与 edge 版同 gating)
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
    // 旧"垃圾英文"clip 但此条不该有 en → 删除(regenerate 一致性)
    if (!wantEn && enOk) {
      await fs.rm(enPath).catch(() => {});
      enOk = false;
    }

    if (zhOk || enOk) manifest.push(manifestEntry(item, zhOk, enOk));
  }

  await fs.writeFile(MANIFEST, JSON.stringify({ items: manifest }, null, 2) + "\n");

  console.error(
    `[cosy] done: ${made} clip(s) made, ${failed} failed, ${pruned} pruned, ${manifest.length} item(s) in manifest`,
  );
  if (failed > 0 && made === 0 && attempted > 0) process.exit(1);
}

await main();
