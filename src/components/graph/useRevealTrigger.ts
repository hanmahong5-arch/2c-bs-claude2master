"use client";

import { useInView } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

// 动效触发: 进入视口立即播; 挂载后 FALLBACK_MS 仍未触发 (IntersectionObserver 不可用 /
// 无头渲染 / 预渲染快照) 则兜底直接播 —— 图谱内容首屏是 opacity:0 的待播态, 绝不能因为
// 观察器没回调就一直空白。兜底时若元素在屏外, 用户滚到时看到的就是终态, 可接受。
const FALLBACK_MS = 1200;

export function useRevealTrigger(ref: RefObject<Element | null>): boolean {
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);
  return inView || fallback;
}
