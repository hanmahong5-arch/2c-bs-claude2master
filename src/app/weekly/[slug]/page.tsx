import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDigest, getDigestBySlug } from "@/lib/content";
import { digestJsonLd } from "@/lib/jsonld";
import ShareButtons from "@/components/ShareButtons";

export async function generateStaticParams() {
  const items = await getDigest();
  return items.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getDigestBySlug(slug);
  if (!item) return { title: "周报未找到" };
  const ogImage = `/og/${item.slug}`;
  return {
    title: item.title,
    description: item.hook,
    openGraph: {
      title: item.title,
      description: item.hook,
      type: "article",
      publishedTime: item.publishedAt,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.hook,
      images: [ogImage],
    },
    alternates: { canonical: `https://claude2master.com/weekly/${item.slug}` },
  };
}

export default async function WeeklyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getDigestBySlug(slug);
  if (!item) notFound();

  const jsonLd = digestJsonLd(item);
  const pageUrl = `https://claude2master.com/weekly/${item.slug}`;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/weekly"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有周报
      </Link>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="pill text-[10px]">Week of {item.weekOf}</span>
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
        {item.readingMinutes && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            {item.readingMinutes} 分钟阅读
          </span>
        )}
      </div>

      <div className="tutorial-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
      </div>

      <ShareButtons
        url={pageUrl}
        title={item.title}
        slug={item.slug}
        channel="digest"
      />
    </article>
  );
}
