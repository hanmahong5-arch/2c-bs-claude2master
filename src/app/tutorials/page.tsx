import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Claude Code 教程",
  description:
    "中文系统化 Claude Code 教程：入门、配置、Skills、Hooks、MCP、工作流、进阶。",
};

const CATEGORIES = ["全部", "入门", "配置", "Skills", "Hooks", "MCP", "工作流"];

const TUTORIALS = [
  {
    slug: "claude-code-setup",
    category: "入门",
    title: "Claude Code 国内零障碍接入",
    desc: "一行 env 让 Claude Code 走 newapi 走 Claude — 不翻墙、不要美卡。",
    read: "5 分钟",
    date: "2026-05-25",
    pinned: true,
  },
  {
    slug: "model-selection",
    category: "配置",
    title: "Sonnet 4.5 vs Opus 4.7：选型与价格",
    desc: "什么任务该用哪个模型？把每月账单砍掉一半的实战指南。",
    read: "8 分钟",
    date: "2026-05-25",
  },
  {
    slug: "skills-intro",
    category: "Skills",
    title: "Skills 是什么、怎么写、怎么用",
    desc: "2025-12 新标准的来龙去脉 + 一个能跑的 hello-world skill。",
    read: "12 分钟",
    date: "2026-05-25",
  },
  {
    slug: "hooks-pre-commit",
    category: "Hooks",
    title: "Hooks 实战：每次提交前自动检查",
    desc: "用 pre-commit hook 让 Claude 强制跑 lint / typecheck，告别 CI 红。",
    read: "6 分钟",
    date: "2026-05-25",
  },
  {
    slug: "mcp-intro",
    category: "MCP",
    title: "MCP 入门：让 Claude 调你的工具",
    desc: "Model Context Protocol 从 0 到 1 — stdio 一个最小 server。",
    read: "10 分钟",
    date: "2026-05-25",
  },
  {
    slug: "forge-workflow",
    category: "工作流",
    title: "用 Forge 把 Claude 工作流图形化",
    desc: "可视化拖拉，把 prompt 组合成 agent 链 — 不写代码也能搭。",
    read: "15 分钟",
    date: "2026-05-25",
  },
];

export default function TutorialsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
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
          <button
            key={c}
            className={i === 0 ? "pill" : "pill-outline pill"}
          >
            {c}
          </button>
        ))}
      </div>

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
    </div>
  );
}
