"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRevealTrigger } from "./useRevealTrigger";

// 流程动效图: 文章描述了方法 / 管线 / 数据流时, 把 3–6 步画成一条「会跑的」流水线。
// - 进入视口: 步骤卡依次落位, 箭头逐段生长
// - 之后一个高亮游标沿流程循环前进 (每 1.4s 一步), 直观呈现「数据怎么流过去」
// - 离开视口即暂停 (不在屏上就不耗 CPU); reduced-motion 用户看静态版
// 窄屏自动换行成竖排 (flex-col), 箭头随之转向。

const TICK_MS = 1400;

export default function FlowSteps({ steps }: { steps: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRevealTrigger(ref);
  const visible = useInView(ref, { margin: "0px 0px -5% 0px" });
  const reduce = useReducedMotion();
  const [cursor, setCursor] = useState(-1);

  useEffect(() => {
    if (reduce || !visible) return;
    // 首次入场先等步骤卡落位再开始跑游标
    const start = setTimeout(() => setCursor((c) => (c < 0 ? 0 : c)), steps.length * 120 + 500);
    const id = setInterval(() => setCursor((c) => (c + 1) % steps.length), TICK_MS);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [reduce, visible, steps.length]);

  return (
    <div ref={ref} className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0" role="list" aria-label="流程">
      {steps.map((s, i) => {
        const on = cursor === i;
        const done = cursor > i;
        return (
          <div key={i} className="flex flex-col md:flex-row items-center md:flex-1 min-w-0" role="listitem">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={seen || reduce ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.4, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full md:w-auto md:flex-1 rounded-xl border px-3 py-2.5 text-sm text-center transition-colors duration-300"
              style={{
                borderColor: on ? "var(--c2m-accent)" : "var(--color-border)",
                background: on
                  ? "var(--c2m-accent-soft)"
                  : done
                    ? "color-mix(in srgb, var(--c2m-accent) 5%, var(--lt-paper))"
                    : "var(--lt-paper)",
                boxShadow: on ? "0 0 0 4px var(--c2m-accent-glow)" : "none",
              }}
            >
              <span
                className="block text-[10px] font-mono mb-0.5 transition-colors duration-300"
                style={{ color: on ? "var(--c2m-accent-deep)" : "var(--color-text-muted)" }}
              >
                STEP {i + 1}
              </span>
              <span className="font-medium text-[var(--lt-ink)] break-words">{s}</span>
            </motion.div>
            {i < steps.length - 1 && <Arrow index={i} play={seen || !!reduce} lit={cursor === i} reduce={!!reduce} />}
          </div>
        );
      })}
    </div>
  );
}

function Arrow({ index, play, lit, reduce }: { index: number; play: boolean; lit: boolean; reduce: boolean }) {
  const color = lit ? "var(--c2m-accent)" : "var(--color-border)";
  return (
    <svg
      className="shrink-0 w-6 h-5 md:w-7 md:h-6 rotate-90 md:rotate-0 my-0.5 md:my-0 md:mx-0.5"
      viewBox="0 0 28 24"
      aria-hidden
    >
      <motion.path
        d="M2 12 H22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        animate={play ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.35, delay: index * 0.12 + 0.3 }}
        style={{ transition: "stroke 0.3s" }}
      />
      <motion.path
        d="M17 7 L23 12 L17 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduce ? false : { opacity: 0 }}
        animate={play ? { opacity: 1 } : undefined}
        transition={{ duration: 0.2, delay: index * 0.12 + 0.6 }}
        style={{ transition: "stroke 0.3s" }}
      />
    </svg>
  );
}
