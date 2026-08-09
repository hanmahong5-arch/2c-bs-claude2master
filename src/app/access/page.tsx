import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  SERVICES,
  ACCESS_CATEGORIES,
  ACCESS_AS_OF,
  type Reach,
} from "@/lib/service-access";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";
import TrackedLink from "@/components/TrackedLink";
import { Reveal } from "@/components/Reveal";

const DESC =
  "Claude / ChatGPT / Gemini 大陆能用吗?主流 AI 服务大陆访问性对照表: 官网与官方 API 是否需代理、是否支持大陆账号,附国产直连替代与网关中转方案。";

export const metadata: Metadata = {
  title: "AI 服务大陆访问性对照表",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/access" },
  openGraph: { type: "website", title: "AI 服务大陆访问性对照表", description: DESC },
  twitter: { card: "summary_large_image", title: "AI 服务大陆访问性对照表", description: DESC },
};

function ReachCell({ reach }: { reach: Reach }) {
  return reach === "direct" ? (
    <span className="pill text-[10px]">直连</span>
  ) : (
    <span className="pill-outline pill text-[10px]">需代理</span>
  );
}

// FAQPage 结构化数据: 覆盖高频问句, 利被搜索/AI 引擎引用
function faqJsonLd() {
  const overseas = SERVICES.filter((s) => s.category === "海外主力").map((s) => s.name);
  const cn = SERVICES.filter((s) => s.category === "国产直连").map((s) => s.name);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Claude、ChatGPT、Gemini 在中国大陆能直接用吗?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${overseas.join("、")} 等海外 AI 服务的官网与官方 API 在大陆通常需要代理才能稳定访问, 且多数未对大陆开放官方账号与结算。数据整理于 ${ACCESS_AS_OF}, 以实际为准。`,
        },
      },
      {
        "@type": "Question",
        name: "有哪些 AI 大模型在大陆可以直连使用?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${cn.join("、")} 等国产大模型的网页与官方 API 在大陆可直连, 并支持人民币结算。`,
        },
      },
    ],
  };
}

export default function AccessPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <Reveal>
        <header className="mb-8">
          <p className="eyebrow mb-3">大陆访问性</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            这个 AI,大陆到底能不能用?
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            主流 AI 服务的官网与官方 API 大陆访问性对照 —— 要不要代理、支不支持大陆账号,
            一张表看清。整理于 {ACCESS_AS_OF},网络策略常变,以实际为准。
          </p>
        </header>
      </Reveal>

      <div className="mb-6 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="pill text-[10px]">直连</span>
          大陆网络通常可直接访问
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="pill-outline pill text-[10px]">需代理</span>
          大陆网络下通常需借助代理
        </span>
      </div>

      {ACCESS_CATEGORIES.map((cat) => {
        const rows = SERVICES.filter((s) => s.category === cat);
        if (rows.length === 0) return null;
        return (
          <section key={cat} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              {cat}
            </h2>
            {/* sm 以上表格,sm 以下每行一张卡片(标签:值垂直堆叠),避免小屏只能横向滚动 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="py-2 pr-3 font-medium">服务</th>
                    <th className="py-2 pr-3 font-medium">提供方</th>
                    <th className="py-2 pr-3 font-medium">官网 / App</th>
                    <th className="py-2 pr-3 font-medium">官方 API</th>
                    <th className="py-2 pr-3 font-medium">大陆账号</th>
                    <th className="py-2 pr-3 font-medium">网关中转</th>
                    <th className="py-2 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[var(--color-border)] align-top hover:bg-[var(--c2m-accent-soft)]/30 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--lt-ink)] hover:text-[var(--c2m-accent-deep)]"
                        >
                          {s.name}
                        </a>
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                        {s.vendor}
                      </td>
                      <td className="py-2.5 pr-3">
                        <ReachCell reach={s.webAccess} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <ReachCell reach={s.apiAccess} />
                      </td>
                      <td className="py-2.5 pr-3">{s.officialCn ? "✅" : "—"}</td>
                      <td className="py-2.5 pr-3">{s.viaGateway ? "✅" : "—"}</td>
                      <td className="py-2.5 text-[var(--color-text-secondary)] leading-relaxed min-w-[16rem]">
                        {s.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-3">
              {rows.map((s) => (
                <div key={s.id} className="card card-compact">
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--lt-ink)] hover:text-[var(--c2m-accent-deep)]"
                  >
                    {s.name}
                  </a>
                  <dl className="mt-2 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-text-muted)]">提供方</dt>
                      <dd className="text-[var(--color-text-secondary)]">{s.vendor}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-[var(--color-text-muted)]">官网 / App</dt>
                      <dd>
                        <ReachCell reach={s.webAccess} />
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-[var(--color-text-muted)]">官方 API</dt>
                      <dd>
                        <ReachCell reach={s.apiAccess} />
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-text-muted)]">大陆账号</dt>
                      <dd>{s.officialCn ? "✅" : "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-text-muted)]">网关中转</dt>
                      <dd>{s.viaGateway ? "✅" : "—"}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed pt-1.5 border-t border-[var(--color-border)]">
                    {s.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-10 card">
        <h2 className="text-lg font-semibold text-[var(--lt-ink)] mb-2">
          想用海外模型,又不想天天折腾代理?
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          「网关中转」这一列打 ✅ 的海外模型,都可经国内可直连的 API 网关调用 ——
          一个 key 通多家模型,支付宝/微信结算,免境外信用卡,也免代理。
        </p>
        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.accessTable)}
            event="outbound_newapi"
            data={{ campaign: OUTBOUND_CAMPAIGN.accessTable }}
            external
            className="btn btn-secondary"
          >
            了解 newapi 网关
            <ArrowRight size={14} />
          </TrackedLink>
          <Link href="/tools/price" className="btn btn-ghost">
            顺便比比各模型价格
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
