import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, FileText, Shield, Mail } from "lucide-react";
import SubscribeForm from "./SubscribeForm";
import DigestPreview from "./DigestPreview";
import { getDigest } from "@/lib/content";

export const metadata: Metadata = {
  title: "订阅 Weekly Digest",
  description:
    "每周一一封邮件，把过去 7 天 Claude Code / Codex 的所有 release + 一篇 agent harness 设计观察打包送达。免费，随时退订。",
  alternates: {
    canonical: "https://claude2master.com/subscribe",
  },
};

const BENEFITS = [
  {
    icon: Calendar,
    title: "每周一上午到信",
    body: "覆盖过去 7 天 anthropics/claude-code + openai/codex 的所有 release，含中文摘要和原文链接。",
  },
  {
    icon: FileText,
    title: "一篇 harness 设计观察",
    body: "本周编辑部从代码、文档、社区讨论里抽出的一条贯穿性趋势 + 它对 agent 设计者的具体含义。",
  },
  {
    icon: Shield,
    title: "免费 + 随时退订",
    body: "邮箱只用于发送 Weekly Digest，不卖给任何第三方。每封邮件底部有一键退订链接。",
  },
];

export default async function SubscribePage() {
  const all = await getDigest();
  const latest = all[0];
  const preview = latest
    ? {
        slug: latest.slug,
        title: latest.title,
        hook: latest.hook,
        body: latest.body,
        weekOf: latest.weekOf,
        publishedAt: latest.publishedAt,
        readingMinutes: latest.readingMinutes,
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <span className="eyebrow">Newsletter · Weekly</span>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mt-3 mb-4 headline-tight text-[var(--lt-ink)]">
        每周一上午，
        <br />
        把 agentic 工具链的一周打包送到你邮箱。
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        不是 release notes 的机翻；是编辑部的中文综合 + 设计观察。Buttondown
        托管，单向只发送，没有广告。
      </p>

      <DigestPreview preview={preview} />

      <SubscribeForm />

      <div className="mt-12 grid gap-6">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--c2m-accent-soft)] flex items-center justify-center">
              <b.icon size={18} className="text-[var(--c2m-accent-deep)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--lt-ink)] mb-1">
                {b.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {b.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-3">
        <div className="flex items-start gap-2">
          <Mail
            size={14}
            className="flex-shrink-0 mt-1 text-[var(--color-text-muted)]"
          />
          <p>
            更喜欢 RSS？我们也提供{" "}
            <Link
              href="/feed.xml"
              className="text-[var(--c2m-accent-deep)] underline underline-offset-2"
            >
              全站 feed
            </Link>{" "}
            和
            <Link
              href="/feed/digest"
              className="text-[var(--c2m-accent-deep)] underline underline-offset-2 ml-1"
            >
              只订 Weekly 的 feed
            </Link>
            。
          </p>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          数据交给 Buttondown 处理；不会接入 PII 用于其他用途。
        </p>
      </div>
    </div>
  );
}
