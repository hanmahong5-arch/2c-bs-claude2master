import Link from "next/link";
import { Radar, ArrowRight } from "lucide-react";
import { KIND_LABEL, type ChangelogItem } from "@/lib/content-types";

/**
 * 今日速览 — 把「🔥 热门」「💬 观点」收口成顶部紧凑条:
 *   每条 = 小胶囊(标题), 悬停/键盘聚焦弹出摘要(hook)浮层, 点击进详情页。
 * 纯 CSS group-hover/focus-within(无额外 JS state)→ server/client 树皆可用, 摘要进静态 HTML(利 SEO)。
 */

const HOT_MAX = 6;
const OPINION_MAX = 6;

function HighlightChip({ c }: { c: ChangelogItem }) {
  const isBlogger = c.kind === "blogger";
  const who = isBlogger ? (c.author ?? c.source) : c.source;
  const label = isBlogger ? KIND_LABEL.blogger : KIND_LABEL.trending;
  return (
    <li className="relative group">
      <Link
        href={`/changelog/${c.slug}`}
        title={c.title}
        className="block max-w-[15rem] truncate rounded-full border border-[var(--color-border)] bg-[var(--lt-paper)] px-3 py-1.5 text-xs text-[var(--lt-ink)] transition-colors hover:border-[var(--c2m-accent)] hover:text-[var(--c2m-accent-deep)] focus-visible:border-[var(--c2m-accent)] focus-visible:outline-none"
      >
        {c.title}
      </Link>
      {/* 悬停 / 聚焦 摘要浮层 (pointer-events-none 不挡点击; 进 DOM 即在, hover 瞬时) */}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-72 max-w-[80vw] rounded-xl border border-[var(--color-border)] bg-white p-3 text-left opacity-0 translate-y-1 shadow-[0_8px_32px_rgba(20,19,15,0.12)] transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`pill text-[10px] ${label.className}`}>{label.label}</span>
          <span className="pill text-[10px]">{who}</span>
        </div>
        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{c.hook}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--c2m-accent-deep)]">
          点击看详细 <ArrowRight size={11} aria-hidden="true" />
        </span>
      </div>
    </li>
  );
}

function Row({
  kind,
  items,
  onSelect,
}: {
  kind: "trending" | "blogger";
  items: ChangelogItem[];
  onSelect?: (filter: string) => void;
}) {
  if (items.length === 0) return null;
  const label = KIND_LABEL[kind];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(kind)}
          className={`pill shrink-0 cursor-pointer text-[10px] transition-opacity hover:opacity-80 ${label.className}`}
          title={`只看${label.label}`}
        >
          {label.label}
        </button>
      ) : (
        <Link
          href={`/changelog?tool=${kind}`}
          className={`pill shrink-0 text-[10px] ${label.className}`}
          title={`只看${label.label}`}
        >
          {label.label}
        </Link>
      )}
      <ul className="flex flex-wrap gap-2">
        {items.map((c) => (
          <HighlightChip key={c.slug} c={c} />
        ))}
      </ul>
    </div>
  );
}

export default function RadarHighlights({
  trending,
  bloggers,
  onSelect,
  className = "",
}: {
  trending: ChangelogItem[];
  bloggers: ChangelogItem[];
  /** 传入则段标签变「筛选」按钮(电台页内联); 不传则段标签是跳转 Link(独立使用如首页)。 */
  onSelect?: (filter: string) => void;
  className?: string;
}) {
  const hot = trending.slice(0, HOT_MAX);
  const ops = bloggers.slice(0, OPINION_MAX);
  if (hot.length === 0 && ops.length === 0) return null;
  return (
    <section
      aria-label="今日热点与观点速览"
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 md:p-5 ${className}`}
    >
      <p className="eyebrow mb-3 inline-flex items-center gap-1.5">
        <Radar size={12} strokeWidth={2} aria-hidden="true" />
        今日速览 · 悬停看摘要，点击读全文
      </p>
      <div className="flex flex-col gap-2.5">
        <Row kind="trending" items={hot} onSelect={onSelect} />
        <Row kind="blogger" items={ops} onSelect={onSelect} />
      </div>
    </section>
  );
}
