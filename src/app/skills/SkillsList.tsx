"use client";

import Link from "next/link";
import { Package, Download } from "lucide-react";
import { type Skill, type SkillCategory } from "@/lib/skills";
import { useUrlFilter } from "@/lib/use-url-filter";
import { Stagger, StaggerItem } from "@/components/Reveal";

const SOURCE_BADGE: Record<string, string> = {
  Anthropic: "Anthropic 官方",
  "Lurus 出品": "Lurus 出品",
  "Lurus 编辑部": "Lurus demo",
};

export default function SkillsList({
  skills,
  categories,
}: {
  skills: Skill[];
  categories: SkillCategory[];
}) {
  // 分类筛选存进 URL ?cat= → 点进详情返回时保留分类与滚动位置(见 useUrlFilter)
  const [active, selectCat] = useUrlFilter<"全部" | SkillCategory>(
    "cat",
    (raw) => raw === "全部" || categories.includes(raw as SkillCategory),
    "全部",
  );

  // 只显示有内容的分类，避免点进去空白
  const populated = categories.filter((c) =>
    skills.some((s) => s.category === c)
  );

  const filters: { value: "全部" | SkillCategory; label: string }[] = [
    { value: "全部", label: "全部" },
    ...populated.map((c) => ({ value: c, label: c })),
  ];

  const filtered =
    active === "全部" ? skills : skills.filter((s) => s.category === active);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[var(--color-border)]">
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
          这个分类还没有 skill — 编辑部正在补充。
        </p>
      ) : (
      <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => (
          <StaggerItem key={s.slug} className="h-full">
            <Link
              href={`/skills/${s.slug}`}
              className="card group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-3">
                <Package
                  size={28}
                  className="text-[var(--c2m-accent)]"
                  strokeWidth={1.5}
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(124, 92, 255, 0.35))",
                  }}
                />
                <span className="pill-outline pill text-[10px]">
                  {SOURCE_BADGE[s.source] ?? s.source}
                </span>
              </div>
              <p className="eyebrow mb-2">{s.category}</p>
              <h3 className="font-mono text-base mb-2 text-[var(--lt-ink)]">
                {s.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1 mb-4">
                {s.desc}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--c2m-accent-deep)] font-medium">
                <Download size={12} />
                安装 / 详情
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
      )}
    </>
  );
}
