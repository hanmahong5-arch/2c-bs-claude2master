import type { SeoLanding } from "./seo-landings-types";

export const SEO_LANDINGS_PART2: SeoLanding[] = [
  {
    slug: "claude-4-7-api-cn",
    title: "Claude 国内 API 怎么调 (2026)",
    desc:
      "Claude 国内能用吗、各档模型 token 价格多少、newapi 等中转怎么选 — 一篇看完。",
    hook:
      "Claude Sonnet / Opus / Haiku / Fable 国内 API：价格、延迟、限流、合规 — 你关心的都在这。",
    keywords: [
      "Claude API 国内",
      "Claude API 中转",
      "Claude Opus 4.8",
      "Claude Sonnet 5",
      "Claude API 价格",
    ],
    updatedAt: "2026-07-03",
    toc: [
      { id: "models", label: "Claude 模型分档" },
      { id: "pricing", label: "价格对比 (官方 vs 中转)" },
      { id: "providers", label: "国内可用中转盘点" },
      { id: "code-sample", label: "调用示例 (3 语言)" },
      { id: "gotchas", label: "实战踩坑" },
    ],
    sections: [
      {
        id: "models",
        title: "Claude 模型分档",
        body: `Claude 当前按"档位"分四级，认准档位、不用背版本号（型号会换代，实时单价以 [价格对比表](/tools/price) 为准）：

- **最强旗舰 · Fable 5** (\`claude-fable-5\`)：最难的推理 / 长链任务、不计成本要最优解时用。
- **旗舰 · Opus 4.8** (\`claude-opus-4-8\`)：复杂规划 / 长文本 / 多步推理首选，支持 1M context。
- **均衡 · Sonnet 5** (\`claude-sonnet-5\`)：性价比之选，日常 80% 任务够用，默认就它。
- **轻量 · Haiku 4.5** (\`claude-haiku-4-5-20251001\`)：最快档，分类 / 抽取 / 翻译类轻任务专用，单价最低。

**怎么选**：批量结构化 → 轻量；常规对话 / coding → 均衡；复杂 agent / 难 debug → 旗舰；要极致效果不在乎成本 → 最强旗舰。`,
      },
      {
        id: "pricing",
        title: "价格对比 (官方 vs 中转)",
        body: `**官方价格** (核实于 2026-07，每百万 token；随时以 [价格对比表](/tools/price) 为准)：

| 模型 | 输入 | 输出 | Cache 写(5m) | Cache 读 |
|---|---|---|---|---|
| Fable 5 | $10 | $50 | $12.5 | $1.0 |
| Opus 4.8 | $5 | $25 | $6.25 | $0.5 |
| Sonnet 5 | $2 | $10 | $2.5 | $0.2 |
| Haiku 4.5 | $1 | $5 | $1.25 | $0.1 |

> Sonnet 5 的 $2/$10 为限时引导价（2026-08-31 前），之后转标准价 $3/$15。

**中转价格**：通常在官方价基础上 +10% ~ +30%，覆盖出口带宽、信用卡通道、汇率与利润。

**实用建议**：用 prompt cache 把 system prompt / few-shot examples 缓存上，长对话 cache 读价是输入的 1/10，省 70% 起。`,
      },
      {
        id: "providers",
        title: "国内可用中转盘点",
        body: `**正规化方向**：

- **newapi.lurus.cn** (lurus 自家)：兼容 Anthropic + OpenAI + 国产模型一张 key 全通。有发票 / 合同主体，对企业友好。
- **国内大厂**：腾讯云 / 火山引擎已经接 Claude 部分模型（限制大，需企业资质）。

**社区中转**：openrouter.ai / anyrouter / closeai 等。优势是模型多 / 价格灵活；劣势是合规与稳定性不如正规 + 多数封锁国内 IP，需要梯子。

**避坑**：广告里 "Claude 永久会员 99 元" 的镜像几乎都是共享账号池，封号风险随时炸。生产环境用一定走计费透明的渠道。`,
      },
      {
        id: "code-sample",
        title: "调用示例 (3 语言)",
        body: `**Python**:

\`\`\`python
import anthropic
client = anthropic.Anthropic(
    base_url="https://newapi.lurus.cn",
    api_key="sk-...",
)
resp = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "用一句话解释什么是 prompt cache"}],
)
print(resp.content[0].text)
\`\`\`

**TypeScript / Bun**:

\`\`\`ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({
  baseURL: "https://newapi.lurus.cn",
  apiKey: process.env.NEWAPI_KEY,
});
const resp = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hi" }],
});
\`\`\`

**curl** (最朴素)：

\`\`\`bash
curl https://newapi.lurus.cn/v1/messages \\
  -H "x-api-key: sk-..." \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{"model":"claude-sonnet-5","max_tokens":256,"messages":[{"role":"user","content":"Hi"}]}'
\`\`\``,
      },
      {
        id: "gotchas",
        title: "实战踩坑",
        body: `- **anthropic-version header 必传**：少这个 header 中转可能 200 但返回空 / 直接 400。当前推荐 \`2023-06-01\`。
- **1M context 要 beta header**：\`anthropic-beta: context-1m-2025-08-07\`，不加默认走 200K context。
- **stream 返回不是标准 SSE**：Anthropic 流是自定义的 \`event:\` + \`data:\` 双行格式，OpenAI SDK 直接转会丢字段。建议用 Anthropic 官方 SDK 或 \`@anthropic-ai/sdk\`。
- **cache TTL 是 5 分钟**：连续会话间隔超 5 min cache 就失效，长会话用 1h cache (beta) 更划算。
- **国内中转限速通常更严**：很多渠道把 RPS 限到 5-10，写 agent 时要做 backoff，否则 429 一片。`,
      },
    ],
    ctas: [
      {
        label: "看每日 Claude Code 更新摘要",
        href: "/changelog",
        desc: "追踪 Claude 系列版本变化",
      },
      {
        label: "Harness 文章：内部设计解剖",
        href: "/harness",
        desc: "搞懂 Claude Code 为什么这么设计，写更好的 agent",
      },
      {
        label: "申请 newapi API key",
        href: "https://newapi.lurus.cn",
        desc: "一张 key 走 Anthropic + OpenAI + 国产模型",
      },
    ],
  },
];
