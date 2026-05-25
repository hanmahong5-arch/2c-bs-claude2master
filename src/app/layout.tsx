import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
