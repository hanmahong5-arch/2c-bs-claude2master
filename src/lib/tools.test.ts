import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  TOOLS,
  toolForKey,
  toolForSource,
  versionFromSourceUrl,
} from "./tools";

describe("versionFromSourceUrl", () => {
  test("GitHub release URL → tag 末段", () => {
    expect(
      versionFromSourceUrl(
        "https://github.com/anthropics/claude-code/releases/tag/v2.1.158",
      ),
    ).toBe("v2.1.158");
  });

  test("带前缀的 tag 原样保留 (rust-v / cli-v)", () => {
    expect(
      versionFromSourceUrl(
        "https://github.com/openai/codex/releases/tag/rust-v0.135.0",
      ),
    ).toBe("rust-v0.135.0");
    expect(
      versionFromSourceUrl(
        "https://github.com/cline/cline/releases/tag/cli-v3.0.15",
      ),
    ).toBe("cli-v3.0.15");
  });

  test("URL-encoded tag 解码", () => {
    expect(
      versionFromSourceUrl(
        "https://github.com/x/y/releases/tag/v1.0%2Bbuild.2",
      ),
    ).toBe("v1.0+build.2");
  });

  test("query / hash 不混入 tag", () => {
    expect(
      versionFromSourceUrl(
        "https://github.com/x/y/releases/tag/v1.2.3?foo=bar#baz",
      ),
    ).toBe("v1.2.3");
  });

  test("非 release URL (工程博客 / 新闻) → null", () => {
    expect(
      versionFromSourceUrl(
        "https://www.anthropic.com/engineering/building-effective-agents",
      ),
    ).toBeNull();
    expect(
      versionFromSourceUrl("https://www.anthropic.com/news/claude-opus-4-8"),
    ).toBeNull();
  });
});

describe("toolForSource / toolForKey", () => {
  test("owner/repo 精确匹配", () => {
    expect(toolForSource("anthropics/claude-code")?.key).toBe("claude-code");
    expect(toolForSource("RooCodeInc/Roo-Code")?.key).toBe("roo-code");
  });

  test("practice / 未知 source → undefined", () => {
    expect(toolForSource("anthropic-engineering")).toBeUndefined();
    expect(toolForSource("anthropic")).toBeUndefined(); // Opus 4.8 新闻条
    expect(toolForSource("")).toBeUndefined();
  });

  test("key 查表", () => {
    expect(toolForKey("gemini-cli")?.repo).toBe("google-gemini/gemini-cli");
    expect(toolForKey("nope")).toBeUndefined();
  });
});

describe("TOOLS 注册表自洽", () => {
  test("key 唯一、repo 唯一、order 为 0..n-1 连续", () => {
    const keys = new Set(TOOLS.map((t) => t.key));
    const repos = new Set(TOOLS.map((t) => t.repo));
    expect(keys.size).toBe(TOOLS.length);
    expect(repos.size).toBe(TOOLS.length);
    expect(TOOLS.map((t) => t.order)).toEqual(TOOLS.map((_, i) => i));
  });

  // 锁住「TOOLS 与 fetch-releases.sh 的 REPOS 必须一致」这条靠注释互指的约束:
  // 任一处改了另一处没跟上, 这条测试就红。
  test("每个 TOOLS.repo 都在 fetch-releases.sh 的 REPOS 里", () => {
    const sh = readFileSync(
      join(import.meta.dir, "..", "..", "scripts", "radar", "fetch-releases.sh"),
      "utf-8",
    );
    for (const t of TOOLS) {
      expect(sh).toContain(`"${t.repo}"`);
    }
  });
});
