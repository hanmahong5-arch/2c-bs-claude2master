export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
        <span
          className="inline-block w-2 h-2 rounded-full bg-[var(--c2m-accent)] animate-pulse"
          aria-hidden
        />
        <span className="text-sm">加载中…</span>
      </div>
    </div>
  );
}
