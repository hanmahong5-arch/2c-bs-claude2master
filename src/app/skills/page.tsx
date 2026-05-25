import type { Metadata } from "next";
import Link from "next/link";
import { Package, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Skills 商店",
  description:
    "Claude Code Skills 中文商店 — 写作、代码、数据、设计、运维。一键安装命令复制。",
};

const CATEGORIES = ["全部", "写作", "代码", "数据", "设计", "运维"];

const SKILLS = [
  {
    slug: "frontend-design",
    category: "设计",
    title: "frontend-design",
    desc: "前端视觉升级 — 调研标杆 + 高品质图标 / 动效 / 排版 / 设计系统。",
    source: "Lurus 出品",
  },
  {
    slug: "code-review",
    category: "代码",
    title: "code-review",
    desc: "Review 当前 diff 找正确性 bug — 低/中/高 effort 三档。",
    source: "Anthropic",
  },
  {
    slug: "verify",
    category: "代码",
    title: "verify",
    desc: "跑应用 + 观察行为，验证代码改动是否真起作用。",
    source: "Anthropic",
  },
];

export default function SkillsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-10">
        <p className="eyebrow mb-3">Skills 商店</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
          Claude 能力即插即用。
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          Skills 是 2025-12 起 Anthropic 的新标准 — 把领域知识打包成可挂载的模块。本站汇集官方 + Lurus 出品 + 社区精选，中文索引一键安装。
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[var(--color-border)]">
        {CATEGORIES.map((c, i) => (
          <button
            key={c}
            className={i === 0 ? "pill" : "pill-outline pill"}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SKILLS.map((s) => (
          <Link
            key={s.slug}
            href={`/skills/${s.slug}`}
            className="card group flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <Package
                size={28}
                className="text-[var(--c2m-accent)]"
                strokeWidth={1.5}
                style={{
                  filter:
                    "drop-shadow(0 0 8px rgba(124, 92, 255, 0.35))",
                }}
              />
              <span className="pill-outline pill text-[10px]">{s.source}</span>
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
        ))}
      </div>

      <p className="mt-12 text-sm text-[var(--color-text-muted)] text-center">
        Skills 商店持续上新 · 当前 3 / 50+ 条目录
      </p>
    </div>
  );
}
