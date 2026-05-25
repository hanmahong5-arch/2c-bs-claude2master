import type { Metadata } from "next";
import { Suspense } from "react";
import ChatRoom from "@/components/ChatRoom";

export const metadata: Metadata = {
  title: "在线 Chat",
  description: "免登录 3 次试用 Claude — Sonnet 4.6 / Opus 4.7 / Haiku 4.5。",
};

function Fallback() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-sm text-[var(--color-text-muted)]">
      正在准备 Chat…
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ChatRoom />
    </Suspense>
  );
}
