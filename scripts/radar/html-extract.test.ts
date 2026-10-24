import { describe, expect, test } from "bun:test";
import {
  decodeEntities,
  extractLinks,
  extractMainText,
  extractPublished,
  extractTitle,
} from "./html-extract";

const PAGE = `<!doctype html><html><head>
<title>Fallback Title | Blog</title>
<meta content="Agents that remember &amp; learn" property="og:title">
<meta property="article:published_time" content="2026-09-20T08:00:00Z">
<script type="application/ld+json">{"datePublished":"2026-01-01"}</script>
</head><body>
<nav><a href="/blog">Blog</a><a href="/pricing">Pricing</a></nav>
<main><article><h1>Agents that remember</h1><p>First&nbsp;para with <b>bold</b>.</p>
<script>var x = 1;</script><p>Second para.</p></article></main>
<footer>© 2026 footer text</footer>
</body></html>`;

describe("extractTitle / extractPublished", () => {
  test("og:title 优先 (content 在前的属性顺序也认), 实体解码", () => {
    expect(extractTitle(PAGE)).toBe("Agents that remember & learn");
  });
  test("无 og:title → <title>", () => {
    expect(extractTitle("<title> A  B </title>")).toBe("A B");
  });
  test("article:published_time 优先于 JSON-LD", () => {
    expect(extractPublished(PAGE)).toBe("2026-09-20");
  });
  test("JSON-LD / <time> 兜底; 取不到返回空串", () => {
    expect(extractPublished(`{"datePublished": "2026-08-01T00:00:00Z"}`)).toBe("2026-08-01");
    expect(extractPublished(`<time datetime="2026-07-02">Jul 2</time>`)).toBe("2026-07-02");
    expect(extractPublished("<p>no date</p>")).toBe("");
  });
});

describe("extractPublished 兜底", () => {
  test("URL 编码日期 (DeepSeek news260821)", () => {
    expect(
      extractPublished("<h1>x</h1>", "https://api-docs.deepseek.com/news/news260821", /news(\d{2})(\d{2})(\d{2})/),
    ).toBe("2026-08-21");
  });
  test("取离 <h1> 最近的可见日期, 忽略远处推荐区日期", () => {
    const html = `<span>Aug 11, 2026</span><h1>Title</h1><p>body</p>${"x".repeat(5000)}<span>Sept 22, 2026</span>`;
    expect(extractPublished(html)).toBe("2026-08-11");
    expect(extractPublished(`<h1>T</h1><p>Sept 3, 2026</p>`)).toBe("2026-09-03");
  });
  test("无 <h1> 不猜", () => {
    expect(extractPublished("<p>Aug 11, 2026</p>")).toBe("");
  });
});

describe("stripSiteSuffix", () => {
  test("剥短站点后缀, 保留正标题", () => {
    expect(extractTitle('<meta property="og:title" content="Who Gets to Define the Rules for AI? | Cohere">')).toBe(
      "Who Gets to Define the Rules for AI?",
    );
    expect(extractTitle("<title>Agents - a primer</title>")).toBe("Agents - a primer");
  });
});

describe("extractMainText", () => {
  test("取 <article>, 去 script / nav / footer, 保留段落换行", () => {
    const t = extractMainText(PAGE);
    expect(t).toContain("Agents that remember");
    expect(t).toContain("First para with bold .");
    expect(t).toContain("Second para.");
    expect(t).not.toContain("var x");
    expect(t).not.toContain("Pricing");
    expect(t).not.toContain("footer text");
  });
});

describe("extractLinks", () => {
  const LIST = `
    <a href="/blog">all</a>
    <a href="/blog/agent-memory">1</a>
    <a href="https://x.com/blog/agent-memory?utm=1">dup</a>
    <a href="/blog/tag/ai">tag</a>
    <a href="https://other.com/blog/zzz">external</a>
    <a href="/blog/second-post/">2</a>
    <a href="/blog/agent-memory#comments">dup-anchor</a>`;
  test("同域 + pattern + 去重 + 去 query, 保持页面顺序", () => {
    expect(extractLinks(LIST, "https://x.com/blog", /^\/blog\/(?!tag\/)[^/]+\/?$/)).toEqual([
      "https://x.com/blog/agent-memory",
      "https://x.com/blog/second-post",
    ]);
  });
});

describe("decodeEntities", () => {
  test("数字实体", () => {
    expect(decodeEntities("it&#39;s &#x4e2d;")).toBe("it's 中");
  });
});
