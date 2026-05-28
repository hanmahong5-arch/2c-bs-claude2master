import type { Metadata } from "next";
import { getChangelog } from "@/lib/content";
import ChangelogList from "./ChangelogList";

export const metadata: Metadata = {
  title: "Changelog · Claude Code / Codex 中文雷达",
  description:
    "Anthropic claude-code 与 OpenAI codex 最新 release + 工程博客的中文摘要。每日 09:30 自动更新。",
};

export const dynamic = "force-static";

export default async function ChangelogPage() {
  const items = await getChangelog();
  return <ChangelogList items={items} />;
}
