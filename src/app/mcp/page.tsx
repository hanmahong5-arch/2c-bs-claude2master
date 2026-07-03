import type { Metadata } from "next";
import Link from "next/link";
import { MCP_SERVERS, MCP_CATEGORIES } from "@/lib/mcp-directory";
import { Reveal } from "@/components/Reveal";

const DESC =
  "MCP Server 中文目录: filesystem/github/context7/playwright 等主流 Model Context Protocol 服务器的功能、安装命令、是否需要 key、大陆能否直连,一页选型接入。";

export const metadata: Metadata = {
  title: "MCP Server 中文目录",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/mcp" },
  openGraph: { type: "website", title: "MCP Server 中文目录", description: DESC },
  twitter: { card: "summary_large_image", title: "MCP Server 中文目录", description: DESC },
};

const RUNTIME_LABEL: Record<string, string> = {
  npx: "npx",
  uvx: "uvx",
  docker: "docker",
  hosted: "托管",
};

export default function McpPage() {
  const cnCount = MCP_SERVERS.filter((s) => s.cnDirect).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">MCP 目录</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            装哪个 MCP,一页问清楚。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            {MCP_SERVERS.length} 个主流 MCP Server 的中文速查 — 功能、安装命令、
            要不要 key、大陆能不能直连都标好了,其中 {cnCount} 个运行端点可大陆直连。
          </p>
        </header>
      </Reveal>

      {MCP_CATEGORIES.map((cat) => {
        const entries = MCP_SERVERS.filter((s) => s.category === cat);
        if (entries.length === 0) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              {cat}
              <span className="ml-2 font-normal normal-case tracking-normal">
                {entries.length}
              </span>
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {entries.map((s) => (
                <Link
                  key={s.slug}
                  href={`/mcp/${s.slug}`}
                  className="card group flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                      {s.name}
                    </h3>
                    <span className="pill-outline pill text-[10px] ml-auto">
                      {RUNTIME_LABEL[s.runtime]}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {s.descZh}
                  </p>
                  <div className="flex gap-1.5 flex-wrap mt-auto pt-2 text-[10px]">
                    <span
                      className={
                        s.cnDirect
                          ? "pill text-[10px]"
                          : "pill-outline pill text-[10px]"
                      }
                    >
                      {s.cnDirect ? "大陆直连" : "需代理"}
                    </span>
                    {s.needsKey && (
                      <span className="pill-outline pill text-[10px]">需 key</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-6 text-sm text-[var(--color-text-muted)] text-center">
        MCP 生态更新很快,安装命令与端点以各自官方仓库为准;发现失效或想补充{" "}
        <a
          href="mailto:hello@lurus.cn"
          className="text-[var(--c2m-accent-deep)] hover:underline"
        >
          hello@lurus.cn
        </a>
        。
      </p>
    </div>
  );
}
