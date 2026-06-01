import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { getDigest } from "@/lib/content";
import { AUTHORED_LABEL } from "@/lib/content-types";
import { toolListCopy } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Weekly · Agent tooling 周报",
  description: `每周一回顾 ${toolListCopy("count")}与行业动态，由编辑部与 LLM 协同撰写。`,
};

export const dynamic = "force-static";

export default async function WeeklyPage() {
  const items = await getDigest();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-10">
        <p className="eyebrow mb-3">Weekly Digest</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
          一周 agent tooling 重点。
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          每周一 08:00 由 LLM 起草，编辑部 review 后合并。覆盖 {toolListCopy("full")} 等 agentic 行业动态。
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
                  <span className="pill-outline pill text-[10px]">
                    {AUTHORED_LABEL[d.authored]}
                  </span>
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
  );
}
