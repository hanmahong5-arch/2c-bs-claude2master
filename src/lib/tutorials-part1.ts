import type { Tutorial } from "./tutorials-types";

export const TUTORIALS_PART1: Tutorial[] = [
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
];
