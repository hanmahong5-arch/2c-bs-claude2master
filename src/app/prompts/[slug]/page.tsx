import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { notFound } from "next/navigation";
import { PROMPTS, getPrompt } from "@/lib/prompts";
import { promptJsonLd } from "@/lib/jsonld";
import CopyPromptButton from "@/components/CopyPromptButton";

export function generateStaticParams() {
  return PROMPTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (!p) return { title: "Prompt 未找到" };
  const ogImage = `/og/${slug}`;
  return {
    title: p.title,
    description: p.desc,
    alternates: {
      canonical: `https://claude2master.com/prompts/${slug}`,
    },
    openGraph: {
      title: p.title,
      description: p.desc,
      type: "article",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.desc,
      images: [ogImage],
    },
  };
}

export default async function PromptDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (!p) notFound();

  const jsonLd = promptJsonLd(p);

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/prompts"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有 Prompt
      </Link>

      <p className="eyebrow mb-3">{p.category}</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {p.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        {p.desc}
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        <CopyPromptButton text={p.body} label="复制 prompt" />
        <Link href={`/chat?prompt=${p.slug}`} className="btn btn-secondary">
          <Play size={14} />
          在 Chat 里跑
        </Link>
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
        Prompt 全文
      </h2>
      <pre className="code-block whitespace-pre-wrap text-[13px]">{p.body}</pre>

      <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
        <span>来源：{p.source}</span>
        {p.license && (
          <span className="pill-outline pill text-[10px]">{p.license}</span>
        )}
        {p.tags && p.tags.length > 0 && (
          <div className="flex gap-1.5">
            {p.tags.map((t) => (
              <span key={t} className="pill-outline pill text-[10px]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
