import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "备案信息",
  description: "claude2master.com 域名与备案信息说明。",
};

export default function BeianPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="eyebrow mb-3">法律</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-6 headline-tight">
        备案信息
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-10">
        最近更新：2026-05-25
      </p>

      <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
        <section className="card">
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-3">
            域名与主机
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 text-[var(--color-text-muted)] flex-shrink-0">
                域名
              </dt>
              <dd className="font-mono">claude2master.com</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 text-[var(--color-text-muted)] flex-shrink-0">
                顶级域
              </dt>
              <dd>.com（不参与中国大陆 ICP 备案体系）</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 text-[var(--color-text-muted)] flex-shrink-0">
                托管
              </dt>
              <dd>Vercel Inc.（全球边缘网络）</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 text-[var(--color-text-muted)] flex-shrink-0">
                运营主体
              </dt>
              <dd>Lurus（详见{" "}
                <a
                  href="https://www.lurus.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--c2m-accent-deep)] hover:underline"
                >
                  www.lurus.cn
                </a>
                ）</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-3">
            ICP 备案说明
          </h2>
          <p className="mb-3">
            本站使用 <code className="font-mono">.com</code> 国际顶级域，托管于境外节点（Vercel），
            按当前中国大陆监管框架不强制要求 ICP 备案。
          </p>
          <p>
            如未来运营主体或托管位置发生变更触发备案要求，会在此页第一时间公示备案号。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-3">
            生成式 AI 服务合规
          </h2>
          <p>
            本站 Chat 功能后端使用 Lurus 自营 LLM 网关{" "}
            <code className="font-mono">newapi.lurus.cn</code>，
            遵循《生成式人工智能服务管理暂行办法》相关规定开展内容审查与速率限制。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-3">
            投诉与举报
          </h2>
          <p>
            违法违规内容举报、版权投诉、用户申诉：
            <a
              href="mailto:hi@lurus.cn"
              className="text-[var(--c2m-accent-deep)] hover:underline ml-1"
            >
              hi@lurus.cn
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
