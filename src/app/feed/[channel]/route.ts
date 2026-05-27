import { notFound } from "next/navigation";
import { getChangelog, getDigest, getHarness } from "@/lib/content";
import { renderRss } from "@/lib/rss";
import type { ContentChannel } from "@/lib/content-types";

export const dynamic = "force-static";

const CHANNELS: ContentChannel[] = ["changelog", "digest", "harness"];

export async function generateStaticParams() {
  return CHANNELS.map((channel) => ({ channel }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ channel: string }> },
): Promise<Response> {
  const { channel } = await params;
  if (!CHANNELS.includes(channel as ContentChannel)) notFound();

  let items;
  switch (channel as ContentChannel) {
    case "changelog":
      items = await getChangelog();
      break;
    case "digest":
      items = await getDigest();
      break;
    case "harness":
      items = await getHarness();
      break;
  }

  const xml = renderRss(items, {
    channel: channel as ContentChannel,
    selfPath: `/feed/${channel}`,
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
