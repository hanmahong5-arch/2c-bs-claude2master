import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Hash, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SEO_LANDINGS, getSeoLanding } from "@/lib/seo-landings";

export const dynamic = "force-static";

export function generateStaticParams() {
  return SEO_LANDINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = getSeoLanding(slug);
  if (!landing) return { title: "未找到" };
  return {
    title: landing.title,
    description: landing.desc,
    keywords: landing.keywords,
    openGraph: {
      title: landing.title,
      description: landing.desc,
      type: "article",
      images: [`/og/${landing.slug}`],
    },
    twitter: {
      card: "summary_large_image",
      title: landing.title,
      description: landing.desc,
      images: [`/og/${landing.slug}`],
    },
    alternates: {
      canonical: `https://claude2master.com/zh/${landing.slug}`,
    },
  };
}

export default async function ZhLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = getSeoLanding(slug);
  if (!landing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: landing.title,
    description: landing.desc,
    datePublished: landing.updatedAt,
    dateModified: landing.updatedAt,
    image: `https://claude2master.com/og/${landing.slug}`,
    author: {
      "@type": "Organization",
      name: "claude2master 编辑部",
      url: "https://claude2master.com",
    },
    publisher: {
      "@type": "Organization",
      name: "claude2master",
      url: "https://claude2master.com",
      logo: {
        "@type": "ImageObject",
        url: "https://claude2master.com/favicon.ico",
      },
    },
    inLanguage: "zh-CN",
    keywords: landing.keywords.join(", "),
    mainEntityOfPage: `https://claude2master.com/zh/${landing.slug}`,
  };

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="eyebrow mb-3">中文指南 · /zh/{landing.slug}</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {landing.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {landing.hook}
      </p>
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} />
          更新于 {landing.updatedAt}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[var(--lt-warn)]">
          编辑部维护
        </span>
      </div>

      <nav
        className="mb-10 px-5 py-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
        aria-label="目录"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          目录
        </p>
        <ol className="space-y-1.5 text-sm">
          {landing.toc.map((t, i) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)]"
              >
                <Hash size={11} className="text-[var(--color-text-muted)]" />
                <span className="text-[var(--color-text-muted)]">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                {t.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {landing.sections.map((s) => (
        <section
          key={s.id}
          id={s.id}
          className="mb-10 scroll-mt-20"
          aria-labelledby={`${s.id}-h`}
        >
          <h2
            id={`${s.id}-h`}
            className="font-display italic text-2xl font-semibold mb-3 text-[var(--lt-ink)] tracking-tight"
          >
            {s.title}
          </h2>
          <div className="tutorial-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.body}</ReactMarkdown>
          </div>
        </section>
      ))}

      <section className="mt-12 pt-8 border-t border-[var(--color-border)]">
        <p className="eyebrow mb-4">下一步</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {landing.ctas.map((cta) => {
            const isExternal = cta.href.startsWith("http");
            return (
              <Link
                key={cta.href}
                href={cta.href}
                {...(isExternal && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="card group flex flex-col gap-2 hover:border-[var(--c2m-accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                    {cta.label}
                  </span>
                  {isExternal ? (
                    <ExternalLink
                      size={14}
                      className="text-[var(--color-text-muted)] flex-shrink-0"
                    />
                  ) : (
                    <ArrowRight
                      size={14}
                      className="text-[var(--color-text-muted)] flex-shrink-0 group-hover:text-[var(--c2m-accent-deep)] group-hover:translate-x-0.5 transition-all"
                    />
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {cta.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 pt-6 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          这份指南是 c2m 编辑部基于公开文档与本地实测整理。发现错误或想补充？
          欢迎到{" "}
          <a
            href="https://github.com/hanmahong5-arch/2c-bs-claude2master"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--c2m-accent-deep)] underline"
          >
            GitHub
          </a>{" "}
          提 PR。所有内容遵循 c2m 诚实约束：未实测的部分会显式标注。
        </p>
      </section>
    </article>
  );
}
