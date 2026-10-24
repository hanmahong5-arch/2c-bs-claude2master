import Link from "next/link";
import {
  ENTITY_TYPE_LABEL,
  layoutMindMap,
  normalizeEntity,
  type ArticleGraph,
} from "@/lib/graph";
import MindMap from "./MindMap";
import FlowSteps from "./FlowSteps";
import { ENTITY_COLORS } from "./palette";

// 详情页「一图看懂」: 思维导图 (必有) + 流程动效图 (文章有流程时) + 实体关系 chips。
// 服务端组件: 布局在构建期算好, 客户端子组件只负责动效。
// 实体 chip 链到全站概念图 /graph?c=<key>, 把单篇阅读导进「图谱漫游」, 拉长停留。

export default function ArticleGraphPanel({
  graph,
  knownConcepts,
}: {
  graph: ArticleGraph;
  /** 全站概念图里存在的实体 key; 只有这些 chip 才可点 (点进去有内容) */
  knownConcepts: Set<string>;
}) {
  const layout = layoutMindMap(graph);
  return (
    <section className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 md:p-6">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-[var(--lt-ink)]">🧭 一图看懂</h2>
        <span className="text-xs text-[var(--color-text-muted)]">由原文自动提炼 · 以原文为准</span>
      </div>

      <MindMap layout={layout} branches={graph.branches} center={graph.center} />

      {graph.flow.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">⚙️ 流程拆解</h3>
          <FlowSteps steps={graph.flow} />
        </div>
      )}

      {graph.entities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">🔗 涉及的概念与玩家</h3>
          <ul className="flex flex-wrap gap-2">
            {graph.entities.map((e) => {
              const key = normalizeEntity(e.name);
              const color = ENTITY_COLORS[e.type];
              const chip = (
                <>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} aria-hidden />
                  <span className="font-medium">{e.name}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{ENTITY_TYPE_LABEL[e.type]}</span>
                </>
              );
              const cls =
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs bg-[var(--lt-paper)]";
              return (
                <li key={key}>
                  {knownConcepts.has(key) ? (
                    <Link
                      href={`/graph?c=${encodeURIComponent(key)}`}
                      className={`${cls} hover:border-[var(--c2m-accent)] hover:text-[var(--c2m-accent-deep)] transition-colors`}
                      style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
                      title={`在知识图谱里看「${e.name}」的所有相关文章`}
                    >
                      {chip}
                      <span aria-hidden className="text-[var(--color-text-muted)]">↗</span>
                    </Link>
                  ) : (
                    <span className={cls} style={{ borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }}>
                      {chip}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {graph.relations.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-secondary)]">
              {graph.relations.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-[var(--lt-ink)]">{r.from}</span>
                  <span className="text-[var(--color-text-muted)]">—{r.label || "关联"}→</span>
                  <span className="font-medium text-[var(--lt-ink)]">{r.to}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
