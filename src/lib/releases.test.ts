import { describe, expect, test } from "bun:test";
import type { ChangelogItem } from "./content-types";
import { buildReleases, bulletsFromBody, versionFromTag } from "./releases";

const base: ChangelogItem = {
  channel: "changelog",
  slug: "2026-09-06-claude-code-2-1-263",
  title: "claude-code v2.1.263 — x",
  publishedAt: "2026-09-06",
  authored: "llm",
  tags: ["bug-fixes"],
  body: "- 修复若干 bug。\n- 提升稳定性。\n\n---\n\n> 原文 release：[x](y)\n- 不算要点",
  source: "anthropics/claude-code",
  sourceUrl: "https://github.com/anthropics/claude-code/releases/tag/v2.1.263",
  hook: "小版本更新",
  insight: "不必急着升级",
  kind: "changelog",
};

describe("versionFromTag", () => {
  test("剥离 tag 前缀", () => {
    expect(versionFromTag("v2.1.263")).toBe("2.1.263");
    expect(versionFromTag("rust-v0.156.1")).toBe("0.156.1");
    expect(versionFromTag("latest")).toBeNull();
  });
});

describe("bulletsFromBody", () => {
  test("只取分隔线之前的列表项", () => {
    expect(bulletsFromBody(base.body)).toEqual(["修复若干 bug。", "提升稳定性。"]);
  });
});

describe("buildReleases", () => {
  test("只收注册工具的 release 条目, 新的在前", () => {
    const items: ChangelogItem[] = [
      base,
      { ...base, slug: "b", publishedAt: "2026-09-08", sourceUrl: "https://github.com/anthropics/claude-code/releases/tag/v2.1.270" },
      { ...base, slug: "blog", kind: "blogger", source: "simonwillison" },
      { ...base, slug: "practice", sourceUrl: "https://www.anthropic.com/engineering/x" },
      { ...base, slug: "other", source: "someone/else" },
    ];
    const p = buildReleases(items, new Date("2026-09-23T00:00:00Z"));
    expect(p.schema).toBe(1);
    expect(p.items.map((i) => i.version)).toEqual(["2.1.270", "2.1.263"]);
    const e = p.items[1];
    expect(e.tool).toBe("claude-code");
    expect(e.insight).toBe("不必急着升级");
    expect(e.url).toBe("https://claude2master.com/changelog/2026-09-06-claude-code-2-1-263");
    expect(e.machineWritten).toBe(true);
  });
});
