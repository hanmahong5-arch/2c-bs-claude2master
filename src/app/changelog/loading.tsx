import { Skeleton } from "@/components/Skeleton";

// Changelog 路由骨架屏 — 先给出 header + 筛选 pill + 卡片列表轮廓,替代通用 spinner。
export default function ChangelogLoading() {
  return (
    <div
      className="max-w-5xl mx-auto px-6 py-16 md:py-20"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-10 w-2/3 mb-4" />
      <Skeleton className="h-5 w-full max-w-2xl mb-8" />

      <div className="flex flex-wrap gap-2 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton className="h-4 w-24 mb-3 rounded-full" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
