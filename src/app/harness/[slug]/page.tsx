import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getHarness, getHarnessBySlug } from "@/lib/content";
import { harnessJsonLd } from "@/lib/jsonld";
import ShareButtons from "@/components/ShareButtons";

export async function generateStaticParams() {
  const items = await getHarness();
  return items.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getHarnessBySlug(slug);
  if (!item) return { title: "文章未找到" };
  const ogImage = `/og/${item.slug}`;
  return {
    title: item.title,
    description: item.desc,
    openGraph: {
      title: item.title,
      description: item.desc,
      type: "article",
      publishedTime: item.publishedAt,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.desc,
      images: [ogImage],
    },
    alternates: { canonical: `https://claude2master.com/harness/${item.slug}` },
  };
}

export default async function HarnessDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getHarnessBySlug(slug);
  if (!item) notFound();

  const jsonLd = harnessJsonLd(item);
  const pageUrl = `https://claude2master.com/harness/${item.slug}`;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/harness"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有 harness 文章
      </Link>

      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {item.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {item.desc}
      </p>
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} />
          {item.publishedAt}
        </span>
        {item.read && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            {item.read}
          </span>
        )}
      </div>

      <div className="tutorial-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
      </div>

      {item.references && item.references.length > 0 && (
        <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              参考来源
            </span>
          </div>
          <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
            {item.references.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}

      <ShareButtons
        url={pageUrl}
        title={item.title}
        slug={item.slug}
        channel="harness"
      />
    </article>
  );
}
