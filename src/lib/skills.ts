export type SkillCategory =
  | "代码"
  | "设计"
  | "写作"
  | "数据"
  | "运维"
  | "生产力";

export const SKILL_CATEGORIES: SkillCategory[] = [
  "代码",
  "设计",
  "写作",
  "数据",
  "运维",
  "生产力",
];

export type SkillSource = "Anthropic" | "Lurus 出品" | "Lurus 编辑部";

export interface Skill {
  slug: string;
  category: SkillCategory;
  title: string;
  desc: string;
  source: SkillSource;
  sourceUrl?: string;
  installCmd?: string;
  triggerHint: string;
  readme?: string;
  tags?: string[];
}

const INSTALL_LURUS = (slug: string) =>
  `# Lurus 出品 — 国内镜像，建议克隆到全局 skill 目录\nmkdir -p ~/.claude/skills/${slug}\n# 内部团队从 Lurus monorepo .claude/skills/${slug}/ 复制\n# 或 ssh root@100.98.57.55 拉一份 tarball`;

const INSTALL_DEMO = (slug: string) =>
  `# Lurus 编辑部 demo skill — 复制下文 SKILL.md 到本地\nmkdir -p ~/.claude/skills/${slug}\n# 把 README 里的 SKILL.md 内容粘贴到:\n#   ~/.claude/skills/${slug}/SKILL.md`;

