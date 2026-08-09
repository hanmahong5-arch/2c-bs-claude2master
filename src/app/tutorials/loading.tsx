import { Skeleton } from "@/components/Skeleton";

// 教程列表路由骨架屏 — 先给出卡片网格轮廓,替代通用 spinner。
export default function TutorialsLoading() {
  return (
    <div
      className="max-w-5xl mx-auto px-6 py-16 md:py-20"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-10 w-2/3 mb-4" />
      <Skeleton className="h-5 w-full max-w-2xl mb-10" />

      <div className="grid md:grid-cols-2 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
