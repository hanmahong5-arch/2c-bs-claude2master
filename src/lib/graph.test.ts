import { describe, expect, test } from "bun:test";
import {
  buildConceptGraph,
  clipVisual,
  forceLayout,
  layoutMindMap,
  neighborsOf,
  relatedByGraph,
  normalizeEntity,
  sanitizeGraph,
  textWidth,
  wrapLabel,
  type ArticleGraph,
  type GraphDoc,
} from "./graph";

const RAW = {
  center: "LangGraph 多智能体编排",
  branches: [
    { label: "状态图", detail: "用有向图描述 agent 步骤", children: ["节点=函数", "边=条件跳转"] },
    { label: "持久化", detail: "checkpoint 让长任务可恢复", children: ["断点续跑"] },
    { label: "人在回路", detail: "关键步骤暂停等人确认", children: [] },
  ],
  flow: ["接收任务", "规划", "调用工具", "汇总"],
  entities: [
    { name: "LangGraph", type: "product" },
    { name: "LangChain", type: "company" },
    { name: "checkpoint", type: "technique" },
    { name: "langgraph", type: "product" }, // 与首个重复 → 去重
    { name: "Foo", type: "weird-type" }, // 非法 type → concept
  ],
  relations: [
    { from: "LangChain", to: "LangGraph", label: "开发" },
    { from: "LangGraph", to: "Nope", label: "悬空" }, // 端点不存在 → 丢
    { from: "LangGraph", to: "langgraph", label: "自环" }, // 自环 → 丢
  ],
};

describe("sanitizeGraph", () => {
  test("合法骨架保留, 去重实体, 非法 type 兜底 concept, 悬空/自环关系丢弃", () => {
    const g = sanitizeGraph(RAW)!;
    expect(g.center).toBe("LangGraph 多智能体编排");
    expect(g.branches).toHaveLength(3);
    expect(g.flow).toHaveLength(4);
    expect(g.entities.map((e) => e.name)).toEqual(["LangGraph", "LangChain", "checkpoint", "Foo"]);
    expect(g.entities[3].type).toBe("concept");
    expect(g.relations).toEqual([{ from: "LangChain", to: "LangGraph", label: "开发" }]);
  });

  test("无中心 / 分支不足 2 → null", () => {
    expect(sanitizeGraph(null)).toBeNull();
    expect(sanitizeGraph({ ...RAW, center: "" })).toBeNull();
    expect(sanitizeGraph({ ...RAW, branches: [RAW.branches[0]] })).toBeNull();
  });

  test("流程少于 3 步视为无流程; 超长文本截断带省略号", () => {
    const g = sanitizeGraph({ ...RAW, flow: ["a", "b"], center: "字".repeat(40) })!;
    expect(g.flow).toEqual([]);
    expect([...g.center]).toHaveLength(18); // 17 字 + "…"
    expect(g.center.endsWith("…")).toBe(true);
  });

  test("分支 / 子节点数量上限", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      label: `b${i}`,
      detail: "",
      children: ["1", "2", "3", "4", "5"],
    }));
    const g = sanitizeGraph({ ...RAW, branches: many })!;
    expect(g.branches).toHaveLength(5);
    expect(g.branches[0].children).toHaveLength(3);
  });
});

describe("clipVisual", () => {
  test("按视觉宽度: 英文名不被过早截断", () => {
    // 宽度 ≈ 19.2em: 按字符数 (22) 会被 18 截断, 按视觉宽度 20 放得下
    expect(clipVisual("Jev：TypeSafe AI 的 System One 模型", 20)).toBe("Jev：TypeSafe AI 的 System One 模型");
    expect(clipVisual("Jev：TypeSafe AI 的 System One 模型", 18)).toBe("Jev：TypeSafe AI 的 System…");
  });
  test("超宽时回退到英文词边界, 不切半个单词", () => {
    const out = clipVisual("Building a Harness with Jev for production agents", 15);
    expect(out.endsWith("…")).toBe(true);
    expect(out.replace("…", "").trim().split(" ").every((w) => "Building a Harness with Jev for production agents".split(" ").includes(w))).toBe(true);
  });
  test("非字符串 → 空串", () => {
    expect(clipVisual(42, 10)).toBe("");
  });
});