export const SKILLS: Skill[] = [
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
  {
    slug: "company-status",
    category: "生产力",
    title: "company-status",
    desc: "30 秒看清 Lurus 全公司状态 — 阻塞 / 焦点 / 23 产品颜色板 / 信号灯。",
    source: "Lurus 出品",
    triggerHint: '用户问 "公司现在啥情况" / "哪些项目阻塞" / "今天该看啥" 时触发。',
    installCmd: INSTALL_LURUS("company-status"),
    tags: ["status", "board", "ops"],
    readme: `## 用法

把 \`_BOARD.md\` + \`lurus.yaml\` + \`doc/coord/contracts.md\` + \`MEMORY.md\` 综合成 30 秒口播。

输出：

- 🔴 阻塞（≤ 3 条）
- 🟡 焦点（≤ 5 条）
- 🟢 在跑（一句话产品列表）
- 📅 本周节点（≤ 3 条）`,
  },
  {
    slug: "karpathy-guidelines",
    category: "生产力",
    title: "karpathy-guidelines",
    desc: "Karpathy 四原则 — 编码前思考 / 简单优先 / 外科手术 / 目标驱动。",
    source: "Lurus 出品",
    triggerHint: "复杂任务开始前 / 用户给开放性问题时触发。",
    installCmd: INSTALL_LURUS("karpathy-guidelines"),
    tags: ["principles", "thinking"],
    readme: `## 四则

1. **编码前思考** — 假设说出口，困惑就停，见简单方案要 push back
2. **简单优先** — 只写解决问题所需的最少代码
3. **外科手术式** — 只动必须动的，匹配现有风格；无关 dead code 提出但不删
4. **目标驱动** — 任务先转成可验证目标（失败测试 → 让它 pass）

多步任务先给计划 + 每步验证方法。`,
  },
  {
    slug: "git-graceful",
    category: "代码",
    title: "git-graceful",
    desc: "优雅 git 操作 — rebase / cherry-pick / amend / 冲突解决决策树。",
    source: "Lurus 编辑部",
    triggerHint: "git rebase 卡冲突 / 需要 cherry-pick / 想拆分 commit 时触发。",
    installCmd: INSTALL_DEMO("git-graceful"),
    tags: ["git", "rebase"],
    readme: `## 触发场景

- rebase 中间卡 conflict
- 想把 1 个 commit 拆成 N 个
- cherry-pick 某条到 release 分支
- amend 还没 push 的最新 commit

## 安全护栏

- 永远不会建议 \`--no-verify\` 或 \`--force\` 到 main
- 操作前必备份分支：\`git branch backup-<timestamp>\``,
  },
  {
    slug: "db-migration-safe",
    category: "代码",
    title: "db-migration-safe",
    desc: "DB migration 安全分析 — NOT NULL 加锁影响 / index 在线创建 / backfill 策略。",
    source: "Lurus 编辑部",
    triggerHint: "写 SQL migration / ALTER TABLE / CREATE INDEX 时触发。",
    installCmd: INSTALL_DEMO("db-migration-safe"),
    tags: ["postgres", "migration", "ddl"],
    readme: `## 检查项

1. \`ALTER TABLE\` 是否会拿独占锁？大表上是否需要 \`CONCURRENTLY\`？
2. 加 NOT NULL 列：是否分两步（先 nullable + backfill，再 SET NOT NULL）？
3. 删列前：是否有应用代码还在读？
4. \`CREATE INDEX\` 是否用 \`CONCURRENTLY\` 避免阻塞写？
5. backfill：分批 + idempotent 还是一次性 \`UPDATE\`？

每个 migration 给一份 risk score（绿/黄/红）。`,
  },
  {
    slug: "e2e-test-gen",
    category: "代码",
    title: "e2e-test-gen",
    desc: "从 PRD / 功能描述生成 Playwright E2E 测试 — 覆盖正路 + 3 个边角。",
    source: "Lurus 编辑部",
    triggerHint: "用户说「给这个 feature 写个 e2e」/「Playwright 覆盖一下」时触发。",
    installCmd: INSTALL_DEMO("e2e-test-gen"),
    tags: ["e2e", "playwright", "test"],
    readme: `## 输出结构

每个 feature 一个 spec 文件：

\`\`\`ts
test.describe("登录流程", () => {
  test("正路：valid email + password 登入", async () => {...});
  test("边角 1：空 email 拦截", async () => {...});
  test("边角 2：错密码 3 次锁定", async () => {...});
  test("边角 3：session 过期自动跳 login", async () => {...});
});
\`\`\`

只生成 happy path + 3 个最值得的边角，不写 50 个低价值 case。`,
  },
  {
    slug: "api-contract-keeper",
    category: "代码",
    title: "api-contract-keeper",
    desc: "跨服务 API 契约维护 — proto / OpenAPI / REST diff 自动检查破坏性。",
    source: "Lurus 编辑部",
    triggerHint: "改 *.proto / openapi.yaml / handler/*_handler.go 时触发。",
    installCmd: INSTALL_DEMO("api-contract-keeper"),
    tags: ["contract", "api", "proto"],
    readme: `## 检查

1. 字段删除 / 改名 / 改类型 = 破坏性
2. enum 减值 = 破坏性
3. required → optional = 兼容
4. 加新字段 = 兼容

破坏性改动会要求：

- 列出受影响的下游服务（查 \`doc/coord/contracts.md\`）
- 给出 deprecation 计划（v1 → v2 双跑期）
- 写 changelog 到对应 service-status`,
  },
  {
    slug: "log-archaeologist",
    category: "数据",
    title: "log-archaeologist",
    desc: "大型 log 文件考古 — 时间窗 + 关键字 + 模式聚类找根因。",
    source: "Lurus 编辑部",
    triggerHint: "用户贴一段 log / 说「为什么这报错」时触发。",
    installCmd: INSTALL_DEMO("log-archaeologist"),
    tags: ["log", "debug", "rca"],
    readme: `## 流程

1. **时间窗收敛** — 锁定问题发生的 ±5 分钟
2. **关键字反查** — ERROR / panic / 5xx / timeout
3. **模式聚类** — 相同 trace_id 串成时序
4. **可疑句** — 用一句话总结根因假设
5. **下一步** — 推荐查哪个上游 / 数据库 / 网络层

输出按"现象 → 假设 → 证据 → 下一步"四段。`,
  },
  {
    slug: "perf-profiler",
    category: "数据",
    title: "perf-profiler",
    desc: "性能瓶颈定位 — Chrome DevTools / pprof / flamegraph 解读引导。",
    source: "Lurus 编辑部",
    triggerHint: "用户说「为什么这么慢」/ 给火焰图 / 给 timeline 截图时触发。",
    installCmd: INSTALL_DEMO("perf-profiler"),
    tags: ["perf", "profiling", "flamegraph"],
    readme: `## 支持工具

- Chrome DevTools Performance panel
- Go \`pprof\` (cpu / heap / goroutine / block)
- Rust \`cargo flamegraph\`
- Lighthouse / web vitals

## 输出

1. **Top 3 hot path** 排序
2. 每条路径"为什么慢"假设（CPU / IO / lock / GC / network）
3. 修复建议按 ROI 排（先改 1 行能省 30% 的优先）`,
  },
  {
    slug: "adr-writer",
    category: "写作",
    title: "adr-writer",
    desc: "Architecture Decision Record 模板生成 — 5 段式 + 替代方案矩阵。",
    source: "Lurus 编辑部",
    triggerHint: "用户说「记下这个决策」/「写个 ADR」/ 跨服务设计取舍时触发。",
    installCmd: INSTALL_DEMO("adr-writer"),
    tags: ["adr", "docs", "architecture"],
    readme: `## 模板

\`\`\`markdown
# ADR-NNNN: <title>
Date: YYYY-MM-DD
Status: Proposed / Accepted / Superseded

## Context
为什么要做这个决策？现状/约束/触发事件。

## Decision
我们决定 X。

## Alternatives Considered
| 方案 | Pro | Con | 否决理由 |

## Consequences
正面 / 负面 / 后续要做的事

## References
相关 PR / Issue / 上下游 ADR
\`\`\`

放在 \`doc/decisions/NNNN-<slug>.md\`。`,
  },
  {
    slug: "release-notes",
    category: "写作",
    title: "release-notes",
    desc: "从 git log 生成 changelog — 按 feat/fix/perf/refactor 自动分组。",
    source: "Lurus 编辑部",
    triggerHint: '发版前 / 用户说 "总结一下这版改了什么" / 写 release notes 时触发。',
    installCmd: INSTALL_DEMO("release-notes"),
    tags: ["changelog", "git", "release"],
    readme: `## 用法

\`\`\`bash
git log v1.2.0..HEAD --oneline | claude --skill release-notes
\`\`\`

或在 Claude Code 里直接说"基于上次 tag 到现在的 commits 写一份 changelog"。

## 输出

按 conventional commits 分组：

- ✨ Features (feat:)
- 🐛 Bug Fixes (fix:)
- ⚡ Performance (perf:)
- 🛠 Refactor (refactor:)
- 📝 Docs (docs:)

每条 ≤ 1 行，去掉技术黑话，面向终端用户改写。`,
  },
];

export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find((s) => s.slug === slug);
}
