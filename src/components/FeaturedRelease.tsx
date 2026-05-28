import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { getChangelogBySlug } from "@/lib/content";

// 主页 featured 横幅锁定这条 changelog —— 文案/标题/钩子全部读 MDX, 不在组件里硬编码事实 (SSOT)。
// 换主推条目只改这个 slug。条目不存在则不渲染 (优雅降级)。
const FEATURED_SLUG = "2026-05-28-claude-opus-4-8";

export default async function FeaturedRelease() {
  const item = await getChangelogBySlug(FEATURED_SLUG);
  if (!item) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 pt-4 pb-16">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center rounded-2xl border border-[var(--color-border)] bg-[var(--c2m-accent-soft)] p-6 md:p-10">
        <div className="flex flex-col">
          <p className="eyebrow mb-3 inline-flex items-center gap-1.5">
            <Sparkles size={12} strokeWidth={2} />
            新模型 · {item.publishedAt} 上线
          </p>
          <h2 className="font-display italic text-3xl md:text-4xl font-semibold text-[var(--lt-ink)] mb-4 headline-tight">
            {item.title}
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-5">
            {item.hook}
          </p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {item.tags.map((t) => (
                <span key={t} className="pill pill-outline text-[11px]">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/changelog/${item.slug}`} className="btn btn-cta-glow">
              读懂 Opus 4.8
              <ArrowRight size={16} />
            </Link>
            <Link href="/chat" className="btn btn-secondary">
              直接拿它跑一条
            </Link>
          </div>
        </div>

        <Link
          href={`/changelog/${item.slug}`}
          className="block group"
          aria-label={item.title}
        >
          <Image
            src="/radar/opus-4-8-benchmarks.png"
            alt="Claude Opus 4.8 与 Opus 4.7 / GPT-5.5 / Gemini 3.1 Pro 的基准对比"
            width={2600}
            height={1392}
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="w-full h-auto rounded-xl border border-[var(--color-border)] bg-white shadow-sm transition-transform group-hover:-translate-y-0.5"
          />
          <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
            数据来源:Anthropic 官方 · 基准为官方口径,未本地复现
          </p>
        </Link>
      </div>
    </section>
  );
}
