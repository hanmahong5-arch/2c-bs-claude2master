import { getChangelog } from "@/lib/content";
import { buildReleases } from "@/lib/releases";

export const dynamic = "force-static";

// 机器可读 release 摘要, 供 Lurus Switch 桌面端「版本对比」消费。
export async function GET(): Promise<Response> {
  const payload = buildReleases(await getChangelog(), new Date());
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
