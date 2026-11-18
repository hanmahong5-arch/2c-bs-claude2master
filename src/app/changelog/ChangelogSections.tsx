"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Github, Rss } from "lucide-react";
import {
  KIND_LABEL,
  type ChangelogItem,
  type ChangelogKind,
} from "@/lib/content-types";
import { relativeAge } from "@/lib/date";

export function resolveKind(c: ChangelogItem): ChangelogKind {
  if (c.kind === "practice") return "practice";
  if (c.kind === "trending") return "trending";
  if (c.kind === "blogger") return "blogger";
  return "changelog";
}

export function ChangelogCard({ c }: { c: ChangelogItem }) {
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
          <span className="pill text-[10px]">
            {k === "blogger" ? (c.author ?? c.source) : c.source}
          </span>
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
            {k === "practice" || k === "blogger" ? "原文" : "原文 release"}
          </span>
        </div>
      </Link>
    </li>
  );
}

const SECTION_VISIBLE_DEFAULT = 10;

export function ToolSection({
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
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visibleItems = expanded
    ? items
    : items.slice(0, SECTION_VISIBLE_DEFAULT);
  const remaining = items.length - visibleItems.length;
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
        {visibleItems.map((c) => (
          <ChangelogCard key={c.slug} c={c} />
        ))}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="pill-outline pill mt-4 hover:text-[var(--c2m-accent-deep)]"
        >
          查看更多（还有 {remaining} 条）
        </button>
      )}
    </section>
  );
}
