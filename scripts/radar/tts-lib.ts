/**
 * tts-lib.ts — changelog 播报音频生成的共享纯函数 + 路径常量。
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
  broadcast: string;
  publishedAt: string;
  kind: string;
  author: string;
  source: string;
}

export function field(fm: string, key: string): string {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!m) return "";
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
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
  return items.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0,
  );
}

export function englishPart(title: string): string {
  return title.split(/\s[—–]\s/)[0].trim();
}

export function cleanForTts(s: string): string {
  return s
    .replace(/\s+/g, " ")
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
