import type { SeoLanding } from "./seo-landings-types";

export const SEO_LANDINGS_PART1: SeoLanding[] = [
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
];
