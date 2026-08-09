"use client";

// BroadcastBar — 底部固定播放条 + 筛选面板。
// 纯 UI: 状态全取自 useBroadcast(), 不持有 <audio>(由 Provider 常驻挂载)。

import { useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { KIND_LABEL } from "@/lib/content-types";
import type { Lang, Span } from "./types";
import { useBroadcast } from "./useBroadcast";

const LANG_TABS: { value: Lang; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "EN" },
  { value: "both", label: "双语" },
];

const SPAN_TABS: { value: Span; label: string }[] = [
  { value: "today", label: "今天" },
  { value: "3d", label: "近 3 天" },
  { value: "7d", label: "近 7 天" },
  { value: "all", label: "全部" },
];

function chipClass(active: boolean): string {
  return `pill text-xs cursor-pointer transition-colors ${
    active
      ? "bg-[var(--c2m-accent-deep)] text-white"
      : "pill-outline hover:text-[var(--c2m-accent-deep)]"
  }`;
}

export function BroadcastBar() {
  const {
    open,
    playing,
    lang,
    filters,
    toolOptions,
    kindOptions,
    current,
    total,
    hasQueue,
    togglePlay,
    stop,
    jump,
    setLang,
    setFilters,
  } = useBroadcast();
  const [panelOpen, setPanelOpen] = useState(false);

  if (!open) return null;

  const label = current
    ? [current.author ?? current.source, current.title]
        .filter(Boolean)
        .join(" · ")
    : "当前筛选下暂无可播音频 — 调整筛选试试";

  function toggleTool(key: string) {
    const has = filters.tools.includes(key);
    setFilters({
      tools: has
        ? filters.tools.filter((t) => t !== key)
        : [...filters.tools, key],
    });
  }

  return (
    <div
      role="region"
      aria-label="新闻语音播报"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {panelOpen && (
          <div className="py-4 border-b border-[var(--color-border)] space-y-3">
            <FilterRow label="语言">
              {LANG_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setLang(t.value)}
                  className={chipClass(lang === t.value)}
                  aria-pressed={lang === t.value}
                >
                  {t.label}
                </button>
              ))}
            </FilterRow>

            {toolOptions.length > 0 && (
              <FilterRow label="主题">
                <button
                  type="button"
                  onClick={() => setFilters({ tools: [] })}
                  className={chipClass(filters.tools.length === 0)}
                  aria-pressed={filters.tools.length === 0}
                >
                  全部工具
                </button>
                {toolOptions.map((t) => {
                  const active = filters.tools.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleTool(t.key)}
                      className={`${chipClass(active)} inline-flex items-center gap-1`}
                      aria-pressed={active}
                    >
                      {active && <Check size={11} />}
                      {t.name}
                    </button>
                  );
                })}
              </FilterRow>
            )}

            {kindOptions.length > 0 && (
              <FilterRow label="归类">
                <button
                  type="button"
                  onClick={() => setFilters({ kind: "all" })}
                  className={chipClass(filters.kind === "all")}
                  aria-pressed={filters.kind === "all"}
                >
                  全部
                </button>
                {kindOptions.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilters({ kind: k })}
                    className={chipClass(filters.kind === k)}
                    aria-pressed={filters.kind === k}
                  >
                    {KIND_LABEL[k].label}
                  </button>
                ))}
              </FilterRow>
            )}

            <FilterRow label="时间">
              {SPAN_TABS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setFilters({ span: s.value })}
                  className={chipClass(filters.span === s.value)}
                  aria-pressed={filters.span === s.value}
                >
                  {s.label}
                </button>
              ))}
            </FilterRow>
          </div>
        )}

        <div className="py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!hasQueue}
            className="shrink-0 size-11 rounded-full bg-[var(--c2m-accent-deep)] text-white inline-flex items-center justify-center hover:opacity-90 disabled:opacity-40"
            aria-label={playing ? "暂停" : "播放"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            onClick={() => jump(-1)}
            disabled={!hasQueue}
            className="shrink-0 min-w-11 min-h-11 inline-flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] disabled:opacity-40"
            aria-label="上一条"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={() => jump(1)}
            disabled={!hasQueue}
            className="shrink-0 min-w-11 min-h-11 inline-flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] disabled:opacity-40"
            aria-label="下一条"
          >
            <SkipForward size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <span>
                播报中 {(current?.entryIdx ?? 0) + 1}/{total}
              </span>
              {current && (
                <span className="pill text-[9px] bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)]">
                  {current.lang === "zh" ? "中文" : "EN"}
                </span>
              )}
            </p>
            <p className="text-sm font-medium text-[var(--lt-ink)] truncate">
              {label}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPanelOpen((p) => !p)}
            className={`shrink-0 inline-flex items-center gap-1 text-xs transition-colors ${
              panelOpen
                ? "text-[var(--c2m-accent-deep)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)]"
            }`}
            aria-pressed={panelOpen}
            aria-label="筛选播报内容"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">筛选</span>
          </button>

          <div
            className="hidden sm:flex shrink-0 rounded-full border border-[var(--color-border)] overflow-hidden text-[11px]"
            role="group"
            aria-label="播报语言"
          >
            {LANG_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setLang(t.value)}
                className={`px-2.5 py-1 transition-colors ${
                  lang === t.value
                    ? "bg-[var(--c2m-accent-deep)] text-white"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)]"
                }`}
                aria-pressed={lang === t.value}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={stop}
            className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--lt-err)]"
            aria-label="关闭播报"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="shrink-0 w-10 text-xs text-[var(--color-text-muted)] pt-1">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
