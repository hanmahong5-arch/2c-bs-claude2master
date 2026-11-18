import type { Tutorial } from "./tutorials-types";

export const TUTORIALS_PART3: Tutorial[] = [
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

- **Model**: Sonnet 5（默认）
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
