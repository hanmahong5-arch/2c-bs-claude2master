import type { Metadata } from "next";
import Link from "next/link";
import { Copy } from "lucide-react";
import {
  PROMPTS,
  PROMPT_CATEGORIES,
  MODEL_LABEL,
} from "@/lib/prompts";

export const metadata: Metadata = {
  title: "Prompt 库",
  description:
    "按场景分类的高质量 Claude 中文提示词 — 写作、编程、翻译、学习、营销、数据分析。点击即复制。",
};

const CATEGORIES = ["全部", ...PROMPT_CATEGORIES];

export default function PromptsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-10">
        <p className="eyebrow mb-3">Prompt 库</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
          复制即走，零摩擦。
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          编辑部精选的中文提示词。按场景分类，标注适用模型，一键复制 → 跳到 Chat 跑。
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[var(--color-border)]">
        {CATEGORIES.map((c, i) => (
          <button key={c} className={i === 0 ? "pill" : "pill-outline pill"}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PROMPTS.map((p) => (
          <Link
            key={p.slug}
            href={`/prompts/${p.slug}`}
            className="card card-prompt group block"
          >
            <p className="eyebrow mb-3">
              {p.category} · {MODEL_LABEL[p.modelKey]}
            </p>
            <h3 className="text-lg font-semibold mb-2 text-[var(--lt-ink)]">
              {p.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
              {p.desc}
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>预览 / 详情</span>
              <span className="inline-flex items-center gap-1 text-[var(--c2m-accent-deep)]">
                <Copy size={12} />
                复制 ↵
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-sm text-[var(--color-text-muted)] text-center">
        当前 {PROMPTS.length} 条种子 · 更多 prompt 持续上线中
      </p>
    </div>
  );
}
