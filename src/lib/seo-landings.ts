// SEO 落地页数据。每页针对一个中文关键词建独立 URL，吃中文搜索流量。
// 灵感：Agent D 调研报告 (机器之心 SOTA / AIbase / 老金 10 万字 Claude 教程)。
// 文案口径：诚实、可操作、不夸大；底部 CTA 引流到 c2m 现有栏目。

export interface SeoSection {
  id: string;
  title: string;
  body: string;
}

export interface SeoCta {
  label: string;
  href: string;
  desc: string;
}

export interface SeoLanding {
  slug: string;
  title: string;
  desc: string;
  hook: string;
  keywords: string[];
  updatedAt: string;
  toc: { id: string; label: string }[];
  sections: SeoSection[];
  ctas: SeoCta[];
}

export const SEO_LANDINGS: SeoLanding[] = [
  {
    slug: "claude-code-cn",
    title: "Claude Code 国内完整指南 (2026)",
    desc:
      "中国大陆用 Claude Code 的全流程：3 分钟跑通、不翻墙、不踩坑。覆盖账号 / 代理 / 镜像 / IDE 集成 / 国内 API 中转。",
    hook:
      "Claude Code 在国内能不能用、怎么用、用谁的、付多少钱 — 这一页讲清楚。",
    keywords: [
      "Claude Code",
      "Claude Code 中文",
      "Claude Code 国内",
      "Claude Code 安装",
      "Claude Code 中文教程",
    ],
    updatedAt: "2026-05-26",
    toc: [
      { id: "tldr", label: "TL;DR" },
      { id: "what-is", label: "Claude Code 是什么" },
      { id: "blockers", label: "国内三道墙" },
      { id: "path-a", label: "路径 A：用 newapi 中转 (推荐)" },
      { id: "path-b", label: "路径 B：自己搭代理" },
      { id: "verify", label: "3 分钟跑通验证" },
      { id: "next", label: "继续学什么" },
    ],
    sections: [
      {
        id: "tldr",
        title: "TL;DR",
        body: `**结论先**：国内用 Claude Code 推荐两条路 — (a) 通过 newapi.lurus.cn 这类合规 API 中转（一键起跑、按量付费），(b) 自建梯子直连 Anthropic（控制力强但合规要自己负责）。

**最不推荐**：注册大量国外手机号 + 信用卡 + 灰色 Claude 镜像账号。Anthropic 风控持续在收紧，合规风险也高。

本页 800 字读完你能：(1) 判断自己适合哪条路；(2) 拿到一份能跑的最小配置；(3) 知道 c2m 还有哪些教程可以接着看。`,
      },
      {
        id: "what-is",
        title: "Claude Code 是什么",
        body: `Claude Code 是 Anthropic 官方的命令行 agent，主跑在终端里。你给它一个目标，它自己读代码、改代码、跑测试、commit。和 Cursor / Cline / Aider 同类，但官方出品 + Claude 自家模型 + 默认带 subagent / hook / skill / plan mode 等高级特性。

它本质是一个 CLI 进程 + 一组 tool（Bash/Read/Write/Edit/Grep/Glob/Agent/Plan...），通过 Anthropic API 跑 Claude 模型完成任务。国内能否用 = (a) 终端到 api.anthropic.com 的网络是否通；(b) 你有没有合规账号 + 计费方式。`,
      },
      {
        id: "blockers",
        title: "国内三道墙",
        body: `1. **网络墙**：api.anthropic.com 在中国大陆 ISP 默认是连不上的。Claude Code CLI 启动后会立刻报 connection timeout。
2. **账号墙**：Anthropic 注册需要国外手机号验证 + Stripe/信用卡。淘宝代注册账号风险极高（封号率 > 30%）。
3. **支付墙**：即使有号，国内的 Visa / Master 信用卡可能被 Stripe 拒。常用替代是 WildCard / Depay / OneKey Card 这类虚拟卡。

绕开任意一道墙 = 你需要要么自己搭梯子 + 解决账号支付，要么走 API 中转把这三道墙都包给中间商。`,
      },
      {
        id: "path-a",
        title: "路径 A：用 newapi 中转 (推荐)",
        body: `**适合**：想 5 分钟跑通、按量付费、对账号 / IP / 合规不想自己折腾。

最小配置：

\`\`\`bash
# 1. 注册 newapi.lurus.cn, 获取 API key (开账即有额度)
# 2. 装 Claude Code CLI
npm install -g @anthropic-ai/claude-code

# 3. 用 ANTHROPIC_BASE_URL 把官方端点重定向到 newapi
export ANTHROPIC_BASE_URL=https://newapi.lurus.cn
export ANTHROPIC_API_KEY=sk-...你的-newapi-key

# 4. 跑
claude
\`\`\`

newapi 是兼容 Anthropic Messages API 的中转层，对 Claude Code 完全透明 — CLI 不知道自己在走中转。计费按 token 走，价格与官方对齐或略高（覆盖中转 + 出口带宽）。

**支持模型**：Claude 3.5/3.7 Sonnet · Claude 4.x Opus/Sonnet/Haiku · 也可以混合 DeepSeek / GPT-4 等做 fallback。`,
      },
      {
        id: "path-b",
        title: "路径 B：自己搭代理",
        body: `**适合**：已有海外服务器 / VPN，希望 Claude Code 直连官方 + 自己掌握账号。

要点：

- Claude Code 走 \`HTTPS_PROXY\` 环境变量；export \`HTTPS_PROXY=http://127.0.0.1:7890\` 即可让它走本地代理。
- 账号要用 WildCard / Depay 等虚拟卡完成 Stripe 验证。封号风险随 IP 跳变而升高，建议绑定一台固定出口服务器。
- 即使直连，企业方案 (Claude for Work) 国内仍不可购买，只能走个人 Pro 或 API 计费。
- 对企业用户：合规上仍推荐走 newapi 这类有发票 / 合同主体的中转商，避免外汇支付与税务问题。`,
      },
      {
        id: "verify",
        title: "3 分钟跑通验证",
        body: `跑下面这条命令，能看到 Claude Code 列出当前目录就算通了：

\`\`\`bash
claude --print "ls 一下当前目录，告诉我你看到什么文件"
\`\`\`

预期看到：Claude 用 Bash tool 跑 \`ls\`，再用一句话总结看到的文件清单。

**常见报错**：
- \`401 Unauthorized\` → API key 错或未导入环境变量
- \`Connection timeout\` → 代理没生效 / newapi 域名 DNS 没解析
- \`Rate limit\` → 起步账号通常有 60 req / min 限制，等 1 分钟再试`,
      },
      {
        id: "next",
        title: "继续学什么",
        body: `跑通之后，下一步推荐看：

- **Claude Code 设置 IDE 集成** → 在 VS Code / JetBrains 里把 CLI 当 sidebar 用
- **Subagent / Skill / Hook 怎么写** → Claude Code 1.2 之后 subagent 默认开启，写好用的 subagent 是核心生产力
- **Plan mode 实战** → 长任务一定要先 plan 再写，否则 token 爆炸

c2m 的 Changelog 栏目每天同步 anthropics/claude-code 最新 release 中文摘要，Harness 栏目拆 Claude Code 内部设计（fork / memory / resume / BashTool 安全沙箱等）。`,
      },
    ],
    ctas: [
      {
        label: "在线 Chat 试 Claude",
        href: "/chat",
        desc: "免登录 3 次试用，0 配置体验对话能力",
      },
      {
        label: "看每日 Claude Code Changelog",
        href: "/changelog",
        desc: "anthropics/claude-code 每日 release 的中文摘要",
      },
      {
        label: "申请 newapi API key",
        href: "https://newapi.lurus.cn",
        desc: "国内可用的 Claude API 中转，注册即送试用额度",
      },
    ],
  },
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
  {
    slug: "cursor-vs-claude-code",
    title: "Cursor vs Claude Code 横评 (2026)",
    desc:
      "两款最火的 AI coding 工具实战对比：UX / 模型 / 价格 / 国内可用性 / Agent 能力。给你一个决策表。",
    hook:
      "选 Cursor 还是 Claude Code？这一页给你一个能直接用的决策框架，不堆功能列表。",
    keywords: [
      "Cursor vs Claude Code",
      "Cursor 中文",
      "Cursor 国内",
      "Claude Code 对比",
      "AI 编程工具",
    ],
    updatedAt: "2026-05-26",
    toc: [
      { id: "tldr", label: "30 秒决策" },
      { id: "ux", label: "UX：IDE vs CLI" },
      { id: "agent", label: "Agent 能力对比" },
      { id: "price", label: "价格与国内可用性" },
      { id: "pick", label: "什么场景选哪个" },
    ],
    sections: [
      {
        id: "tldr",
        title: "30 秒决策",
        body: `- **写前端 / 改 UI 多** → Cursor。Composer + 内嵌 Tab 自动补全的体验在 GUI 任务上很强。
- **agentic 后端 / 多步任务多** → Claude Code。subagent / hook / plan mode 是 Cursor 弱项。
- **团队协作 / 配置共享需求高** → Cursor 占优 (\`.cursorrules\` + Indexing 团队功能成熟)。
- **要做完全无人 agent / CI 跑** → Claude Code (CLI 天然好接管道)。
- **国内用户 / 不想折腾梯子** → 两者都需要 API 中转，难度持平 (都支持 \`ANTHROPIC_BASE_URL\` / \`OPENAI_BASE_URL\` 重定向)。`,
      },
      {
        id: "ux",
        title: "UX：IDE vs CLI",
        body: `**Cursor** 是 VS Code fork，左侧 Composer 像 ChatGPT 一样跟你聊，右侧 diff 一目了然，Tab 自动补全打字时随时出。重图形交互、看 diff 直观、改前端时拖拖拽拽很爽。

**Claude Code** 是 CLI，跑在终端里。所有上下文都在文本流里，看 diff 要靠 \`git diff\`，但天然能接进任何 IDE (有 sidebar 插件) 或 CI 流程。重逻辑驱动、批量任务、可脚本化。

**经验主义**：图形思考者 → Cursor；命令行思考者 → Claude Code。两者很难替代彼此，混用是可能的。`,
      },
      {
        id: "agent",
        title: "Agent 能力对比",
        body: `| 能力 | Cursor | Claude Code |
|---|---|---|
| 多步规划 (plan mode) | Composer 有类似但弱化 | 一等公民 (\`/plan\`) |
| Subagent / 任务分发 | 无内置 | 1.2 默认开启 |
| Custom hooks | 无 | Pre/Post tool hooks 可定制 |
| Skill / 工具库 | 内置 web search / file ops | Skill 商店 + MCP 接入 |
| 后台异步 agent | 无 | \`/agent --background\` |
| 团队共享 prompt 库 | \`.cursorrules\` 文件 | \`CLAUDE.md\` 项目级 |
| MCP 兼容 | 部分支持 | 原生支持 |

**结论**：写"agent 跑 agent"的多层任务，Claude Code 是更对的工具。写 90% 是单步 edit 的日常 coding，两者都行。`,
      },
      {
        id: "price",
        title: "价格与国内可用性",
        body: `**Cursor**：$20/月 Pro (含 500 GPT-4-class request)，$40/月 Business。超出额度走 API key bring-your-own。

**Claude Code**：CLI 本身免费，按 Anthropic API token 计费。Sonnet 5 ≈ $2/M 输入 + $10/M 输出。重度用户月成本通常 $30-100，但 cache 用好能砍到 1/3。

**国内可用性**：

- Cursor 直接连国外，需要稳定梯子。注册要国外邮箱，不强制信用卡。
- Claude Code 一样需要梯子或走 \`ANTHROPIC_BASE_URL\` 中转。

两者支付都要国外信用卡 / 虚拟卡。**走中转商通常能省去支付环节** (人民币付款拿等价 token)。`,
      },
      {
        id: "pick",
        title: "什么场景选哪个",
        body: `**全栈日常开发**：Cursor 主、Claude Code 配。Cursor 写代码、Claude Code 处理 "把整个 monorepo 升 React 19" 这种跨包跨文件长任务。

**纯后端 + DevOps**：Claude Code 一票通吃。subagent 并行 audit、CI 里跑 \`claude --print\` 做 review。

**学生 / 个人项目**：哪个先到手用哪个。两者都有 free tier (Cursor 14 天 / Anthropic 起步额度)。

**企业团队**：Cursor Business + 内部 prompt library；Claude Code 配自建中转 (newapi 这类) + CLAUDE.md 统一约束。`,
      },
    ],
    ctas: [
      {
        label: "Harness 文章：Claude Code 内部解剖",
        href: "/harness",
        desc: "搞懂 Claude Code 的 subagent / fork 机制，写更好的 agent",
      },
      {
        label: "在线 Chat 试 Claude",
        href: "/chat",
        desc: "免登录试 3 次，再决定要不要安装 CLI",
      },
      {
        label: "查 Claude Code 国内安装指南",
        href: "/zh/claude-code-cn",
        desc: "3 分钟从 0 到能跑通",
      },
    ],
  },
  {
    slug: "cline-roo-code-cn",
    title: "Cline / Roo Code 中文实战 (2026)",
    desc:
      "开源 AI coding agent 双雄 Cline 和 Roo Code 的中文使用、配置、国内 API 接入。",
    hook:
      "Cline 60k stars、Roo Code 是它的 fork — 这俩 VS Code 插件怎么在国内跑起来。",
    keywords: [
      "Cline 中文",
      "Cline 国内",
      "Roo Code",
      "VS Code AI 插件",
      "开源 Claude 工具",
    ],
    updatedAt: "2026-05-26",
    toc: [
      { id: "what", label: "Cline 和 Roo Code 是什么" },
      { id: "diff", label: "两者的区别" },
      { id: "install", label: "国内安装 + 配 API key" },
      { id: "use", label: "实际能干什么" },
      { id: "vs", label: "与 Cursor / Claude Code 比" },
    ],
    sections: [
      {
        id: "what",
        title: "Cline 和 Roo Code 是什么",
        body: `**Cline** (前身 Claude Dev) 是 VS Code 插件，把一个 agentic AI 嵌进编辑器侧栏。你给它指令，它在你的项目里读文件、执行 shell、改代码，并把每一步都让你 approve。开源 (Apache 2.0)，60k+ GitHub stars。

**Roo Code** 是 Cline 的社区 fork，2025 年开始独立维护。在 Cline 基础上加了：custom modes (架构师 / code-reviewer / 多角色切换)、更细的权限控制、experimental 功能更激进。也是开源。

两者核心架构相似：本地 VS Code 插件 + 用户自配 API key (Anthropic / OpenAI / DeepSeek / Ollama) + tool use loop。`,
      },
      {
        id: "diff",
        title: "两者的区别",
        body: `| 维度 | Cline | Roo Code |
|---|---|---|
| 维护 | 主线 (cline-bot) | 社区 fork |
| 自定义角色 | 单一 agent | 多 mode 切换 (Architect / Code / Ask...) |
| 权限粒度 | 基础 approve/reject | 更细 (按 tool 类型分别 allow/deny) |
| 实验功能 | 稳定优先 | 更激进 (browser tool / MCP 早接入) |
| 商业化 | 有 cline.bot 云服务可选 | 纯开源 |
| 国际化 | 多语言 | 多语言 |

**选哪个**：要稳定 + 长期维护选 Cline；要折腾 + 多 mode 切换选 Roo Code。两者插件可共存，自由切换。`,
      },
      {
        id: "install",
        title: "国内安装 + 配 API key",
        body: `**1. 装插件**：VS Code 扩展商店搜 "Cline" 或 "Roo Code"，国内能直接安装 (微软插件市场国内 CDN OK)。

**2. 配 API**：插件设置里选 Provider。**国内推荐 Anthropic Compatible + 自定义 baseURL**：

\`\`\`
Provider: Anthropic (Compatible)
Base URL: https://newapi.lurus.cn
API Key: sk-...你的中转 key
Model: claude-sonnet-5
\`\`\`

这样插件用 Anthropic SDK 协议，但流量走中转 — 跟 Claude Code 同模式。

**3. 不想中转**：可以用 DeepSeek API (国内直连 + 价格 1/10) — Provider 选 OpenAI Compatible，baseURL 填 \`https://api.deepseek.com/v1\`，model 填 \`deepseek-chat\` 或 \`deepseek-reasoner\`。效果略弱于 Claude 但够用。`,
      },
      {
        id: "use",
        title: "实际能干什么",
        body: `Cline / Roo Code 的杀手锏是**把 agent 直接嵌进你正在改的项目里**，每一步操作都有视觉确认：

- **跨文件 refactor**：让它把整个项目的 \`useState\` 替换成 \`useImmer\`，它会逐个 grep、读、改、显示 diff 让你 approve。
- **修 bug 闭环**：跑测试 → 看到失败 → 读相关文件 → 改 → 再跑 → 直到绿。
- **API 实现**：给一份 OpenAPI spec，它实现 client + tests + 文档。
- **代码评审**：开 Roo Code 的 "Code Reviewer" mode，让它扫整个 PR diff 输出 inline 评论。

**和 Copilot 的区别**：Copilot 是补全 (字符级)，Cline 是 agent (文件级 / 项目级)。两者不冲突，可以同时开。`,
      },
      {
        id: "vs",
        title: "与 Cursor / Claude Code 比",
        body: `- **vs Cursor**：Cursor 是完整 IDE，要切走原来的 VS Code；Cline 是插件，留在原 VS Code 里。Cursor 的 Composer 比 Cline 视觉好，但 Cline 完全开源 + 自带 API key 自由度高。
- **vs Claude Code**：Claude Code 是 CLI，Cline 是 GUI。Claude Code 适合"跑完不管"，Cline 适合"边看边批"。两者可以共存：Claude Code 跑后台长任务，Cline 做日常细修。
- **优势独占**：本地完全可控 + 任何 Anthropic-compatible / OpenAI-compatible API 都能接 (Ollama 本地模型也能跑) + 完全开源审计。`,
      },
    ],
    ctas: [
      {
        label: "看 Cline 每日更新",
        href: "/changelog",
        desc: "c2m 计划下个版本把 Cline / Roo Code release 也接入 daily-radar",
      },
      {
        label: "在线 Chat 试 Claude",
        href: "/chat",
        desc: "先试 Claude 模型质量再决定走哪条路",
      },
      {
        label: "国内 Claude API 中转",
        href: "https://newapi.lurus.cn",
        desc: "一张 key 通用，Cline / Cursor / Claude Code 都能接",
      },
    ],
  },
  {
    slug: "claude-skills-cn",
    title: "Claude Skills 中文入门 (2026)",
    desc:
      "Claude Skills 是什么、怎么写、社区现有 Skills 哪些值得用。配合 Claude Code 一键安装。",
    hook:
      "Skills 是 Claude Code 在 2025 末上的新原语。一句话：把可复用的 prompt + 工具组装成可命名调用的能力包。",
    keywords: [
      "Claude Skills",
      "Claude Skills 教程",
      "Claude Code Skill",
      "Skill 商店",
      "MCP",
    ],
    updatedAt: "2026-05-26",
    toc: [
      { id: "what", label: "Skill 是什么" },
      { id: "anatomy", label: "Skill 的解剖" },
      { id: "use", label: "怎么用现成的" },
      { id: "write", label: "怎么写自己的" },
      { id: "mcp", label: "和 MCP 是什么关系" },
    ],
    sections: [
      {
        id: "what",
        title: "Skill 是什么",
        body: `Claude Skill 是 Claude Code 内置的一种**可复用、可触发、可分享**的能力包。每个 skill 是一个 markdown 文件 + 描述什么时候用 + 怎么用，Claude Code 在判断需要时自动加载并执行。

**类比**：把 prompt 库 + 工具脚本 + 工作流打包成一个"slash command 加强版"。用户可以 \`/<skill-name>\` 显式触发，也可以让 Claude 根据描述自动匹配。

**为什么不直接用 prompt**：skill 自带触发条件、参数、工具白名单 — 比赤裸的 prompt 文件结构化，能被 Claude Code 调度。`,
      },
      {
        id: "anatomy",
        title: "Skill 的解剖",
        body: `一个最简 skill：

\`\`\`markdown
---
name: cn-translate
description: 把英文段落翻译成简体中文，保留代码 / 链接 / 术语
allowed-tools: [Read, Write, Edit]
---

你是专业翻译。读用户给的英文，输出简体中文：
- 保留代码块原样
- 保留 URL
- 技术术语第一次出现用 "中文 (English)" 双标
- 不要意译，逐句对齐
\`\`\`

frontmatter 三个字段：
- \`name\`：slash command 名 (\`/cn-translate\`)
- \`description\`：什么时候用 → Claude 用它自动判断该不该激活
- \`allowed-tools\`：白名单，避免 skill 越权调危险工具

skill body 就是 system prompt + 行为指令。`,
      },
      {
        id: "use",
        title: "怎么用现成的",
        body: `Claude Code 安装后，进入项目目录执行：

\`\`\`bash
# 列出当前可用 skills
claude /help

# 显式触发某个 skill
claude /cn-translate < input.txt > output.txt

# 让 Claude 自动选 skill
claude "把 input.txt 翻译成中文"  # 如果 cn-translate 的 description 匹配，会自动激活
\`\`\`

**社区 skill 来源**：

- Anthropic 官方 (\`.claude/skills/\` 内置)
- skillsmp.com / skills.pub (中文社区)
- GitHub topics: \`claude-code-skills\` (10000+)
- 自己写

**安装第三方 skill**：clone repo → 拷贝到 \`~/.claude/skills/\` 或项目级 \`.claude/skills/\`，Claude Code 启动时自动扫描。`,
      },
      {
        id: "write",
        title: "怎么写自己的",
        body: `写 skill 的四个准则 (来自 c2m 编辑部踩坑总结)：

1. **description 写"什么时候用"，不是"是什么"**。Claude 用 description 做匹配，越具体越准。
2. **prompt body 写"怎么做"而不是"是什么"**。Skill 是动作，不是知识。
3. **allowed-tools 严格白名单**。不要 \`[*]\`，列出真用到的 tool。
4. **加 ASCII 图 / 表格 > 长段文字**。Claude 对结构化输入更友好。

**调试**：写完 skill 后跑 \`claude /your-skill --dry-run\` 看它会激活哪些工具、生成什么 prompt 给模型。

**进阶**：skill 可以引用其他 skill (compose)，可以触发 subagent，可以接入 hook 改 Claude Code 的执行流程。Anthropic docs 有完整规范。`,
      },
      {
        id: "mcp",
        title: "和 MCP 是什么关系",
        body: `**MCP** (Model Context Protocol) 是 Anthropic 提的工具协议，让 AI 客户端 (Claude Code / Cursor / Claude Desktop) 都能用同一套外部工具 server。

**Skill ≠ MCP**：

- Skill 是 Claude Code 内部的"工作流封装"，跑在 client 里
- MCP 是"外部工具桥接"，跑在独立 server 里 (如 git mcp / k8s mcp / langfuse mcp)

**两者经常配合**：一个 skill 在 body 里要求 Claude 调一个 MCP server 暴露的 tool，组合出复杂工作流。

**举例**：c2m 编辑部的 \`/onboard\` skill (内部) 在执行时调 git mcp server (外部) 读 commit history + 调 langfuse mcp 看 trace，最后总结出 onboard 报告。`,
      },
    ],
    ctas: [
      {
        label: "在线 Chat 试 Claude",
        href: "/chat",
        desc: "试用 Claude 模型，再决定要不要装 Claude Code + Skill",
      },
      {
        label: "Harness：Claude Code 内部解剖",
        href: "/harness",
        desc: "搞懂 skill loader / agentTool 内部机制",
      },
      {
        label: "Claude Code 国内安装",
        href: "/zh/claude-code-cn",
        desc: "Skill 系统的载体 — Claude Code CLI 先跑通",
      },
    ],
  },
];

export function getSeoLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDINGS.find((l) => l.slug === slug);
}
