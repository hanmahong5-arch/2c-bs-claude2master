"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Volume2 } from "lucide-react";
import type { ChangelogItem } from "@/lib/content-types";
import {
  TOOLS,
  TOOL_GROUPS,
  toolForKey,
  toolForSource,
  toolListCopy,
  toolsInGroup,
  versionFromSourceUrl,
} from "@/lib/tools";
import { useUrlFilter } from "@/lib/use-url-filter";
import { Reveal } from "@/components/Reveal";
import { useBroadcast } from "@/components/broadcast/useBroadcast";
import RadarHighlights from "@/components/RadarHighlights";
import { ChangelogCard, ToolSection, resolveKind } from "./ChangelogSections";

type Filter = string;

const TOOL_NAMES = toolListCopy("full");

function versionOf(group: ChangelogItem[]): string | null {
  return group.length > 0 ? versionFromSourceUrl(group[0].sourceUrl) : null;
}

export default function ChangelogList({ items }: { items: ChangelogItem[] }) {
  const { toggle, open: broadcasting, hasAudio } = useBroadcast();

  const [filter, selectFilter] = useUrlFilter<Filter>(
    "tool",
    (raw) =>
      raw === "all" ||
      raw === "practice" ||
      raw === "trending" ||
      raw === "blogger" ||
      !!toolForKey(raw),
    "all",
  );

  const { byKey, other, practices, trending, bloggers, bloggersByAuthor } =
    useMemo(() => {
      const byKey = new Map<string, ChangelogItem[]>();
      const other: ChangelogItem[] = [];
      const practices: ChangelogItem[] = [];
      const trending: ChangelogItem[] = [];
      const bloggers: ChangelogItem[] = [];
      const bloggersByAuthor = new Map<string, ChangelogItem[]>();
      for (const c of items) {
        const k = resolveKind(c);
        if (k === "practice") {
          practices.push(c);
          continue;
        }
        if (k === "trending") {
          trending.push(c);
          continue;
        }
        if (k === "blogger") {
          bloggers.push(c);
          const author = c.author ?? c.source;
          const arr = bloggersByAuthor.get(author) ?? [];
          arr.push(c);
          bloggersByAuthor.set(author, arr);
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
      return { byKey, other, practices, trending, bloggers, bloggersByAuthor };
    }, [items]);

  const toolFilters = TOOLS.filter((t) => (byKey.get(t.key)?.length ?? 0) > 0);
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "全部" },
    ...toolFilters.map((t) => ({ value: t.key, label: t.name })),
    ...(trending.length > 0 ? [{ value: "trending", label: "🔥 热门" }] : []),
    ...(bloggers.length > 0 ? [{ value: "blogger", label: "💬 观点" }] : []),
    ...(practices.length > 0 ? [{ value: "practice", label: "实践" }] : []),
  ];

  const hasAnything = items.length > 0;
  const agentTools = toolsInGroup("agent-runtime");
  const agentMeta = TOOL_GROUPS.find((g) => g.key === "agent-runtime");
  const hasAnyAgent = agentTools.some(
    (t) => (byKey.get(t.key)?.length ?? 0) > 0,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">工具更新雷达</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            每天追踪主流 AI 编码工具。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            {TOOL_NAMES} 等主流工具的新版本、工程博客与 GitHub 热门项目，每日中文整理 + 编辑视角。
          </p>

          {hasAnything && (
            <RadarHighlights
              trending={trending}
              bloggers={bloggers}
              onSelect={selectFilter}
              className="mt-7"
            />
          )}

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
            <button
              type="button"
              onClick={toggle}
              disabled={!hasAudio}
              aria-pressed={broadcasting}
              className={`pill-outline pill inline-flex items-center gap-1.5 transition-colors ${
                hasAudio
                  ? "hover:text-[var(--c2m-accent-deep)] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              } ${broadcasting ? "text-[var(--c2m-accent-deep)]" : ""}`}
              title={hasAudio ? "串行播报新闻" : "音频生成中"}
              aria-label="语音播报新闻"
            >
              <Volume2 size={12} />
              {broadcasting ? "🔊 停止" : "🔊 播报"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = f.value === filter;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => selectFilter(f.value)}
                  className={`pill text-xs cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--c2m-accent-deep)] text-white"
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
          {toolsInGroup("coding").map((t) => {
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
          {hasAnyAgent && agentMeta && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-[var(--lt-ink)] inline-flex items-center gap-2 mb-1">
                <span className="text-[var(--c2m-accent)]">●</span>
                {agentMeta.label}
              </h2>
              {agentMeta.blurb && (
                <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-2xl">
                  {agentMeta.blurb}
                </p>
              )}
              <div className="pl-1">
                {agentTools.map((t) => {
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
              </div>
            </section>
          )}
          {trending.length > 0 && (
            <ToolSection name="🔥 热门项目" version={null} items={trending} />
          )}
          {bloggers.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-[var(--lt-ink)] inline-flex items-center gap-2 mb-4">
                <span className="text-[var(--lt-info)]">●</span>
                💬 观点
              </h2>
              <div className="pl-1">
                {[...bloggersByAuthor.entries()].map(([author, group]) => (
                  <ToolSection
                    key={`blog-${author}`}
                    name={author}
                    version={null}
                    items={group}
                  />
                ))}
              </div>
            </section>
          )}
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
      ) : filter === "trending" ? (
        <ul className="space-y-4">
          {trending.map((c) => (
            <ChangelogCard key={c.slug} c={c} />
          ))}
        </ul>
      ) : filter === "blogger" ? (
        <ul className="space-y-4">
          {bloggers.map((c) => (
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
