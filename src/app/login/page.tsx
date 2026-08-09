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
        账号体系升级中，当前请通过 newapi 完成登录，后续可无缝迁移到 Lurus 统一账号。
      </p>

      <div className="card mb-6 text-left">
        <p className="eyebrow mb-2">为什么先去 newapi？</p>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          claude2master 与 newapi 共用同一套账号与计费体系，登录入口暂时对齐到 newapi ——
          先在这边登录即可立即用 Claude，无需重复开户。
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
