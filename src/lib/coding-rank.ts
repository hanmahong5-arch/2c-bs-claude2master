// 中文 LLM 编程榜单 v0 数据
//
// 诚实约束:
// - 本榜单 v0 是"静态参考",不是实测 benchmark
// - 评分来源:Aider polyglot leaderboard (公开) + SWE-bench multilingual + 编辑部主观 + 社区共识
// - 不存在"中文 prompt 准确率"自动 benchmark — 这是 c2m 编辑部计划下一阶段建的
// - 任何工具的具体百分比都标"参考 / 实测待补"

export type ToolKey = "claude-code" | "cursor" | "cline" | "aider";

export interface ToolInfo {
  key: ToolKey;
  label: string;
  vendor: string;
  modelDefault: string;
  pricePerMonth: string;
  cnReachability: "direct" | "proxy-needed" | "hybrid";
  openSource: boolean;
}

export const TOOLS: ToolInfo[] = [
  {
    key: "claude-code",
    label: "Claude Code",
    vendor: "Anthropic",
    modelDefault: "Sonnet 5",
    pricePerMonth: "按 token (典型 $30-100)",
    cnReachability: "proxy-needed",
    openSource: false,
  },
  {
    key: "cursor",
    label: "Cursor",
    vendor: "Cursor (Anysphere)",
    modelDefault: "Composer 2 / Claude / GPT",
    pricePerMonth: "$20 Pro / $40 Business",
    cnReachability: "proxy-needed",
    openSource: false,
  },
  {
    key: "cline",
    label: "Cline",
    vendor: "Cline community",
    modelDefault: "用户自带 (Anthropic / OpenAI / DeepSeek)",
    pricePerMonth: "$0 (按 LLM provider 计费)",
    cnReachability: "hybrid",
    openSource: true,
  },
  {
    key: "aider",
    label: "Aider",
    vendor: "Paul Gauthier",
    modelDefault: "用户自带",
    pricePerMonth: "$0 (按 LLM provider 计费)",
    cnReachability: "hybrid",
    openSource: true,
  },
];

export interface BenchTask {
  id: string;
  category: "frontend" | "backend" | "data" | "fullstack" | "infra";
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  successCriteria: string;
}

// v0:5 道中文 spec, 后续可扩到 30-50 道
export const TASKS: BenchTask[] = [
  {
    id: "react-todo-undo",
    category: "frontend",
    difficulty: "easy",
    prompt: "用 React 19 + TypeScript 写一个 TodoMVC,支持 Cmd+Z 撤销。状态用 useReducer,不要外部依赖。",
    successCriteria:
      "(1) 一次 ship 能跑通 (2) Cmd+Z 真能撤销 (3) 没有引入不必要的库",
  },
  {
    id: "go-rest-paginate",
    category: "backend",
    difficulty: "medium",
    prompt:
      "用 Go + Gin 写一个 /users REST 端点,支持 cursor-based 分页。数据库用 SQLite (modernc.org/sqlite,纯 Go),返回 JSON。包含集成测试。",
    successCriteria:
      "(1) 编译通过 (2) curl 测试 200 (3) 第 N 页和第 N-1 页边界正确 (4) 测试真跑",
  },
  {
    id: "sqlite-dedupe",
    category: "data",
    difficulty: "medium",
    prompt:
      "给一个 SQLite users 表 (id, email, created_at),写 SQL 找出 email 重复的行,保留 created_at 最早那一条,删除其他。给完整 SQL + 用 Python 跑验证脚本。",
    successCriteria:
      "(1) SQL 语法对 (2) 真删了正确的行 (3) Python 验证脚本能 import sqlite3 跑通",
  },
  {
    id: "next-auth-zitadel",
    category: "fullstack",
    difficulty: "hard",
    prompt:
      "用 Next.js 16 App Router + Auth.js 接 Zitadel OIDC,实现登录/登出 + 受保护页面。中文 UI。",
    successCriteria:
      "(1) build 通过 (2) /api/auth/[...nextauth] 路由正确 (3) middleware 保护 /dashboard (4) 中文 i18n 完整",
  },
  {
    id: "k8s-debug-pod",
    category: "infra",
    difficulty: "hard",
    prompt:
      "K3s 集群里 my-app pod CrashLoopBackOff。给你 `kubectl get pods` 输出 + `kubectl describe` + `kubectl logs --previous`。诊断真因,给修复 patch。",
    successCriteria:
      "(1) 准确指出 root cause (2) 修复 patch 是最小改动 (3) 不让 agent 一上来就重启或删除",
  },
];

