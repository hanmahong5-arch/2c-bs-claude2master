#!/usr/bin/env bun
/**
 * fetch-blogs.ts — 抓头部博主每日发文, 归一化为 feed-item (radar「💬 观点」段)
 *
 * 用法:
 *   bun run scripts/radar/fetch-blogs.ts            # 增量, JSON Lines 写 stdout, 更新 state
 *   bun run scripts/radar/fetch-blogs.ts --dry-run  # 只打印新条目, 不更新 state
 *
 * 输入: scripts/radar/blogs.yaml + state.json (blogsSeen + blogsLastPolled)
 * 输出: stdout, JSON Lines, 每行一条 blogger item:
 *   {"kind":"blogger","author":"...","handle":"...","url":"...","title":"...",
 *    "body":"...","published_at":"YYYY-MM-DD"}
 *
 * 适配层 (一个源用三种方式之一产出标准化条目, 后续 summarize / 渲染复用):
 *   rss        — 内置 fetch + 轻量 RSS/Atom/JSON feed 解析。Phase 1 主力, 无浏览器。
 *   lightpanda — 经 puppeteer-core 连 ws://127.0.0.1:9222, domcontentloaded 取列表页 → 逐篇取正文。
 *   rsshub     — Phase 2 占位 (env RSSHUB_BASE + owner cookie), 见下 TODO, 暂不启用。
 *
 * 退出码:
 *   0 — 正常 (无新内容也是 0)
 *   1 — 所有尝试抓取的源都失败 (>0 尝试且 0 成功)
 */

import { promises as fs } from "fs";
import path from "path";

// Bun 原生, 跨平台 (旧 URL.pathname 写法在 Linux CI 退化成相对路径 → ENOENT)
const SCRIPT_DIR = import.meta.dir;
const STATE_FILE = path.join(SCRIPT_DIR, "state.json");
const BLOGS_FILE = path.join(SCRIPT_DIR, "blogs.yaml");

const TODAY = new Date().toISOString().slice(0, 10);

// 每个源单次最多发 N 条 (取 feed 最新 N → 去重)。防新订阅源首跑 backlog 刷屏。
// env RADAR_BLOG_MAX 可覆盖 (如首发 backfill 收紧到 2-3, 控制单批 LLM 摘要量)。
const MAX_ITEMS_PER_SOURCE = Math.max(
  1,
  Number(process.env.RADAR_BLOG_MAX) || 5,
);
// 正文截到 8KB — summarize.ts 用 LLM 转中文摘要时不需要全文 (镜像 practices)
const BODY_CAP = 8000;
const LIGHTPANDA_WS = process.env.LIGHTPANDA_WS ?? "ws://127.0.0.1:9222";
// 单页导航超时 — 重型 SPA (如 anthropic.com newsroom) 在 Lightpanda(beta) 下偏慢, 给 45s。
const LIGHTPANDA_NAV_TIMEOUT = 45000;

type BlogType = "rss" | "lightpanda" | "rsshub";

interface BlogSource {
  author: string;
  handle: string;
  type: BlogType;
  url: string;
  pollDays: number;
  itemSelector?: string;
}

interface BloggerOut {
  kind: "blogger";
  author: string;
  handle: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

// 归一化的中间条目 (适配器产出, 未带 author/handle — 由调用方补)
interface FeedItem {
  title: string;
  url: string;
  body: string;
  published_at: string;
}

// ── YAML 解析 (零依赖, 只支持 blogs.yaml 的 list-of-scalar-objects, 镜像 fetch-practices.ts) ──
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

function parseBlogsYaml(raw: string): BlogSource[] {
  const lines = raw.split(/\r?\n/);
  const out: BlogSource[] = [];
  let cur: Record<string, unknown> | null = null;
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line || line.trimStart().startsWith("#")) continue;
    if (line.startsWith("blogs:")) continue;

