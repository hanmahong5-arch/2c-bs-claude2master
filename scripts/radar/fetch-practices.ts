#!/usr/bin/env bun
/**
 * fetch-practices.ts — 抓 Anthropic Engineering / Claude Code docs / OpenAI Codex blog
 *
 * 用法:
 *   bun run scripts/radar/fetch-practices.ts            # 增量, JSON Lines 写 stdout
 *   bun run scripts/radar/fetch-practices.ts --dry-run  # 只打印 diff, 不更新 state
 *
 * 输入: scripts/radar/sources.yaml + state.json (practicesSeen + practicesLastPolled)
 * 输出: stdout, JSON Lines, 每行一条 practice:
 *   {"kind":"practice","label":"anthropic-engineering","url":"...","title":"...",
 *    "body":"...","published_at":"YYYY-MM-DD"}
 *
 * 退出码:
 *   0 — 正常 (无新内容也是 0)
 *   1 — sitemap fetch / HTML 抽取失败 (>0 篇实际尝试抓取失败)
 */

import { promises as fs } from "fs";
import path from "path";

// Bun 原生, 跨平台: Win 给 C:/… / Linux 给 /home/runner/… 都是正确绝对目录。
// (旧写法 new URL(import.meta.url).pathname.replace(/^\//,"") 在 Linux 会退化成相对路径 → ENOENT)
const SCRIPT_DIR = import.meta.dir;
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");
const SOURCES_FILE = path.join(SCRIPT_DIR, "sources.yaml");

const TODAY = new Date().toISOString().slice(0, 10);

// 单源单次最多抓 N 篇 — 防大 sitemap (如 openclaw /concepts 49 页、hermes /docs/guides 32 页)
// 首跑一次性灌爆 CI 时限 (2026-06-10 死循环教训)。超出的 fresh 不标 seen, 下轮继续排干。
// env RADAR_PRACTICE_MAX 可覆盖 (backfill 时放宽)。
const MAX_ITEMS_PER_SOURCE = Math.max(
  1,
  Number(process.env.RADAR_PRACTICE_MAX) || 6,
);

interface SitemapSource {
  label: string;
  kind: "sitemap";
  url: string;
  urlPrefix: string;
  pollDays: number;
}
interface UrlSource {
  label: string;
  kind: "url";
  urls: string[];
  pollDays: number;
}
type Source = SitemapSource | UrlSource;

interface PracticeOut {
  kind: "practice";
  label: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

// 极简 YAML parser — 只支持本文件用到的 list-of-objects + scalar / nested list / number 形式
// 不引入外部依赖 (plan: "零新 npm/bun deps")。如要扩展, 改成正经 yaml lib。
function parseSourcesYaml(raw: string): Source[] {
  const lines = raw.split(/\r?\n/);
  const out: Source[] = [];
  let cur: Record<string, unknown> | null = null;
  let inUrls = false;
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line || line.trimStart().startsWith("#")) continue;
    if (line.startsWith("sources:")) continue;

