// graph.ts — 文章知识图谱: 类型 + 边界校验 + 思维导图布局 + 全站概念图聚合 / 力导布局。
//
// 纯函数层 (无 IO / 无 React), 数据来自 summarize.ts 的 LLM 抽取 (src/content/graph/<slug>.json)。
// LLM 输出一律经 sanitizeGraph 在边界收敛一次, 之后内部信任。
// 布局在构建期 (SSG) 算好坐标, 客户端组件只负责画与动效 → 首屏无计算抖动、确定性可测。

export const ENTITY_TYPES = [
  "company",
  "product",
  "model",
  "person",
  "concept",
  "technique",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface MindBranch {
  label: string;
  detail: string;
  children: string[];
}

export interface GraphEntity {
  name: string;
  type: EntityType;
}

export interface GraphRelation {
  from: string;
  to: string;
  label: string;
}

export interface ArticleGraph {
  center: string;
  branches: MindBranch[];
  /** 文章描述了流程/方法/数据流时的 3–6 步; 否则空数组 */
  flow: string[];
  entities: GraphEntity[];
  relations: GraphRelation[];
}

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  company: "公司",
  product: "产品",
  model: "模型",
  person: "人物",
  concept: "概念",
  technique: "方法",
};

// ── 边界校验 ────────────────────────────────────────────────────────────────

// 文本上限按「视觉宽度 em」计 (CJK=1, 拉丁≈0.58): 英文产品名不会被按字符数过早截断。
// 节点文字上限 = 两行 × MIND_STYLE.perLine (中心 2×9 / 分支 2×7.5 / 细节 2×12)。
const LIMITS = {
  center: 18,
  branchLabel: 15,
  branchDetail: 60,
  child: 24,
  flowStep: 16,
  entity: 28,
  relation: 7,
  branches: 5,
  children: 3,
  flow: 6,
  entities: 8,
  relations: 6,
} as const;

const CJK_RE = /[⺀-鿿豈-﫿＀-￯　-〿]/;

function charEm(ch: string): number {
  return CJK_RE.test(ch) ? 1 : 0.58;
}

/** 超过 maxEm 视觉宽度则截断加 "…"; 截点落在英文单词中间时回退到词边界。 */
export function clipVisual(v: unknown, maxEm: number): string {
  if (typeof v !== "string") return "";
  const s = v.replace(/\s+/g, " ").trim();
  const chars = [...s];
  let w = 0;
  for (const ch of chars) w += charEm(ch);
  if (w <= maxEm) return s;
  let out = "";
  w = 0;
  let i = 0;
  for (; i < chars.length; i++) {
    const cw = charEm(chars[i]);
    if (w + cw > maxEm - 1) break;
    out += chars[i];
    w += cw;
  }
  if (/[A-Za-z0-9]$/.test(out) && /^[A-Za-z0-9]/.test(chars[i] ?? "")) {
    const trimmed = out.replace(/[A-Za-z0-9._+-]+$/, "");
    // 整段都是一个长单词时保留硬截断, 否则回退到词边界
    if (trimmed.trim()) out = trimmed;
  }
  return out.replace(/[\s，,、；;:：]+$/, "") + "…";
}

const clip = clipVisual;

function isEntityType(v: unknown): v is EntityType {
  return typeof v === "string" && (ENTITY_TYPES as readonly string[]).includes(v);
}

/**
 * 把 LLM 的 JSON 收敛成合法 ArticleGraph; 骨架不成立 (无中心 / 分支 <2) 返回 null。
 * 超长文本截断, 非法条目丢弃, relation 端点必须是已声明实体 (防悬空边)。
 */
