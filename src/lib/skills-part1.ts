import { INSTALL_LURUS, type Skill } from "./skills-types";

export const SKILLS_PART1: Skill[] = [
  {
    slug: "code-review",
    category: "代码",
    title: "code-review",
    desc: "Review 当前 diff 找正确性 / 安全 / 性能 / 风格问题，低中高三档 effort。",
    source: "Anthropic",
    triggerHint: "用户说「review 一下」「看看我刚改的」「找找 bug」时自动触发。",
    installCmd: `# Anthropic 官方内置 skill\n# Claude Code 1.x 自带，不需要安装\nclaude  # 然后说 "review 一下我的改动"`,
    tags: ["code-review", "diff", "bug-hunt"],
    readme: `## 用法

Anthropic 官方内置 skill。Claude Code 看到你说"review 这段 / 看下我刚改的 / 找一下 bug"时自动触发。

## 三档 effort

- **低**（默认）— 只看新增 / 修改的行，1 分钟出结论
- **中** — 看 diff + 周边 50 行 context
- **高** — 看完整文件 + 依赖关系，最慢但最稳

显式调档：\`review 一下这段，high effort\``,
  },
  {
    slug: "verify",
    category: "代码",
    title: "verify",
    desc: "跑应用 + 观察行为，验证代码改动是否真起作用 — 不只看 typecheck。",
    source: "Anthropic",
    triggerHint: "代码改完准备 ship 前 / 用户说「验证一下」「真的能跑吗」时触发。",
    installCmd: `# Anthropic 官方内置 skill\nclaude  # 然后说 "verify 我的改动"`,
    tags: ["verify", "test", "ship-readiness"],
    readme: `## 用法

跑你的应用（dev server / 测试套件 / CLI）然后观察输出。不是只看编译通过，而是看**功能真起作用**。

## 典型流程

1. 启动 dev server
2. 模拟用户操作（如改的 UI，点一下）
3. 看 console / network / 终端输出
4. 对照预期，给出 pass / fail + 具体证据

## 注意

verify ≠ typecheck ≠ build。三者都过仍可能功能错。`,
  },
  {
    slug: "frontend-design",
    category: "设计",
    title: "frontend-design",
    desc: "前端视觉升级 — 调研标杆 + 高品质图标 / 动效 / 排版 / 设计系统。",
    source: "Anthropic",
    triggerHint: "任务涉及 React / Vue / Tailwind / 组件设计 / 视觉调整时触发。",
    installCmd: `# Anthropic 官方 skill\n# 1.x 版本默认随 Claude Code 安装`,
    tags: ["frontend", "design-system", "css"],
    readme: `## 用法

涉及视觉的任务自动加载。会主动建议：

- 设计 token 改动（颜色 / 字号 / 间距）
- 组件结构调整
- 排版细节（行高、字重、缩进）
- 动效曲线和时长

## 配套

挂载 frontend-design 后，Claude 会更倾向于：
- 用 design token 而不是裸 hex
- 命名 BEM 风格
- 关注 a11y（focus ring / aria）`,
  },
  {
    slug: "claude-code-guide",
    category: "生产力",
    title: "claude-code-guide",
    desc: "Claude Code 文档问答助手 — hooks / skills / MCP / settings.json 直接问。",
    source: "Anthropic",
    triggerHint: '用户问 "Claude Code 怎么...?" / "settings.json 怎么写?" 时触发。',
    installCmd: `# Anthropic 内置\n# 默认随 Claude Code 1.x 提供`,
    tags: ["claude-code", "docs", "qa"],
    readme: `## 用法

把 Claude Code 自己的文档当上下文。问任何关于：

- hooks 配置
- skill 编写
- MCP server 集成
- settings.json 字段
- 快捷键 / CLI 参数

它会先查官方文档，不靠记忆瞎说。

## 触发例

- "怎么让 hook 只在 .ts 改动时跑？"
- "MCP server 的 stdio transport 怎么调试？"`,
  },
  {
    slug: "security-auditor",
    category: "运维",
    title: "security-auditor",
    desc: "Auth / payment / PIPL / RLS / INTERNAL_API_KEY / NetworkPolicy drift 检查。",
    source: "Lurus 出品",
    triggerHint: "改动 auth / payment / PII / migration / RLS 路径时自动触发。",
    installCmd: INSTALL_LURUS("security-auditor"),
    tags: ["security", "audit", "pipl"],
    readme: `## 用法

Lurus 自写，覆盖 6 个安全维度的 drift 检查：

1. **Zitadel** 配置漂移（OIDC client / scope / IdP）
2. **payment** 流水审计（idempotency-key / 金额校验 / 防重复扣款）
3. **PIPL** 合规（手机号脱敏 / 跨境传输标识）
4. **RLS** Postgres Row Level Security 检查
5. **INTERNAL_API_KEY** secret 散布检查
6. **NetworkPolicy** 跨 ns 调用合规

## 触发

改 \`adapter/handler/auth_*.go\` / \`payment_*.go\` / 任何 \`migrations/*.sql\` 时主动响应。`,
  },
  {
    slug: "infra-ops",
    category: "运维",
    title: "infra-ops",
    desc: "K8s + R6 磁盘 + Tailscale + ArgoCD 部署排查 — Lurus 基础设施手册。",
    source: "Lurus 出品",
    triggerHint: "部署、Pod 异常、磁盘告警、SSH/Tailscale 问题时触发。",
    installCmd: INSTALL_LURUS("infra-ops"),
    tags: ["k8s", "argocd", "tailscale"],
    readme: `## 用法

Lurus 基础设施操作手册的 skill 版。覆盖：

- R6 磁盘策略（\`/data\` 295G SSD 只写区，根盘 30G 留系统）
- Tailscale 寻址（R1 \`100.98.57.55\` / R6 \`100.122.83.20\`）
- ArgoCD sync 模式 + ignoreDifferences 解读
- 镜像 tag 校验（\`main-<sha7>\` 规范）
- env vars patch 三铁律（只增不删 / 不 kubectl patch 永久改 / 不删 git 源）`,
  },
  {
    slug: "aliyun-dns",
    category: "运维",
    title: "aliyun-dns",
    desc: "通过 master 节点 alidns CLI 改阿里云 DNS — credentials 不出 git。",
    source: "Lurus 出品",
    triggerHint: "新增 / 修改 *.lurus.cn 域名时触发。",
    installCmd: INSTALL_LURUS("aliyun-dns"),
    tags: ["dns", "aliyun", "ops"],
    readme: `## 用法

阿里云 AccessKey 只存在 master 节点 \`~/.aliyun/config.json profile=dns\`，永远不进 git / Vercel / ConfigMap。

## 标准操作

\`\`\`bash
ssh root@100.98.57.55 "aliyun alidns DescribeDomainRecords --DomainName lurus.cn --profile dns"
ssh root@100.98.57.55 "aliyun alidns AddDomainRecord --DomainName lurus.cn --RR 'sub' --Type A --Value '76.76.21.21' --profile dns"
\`\`\`

详见对应 Lurus skill 全文。`,
  },
  {
    slug: "vercel-deploy",
    category: "运维",
    title: "vercel-deploy",
    desc: "Vercel 部署排查 — domain assign / DNS / build log / env vars。",
    source: "Lurus 出品",
    triggerHint: "Vercel 部署失败 / 域名未生效 / preview vs prod 差异时触发。",
    installCmd: INSTALL_LURUS("vercel-deploy"),
    tags: ["vercel", "deploy", "dns"],
    readme: `## 用法

涵盖：

- \`bunx vercel ls --prod\` 看最新 prod deployment
- 手动触发 \`bunx vercel --prod --yes\`
- 域名绑定 \`bunx vercel domains add <domain>\`
- env vars \`bunx vercel env add <NAME> production\`
- 国内 DNS 验证（推荐用 114.114.114.114 验证 anycast）`,
  },
  {
    slug: "cn-idc-icp",
    category: "运维",
    title: "cn-idc-icp",
    desc: "为什么 .com 不能上 CN IDC — ICP 备案陷阱 + 反向决策树。",
    source: "Lurus 出品",
    triggerHint: "新域名要决定落 CN IDC 还是境外 / 触发「ICP」关键字时。",
    installCmd: INSTALL_LURUS("cn-idc-icp"),
    tags: ["icp", "compliance", "domain"],
    readme: `## 用法

经验值：

- \`.com\` / \`.io\` / \`.app\` 类域名上 CN IDC 会被拦截（无 ICP 备案）
- \`.cn\` 域名必须备案，否则 GFW 直接 reset
- 解法：\`.com\` 走 Vercel / Cloudflare anycast（76.76.21.21 / 1.0.0.1）；\`.cn\` 走 R4 阿里云专属 IP
- 决策树详见 skill body`,
  },
  {
    slug: "lurus-routing",
    category: "运维",
    title: "lurus-routing",
    desc: "newapi / newhub / Portkey / Anthropic 直连四档路由全景图。",
    source: "Lurus 出品",
    triggerHint: "决定 chat 走哪个上游 / API key 类型分配 / 计费归口时。",
    installCmd: INSTALL_LURUS("lurus-routing"),
    tags: ["llm-gateway", "routing", "newapi"],
    readme: `## 用法

四档路由：

1. **newapi.lurus.cn** — prod 稳定，匿名 trial + 个人 key
2. **hub.lurus.cn (newhub)** — 多租户 Hub，Switch v3 三模式后端
3. **Portkey** — 外部 SaaS，备用 fallback
4. **api.anthropic.com 直连** — 仅美国账号 + 调试场景

每档对应的 env vars / token 命名 / 计费归口 / 故障 fallback 顺序，详见 skill。`,
  },
];
