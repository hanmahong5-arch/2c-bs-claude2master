import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package, Copy } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Skill · ${slug}`,
    description: "Claude Code skill 详情与安装命令",
  };
}

export default async function SkillDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const installCmd = `# 把 skill 放到 ~/.claude/skills/${slug}/\nclaude skill install ${slug}`;

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
        <span className="pill-outline pill text-xs">来源：待标注</span>
      </div>

      <p className="eyebrow mb-3">Skill</p>
      <h1 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-[var(--lt-ink)]">
        {slug}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
        Skill 详情正在补充。Skills registry 由 Phase 3 完成。
      </p>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
        安装命令
      </h2>
      <pre className="code-block mb-4 whitespace-pre-wrap">{installCmd}</pre>
      <button className="btn btn-secondary text-sm">
        <Copy size={14} />
        复制命令
      </button>
    </article>
  );
}
