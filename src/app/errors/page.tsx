import type { Metadata } from "next";
import Link from "next/link";
import { ERROR_KB } from "@/lib/error-kb";
import { Reveal } from "@/components/Reveal";

const DESC =
  "AI 编码工具报错中文速查: Claude Code 403/429/529、fetch failed、OAuth 登录失败、npm 超时等高频报错的原因与修复步骤,面向中国大陆网络环境。";

export const metadata: Metadata = {
  title: "报错速查库",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/errors" },
  openGraph: { type: "website", title: "报错速查库", description: DESC },
  twitter: { card: "summary_large_image", title: "报错速查库", description: DESC },
};

export default function ErrorsPage() {
  // 按工具分组展示, 组内保持数据序(高频在前)
  const tools = [...new Set(ERROR_KB.map((e) => e.tool))];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">报错速查库</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            报错贴过来,三分钟自救。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            {ERROR_KB.length} 条高频报错的中文排查手册 — 每条都给真实报错原文、
            按概率排序的原因和可直接执行的修复命令,大陆网络环境特调。
          </p>
        </header>
      </Reveal>

      {tools.map((tool) => {
        const entries = ERROR_KB.filter((e) => e.tool === tool);
        return (
          <section key={tool} className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              {tool}
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {entries.map((e) => (
                <Link
                  key={e.slug}
                  href={`/errors/${e.slug}`}
                  className="card group flex flex-col gap-2"
                >
                  <h3 className="text-base font-semibold text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                    {e.title}
                  </h3>
                  <code className="text-xs text-[var(--color-text-muted)] break-all line-clamp-2">
                    {e.errorText}
                  </code>
                  <div className="flex gap-1.5 flex-wrap mt-auto pt-2">
                    {e.tags.slice(0, 3).map((t) => (
                      <span key={t} className="pill-outline pill text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-6 text-sm text-[var(--color-text-muted)] text-center">
        没找到你的报错?发我们{" "}
        <a
          href="mailto:hello@lurus.cn"
          className="text-[var(--c2m-accent-deep)] hover:underline"
        >
          hello@lurus.cn
        </a>
        ,核实后收录。
      </p>
    </div>
  );
}
