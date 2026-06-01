import type { ContentChannel, ContentItem } from "./content-types";
import { toolListCopy } from "./tools";

const BASE = "https://claude2master.com";

const CHANNEL_TITLE: Record<ContentChannel, string> = {
  changelog: "claude2master · Changelog",
  digest: "claude2master · Weekly Digest",
  harness: "claude2master · Harness",
};

const CHANNEL_DESCRIPTION: Record<ContentChannel, string> = {
  changelog: `${toolListCopy("count")}每日 release 中文摘要 — 由 daily-radar workflow 自动注水`,
  digest: `Agent tooling 每周一回顾，覆盖${toolListCopy("count")}与行业动态`,
  harness: "Agent harness 设计深度文章 — scaffolding / context / tool use / eval loop",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function itemDescription(item: ContentItem): string {
  if (item.channel === "changelog" || item.channel === "digest") {
    return item.hook || item.body.slice(0, 280);
  }
  return item.desc || item.body.slice(0, 280);
}

function itemPath(item: ContentItem): string {
  switch (item.channel) {
    case "changelog":
      return `/changelog/${item.slug}`;
    case "digest":
      return `/weekly/${item.slug}`;
    case "harness":
      return `/harness/${item.slug}`;
  }
}

export interface FeedOptions {
  channel?: ContentChannel | "all";
  selfPath: string;
  title?: string;
  description?: string;
}

export function renderRss(items: ContentItem[], opts: FeedOptions): string {
  const channel = opts.channel ?? "all";
  const title =
    opts.title ??
    (channel === "all"
      ? "claude2master · Agentic 中文雷达"
      : CHANNEL_TITLE[channel]);
  const description =
    opts.description ??
    (channel === "all"
      ? `${toolListCopy("full")} 等 agent 工具 / harness 行业动态中文站点`
      : CHANNEL_DESCRIPTION[channel]);

  const latest = items[0]?.publishedAt ?? new Date().toISOString();

  const itemsXml = items
    .map((item) => {
      const link = `${BASE}${itemPath(item)}`;
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(item.publishedAt)}</pubDate>
      <category>${escapeXml(item.channel)}</category>
      <description><![CDATA[${itemDescription(item)}]]></description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${BASE}</link>
    <description>${escapeXml(description)}</description>
    <language>zh-CN</language>
    <atom:link href="${BASE}${opts.selfPath}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
    <generator>claude2master radar</generator>
${itemsXml}
  </channel>
</rss>
`;
}