export function sanitizeGraph(raw: unknown): ArticleGraph | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const center = clip(o.center, LIMITS.center);
  if (!center) return null;

  const branches: MindBranch[] = [];
  for (const b of Array.isArray(o.branches) ? o.branches : []) {
    if (!b || typeof b !== "object") continue;
    const bo = b as Record<string, unknown>;
    const label = clip(bo.label, LIMITS.branchLabel);
    if (!label) continue;
    const children = (Array.isArray(bo.children) ? bo.children : [])
      .map((c) => clip(c, LIMITS.child))
      .filter(Boolean)
      .slice(0, LIMITS.children);
    branches.push({ label, detail: clip(bo.detail, LIMITS.branchDetail), children });
    if (branches.length >= LIMITS.branches) break;
  }
  if (branches.length < 2) return null;

  const flowRaw = (Array.isArray(o.flow) ? o.flow : [])
    .map((s) => clip(s, LIMITS.flowStep))
    .filter(Boolean)
    .slice(0, LIMITS.flow);
  // 少于 3 步不成「流程」, 画出来只是两个方块, 不如不画
  const flow = flowRaw.length >= 3 ? flowRaw : [];

  const entities: GraphEntity[] = [];
  const seenKeys = new Set<string>();
  for (const e of Array.isArray(o.entities) ? o.entities : []) {
    if (!e || typeof e !== "object") continue;
    const eo = e as Record<string, unknown>;
    const name = clip(eo.name, LIMITS.entity);
    const key = normalizeEntity(name);
    if (!name || !key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    entities.push({ name, type: isEntityType(eo.type) ? eo.type : "concept" });
    if (entities.length >= LIMITS.entities) break;
  }

  const relations: GraphRelation[] = [];
  for (const r of Array.isArray(o.relations) ? o.relations : []) {
    if (!r || typeof r !== "object") continue;
    const ro = r as Record<string, unknown>;
    const from = entities.find((e) => normalizeEntity(e.name) === normalizeEntity(clip(ro.from, LIMITS.entity)));
    const to = entities.find((e) => normalizeEntity(e.name) === normalizeEntity(clip(ro.to, LIMITS.entity)));
    if (!from || !to || from === to) continue;
    relations.push({ from: from.name, to: to.name, label: clip(ro.label, LIMITS.relation) });
    if (relations.length >= LIMITS.relations) break;
  }

  return { center, branches, flow, entities, relations };
}

// ── 实体归一化 ─────────────────────────────────────────────────────────────

// 同一实体的常见写法 → 规范 key。只收高频且无歧义的; 其余靠大小写/空白/连字符归一。
const ALIASES: Record<string, string> = {
  "claude-code-cli": "claude-code",
  "anthropic-claude": "claude",
  "openai-codex": "codex",
  "codex-cli": "codex",
  "gpt5": "gpt-5",
  "model-context-protocol": "mcp",
  "retrieval-augmented-generation": "rag",
  "large-language-model": "llm",
  "large-language-models": "llm",
  "llms": "llm",
  "ai-agents": "ai-agent",
  "agents": "agent",
  "ai-agent": "agent",
  "智能体": "agent",
  "大模型": "llm",
  "大语言模型": "llm",
  "google-deepmind": "deepmind",
  "hugging-face": "huggingface",
  "langchain-ai": "langchain",
};

