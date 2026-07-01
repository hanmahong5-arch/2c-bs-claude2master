import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MODEL_PRICES, PRICES_AS_OF } from "@/lib/llm-prices";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";
import TrackedLink from "@/components/TrackedLink";
import { Reveal } from "@/components/Reveal";
import PriceTable from "./PriceTable";

const DESC =
  "主流 LLM API 价格对照表(中文): Claude / GPT / Gemini / DeepSeek / Kimi 每百万 token 输入输出单价、上下文窗口、大陆直连情况,附成本速算器。";

export const metadata: Metadata = {
  title: "LLM API 价格对比",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/tools/price" },
  openGraph: { type: "website", title: "LLM API 价格对比", description: DESC },
  twitter: { card: "summary_large_image", title: "LLM API 价格对比", description: DESC },
};

export default function PricePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">工具 · 价格对比</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            哪个模型更划算,一张表看完。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            {MODEL_PRICES.length} 个主流模型的官方 API 定价,全部人工核对官方定价页。
            数据核实于 {PRICES_AS_OF},价格随时会变,下单前以官方页面为准。
          </p>
        </header>
      </Reveal>

      <PriceTable models={MODEL_PRICES} />

      <div className="mt-12 card">
        <h2 className="text-lg font-semibold text-[var(--lt-ink)] mb-2">
          不想管汇率、代理和一堆 key?
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          用国内可直连的 API 网关,一个 key 调多家模型,支付宝/微信结算,免境外信用卡。
        </p>
        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={buildOutbound("newapi", OUTBOUND_CAMPAIGN.toolsPrice)}
            event="outbound_newapi"
            data={{ campaign: OUTBOUND_CAMPAIGN.toolsPrice }}
            external
            className="btn btn-secondary"
          >
            去 newapi 网关
            <ArrowRight size={14} />
          </TrackedLink>
          <Link href="/tools/tokens" className="btn btn-ghost">
            先算算我的文本要多少 token
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
