import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import TokenCounter from "@/components/TokenCounter";

const DESC =
  "在线 Token 计算器(中文友好): 粘贴文本立刻看 token 数、字符数与 token/字符比,纯浏览器本地计算不上传内容,附中英文 token 消耗对比。";

export const metadata: Metadata = {
  title: "Token 计算器",
  description: DESC,
  alternates: { canonical: "https://claude2master.com/tools/tokens" },
  openGraph: { type: "website", title: "Token 计算器", description: DESC },
  twitter: { card: "summary_large_image", title: "Token 计算器", description: DESC },
};

export default function TokensPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <Reveal>
        <header className="mb-10">
          <p className="eyebrow mb-3">工具 · Token 计算器</p>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold mb-4 headline-tight">
            你的 prompt 值多少钱,先数 token。
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            粘贴即算,纯本地不上传。中文比英文更费 token —— 算清楚再选模型。
          </p>
        </header>
      </Reveal>

      <TokenCounter />
    </div>
  );
}
