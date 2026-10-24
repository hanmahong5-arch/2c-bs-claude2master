import { getChangelog } from "@/lib/content";
import { buildRadarLatest, RADAR_FEED_VERSION } from "@/lib/radar-feed";

// lutu App 后台轮询端点: 极小体积 (最新 30 条 id/标题/钩子), 用于判断新内容 + 生成推送文案。
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const items = await getChangelog();
  const body = {
    version: RADAR_FEED_VERSION,
    generatedAt: new Date().toISOString(),
    items: buildRadarLatest(items, 30),
  };
  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
