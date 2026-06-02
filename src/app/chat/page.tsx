import type { Metadata } from "next";
import { Suspense } from "react";
import ChatRoom from "@/components/ChatRoom";

export const metadata: Metadata = {
  title: "在线 Chat",
  description:
    "免登录 3 次在线试用 — 当前由 DeepSeek V3.2 驱动，Anthropic Claude 接通后自动升级。",
  alternates: {
    canonical: "https://claude2master.com/chat",
  },
  openGraph: {
    title: "在线 Chat",
    description:
      "免登录 3 次在线试用 — 当前由 DeepSeek V3.2 驱动，Anthropic Claude 接通后自动升级。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "在线 Chat",
    description:
      "免登录 3 次在线试用 — 当前由 DeepSeek V3.2 驱动，Anthropic Claude 接通后自动升级。",
  },
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
