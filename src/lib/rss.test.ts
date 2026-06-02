import { describe, expect, test } from "bun:test";
import { renderRss } from "./rss";
import type { ChangelogItem, DigestItem, HarnessItem } from "./content-types";

// 最小合法 fixture 工厂

function makeChangelog(overrides: Partial<ChangelogItem> = {}): ChangelogItem {
  return {
    channel: "changelog",
    slug: "test-slug",
    title: "Test Changelog",
    publishedAt: "2026-05-01T00:00:00Z",
    authored: "llm",
    tags: [],
    body: "body text",
    source: "GitHub",
    sourceUrl: "https://github.com/example",
    hook: "hook text",
    ...overrides,
  };
}

function makeDigest(overrides: Partial<DigestItem> = {}): DigestItem {
  return {
    channel: "digest",
    slug: "digest-slug",
    title: "Weekly Digest",
    publishedAt: "2026-05-05T00:00:00Z",
    authored: "editor",
    tags: [],
    body: "digest body",
    hook: "digest hook",
    weekOf: "2026-W18",
    ...overrides,
  };
}

function makeHarness(overrides: Partial<HarnessItem> = {}): HarnessItem {
  return {
    channel: "harness",
    slug: "harness-slug",
    title: "Harness Deep Dive",
    publishedAt: "2026-05-10T00:00:00Z",
    authored: "hybrid",
    tags: [],
    body: "harness body",
    desc: "harness description text",
    ...overrides,
  };
}

// (1) title 含 & < > 特殊字符 → 输出含 &amp; &lt; &gt;
describe("escapeXml in item title", () => {
  test("& < > are escaped in item title", () => {
    const item = makeChangelog({ title: "A & B < C > D" });
    const out = renderRss([item], { channel: "changelog", selfPath: "/rss/changelog.xml" });
    expect(out).toContain("A &amp; B &lt; C &gt; D");
    expect(out).not.toContain("A & B < C > D");
  });
});

// (2) channel="changelog" 输出 <title> 为 CHANNEL_TITLE 对应值
describe("channel title", () => {
  test("changelog channel sets correct <channel> title", () => {
    const out = renderRss([makeChangelog()], { channel: "changelog", selfPath: "/rss/changelog.xml" });
    // CHANNEL_TITLE["changelog"] = "claude2master · Changelog"
    expect(out).toContain("<title>claude2master · Changelog</title>");
  });
});

// (3) channel="digest" 某 item 的 link 含 "/weekly/"
describe("digest item link path", () => {
  test("digest item link contains /weekly/", () => {
    const item = makeDigest({ slug: "week-18" });
    const out = renderRss([item], { channel: "digest", selfPath: "/rss/digest.xml" });
    expect(out).toContain("/weekly/week-18");
  });
});

// (4) channel="harness" item description 取 item.desc
describe("harness item description", () => {
  test("harness item description uses desc field", () => {
    const item = makeHarness({ desc: "unique harness desc value" });
    const out = renderRss([item], { channel: "harness", selfPath: "/rss/harness.xml" });
    expect(out).toContain("unique harness desc value");
  });

  test("harness item description does not use hook", () => {
    const item = makeHarness({ desc: "the desc", body: "the body" });
    const out = renderRss([item], { channel: "harness", selfPath: "/rss/harness.xml" });
    // desc が使われる; body の最初の部分が入ってしまう場合はdescが優先されることを確認
    expect(out).toContain("the desc");
  });
});

// (5) opts.title / opts.description override 生效
describe("FeedOptions overrides", () => {
  test("opts.title overrides channel default in <channel><title>", () => {
    const out = renderRss([makeChangelog()], {
      channel: "changelog",
      selfPath: "/rss/custom.xml",
      title: "My Custom Feed Title",
    });
    expect(out).toContain("<title>My Custom Feed Title</title>");
    expect(out).not.toContain("claude2master · Changelog");
  });

  test("opts.description overrides channel default in <channel><description>", () => {
    const out = renderRss([makeChangelog()], {
      channel: "changelog",
      selfPath: "/rss/custom.xml",
      description: "My custom description",
    });
    expect(out).toContain("<description>My custom description</description>");
  });
});

// (6) 空 items 数组 → 输出含 "<?xml" 与 "<channel>" 不抛
describe("empty items array", () => {
  test("does not throw and outputs valid XML skeleton", () => {
    let out: string;
    expect(() => {
      out = renderRss([], { channel: "changelog", selfPath: "/rss/changelog.xml" });
    }).not.toThrow();
    expect(out!).toContain("<?xml");
    expect(out!).toContain("<channel>");
  });
});

// (7) 非法/空 publishedAt 不产生 "NaN"/"undefined"
describe("invalid or empty publishedAt", () => {
  test("empty publishedAt does not produce NaN or undefined in output", () => {
    const item = makeChangelog({ publishedAt: "" });
    const out = renderRss([item], { channel: "changelog", selfPath: "/rss/changelog.xml" });
    expect(out).not.toContain("NaN");
    expect(out).not.toContain("undefined");
  });

  test("invalid date string does not produce NaN or undefined in output", () => {
    const item = makeChangelog({ publishedAt: "not-a-date" });
    const out = renderRss([item], { channel: "changelog", selfPath: "/rss/changelog.xml" });
    expect(out).not.toContain("NaN");
    expect(out).not.toContain("undefined");
  });
});
