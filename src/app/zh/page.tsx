import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { SEO_LANDINGS } from "@/lib/seo-landings";

export const metadata: Metadata = {
  title: "中文指南 · Claude / Cursor / Cline 国内实战",
  description:
    "c2m 编辑部维护的中文 SEO 着陆页：Claude Code 安装、Claude 4.7 API、Cursor vs Claude Code、Cline 中文、Skills 入门 — 国内可操作版。",
  alternates: {
    canonical: "https://claude2master.com/zh",
  },
};

export const dynamic = "force-static";

export default function ZhIndex() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <p className="eyebrow mb-3">中文指南</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        国内可操作的 AI 编程实战。
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed">
        编辑部针对国内用户痛点（梯子、信用卡、备案）整理的中文实战指南。每篇 800-1500 字，
        可以直接照着跑。
      </p>

      <ul className="space-y-4">
        {SEO_LANDINGS.map((l) => (
          <li key={l.slug}>
            <Link
              href={`/zh/${l.slug}`}
              className="card group flex flex-col gap-3 hover:border-[var(--c2m-accent)]"
            >
              <h2 className="text-xl font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                {l.title}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {l.hook}
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  更新于 {l.updatedAt}
                </span>
                <span className="inline-flex items-center gap-1 text-[var(--c2m-accent-deep)] group-hover:translate-x-0.5 transition-transform">
                  阅读
                  <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-sm text-[var(--color-text-muted)] text-center">
        {SEO_LANDINGS.length} 篇指南 · 编辑部按需扩充
      </p>
    </div>
  );
}
