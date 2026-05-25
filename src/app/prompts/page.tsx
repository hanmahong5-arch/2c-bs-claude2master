import type { Metadata } from "next";
import Link from "next/link";
import { Copy } from "lucide-react";

export const metadata: Metadata = {
  title: "Prompt 库",
  description:
    "按场景分类的高质量 Claude 中文提示词 — 写作、编程、翻译、学习、营销、数据分析。点击即复制。",
};

const CATEGORIES = [
  "全部",
  "写作",
  "编程",
  "翻译",
  "学习",
  "营销",
  "数据分析",
  "角色扮演",
];

const SEED = [
  {
    slug: "react-perf-doctor",
    category: "编程",
    model: "Sonnet 4.5",
    title: "React 性能诊断师",
    desc: "粘贴你的组件代码，让 Claude 找出 re-render 与内存泄漏的根因。",
  },
  {
    slug: "long-form-outline",
    category: "写作",
    model: "Opus 4.7",
    title: "长文大纲生成器",
    desc: "给定主题与受众，输出三段式提纲 + 关键论据 + 反方观点。",
  },
  {
    slug: "tech-translate",
    category: "翻译",
    model: "Haiku 4.5",
    title: "中英技术文档对译",
    desc: "保留代码块、链接、术语一致性的双向技术翻译。",
  },
];

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
          <button
            key={c}
            className={i === 0 ? "pill" : "pill-outline pill"}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SEED.map((p) => (
          <Link
            key={p.slug}
            href={`/prompts/${p.slug}`}
            className="card card-prompt group block"
          >
            <p className="eyebrow mb-3">
              {p.category} · {p.model}
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
        更多 prompt 持续上线中 · 当前 3 / 50 条种子
      </p>
    </div>
  );
}
