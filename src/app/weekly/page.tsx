import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { getDigest } from "@/lib/content";
import { digestListJsonLd } from "@/lib/jsonld";
import { toolListCopy } from "@/lib/tools";

const _DESCRIPTION = `每周一回顾 ${toolListCopy("count")}与行业动态，中文整理。`;

export const metadata: Metadata = {
  title: "Weekly · Agent tooling 周报",
  description: _DESCRIPTION,
  alternates: {
    canonical: "https://claude2master.com/weekly",
  },
  openGraph: {
    title: "Weekly · Agent tooling 周报",
    description: _DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekly · Agent tooling 周报",
    description: _DESCRIPTION,
  },
};

export const dynamic = "force-static";

export default async function WeeklyPage() {
  const items = await getDigest();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(digestListJsonLd(items)),
        }}
      />
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-10">
        <p className="eyebrow mb-3">Weekly Digest</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
          一周 agent tooling 重点。
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          每周一一篇，覆盖 {toolListCopy("full")} 等 agentic 行业动态，中文整理 + 编辑视角。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
          <Link href="/feed/digest" className="pill-outline pill hover:text-[var(--c2m-accent-deep)]">
            RSS · weekly only
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          首期周报 W4 上线 — 当前 changelog 仍在积累首周事实。
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((d) => (
            <li key={d.slug}>
              <Link href={`/weekly/${d.slug}`} className="card group flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="pill text-[10px]">Week of {d.weekOf}</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                  {d.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {d.hook}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} />
                    {d.publishedAt}
                  </span>
                  {d.readingMinutes && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} />
                      {d.readingMinutes} 分钟
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
}
