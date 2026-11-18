import type { Tutorial } from "./tutorials-types";

export const TUTORIALS_PART2: Tutorial[] = [
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
];
