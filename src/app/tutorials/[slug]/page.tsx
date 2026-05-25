import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `教程 · ${slug}`,
    description: "Claude Code 中文教程",
  };
}

export default async function TutorialDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <Link
        href="/tutorials"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        所有教程
      </Link>

      <p className="eyebrow mb-3">教程</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight text-[var(--lt-ink)]">
        {slug}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed">
        本教程正在编写中。MDX 内容流水线 Phase 3 接入。
      </p>

      <div className="card">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          想抢先看？目前推荐：
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="https://newapi.lurus.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--c2m-accent-deep)] hover:underline"
            >
              newapi.lurus.cn
            </Link>{" "}
            — 直接拿 Claude API key，5 分钟可用
          </li>
          <li>
            <Link
              href="/api-keys"
              className="text-[var(--c2m-accent-deep)] hover:underline"
            >
              /api-keys
            </Link>{" "}
            — 本站的 API key 申请指引
          </li>
        </ul>
      </div>
    </article>
  );
}
