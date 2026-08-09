import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getChangelog, getChangelogBySlug } from "@/lib/content";
import {
  KIND_LABEL,
  type ChangelogKind,
} from "@/lib/content-types";
import { changelogJsonLd } from "@/lib/jsonld";
import ShareButtons from "@/components/ShareButtons";
import TrackedLink from "@/components/TrackedLink";

export async function generateStaticParams() {
  const items = await getChangelog();
  return items.map((c) => ({ slug: c.slug }));
}

// 该路由为纯 SSG:所有合法 slug 均已在构建期通过 generateStaticParams 枚举。
// 关闭 dynamicParams 让未知 slug 在路由匹配阶段直接 404,
// 避免流式 SSR 下 notFound() 触发晚于 header flush 导致状态码仍为 200。
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getChangelogBySlug(slug);
  if (!item) return { title: "Changelog 未找到" };
  const ogImage = `/og/${item.slug}`;
  const description =
    item.hook.length >= 80 || !item.insight
      ? item.hook
      : `${item.hook} ${item.insight}`.slice(0, 200);
  return {
    title: item.title,
    description,
    openGraph: {
      title: item.title,
      description,
      type: "article",
      publishedTime: item.publishedAt,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://claude2master.com/changelog/${item.slug}`,
    },
  };
}

export default async function ChangelogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getChangelogBySlug(slug);
  if (!item) notFound();

  const jsonLd = changelogJsonLd(item);
  const pageUrl = `https://claude2master.com/changelog/${item.slug}`;
  // 原文链接文案随 kind 变化: release→"原文 release", 热门→"项目主页", 实践/观点→"原文"
  const sourceLabel =
    item.kind === "trending"
      ? "项目主页"
      : item.kind === "practice" || item.kind === "blogger"
        ? "原文"
        : "原文 release";

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/changelog"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有 changelog
      </Link>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(() => {
          const k: ChangelogKind =
            item.kind === "practice"
              ? "practice"
              : item.kind === "trending"
                ? "trending"
                : item.kind === "blogger"
                  ? "blogger"
                  : "changelog";
          const meta = KIND_LABEL[k];
          return (
            <span className={`pill text-[10px] ${meta.className}`}>
              {meta.label}
            </span>
          );
        })()}
        <span className="pill text-[10px]">{item.source}</span>
      </div>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {item.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {item.hook}
      </p>

      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} />
          {item.publishedAt}
        </span>
        <TrackedLink
          href={item.sourceUrl}
          external
          event="outbound_click"
          data={{ slug: item.slug, target: "release", source: item.source }}
          className="inline-flex items-center gap-1.5 hover:text-[var(--c2m-accent-deep)]"
        >
          <ExternalLink size={12} />
          {sourceLabel}
        </TrackedLink>
      </div>

      <div className="mb-8 px-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
        本文为要点摘要，完整细节以
        <TrackedLink
          href={item.sourceUrl}
          external
          event="outbound_click"
          data={{ slug: item.slug, target: "release-disclaimer", source: item.source }}
          className="text-[var(--c2m-accent-deep)] mx-1"
        >
          {sourceLabel}
        </TrackedLink>
        为准。
      </div>

      <div className="tutorial-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
      </div>

      {item.insight && (
        <aside className="insight">
          <p className="eyebrow mb-2">Lurus 视角</p>
          <p>{item.insight}</p>
        </aside>
      )}

      <ShareButtons
        url={pageUrl}
        title={item.title}
        slug={item.slug}
        channel="changelog"
      />
    </article>
  );
}
