"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import type { MindLayout, MindBranch } from "@/lib/graph";
import { MIND_STYLE } from "@/lib/graph";
import { BRANCH_COLORS } from "./palette";
import { useRevealTrigger } from "./useRevealTrigger";

// 文章思维导图: 布局坐标由服务端 layoutMindMap 预算 (确定性, 无水合差异),
// 这里只负责「画出来」的动效与交互:
// - 进入视口后: 中心节点弹出 → 连线逐条「生长」(pathLength) → 分支/细节节点依次浮现
// - 点击 / 聚焦某分支: 其余分支淡出, 下方面板给出该分支一句话要点
// - 「重播」按钮重新走一遍生长动画; reduced-motion 用户直接看静态终态
// 手机端 (<md) SVG 缩放后字太小 → 改渲染同一数据的动画大纲 (MindOutline)。

const STEP = 0.11;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function MindMap({
  layout,
  branches,
  center,
}: {
  layout: MindLayout;
  branches: MindBranch[];
  center: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealTrigger(ref);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const play = inView || !!reduce;

  const toggle = (b: number) => setActive((cur) => (cur === b ? null : b));
  const dim = (b: number) => active !== null && b !== -1 && b !== active;

  return (
    <div ref={ref} data-play={play ? "1" : "0"}>
      {/* 桌面: SVG 思维导图 */}
      <div className="hidden md:block">
        <div className="relative overflow-x-auto">
          <svg
            key={run}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width}
            height={layout.height}
            className="max-w-full h-auto mx-auto block"
            role="img"
            aria-label={`思维导图: ${center}`}
          >
            {layout.edges.map((e) => {
              const color = BRANCH_COLORS[e.branch % BRANCH_COLORS.length];
              return (
                <motion.path
                  key={e.id}
                  d={e.d}
                  fill="none"
                  stroke={color}
                  strokeWidth={e.level === 1 ? 2.4 : 1.4}
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={
                    play
                      ? { pathLength: 1, opacity: dim(e.branch) ? 0.15 : e.level === 1 ? 0.9 : 0.55 }
                      : undefined
                  }
                  transition={{
                    pathLength: { duration: 0.55, delay: e.order * STEP, ease: EASE },
                    opacity: { duration: 0.25, delay: active === null && run === 0 ? e.order * STEP : 0 },
                  }}
                />
              );
            })}

            {layout.nodes.map((n) => {
              const st = MIND_STYLE[n.level];
              const color = n.branch >= 0 ? BRANCH_COLORS[n.branch % BRANCH_COLORS.length] : "";
              const isCenter = n.level === 0;
              const clickable = n.branch >= 0;
              const faded = dim(n.branch);
              return (
                <motion.g
                  key={n.id}
                  initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                  animate={play ? { opacity: faded ? 0.25 : 1, scale: 1 } : undefined}
                  transition={{
                    duration: 0.45,
                    delay: faded || active !== null ? 0 : n.order * STEP + (isCenter ? 0 : 0.2),
                    ease: EASE,
                  }}
                  style={{
                    transformOrigin: `${n.x + n.w / 2}px ${n.y + n.h / 2}px`,
                    cursor: clickable ? "pointer" : "default",
                  }}
                  onClick={clickable ? () => toggle(n.branch) : undefined}
                  onKeyDown={
                    clickable
                      ? (ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            toggle(n.branch);
                          }
                        }
                      : undefined
                  }
                  tabIndex={n.level === 1 ? 0 : undefined}
                  role={n.level === 1 ? "button" : undefined}
                  aria-pressed={n.level === 1 ? active === n.branch : undefined}
                  className="outline-none focus-visible:[&>rect]:stroke-[3]"
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={isCenter ? 14 : n.level === 1 ? 11 : 8}
                    fill={
                      isCenter
                        ? "var(--lt-ink)"
                        : n.level === 1
                          ? `color-mix(in srgb, ${color} 14%, var(--lt-paper))`
                          : "var(--lt-paper)"
                    }
                    stroke={isCenter ? "none" : color}
                    strokeOpacity={n.level === 1 ? 0.9 : 0.45}
                    strokeWidth={n.level === 1 ? 1.5 : 1}
                  />
                  <text
                    x={n.x + st.hPad}
                    y={n.y + st.vPad + st.font * 0.92}
                    fontSize={st.font}
                    fontWeight={n.level === 2 ? 450 : 600}
                    fill={isCenter ? "var(--lt-paper)" : "var(--lt-ink)"}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {n.lines.map((line, i) => (
                      <tspan key={i} x={n.x + st.hPad} dy={i === 0 ? 0 : st.lineH}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 flex items-start gap-3 min-h-[3.25rem]">
          <div className="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]" aria-live="polite">
            {active === null ? (
              <span className="text-[var(--color-text-muted)]">点击任一分支，查看这一点的一句话解读</span>
            ) : (
              <motion.p
                key={active}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span
                  className="font-semibold mr-2"
                  style={{ color: BRANCH_COLORS[active % BRANCH_COLORS.length] }}
                >
                  {branches[active]?.label}
                </span>
                {branches[active]?.detail}
              </motion.p>
            )}
          </div>
          {!reduce && (
            <button
              type="button"
              onClick={() => {
                setActive(null);
                setRun((r) => r + 1);
              }}
              className="shrink-0 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--c2m-accent-deep)]"
              aria-label="重播思维导图动画"
            >
              <RotateCcw size={12} />
              重播
            </button>
          )}
        </div>
      </div>

      {/* 手机: 同一数据的动画大纲 */}
      <div className="md:hidden">
        <MindOutline center={center} branches={branches} play={play} reduce={!!reduce} />
      </div>
    </div>
  );
}

function MindOutline({
  center,
  branches,
  play,
  reduce,
}: {
  center: string;
  branches: MindBranch[];
  play: boolean;
  reduce: boolean;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={play ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.4, ease: EASE }}
        className="inline-block rounded-xl bg-[var(--lt-ink)] text-[var(--lt-paper)] px-4 py-2 text-sm font-semibold mb-3"
      >
        {center}
      </motion.div>
      <ol className="relative border-l-2 border-[var(--color-border)] ml-3 space-y-2">
        {branches.map((b, i) => {
          const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
          const isOpen = open === i;
          return (
            <motion.li
              key={i}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={play ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.1, ease: EASE }}
              className="relative pl-4"
            >
              <span
                className="absolute -left-[7px] top-3 w-3 h-3 rounded-full ring-2 ring-[var(--lt-paper)]"
                style={{ background: color }}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold"
                style={{ background: `color-mix(in srgb, ${color} 12%, var(--lt-paper))` }}
              >
                {b.label}
              </button>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden px-3 pt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed"
                >
                  {b.detail && <p className="mb-1.5">{b.detail}</p>}
                  {b.children.length > 0 && (
                    <ul className="space-y-1">
                      {b.children.map((c, ci) => (
                        <li key={ci} className="flex gap-2">
                          <span style={{ color }} aria-hidden>
                            ▸
                          </span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
