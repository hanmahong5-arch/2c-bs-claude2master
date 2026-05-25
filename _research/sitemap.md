# claude2master.com — Sitemap & IA

> 完整路由表，按 P0/P1/P2 标注 MVP 优先级。P0 必须 ship 才算 MVP 上线；P1 Sprint 2；P2 看数据再排。
> 整体技术栈对齐 dsnb.help：Next.js 16 (App Router, `output: standalone`) + Bun + Tailwind 4 + framer-motion，Vercel 部署（避开 .com TLD 在 CN IDC 的 ICP 拦截，详 `cn-idc-icp` skill）。
> 鉴权：复用 platform Zitadel SDK（identity_integration tier 0），未登录区域全开放降摩擦。

---

## 全局组件 / 信息架构

**Header**: Logo + 主导航（Prompts / Chat / Tutorials / Skills / API）+ "登录" + 语言切换占位（v1 只中文）
**Footer**: 产品矩阵（dsnb.help / lurus.cn / forge.lurus.cn 互链）+ 公司信息 + 备案号 + ICP 链接
**全站埋点**: Umami self-host（复用 newhub 同款），关键事件：`page_view / chat_send / copy_prompt / cta_apply_api / cta_install_skill / signup_complete`
**SEO**: 每页 `<title>` 含 "Claude 中文 / Claude 中国"，`sitemap.ts` + `robots.txt` + JSON-LD（Article / Product / FAQ schema）

---

## 路由表

### `/` — Landing（P0）

- **目的**：30 秒说清"是什么 + 凭什么 + 怎么开始"，把 3 个角色画像分别送到对应入口。
- **关键组件**：
  - `<Hero>`：one-liner "中国大陆用 Claude，从入门到精通" + 副标 "不翻墙、3 分钟跑通" + 双 CTA（"试试 Chat" / "拿 API key"）
  - `<PersonaCards x3>`：学生 / 开发者 / 创作者三张卡，各自对应路径
  - `<LivePromptStrip>`：3 条最热 prompt 横向滚动，点击直接复制到剪贴板（埋点 `copy_prompt`）
  - `<TrustRow>`：Lurus 产品矩阵 logo 墙（newapi / forge / lutu / Platform），写 "由 Lurus 自营基础设施提供"
  - `<FAQ>`：5 问（要翻墙吗 / 怎么付费 / 跟官方比 / 数据安全 / 跟 GPT 区别）
- **CTA 优先级**：① "试试 Chat" → /chat ② "拿 API key" → /api ③ "看 Claude Code 教程" → /tutorials
- **引流目标**：分流到 /chat、/api、/tutorials，funnel 第 0 段
- **优先级**：**P0**

### `/prompts` — Prompt 库列表（P0）

- **目的**：SEO 主战场 + 创作者画像主入口；"复制即走"零摩擦。
- **关键组件**：
  - 顶部分类 chips（写作 / 编程 / 翻译 / 学习 / 营销 / 数据分析 / 角色扮演 / 摘要）
  - 卡片网格（标题 + 一句话用途 + 复制按钮 + "在 Chat 里跑" 按钮 + tag）
  - 搜索框（v1 客户端 fuse.js，>500 条再上 Meilisearch）
  - 排序（最新 / 最热 / 编辑精选）
- **CTA**：复制 prompt / 跳 /chat 预填
- **引流目标**：/chat（带预填 prompt query string）→ funnel
- **数据源**：`src/content/prompts/*.mdx` frontmatter（标题/分类/适用模型/作者/更新时间）+ Git 版本控制；初版 50 条手写种子
- **优先级**：**P0**

### `/prompts/[slug]` — 单个 prompt 详情（P0）

- **目的**：SEO 长尾着陆页 + 深度展示（背景/使用场景/变体/案例输出）。
- **关键组件**：Markdown 主体 + 代码块 + 复制按钮 + "在 Chat 里跑" + 相关 prompt 推荐（3 条）+ 评论关闭（v1 不做 UGC）
- **CTA**：复制 + 跳 /chat
- **优先级**：**P0**

### `/chat` — 在线 Chat（P0）

- **目的**：免登录试用 → funnel 的核心转化漏斗（"4 条强制注册"）。
- **关键组件**：
  - 简化版 chat UI（消息列表 + 输入框 + 模型 selector：claude-haiku-4-5/claude-sonnet-4-5）
  - 试用计数器（"剩 X 条免费"，IP+UA fingerprint 限流，绕过攻击留待 v2）
  - 第 4 条触发 `<SignupModal>`：登录后赠 N 千 tokens
  - 历史会话（仅登录后，localStorage 不存敏感数据）
- **CTA**：注册解锁 / 拿 API key 自己接
- **引流目标**：注册 → newapi 个人 token；高阶用户跳 /api
- **后端**：直接调 `https://newapi.lurus.cn/v1/chat/completions`，前端用公共 trial token（独立 channel + 严格 quota / 限流）；登录后切到用户自己的 token
- **优先级**：**P0**

### `/tutorials` — Claude Code 教程列表（P0）

