import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "关于",
  description:
    "claude2master.com 由 Lurus 出品。我们做面向中文开发者的 AI 原生基础设施与工具。",
};

const MATRIX = [
  {
    name: "lurus.cn",
    href: "https://www.lurus.cn",
    desc: "公司官网，产品矩阵全景。",
  },
  {
    name: "newapi.lurus.cn",
    href: "https://newapi.lurus.cn",
    desc: "Lurus 自营 LLM 网关，30+ 模型、双协议兼容、人民币计费。",
  },
  {
    name: "hub.lurus.cn",
    href: "https://hub.lurus.cn",
    desc: "newapi 之上的多租户 Hub 层，企业团队首选。",
  },
  {
    name: "forge.lurus.cn",
    href: "https://forge.lurus.cn",
    desc: "Agent workbench — 可视化拖拉 prompt 流。",
  },
  {
    name: "dsnb.help",
    href: "https://dsnb.help",
    desc: "DeepSeek 的故事 — 一键接入 DeepSeek 的桌面工具营销站。",
  },
  {
    name: "lutu (APP)",
    href: "https://www.lurus.cn",
    desc: "Lutu — 移动端 AI 助手（APK 发布中）。",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-12">
        <p className="eyebrow mb-3">关于</p>
        <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-6 headline-tight">
          站在合规与可用之间。
        </h1>
        <div className="space-y-4 text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
          <p>
            <strong className="text-[var(--lt-ink)]">claude2master.com</strong>{" "}
            是 Lurus 出品的 Claude 中文工具入口 — 让中国大陆用户不翻墙、不办美卡，也能用好 Claude。
          </p>
          <p>
            我们不做模型自研，也不做 Claude wrapper 套壳。我们做的是把 Lurus 自营的 LLM 网关
            <code className="font-mono text-base">newapi.lurus.cn</code>、Agent 工作台
            <code className="font-mono text-base">forge.lurus.cn</code>{" "}
            等基础设施，打包成最薄的 C 端入口，让你 3 分钟上手、3 个月精通。
          </p>
        </div>
      </header>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--lt-ink)]">
          Lurus 产品矩阵
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          claude2master 是我们 Web 产品组的第三个独立品牌站。
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MATRIX.map((m) => (
            <Link
              key={m.name}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <code className="font-mono text-sm text-[var(--lt-ink)] group-hover:text-[var(--c2m-accent-deep)] transition-colors">
                  {m.name}
                </code>
                <ArrowUpRight
                  size={16}
                  className="text-[var(--color-text-muted)] group-hover:text-[var(--c2m-accent-deep)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {m.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3 text-[var(--lt-ink)]">联系</h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-2">
          内容合作、商务洽谈、bug 报告：
          <Link
            href="mailto:hi@lurus.cn"
            className="text-[var(--c2m-accent-deep)] hover:underline ml-1"
          >
            hi@lurus.cn
          </Link>
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-6">
          claude2master 与 Anthropic 无任何隶属、合作或代理关系。Claude
          为 Anthropic PBC 的商标。
        </p>
      </section>
    </div>
  );
}
