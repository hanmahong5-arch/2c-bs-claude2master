import { describe, expect, it } from "bun:test";
import {
  aggregateScore,
  getScore,
  SCORES,
  TASKS,
  TOOLS,
} from "./coding-rank";

describe("getScore", () => {
  it("返回真实 cell: claude-code × react-todo-undo = 5", () => {
    const cell = getScore("claude-code", "react-todo-undo");
    expect(cell).toBeDefined();
    expect(cell!.score).toBe(5);
    expect(cell!.tool).toBe("claude-code");
    expect(cell!.task).toBe("react-todo-undo");
  });

  it("返回真实 cell: aider × go-rest-paginate = 5", () => {
    const cell = getScore("aider", "go-rest-paginate");
    expect(cell).toBeDefined();
    expect(cell!.score).toBe(5);
  });

  it("不存在的 task 返回 undefined", () => {
    const cell = getScore("claude-code", "nonexistent-task-xyz");
    expect(cell).toBeUndefined();
  });

  it("不存在的 task (cursor) 返回 undefined", () => {
    const cell = getScore("cursor", "fake-task");
    expect(cell).toBeUndefined();
  });
});

describe("aggregateScore", () => {
  it("claude-code 综合分在合理范围 [1, 5]", () => {
    const score = aggregateScore("claude-code");
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(5);
  });

  it("aider 综合分在合理范围 [1, 5]", () => {
    const score = aggregateScore("aider");
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(5);
  });

  it("不存在 tool 返回 0 (零除保护)", () => {
    // ToolKey 是 union, 用 as any 模拟不存在的 key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const score = aggregateScore("no-such-tool" as any);
    expect(score).toBe(0);
  });

  it("claude-code 综合分手动计算自洽: (5+5+4+4+5)/5 = 4.6", () => {
    // claude-code 的 5 个 task 分别: 5, 5, 4, 4, 5
    const expected = (5 + 5 + 4 + 4 + 5) / 5;
    expect(aggregateScore("claude-code")).toBeCloseTo(expected, 10);
  });
});

describe("SCORES 数据一致性", () => {
  const toolKeys = new Set(TOOLS.map((t) => t.key));
  const taskIds = new Set(TASKS.map((t) => t.id));

  it("每条 SCORES 的 tool key 都 ∈ TOOLS 的 key 集合", () => {
    for (const cell of SCORES) {
      expect(toolKeys.has(cell.tool)).toBe(true);
    }
  });

  it("每条 SCORES 的 task id 都 ∈ TASKS 的 id 集合", () => {
    for (const cell of SCORES) {
      expect(taskIds.has(cell.task)).toBe(true);
    }
  });
});
