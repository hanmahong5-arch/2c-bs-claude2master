import type { Metadata } from "next";
import { PROMPTS, PROMPT_CATEGORIES } from "@/lib/prompts";
import PromptList from "./PromptList";

export const metadata: Metadata = {
  title: "Prompt 库",
  description:
    "按场景分类的高质量 Claude 中文提示词 — 写作、编程、翻译、学习、营销、数据分析。点击即复制。",
};

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

      <PromptList prompts={PROMPTS} categories={PROMPT_CATEGORIES} />
    </div>
  );
}