/** 实体名 → 去重/聚合用的规范 key (小写, 空白与标点折成 -, 套别名表)。 */
export function normalizeEntity(name: string): string {
  const k = name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[\s_./·]+/g, "-")
    .replace(/[^\p{L}\p{N}+#-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return ALIASES[k] ?? k;
}

// ── 文本宽度估算 (SVG 无法在构建期量字; CJK≈1em, 其余≈0.58em) ──────────────

export function textWidth(s: string, fontSize: number): number {
  let w = 0;
  for (const ch of s) w += charEm(ch) * fontSize;
  return Math.ceil(w);
}

// ── 思维导图布局 (logic chart: 中心在左, 分支向右展开) ───────────────────────

/**
 * 贪心折行: CJK 逐字可断, 拉丁按单词断 (单词本身超宽才硬切); 超出 maxLines 时末行加 "…"。
 * 宽度按 em 估算 (charEm), 与 textWidth 同口径。
 */
export function wrapLabel(label: string, maxEm: number, maxLines = 2): string[] {
  const tokens = label.match(/[A-Za-z0-9][A-Za-z0-9._+#/'’-]*\s*|\s+|./gu) ?? [];
  const lines: string[] = [];
  let cur = "";
  let curW = 0;
  const emOf = (t: string) => [...t].reduce((a, ch) => a + charEm(ch), 0);
  const push = () => {
    lines.push(cur.trimEnd());
    cur = "";
    curW = 0;
  };
  for (const tok of tokens) {
    let t = tok;
    const w = emOf(t);
    if (!cur && /^\s+$/.test(t)) continue; // 行首空白丢弃
    if (curW + emOf(t.trimEnd()) <= maxEm) {
      cur += t;
      curW += w;
      continue;
    }
    if (cur) push();
    if (/^\s+$/.test(t)) continue;
    // 单个 token 比整行还宽 → 硬切
    while (emOf(t.trimEnd()) > maxEm) {
      let head = "";
      let hw = 0;
      for (const ch of t) {
        if (hw + charEm(ch) > maxEm) break;
        head += ch;
        hw += charEm(ch);
      }
      lines.push(head);
      t = t.slice(head.length);
    }
    cur = t;
    curW = emOf(t);
  }
  if (cur.trim()) push();
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = clipVisual(kept[maxLines - 1] + " " + lines[maxLines], maxEm);
  if (!kept[maxLines - 1].endsWith("…")) kept[maxLines - 1] += "…";
  return kept;
}

export interface MindNode {
  id: string;
  /** 已折行的标签 (1–2 行) */
  lines: string[];
  level: 0 | 1 | 2;
  /** 所属分支序号 (中心为 -1), 用于配色 */
  branch: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 出现顺序, 驱动 stagger 动效 */
  order: number;
}

export interface MindEdge {
  id: string;
  d: string;
  branch: number;
  level: 1 | 2;
  order: number;
}

export interface MindLayout {
  width: number;
  height: number;
  nodes: MindNode[];
  edges: MindEdge[];
}

// 每级: 字号 / 行高 / 每行最大 em / 横向内边距 / 纵向内边距
export const MIND_STYLE = [
  { font: 16, lineH: 21, perLine: 9, hPad: 16, vPad: 11 },
  { font: 14, lineH: 19, perLine: 7.5, hPad: 13, vPad: 8 },
  { font: 13, lineH: 18, perLine: 12, hPad: 10, vPad: 6 },
] as const;

const MIND = {
  padX: 12,
  padY: 12,
  colGap: 48,
  childGap: 8,
  branchGap: 18,
};

function measure(label: string, level: 0 | 1 | 2): { lines: string[]; w: number; h: number } {
  const st = MIND_STYLE[level];
  const lines = wrapLabel(label, st.perLine, 2);
  const w = Math.max(...lines.map((l) => textWidth(l, st.font))) + st.hPad * 2;
  const h = lines.length * st.lineH + st.vPad * 2;
  return { lines, w: Math.ceil(w), h };
}

// 横向三次贝塞尔: 从父节点右缘中点到子节点左缘中点
function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

/** 确定性布局; 同一输入永远同一坐标 (SSG 与客户端一致, 无水合差异)。 */
export function layoutMindMap(g: ArticleGraph): MindLayout {
  const center = measure(g.center, 0);
  const branches = g.branches.map((b) => ({
    m: measure(b.label, 1),
    kids: b.children.map((c) => measure(c, 2)),
  }));
  const col1W = Math.max(...branches.map((b) => b.m.w));
  const col2W = Math.max(0, ...branches.flatMap((b) => b.kids.map((k) => k.w)));

  // 每个分支占的纵向带宽 = max(分支节点高, 子节点列总高)
  const kidsHeight = (kids: { h: number }[]) =>
    kids.reduce((a, k) => a + k.h, 0) + Math.max(0, kids.length - 1) * MIND.childGap;
  const bands = branches.map((b) => Math.max(b.m.h, kidsHeight(b.kids)));
  const contentH =
    bands.reduce((a, b) => a + b, 0) + (bands.length - 1) * MIND.branchGap;
  const height = Math.max(contentH, center.h) + MIND.padY * 2;

  const x0 = MIND.padX;
  const x1 = x0 + center.w + MIND.colGap;
  const x2 = x1 + col1W + MIND.colGap;
  const width = (col2W > 0 ? x2 + col2W : x1 + col1W) + MIND.padX;

  const cy = height / 2;
  const nodes: MindNode[] = [
    {
      id: "c",
      lines: center.lines,
      level: 0,
      branch: -1,
      x: x0,
      y: cy - center.h / 2,
      w: center.w,
      h: center.h,
      order: 0,
    },
  ];
  const edges: MindEdge[] = [];

  let order = 1;
  let yCursor = (height - contentH) / 2;
  branches.forEach((b, bi) => {
    const band = bands[bi];
    const by = yCursor + band / 2;
    nodes.push({
      id: `b${bi}`,
      lines: b.m.lines,
      level: 1,
      branch: bi,
      x: x1,
      y: by - b.m.h / 2,
      w: b.m.w,
      h: b.m.h,
      order,
    });
    edges.push({
      id: `e-c-b${bi}`,
      d: curve(x0 + center.w, cy, x1, by),
      branch: bi,
      level: 1,
      order,
    });
    order++;

    let ky = by - kidsHeight(b.kids) / 2;
    b.kids.forEach((k, ci) => {
      nodes.push({
        id: `b${bi}c${ci}`,
        lines: k.lines,
        level: 2,
        branch: bi,
        x: x2,
        y: ky,
        w: k.w,
        h: k.h,
        order,
      });
      edges.push({
        id: `e-b${bi}-c${ci}`,
        d: curve(x1 + b.m.w, by, x2, ky + k.h / 2),
        branch: bi,
        level: 2,
        order,
      });
      order++;
      ky += k.h + MIND.childGap;
    });
    yCursor += band + MIND.branchGap;
  });

  return { width: Math.ceil(width), height: Math.ceil(height), nodes, edges };
}

// ── 全站概念图 ─────────────────────────────────────────────────────────────

export interface GraphDoc {
  slug: string;
  title: string;
  publishedAt: string;
  graph: ArticleGraph;
}

export interface ConceptNode {
  key: string;
  name: string;
  type: EntityType;
  /** 提及该概念的文章数 */
  count: number;
  /** 按日期倒序的文章 slug */
  slugs: string[];
  x: number;
  y: number;
  r: number;
}

export interface ConceptEdge {
  a: string;
  b: string;
  weight: number;
  /** 显式关系标签 (LLM 抽到的 relation), 多个取最高频 */
  label?: string;
}

export interface ConceptGraph {
  width: number;
  height: number;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

function pickMostFrequent(m: Map<string, number>): string {
  let best = "";
  let bestN = -1;
  for (const [k, n] of m) {
    if (n > bestN || (n === bestN && k < best)) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
}

/**
 * 聚合全部文章图谱 → 概念共现图。节点 = 被 ≥minCount 篇提及的实体 (取 top maxNodes);
 * 边 = 同篇共现 (+1) 与显式 relation (+2)。坐标由 forceLayout 确定性生成。
 */
export function buildConceptGraph(
  docs: GraphDoc[],
  opts: { maxNodes?: number; minCount?: number; maxEdges?: number; width?: number; height?: number } = {},
): ConceptGraph {
  const maxNodes = opts.maxNodes ?? 80;
  const minCount = opts.minCount ?? 2;
  const maxEdges = opts.maxEdges ?? 220;
  const width = opts.width ?? 960;
  const height = opts.height ?? 640;

  const sorted = [...docs].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a.slug < b.slug ? -1 : 1,
  );

  const acc = new Map<
    string,
    { names: Map<string, number>; types: Map<string, number>; slugs: string[] }
  >();
  for (const d of sorted) {
    const keysInDoc = new Set<string>();
    for (const e of d.graph.entities) {
      const key = normalizeEntity(e.name);
      if (!key || keysInDoc.has(key)) continue;
      keysInDoc.add(key);
      const a = acc.get(key) ?? { names: new Map<string, number>(), types: new Map<string, number>(), slugs: [] as string[] };
      a.names.set(e.name, (a.names.get(e.name) ?? 0) + 1);
      a.types.set(e.type, (a.types.get(e.type) ?? 0) + 1);
      a.slugs.push(d.slug);
      acc.set(key, a);
    }
  }

  const ranked = [...acc.entries()]
    .filter(([, a]) => a.slugs.length >= minCount)
    .sort((x, y) => y[1].slugs.length - x[1].slugs.length || (x[0] < y[0] ? -1 : 1))
    .slice(0, maxNodes);
  const kept = new Set(ranked.map(([k]) => k));

  const weights = new Map<string, { w: number; labels: Map<string, number> }>();
  const bump = (a: string, b: string, w: number, label?: string) => {
    if (a === b || !kept.has(a) || !kept.has(b)) return;
    const k = edgeKey(a, b);
    const cur = weights.get(k) ?? { w: 0, labels: new Map<string, number>() };
    cur.w += w;
    if (label) cur.labels.set(label, (cur.labels.get(label) ?? 0) + 1);
    weights.set(k, cur);
  };
  for (const d of sorted) {
    const keys = [...new Set(d.graph.entities.map((e) => normalizeEntity(e.name)))];
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) bump(keys[i], keys[j], 1);
    for (const r of d.graph.relations)
      bump(normalizeEntity(r.from), normalizeEntity(r.to), 2, r.label || undefined);
  }

  const edges: ConceptEdge[] = [...weights.entries()]
    .map(([k, v]) => {
      const [a, b] = k.split("\u0000");
      const label = v.labels.size > 0 ? pickMostFrequent(v.labels) : undefined;
      return label ? { a, b, weight: v.w, label } : { a, b, weight: v.w };
    })
    .sort((x, y) => y.weight - x.weight || (x.a + x.b < y.a + y.b ? -1 : 1))
    .slice(0, maxEdges);

  const maxCount = Math.max(1, ...ranked.map(([, a]) => a.slugs.length));
  const baseNodes = ranked.map(([key, a]) => ({
    key,
    name: pickMostFrequent(a.names),
    type: (pickMostFrequent(a.types) as EntityType) || "concept",
    count: a.slugs.length,
    slugs: a.slugs,
    r: 6 + 16 * Math.sqrt(a.slugs.length / maxCount),
  }));

  const pos = forceLayout(
    baseNodes.map((n) => ({ key: n.key, r: n.r })),
    edges,
    { width, height },
  );
  const nodes: ConceptNode[] = baseNodes.map((n) => ({ ...n, ...pos.get(n.key)! }));
  return { width, height, nodes, edges };
}

// ── 确定性力导布局 (Fruchterman–Reingold + 碰撞 + 向心力, 种子固定) ──────────

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function forceLayout(
  nodes: { key: string; r: number }[],
  edges: { a: string; b: string; weight: number }[],
  opts: { width: number; height: number; iterations?: number; seed?: number },
): Map<string, { x: number; y: number }> {
  const { width, height } = opts;
  const iterations = opts.iterations ?? 300;
  const rand = mulberry32(opts.seed ?? 42);
  const n = nodes.length;
  const out = new Map<string, { x: number; y: number }>();
  if (n === 0) return out;

  const idx = new Map(nodes.map((nd, i) => [nd.key, i]));
  // 初始: 黄金角螺旋 + 微扰 → 稳定且不重叠
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const rad = Math.sqrt((i + 0.5) / n) * Math.min(width, height) * 0.45;
    xs[i] = width / 2 + rad * Math.cos(i * golden) + (rand() - 0.5);
    ys[i] = height / 2 + rad * Math.sin(i * golden) + (rand() - 0.5);
  }

  const area = width * height;
  const k = Math.sqrt(area / n) * 0.75;
  const maxW = Math.max(1, ...edges.map((e) => e.weight));
  const E = edges
    .map((e) => ({ i: idx.get(e.a), j: idx.get(e.b), w: e.weight / maxW }))
    .filter((e): e is { i: number; j: number; w: number } => e.i !== undefined && e.j !== undefined);

  const dx = new Float64Array(n);
  const dy = new Float64Array(n);
  let temp = Math.min(width, height) / 8;
  const cool = temp / (iterations + 1);

  for (let it = 0; it < iterations; it++) {
    dx.fill(0);
    dy.fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let ddx = xs[i] - xs[j];
        let ddy = ys[i] - ys[j];
        let dist = Math.hypot(ddx, ddy);
        if (dist < 0.01) {
          ddx = 0.01 * (i - j);
          ddy = 0.01;
          dist = Math.hypot(ddx, ddy);
        }
        let f = (k * k) / dist;
        // 碰撞: 圆重叠时加强斥力, 保证气泡与标签不叠
        const minD = nodes[i].r + nodes[j].r + 14;
        if (dist < minD) f += (minD - dist) * 2;
        const fx = (ddx / dist) * f;
        const fy = (ddy / dist) * f;
        dx[i] += fx;
        dy[i] += fy;
        dx[j] -= fx;
        dy[j] -= fy;
      }
    }
    for (const e of E) {
      const ddx = xs[e.i] - xs[e.j];
      const ddy = ys[e.i] - ys[e.j];
      const dist = Math.max(0.01, Math.hypot(ddx, ddy));
      const f = ((dist * dist) / k) * (0.3 + 0.7 * e.w);
      const fx = (ddx / dist) * f;
      const fy = (ddy / dist) * f;
      dx[e.i] -= fx;
      dy[e.i] -= fy;
      dx[e.j] += fx;
      dy[e.j] += fy;
    }
    for (let i = 0; i < n; i++) {
      // 向心力: 防孤立节点飘出画布
      dx[i] += (width / 2 - xs[i]) * 0.02 * k * 0.1;
      dy[i] += (height / 2 - ys[i]) * 0.02 * k * 0.1;
      const disp = Math.hypot(dx[i], dy[i]);
      if (disp > 0) {
        const step = Math.min(disp, temp);
        xs[i] += (dx[i] / disp) * step;
        ys[i] += (dy[i] / disp) * step;
      }
      const m = nodes[i].r + 40; // 右侧留标签空间
      xs[i] = Math.min(width - m, Math.max(nodes[i].r + 4, xs[i]));
      ys[i] = Math.min(height - nodes[i].r - 18, Math.max(nodes[i].r + 4, ys[i]));
    }
    temp -= cool;
  }

  nodes.forEach((nd, i) => out.set(nd.key, { x: Math.round(xs[i] * 10) / 10, y: Math.round(ys[i] * 10) / 10 }));
  return out;
}

