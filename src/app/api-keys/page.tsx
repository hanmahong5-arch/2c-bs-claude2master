import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Key, Wallet, Zap } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";

// 单一出站构造点:api-keys 页注册入口,带 api-keys 归因。
const NEWAPI_API_KEYS = buildOutbound("newapi", OUTBOUND_CAMPAIGN.apiKeys);

export const metadata: Metadata = {
  title: "申请 API key",
  description:
    "3 步拿到 Claude API key — 支付宝/微信充值、OpenAI 与 Anthropic 双协议兼容、人民币结算。",
  alternates: {
    canonical: "https://claude2master.com/api-keys",
  },
  openGraph: {
    title: "申请 Claude API key — 不翻墙、人民币结算",
    description:
      "3 步拿到 Claude API key — 支付宝/微信充值、OpenAI 与 Anthropic 双协议兼容、人民币结算。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "申请 Claude API key — 不翻墙、人民币结算",
    description:
      "3 步拿到 Claude API key — 支付宝/微信充值、OpenAI 与 Anthropic 双协议兼容、人民币结算。",
  },
};

const STEPS = [
  {
    icon: Key,
    n: "01",
    title: "注册",
    desc: "用手机号 / 微信 / 邮箱注册，复用 Lurus 统一账号体系（Zitadel）。",
  },
  {
    icon: Wallet,
    n: "02",
    title: "充值",
    desc: "支付宝 / 微信付款，按 newapi 渠道实时计价，金融级精度透明账单。",
  },
  {
    icon: Zap,
    n: "03",
    title: "创建 token",
    desc: "在控制台一键生成，复制到 Claude Code / 自家代码即可调用。",
  },
];

const ENDPOINTS = [
  {
    path: "/v1/chat/completions",
    label: "OpenAI 兼容",
    desc: "现有 OpenAI SDK 直接换 base_url 即可用",
  },
  {
    path: "/v1/messages",
    label: "Anthropic 原生",
    desc: "Claude Code、Anthropic SDK 默认走这个端点",
  },
  {
    path: "/v1/embeddings",
    label: "Embedding",
    desc: "向量化文本，多模型支持",
  },
  {
    path: "/v1/images/generations",
    label: "图像生成",
    desc: "通过 newapi 接入的图像模型",
  },
];

export default function ApiKeysPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <header className="text-center mb-14">
        <p className="eyebrow mb-3">API key 申请</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
          3 步拿到 Claude API key。
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          走 Lurus 自营 LLM 网关{" "}
          <code className="font-mono text-base text-[var(--c2m-accent-deep)]">
            newapi.lurus.cn
          </code>{" "}
          — 不翻墙、支付宝/微信付款、双协议兼容。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TrackedLink
            href={NEWAPI_API_KEYS}
            external
            event="cta_register_newapi"
            data={{ from: "api-keys" }}
            className="btn btn-cta-glow"
          >
            立即注册
            <ArrowRight size={16} />
          </TrackedLink>
          <Link
            href="/tutorials/claude-code-setup"
            className="btn btn-secondary"
          >
            看 Claude Code 配置教程
          </Link>
        </div>
      </header>

      <section className="mb-16">
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card">
              <div className="flex items-center justify-between mb-4">
                <s.icon
                  size={28}
                  className="text-[var(--c2m-accent)]"
                  strokeWidth={1.5}
                />
                <span className="font-mono text-3xl text-[var(--color-text-muted)] opacity-60">
                  {s.n}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--lt-ink)]">
                {s.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--lt-ink)]">
          支持的 endpoint
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          base URL：
          <code className="font-mono">https://newapi.lurus.cn</code>
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="card">
              <div className="flex items-center justify-between mb-2">
                <code className="font-mono text-sm text-[var(--c2m-accent-deep)]">
                  {e.path}
                </code>
                <span className="pill text-[10px]">{e.label}</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {e.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card bg-[var(--c2m-accent-soft)] border-[var(--c2m-accent)]">
        <p className="eyebrow mb-2">团队 / 多租户？</p>
        <h3 className="text-lg font-semibold mb-2 text-[var(--lt-ink)]">
          升级到 newhub
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          多个子团队独立计费、用量隔离、统一审计 — 升级到{" "}
          <code className="font-mono">hub.lurus.cn</code>（多租户 API）。
        </p>
        <TrackedLink
          href="mailto:hi@lurus.cn?subject=newhub%20%E5%9B%A2%E9%98%9F%E8%AF%A2%E4%BB%B7"
          external
          event="cta_contact_sales"
          data={{ product: "newhub", from: "api-keys" }}
          className="btn btn-ghost text-sm"
        >
          联系销售 →
        </TrackedLink>
      </section>
    </div>
  );
}
