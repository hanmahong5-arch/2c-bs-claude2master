"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Github, Rss } from "lucide-react";
import {
  AUTHORED_LABEL,
  KIND_LABEL,
  VERIFIED_LABEL,
  type ChangelogItem,
  type ChangelogKind,
} from "@/lib/content-types";
import {
  TOOLS,
  toolForKey,
  toolForSource,
  toolListCopy,
  versionFromSourceUrl,
} from "@/lib/tools";
import { relativeAge } from "@/lib/date";
import { Reveal } from "@/components/Reveal";

// 筛选值: "all"(按工具分组) | "practice"(实践扁平) | 某 tool key(该工具扁平)
type Filter = string;

function resolveKind(c: ChangelogItem): ChangelogKind {
  return c.kind === "practice" ? "practice" : "changelog";
}

const TOOL_NAMES = toolListCopy("full");

function ChangelogCard({ c }: { c: ChangelogItem }) {
  const k = resolveKind(c);
  const kindMeta = KIND_LABEL[k];
  const age = relativeAge(c.publishedAt);
  return (
    <li>
      <Link
        href={`/changelog/${c.slug}`}
        className="card group flex flex-col gap-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`pill text-[10px] ${kindMeta.className}`}>
            {kindMeta.label}
          </span>
          <span className="pill text-[10px]">{c.source}</span>
          <span className="pill-outline pill text-[10px]">
            {AUTHORED_LABEL[c.authored]}
          </span>
          {c.verified && (
            <span
              className={`pill text-[10px] ${
                c.verified === "tested"
                  ? "bg-[rgba(31,122,79,0.12)] text-[var(--lt-ok)]"
                  : "bg-[rgba(184,130,31,0.12)] text-[var(--lt-warn)]"
              }`}
              title={
                c.verified === "tested"
                  ? "编辑部已在本地复现验证"
                  : "LLM 自动摘要，未做人工实测"
              }
            >
              {c.verified === "tested" ? "✓ " : "⏳ "}
              {VERIFIED_LABEL[c.verified]}
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
          {c.title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {c.hook}
        </p>
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={12} />
            {c.publishedAt}
            {age && (
              <span
                className="text-[var(--color-text-muted)]"
                suppressHydrationWarning
              >
                · {age}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Github size={12} />
            {k === "practice" ? "原文" : "原文 release"}
          </span>
        </div>
      </Link>
    </li>
  );
}

// 一个分组段: 段头 `● {name}  最新 {version}  [RSS]` + 该组卡片倒序。
// feedKey 仅工具段传入 → 段头出现 per-tool RSS pill; 其他/实践段不传 → 不显示。
function ToolSection({
  name,
  version,
  items,
  feedKey,
}: {
  name: string;
  version: string | null;
  items: ChangelogItem[];
  feedKey?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[var(--lt-ink)] inline-flex items-center gap-2">
          <span className="text-[var(--c2m-accent)]">●</span>
          {name}
        </h2>
        {version && (
          <span className="pill text-[10px] bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)]">
            最新 {version}
          </span>
        )}
        {feedKey && (
          <Link
            href={`/feed/tool/${feedKey}`}
            className="pill-outline pill text-[10px] inline-flex items-center gap-1 hover:text-[var(--c2m-accent-deep)]"
            title={`${name} 的 RSS 订阅`}
          >
            <Rss size={10} />
            RSS
          </Link>
        )}
      </div>
      <ul className="space-y-4">
        {items.map((c) => (
          <ChangelogCard key={c.slug} c={c} />
        ))}
      </ul>
    </section>
  );
}

function ChangelogListInner({ items }: { items: ChangelogItem[] }) {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");
  const initialFilter: Filter =
    toolParam && toolForKey(toolParam) ? toolParam : "all";
  const [filter, setFilter] = useState<Filter>(initialFilter);

  // items 已按 publishedAt 倒序(getChangelog),组内顺序天然倒序。
  const { byKey, other, practices } = useMemo(() => {
    const byKey = new Map<string, ChangelogItem[]>();
    const other: ChangelogItem[] = [];
    const practices: ChangelogItem[] = [];
    for (const c of items) {
      if (resolveKind(c) === "practice") {
        practices.push(c);
        continue;
      }
      const tool = toolForSource(c.source);
      if (tool) {
        const arr = byKey.get(tool.key) ?? [];
        arr.push(c);
        byKey.set(tool.key, arr);
      } else {
        other.push(c);
      }
    }
    return { byKey, other, practices };
  }, [items]);

  // pill 只显示有内容的工具,避免点进去空白。
  const toolFilters = TOOLS.filter((t) => (byKey.get(t.key)?.length ?? 0) > 0);
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "全部" },
    ...toolFilters.map((t) => ({ value: t.key, label: t.name })),
    ...(practices.length > 0
      ? [{ value: "practice", label: "实践" }]
      : []),
  ];

  function versionOf(group: ChangelogItem[]): string | null {
    return group.length > 0 ? versionFromSourceUrl(group[0].sourceUrl) : null;
  }

  const hasAnything = items.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">工具更新雷达</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            每天追踪主流 AI 编码工具。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            GitHub Actions 每天 09:30 抓取 {TOOL_NAMES}
            {" "}的新 release + Anthropic 工程博客，自动产出中文摘要 + Lurus 视角。
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
            <Link
              href="/feed/changelog"
              className="pill-outline pill hover:text-[var(--c2m-accent-deep)]"
            >
              RSS · changelog only
            </Link>
            <Link
              href="/feed.xml"
              className="pill-outline pill hover:text-[var(--c2m-accent-deep)]"
            >
              RSS · 全站
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = f.value === filter;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`pill text-xs cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--c2m-accent)] text-white"
                      : "pill-outline hover:text-[var(--c2m-accent-deep)]"
                  }`}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </header>
      </Reveal>

      {!hasAnything ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          暂无更新 — daily-radar workflow 首跑后这里会有内容。
        </p>
      ) : filter === "all" ? (
        <div>
          {TOOLS.map((t) => {
            const group = byKey.get(t.key) ?? [];
            return (
              <ToolSection
                key={t.key}
                name={t.name}
                version={versionOf(group)}
                items={group}
                feedKey={t.key}
              />
            );
          })}
          {other.length > 0 && (
            <ToolSection name="其他" version={null} items={other} />
          )}
          {practices.length > 0 && (
            <ToolSection name="实践" version={null} items={practices} />
          )}
        </div>
      ) : filter === "practice" ? (
        <ul className="space-y-4">
          {practices.map((c) => (
            <ChangelogCard key={c.slug} c={c} />
          ))}
        </ul>
      ) : (
        (() => {
          const group = byKey.get(filter) ?? [];
          if (group.length === 0) {
            return (
              <p className="text-sm text-[var(--color-text-muted)]">
                当前筛选下没有条目。
              </p>
            );
          }
          return (
            <ul className="space-y-4">
              {group.map((c) => (
                <ChangelogCard key={c.slug} c={c} />
              ))}
            </ul>
          );
        })()
      )}
    </div>
  );
}

export default function ChangelogList({ items }: { items: ChangelogItem[] }) {
  // useSearchParams 需 Suspense 边界(page.tsx force-static)。
  return (
    <Suspense fallback={null}>
      <ChangelogListInner items={items} />
    </Suspense>
  );
}
