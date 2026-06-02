import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TUTORIALS, getTutorial } from "@/lib/tutorials";
import { tutorialJsonLd } from "@/lib/jsonld";
import TrackedLink from "@/components/TrackedLink";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";

const SITE = "https://claude2master.com";

export function generateStaticParams() {
  return TUTORIALS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) return { title: "教程未找到" };
  const ogImage = `/og/${slug}`;
  return {
    title: t.title,
    description: t.desc,
    alternates: {
      canonical: `${SITE}/tutorials/${slug}`,
    },
    openGraph: {
      title: t.title,
      description: t.desc,
      type: "article",
      publishedTime: t.date,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.desc,
      images: [ogImage],
    },
  };
}

export default async function TutorialDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) notFound();

  const jsonLd = tutorialJsonLd(t);

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/tutorials"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有教程
      </Link>

      <div className="flex items-center gap-2 mb-3">
        <span className="pill text-[10px]">{t.category}</span>
        {t.pinned && (
          <span className="pill-outline pill text-[10px]">置顶</span>
        )}
      </div>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {t.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {t.desc}
      </p>

      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} />
          {t.read}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} />
          {t.date}
        </span>
      </div>

      <div className="tutorial-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.body}</ReactMarkdown>
      </div>

      <footer className="mt-12 pt-8 border-t border-[var(--color-border)]">
        <TrackedLink
          external
          href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.tutorial)}
          event="cta_register_newapi"
          data={{ from: "tutorial", slug }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--c2m-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          在 newapi.lurus.cn 注册，3 分钟跑通 →
        </TrackedLink>
      </footer>
    </article>
  );
}
