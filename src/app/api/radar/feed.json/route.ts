import { promises as fs } from "fs";
import path from "path";
import { getChangelog, getGraphMap } from "@/lib/content";
import { buildRadarFeed, RADAR_FEED_VERSION } from "@/lib/radar-feed";

// lutu App 列表 / 详情端点: 最新 50 条完整条目 (正文 + 知识图谱 + 播报音频)。
export const dynamic = "force-static";

async function audioSlugs(): Promise<Set<string>> {
  const files = await fs
    .readdir(path.join(process.cwd(), "public", "audio"))
    .catch(() => [] as string[]);
  return new Set(files.filter((f) => f.endsWith(".zh.mp3")).map((f) => f.slice(0, -".zh.mp3".length)));
}

export async function GET(): Promise<Response> {
  const [items, graphs, audio] = await Promise.all([getChangelog(), getGraphMap(), audioSlugs()]);
  const body = {
    version: RADAR_FEED_VERSION,
    generatedAt: new Date().toISOString(),
    items: buildRadarFeed(items, graphs, audio, 50),
  };
  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