export type Score = 1 | 2 | 3 | 4 | 5;

export interface ScoreCell {
  tool: ToolKey;
  task: string;
  score: Score;
  note: string;
}

// v0 评分基于:Aider polyglot leaderboard (上代 Claude Sonnet ≈ 87% / GPT-5 ≈ 85% / DeepSeek V3 ≈ 64%)
// + Cursor CursorBench (Composer 2 = 61.3, Composer 1.5 = 44.2) + 编辑部主观 + 中文场景调整
// 中文场景下 Claude / Cursor 都比英文降 5-10%, 国内 LLM (DeepSeek/Qwen) 在某些任务反超
//
// 评分维度合并:能跑 + 一次过 + 代码质量,简化成 1-5 综合分
// 1 = 失败 / 2 = 勉强 / 3 = 能用 / 4 = 好 / 5 = 出彩
//
// **重要**:这些是 c2m 编辑部预期/参考分,**不是**实测榜单。每个 cell 备注说明依据。
export const SCORES: ScoreCell[] = [
  // react-todo-undo (easy)
  { tool: "claude-code", task: "react-todo-undo", score: 5, note: "Sonnet 5 一次过, useReducer 设计干净" },
  { tool: "cursor", task: "react-todo-undo", score: 5, note: "Composer 2 一次过, Tab 补全加分" },
  { tool: "cline", task: "react-todo-undo", score: 4, note: "依赖配 Claude/DeepSeek, 配 Claude 时与 #1 持平" },
  { tool: "aider", task: "react-todo-undo", score: 4, note: "CLI 模式对前端任务 UX 一般, 但生成质量 OK" },

  // go-rest-paginate (medium)
  { tool: "claude-code", task: "go-rest-paginate", score: 5, note: "agentic + 自跑测试, 这是它的强项场景" },
  { tool: "cursor", task: "go-rest-paginate", score: 4, note: "Composer 写得对, 但 cursor-based 边界要手动校" },
  { tool: "cline", task: "go-rest-paginate", score: 4, note: "插件+approve, 适合边看边改的中长任务" },
  { tool: "aider", task: "go-rest-paginate", score: 5, note: "Aider polyglot Go 85%+ 排行靠前" },

  // sqlite-dedupe (medium)
  { tool: "claude-code", task: "sqlite-dedupe", score: 4, note: "SQL 对, 但偶尔过度优化加 CTE" },
  { tool: "cursor", task: "sqlite-dedupe", score: 4, note: "对话式好用, 单文件场景跟 Claude 持平" },
  { tool: "cline", task: "sqlite-dedupe", score: 3, note: "依赖底模,DeepSeek 时 SQL 偶尔语法错" },
  { tool: "aider", task: "sqlite-dedupe", score: 4, note: "CLI 跑 sqlite3 验证一次过" },

  // next-auth-zitadel (hard)
  { tool: "claude-code", task: "next-auth-zitadel", score: 4, note: "Next 16 + Auth.js 已掌握, Zitadel 需提示完整 issuer" },
  { tool: "cursor", task: "next-auth-zitadel", score: 4, note: "Composer + 文档索引帮助 i18n 那段" },
  { tool: "cline", task: "next-auth-zitadel", score: 3, note: "多文件长任务用 Roo Code 的 architect mode 更顺" },
  { tool: "aider", task: "next-auth-zitadel", score: 3, note: "Aider 不擅长多文件交互式 UX 调整" },

  // k8s-debug-pod (hard)
  { tool: "claude-code", task: "k8s-debug-pod", score: 5, note: "subagent + plan mode + 自跑 kubectl, 诊断准" },
  { tool: "cursor", task: "k8s-debug-pod", score: 3, note: "Cursor 没 ops 优势, 给出分析但不能自跑 kubectl" },
  { tool: "cline", task: "k8s-debug-pod", score: 3, note: "需要本地有 kubectl, 能跑但缺 plan mode" },
  { tool: "aider", task: "k8s-debug-pod", score: 2, note: "CLI 适合代码, 不擅长 ops 调试场景" },
];

export function getScore(tool: ToolKey, taskId: string): ScoreCell | undefined {
  return SCORES.find((s) => s.tool === tool && s.task === taskId);
}

export function aggregateScore(tool: ToolKey): number {
  const cells = SCORES.filter((s) => s.tool === tool);
  if (cells.length === 0) return 0;
  return cells.reduce((sum, c) => sum + c.score, 0) / cells.length;
}
