import { postNewapiCompletion } from "../../src/infra/radar-http";

const NEWAPI_BASE_URL =
  process.env.NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
export const MODEL_ID = process.env.RADAR_MODEL_ID ?? "deepseek-chat";
const TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";

const SYSTEM_PROMPT = `你是 claude2master.com 编辑助手。给你过去若干天的 N 条 changelog 摘要（每条已是中文），请综合产出一份 "agentic 工具链周报" 草稿。编辑会在 PR 上做最后润色。

输出严格 JSON，字段如下：

{
  "title": "30 字内中文标题，按本周最大变化命名",
  "hook": "60 字内中文导语，回答 \\"这周值得关注的核心议题是什么\\"",
  "body": "1000-1500 字中文 markdown，固定五段结构：\\n\\n## 本周看点\\n2-3 句概述本周主基调\\n\\n## 逐条速览\\n每条 changelog 一段 (条目数=N, 不漏)。格式: '- **[源/标题]** (X min) — 一句话事实 + 原文 [链接](url)'。X min 按内容深度估 1-5 分钟阅读时长\\n\\n## 本周实测\\n挑 1 条本周 release 的具体功能, 用 100-200 字描述如果在 c2m 本地复现要做什么 (步骤简述 + 预期看到什么)。读者可以照着自己跑\\n\\n## 设计趋势\\n抽 1-2 条贯穿性的设计观察 + 对 agent harness 设计者的含义。必须有具体证据 (指向 changelog 条目)\\n\\n## 编辑没选它的原因\\n如果有 1-2 条 release 本周编辑刻意没展开, 简述为什么 (例: 仅文档调整 / 实验性 / 与本周主线无关)。如果全选了, 直接写'本周所有 release 都覆盖了, 无遗漏'",
  "tags": ["最多 5 个英文 kebab-case，贯穿本周主题"],
  "readingMinutes": "整个周报的总阅读时长 (整数, 4-12 之间)"
}

强约束：
- 引用具体 release 必须给原文 URL
- 不喊口号、不堆 emoji、不夸大
- 本周实测段必须可操作 (有命令 / URL / 具体动作)，不要写空话
- "编辑没选它的原因"段是 c2m 差异化栏目, 一定要有判断, 不要敷衍
- 设计趋势那段必须有具体证据 (指向 changelog 条目)
- 输出必须是合法 JSON，无任何前后说明文字`;

export interface ChangelogSnapshot {
  slug: string;
  title: string;
  hook: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  body: string;
}

export interface DigestOutput {
  title: string;
  hook: string;
  body: string;
  tags: string[];
  readingMinutes?: number;
}

export function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  body: string;
} {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const data: Record<string, unknown> = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value: unknown = m[2].trim();
    if (typeof value === "string") {
      const s = value as string;
      if (s.startsWith("[") && s.endsWith("]")) {
        value = s
          .slice(1, -1)
          .split(",")
          .map((x) => x.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (
        (s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))
      ) {
        value = s.slice(1, -1);
      }
    }
    data[key] = value;
  }
  return { data, body };
}

export function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: date.getUTCFullYear(), week };
}

export function mondayOf(d: Date): string {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (dayNum - 1));
  return date.toISOString().slice(0, 10);
}

export function buildLLMInput(items: ChangelogSnapshot[]): string {
  return items
    .map(
      (i) => `## ${i.title}
- repo: ${i.source}
- 日期: ${i.publishedAt}
- 原文: ${i.sourceUrl}
- 钩子: ${i.hook}
- 摘要正文:
${i.body}`,
    )
    .join("\n\n---\n\n");
}

export async function callLLM(input: string): Promise<DigestOutput> {
  if (!TOKEN) throw new Error("NEWAPI_TRIAL_TOKEN missing");
  const content = await postNewapiCompletion({
    baseUrl: NEWAPI_BASE_URL,
    token: TOKEN,
    model: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    userContent: input,
    maxTokens: 2500,
    temperature: 0.4,
  });
  let parsed: DigestOutput;
  try {
    parsed = JSON.parse(content) as DigestOutput;
  } catch {
    throw new Error(`LLM did not return valid JSON: ${content.slice(0, 200)}`);
  }
  if (
    !parsed.title ||
    !parsed.hook ||
    !parsed.body ||
    !Array.isArray(parsed.tags)
  ) {
    throw new Error(`LLM JSON missing fields: ${content.slice(0, 200)}`);
  }
  return parsed;
}

export function buildMdx(args: {
  slug: string;
  weekOf: string;
  publishedAt: string;
  digest: DigestOutput;
}): string {
  const { slug, weekOf, publishedAt, digest } = args;
  const tagsArr = `[${digest.tags.map((t) => t.trim()).join(", ")}]`;
  const reading =
    typeof digest.readingMinutes === "number" && digest.readingMinutes > 0
      ? Math.min(15, Math.max(3, Math.round(digest.readingMinutes)))
      : Math.max(3, Math.min(15, Math.round(digest.body.length / 400)));
  return `---
slug: ${slug}
title: "${digest.title.replace(/"/g, '\\"')}"
publishedAt: ${publishedAt}
weekOf: ${weekOf}
authored: hybrid
model: ${MODEL_ID}
readingMinutes: ${reading}
hook: "${digest.hook.replace(/"/g, '\\"')}"
tags: ${tagsArr}
---

${digest.body}

---

> 本周报由 LLM 起草、编辑润色（hybrid）。本草稿走 PR 审核流程，merge 前编辑会校稿。
`;
}
