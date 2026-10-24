import { describe, expect, test } from "bun:test";
import type { ChangelogItem } from "./content-types";
import type { ArticleGraph } from "./graph";
import { buildRadarFeed, buildRadarLatest, stripFooter } from "./radar-feed";

function item(slug: string, publishedAt: string, kind?: ChangelogItem["kind"], extra: Partial<ChangelogItem> = {}): ChangelogItem {
  return {
    channel: "changelog",
    slug,
    title: `T ${slug}`,
    publishedAt,
    authored: "llm",
    tags: ["a"],
    body: "- point one\n- point two\n\n---\n\n> 原文：[x](https://x)",
    source: "Src",
    sourceUrl: `https://src/${slug}`,
    hook: `hook ${slug}`,
    kind,
    ...extra,
  };
}

const G: ArticleGraph = { center: "c", branches: [], flow: [], entities: [], relations: [] };

describe("stripFooter", () => {
  test("去掉末尾署名块, 保留要点", () => {
    expect(stripFooter("- a\n- b\n\n---\n\n> 原文：x")).toBe("- a\n- b");
    expect(stripFooter("- only")).toBe("- only");
  });
});

describe("buildRadarLatest", () => {
  test("日期倒序; 同日按推送价值 community > changelog > blogger > trending", () => {
    const out = buildRadarLatest([
      item("old", "2026-09-01", "community"),
      item("t", "2026-09-23", "trending"),
      item("b", "2026-09-23", "blogger"),
      item("h", "2026-09-23", "community"),
      item("r", "2026-09-23"),
    ]);
    expect(out.map((x) => x.id)).toEqual(["h", "r", "b", "t", "old"]);
    expect(out[0].kindLabel).toBe("💭 热议");
    expect(out[1].kind).toBe("changelog");
  });
  test("limit 生效", () => {
    const many = Array.from({ length: 40 }, (_, i) => item(`s${i}`, "2026-09-01"));
    expect(buildRadarLatest(many, 30)).toHaveLength(30);
  });
});

describe("buildRadarFeed", () => {
  test("附图谱 / 音频 / 可选字段, 正文去署名, url 指向站内详情", () => {
    const [x] = buildRadarFeed(
      [item("s1", "2026-09-23", "blogger", { author: "Simon", category: "person", insight: "i" })],
      new Map([["s1", G]]),
      new Set(["s1"]),
    );
    expect(x.url).toBe("https://claude2master.com/changelog/s1");
    expect(x.audioUrl).toBe("https://claude2master.com/audio/s1.zh.mp3");
    expect(x.graph).toEqual(G);
    expect(x.body).toBe("- point one\n- point two");
    expect(x.author).toBe("Simon");
    expect(x.category).toBe("person");
    expect(x.insight).toBe("i");
  });
  test("无图谱 / 无音频时不输出这些键 (App 端按有无渲染)", () => {
    const [x] = buildRadarFeed([item("s2", "2026-09-23")], new Map(), new Set());
    expect("graph" in x).toBe(false);
    expect("audioUrl" in x).toBe(false);
    expect("author" in x).toBe(false);
  });
});
