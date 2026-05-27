import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Github } from "lucide-react";
import { getChangelog } from "@/lib/content";
import { AUTHORED_LABEL, VERIFIED_LABEL } from "@/lib/content-types";

export const metadata: Metadata = {
  title: "Changelog · Claude Code / Codex 中文雷达",
  description:
    "Anthropic claude-code 与 OpenAI codex 最新 release 的中文摘要。每日 09:30 自动更新。",
};

export const dynamic = "force-static";

export default async function ChangelogPage() {
  const items = await getChangelog();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-10">
        <p className="eyebrow mb-3">Changelog</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
          每日追踪 Claude Code 与 Codex。
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          GitHub Actions 每天 09:30 抓取 anthropics/claude-code 与 openai/codex
          的新 release，自动产出中文摘要 + 钩子，详情页保留原文链接以便核对。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
          <Link
            href="/feed/changelog"
            className="pill-outline pill hover:text-[var(--c2m-accent-deep)]"
          >
            RSS · changelog only
          </Link>
          <Link
            href="/feed.xml"
            className="pill-outline pill hover:text-[var(--c2m-accent-deep)]"
          >
            RSS · 全站
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          暂无更新 — daily-radar workflow 首跑后这里会有内容。
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/changelog/${c.slug}`}
                className="card group flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="pill text-[10px]">{c.source}</span>
                  <span className="pill-outline pill text-[10px]">
                    {AUTHORED_LABEL[c.authored]}
                  </span>
                  {c.verified && (
                    <span
                      className={`pill text-[10px] ${
                        c.verified === "tested"
                          ? "bg-[rgba(31,122,79,0.12)] text-[var(--lt-ok)]"
                          : "bg-[rgba(184,130,31,0.12)] text-[var(--lt-warn)]"
                      }`}
                      title={
                        c.verified === "tested"
                          ? "编辑部已在本地复现验证"
                          : "LLM 自动摘要，未做人工实测"
                      }
                    >
                      {c.verified === "tested" ? "✓ " : "⏳ "}
                      {VERIFIED_LABEL[c.verified]}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {c.hook}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} />
                    {c.publishedAt}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Github size={12} />
                    原文 release
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
