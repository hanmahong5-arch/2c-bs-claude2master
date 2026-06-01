// tools.ts — 工具注册表(单一信息源)
//
// repo ↔ 展示名/排序/筛选 key 收在一处, 供:
//   - changelog 按工具分组(ChangelogList)
//   - 主页雷达每工具取最新 1 条(RadarSection)
//   - ?tool=<key> 深链
//
// TOOLS 顺序与 scripts/radar/fetch-releases.sh 的 REPOS 必须一致 —— 改一处记得改另一处。
// 不引入构建期校验(YAGNI),靠本注释互指。

export interface ToolMeta {
  /** 筛选 key + 深链 ?tool=<key>; kebab-case, 稳定不可随意改 */
  key: string;
  /** 展示名 */
  name: string;
  /** GitHub owner/repo, 与 ChangelogItem.source 精确匹配 */
  repo: string;
  /** 展示与分组顺序 */
  order: number;
}

export const TOOLS: ToolMeta[] = [
  { key: "claude-code", name: "Claude Code", repo: "anthropics/claude-code", order: 0 },
  { key: "codex", name: "Codex", repo: "openai/codex", order: 1 },
  { key: "gemini-cli", name: "Gemini CLI", repo: "google-gemini/gemini-cli", order: 2 },
  { key: "aider", name: "Aider", repo: "Aider-AI/aider", order: 3 },
  { key: "cline", name: "Cline", repo: "cline/cline", order: 4 },
  { key: "goose", name: "goose", repo: "block/goose", order: 5 },
  { key: "opencode", name: "opencode", repo: "sst/opencode", order: 6 },
  { key: "roo-code", name: "Roo Code", repo: "RooCodeInc/Roo-Code", order: 7 },
];

const BY_REPO: Map<string, ToolMeta> = new Map(TOOLS.map((t) => [t.repo, t]));
const BY_KEY: Map<string, ToolMeta> = new Map(TOOLS.map((t) => [t.key, t]));

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
  if (format === "full") return TOOLS.map((t) => t.name).join("、");
  return `${TOOLS.length} 大 AI 编码工具`;
}
