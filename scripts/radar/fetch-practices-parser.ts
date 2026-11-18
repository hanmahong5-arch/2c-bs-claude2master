export const TODAY = new Date().toISOString().slice(0, 10);

export interface SitemapSource {
  label: string;
  kind: "sitemap";
  url: string;
  urlPrefix: string;
  pollDays: number;
}

export interface UrlSource {
  label: string;
  kind: "url";
  urls: string[];
  pollDays: number;
}

export type Source = SitemapSource | UrlSource;

export interface PracticeOut {
  kind: "practice";
  label: string;
  url: string;
  title: string;
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

export function parseSourcesYaml(raw: string): Source[] {
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

export function daysBetween(a: string, b: string): number {
  if (!a || !b) return Infinity;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(db - da) / 86400000;
}

export function extractSitemapLocs(xml: string): string[] {
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

export function extractMain(html: string): { title: string; body: string } {
  const titleMatch =
    html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    ) ?? html.match(/<title>([^<]+)<\/title>/i);
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

export function extractPublishedAt(html: string): string {
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
