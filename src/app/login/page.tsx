import type { Metadata } from "next";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";

export const metadata: Metadata = {
  title: "登录",
  description: "用 Lurus 统一账号登录 claude2master — 手机号 / 微信 / 邮箱皆可。",
};

const NEWAPI_LOGIN = buildOutbound("newapi", OUTBOUND_CAMPAIGN.login);

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-16 md:py-24 text-center">
      <p className="eyebrow mb-3">登录</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-6 headline-tight">
        欢迎回来。
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        我们复用 Lurus 统一账号体系（Zitadel）。Phase 3 接入后这里会显示登录表单。
      </p>

      <div className="card mb-6 text-left">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          需要立即用 Claude？先去 newapi 注册个账户：
        </p>
        <TrackedLink
          href={NEWAPI_LOGIN}
          external
          event="cta_register_newapi"
          data={{ from: "login" }}
          className="btn btn-primary w-full"
        >
          去 newapi 注册
        </TrackedLink>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        还没账号？
        <Link
          href="/signup"
          className="text-[var(--c2m-accent-deep)] hover:underline ml-1"
        >
          注册
        </Link>
      </p>
    </div>
  );
}
