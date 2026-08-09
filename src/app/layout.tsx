import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BroadcastProvider } from "@/components/broadcast/BroadcastProvider";
import "./globals.css";

// 自托管字体 (next/font/local) — 中国大陆访问不到 fonts.googleapis.com,
// 改本地 woff2 后构建期内联、CDN 托管, CN 用户拿到真字体而非系统回落。
// 仅含 latin 子集 (这三族本就无 CJK 字形, 中文走 --font-sans 的 PingFang/雅黑 系统回落)。
const interTight = localFont({
  src: [
    { path: "../../public/fonts/inter-tight-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter-tight-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/inter-tight-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/inter-tight-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter-tight",
  display: "swap",
});
const fraunces = localFont({
  src: [
    { path: "../../public/fonts/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/fraunces-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/fraunces-latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});
const jetbrainsMono = localFont({
  src: [
    { path: "../../public/fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://claude2master.com"),
  title: {
    default: "claude2master · 中国大陆用 Claude，从入门到精通",
    template: "%s · claude2master",
  },
  description:
    "中国大陆 Claude 用户的中文工具站：Prompt 库、在线 Chat、Claude Code 教程、Skills 商店、API key 申请。不翻墙、3 分钟跑通。",
  keywords: [
    "Claude",
    "Claude 中文",
    "Claude API",
    "Claude Code",
    "Claude 教程",
    "AI Prompt",
    "Skills",
  ],
  openGraph: {
    title: "claude2master · 中国大陆用 Claude，从入门到精通",
    description:
      "Prompt 库 · 在线 Chat · Claude Code 教程 · Skills 商店 · API key 申请。",
    type: "website",
    locale: "zh_CN",
    siteName: "claude2master",
  },
  twitter: {
    card: "summary_large_image",
    title: "claude2master · 中国大陆用 Claude，从入门到精通",
    description:
      "Prompt 库 · 在线 Chat · Claude Code 教程 · Skills 商店 · API key 申请。",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: "claude2master · 全站" },
        { url: "/feed/changelog", title: "claude2master · Changelog" },
        { url: "/feed/digest", title: "claude2master · Weekly Digest" },
        { url: "/feed/harness", title: "claude2master · Harness" },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-[var(--c2m-accent-deep)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          跳到正文
        </a>
        {/* Provider 包 Header+main+Footer 使按钮能用 context; BroadcastBar + <audio> 由 Provider 在 children 外常驻渲染 → 切页不卸载、不停播 */}
        <BroadcastProvider>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </BroadcastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
