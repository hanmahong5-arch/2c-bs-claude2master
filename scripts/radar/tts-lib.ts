/**
 * tts-lib.ts — changelog 播报音频生成的共享纯函数 + 路径常量。
 *
 * 被两个生成器复用:
 *   - tts-generate.ts       (edge-tts, CI fallback)
 *   - tts-generate-cosy.ts  (本地 CosyVoice2 情感 TTS, cron 主路径)
 *
 * 只放无副作用的文本处理 + 文件枚举/清理; TTS 引擎调用各自实现。
 */

import { promises as fs } from "fs";
import path from "path";

const SCRIPT_DIR = import.meta.dir;
export const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
export const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
export const AUDIO_DIR = path.join(ROOT, "public", "audio");
export const MANIFEST = path.join(AUDIO_DIR, "manifest.json");

export const DEFAULT_LIMIT = 80;

export interface Item {
  slug: string;
  title: string;
  hook: string;
  /** 口播稿 (口语播报稿); 空时播报回退 hook */
  broadcast: string;
  publishedAt: string;
  kind: string;
  /** 博主署名 (kind: blogger); 其他 kind 可空 */
  author: string;
  /** release 的 owner/repo, 或 practice/blogger/trending 的来源名 */
  source: string;
}

// ── 极简 frontmatter 抽取 (单行标量) ──
export function field(fm: string, key: string): string {
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

export async function loadItems(): Promise<Item[]> {
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
      broadcast: field(fm, "broadcast"),
      publishedAt: field(fm, "publishedAt"),
      kind: field(fm, "kind") || "changelog",
      author: field(fm, "author"),
      source: field(fm, "source"),
    });
  }
  // date-desc (与站点一致)
  return items.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

// 标题形如 "English headline — 中文 hook" → 取 em/en-dash 前的英文段 (不拆 hyphen, 保 claude-code)
export function englishPart(title: string): string {
  return title.split(/\s[—–]\s/)[0].trim();
}

// 朗读文本规整 → 改善断句: 折叠空白, 生硬分隔符(| · – —)换成顿停, 去首尾噪声。
export function cleanForTts(s: string): string {
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

export function endZh(s: string): string {
  return /[。！？.!?…]$/.test(s) ? s : s + "。";
}

export function endEn(s: string): string {
  return /[.!?]$/.test(s) ? s : s + ".";
}

// 只有真·英文长句(博主/实践标题)才值得用英文语音读;
// release/trending 的"英文"是仓库名 + 版本号(codex rust-v0.137.0 / odysseus / 91),
// 用英文 TTS 读出来是乱码式断词 → 不生成 en clip(双语模式这些条目只读中文)。
export function enProse(item: Item, enText: string): boolean {
  if (item.kind !== "blogger" && item.kind !== "practice") return false;
  if (!/[a-zA-Z]/.test(enText)) return false;
  return enText.split(/\s+/).filter(Boolean).length >= 2;
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * 滚动保留: 删除不在 keepSlugs 内的 .mp3 (含 .zh.mp3/.en.mp3) → 仓库体积有界。
 * 返回删除条数。目录不存在视作 0。
 */
export async function prune(
  audioDir: string,
  keepSlugs: Set<string>,
): Promise<number> {
  let pruned = 0;
  for (const f of await fs.readdir(audioDir).catch(() => [] as string[])) {
    if (!f.endsWith(".mp3")) continue;
    const slug = f.replace(/\.(zh|en)\.mp3$/, "");
    if (!keepSlugs.has(slug)) {
      await fs.rm(path.join(audioDir, f)).catch(() => {});
      pruned++;
    }
  }
  return pruned;
}
