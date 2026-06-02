import type { Metadata } from "next";
import { SKILLS, SKILL_CATEGORIES } from "@/lib/skills";
import { Reveal } from "@/components/Reveal";
import SkillsList from "./SkillsList";

export const metadata: Metadata = {
  title: "Skills 商店",
  description:
    "Claude Code Skills 中文索引 — Anthropic 官方 + Lurus 出品 + 社区精选。一键看安装命令、来源、触发条件。",
  alternates: {
    canonical: "https://claude2master.com/skills",
  },
  openGraph: {
    title: "Skills 商店 — Claude Code 能力即插即用",
    description:
      "Claude Code Skills 中文索引 — Anthropic 官方 + Lurus 出品 + 社区精选。一键看安装命令、来源、触发条件。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skills 商店 — Claude Code 能力即插即用",
    description:
      "Claude Code Skills 中文索引 — Anthropic 官方 + Lurus 出品 + 社区精选。一键看安装命令、来源、触发条件。",
  },
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
      </Reveal>

      <SkillsList skills={SKILLS} categories={SKILL_CATEGORIES} />

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
