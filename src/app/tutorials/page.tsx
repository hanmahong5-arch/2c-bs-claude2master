import type { Metadata } from "next";
import { TUTORIALS, TUTORIAL_CATEGORIES } from "@/lib/tutorials";
import { Reveal } from "@/components/Reveal";
import TutorialsList from "./TutorialsList";

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
      </Reveal>

      <TutorialsList tutorials={TUTORIALS} categories={TUTORIAL_CATEGORIES} />
    </div>
  );
}
