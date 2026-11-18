import type { SeoLanding } from "./seo-landings-types";

export const SEO_LANDINGS_PART4: SeoLanding[] = [
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
