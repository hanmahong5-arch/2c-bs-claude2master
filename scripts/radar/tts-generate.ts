#!/usr/bin/env bun
/**
 * tts-generate.ts — 为 changelog 条目生成中文/英文播报音频 (edge-tts via msedge-tts)
 *
 * 用法:
 *   bun run scripts/radar/tts-generate.ts             # 确保最新 N 条有 zh+en mp3, 清理超出的
 *   bun run scripts/radar/tts-generate.ts --limit 80  # 自定保留条数
 *
 * 输出:
 *   public/audio/<slug>.zh.mp3  (读中文 hook)
 *   public/audio/<slug>.en.mp3  (读英文标题段)
 *   public/audio/manifest.json  (enriched: slug/zh/en + title/kind/author/source/tool/publishedAt)
 *
 * 角色: CI fallback / 本地无 GPU 时的退路。情感播报主路径是 tts-generate-cosy.ts (CosyVoice2)。
 *
 * 设计:
 *   - 幂等: 已存在的 mp3 跳过; 重跑等价 (CLAUDE.md 写入型脚本硬约束)。
 *   - 滚动保留: 只留最新 N 条的音频, 超出的删除 → 仓库体积有界 (~N×2×25KB)。
 *   - edge-tts (msedge-tts) 免费神经网络音质; 单条失败跳过不阻塞整批。
 *   - msedge-tts 运行时安装 (CI 在 tts step `bun add`), 动态 import 不进 Next bundle。
 *   - 纯文本处理/枚举/清理逻辑抽到 tts-lib.ts, 与 cosy 版共享。
 *
 * 退出码: 0 正常 (无新内容也是 0); 1 仅当有尝试且全部失败。
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
// 播报腔: 中文 hook 用利索的新闻播报语速(略快 + 略压低音高), 英文标题略快。
// 不用负 rate —— 上一版 -8% 把中文神经音色拖成"有声书拖沓感", 是"太慢"反馈的头号元凶。
// 注: edge-tts 免费端点仅放行 rate/pitch/volume 三轴; 情感(mstts:express-as)与 <break>
// 被微软服务端永久屏蔽(2026-05-18 官方确认), 故"播报感"靠 pitch/语速间接做,
// 真·情感需换商业/自托管 TTS 引擎(见 tts-generate-cosy.ts / doc/process.md / memory 选型结论)。
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

// ── msedge-tts (动态 import, 运行时计算 specifier 规避 TS 静态解析 + Next bundle) ──
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
  await tts.setMetadata(voice, mod.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate, pitch });
  const chunks: Uint8Array[] = [];
  for await (const c of audioStream) chunks.push(c);
  if (chunks.length === 0) throw new Error("empty audio stream");
  await fs.writeFile(outPath, Buffer.concat(chunks));
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const limIdx = argv.indexOf("--limit");
  const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

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
    // 优先口播稿 (与 cosy 版一致); 缺失回退裸 hook (旧条目向后兼容)。
    const zhSource = item.broadcast || item.hook;
    const zhText = zhSource ? endZh(cleanForTts(zhSource)) : "";
    const enRaw = englishPart(item.title);
    const wantEn = enProse(item, enRaw);
    const enText = wantEn ? endEn(cleanForTts(enRaw)) : "";

    // 中文: 读口播稿 (回退 hook)
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

    // 英文: 仅真·英文长句标题(博主/实践)才读; release/trending 跳过(避免仓库名乱读)
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
    // 若已存在旧的"垃圾英文"clip 但此条不该有 en → 删除(regenerate 一致性)
    if (!wantEn && enOk) {
      await fs.rm(enPath).catch(() => {});
      enOk = false;
    }

    if (zhOk || enOk) manifest.push(manifestEntry(item, zhOk, enOk));
  }

  await fs.writeFile(MANIFEST, JSON.stringify({ items: manifest }, null, 2) + "\n");

  console.error(
    `[tts] done: ${made} clip(s) made, ${failed} failed, ${pruned} pruned, ${manifest.length} item(s) in manifest`,
  );
  if (failed > 0 && made === 0 && attempted > 0) process.exit(1);
}

await main();
