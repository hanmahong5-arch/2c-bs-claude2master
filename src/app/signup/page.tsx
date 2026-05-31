import type { Metadata } from "next";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";

export const metadata: Metadata = {
  title: "注册",
  description: "注册 claude2master — 复用 Lurus 统一账号，解锁 Chat 与 API key。",
};

const NEWAPI_SIGNUP = buildOutbound("newapi", OUTBOUND_CAMPAIGN.signup);

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-16 md:py-24 text-center">
      <p className="eyebrow mb-3">注册</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-6 headline-tight">
        从今天开始。
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        注册即解锁：无限 Chat 对话、API key 一键发放、教程学习进度同步。
      </p>

      <div className="card mb-6 text-left">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          注册流程接入中。Phase 3 上线 Zitadel OIDC 后这里直接走 SSO。
        </p>
        <TrackedLink
          href={NEWAPI_SIGNUP}
          external
          event="cta_register_newapi"
          data={{ from: "signup" }}
          className="btn btn-primary w-full"
        >
          在 newapi 注册（同账户体系）
        </TrackedLink>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        已有账号？
        <Link
          href="/login"
          className="text-[var(--c2m-accent-deep)] hover:underline ml-1"
        >
          登录
        </Link>
      </p>
    </div>
  );
}
