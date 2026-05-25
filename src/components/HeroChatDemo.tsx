"use client";

import { useEffect, useRef, useState } from "react";

const USER_MSG = "帮我写一个 React useDebounce hook";
const ASSISTANT_LINES = [
  "好的，下面是一个类型安全的实现：",
  "",
  "```ts",
  "export function useDebounce<T>(value: T, delay = 300) {",
  "  const [debounced, setDebounced] = useState(value);",
  "  useEffect(() => {",
  "    const id = setTimeout(() => setDebounced(value), delay);",
  "    return () => clearTimeout(id);",
  "  }, [value, delay]);",
  "  return debounced;",
  "}",
  "```",
];
const ASSISTANT_FULL = ASSISTANT_LINES.join("\n");

export default function HeroChatDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      if (i >= ASSISTANT_FULL.length) {
        setTyped(ASSISTANT_FULL);
        setDone(true);
        clearInterval(id);
      } else {
        setTyped(ASSISTANT_FULL.slice(0, i));
      }
    }, 28);
    return () => clearInterval(id);
  }, [started]);

  return (
    <div
      ref={containerRef}
      className="relative max-w-2xl mx-auto rounded-2xl border border-[var(--color-border)] bg-[var(--lt-paper)] shadow-[0_8px_40px_rgba(20,19,15,0.06)] p-6 md:p-8"
    >
      <span className="absolute top-4 right-4 pill text-[10px]">
        演示 · 滚动查看
      </span>

      <div className="space-y-5">
        <div>
          <p className="eyebrow mb-2">你 · 刚刚</p>
          <div className="chat-user rounded-r-lg">{USER_MSG}</div>
        </div>

        <div className="chat-assistant">
          <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
            {typed.split("```").map((part, idx) =>
              idx % 2 === 0 ? (
                <span key={idx}>{part}</span>
              ) : (
                <code
                  key={idx}
                  className="block my-2 px-3 py-2 rounded-md bg-[#1B1924] text-[#E2DEF0] font-mono text-[13px] leading-[1.7]"
                >
                  {part.replace(/^ts\n/, "")}
                </code>
              )
            )}
            {!done && <span className="cursor-blink" aria-hidden />}
          </pre>
        </div>
      </div>
    </div>
  );
}
