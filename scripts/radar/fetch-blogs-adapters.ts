import {
  radarFetchOptionalText,
  radarFetchText,
} from "../../src/infra/radar-http";
import {
  BODY_CAP,
  parseFeed,
  toIsoDate,
  type BlogSource,
  type FeedItem,
} from "./fetch-blogs-parser";

export const MAX_ITEMS_PER_SOURCE = Math.max(
  1,
  Number(process.env.RADAR_BLOG_MAX) || 5,
);

const LIGHTPANDA_WS = process.env.LIGHTPANDA_WS ?? "ws://127.0.0.1:9222";
const LIGHTPANDA_NAV_TIMEOUT = 45000;

const FEED_HEADERS = {
  "User-Agent": "claude2master-radar/1.0 (+https://claude2master.com; bot)",
  Accept:
    "application/rss+xml, application/atom+xml, application/json, text/xml;q=0.9, */*;q=0.8",
};

const robotsCache = new Map<string, string[]>();

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

async function disallowedPaths(origin: string): Promise<string[]> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;
  const txt = await radarFetchOptionalText(`${origin}/robots.txt`, {
    "User-Agent": "claude2master-radar/1.0 (bot)",
  });
  const rules = txt ? parseRobots(txt) : [];
  robotsCache.set(origin, rules);
  return rules;
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

async function fetchViaRss(source: BlogSource): Promise<FeedItem[]> {
  const raw = await radarFetchText(source.url, FEED_HEADERS);
  return parseFeed(raw)
    .filter((it) => it.title && it.url)
    .map((it) => ({ ...it, url: it.url.split("#")[0] }));
}

interface LpPage {
  goto(
    url: string,
    opts: { waitUntil: string; timeout?: number },
  ): Promise<unknown>;
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
    await list.goto(source.url, {
      waitUntil: "domcontentloaded",
      timeout: LIGHTPANDA_NAV_TIMEOUT,
    });
    const hrefs = await list.$$eval(source.itemSelector, (els) =>
      els
        .map((e) => (e as HTMLAnchorElement).href)
        .filter((h): h is string => !!h),
    );
    await list.close();

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
        await page.goto(link, {
          waitUntil: "domcontentloaded",
          timeout: LIGHTPANDA_NAV_TIMEOUT,
        });
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
            document
              .querySelector("time[datetime]")
              ?.getAttribute("datetime") ?? meta("article:published_time");
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

export async function fetchSource(
  source: BlogSource,
  seen: Set<string>,
): Promise<FeedItem[]> {
  if (source.type === "rss") {
    const all = await fetchViaRss(source);
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
  console.error(`[blogs] ${source.handle}: type rsshub is Phase 2, skipped`);
  return [];
}
