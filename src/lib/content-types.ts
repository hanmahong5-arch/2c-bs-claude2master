import { toolListCopy } from "./tools";

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

export type ChangelogKind = "changelog" | "practice" | "trending" | "blogger";

export interface ChangelogItem extends ContentItemBase {
  channel: "changelog";
  source: string;
  sourceUrl: string;
  hook: string;
  model?: string;
  verified?: Verified;
  insight?: string;
  kind?: ChangelogKind;
  /** 博主条目署名 (kind: blogger); release/practice/trending 不设 */
  author?: string;
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
  changelog: `${toolListCopy("count")} 每日 release 中文摘要`,
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

export const KIND_LABEL: Record<
  ChangelogKind,
  { label: string; className: string }
> = {
  changelog: {
    label: "Release",
    className: "bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)]",
  },
  practice: {
    label: "实践",
    className: "bg-[rgba(31,122,79,0.12)] text-[var(--lt-ok)]",
  },
  trending: {
    label: "🔥 热门",
    className: "bg-[rgba(184,130,31,0.14)] text-[var(--lt-warn)]",
  },
  blogger: {
    label: "💬 观点",
    className: "bg-[rgba(45,74,138,0.12)] text-[var(--lt-info)]",
  },
};

