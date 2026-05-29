import Link from "next/link";
import { Calendar, Clock, ArrowRight, BookText } from "lucide-react";
import { getHarness, getChangelog } from "@/lib/content";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

// 深度区数据 = 自营编辑长文 (channel:"harness", desc) ∪ 自动抓的工程博客 (kind:"practice", hook)。
// 与雷达分流: 雷达只放高频版本 release, 这里放需要慢读的 harness 工程内容, 取最新 2 条。
interface DeepItem {
  slug: string;
  title: string;
  publishedAt: string;
  href: string;
  blurb: string;
  badge: string;
  read?: string;
}

export default async function HarnessDeepDive() {
  const [harness, changelog] = await Promise.all([
    getHarness(),
    getChangelog(),
  ]);

  const harnessItems: DeepItem[] = harness.map((h) => ({
    slug: h.slug,
    title: h.title,
    publishedAt: h.publishedAt,
    href: `/harness/${h.slug}`,
    blurb: h.desc,
    badge: "编辑部",
    read: h.read,
  }));

  const practiceItems: DeepItem[] = changelog
    .filter((c) => c.kind === "practice")
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      publishedAt: c.publishedAt,
      href: `/changelog/${c.slug}`,
      blurb: c.hook,
      badge: c.source,
    }));

  const items = [...harnessItems, ...practiceItems]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, 2);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <Reveal className="text-center mb-12">
        <p className="eyebrow mb-3 inline-flex items-center gap-1.5 justify-center">
          <BookText size={12} strokeWidth={2} />
          深度 · Harness 工程
        </p>
        <h2 className="font-display italic text-3xl md:text-4xl font-semibold text-[var(--lt-ink)] mb-3 headline-tight">
          harness 怎么设计,才不崩。
        </h2>
        <p className="text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          编辑部长文 + 精选 Anthropic / Claude Code 工程博客 —— scaffolding、context window、tool use、eval loop 的慢读。
        </p>
      </Reveal>

      <Stagger className="grid sm:grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((d) => (
          <StaggerItem key={d.slug} className="h-full">
            <Link
              href={d.href}
              className="card group flex flex-col gap-3 h-full"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="pill text-[10px]" title={d.badge}>
                  {d.badge}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors text-clamp-2">
                {d.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed text-clamp-2 flex-1">
                {d.blurb}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  {d.publishedAt}
                </span>
                {d.read && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {d.read}
                  </span>
                )}
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-8 flex justify-center">
        <Link href="/harness" className="btn btn-ghost">
          全部深度文章
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