describe("normalizeEntity", () => {
  test("大小写 / 空白 / 别名归一", () => {
    expect(normalizeEntity("Claude Code")).toBe("claude-code");
    expect(normalizeEntity("claude_code")).toBe("claude-code");
    expect(normalizeEntity("Model Context Protocol")).toBe("mcp");
    expect(normalizeEntity("LLMs")).toBe("llm");
    expect(normalizeEntity("大模型")).toBe("llm");
    expect(normalizeEntity("The Agents")).toBe("agent");
    expect(normalizeEntity("GPT-5")).toBe("gpt-5");
    expect(normalizeEntity("C#")).toBe("c#");
  });
});

describe("textWidth", () => {
  test("CJK 按 1em, ASCII 按 ~0.58em", () => {
    expect(textWidth("中文", 10)).toBe(20);
    expect(textWidth("ab", 10)).toBe(12);
  });
});

describe("wrapLabel", () => {
  test("短标签单行", () => {
    expect(wrapLabel("Jev 是什么", 9)).toEqual(["Jev 是什么"]);
  });
  test("CJK 逐字折行, 每行不超宽", () => {
    const lines = wrapLabel("分类任务上快两百倍成本低四百分之一", 9);
    expect(lines).toEqual(["分类任务上快两百倍", "成本低四百分之一"]);
  });
  test("拉丁按词断, 不切半个单词", () => {
    const lines = wrapLabel("Building a Harness with Jev", 12); // 细节列宽 12em → 两行放得下
    expect(lines.join(" ")).toBe("Building a Harness with Jev");
    for (const l of lines) expect(l.startsWith(" ") || l.endsWith(" ")).toBe(false);
  });
  test("超出行数 → 末行省略号", () => {
    const lines = wrapLabel("一二三四五六七八九十一二三四五六七八九十一二三四五", 9, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });
  test("超长单词硬切", () => {
    const lines = wrapLabel("ModelRouterMiddlewareAutoMode", 9, 3);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("").replace("…", "")).toContain("ModelRouter");
  });
});

describe("layoutMindMap", () => {
  const g = sanitizeGraph(RAW) as ArticleGraph;
  const L = layoutMindMap(g);

  test("节点数 = 1 中心 + 分支 + 子节点; 边数 = 节点数 - 1", () => {
    const kids = g.branches.reduce((a, b) => a + b.children.length, 0);
    expect(L.nodes).toHaveLength(1 + g.branches.length + kids);
    expect(L.edges).toHaveLength(L.nodes.length - 1);
  });

  test("所有节点落在画布内, 列从左到右递增", () => {
    for (const n of L.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.x + n.w).toBeLessThanOrEqual(L.width);
      expect(n.y + n.h).toBeLessThanOrEqual(L.height);
    }
    const x = (lv: number) => L.nodes.find((n) => n.level === lv)!.x;
    expect(x(0)).toBeLessThan(x(1));
    expect(x(1)).toBeLessThan(x(2));
  });

  test("同列节点纵向不重叠", () => {
    for (const lv of [1, 2] as const) {
      const col = L.nodes.filter((n) => n.level === lv).sort((a, b) => a.y - b.y);
      for (let i = 1; i < col.length; i++) {
        expect(col[i].y).toBeGreaterThanOrEqual(col[i - 1].y + col[i - 1].h);
      }
    }
  });

  test("确定性: 同输入同输出", () => {
    expect(layoutMindMap(g)).toEqual(L);
  });

  test("无子节点时不留第三列宽度", () => {
    const flat = { ...g, branches: g.branches.map((b) => ({ ...b, children: [] })) };
    const L2 = layoutMindMap(flat);
    expect(L2.nodes.every((n) => n.level < 2)).toBe(true);
    expect(L2.width).toBeLessThan(L.width);
  });
});

function doc(slug: string, date: string, names: string[], rel: [string, string, string][] = []): GraphDoc {
  return {
    slug,
    title: slug,
    publishedAt: date,
    graph: {
      center: slug,
      branches: [],
      flow: [],
      entities: names.map((name) => ({ name, type: "product" as const })),
      relations: rel.map(([from, to, label]) => ({ from, to, label })),
    },
  };
}