- **目的**：开发者画像主入口，SEO 高价值（"Claude Code 教程"中文流量缺口大）。
- **关键组件**：分类（入门 / 配置 / Skills / Hooks / MCP / 工作流 / 进阶）+ 卡片列表 + 阅读时长 + 更新日期
- **CTA**：进入文章 / 拿 API key
- **优先级**：**P0**

### `/tutorials/[slug]` — MDX 文章（P0）

- **目的**：单篇深度文，目标停留 ≥ 3 分钟。
- **关键组件**：
  - MDX 渲染（代码高亮 shiki + 复制按钮 + 可折叠 callout）
  - "复制此配置"组件（自动填入 `ANTHROPIC_BASE_URL=https://newapi.lurus.cn`，登录用户自动注入自己的 token）
  - 目录侧栏 + 阅读进度条
  - 文末 CTA：申请 API key / 看下一篇
- **关键文章（MVP 6 篇）**：
  1. Claude Code 国内零障碍接入（核心引流篇）
  2. Claude Sonnet 4.5 vs Opus 4.7：选型与价格
  3. Skills 是什么、怎么写、怎么用
  4. Hooks 实战：每次提交前自动检查
  5. MCP 入门：让 Claude 调你的工具
  6. 用 Forge 把 Claude 工作流图形化
- **CTA**：复制配置 / 申请 API key / 试 Skills
- **引流目标**：newapi（API key 配置篇）/ forge（Forge 篇）/ /skills（Skills 篇）
- **数据源**：`src/content/tutorials/*.mdx`
- **优先级**：**P0**

### `/skills` — Skills 商店列表（P0）

- **目的**：创作者画像 + 开发者画像交叉入口；独家差异化（国内基本无 Claude Code Skills 中文商店）。
- **关键组件**：
  - 分类（写作 / 代码 / 数据 / 设计 / 运维）+ 卡片（名字 + 一句话 + 安装方式 chip：`/skill install`）+ 来源标识（官方 / Lurus 出品 / 社区）
  - 搜索 + 标签筛选
  - 排序（精选 / 最新 / 最多下载——下载数 v1 客户端假数据 / v2 上 Plausible 真实计数）
- **CTA**：查看详情 / 一键安装命令复制
- **引流目标**：Forge（"在 Forge 里跑这个 skill 不装本地"——v2）
- **数据源**：`src/content/skills/*.mdx` frontmatter（含 git repo URL / install command / 适配模型 / 许可证）
- **优先级**：**P0**

### `/skills/[slug]` — Skill 详情（P0）

- **目的**：单个 skill 落地页，含安装指引 + demo 输出 + 源码链接。
- **关键组件**：
  - skill metadata（作者 / 许可 / 适配模型 / 依赖 / 安装命令）
  - README 渲染 + 复制安装命令按钮
  - "用过 Forge 跑过这个" 按钮（v2）
- **CTA**：复制安装 / 跳 Forge / 看相关 skill
- **优先级**：**P0**

### `/api` — 申请 Claude API key（P0）

- **目的**：开发者画像最强转化点，对接 newapi token 签发。
- **关键组件**：
  - Hero："3 步拿到 Claude API key" + 流程图（注册 → 充值 → 创建 token）
  - "立即注册"大按钮 → Zitadel OIDC（newapi 已 shipped）
  - 文档侧栏：endpoint 列表（`/v1/chat/completions` OpenAI-compat / `/v1/messages` Anthropic 原生 / `/v1/embeddings` / `/v1/images/generations`）+ 计费说明（人民币结算，按 newapi 渠道计价）
  - 团队版引导：底部一句话 "团队 / 多租户？→ hub.lurus.cn（newhub 多租户 API）"
- **CTA**：① 注册（个人 → newapi）② 联系销售（团队 → newhub）
- **引流目标**：newapi.lurus.cn 主，hub.lurus.cn 次
- **优先级**：**P0**

### `/about` — 关于 + 产品矩阵（P0）

- **目的**：信任锚 + Lurus 产品矩阵交叉曝光。
- **关键组件**：公司简介一段 + 产品矩阵卡片网格（Platform / newapi / Forge / Lutu / Switch / DSNB）+ 联系方式
- **CTA**：跳各产品官网
- **优先级**：**P0**（信任必备）

### `/pricing` — 定价（P1）

- **目的**：明示成本，去除"价格不透明 → 跳走"。
- **关键组件**：
  - 三档对比表（免费试用 / 个人按量 / 团队订阅）
  - 按量价格表（claude-haiku-4-5 / sonnet-4-5 / opus-4-7 三模型 input/output 单价，人民币）
  - "充值入口"按钮 → Platform billing checkout
- **CTA**：充值 / 升级团队
- **引流目标**：Platform billing（走 `/internal/v1/subscriptions/checkout`，对齐 cross_group_policy 硬规则）
- **优先级**：**P1**（MVP 期先用 newapi 自带定价页过渡，后续做专属 SEO 页）

### `/dashboard` — 已登录用户控制台（P1）

