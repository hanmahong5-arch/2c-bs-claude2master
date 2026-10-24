import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getArticleGraph,
  getChangelog,
  getChangelogBySlug,
  getConceptGraph,
  getGraphDocs,
} from "@/lib/content";
import { relatedByGraph } from "@/lib/graph";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";
import ArticleGraphPanel from "@/components/graph/ArticleGraphPanel";
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

  const [graph, concept, graphDocs] = await Promise.all([
    getArticleGraph(item.slug),
    getConceptGraph(),
    getGraphDocs(),
  ]);
  const knownConcepts = new Set(concept.nodes.map((n) => n.key));
  const related = relatedByGraph(item.slug, graphDocs, 4);
  const askPrompt = `请用通俗中文帮我讲透这篇：「${item.title}」。要点：${item.hook}。它对国内开发者有什么实际影响？我该怎么用上？`;

  const jsonLd = changelogJsonLd(item);
  const pageUrl = `https://claude2master.com/changelog/${item.slug}`;
  // 原文链接文案随 kind 变化: release→"原文 release", 热门→"项目主页", 实践/观点→"原文"
  const sourceLabel =
    item.kind === "trending"
      ? "项目主页"
      : item.kind === "community"
        ? "讨论原帖"
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
          const k: ChangelogKind = item.kind ?? "changelog";
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

      {graph && <ArticleGraphPanel graph={graph} knownConcepts={knownConcepts} />}

      <div className="tutorial-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
      </div>

      {item.insight && (
        <aside className="insight">
          <p className="eyebrow mb-2">Lurus 视角</p>
          <p>{item.insight}</p>
        </aside>
      )}

      <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          还没吃透？把这篇丢给 AI 助手，让它结合你的场景讲清楚。
        </p>
        <div className="flex gap-2 shrink-0">
          <TrackedLink
            href={`/chat?ask=${encodeURIComponent(askPrompt)}`}
            event="radar_ask_ai"
            data={{ slug: item.slug }}
            className="btn btn-primary text-sm"
          >
            带着这篇去问 AI
          </TrackedLink>
          <TrackedLink
            href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.radarArticle)}
            event="outbound_newapi"
            data={{ campaign: OUTBOUND_CAMPAIGN.radarArticle, slug: item.slug }}
            external
            className="btn btn-secondary text-sm"
          >
            国内直连这些模型
          </TrackedLink>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--lt-ink)] mb-4">🕸 顺着图谱继续读</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {related.map(({ doc, shared }) => (
              <li key={doc.slug}>
                <Link
                  href={`/changelog/${doc.slug}`}
                  className="card group flex flex-col gap-2 h-full"
                >
                  <span className="text-sm font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors line-clamp-2">
                    {doc.title}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {doc.publishedAt} · 共同涉及 {shared.slice(0, 3).join("、")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/graph"
            className="inline-flex items-center gap-1 mt-4 text-sm text-[var(--c2m-accent-deep)] hover:underline"
          >
            打开全站 AI 知识图谱 →
          </Link>
        </section>
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
