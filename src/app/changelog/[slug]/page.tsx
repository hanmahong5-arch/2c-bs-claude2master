import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getChangelog, getChangelogBySlug } from "@/lib/content";
import {
  AUTHORED_LABEL,
  KIND_LABEL,
  VERIFIED_LABEL,
  type ChangelogKind,
} from "@/lib/content-types";
import { changelogJsonLd } from "@/lib/jsonld";
import ShareButtons from "@/components/ShareButtons";
import TrackedLink from "@/components/TrackedLink";

export async function generateStaticParams() {
  const items = await getChangelog();
  return items.map((c) => ({ slug: c.slug }));
}

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
            item.kind === "practice" ? "practice" : "changelog";
          const meta = KIND_LABEL[k];
          return (
            <span className={`pill text-[10px] ${meta.className}`}>
              {meta.label}
            </span>
          );
        })()}
        <span className="pill text-[10px]">{item.source}</span>
        <span className="pill-outline pill text-[10px]">
          {AUTHORED_LABEL[item.authored]}
          {item.model ? ` · ${item.model}` : ""}
        </span>
        {item.verified && (
          <span
            className={`pill text-[10px] ${
              item.verified === "tested"
                ? "bg-[rgba(31,122,79,0.12)] text-[var(--lt-ok)]"
                : "bg-[rgba(184,130,31,0.12)] text-[var(--lt-warn)]"
            }`}
            title={
              item.verified === "tested"
                ? "编辑部已在本地复现验证"
                : "LLM 自动摘要，未做人工实测"
            }
          >
            <span aria-hidden="true">
              {item.verified === "tested" ? "✓ " : "⏳ "}
            </span>
            {VERIFIED_LABEL[item.verified]}
          </span>
        )}
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
          原文 release
        </TrackedLink>
      </div>

      {item.authored === "llm" && (
        <div className="mb-8 px-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
          本条为 LLM 自动摘要（model: <code>{item.model ?? "unknown"}</code>）。
          细节以
          <TrackedLink
            href={item.sourceUrl}
            external
            event="outbound_click"
            data={{ slug: item.slug, target: "release-disclaimer", source: item.source }}
            className="text-[var(--c2m-accent-deep)] mx-1"
          >
            原文 release
          </TrackedLink>
          为准。发现错误请在 GitHub 提 issue。
        </div>
      )}

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
