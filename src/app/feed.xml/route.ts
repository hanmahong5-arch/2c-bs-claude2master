import { getAllContent } from "@/lib/content";
import { renderRss } from "@/lib/rss";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const items = await getAllContent();
  const xml = renderRss(items, { channel: "all", selfPath: "/feed.xml" });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
