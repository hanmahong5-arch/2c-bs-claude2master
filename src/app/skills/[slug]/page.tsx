import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SKILLS, getSkill } from "@/lib/skills";
import CopyPromptButton from "@/components/CopyPromptButton";

export function generateStaticParams() {
  return SKILLS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getSkill(slug);
  if (!s) return { title: "Skill 未找到" };
  return {
    title: `${s.title} · Skill`,
    description: s.desc,
  };
}

export default async function SkillDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getSkill(slug);
  if (!s) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有 Skills
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <Package
          size={32}
          className="text-[var(--c2m-accent)]"
          strokeWidth={1.5}
          style={{
            filter: "drop-shadow(0 0 12px rgba(124, 92, 255, 0.4))",
          }}
        />
        <span className="pill-outline pill text-xs">{s.source}</span>
        <span className="pill text-xs">{s.category}</span>
      </div>

      <p className="eyebrow mb-3">Skill</p>
      <h1 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-[var(--lt-ink)]">
        {s.title}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {s.desc}
      </p>

      <div className="card mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          触发条件
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {s.triggerHint}
        </p>
      </div>

      {s.installCmd && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            安装命令
          </h2>
          <pre className="code-block mb-3 whitespace-pre-wrap text-[13px]">
            {s.installCmd}
          </pre>
          <div className="mb-10">
            <CopyPromptButton
              text={s.installCmd}
              label="复制命令"
              variant="secondary"
            />
          </div>
        </>
      )}

      {s.readme && (
        <div className="tutorial-md">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.readme}</ReactMarkdown>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span>来源：{s.source}</span>
          {s.sourceUrl && (
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--c2m-accent-deep)] hover:underline"
            >
              源仓库
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        {s.tags && s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map((t) => (
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
