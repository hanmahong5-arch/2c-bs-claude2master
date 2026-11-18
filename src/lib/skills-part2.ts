import { INSTALL_DEMO, INSTALL_LURUS, type Skill } from "./skills-types";

export const SKILLS_PART2: Skill[] = [
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
