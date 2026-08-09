// 加载态骨架块 — 复用于各路由的 loading.tsx,给出内容轮廓而非通用 spinner。
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--color-border)] ${className}`}
      aria-hidden
    />
  );
}
