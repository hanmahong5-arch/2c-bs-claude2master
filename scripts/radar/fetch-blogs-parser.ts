export const TODAY = new Date().toISOString().slice(0, 10);
export const BODY_CAP = 8000;

export type BlogType = "rss" | "lightpanda" | "rsshub";

export interface BlogSource {
  author: string;
  handle: string;
  type: BlogType;
  url: string;
  pollDays: number;
  itemSelector?: string;
}

export interface BloggerOut {
  kind: "blogger";
  author: string;
  handle: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

export interface FeedItem {
  title: string;
  url: string;
  body: string;
  published_at: string;
}

function coerce(v: string): unknown {
  const t = v.trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return Number(t);
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

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

export function parseBlogsYaml(raw: string): BlogSource[] {
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

export function daysBetween(a: string, b: string): number {
  if (!a || !b) return Infinity;
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

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

export function toIsoDate(s: string): string {
  if (!s) return TODAY;
  const d = new Date(s.trim());
  return isNaN(d.getTime()) ? TODAY : d.toISOString().slice(0, 10);
}

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
    body:
      stripHtml(it.content_html ?? "").slice(0, BODY_CAP) ||
      (it.content_text ?? it.summary ?? "").trim().slice(0, BODY_CAP),
  }));
}

function parseXmlFeed(raw: string): FeedItem[] {
  const isAtom =
    /<entry[\s>]/i.test(raw) &&
    (!/<item[\s>]/i.test(raw) ||
      /xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom/i.test(raw));

  if (isAtom) {
    return blocks(raw, "entry").map((b) => ({
      title: stripHtml(firstTagInner(b, "title")),
      url: atomLink(b),
      published_at: toIsoDate(firstTagInner(b, "published", "updated")),
      body: stripHtml(firstTagInner(b, "content", "summary")).slice(
        0,
        BODY_CAP,
      ),
    }));
  }

  return blocks(raw, "item").map((b) => {
    const link = firstTagInner(b, "link") || firstTagInner(b, "guid");
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

export function parseFeed(raw: string): FeedItem[] {
  const t = raw.trimStart();
  if (t.startsWith("{")) return parseJsonFeed(raw);
  return parseXmlFeed(raw);
}
