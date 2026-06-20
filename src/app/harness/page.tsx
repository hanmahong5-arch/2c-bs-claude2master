import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { getHarness } from "@/lib/content";
import { harnessListJsonLd } from "@/lib/jsonld";
import { Reveal } from "@/components/Reveal";

const SITE = "https://claude2master.com";

export const metadata: Metadata = {
  title: "Harness · Agent harness 设计文章",
  description:
    "Agent scaffolding / context management / tool use / eval loop 的深度文章，由编辑部撰写。",
  alternates: {
    canonical: `${SITE}/harness`,
  },
  openGraph: {
    title: "Harness · Agent harness 设计文章",
    description:
      "Agent scaffolding / context management / tool use / eval loop 的深度文章，由编辑部撰写。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harness · Agent harness 设计文章",
    description:
      "Agent scaffolding / context management / tool use / eval loop 的深度文章，由编辑部撰写。",
  },
};

export const dynamic = "force-static";

export default async function HarnessPage() {
  const items = await getHarness();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(harnessListJsonLd(items)),
        }}
      />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <Reveal>
          <header className="mb-10">
            <p className="eyebrow mb-3">Harness</p>
            <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
              Agent harness 设计深度。
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
              Scaffolding / context window / tool use / eval loop 的工程实践文章，编辑部原创深度。
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
              <Link href="/feed/harness" className="pill-outline pill hover:text-[var(--c2m-accent-deep)]">
                RSS · harness only
              </Link>
            </div>
          </header>
        </Reveal>

        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            首篇 harness 文章 W3 上线 — 主题方向：prompt scaffolding 与 context budget 取舍。
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((h) => (
              <li key={h.slug}>
                <Link href={`/harness/${h.slug}`} className="card group flex flex-col gap-3">
                  <h3 className="text-xl font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                    {h.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {h.desc}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={12} />
                      {h.publishedAt}
                    </span>
                    {h.read && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} />
                        {h.read}
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
