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
 *   public/audio/manifest.json  (播放器读: 哪些 slug 有哪些语种, date-desc)
 *
 * 设计:
 *   - 幂等: 已存在的 mp3 跳过; 重跑等价 (CLAUDE.md 写入型脚本硬约束)。
 *   - 滚动保留: 只留最新 N 条的音频, 超出的删除 → 仓库体积有界 (~N×2×25KB)。
 *   - edge-tts (msedge-tts) 免费神经网络音质; 单条失败跳过不阻塞整批。
 *   - msedge-tts 运行时安装 (CI 在 tts step `bun add`), 动态 import 不进 Next bundle。
 *
 * 退出码: 0 正常 (无新内容也是 0); 1 仅当有尝试且全部失败。
 */

import { promises as fs } from "fs";
import path from "path";

const SCRIPT_DIR = import.meta.dir;
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const MANIFEST = path.join(AUDIO_DIR, "manifest.json");

const DEFAULT_LIMIT = 80;
const ZH_VOICE = "zh-CN-XiaoxiaoNeural";
const EN_VOICE = "en-US-AriaNeural";
// 播报腔: 中文 hook 用利索的新闻播报语速(略快 + 略压低音高), 英文标题略快。
// 不用负 rate —— 上一版 -8% 把中文神经音色拖成"有声书拖沓感", 是"太慢"反馈的头号元凶。
// 注: edge-tts 免费端点仅放行 rate/pitch/volume 三轴; 情感(mstts:express-as)与 <break>
// 被微软服务端永久屏蔽(2026-05-18 官方确认), 故"播报感"靠 pitch/语速间接做,
// 真·情感需换商业 TTS 引擎(见 doc/process.md / memory 选型结论)。
const ZH_RATE = "+6%";
const ZH_PITCH = "-4%";
const EN_RATE = "+3%";
const EN_PITCH = "+0%";

interface Item {
  slug: string;
  title: string;
  hook: string;
  publishedAt: string;
  kind: string;
}

interface ManifestEntry {
  slug: string;
  zh: boolean;
  en: boolean;
}

// ── 极简 frontmatter 抽取 (只取 slug/title/hook/publishedAt) ──
function field(fm: string, key: string): string {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!m) return "";
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  )
    v = v.slice(1, -1);
  // YAML 转义还原 (escapeYaml 写入的 \" \\)
  return v.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

async function loadItems(): Promise<Item[]> {
  let files: string[];
  try {
    files = await fs.readdir(CHANGELOG_DIR);
  } catch {
    return [];
  }
  const items: Item[] = [];
  for (const f of files) {
    if (!f.endsWith(".mdx") && !f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(CHANGELOG_DIR, f), "utf-8");
    if (!raw.startsWith("---")) continue;
    const end = raw.indexOf("\n---", 3);
    if (end === -1) continue;
    const fm = raw.slice(3, end);
    const slug = field(fm, "slug") || f.replace(/\.mdx?$/, "");
    items.push({
      slug,
      title: field(fm, "title"),
      hook: field(fm, "hook"),
      publishedAt: field(fm, "publishedAt"),
      kind: field(fm, "kind") || "changelog",
    });
  }
  // date-desc (与站点一致)
  return items.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

// 标题形如 "English headline — 中文 hook" → 取 em/en-dash 前的英文段 (不拆 hyphen, 保 claude-code)
function englishPart(title: string): string {
  return title.split(/\s[—–]\s/)[0].trim();
}

// 朗读文本规整 → 改善断句: 折叠空白, 生硬分隔符(| · – —)换成顿停, 去首尾噪声。
function cleanForTts(s: string): string {
  return s
    .replace(/\s+/g, " ")
    // 生硬分隔符 → 顿停, 让引擎在此自然换气 (改善断句)
    .replace(/\s*[|·/]\s*/g, "，")
    .replace(/\s*[–—]\s*/g, "，")
    .replace(/\s*[;；]\s*/g, "，")
    .replace(/，{2,}/g, "，")
    .replace(/^，+|，+$/g, "")
    .trim();
}

function endZh(s: string): string {
  return /[。！？.!?…]$/.test(s) ? s : s + "。";
}

function endEn(s: string): string {
  return /[.!?]$/.test(s) ? s : s + ".";
}

// 只有真·英文长句(博主/实践标题)才值得用英文语音读;
// release/trending 的"英文"是仓库名 + 版本号(codex rust-v0.137.0 / odysseus / 91),
// 用英文 TTS 读出来是乱码式断词 → 不生成 en clip(双语模式这些条目只读中文)。
function enProse(item: Item, enText: string): boolean {
  if (item.kind !== "blogger" && item.kind !== "practice") return false;
  if (!/[a-zA-Z]/.test(enText)) return false;
  return enText.split(/\s+/).filter(Boolean).length >= 2;
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

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const limIdx = argv.indexOf("--limit");
  const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const all = await loadItems();
  const keep = all.slice(0, limit);
  const keepSlugs = new Set(keep.map((i) => i.slug));

  // 滚动保留: 删除不在最新 N 条内的音频 (含 .zh.mp3/.en.mp3)
  let pruned = 0;
  for (const f of await fs.readdir(AUDIO_DIR).catch(() => [] as string[])) {
    if (!f.endsWith(".mp3")) continue;
    const slug = f.replace(/\.(zh|en)\.mp3$/, "");
    if (!keepSlugs.has(slug)) {
      await fs.rm(path.join(AUDIO_DIR, f)).catch(() => {});
      pruned++;
    }
  }

  let mod: MsEdgeMod | null = null;
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

    // 中文: 读 hook
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

    if (zhOk || enOk) manifest.push({ slug: item.slug, zh: zhOk, en: enOk });
  }

  await fs.writeFile(MANIFEST, JSON.stringify({ items: manifest }, null, 2) + "\n");

  console.error(
    `[tts] done: ${made} clip(s) made, ${failed} failed, ${pruned} pruned, ${manifest.length} item(s) in manifest`,
  );
  if (failed > 0 && made === 0 && attempted > 0) process.exit(1);
}

await main();
