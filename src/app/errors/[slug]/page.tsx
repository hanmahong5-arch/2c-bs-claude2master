import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ERROR_KB, getErrorEntry } from "@/lib/error-kb";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";
import TrackedLink from "@/components/TrackedLink";

export function generateStaticParams() {
  return ERROR_KB.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getErrorEntry(slug);
  if (!e) return { title: "报错未收录" };
  const desc = `${e.errorText} — ${e.symptom}`.slice(0, 150);
  return {
    title: `${e.title} · ${e.tool} 报错修复`,
    description: desc,
    alternates: { canonical: `https://claude2master.com/errors/${slug}` },
    openGraph: { type: "article", title: e.title, description: desc },
    twitter: { card: "summary_large_image", title: e.title, description: desc },
  };
}

// FAQPage 结构化数据: 问=报错, 答=修复步骤(利被搜索引擎/AI 引擎引用)
function faqJsonLd(e: (typeof ERROR_KB)[number]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${e.tool} 报错 ${e.errorText} 怎么解决?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `可能原因: ${e.causes.join("; ")}。修复步骤: ${e.fixes.join(" → ")}`,
        },
      },
    ],
  };
}

export default async function ErrorDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = getErrorEntry(slug);
  if (!e) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(e)) }}
      />

      <Link
        href="/errors"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        报错速查库
      </Link>

      <p className="eyebrow mb-3">{e.tool}</p>
      <h1 className="font-display italic text-3xl md:text-4xl font-semibold mb-6 headline-tight text-[var(--lt-ink)]">
        {e.title}
      </h1>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        报错原文
      </h2>
      <pre className="code-block whitespace-pre-wrap text-[13px] mb-6">{e.errorText}</pre>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        出现场景
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        {e.symptom}
      </p>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        可能原因(按概率)
      </h2>
      <ol className="list-decimal list-inside space-y-1.5 text-sm text-[var(--color-text-secondary)] mb-6">
        {e.causes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        修复步骤(从最简单的开始)
      </h2>
      <ol className="list-decimal list-inside space-y-2.5 text-sm text-[var(--color-text-secondary)] mb-6">
        {e.fixes.map((f) => (
          <li key={f} className="leading-relaxed">
            {f}
          </li>
        ))}
      </ol>

      {e.cnNote && (
        <div className="rounded-lg border border-[var(--c2m-accent)] bg-[var(--c2m-accent-soft)]/40 px-4 py-3 mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--c2m-accent-deep)] mb-1.5">
            大陆网络环境注记
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {e.cnNote}
          </p>
        </div>
      )}

      <div className="card">
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          反复被网络 / 支付 / 限流问题耗时间?国内直连的 API
          网关一个 key 通多家模型,绕开这一整类报错。
        </p>
        <TrackedLink
          href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.errorsKb)}
          event="outbound_newapi"
          data={{ campaign: OUTBOUND_CAMPAIGN.errorsKb, slug: e.slug }}
          external
          className="btn btn-secondary"
        >
          了解 newapi 网关
          <ArrowRight size={14} />
        </TrackedLink>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex gap-1.5 flex-wrap">
        {e.tags.map((t) => (
          <span key={t} className="pill-outline pill text-[10px]">
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}
