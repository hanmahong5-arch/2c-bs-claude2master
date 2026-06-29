// tools.ts — 工具注册表(单一信息源)
//
// repo ↔ 展示名/排序/筛选 key 收在一处, 供:
//   - changelog 按工具分组(ChangelogList)
//   - 主页雷达每工具取最新 1 条(RadarSection)
//   - ?tool=<key> 深链
//
// TOOLS 顺序与 scripts/radar/fetch-releases.sh 的 REPOS 必须一致 —— 改一处记得改另一处。
// 不引入构建期校验(YAGNI),靠本注释互指。

/** 工具品类: coding = 主流 AI 编码工具(站点主体); agent-runtime = 自托管自主 agent 框架专区 */
export type ToolGroup = "coding" | "agent-runtime";

export interface ToolMeta {
  /** 筛选 key + 深链 ?tool=<key>; kebab-case, 稳定不可随意改 */
  key: string;
  /** 展示名 */
  name: string;
  /** GitHub owner/repo, 与 ChangelogItem.source 精确匹配 */
  repo: string;
  /** 展示与分组顺序 */
  order: number;
  /** 所属品类 — changelog 按品类分块; 首页雷达/文案收口到 coding */
  group: ToolGroup;
}

export interface GroupMeta {
  key: ToolGroup;
  /** 段头展示名 */
  label: string;
  /** 段头副标题(空串则不展示) */
  blurb: string;
  /** 分块顺序 */
  order: number;
}

// 品类注册表 — changelog「全部」视图按此顺序分块出段。
export const TOOL_GROUPS: GroupMeta[] = [
  { key: "coding", label: "AI 编码工具", blurb: "", order: 0 },
  {
    key: "agent-runtime",
    label: "🦞 Agent 运行时专区",
    blurb: "自托管、可自主执行的 agent 框架 / runtime —— 记录每次发版、技术改进与社区观点。",
    order: 1,
  },
];

export const TOOLS: ToolMeta[] = [
  { key: "claude-code", name: "Claude Code", repo: "anthropics/claude-code", order: 0, group: "coding" },
  { key: "codex", name: "Codex", repo: "openai/codex", order: 1, group: "coding" },
  { key: "gemini-cli", name: "Gemini CLI", repo: "google-gemini/gemini-cli", order: 2, group: "coding" },
  { key: "aider", name: "Aider", repo: "Aider-AI/aider", order: 3, group: "coding" },
  { key: "cline", name: "Cline", repo: "cline/cline", order: 4, group: "coding" },
  { key: "goose", name: "goose", repo: "block/goose", order: 5, group: "coding" },
  { key: "opencode", name: "opencode", repo: "sst/opencode", order: 6, group: "coding" },
  { key: "roo-code", name: "Roo Code", repo: "RooCodeInc/Roo-Code", order: 7, group: "coding" },
  // ── Agent 运行时专区 (品类 agent-runtime; 顺序须与 fetch-releases.sh REPOS 续接一致) ──
  { key: "openclaw", name: "OpenClaw", repo: "openclaw/openclaw", order: 8, group: "agent-runtime" },
  { key: "zeroclaw", name: "ZeroClaw", repo: "zeroclaw-labs/zeroclaw", order: 9, group: "agent-runtime" },
  { key: "hermes", name: "Hermes Agent", repo: "NousResearch/hermes-agent", order: 10, group: "agent-runtime" },
];

const BY_REPO: Map<string, ToolMeta> = new Map(TOOLS.map((t) => [t.repo, t]));
const BY_KEY: Map<string, ToolMeta> = new Map(TOOLS.map((t) => [t.key, t]));

/** 取某品类下的工具(保持 TOOLS 内 order)— changelog 分块 / 首页雷达收口到 coding。 */
export function toolsInGroup(group: ToolGroup): ToolMeta[] {
  return TOOLS.filter((t) => t.group === group);
}

/** 按 release 的 source(owner/repo)精确匹配工具; practice 条目的 source 不会命中 → undefined */
export function toolForSource(source: string): ToolMeta | undefined {
  return BY_REPO.get(source);
}

export function toolForKey(key: string): ToolMeta | undefined {
  return BY_KEY.get(key);
}

/**
 * 从 sourceUrl 取版本号: .../releases/tag/<tag> 的末段。
 * 非 release URL(如 practice 工程博客)→ null。
 */
export function versionFromSourceUrl(url: string): string | null {
  const m = url.match(/\/releases\/tag\/([^/?#]+)/);
  if (!m) return null;
  return decodeURIComponent(m[1]);
}

/** 工具清单文案 — 供 RSS / metadata / 订阅页复用, 消除散落的 "Claude Code / Codex" 硬编码。
 *   "full"  → 枚举全部工具名(利 SEO/metadata)   "count" → "8 大 AI 编码工具"(列表过长处用) */
export function toolListCopy(format: "full" | "count"): string {
  // 仅统计 coding 品类: 站点主文案是「N 大 AI 编码工具」, agent-runtime 专区单独成段不计入此数。
  const coding = TOOLS.filter((t) => t.group === "coding");
  if (format === "full") return coding.map((t) => t.name).join("、");
  return `${coding.length} 大 AI 编码工具`;
}
