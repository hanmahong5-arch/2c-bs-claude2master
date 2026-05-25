import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Copy, Play } from "lucide-react";
import { notFound } from "next/navigation";

const PROMPTS: Record<
  string,
  { title: string; category: string; model: string; desc: string; body: string }
> = {
  "react-perf-doctor": {
    title: "React 性能诊断师",
    category: "编程",
    model: "Sonnet 4.5",
    desc: "粘贴你的组件代码，让 Claude 找出 re-render 与内存泄漏的根因。",
    body: `你是一位资深的 React 性能工程师。我会给你一段组件代码，请按以下步骤诊断：\n\n1. 找出会触发不必要 re-render 的写法（包括 props/state/context）\n2. 检查 useEffect / useCallback / useMemo 依赖数组的正确性\n3. 标记潜在的内存泄漏（订阅未清理、闭包持有大对象）\n4. 给出每条问题的"代码 → 修复"对照\n\n输出格式：先一句话总评，再分条列举，每条 ≤ 3 行。\n\n代码：\n<paste-here>`,
  },
  "long-form-outline": {
    title: "长文大纲生成器",
    category: "写作",
    model: "Opus 4.7",
    desc: "给定主题与受众，输出三段式提纲 + 关键论据 + 反方观点。",
    body: `你是资深内容编辑。我会给你主题与目标受众，请输出：\n\n1. 三段式提纲（What / Why / How），每段 1-2 句话\n2. 每段 3 个关键论据（事实/数据/案例）\n3. 反方观点 2 条 + 我们的反驳\n4. 一个抓人的标题 + 3 个副标候选\n\n主题：<topic>\n受众：<audience>`,
  },
  "tech-translate": {
    title: "中英技术文档对译",
    category: "翻译",
    model: "Haiku 4.5",
    desc: "保留代码块、链接、术语一致性的双向技术翻译。",
    body: `你是技术文档专业译员。规则：\n\n- 代码块 / inline code 原样保留，不翻译\n- 链接、URL、命令、变量名保留\n- 技术术语首次出现给中英双显（如"事件循环 (event loop)"）\n- 同一术语在全文中保持一致译名\n\n请翻译以下文本（自动判断中→英或英→中）：\n\n<text>`,
  },
};

export function generateStaticParams() {
  return Object.keys(PROMPTS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROMPTS[slug];
  if (!p) return { title: "Prompt 未找到" };
  return {
    title: p.title,
    description: p.desc,
  };
}

export default async function PromptDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = PROMPTS[slug];
  if (!p) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有 Prompt
      </Link>

      <p className="eyebrow mb-3">
        {p.category} · {p.model}
      </p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {p.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        {p.desc}
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        <button className="btn btn-primary">
          <Copy size={14} />
          复制 prompt
        </button>
        <Link
          href={`/chat?prompt=${slug}`}
          className="btn btn-secondary"
        >
          <Play size={14} />
          在 Chat 里跑
        </Link>
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
        Prompt 全文
      </h2>
      <pre className="code-block whitespace-pre-wrap text-[13px]">{p.body}</pre>
    </article>
  );
}
