"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { type Tutorial, type TutorialCategory } from "@/lib/tutorials";
import { useUrlFilter } from "@/lib/use-url-filter";

export default function TutorialsList({
  tutorials,
  categories,
}: {
  tutorials: Tutorial[];
  categories: TutorialCategory[];
}) {
  // 分类筛选存进 URL ?cat= → 点进详情返回时保留分类与滚动位置(见 useUrlFilter)
  const [active, selectCat] = useUrlFilter<"全部" | TutorialCategory>(
    "cat",
    (raw) => raw === "全部" || categories.includes(raw as TutorialCategory),
    "全部",
  );

  // 只显示有内容的分类，避免点进去空白
  const populated = categories.filter((c) =>
    tutorials.some((t) => t.category === c)
  );

  const filters: { value: "全部" | TutorialCategory; label: string }[] = [
    { value: "全部", label: "全部" },
    ...populated.map((c) => ({ value: c, label: c })),
  ];

  const filtered =
    active === "全部"
      ? tutorials
      : tutorials.filter((t) => t.category === active);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-[var(--color-border)]">
        {filters.map((f) => {
          const isActive = f.value === active;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => selectCat(f.value)}
              aria-pressed={isActive}
              className={`pill text-xs cursor-pointer transition-colors ${
                isActive
                  ? "bg-[var(--c2m-accent-deep)] text-white"
                  : "pill-outline hover:text-[var(--c2m-accent-deep)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-sm text-[var(--color-text-muted)]">
          这个分类还没有教程 — 编辑部正在补充。
        </p>
      ) : (
      <ul className="space-y-4">
        {filtered.map((t) => (
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
      )}
    </>
  );
}
