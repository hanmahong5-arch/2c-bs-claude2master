import type { Metadata } from "next";
import { getChangelog } from "@/lib/content";
import { changelogListJsonLd } from "@/lib/jsonld";
import { toolListCopy } from "@/lib/tools";
import ChangelogList from "./ChangelogList";

export const metadata: Metadata = {
  title: `工具更新雷达 · ${toolListCopy("count")}中文 changelog`,
  description: `${toolListCopy("full")} 最新 release + Anthropic 工程博客的中文摘要。每日 09:30 自动更新，按工具分组。`,
};

export const dynamic = "force-static";

export default async function ChangelogPage() {
  const items = await getChangelog();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(changelogListJsonLd(items)),
        }}
      />
      <ChangelogList items={items} />
    </>
  );
}
