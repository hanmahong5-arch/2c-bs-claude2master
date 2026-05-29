import Link from "next/link";
import { Calendar, ArrowRight, Radar } from "lucide-react";
import { getChangelog, getDigest } from "@/lib/content";
import {
  KIND_LABEL,
  type ChangelogItem,
  type ChangelogKind,
} from "@/lib/content-types";

function resolveKind(c: ChangelogItem): ChangelogKind {
  return c.kind === "practice" ? "practice" : "changelog";
}

export default async function RadarSection() {
  const [changelog, digest] = await Promise.all([getChangelog(), getDigest()]);
  // 只取版本 release; 工程博客 (kind=practice) 与自营 harness 长文分流到 HarnessDeepDive,
  // 避免高频发版把深度长文挤出前 4 条。
  const latestRadar = changelog
    .filter((c) => resolveKind(c) !== "practice")
    .slice(0, 4);
  const latestDigest = digest[0];

  if (latestRadar.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="eyebrow mb-3 inline-flex items-center gap-1.5 justify-center">
          <Radar size={12} strokeWidth={2} />
          雷达 · 每日自动追踪
        </p>
        <h2 className="font-display italic text-3xl md:text-4xl font-semibold text-[var(--lt-ink)] mb-3 headline-tight">
          Claude Code / Codex 在做什么。
        </h2>
        <p className="text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          GitHub Actions 每天 09:30 抓 release + Anthropic 工程博客，自动产出中文摘要 + 编辑视角。
        </p>
      </div>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {latestRadar.map((c) => {
          const k = resolveKind(c);
          const kindMeta = KIND_LABEL[k];
          return (
            <Link
              key={c.slug}
              href={`/changelog/${c.slug}`}
              className="card group flex flex-col gap-3"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="pill text-[10px]"
                  title={c.source}
                >
                  {c.source}
                </span>
                <span
                  className={`pill text-[10px] ${kindMeta.className}`}
                >
                  {kindMeta.label}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors text-clamp-1">
                {c.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed text-clamp-2 flex-1">
                {c.hook}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  {c.publishedAt}
                </span>
                {c.verified !== "tested" && (
                  <span className="text-[var(--color-text-muted)]">
                    auto · 待验证
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {latestDigest && (
          <Link
            href={`/weekly/${latestDigest.slug}`}
            className="btn btn-secondary"
          >
            看本周周报
            <ArrowRight size={14} />
          </Link>
        )}
        <Link href="/changelog" className="btn btn-ghost">
          全部 changelog
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
