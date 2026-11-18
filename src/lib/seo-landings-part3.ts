import type { SeoLanding } from "./seo-landings-types";

export const SEO_LANDINGS_PART3: SeoLanding[] = [
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
];
