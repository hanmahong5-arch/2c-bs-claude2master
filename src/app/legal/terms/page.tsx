import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "服务条款",
  description: "claude2master.com 服务条款。",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 prose prose-neutral">
      <p className="eyebrow mb-3">法律</p>
      <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-6 headline-tight">
        服务条款
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-10">
        最近更新：2026-05-25 · 草案，正式版待法务过会
      </p>

      <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            服务说明
          </h2>
          <p>
            claude2master.com（下称「本站」）是 Lurus 出品的 Claude 中文工具入口，提供
            Prompt 库、在线 Chat、教程、Skills 索引、API key 申请等内容。
            本站与 Anthropic PBC 无任何隶属、合作或代理关系。Claude 为 Anthropic 商标。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            用户行为
          </h2>
          <p>使用本站即同意：</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>不上传 / 生成违反中国法律法规的内容（涉政、涉黄、侵权等）</li>
            <li>不滥用 Chat 试用额度（脚本批量请求、规避限流）</li>
            <li>不将 API key 转售给第三方</li>
            <li>不利用本站从事任何商业欺诈</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            内容版权
          </h2>
          <p>
            本站 Prompt 库 / 教程 / Skills 索引内容（除明确标注的第三方资料）的版权归 Lurus 所有，
            遵循{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--c2m-accent-deep)] hover:underline"
            >
              CC BY 4.0
            </a>{" "}
            协议（署名转载即可）。第三方贡献内容按其原协议。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            责任限制
          </h2>
          <p>
            本站为信息与工具平台，不对 AI 生成内容的准确性 / 适用性 / 合法性作担保。
            使用 Chat / API 生成的内容需用户自行核实，不得用于医疗诊断、法律咨询、金融决策等关键场景。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--lt-ink)] mb-2">
            条款变更
          </h2>
          <p>
            本条款可随时更新，重大变更会在本页显著位置公示 30 天。
          </p>
        </section>
      </div>
    </article>
  );
}
