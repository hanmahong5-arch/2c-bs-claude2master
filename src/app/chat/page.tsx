import type { Metadata } from "next";
import { Suspense } from "react";
import ChatRoom from "@/components/ChatRoom";

const DESC =
  "免登录在线 AI 对话 — 写代码、翻译、写作、解释报错，打开就能用，不翻墙、人民币结算。";

export const metadata: Metadata = {
  title: "在线 Chat",
  description: DESC,
  alternates: {
    canonical: "https://claude2master.com/chat",
  },
  openGraph: {
    title: "在线 Chat",
    description: DESC,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "在线 Chat",
    description: DESC,
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
