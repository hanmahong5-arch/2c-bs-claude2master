import { describe, expect, test } from "bun:test";
import { relativeAge } from "./date";

const NOW = new Date("2026-06-01T00:00:00Z");

describe("relativeAge", () => {
  test("今天 / 昨天", () => {
    expect(relativeAge("2026-06-01", NOW)).toBe("今天");
    expect(relativeAge("2026-05-31", NOW)).toBe("昨天");
  });

  test("天 / 周 / 月 / 年 粒度", () => {
    expect(relativeAge("2026-05-29", NOW)).toBe("3 天前"); // 3d
    expect(relativeAge("2026-05-20", NOW)).toBe("1 周前"); // 12d
    expect(relativeAge("2026-04-15", NOW)).toBe("1 个月前"); // 47d
    expect(relativeAge("2025-08-09", NOW)).toBe("9 个月前"); // aider 真实 stale 案例
    expect(relativeAge("2024-12-19", NOW)).toBe("1 年前");
  });

  test("非法 / 未来日期 → 空串(调用方不渲染)", () => {
    expect(relativeAge("not-a-date", NOW)).toBe("");
    expect(relativeAge("2099-01-01", NOW)).toBe("");
  });
});
