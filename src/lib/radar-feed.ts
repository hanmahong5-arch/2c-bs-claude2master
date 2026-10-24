// radar-feed.ts — 给移动端 (lutu App「AI 雷达」) 的 JSON 契约。纯函数, 路由层只负责读数据 + 序列化。
//
// 两个端点 (均构建期静态生成, 随每日雷达部署刷新):
//   /api/radar/latest.json — 极小 (最新 30 条 id/标题/钩子), App 后台轮询用 → 判断有无新内容 + 推送文案
//   /api/radar/feed.json   — 最新 50 条完整条目 (正文 markdown + 知识图谱 + 音频), App 列表/详情用
//
// 契约版本 v1。字段只增不改; 破坏性变更须升 version 并保留旧端点一个 App 发版周期。

import type { ChangelogItem } from "./content-types";
import { KIND_LABEL } from "./content-types";
import type { ArticleGraph } from "./graph";

export const RADAR_FEED_VERSION = 1;
const SITE = "https://claude2master.com";

export interface RadarFeedItem {
  id: string;
  title: string;
  hook: string;
  kind: string;
  kindLabel: string;
  category?: string;
  source: string;
  author?: string;
  publishedAt: string;
  url: string;
  sourceUrl: string;
  tags: string[];
  body: string;
  insight?: string;
  graph?: ArticleGraph;
  audioUrl?: string;
}

export interface RadarLatestItem {
  id: string;
  title: string;
  hook: string;
  kind: string;
  kindLabel: string;
  publishedAt: string;
}

// 推送价值排序: 同一天内 社区热议 / 官方发布 优先于 个人博客 / 热门仓库 (App 推送只推第一条)
const KIND_PRIORITY: Record<string, number> = {
  community: 0,
  changelog: 1,
  practice: 2,
  blogger: 3,
  trending: 4,
};

function kindOf(c: ChangelogItem): string {
  return c.kind ?? "changelog";
}

function sortForApp(items: ChangelogItem[]): ChangelogItem[] {
  return [...items].sort((a, b) => {
    if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
    const pa = KIND_PRIORITY[kindOf(a)] ?? 9;
    const pb = KIND_PRIORITY[kindOf(b)] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.slug < b.slug ? -1 : 1;
  });
}

/** 正文去掉末尾「原文：…」署名块 (App 单独渲染原文按钮), 保留要点 bullets。 */
export function stripFooter(body: string): string {
  const idx = body.lastIndexOf("\n---");
  return (idx > 0 ? body.slice(0, idx) : body).trim();
}

export function buildRadarLatest(items: ChangelogItem[], limit = 30): RadarLatestItem[] {
  return sortForApp(items)
    .slice(0, limit)
    .map((c) => {
      const kind = kindOf(c);
      return {
        id: c.slug,
        title: c.title,
        hook: c.hook,
        kind,
        kindLabel: KIND_LABEL[c.kind ?? "changelog"].label,
        publishedAt: c.publishedAt,
      };
    });
}

export function buildRadarFeed(
  items: ChangelogItem[],
  graphs: Map<string, ArticleGraph>,
  audioSlugs: Set<string>,
  limit = 50,
): RadarFeedItem[] {
  return sortForApp(items)
    .slice(0, limit)
    .map((c) => {
      const kind = kindOf(c);
      const out: RadarFeedItem = {
        id: c.slug,
        title: c.title,
        hook: c.hook,
        kind,
        kindLabel: KIND_LABEL[c.kind ?? "changelog"].label,
        source: c.source,
        publishedAt: c.publishedAt,
        url: `${SITE}/changelog/${c.slug}`,
        sourceUrl: c.sourceUrl,
        tags: c.tags,
        body: stripFooter(c.body),
      };
      if (c.category) out.category = c.category;
      if (c.author) out.author = c.author;
      if (c.insight) out.insight = c.insight;
      const g = graphs.get(c.slug);
      if (g) out.graph = g;
      if (audioSlugs.has(c.slug)) out.audioUrl = `${SITE}/audio/${c.slug}.zh.mp3`;
      return out;
    });
}
