export type TutorialCategory =
  | "入门"
  | "配置"
  | "Skills"
  | "Hooks"
  | "MCP"
  | "工作流";

export const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  "入门",
  "配置",
  "Skills",
  "Hooks",
  "MCP",
  "工作流",
];

export interface Tutorial {
  slug: string;
  category: TutorialCategory;
  title: string;
  desc: string;
  read: string;
  date: string;
  pinned?: boolean;
  body: string;
}

export const TUTORIALS: Tutorial[] = [
  {
    slug: "claude-code-setup",
    category: "入门",
    title: "Claude Code 国内零障碍接入",
    desc: "一行 env 让 Claude Code 走 newapi 走 Claude — 不翻墙、不要美卡。",
    read: "5 分钟",
    date: "2026-05-25",
    pinned: true,
    body: `## 痛点

国内直连 \`api.anthropic.com\` 三个坎：

1. 网络不稳，TLS 握手经常失败
2. 必须美国信用卡 + 美国家庭地址才能开账户
3. 中国大陆实体被 ToS 明确限制（2025-09 起）

绕过的最简方案：把 Claude Code 的 base URL 指到一个稳定的 OpenAI-compatible 中转网关。本站推荐 [newapi.lurus.cn](https://newapi.lurus.cn)（Lurus 自营，prod 稳定）。

## 三步配通

### 1. 拿 API key

去 [newapi.lurus.cn](https://newapi.lurus.cn) 注册账号，控制台生成一个 token，保存好（只显示一次）。

### 2. 安装 Claude Code

\`\`\`bash
# macOS / Linux
curl -sSL https://claude.ai/install.sh | bash

# Windows (PowerShell)
iwr -useb https://claude.ai/install.ps1 | iex
\`\`\`

或者用包管理器：

\`\`\`bash
npm i -g @anthropic-ai/claude-code
\`\`\`

### 3. 设环境变量

\`\`\`bash
# macOS / Linux — 写到 ~/.zshrc 或 ~/.bashrc
export ANTHROPIC_BASE_URL="https://newapi.lurus.cn"
export ANTHROPIC_API_KEY="sk-your-newapi-token"
\`\`\`

Windows（PowerShell 持久化）：

\`\`\`powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://newapi.lurus.cn", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-your-newapi-token", "User")
\`\`\`

## 验证

新开一个 shell：

\`\`\`bash
claude --version
claude "用一句话介绍你自己"
\`\`\`

看到 Claude 的回复就成了。

## 常见坑

- **改完 env 没生效** — Claude Code 是新进程才读 env，老 shell 要重开
- **PowerShell 临时变量** — \`$env:ANTHROPIC_API_KEY="..."\` 只对当前 session，关 PowerShell 就丢
- **代理冲突** — 如果你装了系统代理（Clash / V2Ray），\`HTTPS_PROXY\` 可能把请求绕到代理上，再绕一次反而连不通。先关代理试

## 下一步

- 看 [模型选型](/tutorials/model-selection) 决定平时用 Sonnet 还是 Opus
- 看 [Hooks 实战](/tutorials/hooks-pre-commit) 让 Claude 自动跑 lint
`,
  },
  {
    slug: "model-selection",
    category: "配置",
    title: "Claude 模型选型：Haiku / Sonnet / Opus / Fable 怎么分工省钱",
    desc: "哪个任务该用哪档模型？一套不随版本过期的分工框架，把每月账单砍掉一半。",
    read: "8 分钟",
    date: "2026-07-03",
    body: `## 四档一张表

按"档位"选，不用背版本号。当前各档的代表型号如下，**实时单价以 [价格对比表](/tools/price) 为准**（已逐个核对官方定价）。

| 档位 | 当前代表 | 速度 | 相对成本 | 主战场 |
| --- | --- | --- | --- | --- |
| **轻量** | Haiku 4.5 | 极快 | 最低 | 翻译 · 分类 · 摘要 · 简单 Q&A |
| **均衡** | Sonnet 5 | 中 | 中 | 日常 code · 写作 · review · 大部分对话 |
| **旗舰** | Opus 4.8 | 慢 | 高 | 复杂推理 · 长文生成 · 架构决策 · 难 debug |
| **最强旗舰** | Fable 5 | 慢 | 最高 | 最难的推理 / 长链任务，不计成本要最优解时 |

档位是耐久的，型号会换代——认准"轻量 / 均衡 / 旗舰"的分工，换代时对号入座即可。

## 决策树

\`\`\`
任务来了
  │
  ├─ 是简单的"输入→输出"映射？（翻译/格式转换/分类）
  │  └─ 轻量档（Haiku）
  │
  ├─ 需要思考但不算难？（写代码/读文档/写文案）
  │  └─ 均衡档（Sonnet）← 默认就选它
  │
  ├─ 需要长链推理 / 跨多个文件 / 长篇结构化输出？
  │  └─ 旗舰档（Opus）
  │
  └─ 最难的活、要最优解且不在乎成本？
     └─ 最强旗舰（Fable）
\`\`\`

## 实战分配策略（80 / 15 / 5）

经验值：

- **80% 均衡档** — 默认
- **15% 旗舰档** — 关键场景（review 重要 diff、写架构文档、debug 顽固 bug）
- **5% 轻量档** — 批量预处理（如把 100 条用户反馈先分类，再让均衡档深入分析 top 10）

## 省钱技巧

### 1. Haiku 预筛 + 升级

把 100 条客户邮件先丢给轻量档分类 / 提取要点，再把"高优先级"那 10 条丢给均衡档起草回复。账单可能砍掉 80%。

### 2. Prompt 缩短

每个 token 都花钱。把无意义的客套语 / 重复的上下文删掉。结构化字段（如 markdown 表格）比自然语言密度高。

### 3. 用 prompt caching

Anthropic 支持 prompt caching — 同一个长 system prompt 复用时，缓存部分的 token 降到 1/10 价。Claude Code 的 \`/cache\` 命令可以手动 pin。

### 4. 别把旗舰档当 chatbot

跟旗舰档闲聊是浪费钱。日常切到均衡档，重活再升旗舰档。

## 速度示意（相对快慢，非精确基准）

越强的档位越慢，这是常态。下表只示意相对量级，具体因 prompt、负载、网络而异：

| 任务 | 轻量 | 均衡 | 旗舰 |
| --- | --- | --- | --- |
| 写一首七绝 | 最快 | 快 | 中 |
| review 200 行 React | 快 | 中 | 慢 |
| 写 1500 字 PRD 草稿 | 不胜任 | 中 | 慢 |

## 切换方法

Claude Code 里用 \`/model\` 命令（型号 ID 会随版本更新，以客户端 \`/model\` 列表为准）：

\`\`\`
/model claude-haiku-4-5-20251001
/model claude-sonnet-5
/model claude-opus-4-8
/model claude-fable-5
\`\`\`

或者在 \`.claude/settings.json\` 配 \`model\` 字段做项目默认。

## 一句话总结

**默认均衡档，难活升旗舰档，批量降轻量档；单价随时查 [价格对比表](/tools/price)，大陆能不能直连查 [访问性对照表](/access)。**
`,
  },
  {
    slug: "skills-intro",
    category: "Skills",
    title: "Skills 是什么、怎么写、怎么用",
    desc: "2025-12 新标准的来龙去脉 + 一个能跑的 hello-world skill。",
    read: "12 分钟",
    date: "2026-05-25",
    body: `## 一句话定义

**Skill = 把领域知识打包成 Claude 能按需调用的"小模块"。**

每个 skill 是一个文件夹，里面有一份 \`SKILL.md\` 描述「这个 skill 干什么、什么时候触发、内部怎么干」。Claude 在对话中按 description 自动匹配该 skill，把它的内容加载进上下文。

## 与 prompt / hook / MCP 的区别

| 机制 | 触发方 | 内容 | 典型场景 |
| --- | --- | --- | --- |
| **System Prompt** | 启动时挂上 | 永远在 context | 角色 / 通用规则 |
| **Skill** | LLM 按 description 主动选 | 临时加载 | 领域专长（如 frontend-design） |
| **Hook** | 事件触发（pre-commit 等）| 跑命令 | 强制流程（lint / 安全检查）|
| **MCP** | LLM 显式 tool call | 外部数据 / 操作 | 调 DB / 查 API |

记忆口诀：**skill 是知识，hook 是流程，MCP 是工具。**

## Skill 文件结构

\`\`\`
.claude/skills/<name>/
  SKILL.md         # 必须 — frontmatter + body
  reference.md     # 可选 — 长引用资料
  examples.md      # 可选 — few-shot 示例
  scripts/         # 可选 — 配套脚本
\`\`\`

## SKILL.md frontmatter

\`\`\`markdown
---
name: hello-world
description: 当用户说 hello / 你好 时打招呼，返回友善欢迎并提示 3 个能干的事
---

# Hello World Skill

你是 hello-world skill。当用户打招呼时：

1. 用一句话欢迎（带 emoji 也行）
2. 列 3 个本项目能干的事
3. 邀请用户挑一个

输出风格：友善、克制，别堆套话。
\`\`\`

关键字段：

- **name** — 唯一标识，kebab-case
- **description** — Claude 用它判断要不要触发这个 skill。**写清楚** "when to use" 比写功能更重要

## 触发方式

skill 触发是 LLM 自己判断的：

1. 用户消息进来
2. Claude 看 \`.claude/skills/\` 下所有 skill 的 description
3. 选最相关的（可能多个）加载进 context
4. 按 SKILL.md body 干活

你想强制触发？在 user message 里显式说"用 hello-world skill"。

## 用在哪

### Claude Code（本地）

skill 放在项目根 \`.claude/skills/\` 或全局 \`~/.claude/skills/\`。Claude Code 启动时扫描。

### Forge（图形化）

[forge.lurus.cn](https://forge.lurus.cn) 提供 skill 商店 + 一键挂载。你的 skill 上传后可以在多个工作流复用。

### Claude API（程序化）

通过 SDK 把 SKILL.md 内容当 system prompt segment 注入。本质上还是 prompt，只是有 metadata 管理。

## 写好 skill 的三个 tips

### 1. description 是契约

LLM 只看 description 决定调不调。description 必须包含**触发关键词**和**典型场景**。

错：\`description: A skill for frontend\`
对：\`description: 当任务涉及 React / Vue / Tailwind / 组件设计 / 视觉调整时触发，输出代码 + 设计 token 修改建议\`

### 2. body 写"流程"不是"知识库"

skill body 不是百科。给 Claude 一个**清晰的步骤**和**关键的边界条件**就够，知识它自己有。

### 3. 留 escape hatch

每个 skill 末尾加一句"如果用户偏离这个范围，正常对话，不要硬套 skill"。否则 skill 会"接管"对话，体验变僵。

## 下一步

- 看 [Skills 商店](/skills) 看其它人写的 skill 长啥样
- 自己写完试跑：\`claude\` 命令然后说一句触发关键词
- 想分享？提 PR 到 GitHub 或上 Forge
`,
  },
  {
    slug: "hooks-pre-commit",
    category: "Hooks",
    title: "Hooks 实战：每次提交前自动检查",
    desc: "用 pre-commit hook 让 Claude 强制跑 lint / typecheck，告别 CI 红。",
    read: "6 分钟",
    date: "2026-05-25",
    body: `## 为什么需要 hook

Skill 是"Claude 主动选择"，Hook 是"强制流程"。常见用法：

- **pre-commit** — 提交前必跑 lint / build
- **on-edit** — 改完文件自动 reformat
- **on-shell** — 跑 shell 命令前过滤危险动作（\`rm -rf\` 等）

Hook 失败时，Claude 会被告知"这一步失败了"，然后可以决定继续 / 修复 / 报错给用户。

## 配置位置

\`.claude/settings.json\`（项目级，进 git）或 \`~/.claude/settings.json\`（全局，不进 git）。

## 最小可用 pre-commit hook

\`\`\`json
{
  "hooks": {
    "pre-commit": [
      {
        "name": "lint",
        "command": "bun run lint",
        "blocking": true
      },
      {
        "name": "build",
        "command": "bun run build",
        "blocking": true
      }
    ]
  }
}
\`\`\`

字段含义：

- **name** — log 里的标识
- **command** — 跑啥
- **blocking** — \`true\` 表示失败就 abort commit；\`false\` 只警告

## 在 Claude Code 里看效果

\`\`\`
> 帮我把这个 bug 修了然后提交
[Claude 改完代码]
> [hook: lint] 跑 bun run lint... ✓
> [hook: build] 跑 bun run build... ✗ TypeScript 报错: foo.tsx:23 ...
> 我看到 build 失败了，是 foo.tsx 第 23 行的类型错。我先把这个修了再提交。
[Claude 继续修]
\`\`\`

Hook 失败 → Claude 主动接住 → 继续修。不需要你手动干预。

## 进阶：条件 hook

只在改了 \`.ts\`/\`.tsx\` 文件时跑 typecheck：

\`\`\`json
{
  "hooks": {
    "pre-commit": [
      {
        "name": "typecheck",
        "command": "bun run typecheck",
        "blocking": true,
        "when": {
          "files_changed": ["**/*.ts", "**/*.tsx"]
        }
      }
    ]
  }
}
\`\`\`

## 防误删 hook

\`\`\`json
{
  "hooks": {
    "pre-bash": [
      {
        "name": "block-destructive",
        "command": "echo \\"{{command}}\\" | grep -qE 'rm -rf|git push --force|drop database'",
        "blocking": true,
        "on_success": "abort"
      }
    ]
  }
}
\`\`\`

Claude 跑 shell 之前先检查。匹配到危险关键字就 abort。

## 注意事项

1. **blocking hook 让 Claude 慢** — 每次都跑全量 build 可能 10s+。把重的放 \`pre-commit\`，轻的放 \`on-edit\`
2. **不要 \`--no-verify\` 绕过** — 全局 CLAUDE.md 明确禁止。hook 失败要修，不是跳过
3. **hook 输出要简短** — Claude 把它当 context 加载，太长会污染对话

## 一句话总结

**hook 不是 PR review 的替代，是给 Claude 装的"机械护栏"。**
`,
  },
  {
    slug: "mcp-intro",
    category: "MCP",
    title: "MCP 入门：让 Claude 调你的工具",
    desc: "Model Context Protocol 从 0 到 1 — stdio 一个最小 server。",
    read: "10 分钟",
    date: "2026-05-25",
    body: `## 一句话定义

**MCP (Model Context Protocol) = 让 LLM 显式调外部工具的标准协议。**

类比：HTTP 是浏览器和服务器的通信协议；MCP 是 LLM 和工具的通信协议。

## 与 skill / hook 的边界

| 机制 | 谁主动 | 干什么 |
| --- | --- | --- |
| skill | LLM | 加载知识 |
| hook | 系统 | 强制跑命令 |
| **MCP** | **LLM** | **调外部工具拿数据 / 执行操作** |

经典 MCP 用例：

- 让 Claude 查 Postgres
- 让 Claude 列 K8s pod
- 让 Claude 读 Notion / Linear

## 三种 transport

| transport | 协议 | 适合 |
| --- | --- | --- |
| **stdio** | 标准输入输出 | 本地、单进程 |
| **SSE** | HTTP server-sent events | 远程、单向流 |
| **HTTP** | 普通 REST | 远程、轻量 |

入门用 stdio 最简单 — 不要 server / 不要 port。

## 最小 stdio MCP server (TypeScript)

\`\`\`typescript
// hello-mcp.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "hello-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "echo",
      description: "Echo back what user says",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
  ],
}));

server.setRequestHandler("tools/call", async (req) => {
  const { name, arguments: args } = req.params;
  if (name === "echo") {
    return { content: [{ type: "text", text: \`Echo: \${args.text}\` }] };
  }
  throw new Error("Unknown tool");
});

const transport = new StdioServerTransport();
await server.connect(transport);
\`\`\`

跑：

\`\`\`bash
bun add @modelcontextprotocol/sdk
bun run hello-mcp.ts
\`\`\`

## 在 Claude Code 注册

\`.claude/settings.json\`：

\`\`\`json
{
  "mcpServers": {
    "hello": {
      "command": "bun",
      "args": ["run", "./hello-mcp.ts"]
    }
  }
}
\`\`\`

重启 Claude Code。

## 在对话里用

\`\`\`
> 用 hello mcp 让我看看 echo 工具能干啥
[Claude 调 hello.echo("test")]
> 工具返回: "Echo: test"
\`\`\`

Claude 会自己判断什么时候调 tool。你也可以显式指定。

## 进阶方向

1. **加更多 tool** — list_files / read_db / call_api
2. **加资源（resources）** — 让 Claude 读静态文件 / 数据
3. **加 prompt template** — 让 server 提供可调用的 prompt 库

## Lurus 现成的 MCP

- \`zitadel-mcp\` — 让 Claude 管 Zitadel 账号
- \`k8s-mcp\` — 让 Claude 看 K3s pod / log
- \`platform-mcp\` — 让 Claude 查 Lurus Platform 用户 / 计费

详见 [Skills 商店](/skills) 或 [forge.lurus.cn](https://forge.lurus.cn)。

## 一句话总结

**MCP 是"给 LLM 装手"的标准。stdio + 一个 tool 就能起步，进阶再上 SSE / HTTP。**
`,
  },
  {
    slug: "forge-workflow",
    category: "工作流",
    title: "用 Forge 把 Claude 工作流图形化",
    desc: "可视化拖拉，把 prompt 组合成 agent 链 — 不写代码也能搭。",
    read: "15 分钟",
    date: "2026-05-25",
    body: `## Forge 是什么

[forge.lurus.cn](https://forge.lurus.cn) 是 Lurus 出品的 Agent workbench — 用图形化拖拉的方式组合 prompt / tool / 条件分支，搭出一个完整的 AI 工作流。

类比：Forge 之于 Claude，像 n8n 之于 webhook，像 Figma 之于 CSS。

## 适合什么场景

- 重复任务自动化（如周报生成、客服自动回复初稿）
- 多步骤推理（先调研 → 再总结 → 再格式化）
- 多模型混用（前段 Haiku 预筛 → 后段 Opus 深思）
- 不会写代码但想搭 AI 流程

不适合：

- 极致性能场景（图形开销）
- 强自定义 / 高复杂逻辑（直接写代码更快）

## 5 分钟搭一个最小工作流

### 1. 注册

去 [forge.lurus.cn](https://forge.lurus.cn) 用 Lurus 账号登录（共用 SSO）。

### 2. 新建 workflow

点 "New Workflow" → 给个名字（如 "周报生成器"）。

### 3. 拖三个 node

画布上从左到右拖：

\`\`\`
[Input Trigger] → [Claude Node] → [Output Display]
\`\`\`

### 4. 配 Claude Node

双击 Claude node，配置：

- **Model**: Sonnet 4.6（默认）
- **System Prompt**: 把 [周报 prompt](/prompts/weekly-report-builder) 粘进去
- **Input from**: 上游 Input Trigger 的 \`text\` 字段

### 5. 跑

回到画布点 "Run" → 在 Input 输入框粘碎片记录 → 看 Output 出周报。

## 进阶：多步骤 + 分支

### 场景：客户反馈分类 + 高优回复

\`\`\`
[Input: 客户反馈]
   ↓
[Haiku: 分类成 高/中/低]
   ↓
[Branch: 是否 高优?]
   ↓ yes              ↓ no
[Opus: 起草回复]    [Log: 等周末批处理]
   ↓
[Output: 草稿]
\`\`\`

Branch node 用 JS 表达式：\`input.classification === "high"\`

### 场景：调研 → 总结 → 格式化

\`\`\`
[Input: 主题]
   ↓
[Tool: web_search] → 拿 10 条结果
   ↓
[Sonnet: 总结 5 条要点]
   ↓
[Haiku: 格式化成 markdown 表格]
   ↓
[Output]
\`\`\`

Tool node 调 MCP 工具（如 \`web-search-mcp\`）。

## Skills / Prompt 复用

Forge 直接读 Lurus 平台的 [Prompt 库](/prompts) 和 [Skills 商店](/skills)：

- 在 Claude node 点 "Use prompt from library" → 选 prompt
- 在 Claude node 点 "Mount skill" → 挂 skill

改本站 prompt 库，所有 Forge workflow 自动同步。

## 部署

workflow 搭好可以：

1. **手动跑** — 画布上点 Run
2. **API 调用** — Forge 给每个 workflow 生成 \`POST /api/run/<workflow-id>\`，你的程序直接调
3. **定时跑** — 配 cron（每天 9 点跑周报模板）
4. **webhook 触发** — GitHub PR / Linear 工单等事件触发

## 计费

走 Lurus Platform 账单 — 跑一次 workflow，按内部 Claude / Haiku 调用按 token 计费。详见 forge.lurus.cn 价格页。

## 一句话总结

**Forge = 给 Claude 工作流装图形化 IDE。先在本站挑 prompt → 复制到 Forge 节点 → 拖一拖就能跑。**
`,
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}
