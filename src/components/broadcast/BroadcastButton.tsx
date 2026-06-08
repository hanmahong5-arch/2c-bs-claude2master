"use client";

// BroadcastButton — Header 的 🔊 播报 入口 (桌面 nav + 移动抽屉两种排版)。
// 点击调 useBroadcast().toggle(); drawer 变体额外回调 onActivate 关掉移动菜单。

import { Volume2 } from "lucide-react";
import { useBroadcast } from "./useBroadcast";

export function BroadcastButton({
  variant = "nav",
  onActivate,
}: {
  variant?: "nav" | "drawer";
  onActivate?: () => void;
}) {
  const { open, hasAudio, toggle } = useBroadcast();

  function handle() {
    toggle();
    onActivate?.();
  }

  if (variant === "drawer") {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={!hasAudio}
        aria-pressed={open}
        className={`flex items-center gap-2 w-full px-6 h-14 border-l-2 border-transparent text-left ${
          hasAudio
            ? "text-[var(--lt-ink)] hover:bg-[var(--lt-bg)] hover:border-[var(--c2m-accent)]"
            : "text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
        } ${open ? "text-[var(--c2m-accent-deep)]" : ""}`}
      >
        <Volume2 size={16} />
        {open ? "停止播报" : "🔊 播报"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={!hasAudio}
      aria-pressed={open}
      title={hasAudio ? "语音播报最新雷达" : "音频生成中"}
      aria-label="语音播报最新雷达"
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
        !hasAudio
          ? "text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
          : open
            ? "text-[var(--c2m-accent-deep)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--lt-ink)]"
      }`}
    >
      <Volume2 size={15} />
      <span className="hidden lg:inline">播报</span>
    </button>
  );
}
