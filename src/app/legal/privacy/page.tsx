import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "claude2master.com 隐私政策（PIPL 适配）。",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 prose prose-neutral">
      <p className="eyebrow mb-3">法律</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-6 headline-tight">
        隐私政策
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-10">
        最近更新：2026-05-25 · 草案，正式版待法务过会
      </p>

      <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            我们收集什么
          </h2>
          <p>
            最小化原则。仅在你主动注册 / 使用 Chat / 申请 API key 时收集必要数据：
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>账号信息：手机号或邮箱（验证身份用）</li>
            <li>使用数据：Chat 输入输出（用于结算、不用于训练）</li>
            <li>设备信息：浏览器型号 / IP（用于反滥用）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            数据存储与跨境
          </h2>
          <p>
            网站托管在境外（Vercel 全球边缘节点）；账号 / 钱包 / 订单数据存储在 Lurus 自有基础设施（境内）；
            Chat 请求实时转发到上游模型供应商（包括 Anthropic 等海外服务），构成跨境传输。
            注册即视为你同意此跨境传输。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            你的权利
          </h2>
          <p>
            随时联系{" "}
            <a
              href="mailto:hi@lurus.cn"
              className="text-[var(--c2m-accent-deep)] hover:underline"
            >
              hi@lurus.cn
            </a>{" "}
            行使访问 / 复制 / 删除 / 注销账户的权利。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            Cookie
          </h2>
          <p>
            必要 Cookie：登录态、Chat trial 计数。无第三方追踪 Cookie。
            分析使用 Vercel Analytics（不个体识别）。
          </p>
        </section>
      </div>
    </article>
  );
}
