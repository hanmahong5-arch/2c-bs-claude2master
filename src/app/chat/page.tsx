import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "在线 Chat",
  description: "免登录 3 条免费试用 Claude — Sonnet 4.5 / Opus 4.7 / Haiku 4.5。",
};

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <p className="eyebrow mb-3">在线 Chat</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
        和 Claude 直接聊。
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-10">
        免登录 3 条免费试用，覆盖 Haiku / Sonnet / Opus 全系。第 4 条起需注册。
      </p>

      <div className="card flex items-start gap-4 mb-8">
        <MessageSquare
          size={24}
          className="text-[var(--c2m-accent)] flex-shrink-0 mt-1"
          strokeWidth={1.5}
        />
        <div>
          <h3 className="font-semibold text-[var(--lt-ink)] mb-2">
            Chat 模块开发中
          </h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            后端走 <code className="font-mono text-xs">newapi.lurus.cn/v1</code>（Lurus
            自营 LLM 网关，prod 稳定）。免登录 trial gate 用 cookie + KV 计数。
          </p>
          <Link
            href="https://newapi.lurus.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-sm"
          >
            直接去 newapi
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        想抢先体验？给一个邮箱，开放时通知你 → 暂未上线。
      </p>
    </div>
  );
}
