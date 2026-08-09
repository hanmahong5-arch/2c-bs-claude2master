import { Skeleton } from "@/components/Skeleton";

// Chat 路由骨架屏 — 慢网络下先给出消息气泡+输入框的结构轮廓,替代通用 spinner。
export default function ChatLoading() {
  return (
    <div
      className="max-w-3xl mx-auto px-6 py-16 md:py-20"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-8 w-40 mb-8" />
      <div className="space-y-5 mb-10">
        <div className="flex justify-end">
          <Skeleton className="h-14 w-2/3 rounded-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-28 w-3/4 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}
