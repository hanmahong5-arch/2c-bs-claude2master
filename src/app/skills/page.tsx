import type { Metadata } from "next";
import Link from "next/link";
import { Package, Download } from "lucide-react";
import { SKILLS, SKILL_CATEGORIES } from "@/lib/skills";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Skills 商店",
  description:
    "Claude Code Skills 中文索引 — Anthropic 官方 + Lurus 出品 + 社区精选。一键看安装命令、来源、触发条件。",
};

const CATEGORIES = ["全部", ...SKILL_CATEGORIES];

const SOURCE_BADGE: Record<string, string> = {
  Anthropic: "Anthropic 官方",
  "Lurus 出品": "Lurus 出品",
  "Lurus 编辑部": "Lurus demo",
};

export default function SkillsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">Skills 商店</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            Claude 能力即插即用。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            Skills 是 2025-12 起 Anthropic 的新标准 — 把领域知识打包成可挂载的模块。
            本站汇集官方 + Lurus 出品 + 社区精选，中文索引一键查看安装命令。
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[var(--color-border)]">
          {CATEGORIES.map((c, i) => (
            <button key={c} className={i === 0 ? "pill" : "pill-outline pill"}>
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SKILLS.map((s) => (
          <StaggerItem key={s.slug} className="h-full">
          <Link
            href={`/skills/${s.slug}`}
            className="card group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-3">
              <Package
                size={28}
                className="text-[var(--c2m-accent)]"
                strokeWidth={1.5}
                style={{
                  filter: "drop-shadow(0 0 8px rgba(124, 92, 255, 0.35))",
                }}
              />
              <span className="pill-outline pill text-[10px]">
                {SOURCE_BADGE[s.source] ?? s.source}
              </span>
            </div>
            <p className="eyebrow mb-2">{s.category}</p>
            <h3 className="font-mono text-base mb-2 text-[var(--lt-ink)]">
              {s.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1 mb-4">
              {s.desc}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--c2m-accent-deep)] font-medium">
              <Download size={12} />
              安装 / 详情
            </span>
          </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <p className="mt-12 text-sm text-[var(--color-text-muted)] text-center">
        当前 {SKILLS.length} 条目录 · 欢迎{" "}
        <a
          href="mailto:hello@lurus.cn"
          className="text-[var(--c2m-accent-deep)] hover:underline"
        >
          投稿 / 报错
        </a>
      </p>
    </div>
  );
}
