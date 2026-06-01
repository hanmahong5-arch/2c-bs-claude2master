import { notFound } from "next/navigation";
import { getChangelog } from "@/lib/content";
import { renderRss } from "@/lib/rss";
import { TOOLS, toolForKey, toolForSource } from "@/lib/tools";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return TOOLS.map((t) => ({ key: t.key }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
): Promise<Response> {
  const { key } = await params;
  const tool = toolForKey(key);
  if (!tool) notFound();

  const all = await getChangelog();
  const items = all.filter((item) => toolForSource(item.source)?.key === key);

  const xml = renderRss(items, {
    channel: "changelog",
    selfPath: `/feed/tool/${key}`,
    title: `claude2master · ${tool.name} Releases`,
    description: `${tool.name} 的每日 release 中文摘要`,
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
