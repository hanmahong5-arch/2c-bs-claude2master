export type ContentChannel = "changelog" | "digest" | "harness";

export type Authored = "llm" | "editor" | "hybrid";

export interface ContentItemBase {
  channel: ContentChannel;
  slug: string;
  title: string;
  publishedAt: string;
  authored: Authored;
  tags: string[];
  body: string;
}

export type Verified = "tested" | "pending";

export interface ChangelogItem extends ContentItemBase {
  channel: "changelog";
  source: string;
  sourceUrl: string;
  hook: string;
  model?: string;
  verified?: Verified;
}

export interface DigestItem extends ContentItemBase {
  channel: "digest";
  hook: string;
  model?: string;
  weekOf: string;
  readingMinutes?: number;
}

export interface HarnessItem extends ContentItemBase {
  channel: "harness";
  desc: string;
  read?: string;
  model?: string;
  references?: string[];
}

export type ContentItem = ChangelogItem | DigestItem | HarnessItem;

export const CHANNEL_LABEL: Record<ContentChannel, string> = {
  changelog: "Changelog",
  digest: "Weekly",
  harness: "Harness",
};

export const CHANNEL_DESC: Record<ContentChannel, string> = {
  changelog: "Claude Code / Codex 每日 release 中文摘要",
  digest: "Agentic 工具链一周热点回顾",
  harness: "Agent harness 设计深度文章",
};

export const AUTHORED_LABEL: Record<Authored, string> = {
  llm: "LLM 自动摘要",
  editor: "编辑部撰写",
  hybrid: "协同产出",
};

export const VERIFIED_LABEL: Record<Verified, string> = {
  tested: "已实测",
  pending: "待验证",
};