- **目的**：让用户看用量、改 token、管钱包；降低用户跳到 newapi 控制台的拼接感。
- **关键组件**：
  - 用量卡片（今日 / 本月 tokens & 费用）
  - 最近 10 次 API 调用日志
  - Token 管理（创建 / 撤销，调 newapi `/api/token/*`）
  - 钱包余额 + 充值入口（调 Platform `/api/v1/wallet/*`）
- **CTA**：充值 / 查看完整账单（→ identity.lurus.cn）
- **后端**：聚合 newapi `/api/log` + Platform `/api/v1/account/overview`
- **优先级**：**P1**

### `/docs` — 文档（P1）

- **目的**：API 详细接入文档 + Claude Code 进阶 + 教程目录的"严肃版"。
- **关键组件**：
  - 三大块（API Reference / Claude Code 手册 / Skills 开发指南）
  - 侧栏导航 + 搜索（Pagefind 静态搜索）
- **CTA**：申请 key / 看教程
- **引流目标**：newapi / forge
- **优先级**：**P1**（先把 /tutorials 跑起来，/docs 是更结构化的后续版本）

### `/changelog` — 更新日志（P2）

- **目的**：信任信号 + 复访驱动（"持续在维护"）。
- **关键组件**：按月分组的更新条目（新 prompt / 新教程 / 新 skill / bug 修复）+ RSS
- **CTA**：订阅邮件 / RSS
- **优先级**：**P2**

### `/blog` — 长文 / 行业观察（P2）

- **目的**：SEO 长尾 + 思想领导力。
- **关键组件**：MDX 长文 + 作者卡 + 评论关闭
- **CTA**：相关教程 / 申请 key
- **优先级**：**P2**（content marketing，看运营资源排期）

### `/login` `/signup` `/auth/callback` — 鉴权（P0）

- **目的**：复用 Zitadel SDK（platform identity_integration tier 0 接入剧本：一行 `<script src=".../sdk/lurus-auth.js">`）。
- **关键组件**：登录页跳 Zitadel（手机号 / 微信 / 邮箱）+ 回调页处理 token
- **后端**：复用 `auth.lurus.cn`，OIDC discovery `https://auth.lurus.cn/.well-known/openid-configuration`
- **优先级**：**P0**

### `/legal/{privacy,terms,beian}` — 合规页（P0）

- **目的**：合规必备 + Vercel 部署需要清晰 contact + 隐私政策对齐 PIPL。
- **关键组件**：隐私政策（PIPL 适配）+ 服务条款 + 备案信息
- **优先级**：**P0**（上线门槛）

---

## MVP P0 路由清单（Sprint 0 必交付）

```
/                              Landing
/prompts                       Prompt 库列表
/prompts/[slug]                Prompt 详情
/chat                          在线 Chat（免登录 3 条 + 注册解锁）
/tutorials                     教程列表
/tutorials/[slug]              教程文章（MVP 6 篇）
/skills                        Skills 商店
/skills/[slug]                 Skill 详情
/api                           API key 申请
/about                         关于 + 产品矩阵
/login /signup /auth/callback  Zitadel OIDC
/legal/{privacy,terms,beian}   合规
```

共 **12 条核心路由 + 3 条 dynamic**，Sprint 0 周期建议 2 周（前端 + 内容种子）。

## Sprint 2 P1（数据后排序）

- `/pricing`（定价）
- `/dashboard`（用量控制台）
- `/docs`（结构化文档）

## P2 后续

- `/changelog`、`/blog`

---

## 数据存储 / 后端依赖

- **静态内容（prompts / tutorials / skills）**：MDX 文件 + Git 版本控制，build time 生成静态页（SSG），无后端
- **Chat 试用**：前端直接调 newapi 公共 trial token，IP 限流走 Vercel Edge Middleware
- **鉴权 + 用户**：复用 platform Zitadel OIDC（identity_integration tier 0，等 SDK 发布；MVP 期可用 newapi 自家 OAuth 临时凑）
- **用量 / 钱包（dashboard P1）**：调 platform `/api/v1/account/overview` + newapi `/api/log` 聚合
- **支付（pricing P1）**：走 platform billing capability `/internal/v1/subscriptions/checkout`，**禁止**自建支付（cross_group_policy 硬规则）

---

## 部署 / 运维

- **Vercel** 自动 deploy（push to main），对齐 dsnb.help 经验
- **DNS**：阿里云 `@` + `www` → `76.76.21.21`（Vercel anycast），TLS 自动 LE
- **CN 备案**：`.com` 不走 CN IDC，避开 ICP 拦截，但需在 /legal/beian 标注公司主体
- **CI**：复用根 `.github/workflows/reusable-frontend.yaml`（Bun + Next.js）
- **监控**：Umami self-host + Vercel Web Analytics

---

## 不在 sitemap

- 不做用户社区 / 论坛 / UGC（v1 内容全编辑部出，避免审核负担）
- 不做积分 / 邀请码体系（v1 转化全靠 funnel 自然走）
- 不做多语言版本（v1 只中文；英文站留给 lurus.com）
- 不做单独的 mobile 站（PWA 响应式覆盖；APP 用户引到 lutu）

---
_v0 draft 2026-05-25 — 与 `_research/positioning.md` 配套；变化先改 sitemap.md 再改实现_
