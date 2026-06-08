// types.ts — 全局语音播报器共享契约。
//
// 与后端 tts-generate(-cosy).ts 产出的 enriched manifest 一一对应:
// 旧版 manifest 每条仅 {slug,zh,en}; enriched 版补 title/kind/author/source/tool/publishedAt。
// 所有 enriched 字段 optional → 旧三字段 manifest 仍可读(向后兼容, 缺 title 退 slug)。

import type { ChangelogKind } from "@/lib/content-types";

export type Lang = "zh" | "en" | "both";

/** 时间跨度筛选: 今天 / 近3天 / 近7天 / 全部 (按 publishedAt 过滤) */
export type Span = "today" | "3d" | "7d" | "all";

/** /audio/manifest.json 单条 (enriched; 旧版只有前三字段) */
export interface EnrichedManifestEntry {
  slug: string;
  zh: boolean;
  en: boolean;
  /** 卡片标题 (含中英); 缺省时播放条退回 slug */
  title?: string;
  /** 归类; 缺省按 "changelog" 处理 (向后兼容) */
  kind?: ChangelogKind;
  /** 博主署名 (kind: blogger) */
  author?: string;
  /** release 的 owner/repo 或 practice/blogger 的来源名 */
  source?: string;
  /** 工具筛选 key (toolForSource(source)?.key); 无对应工具 → null */
  tool?: string | null;
  publishedAt?: string;
}

/** 展开后的播放单元 (一条目按 zh/en/both 拆成 1~2 个 clip) */
export interface Clip {
  /** 在过滤后 playable 列表中的下标 (用于 "第 X/total 条" 显示) */
  entryIdx: number;
  lang: "zh" | "en";
  url: string;
  title: string;
  author?: string;
  source?: string;
}

export interface BroadcastFilters {
  /** 工具 key 集合; 空 = 不限工具 */
  tools: string[];
  /** 归类; "all" = 不限 */
  kind: "all" | ChangelogKind;
  /** 时间跨度 */
  span: Span;
}

export interface BroadcastContextValue {
  // ── 状态 ──
  avail: EnrichedManifestEntry[] | null;
  queue: Clip[];
  clipIdx: number;
  playing: boolean;
  open: boolean;
  lang: Lang;
  filters: BroadcastFilters;
  // ── 派生 ──
  /** manifest 真实出现的工具 (经 tools.ts 排序) → 渲染工具 chips */
  toolOptions: { key: string; name: string }[];
  /** manifest 真实出现的归类 → 渲染归类 chips */
  kindOptions: ChangelogKind[];
  /** 当前 clip */
  current?: Clip;
  /** 过滤后可播条目数 (用于 X/total) */
  total: number;
  /** 是否有任何可播音频 (按当前筛选) */
  hasQueue: boolean;
  /** manifest 是否有任意音频 (与筛选无关 → 控制 Header 按钮 disabled) */
  hasAudio: boolean;
  // ── 方法 ──
  /** 关→开(从头播) / 开→停 */
  toggle: () => void;
  stop: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  /** 跳到上/下一「条目」(跨过 both 模式的双 clip) */
  jump: (dir: 1 | -1) => void;
  setLang: (l: Lang) => void;
  setFilters: (patch: Partial<BroadcastFilters>) => void;
}
