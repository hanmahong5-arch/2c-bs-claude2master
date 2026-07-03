import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { MCP_SERVERS, getMcpServer } from "@/lib/mcp-directory";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";
import TrackedLink from "@/components/TrackedLink";

export function generateStaticParams() {
  return MCP_SERVERS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getMcpServer(slug);
  if (!s) return { title: "MCP Server 未收录" };
  const desc = `${s.name} MCP Server: ${s.descZh} 安装、配置、大陆是否直连一览。`.slice(0, 150);
  return {
    title: `${s.name} MCP Server 怎么装 · ${s.vendor}`,
    description: desc,
    alternates: { canonical: `https://claude2master.com/mcp/${slug}` },
    openGraph: { type: "article", title: `${s.name} MCP Server`, description: desc },
    twitter: { card: "summary_large_image", title: `${s.name} MCP Server`, description: desc },
  };
}

const RUNTIME_LABEL: Record<string, string> = {
  npx: "npx(Node)",
  uvx: "uvx(Python)",
  docker: "Docker 镜像",
  hosted: "官方托管",
};

export default async function McpDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getMcpServer(slug);
  if (!s) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <Link
        href="/mcp"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] mb-8"
      >
        <ArrowLeft size={14} />
        MCP Server 目录
      </Link>

      <p className="eyebrow mb-3">{s.category}</p>
      <h1 className="font-display italic text-3xl md:text-4xl font-semibold mb-3 headline-tight text-[var(--lt-ink)]">
        {s.name}
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-6">
        {s.descZh}
      </p>

      <div className="flex gap-1.5 flex-wrap mb-8">
        <span className="pill-outline pill text-[10px]">{RUNTIME_LABEL[s.runtime]}</span>
        <span className={s.cnDirect ? "pill text-[10px]" : "pill-outline pill text-[10px]"}>
          {s.cnDirect ? "大陆直连" : "需代理"}
        </span>
        {s.needsKey && <span className="pill-outline pill text-[10px]">需 API key</span>}
        <span className="pill-outline pill text-[10px]">{s.vendor}</span>
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        它能做什么
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        {s.detail}
      </p>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        安装 / 接入
      </h2>
      <pre className="code-block whitespace-pre-wrap text-[13px] mb-4">{s.install}</pre>

      {s.remote && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            官方托管端点
          </h2>
          <pre className="code-block whitespace-pre-wrap text-[13px] mb-6">{s.remote}</pre>
        </>
      )}

      {s.note && (
        <div className="rounded-lg border border-[var(--c2m-accent)] bg-[var(--c2m-accent-soft)]/40 px-4 py-3 mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--c2m-accent-deep)] mb-1.5">
            注意事项
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {s.note}
          </p>
        </div>
      )}

      <a
        href={s.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--c2m-accent-deep)] hover:underline mb-10"
      >
        官方仓库 / 文档
        <ExternalLink size={13} />
      </a>

      <div className="card">
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          MCP 装好了,模型接口还没着落?国内直连的 API 网关一个 key 通多家模型,
          支付宝/微信结算,免境外信用卡,给你的 agent 配好底座。
        </p>
        <TrackedLink
          href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.mcpDirectory)}
          event="outbound_newapi"
          data={{ campaign: OUTBOUND_CAMPAIGN.mcpDirectory, slug: s.slug }}
          external
          className="btn btn-secondary"
        >
          了解 newapi 网关
          <ArrowRight size={14} />
        </TrackedLink>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex gap-1.5 flex-wrap">
        {s.tags.map((t) => (
          <span key={t} className="pill-outline pill text-[10px]">
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}
