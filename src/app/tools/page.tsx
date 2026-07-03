import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Hash, LifeBuoy, Plug, Trophy } from "lucide-react";
import { MODEL_PRICES, PRICES_AS_OF } from "@/lib/llm-prices";
import { ERROR_KB } from "@/lib/error-kb";
import { MCP_SERVERS } from "@/lib/mcp-directory";
import { Reveal } from "@/components/Reveal";

const DESC =
  "AI 开发者实用工具箱: LLM API 价格对比、Token 计算器、报错速查库、编程工具榜 — 查表即走,全部免费。";

export const metadata: Metadata = {
  title: "工具箱",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/tools" },
  openGraph: { type: "website", title: "工具箱", description: DESC },
  twitter: { card: "summary_large_image", title: "工具箱", description: DESC },
};

const TOOL_CARDS = [
  {
    href: "/tools/price",
    icon: Calculator,
    title: "LLM API 价格对比",
    desc: `${MODEL_PRICES.length} 个主流模型官方定价一张表,附成本速算器。核实于 ${PRICES_AS_OF}。`,
  },
  {
    href: "/tools/tokens",
    icon: Hash,
    title: "Token 计算器",
    desc: "粘贴即算 token 数,纯本地不上传;中英文消耗对比一目了然。",
  },
  {
    href: "/errors",
    icon: LifeBuoy,
    title: "报错速查库",
    desc: `${ERROR_KB.length} 条 AI 编码工具高频报错的中文自救指南,大陆网络环境特调。`,
  },
  {
    href: "/mcp",
    icon: Plug,
    title: "MCP Server 目录",
    desc: `${MCP_SERVERS.length} 个主流 MCP 服务器速查:功能、安装命令、是否需 key、大陆能否直连。`,
  },
  {
    href: "/rank",
    icon: Trophy,
    title: "AI 编程工具榜",
    desc: "主流编码工具横向参考榜:价格、大陆可达性、开源情况。",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">工具箱</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            查表即走,不用注册。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            为 AI 开发者准备的速查工具矩阵 — 算成本、数 token、修报错、选工具。
          </p>
        </header>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-5">
        {TOOL_CARDS.map((t) => (
          <Link key={t.href} href={t.href} className="card group flex gap-4">
            <t.icon
              size={22}
              className="shrink-0 mt-0.5 text-[var(--c2m-accent-deep)]"
            />
            <div>
              <h2 className="text-lg font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors mb-1">
                {t.title}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
