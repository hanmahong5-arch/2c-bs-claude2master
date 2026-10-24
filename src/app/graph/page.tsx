import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getChangelog, getConceptGraph } from "@/lib/content";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";
import { Reveal } from "@/components/Reveal";
import TrackedLink from "@/components/TrackedLink";
import ConceptGraphView, { type ArticleMeta } from "@/components/graph/ConceptGraphView";

const DESC =
  "AI 行业知识图谱:从 Anthropic、OpenAI、LangChain 等 50+ 官方博客与一线从业者文章中自动提炼概念与关系 —— 看清 Claude Code、MCP、Agent、RAG 等热点之间怎么连起来,点任一概念直达相关中文解读。";

export const metadata: Metadata = {
  title: "AI 知识图谱",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/graph" },
  openGraph: { type: "website", title: "AI 知识图谱 · Claude2Master", description: DESC },
  twitter: { card: "summary_large_image", title: "AI 知识图谱 · Claude2Master", description: DESC },
};

export default async function GraphPage() {
  const [graph, items] = await Promise.all([getConceptGraph(), getChangelog()]);

  // 只下发图里概念引用到的文章元数据 (每概念前 8 篇), 控制客户端 payload
  const needed = new Set(graph.nodes.flatMap((n) => n.slugs.slice(0, 8)));
  const articles: Record<string, ArticleMeta> = {};
  for (const c of items) {
    if (needed.has(c.slug)) {
      articles[c.slug] = { title: c.title, publishedAt: c.publishedAt, hook: c.hook };
    }
  }
  const docCount = new Set(graph.nodes.flatMap((n) => n.slugs)).size;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <Reveal>
        <header className="mb-8">
          <p className="eyebrow mb-3">AI 知识图谱</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            一张图，看清 AI 圈在聊什么。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl">
            从 {docCount} 篇官方博客、发版说明与一线从业者文章里自动提炼出 {graph.nodes.length} 个核心概念、
            {graph.edges.length} 条关联。每天随雷达自动更新，点任意概念直达中文解读。
          </p>
        </header>
      </Reveal>

      {graph.nodes.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">图谱数据生成中，明天再来看看。</p>
      ) : (
        <ConceptGraphView graph={graph} articles={articles} />
      )}

      <Reveal>
        <section className="mt-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-1">看懂了，想亲手试试？</h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-xl">
              图里这些模型与 Agent 工具，国内一个 key 直连调用 —— 不用翻墙、按量计费、OpenAI 兼容接口。
            </p>
          </div>
          <TrackedLink
            href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.knowledgeGraph)}
            event="outbound_newapi"
            data={{ campaign: OUTBOUND_CAMPAIGN.knowledgeGraph }}
            external
            className="btn btn-primary shrink-0"
          >
            领取 API key
            <ArrowRight size={14} />
          </TrackedLink>
        </section>
      </Reveal>
    </div>
  );
}
