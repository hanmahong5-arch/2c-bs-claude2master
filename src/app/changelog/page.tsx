import type { Metadata } from "next";
import { getChangelog } from "@/lib/content";
import ChangelogList from "./ChangelogList";

export const metadata: Metadata = {
  title: "工具更新雷达 · 8 大 AI 编码工具中文 changelog",
  description:
    "Claude Code、Codex、Gemini CLI、Aider、Cline、goose、opencode、Roo Code 最新 release + Anthropic 工程博客的中文摘要。每日 09:30 自动更新，按工具分组。",
};

export const dynamic = "force-static";

export default async function ChangelogPage() {
  const items = await getChangelog();
  return <ChangelogList items={items} />;
}
