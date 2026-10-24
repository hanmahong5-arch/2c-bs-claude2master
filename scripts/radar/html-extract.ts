// html-extract.ts — 无 DOM 的服务端渲染 HTML 抽取 (纯函数, 零依赖)。
//
// 用途: fetch-blogs 的 `type: html` 源 (SSR 列表页, 无 feed) 与 RSS 摘录补全原文。
// 不追求通用 readability, 只求对博客/新闻页稳定拿到: 标题 / 发布日期 / 正文纯文本 / 文章链接。

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

function metaContent(html: string, key: string): string {
  // <meta property|name="key" content="..."> 两种属性顺序都要认
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i"),
  );
  if (a) return decodeEntities(a[1]).trim();
  const b = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, "i"),
  );
  return b ? decodeEntities(b[1]).trim() : "";
}

export function extractTitle(html: string): string {
  const og = metaContent(html, "og:title");
  if (og) return stripSiteSuffix(og);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? stripSiteSuffix(decodeEntities(t[1]).replace(/\s+/g, " ").trim()) : "";
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function isoOf(y: number, m: number, d: number): string {
  if (y < 2015 || m < 1 || m > 12 || d < 1 || d > 31) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// 页面可见文本里的日期 ("Aug 11, 2026" / "Sept 3, 2026" / "2026-08-11"), 取离 <h1> 最近的一个:
// 列表/推荐区的日期离标题远, 文章自身日期通常紧贴标题上下。无 <h1> 不猜。
function textDateNearH1(html: string): string {
  const h1 = html.search(/<h1[\s>]/i);
  if (h1 === -1) return "";
  const lo = Math.max(0, h1 - 2000);
  const win = html.slice(lo, h1 + 3000);
  const re =
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (20\d\d)\b|\b(20\d\d)-(\d\d)-(\d\d)\b/g;
  let best = "";
  let bestDist = Infinity;
  for (const m of win.matchAll(re)) {
    const iso = m[1]
      ? isoOf(Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2]))
      : isoOf(Number(m[4]), Number(m[5]), Number(m[6]));
    const dist = Math.abs(lo + (m.index ?? 0) - h1);
    if (iso && dist < bestDist) {
      best = iso;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * 发布日期 YYYY-MM-DD; 取不到返回 "" (调用方据此拒收, 不拿今天冒充)。
 * 顺序: 结构化元数据 → URL 编码日期 (urlDate 三组 = yy|yyyy, mm, dd) → 标题旁可见文本日期。
 */
export function extractPublished(html: string, url = "", urlDate?: RegExp): string {
  const candidates = [
    metaContent(html, "article:published_time"),
    metaContent(html, "og:article:published_time"),
    metaContent(html, "datePublished"),
    html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? "",
    html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1] ?? "",
  ];
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c.trim());
    if (!isNaN(d.getTime()) && d.getUTCFullYear() >= 2015) return d.toISOString().slice(0, 10);
  }
  if (urlDate && url) {
    const m = url.match(urlDate);
    if (m && m.length >= 4) {
      const y = Number(m[1]);
      const iso = isoOf(y < 100 ? 2000 + y : y, Number(m[2]), Number(m[3]));
      if (iso) return iso;
    }
  }
  return textDateNearH1(html);
}

/** 标题去站点后缀 ("Foo | Cohere" / "Foo - Harvey AI"): 仅当后缀短 (≤24 字) 时剥, 防误伤正标题。 */
export function stripSiteSuffix(title: string): string {
  const m = title.match(/^(.{12,}?)\s+[|｜–—-]\s+([^|｜–—-]{1,24})$/);
  return m ? m[1].trim() : title;
}

function innerOf(html: string, tag: string): string | null {
  const open = html.search(new RegExp(`<${tag}[\\s>]`, "i"));
  if (open === -1) return null;
  const close = html.toLowerCase().lastIndexOf(`</${tag}>`);
  if (close === -1 || close < open) return null;
  return html.slice(open, close);
}

/** 正文纯文本: 优先 <article>, 其次 <main>, 最后 <body>; 去掉脚本/样式/导航/页脚等。 */
export function extractMainText(html: string): string {
  const root = innerOf(html, "article") ?? innerOf(html, "main") ?? innerOf(html, "body") ?? html;
  return decodeEntities(
    root
      .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|button)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|li|h[1-6]|div|section|blockquote|pre)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * 列表页里的文章链接 (按页面出现顺序, 去重, 转绝对 URL)。
 * pattern 匹配 URL pathname (如 ^/blog/[^/]+/?$), 排除列表页自身与分页/标签页。
 */
export function extractLinks(html: string, baseUrl: string, pattern: RegExp): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const base = new URL(baseUrl);
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    let u: URL;
    try {
      u = new URL(decodeEntities(m[1]), base);
    } catch {
      continue;
    }
    if (u.host !== base.host) continue;
    u.search = "";
    const href = u.toString().replace(/\/$/, "");
    if (!pattern.test(u.pathname) || href === baseUrl.replace(/\/$/, "")) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
  }
  return out;
}