/**
 * 相关阅读: 与目标文章共享实体越多、越稀有 (IDF)、越新越靠前。
 * 稀有度加权防「LLM / agent」这类泛词把所有文章连成一片。
 */
export function relatedByGraph(
  slug: string,
  docs: GraphDoc[],
  limit = 4,
): { doc: GraphDoc; shared: string[]; score: number }[] {
  const target = docs.find((d) => d.slug === slug);
  if (!target) return [];
  const keysOf = (d: GraphDoc) => new Set(d.graph.entities.map((e) => normalizeEntity(e.name)));
  const df = new Map<string, number>();
  for (const d of docs) for (const k of keysOf(d)) df.set(k, (df.get(k) ?? 0) + 1);
  const N = docs.length;
  const tKeys = keysOf(target);
  const nameOf = new Map(target.graph.entities.map((e) => [normalizeEntity(e.name), e.name]));

  return docs
    .filter((d) => d.slug !== slug)
    .map((d) => {
      const shared = [...keysOf(d)].filter((k) => tKeys.has(k));
      const score = shared.reduce((a, k) => a + Math.log(1 + N / (df.get(k) ?? 1)), 0);
      return { doc: d, shared: shared.map((k) => nameOf.get(k) ?? k), score };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.doc.publishedAt < b.doc.publishedAt ? 1 : a.doc.publishedAt > b.doc.publishedAt ? -1 : 0),
    )
    .slice(0, limit);
}

/** 概念邻居 (按边权降序), 供侧栏「相关概念」 */
export function neighborsOf(g: ConceptGraph, key: string, limit = 8): { node: ConceptNode; weight: number; label?: string }[] {
  const byKey = new Map(g.nodes.map((n) => [n.key, n]));
  return g.edges
    .filter((e) => e.a === key || e.b === key)
    .map((e) => ({ node: byKey.get(e.a === key ? e.b : e.a)!, weight: e.weight, label: e.label }))
    .filter((x) => x.node)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}
