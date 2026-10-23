// releases.ts — 机器可读的 release 摘要(/api/releases.json 的纯函数核心)
//
// 消费方: Lurus Switch 桌面端的「版本对比」—— 用户本机装的是 vX, 最新是 vY,
// 中间每个版本的中文摘要 + 「要不要升级」建议都从这里取。
// 只输出 TOOLS 注册表里工具的正式 release 条目(kind=changelog 且 sourceUrl 是 release tag)。

import type { ChangelogItem } from "./content-types";
import { toolForSource, versionFromSourceUrl } from "./tools";

const BASE = "https://claude2master.com";

export interface ReleaseEntry {
  /** TOOLS.key, 如 claude-code / codex / gemini-cli */
  tool: string;
  /** 原始 tag, 如 v2.1.263 / rust-v0.156.1 */
  tag: string;
  /** 去掉 tag 前缀后的版本号, 如 2.1.263 / 0.156.1 */
  version: string;
  publishedAt: string;
  hook: string;
  insight?: string;
  bullets: string[];
  tags: string[];
  url: string;
  sourceUrl: string;
  /** 摘要由模型生成(authored=llm)时为 true; 消费方须标注并以原文为准 */
  machineWritten: boolean;
}

export interface ReleasesPayload {
  schema: 1;
  generatedAt: string;
  items: ReleaseEntry[];
}

/** tag → 版本号: 从第一个数字起截取("rust-v0.156.1" → "0.156.1")。无数字 → null。 */
export function versionFromTag(tag: string): string | null {
  const i = tag.search(/\d/);
  return i < 0 ? null : tag.slice(i);
}

/** 正文里 "---" 分隔线之前的 "- " 列表项 = 要点。 */
export function bulletsFromBody(body: string): string[] {
  const head = body.split(/\n---\s*\n/)[0] ?? "";
  return head
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

export function buildReleases(items: ChangelogItem[], now: Date): ReleasesPayload {
  const out: ReleaseEntry[] = [];
  for (const it of items) {
    if (it.kind && it.kind !== "changelog") continue;
    const tool = toolForSource(it.source);
    if (!tool) continue;
    const tag = versionFromSourceUrl(it.sourceUrl);
    if (!tag) continue;
    const version = versionFromTag(tag);
    if (!version) continue;
    out.push({
      tool: tool.key,
      tag,
      version,
      publishedAt: it.publishedAt,
      hook: it.hook,
      insight: it.insight,
      bullets: bulletsFromBody(it.body),
      tags: it.tags,
      url: `${BASE}/changelog/${it.slug}`,
      sourceUrl: it.sourceUrl,
      machineWritten: it.authored !== "editor",
    });
  }
  out.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0));
  return { schema: 1, generatedAt: now.toISOString(), items: out };
}
