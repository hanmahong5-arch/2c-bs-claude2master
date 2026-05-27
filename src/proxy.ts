import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RSS_READER_HINTS = [
  "Feedly",
  "Inoreader",
  "Miniflux",
  "follow",
  "FeedBin",
  "NewsBlur",
  "TheOldReader",
  "Reeder",
  "NetNewsWire",
];

export function proxy(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (RSS_READER_HINTS.some((h) => ua.toLowerCase().includes(h.toLowerCase()))) {
    console.log(
      `RSS_HIT path=${req.nextUrl.pathname} ua="${ua.slice(0, 200)}"`,
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/feed.xml", "/feed/:channel"],
};