    if (line.startsWith("  - ")) {
      if (cur) pushSource(out, cur);
      cur = {};
      const rest = line.slice(4);
      const m = rest.match(/^([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
      if (m) cur[m[1]] = coerce(m[2]);
      continue;
    }
    if (!cur) continue;

    const m = line.match(/^    ([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    if (m) cur[m[1]] = coerce(m[2]);
  }
  if (cur) pushSource(out, cur);
  return out;
}

// 校验在边界一次 (CLAUDE.md: 外部输入边界校验, 内部信任)。坏源记日志跳过, 不毒化整批。
function pushSource(out: BlogSource[], o: Record<string, unknown>): void {
  const author = String(o.author ?? "").trim();
  const handle = String(o.handle ?? "").trim();
  const type = String(o.type ?? "").trim();
  const url = String(o.url ?? "").trim();
  if (!author || !handle || !url || !type) {
    console.error(`[blogs] skip malformed source: ${JSON.stringify(o)}`);
    return;
  }
  if (type !== "rss" && type !== "lightpanda" && type !== "rsshub") {
    console.error(`[blogs] skip ${handle}: unknown type "${type}"`);
    return;
  }
  out.push({
    author,
    handle,
    type: type as BlogType,
    url,
    pollDays: Number(o.pollDays ?? 1),
    itemSelector:
      typeof o.itemSelector === "string" ? o.itemSelector : undefined,
  });
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return Infinity;
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

async function fetchText(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "claude2master-radar/1.0 (+https://claude2master.com; bot)",
      Accept:
        "application/rss+xml, application/atom+xml, application/json, text/xml;q=0.9, */*;q=0.8",
    },
    redirect: "follow",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return await resp.text();
}

// ── robots.txt (尊重抓取协议) ────────────────────────────────────────────
// 仅对 lightpanda 的页面抓取生效。rss feed 是显式 syndication 端点 (publisher 主动暴露,
// 意在被轮询), 不走 robots 闸。per-host 缓存, 取 `User-agent: *` 组的 Disallow 前缀。
const robotsCache = new Map<string, string[]>();

async function disallowedPaths(origin: string): Promise<string[]> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;
  let rules: string[] = [];
  try {
    const resp = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": "claude2master-radar/1.0 (bot)" },
      redirect: "follow",
    });
    if (resp.ok) rules = parseRobots(await resp.text());
  } catch {
    rules = []; // robots 取不到 → 默认放行 (保守且可观测: 下方 isAllowed 不阻塞)
  }
  robotsCache.set(origin, rules);
  return rules;
}

function parseRobots(txt: string): string[] {
  const disallow: string[] = [];
  let appliesToAll = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const ua = line.match(/^User-agent:\s*(.*)$/i);
    if (ua) {
      appliesToAll = ua[1].trim() === "*";
      continue;
    }
    if (!appliesToAll) continue;
    const dis = line.match(/^Disallow:\s*(.*)$/i);
    if (dis && dis[1].trim()) disallow.push(dis[1].trim());
  }
  return disallow;
}

async function isAllowed(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const rules = await disallowedPaths(u.origin);
    return !rules.some((p) => u.pathname.startsWith(p));
  } catch {
    return true;
  }
}

