import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Github, Star, Calendar } from "lucide-react";
import { TOOLS, TASKS, SCORES, aggregateScore } from "@/lib/coding-rank";

export const metadata: Metadata = {
  title: "中文 AI 编程榜 v0 · Claude Code / Cursor / Cline / Aider",
  description:
    "5 道中文编程 spec × 4 个主流 AI coding 工具的横向参考评分。v0 静态版,标注每条评分依据。",
  alternates: {
    canonical: "https://claude2master.com/rank",
  },
};

export const dynamic = "force-static";

const SCORE_DOT: Record<number, string> = {
  1: "bg-[var(--lt-err)] text-white",
  2: "bg-[rgba(184,130,31,0.9)] text-white",
  3: "bg-[rgba(184,130,31,0.5)] text-[var(--lt-ink)]",
  4: "bg-[rgba(31,122,79,0.5)] text-[var(--lt-ink)]",
  5: "bg-[var(--lt-ok)] text-white",
};

const CATEGORY_LABEL: Record<string, string> = {
  frontend: "前端",
  backend: "后端",
  data: "数据",
  fullstack: "全栈",
  infra: "运维",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export default function RankPage() {
  const ranked = [...TOOLS].sort(
    (a, b) => aggregateScore(b.key) - aggregateScore(a.key),
  );

  return (
    <article className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      <p className="eyebrow mb-3">编程榜 · v0</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        中文 AI 编程榜
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed max-w-3xl">
        5 道中文编程 spec × 4 个主流工具的横向参考评分。本页是 v0 静态版 — 每个评分都附依据,不藏盲点。
      </p>

      <div className="mb-10 px-4 py-3 rounded-md border border-[var(--lt-warn)] bg-[rgba(184,130,31,0.06)] flex items-start gap-2 text-sm">
        <AlertCircle
          size={16}
          className="flex-shrink-0 mt-0.5 text-[var(--lt-warn)]"
        />
        <div className="text-[var(--color-text-secondary)]">
          <strong className="text-[var(--lt-warn)]">v0 静态版,不是自动 benchmark。</strong>
          评分来源:Aider polyglot leaderboard (公开) +
          CursorBench (Cursor 自报) + 编辑部主观估值 + 中文场景调整。
          自动跑分管道在 c2m 下一阶段路线图里。看到的差异不要当 ±2% 精度的事实。
        </div>
      </div>

      <h2 className="font-display italic text-2xl font-semibold mb-4 text-[var(--lt-ink)]">
        总览
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {ranked.map((t, i) => {
          const score = aggregateScore(t.key);
          return (
            <div
              key={t.key}
              className="card flex flex-col gap-2"
              aria-label={`${t.label} 排名第 ${i + 1}`}
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow">#{i + 1}</span>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--c2m-accent-deep)]">
                  <Star size={11} />
                  {score.toFixed(1)} / 5
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--lt-ink)]">
                {t.label}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t.vendor} · {t.modelDefault}
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="pill-outline pill">{t.pricePerMonth}</span>
                {t.openSource && (
                  <span className="pill text-[var(--lt-ok)] bg-[rgba(31,122,79,0.12)]">
                    <Github size={9} />
                    开源
                  </span>
                )}
                {t.cnReachability === "direct" && (
                  <span className="pill bg-[rgba(31,122,79,0.12)] text-[var(--lt-ok)]">
                    国内直连
                  </span>
                )}
                {t.cnReachability === "hybrid" && (
                  <span className="pill bg-[rgba(184,130,31,0.12)] text-[var(--lt-warn)]">
                    插件直连 + LLM 需代理
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="font-display italic text-2xl font-semibold mb-4 text-[var(--lt-ink)]">
        逐 spec 评分
      </h2>
      <div className="overflow-x-auto mb-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left py-3 pr-4 font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                Spec
              </th>
              {TOOLS.map((t) => (
                <th
                  key={t.key}
                  className="text-center py-3 px-2 font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider"
                >
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => (
              <tr
                key={task.id}
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
              >
                <td className="py-4 pr-4 align-top">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="pill-outline pill text-[10px]">
                      {CATEGORY_LABEL[task.category]}
                    </span>
                    <span className="pill-outline pill text-[10px]">
                      {DIFFICULTY_LABEL[task.difficulty]}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--lt-ink)] font-medium mb-1">
                    {task.prompt}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    成功:{task.successCriteria}
                  </p>
                </td>
                {TOOLS.map((tool) => {
                  const cell = SCORES.find(
                    (s) => s.tool === tool.key && s.task === task.id,
                  );
                  if (!cell)
                    return (
                      <td
                        key={tool.key}
                        className="text-center align-middle py-4 px-2"
                      >
                        —
                      </td>
                    );
                  return (
                    <td
                      key={tool.key}
                      className="text-center align-middle py-4 px-2"
                    >
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${SCORE_DOT[cell.score]}`}
                        title={cell.note}
                      >
                        {cell.score}
                      </div>
                      <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)] leading-tight max-w-[180px] mx-auto">
                        {cell.note}
                      </p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display italic text-2xl font-semibold mb-4 text-[var(--lt-ink)]">
        方法论披露
      </h2>
      <div className="card mb-12 space-y-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
        <p>
          <strong className="text-[var(--lt-ink)]">评分维度</strong>:
          能跑 + 一次过 + 代码质量,合并成 1-5 综合分。1 = 失败 / 2 = 勉强 / 3 = 能用 / 4 = 好 / 5 = 出彩。
        </p>
        <p>
          <strong className="text-[var(--lt-ink)]">数据来源</strong>:
          (a){" "}
          <a
            href="https://aider.chat/docs/leaderboards/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--c2m-accent-deep)] underline"
          >
            Aider polyglot leaderboard
          </a>{" "}
          (公开,英文 spec) (b) Cursor CursorBench 自报数据 (c) 编辑部主观 + 中文场景调整 (英文场景到中文场景普遍降 5-10%) (d) 社区 X / Reddit / V2EX 共识
        </p>
        <p>
          <strong className="text-[var(--lt-ink)]">不做什么</strong>:
          没有自动跑测试 / 没有控制 prompt 微调 / 没有 n=k 多次取均 / 没有 95% 置信区间。任何 ±1 分差异都在主观范围内。
        </p>
        <p>
          <strong className="text-[var(--lt-ink)]">路线图</strong>:
          v1 计划接 30 道中文 spec + 自动跑分 runner (Anyrun 等沙箱) + 每月刷新 + 公开 transcript。订阅 c2m{" "}
          <Link href="/feed/changelog" className="text-[var(--c2m-accent-deep)] underline">
            RSS
          </Link>{" "}
          或{" "}
          <Link href="/subscribe" className="text-[var(--c2m-accent-deep)] underline">
            Newsletter
          </Link>{" "}
          跟进发布。
        </p>
      </div>

      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
        <Calendar size={12} />
        最近一次估值更新:2026-05-26 (编辑部 v0)
      </div>
    </article>
  );
}
