"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useUrlFilter } from "@/lib/use-url-filter";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABEL,
  type ConceptGraph,
  type EntityType,
} from "@/lib/graph";
import { ENTITY_COLORS } from "./palette";

export interface ArticleMeta {
  title: string;
  publishedAt: string;
  hook: string;
}

// 全站 AI 知识图谱: 概念 = 节点 (大小 ∝ 被多少篇文章提及), 边 = 同篇共现 / 显式关系。
// 坐标由服务端力导布局预算; 这里做:
// - 入场: 节点按热度从中心依次「绽开」, 连线随后淡入
// - 悬停: 高亮该概念及其一跳邻居, 其余淡出 (看清「谁和谁有关」)
// - 点击: 右侧 (手机为下方) 面板列出相关文章 + 相邻概念, 可继续跳转漫游; ?c=<key> 可分享
// - 搜索 / 类型筛选

const LABEL_TOP_N = 28;

export default function ConceptGraphView({
  graph,
  articles,
}: {
  graph: ConceptGraph;
  articles: Record<string, ArticleMeta>;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<EntityType>>(() => new Set(ENTITY_TYPES));

  const byKey = useMemo(() => new Map(graph.nodes.map((n) => [n.key, n])), [graph.nodes]);
  const adjacency = useMemo(() => {
    const m = new Map<string, Map<string, { weight: number; label?: string }>>();
    for (const e of graph.edges) {
      if (!m.has(e.a)) m.set(e.a, new Map());
      if (!m.has(e.b)) m.set(e.b, new Map());
      m.get(e.a)!.set(e.b, { weight: e.weight, label: e.label });
      m.get(e.b)!.set(e.a, { weight: e.weight, label: e.label });
    }
    return m;
  }, [graph.edges]);
  const rank = useMemo(() => {
    const sorted = [...graph.nodes].sort((a, b) => b.count - a.count);
    return new Map(sorted.map((n, i) => [n.key, i]));
  }, [graph.nodes]);

  // ?c=<key> 深链 / 可分享选中态 (useUrlFilter: 首屏按无选中静态渲染, 挂载后应用 URL)
  const [selectedRaw, setSelectedRaw] = useUrlFilter<string>("c", (raw) => byKey.has(raw), "");
  const selected = selectedRaw || null;
  const select = (key: string | null) => setSelectedRaw(key ?? "");

  const q = query.trim().toLowerCase();
  const matches = (key: string) => {
    const n = byKey.get(key)!;
    return types.has(n.type) && (!q || n.name.toLowerCase().includes(q) || key.includes(q));
  };
  const focus = hover ?? selected;
  const neighbors = focus ? adjacency.get(focus) : undefined;
  const isLit = (key: string) =>
    matches(key) && (!focus || key === focus || !!neighbors?.has(key));

  const sel = selected ? byKey.get(selected) : undefined;
  const selNeighbors = selected
    ? [...(adjacency.get(selected) ?? new Map())]
        .sort((a, b) => b[1].weight - a[1].weight)
        .slice(0, 10)
    : [];

  const hot = useMemo(
    () => [...graph.nodes].sort((a, b) => b.count - a.count).slice(0, 24),
    [graph.nodes],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {/* 工具条: 搜索 + 类型筛选 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜概念：MCP、Claude Code、RAG…"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--lt-paper)] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[var(--c2m-accent)]"
              aria-label="搜索概念"
            />
          </label>
          {ENTITY_TYPES.map((t) => {
            const on = types.has(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setTypes((cur) => {
                    const next = new Set(cur);
                    if (next.has(t)) next.delete(t);
                    else next.add(t);
                    return next.size === 0 ? new Set(ENTITY_TYPES) : next;
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity"
                style={{
                  borderColor: `color-mix(in srgb, ${ENTITY_COLORS[t]} 40%, transparent)`,
                  opacity: on ? 1 : 0.4,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: ENTITY_COLORS[t] }} aria-hidden />
                {ENTITY_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
          <svg
            viewBox={`0 0 ${graph.width} ${graph.height}`}
            className="w-full h-auto block touch-manipulation"
            role="img"
            aria-label="AI 概念知识图谱"
            onClick={() => select(null)}
          >
            <g>
              {graph.edges.map((e, i) => {
                const a = byKey.get(e.a)!;
                const b = byKey.get(e.b)!;
                const lit = focus ? e.a === focus || e.b === focus : matches(e.a) && matches(e.b);
                return (
                  <motion.line
                    key={`${e.a}|${e.b}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={lit && focus ? "var(--c2m-accent)" : "var(--lt-ink)"}
                    strokeWidth={Math.min(4, 0.6 + e.weight * 0.35)}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: lit ? (focus ? 0.7 : 0.12) : 0.03 }}
                    transition={{ duration: 0.3, delay: reduce || focus ? 0 : 0.8 + Math.min(i, 120) * 0.004 }}
                  />
                );
              })}
            </g>
            <g>
              {graph.nodes.map((n) => {
                const lit = isLit(n.key);
                const r = rank.get(n.key) ?? 0;
                const showLabel = r < LABEL_TOP_N || n.key === focus || (!!focus && neighbors?.has(n.key)) || (!!q && matches(n.key));
                const color = ENTITY_COLORS[n.type];
                return (
                  <motion.g
                    key={n.key}
                    initial={reduce ? false : { opacity: 0, scale: 0 }}
                    animate={{ opacity: lit ? 1 : 0.15, scale: 1 }}
                    transition={{
                      opacity: { duration: 0.25 },
                      scale: { type: "spring", stiffness: 260, damping: 18, delay: reduce ? 0 : r * 0.012 },
                    }}
                    style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                    onMouseEnter={() => setHover(n.key)}
                    onMouseLeave={() => setHover(null)}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      select(n.key === selected ? null : n.key);
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${n.name}，${n.count} 篇文章`}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        select(n.key);
                      }
                    }}
                    className="outline-none"
                  >
                    {n.key === selected && !reduce && (
                      <motion.circle
                        cx={n.x}
                        cy={n.y}
                        r={n.r}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2.2 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                        style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                      />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={color}
                      fillOpacity={n.key === focus ? 1 : 0.82}
                      stroke="var(--lt-paper)"
                      strokeWidth={n.key === selected ? 3 : 1.5}
                    />
                    {showLabel && (
                      <text
                        x={n.x + n.r + 4}
                        y={n.y + 4}
                        fontSize={n.key === focus ? 14 : r < 10 ? 13 : 11}
                        fontWeight={n.key === focus || r < 10 ? 600 : 500}
                        fill="var(--lt-ink)"
                        stroke="var(--color-surface-elevated)"
                        strokeWidth={3}
                        paintOrder="stroke"
                        style={{ fontFamily: "var(--font-sans)", pointerEvents: "none" }}
                      >
                        {n.name}
                      </text>
                    )}
                  </motion.g>
                );
              })}
            </g>
          </svg>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          圆越大 = 被越多文章提到；连线 = 同一篇文章里一起出现。悬停看关联，点击看文章。
        </p>
      </div>

      {/* 侧栏: 选中概念详情 / 默认热门概念 */}
      <aside className="lg:sticky lg:top-20 self-start rounded-2xl border border-[var(--color-border)] bg-[var(--lt-paper)] p-4">
        {sel ? (
          <motion.div key={sel.key} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-lg font-semibold text-[var(--lt-ink)] break-words">{sel.name}</h2>
              <button
                type="button"
                onClick={() => select(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--lt-ink)]"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              <span style={{ color: ENTITY_COLORS[sel.type] }}>● </span>
              {ENTITY_TYPE_LABEL[sel.type]} · {sel.count} 篇文章提到
            </p>

            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">相关文章</h3>
            <ul className="space-y-2 mb-5">
              {sel.slugs.slice(0, 8).map((s) => {
                const a = articles[s];
                if (!a) return null;
                return (
                  <li key={s}>
                    <Link href={`/changelog/${s}`} className="group block">
                      <span className="block text-sm font-medium text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] line-clamp-2">
                        {a.title}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{a.publishedAt}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {selNeighbors.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">常一起出现</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {selNeighbors.map(([k, v]) => {
                    const nb = byKey.get(k)!;
                    return (
                      <li key={k}>
                        <button
                          type="button"
                          onClick={() => select(k)}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs hover:border-[var(--c2m-accent)]"
                          title={v.label ? `${sel.name} ${v.label} ${nb.name}` : undefined}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ENTITY_COLORS[nb.type] }} aria-hidden />
                          {nb.name}
                          {v.label && <span className="text-[10px] text-[var(--color-text-muted)]">· {v.label}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </motion.div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-[var(--lt-ink)] mb-3">🔥 近期最热概念</h2>
            <ul className="flex flex-wrap gap-1.5">
              {hot.map((n) => (
                <li key={n.key}>
                  <button
                    type="button"
                    onClick={() => select(n.key)}
                    onMouseEnter={() => setHover(n.key)}
                    onMouseLeave={() => setHover(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs hover:border-[var(--c2m-accent)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ENTITY_COLORS[n.type] }} aria-hidden />
                    {n.name}
                    <span className="text-[10px] text-[var(--color-text-muted)]">{n.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
