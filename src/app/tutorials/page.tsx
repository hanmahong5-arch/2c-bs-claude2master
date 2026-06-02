import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { TUTORIALS, TUTORIAL_CATEGORIES } from "@/lib/tutorials";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Claude Code 教程",
  description:
    "中文系统化 Claude Code 教程：入门、配置、Skills、Hooks、MCP、工作流、进阶。",
  alternates: {
    canonical: "https://claude2master.com/tutorials",
  },
  openGraph: {
    type: "website",
    title: "Claude Code 教程",
    description:
      "中文系统化 Claude Code 教程：入门、配置、Skills、Hooks、MCP、工作流、进阶。",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Code 教程",
    description:
      "中文系统化 Claude Code 教程：入门、配置、Skills、Hooks、MCP、工作流、进阶。",
  },
};

const CATEGORIES = ["全部", ...TUTORIAL_CATEGORIES];

export default function TutorialsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">Claude Code 教程</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            从零到精通，全程中文。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            编辑部维护的 Claude Code 中文系列教程。从国内零障碍接入开始，逐步覆盖 Skills、Hooks、MCP 全栈能力。
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-[var(--color-border)]">
          {CATEGORIES.map((c, i) => (
            <button key={c} className={i === 0 ? "pill" : "pill-outline pill"}>
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <ul className="space-y-4">
          {TUTORIALS.map((t) => (
            <li key={t.slug}>
            <Link
              href={`/tutorials/${t.slug}`}
              className="card group flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="pill text-[10px]">{t.category}</span>
                  {t.pinned && (
                    <span className="pill-outline pill text-[10px]">置顶</span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-1.5 text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                  {t.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {t.desc}
                </p>
              </div>
              <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {t.read}
                </span>
                <span>{t.date}</span>
              </div>
            </Link>
          </li>
        ))}
        </ul>
      </Reveal>
    </div>
  );
}