// ── feed 解析 (RSS 2.0 / Atom / JSON Feed) ───────────────────────────────
function unwrapCdata(s: string): string {
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : s;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripHtml(s: string): string {
  // 先 decode 再 strip: Atom <content type="html"> 把标签实体转义为 &lt;p&gt;,
  // 若先 strip(此时还是实体, 无 <> 可匹配)再 decode 会泄漏裸标签。decode-first 两类都干净。
  return decodeEntities(s)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blocks(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function firstTagInner(block: string, ...tags: string[]): string {
  for (const tag of tags) {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = block.match(re);
    if (m) return unwrapCdata(m[1]).trim();
  }
  return "";
}

function toIsoDate(s: string): string {
  if (!s) return TODAY;
  const d = new Date(s.trim());
  return isNaN(d.getTime()) ? TODAY : d.toISOString().slice(0, 10);
}

// Atom <link href rel> — 优先 rel="alternate"/无 rel 的 html 链, 跳过 rel="self"/"edit"。
function atomLink(block: string): string {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  let fallback = "";
  for (const attrs of links) {
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1] ?? "";
    if (!href) continue;
    const rel = attrs.match(/rel=["']([^"']+)["']/i)?.[1] ?? "alternate";
    if (rel === "alternate") return href;
    if (!fallback && rel !== "self" && rel !== "edit") fallback = href;
  }
  return fallback;
}

function parseJsonFeed(raw: string): FeedItem[] {
  const data = JSON.parse(raw) as {
    items?: {
      title?: string;
      url?: string;
      date_published?: string;
      date_modified?: string;
      content_text?: string;
      content_html?: string;
      summary?: string;
    }[];
  };
  const items = data.items ?? [];
  return items.map((it) => ({
    title: (it.title ?? "").trim(),
    url: (it.url ?? "").trim(),
    published_at: toIsoDate(it.date_published ?? it.date_modified ?? ""),
    body: stripHtml(it.content_html ?? "").slice(0, BODY_CAP) ||
      (it.content_text ?? it.summary ?? "").trim().slice(0, BODY_CAP),
  }));
}

function parseXmlFeed(raw: string): FeedItem[] {
  const isAtom =
    /<entry[\s>]/i.test(raw) &&
    (!/<item[\s>]/i.test(raw) || /xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom/i.test(raw));

  if (isAtom) {
    return blocks(raw, "entry").map((b) => ({
      title: stripHtml(firstTagInner(b, "title")),
      url: atomLink(b),
      published_at: toIsoDate(firstTagInner(b, "published", "updated")),
      body: stripHtml(firstTagInner(b, "content", "summary")).slice(0, BODY_CAP),
    }));
  }

  return blocks(raw, "item").map((b) => {
    const link =
      firstTagInner(b, "link") || firstTagInner(b, "guid");
    return {
      title: stripHtml(firstTagInner(b, "title")),
      url: link,
      published_at: toIsoDate(firstTagInner(b, "pubDate", "dc:date")),
      body: stripHtml(
        firstTagInner(b, "content:encoded", "description", "summary"),
      ).slice(0, BODY_CAP),
    };
  });
}

function parseFeed(raw: string): FeedItem[] {
  const t = raw.trimStart();
  if (t.startsWith("{")) return parseJsonFeed(raw);
  return parseXmlFeed(raw);
}

async function fetchViaRss(source: BlogSource): Promise<FeedItem[]> {
  const raw = await fetchText(source.url);
  return parseFeed(raw)
    .filter((it) => it.title && it.url)
    // 去掉 URL 锚点片段 (#atom-everything 等) — 干净的「原文」链接 + 稳定去重 key
    .map((it) => ({ ...it, url: it.url.split("#")[0] }));
}

// ── lightpanda 适配器 (puppeteer-core via CDP) ───────────────────────────
// 动态 import (运行时计算 specifier): puppeteer-core 仅 lightpanda 源需要, 不作常驻依赖,
// 守住 radar 脚本"零新常驻 deps" + 让 rss-only 路径在未装 puppeteer-core 时仍构建/运行。
interface LpPage {
  goto(url: string, opts: { waitUntil: string; timeout?: number }): Promise<unknown>;
  $$eval<T>(sel: string, fn: (els: Element[]) => T): Promise<T>;
  evaluate<T>(fn: () => T): Promise<T>;
  close(): Promise<void>;
}
interface LpBrowser {
  newPage(): Promise<LpPage>;
  disconnect(): Promise<void>;
}
interface Puppeteer {
  connect(opts: { browserWSEndpoint: string }): Promise<LpBrowser>;
}

async function loadPuppeteer(): Promise<Puppeteer> {
  const spec = "puppeteer-core";
  let mod: { default?: Puppeteer } & Partial<Puppeteer>;
  try {
    mod = (await import(spec)) as { default?: Puppeteer } & Partial<Puppeteer>;
  } catch {
    throw new Error(
      "puppeteer-core not installed — required for type: lightpanda sources " +
        "(daily-radar 仅在 blogs.yaml 含 lightpanda 源时安装它)",
    );
  }
  const p = mod.default ?? (mod as Puppeteer);
  if (typeof p.connect !== "function") {
    throw new Error("puppeteer-core export has no connect()");
  }
  return p;
}

async function fetchViaLightpanda(
  source: BlogSource,
  seen: Set<string>,
): Promise<FeedItem[]> {
  if (!source.itemSelector) {
    throw new Error(`${source.handle}: lightpanda source needs itemSelector`);
  }
  if (!(await isAllowed(source.url))) {
    console.error(`[blogs] robots.txt disallows list page ${source.url}; skip`);
    return [];
  }
  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.connect({ browserWSEndpoint: LIGHTPANDA_WS });
  try {
    const list = await browser.newPage();
    // Lightpanda 是 DOM-focused, 不等 networkidle (官方建议 domcontentloaded)
    await list.goto(source.url, { waitUntil: "domcontentloaded", timeout: LIGHTPANDA_NAV_TIMEOUT });
    const hrefs = await list.$$eval(source.itemSelector, (els) =>
      els
        .map((e) => (e as HTMLAnchorElement).href)
        .filter((h): h is string => !!h),
    );
    await list.close();

    // 去重 + 取最新 N (列表页通常新→旧)
    const fresh: string[] = [];
    for (const h of hrefs) {
      if (seen.has(h) || fresh.includes(h)) continue;
      fresh.push(h);
      if (fresh.length >= MAX_ITEMS_PER_SOURCE) break;
    }

    const items: FeedItem[] = [];
    for (const link of fresh) {
      if (!(await isAllowed(link))) {
        console.error(`[blogs] robots.txt disallows ${link}; skip`);
        continue;
      }
      try {
        const page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: LIGHTPANDA_NAV_TIMEOUT });
        const data = await page.evaluate(() => {
          const meta = (p: string) =>
            document
              .querySelector(`meta[property="${p}"]`)
              ?.getAttribute("content") ?? "";
          const title = meta("og:title") || document.title || "";
          const root =
            document.querySelector("article") ??
            document.querySelector("main") ??
            document.body;
          const body = (root?.textContent ?? "").replace(/\s+/g, " ").trim();
          const published =
            document.querySelector("time[datetime]")?.getAttribute("datetime") ??
            meta("article:published_time");
          return { title: title.trim(), body, published };
        });
        await page.close();
        if (!data.title || data.body.length < 200) {
          console.error(
            `[blogs] ${source.handle}: thin content at ${link} (${data.body.length} chars); skip`,
          );
          continue;
        }
        items.push({
          title: data.title,
          url: link,
          body: data.body.slice(0, BODY_CAP),
          published_at: toIsoDate(data.published),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[blogs] ${source.handle}: FAIL article ${link}: ${msg}`);
      }
    }
    return items;
  } finally {
    await browser.disconnect();
  }
}

// ── state ────────────────────────────────────────────────────────────────
interface StateShape {
  blogsSeen: Record<string, string[]>;
  blogsLastPolled: Record<string, string>;
  [k: string]: unknown;
}

async function loadState(): Promise<StateShape> {
  const raw = JSON.parse(await fs.readFile(STATE_FILE, "utf-8")) as Record<
    string,
    unknown
  >;
  return {
    ...raw,
    blogsSeen: (raw.blogsSeen as Record<string, string[]>) ?? {},
    blogsLastPolled: (raw.blogsLastPolled as Record<string, string>) ?? {},
  } as StateShape;
}

async function saveState(state: StateShape): Promise<void> {
  // 原子写: 先写临时文件再 rename (镜像 summarize.ts), 防 SIGKILL 留截断 JSON 卡死管线。
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, STATE_FILE);
}

async function fetchSource(
  source: BlogSource,
  seen: Set<string>,
): Promise<FeedItem[]> {
  if (source.type === "rss") {
    const all = await fetchViaRss(source);
    // feed 通常新→旧: 取最新 N 候选再去重 (与 lightpanda 一致, 防首跑刷屏)
    const candidates = all.slice(0, MAX_ITEMS_PER_SOURCE * 3);
    const fresh: FeedItem[] = [];
    for (const it of candidates) {
      if (seen.has(it.url) || fresh.some((f) => f.url === it.url)) continue;
      fresh.push(it);
      if (fresh.length >= MAX_ITEMS_PER_SOURCE) break;
    }
    return fresh;
  }
  if (source.type === "lightpanda") {
    return await fetchViaLightpanda(source, seen);
  }
  // Phase 2 占位: rsshub — 需 env RSSHUB_BASE + owner cookie (重要信息.md) + 自托管 RSSHub (R6)。
  // TODO(Phase 2): const base = process.env.RSSHUB_BASE; 把 X/微信/知乎路由桥成 RSS 后复用 fetchViaRss。
  console.error(`[blogs] ${source.handle}: type rsshub is Phase 2, skipped`);
  return [];
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");

  const yamlRaw = await fs.readFile(BLOGS_FILE, "utf-8");
  const sources = parseBlogsYaml(yamlRaw);
  const state = await loadState();

  let okCount = 0;
  let failCount = 0;
  let attemptCount = 0;

  for (const src of sources) {
    const lastPoll = state.blogsLastPolled[src.handle] ?? "";
    if (daysBetween(lastPoll, TODAY) < src.pollDays) {
      console.error(
        `[blogs] skip ${src.handle} (polled ${lastPoll}, < ${src.pollDays}d)`,
      );
      continue;
    }

    if (!state.blogsSeen[src.handle]) state.blogsSeen[src.handle] = [];
    const seen = new Set(state.blogsSeen[src.handle]);

    attemptCount++;
    let items: FeedItem[];
    try {
      items = await fetchSource(src, seen);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[blogs] FAIL ${src.handle} (${src.type}): ${msg}`);
      failCount++;
      continue;
    }

    console.error(`[blogs] ${src.handle}: ${items.length} new`);
    for (const it of items) {
      const out: BloggerOut = {
        kind: "blogger",
        author: src.author,
        handle: src.handle,
        url: it.url,
        title: it.title,
        body: it.body,
        published_at: it.published_at,
      };
      process.stdout.write(JSON.stringify(out) + "\n");
      state.blogsSeen[src.handle].push(it.url);
      okCount++;
    }

    state.blogsLastPolled[src.handle] = TODAY;
  }

  if (!dryRun) await saveState(state);

  console.error(
    `[blogs] done: ${okCount} new, ${failCount} failed, ${attemptCount} source(s) attempted`,
  );
  // 全部尝试的源都失败 → exit 1 (与 fetch-practices.ts 一致); 无源/无新内容 → exit 0
  if (failCount > 0 && okCount === 0 && attemptCount > 0 && failCount === attemptCount)
    process.exit(1);
}

await main();
