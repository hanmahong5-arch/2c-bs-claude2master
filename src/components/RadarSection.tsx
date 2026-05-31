import Link from "next/link";
import { Calendar, ArrowRight, Radar } from "lucide-react";
import { getChangelog, getDigest } from "@/lib/content";
import {
  type ChangelogItem,
  type ChangelogKind,
} from "@/lib/content-types";
import { TOOLS, toolForSource, versionFromSourceUrl } from "@/lib/tools";

function resolveKind(c: ChangelogItem): ChangelogKind {
  return c.kind === "practice" ? "practice" : "changelog";
}

export default async function RadarSection() {
  const [changelog, digest] = await Promise.all([getChangelog(), getDigest()]);
  // 工程博客 (kind=practice) 与自营 harness 长文分流到 HarnessDeepDive。
  // changelog 已按 publishedAt 倒序; 每个工具取其最新 1 条 release, 按 TOOLS 顺序展示。
  // 这样高频发版的 claude-code 不会把其他工具刷出去, 卡片数 = 有版本的工具数 (≤8)。
  const releases = changelog.filter((c) => resolveKind(c) !== "practice");
  const latestByKey = new Map<string, ChangelogItem>();
  for (const c of releases) {
    const tool = toolForSource(c.source);
    if (tool && !latestByKey.has(tool.key)) {
      latestByKey.set(tool.key, c);
    }
  }
  const latestRadar = TOOLS.map((t) => ({ tool: t, item: latestByKey.get(t.key) }))
    .filter((x): x is { tool: (typeof TOOLS)[number]; item: ChangelogItem } =>
      Boolean(x.item),
    );
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
          主流 AI 编码工具在做什么。
        </h2>
        <p className="text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          每个工具取最新一版 release，每天 09:30 自动抓取 + 中文摘要 + 编辑视角。
        </p>
      </div>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {latestRadar.map(({ tool, item: c }) => {
          const version = versionFromSourceUrl(c.sourceUrl);
          return (
            <Link
              key={tool.key}
              href={`/changelog?tool=${tool.key}`}
              className="card group flex flex-col gap-3"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="pill text-[10px]" title={c.source}>
                  {tool.name}
                </span>
                {version && (
                  <span className="pill text-[10px] bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)]">
                    最新 {version}
                  </span>
                )}
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
