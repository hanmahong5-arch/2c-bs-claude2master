import { test, expect, describe } from "bun:test";
import {
  changelogJsonLd,
  digestJsonLd,
  harnessJsonLd,
  changelogListJsonLd,
} from "./jsonld";
import type { ChangelogItem, DigestItem, HarnessItem } from "./content-types";

const baseChangelog: ChangelogItem = {
  channel: "changelog",
  slug: "claude-code-v1-2-3",
  title: "Claude Code v1.2.3 发布",
  publishedAt: "2026-05-01",
  authored: "llm",
  tags: ["claude-code"],
  body: "正文内容",
  source: "Anthropic",
  sourceUrl: "https://example.com/release",
  hook: "这次更新带来了重大改进",
};

const baseDigest: DigestItem = {
  channel: "digest",
  slug: "weekly-2026-05-01",
  title: "Agentic 工具链一周热点",
  publishedAt: "2026-05-01",
  authored: "editor",
  tags: ["digest"],
  body: "本周回顾",
  hook: "本周 Agent 领域最值得关注的进展",
  weekOf: "2026-05-01",
};

const baseHarness: HarnessItem = {
  channel: "harness",
  slug: "harness-multi-agent",
  title: "多 Agent 协作设计",
  publishedAt: "2026-05-10",
  authored: "hybrid",
  tags: ["harness", "multi-agent"],
  body: "深度内容",
  desc: "探讨多 Agent 协作的 harness 设计模式",
};

describe("changelogJsonLd", () => {
  test("@context 为 https://schema.org", () => {
    const ld = changelogJsonLd(baseChangelog);
    expect(ld["@context"]).toBe("https://schema.org");
  });

  test("@type 为 Article", () => {
    const ld = changelogJsonLd(baseChangelog);
    expect(ld["@type"]).toBe("Article");
  });

  test("headline/description/datePublished 有值", () => {
    const ld = changelogJsonLd(baseChangelog);
    expect(ld.headline).toBeTruthy();
    expect(ld.description).toBeTruthy();
    expect(ld.datePublished).toBeTruthy();
  });

  test("inLanguage 为 zh-CN", () => {
    const ld = changelogJsonLd(baseChangelog);
    expect(ld.inLanguage).toBe("zh-CN");
  });

  test("mainEntityOfPage 包含 /changelog/ + slug", () => {
    const ld = changelogJsonLd(baseChangelog);
    expect(ld.mainEntityOfPage).toContain("/changelog/");
    expect(ld.mainEntityOfPage).toContain(baseChangelog.slug);
  });

  test("JSON.stringify 后不含 undefined", () => {
    const json = JSON.stringify(changelogJsonLd(baseChangelog));
    expect(json).not.toContain("undefined");
  });
});

describe("digestJsonLd", () => {
  test("mainEntityOfPage 包含 /weekly/", () => {
    const ld = digestJsonLd(baseDigest);
    expect(ld.mainEntityOfPage).toContain("/weekly/");
    expect(ld.mainEntityOfPage).toContain(baseDigest.slug);
  });

  test("description 取 item.hook", () => {
    const ld = digestJsonLd(baseDigest);
    expect(ld.description).toBe(baseDigest.hook);
  });

  test("JSON.stringify 后不含 undefined", () => {
    const json = JSON.stringify(digestJsonLd(baseDigest));
    expect(json).not.toContain("undefined");
  });
});

describe("harnessJsonLd", () => {
  test("description 取 item.desc 而非其他字段", () => {
    const item: HarnessItem = {
      ...baseHarness,
      desc: "desc 专属描述文字",
    };
    const ld = harnessJsonLd(item);
    expect(ld.description).toBe("desc 专属描述文字");
  });

  test("desc 与 title 不同时, description 取 desc", () => {
    const item: HarnessItem = {
      ...baseHarness,
      title: "标题文字",
      desc: "完全不同的描述内容",
    };
    const ld = harnessJsonLd(item);
    expect(ld.description).toBe("完全不同的描述内容");
    expect(ld.description).not.toBe(item.title);
  });

  test("JSON.stringify 后不含 undefined", () => {
    const json = JSON.stringify(harnessJsonLd(baseHarness));
    expect(json).not.toContain("undefined");
  });
});

describe("changelogListJsonLd", () => {
  const makeItems = (n: number): ChangelogItem[] =>
    Array.from({ length: n }, (_, i) => ({
      ...baseChangelog,
      slug: `item-${i + 1}`,
      title: `条目 ${i + 1}`,
    }));

  test("输入 35 条 → itemListElement.length === 30", () => {
    const ld = changelogListJsonLd(makeItems(35));
    expect(ld.mainEntity.itemListElement.length).toBe(30);
  });

  test("position 从 1 连续递增", () => {
    const ld = changelogListJsonLd(makeItems(35));
    ld.mainEntity.itemListElement.forEach((el, i) => {
      expect(el.position).toBe(i + 1);
    });
  });

  test('@type === "CollectionPage"', () => {
    const ld = changelogListJsonLd(makeItems(5));
    expect(ld["@type"]).toBe("CollectionPage");
  });

  test('mainEntity["@type"] === "ItemList"', () => {
    const ld = changelogListJsonLd(makeItems(5));
    expect(ld.mainEntity["@type"]).toBe("ItemList");
  });

  test("空数组 → itemListElement 长度 0 且不抛", () => {
    expect(() => {
      const ld = changelogListJsonLd([]);
      expect(ld.mainEntity.itemListElement.length).toBe(0);
    }).not.toThrow();
  });

  test("JSON.stringify 后不含 undefined", () => {
    const json = JSON.stringify(changelogListJsonLd(makeItems(10)));
    expect(json).not.toContain("undefined");
  });
});