    if (line.startsWith("  - ")) {
      if (cur) out.push(toSource(cur));
      cur = {};
      inUrls = false;
      const rest = line.slice(4);
      const m = rest.match(/^([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
      if (m) cur[m[1]] = coerce(m[2]);
      continue;
    }
    if (!cur) continue;

    if (line.startsWith("    urls:")) {
      inUrls = true;
      cur.urls = [];
      continue;
    }
    if (inUrls && line.startsWith("      - ")) {
      (cur.urls as string[]).push(line.slice(8).trim());
      continue;
    }

    const m = line.match(/^    ([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    if (m) {
      inUrls = false;
      cur[m[1]] = coerce(m[2]);
    }
  }
  if (cur) out.push(toSource(cur));
  return out;
}

function coerce(v: string): unknown {
  const t = v.trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return Number(t);
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  )
    return t.slice(1, -1);
  return t;
}

function toSource(o: Record<string, unknown>): Source {
  const kind = String(o.kind);
  if (kind === "sitemap") {
    return {
      label: String(o.label),
      kind: "sitemap",
      url: String(o.url),
      urlPrefix: String(o.urlPrefix),
      pollDays: Number(o.pollDays ?? 1),
    };
  }
  return {
    label: String(o.label),
    kind: "url",
    urls: Array.isArray(o.urls) ? (o.urls as string[]) : [],
    pollDays: Number(o.pollDays ?? 7),
  };
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return Infinity;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(db - da) / 86400000;
}

async function fetchText(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "claude2master-radar/1.0 (+https://claude2master.com; bot)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
    },
    redirect: "follow",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return await resp.text();
}

function extractSitemapLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMain(html: string): { title: string; body: string } {
  const titleMatch =
    html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ??
    html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  let bodyHtml = "";
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) bodyHtml = articleMatch[1];
  else {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) bodyHtml = mainMatch[1];
  }

  const body = stripHtml(bodyHtml || html);
  return { title, body };
}

function extractPublishedAt(html: string): string {
  const candidates = [
    /<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']publish[-_]?date["']\s+content=["']([^"']+)["']/i,
    /<meta\s+property=["']og:updated_time["']\s+content=["']([^"']+)["']/i,
    /<time[^>]*datetime=["']([^"']+)["']/i,
  ];
  for (const re of candidates) {
    const m = html.match(re);
    if (m) {
      const iso = m[1].trim();
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return TODAY;
}

async function fetchPracticePage(
  url: string,
): Promise<{ title: string; body: string; published_at: string }> {
  const html = await fetchText(url);
  const { title, body } = extractMain(html);
  if (!title) throw new Error(`no title extracted from ${url}`);
  if (body.length < 500)
    throw new Error(`body too short (${body.length} chars) for ${url}`);
  const published_at = extractPublishedAt(html);
  // 截到 8KB, 防 prompt 爆炸 — summarize.ts 用 LLM 转中文摘要时不需要全文
  return { title, body: body.slice(0, 8000), published_at };
}

interface StateShape {
  lastSeen: Record<string, string>;
  practicesSeen: Record<string, string[]>;
  practicesLastPolled: Record<string, string>;
  [k: string]: unknown;
}

async function loadState(): Promise<StateShape> {
  const raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as Record<
    string,
    unknown
  >;
  return {
    ...raw,
    lastSeen: (raw.lastSeen as Record<string, string>) ?? {},
    practicesSeen: (raw.practicesSeen as Record<string, string[]>) ?? {},
    practicesLastPolled:
      (raw.practicesLastPolled as Record<string, string>) ?? {},
  } as StateShape;
}

async function saveState(state: StateShape): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

async function discoverUrls(source: Source): Promise<string[]> {
  if (source.kind === "url") return source.urls;
  const xml = await fetchText(source.url);
  return extractSitemapLocs(xml).filter((u) => u.startsWith(source.urlPrefix));
}

// --urls 模式: 抓指定 URL, 跳过 sitemap diff / pollDays / state 写入。
// 用于 backfill 手挑文章生成 seed (plan §G). 条目格式 label=url 或裸 url(默认 label)。
// state 不动 — 因为 backfill 挑的 URL 通常已在 practicesSeen 里 (sitemap 全集), 重复 push 无意义。
async function runUrlsMode(entries: string[]): Promise<void> {
  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const eq = entry.indexOf("=");
    const label = eq > 0 ? entry.slice(0, eq) : "anthropic-engineering";
    const url = eq > 0 ? entry.slice(eq + 1) : entry;
    try {
      const { title, body, published_at } = await fetchPracticePage(url);
      const out: PracticeOut = {
        kind: "practice",
        label,
        url,
        title,
        body,
        published_at,
      };
      process.stdout.write(JSON.stringify(out) + "\n");
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[practices] FAIL ${url}: ${msg}`);
      fail++;
    }
  }
  console.error(`[practices] urls-mode done: ${ok} ok, ${fail} failed`);
  if (fail > 0 && ok === 0) process.exit(1);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");

  const urlsIdx = argv.indexOf("--urls");
  if (urlsIdx >= 0) {
    const entries = argv
      .slice(urlsIdx + 1)
      .filter((a) => !a.startsWith("--"))
      .flatMap((a) => a.split(","))
      .map((a) => a.trim())
      .filter(Boolean);
    await runUrlsMode(entries);
    return;
  }

  const yamlRaw = await fs.readFile(SOURCES_FILE, "utf-8");
  const sources = parseSourcesYaml(yamlRaw);
  const state = await loadState();

  let okCount = 0;
  let failCount = 0;
  let attemptCount = 0;

  for (const src of sources) {
    const lastPoll = state.practicesLastPolled[src.label] ?? "";
    if (daysBetween(lastPoll, TODAY) < src.pollDays) {
      console.error(
        `[practices] skip ${src.label} (polled ${lastPoll}, < ${src.pollDays}d)`,
      );
      continue;
    }

    let urls: string[];
    try {
      urls = await discoverUrls(src);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[practices] FAIL discover ${src.label}: ${msg}`);
      failCount++;
      continue;
    }

    if (!state.practicesSeen[src.label]) state.practicesSeen[src.label] = [];
    const seen = new Set(state.practicesSeen[src.label]);
    const fresh = urls.filter((u) => !seen.has(u));
    // 单源封顶: 大 sitemap 首跑分多轮排干, 不一次灌爆 CI。剩余 fresh 这轮不标 seen → 下轮再取。
    const capped = fresh.slice(0, MAX_ITEMS_PER_SOURCE);
    const deferred = fresh.length - capped.length;
    console.error(
      `[practices] ${src.label}: ${urls.length} total, ${fresh.length} new, 本轮抓 ${capped.length}` +
        (deferred > 0 ? ` (剩 ${deferred} 篇下轮继续)` : ""),
    );

    for (const url of capped) {
      attemptCount++;
      try {
        const { title, body, published_at } = await fetchPracticePage(url);
        const out: PracticeOut = {
          kind: "practice",
          label: src.label,
          url,
          title,
          body,
          published_at,
        };
        process.stdout.write(JSON.stringify(out) + "\n");
        state.practicesSeen[src.label].push(url);
        okCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[practices] FAIL ${url}: ${msg}`);
        failCount++;
      }
    }

    state.practicesLastPolled[src.label] = TODAY;
  }

  if (!dryRun) await saveState(state);

  console.error(
    `[practices] done: ${okCount} new, ${failCount} failed, ${attemptCount} attempted`,
  );
  if (failCount > 0 && okCount === 0 && attemptCount > 0) process.exit(1);
}

await main();