describe("buildConceptGraph", () => {
  const docs = [
    doc("a", "2026-09-01", ["Claude Code", "MCP"], [["Claude Code", "MCP", "支持"]]),
    doc("b", "2026-09-03", ["claude code", "Model Context Protocol", "Cursor"]),
    doc("c", "2026-09-02", ["Cursor", "Claude Code"]),
    doc("d", "2026-09-04", ["Lonely"]),
  ];
  const G = buildConceptGraph(docs, { minCount: 2, width: 400, height: 300 });

  test("按归一化 key 聚合计数, 低于 minCount 的丢弃", () => {
    const byKey = Object.fromEntries(G.nodes.map((n) => [n.key, n]));
    expect(Object.keys(byKey).sort()).toEqual(["claude-code", "cursor", "mcp"]);
    expect(byKey["claude-code"].count).toBe(3);
    expect(byKey["mcp"].count).toBe(2);
  });

  test("slugs 按日期倒序; 展示名取最高频写法", () => {
    const cc = G.nodes.find((n) => n.key === "claude-code")!;
    expect(cc.slugs).toEqual(["b", "c", "a"]);
    expect(["Claude Code", "claude code"]).toContain(cc.name);
  });

  test("共现 +1, 显式关系 +2 并带标签", () => {
    const e = G.edges.find((x) => [x.a, x.b].sort().join() === "claude-code,mcp")!;
    expect(e.weight).toBe(1 + 1 + 2); // a 共现 + b 共现 + a 关系
    expect(e.label).toBe("支持");
  });

  test("坐标在画布内且确定", () => {
    for (const n of G.nodes) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(400);
      expect(n.y).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(300);
    }
    expect(buildConceptGraph(docs, { minCount: 2, width: 400, height: 300 })).toEqual(G);
  });

  test("neighborsOf 按权重排序", () => {
    const nb = neighborsOf(G, "claude-code");
    expect(nb[0].node.key).toBe("mcp");
    expect(nb.map((x) => x.node.key)).toContain("cursor");
  });
});

describe("relatedByGraph", () => {
  const docs = [
    doc("t", "2026-09-10", ["LangGraph", "LLM", "checkpoint"]),
    doc("x", "2026-09-01", ["LangGraph", "checkpoint"]), // 共享 2 个稀有实体
    doc("y", "2026-09-09", ["LLM"]), // 只共享泛词
    doc("z", "2026-09-08", ["LLM", "Cursor"]),
    doc("w", "2026-09-07", ["LLM"]),
    doc("u", "2026-09-06", ["Nothing"]),
  ];
  test("稀有共享实体优先, 无共享不入选, 不含自身", () => {
    const r = relatedByGraph("t", docs, 10);
    expect(r[0].doc.slug).toBe("x");
    expect(r[0].shared.sort()).toEqual(["LangGraph", "checkpoint"].sort());
    expect(r.map((x) => x.doc.slug)).not.toContain("t");
    expect(r.map((x) => x.doc.slug)).not.toContain("u");
  });
  test("同分按日期新→旧; limit 生效", () => {
    const r = relatedByGraph("t", docs, 10).filter((x) => x.shared.length === 1);
    expect(r.map((x) => x.doc.slug)).toEqual(["y", "z", "w"]);
    expect(relatedByGraph("t", docs, 2)).toHaveLength(2);
  });
  test("未知 slug → 空", () => {
    expect(relatedByGraph("nope", docs)).toEqual([]);
  });
});

describe("forceLayout", () => {
  test("空输入不炸; 气泡不严重重叠", () => {
    expect(forceLayout([], [], { width: 100, height: 100 }).size).toBe(0);
    const nodes = Array.from({ length: 30 }, (_, i) => ({ key: `n${i}`, r: 10 }));
    const pos = forceLayout(nodes, [], { width: 800, height: 600 });
    const pts = [...pos.values()];
    let overlaps = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < 20) overlaps++;
    expect(overlaps).toBe(0);
  });
});
