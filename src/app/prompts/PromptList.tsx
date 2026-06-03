"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import type { Prompt, PromptCategory } from "@/lib/prompts";
import { MODEL_LABEL } from "@/lib/prompts";
import { useUrlFilter } from "@/lib/use-url-filter";

type Filter = "全部" | PromptCategory;

export default function PromptList({
  prompts,
  categories,
}: {
  prompts: Prompt[];
  categories: PromptCategory[];
}) {
  const router = useRouter();
  // 分类筛选存进 URL ?cat= → 点进详情返回时保留分类与滚动位置(见 useUrlFilter)
  const [active, selectCat] = useUrlFilter<Filter>(
    "cat",
    (raw) => raw === "全部" || (categories as string[]).includes(raw),
    "全部",
  );
  const filters: Filter[] = ["全部", ...categories];

  const filtered =
    active === "全部" ? prompts : prompts.filter((p) => p.category === active);

  function onTry(slug: string) {
    router.push(`/chat?prompt=${slug}`);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[var(--color-border)]">
        {filters.map((f) => {
          const isActive = f === active;
          return (
            <button
              key={f}
              type="button"
              onClick={() => selectCat(f)}
              className={
                isActive
                  ? "pill cursor-pointer"
                  : "pill-outline pill cursor-pointer hover:border-[var(--c2m-accent)] hover:text-[var(--c2m-accent-deep)] transition-colors"
              }
              aria-pressed={isActive}
            >
              {f}
              {f !== "全部" && (
                <span className="ml-1 text-[var(--color-text-muted)]">
                  {prompts.filter((p) => p.category === f).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-sm text-[var(--color-text-muted)]">
          这个分类还没有 prompt — 编辑部正在补充。
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <article
              key={p.slug}
              className="card card-prompt group relative block"
            >
              {/* 覆盖式链接让整卡可点, 「试一下」按钮独立浮于其上(z-10) ——
                  避免 <a> 内嵌 <button> 的非法结构(键盘 Enter 行为未定义 + 部分 AT 漏掉按钮) */}
              <Link
                href={`/prompts/${p.slug}`}
                aria-label={p.title}
                className="absolute inset-0 rounded-[inherit]"
              />
              <p className="eyebrow mb-3">
                {p.category} · {MODEL_LABEL[p.modelKey]}
              </p>
              <h3 className="text-lg font-semibold mb-2 text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                {p.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
                {p.desc}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">详情</span>
                <button
                  type="button"
                  onClick={() => onTry(p.slug)}
                  className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)] font-medium hover:bg-[var(--c2m-accent)] hover:text-white transition-colors"
                  aria-label={`在 Chat 里试一下 ${p.title}`}
                >
                  <Play size={11} />
                  试一下
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-12 text-sm text-[var(--color-text-muted)] text-center">
        {active === "全部"
          ? `当前 ${prompts.length} 条种子 · 更多 prompt 持续上线中`
          : `分类「${active}」共 ${filtered.length} 条`}
      </p>
    </>
  );
}
