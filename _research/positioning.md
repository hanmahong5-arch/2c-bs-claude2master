# claude2master.com — Positioning

> Lurus Web 产品组新成员，**中国大陆 Claude 用户的中文工具站**。
> 角色：流量入口 → 引流到 Lurus 已有产品（newapi / newhub / forge / lutu）变现。
> 命名约定：`2c-bs-claude2master`（消费者 / 浏览器站点 / 名字）。
> 与同组 `dsnb.help` 关系：dsnb 推 Switch（桌面网关），claude2master 推 API + Forge（Web 工作流），覆盖互补人群。

---

## 1. One-liner（≤30 字，3 候选）

| # | 候选 | 主张 | 备注 |
|---|------|------|------|
| A | **中国大陆用 Claude，从入门到精通** | 学+用一站式 | 直白、SEO 友好、对齐域名"to Master" |
| B | **Claude 中文工具站：提示词、API、Code 教程** | 工具属性 | 信息密度高，CTR 友好但味道平 |
| C | **不翻墙，3 分钟跑通 Claude——从 Prompt 到 Code** | 痛点+承诺 | 转化导向，但要兑现 3 分钟承诺 |

**首选 A**，sub-title 用 C 的"不翻墙、3 分钟跑通"做 hero 第二行。B 留作 SEO meta description。

---

## 2. Value Prop（三句话）

- **What**：claude2master.com 是中国大陆用户使用 Claude 的中文工具入口——提示词库 + 在线 Chat + API 申请 + Claude Code 教程 + Skills 商店。
- **Why us**：Lurus 自营 LLM 网关（newapi.lurus.cn，已 prod，30+ 模型），所有功能基于自家算力链路；不是搬运站，是产品入口；中文母语团队迭代教程。
- **How to start**：首页 → 选你的角色（学生 / 开发者 / 创作者）→ 3 步路径（看 demo → 复制 prompt → 拿 API key），全程无需翻墙、无需信用卡。

---

## 3. 用户画像（3 个）

### P1 学生 / 技术爱好者（**"想学 Claude"**）
- **痛点**：官方文档英文 + 要梯子；微信公众号教程零碎、过时；不知道 Claude 跟 GPT 差在哪。
- **想要**：中文系统教程、能直接抄的 prompt、不花钱先试试。
- **我们给**：`/tutorials` Claude Code 中文系列 + `/prompts` 按场景分类 + `/chat` 免登录 3 条免费试用。
- **引流到**：注册 → newapi 个人 token（首月赠送少量额度）→ 沉淀成 Platform 账户。

### P2 开发者（**"想用 Claude API / Claude Code"**）
- **痛点**：Anthropic 官方不卖中国手机/银行卡；closeai 类中转站跑路风险、计费不透明；接 SDK 走代理网络飘忽。
- **想要**：稳定 API key、OpenAI/Anthropic 双协议兼容、用量看板、支持 Claude Code CLI。
- **我们给**：`/api` 申请页直连 newapi（无需翻墙、支付宝/微信充值、`https://newapi.lurus.cn/v1` OpenAI-compatible + `/v1/messages` Anthropic 原生）+ `/tutorials/claude-code-setup` 配置 `ANTHROPIC_BASE_URL` 一键复制。
- **引流到**：newapi.lurus.cn（个人）或 hub.lurus.cn（团队/多租户，由 newhub 提供 V2 多租户 API）。

### P3 内容 / 产品创作者（**"想用 Claude 做工作"**）
- **痛点**：会用 ChatGPT 但 Claude 没摸过；不会编程但想搭工作流（写稿/翻译/会议纪要/竞品分析）；prompt 工程概念听过没动手。
- **想要**：现成 prompt 模板、可视化拖拉的 workflow、不需要写代码。
- **我们给**：`/prompts` 创作者分类 + `/skills` Claude Code Skills 安装指引（即买即用） + 引导到 `forge.lurus.cn` 的 visual workflow canvas（Kova 执行引擎兜底）。
- **引流到**：Forge（agent workbench）作为主转化目标——Forge 自己缺 C 端入口，claude2master 正好补位。

---

## 4. 用户旅程（funnel）

```
[搜索]                  Google/百度："Claude 中文 / Claude API 国内 / Claude Code 教程"
   ↓
[Landing /]            Hero (one-liner + "不翻墙 3 分钟跑通") + 3 个角色入口卡 + 信任证明
   ↓
[探索 — 无门槛区]      /prompts 复制即用  |  /chat 免登录 3 条试用  |  /tutorials 列表浏览
   ↓
[转化点]               /chat 第 4 条触发 "注册解锁" | /api 申请 key | /skills 装 skill
   ↓
[注册]                 复用 platform Zitadel OIDC（手机号/微信/邮箱），自动开 newapi token
   ↓
[变现]                 个人：newapi 充值（支付宝/微信，Platform billing）
                       团队：升级到 hub.lurus.cn 多租户
                       高阶：引流到 forge.lurus.cn 做 visual workflow
   ↓
[复访留存]             教程更新邮件订阅 + /dashboard 用量看板 + 月度新 prompt/skill 推送
```

关键 funnel 指标（MVP 起 30 天 target）：访客→注册 ≥3%，注册→充值 ≥10%，复访 7 日 ≥20%。

---

## 5. 竞争定位

| 维度 | Anthropic 官方 | closeai 类中转站 | 国内教程博客 | **claude2master.com** |
|------|----------------|------------------|--------------|------------------------|
| 中文体验 | 无 | 半中文 | 全中文 | **全中文，原生设计** |
| 国内可达性 | 需翻墙 | 可达但跑路风险 | 可达 | **可达 + 自营算力（Lurus prod 基础设施）** |
| 付费方式 | 美卡 | 微信/USDT，灰 | 不收 | **支付宝/微信，金融级精度（Platform billing）** |
| 计费透明 | 透明 | 黑盒 | — | **用量看板 + 账单（newapi 原生 + Platform 钱包）** |
| 教程系统性 | 散英文 | 无 | 零碎 | **结构化 Claude Code 中文教程 + Skills 商店** |
| Workflow 能力 | 无 UI | 无 | 无 | **Forge visual canvas（独家差异化）** |
| 信任锚 | 官方 | 弱 | 个人 | **公司主体 + 已有 prod 服务矩阵（identity/newapi/forge）** |

**我们的位置**：站在"官方"和"灰色中转站"之间的合规白盒位——合规自营、中文一等公民、把 Lurus 全家桶能力打包给个人开发者。

不做的事：不做 Claude wrapper 套壳产品（chat UI 已够多），不做模型自研，不做翻墙工具。

---

## 6. Lurus 产品引流路径表

| 来源页面 | 引流目标 | 触达方式 | 为什么是它 |
|----------|----------|----------|------------|
| `/chat` 第 4 条触发 | **newapi.lurus.cn** 注册 | 注册即开 token + 赠额 | 最直接转化点，免登录试用降门槛后强制 funnel |
| `/api` 申请 key | **newapi.lurus.cn**（个人）/ **hub.lurus.cn**（团队） | 直接跳转 + SSO（Zitadel） | newapi 是 prod 稳定基座，hub（newhub） 提供多租户 API 给团队 |
| `/tutorials/claude-code-setup` | **newapi.lurus.cn** | 复制 `ANTHROPIC_BASE_URL=https://newapi.lurus.cn` + token | Claude Code 用户即时变现，对应 `/v1/messages` Anthropic 原生格式 |
| `/skills` 商店 | **forge.lurus.cn** | "在 Forge 里试这个 skill" CTA | Forge 缺 C 端入口；skill 概念天然桥接到 Forge workflow canvas |
| `/about` 产品矩阵 | **lutu**（移动 APP） / **www.lurus.cn**（公司主站） | 二级链接 | 提升品牌可信度；lutu 当前 internal-tool 阶段，做品牌曝光不强推 |
| `/dashboard` 用量 | **identity.lurus.cn** | 钱包/订阅深链 | 复用 Platform `/api/v1` 的钱包/订阅 UI，零开发成本 |
| `/pricing`（若上） | **Platform billing** checkout | `/internal/v1/subscriptions/checkout` | 走 capability，符合公司"所有付费走 Platform billing"硬规则（lurus.yaml cross_group_policy） |

**不引流**的 Lurus 产品：lucrum（量化交易，受众无关）、tally（进销存 B 端，无关）、switch/creator（桌面端，dsnb.help 已负责）、kova/lumen（开发者更底层工具，受众太窄）、webgame（娱乐，无关）。

---

## 7. 不做 / 边界

- 不做模型 wrapper UI（市面已饱和），`/chat` 只是 funnel 工具不是产品
- 不做 Claude 之外的模型（保持品牌纯粹度；newapi 多模型由 newapi 自家控制台呈现）
- 不做企业销售页（B 端走 hub.lurus.cn 自己的官网，跨 group 不越权）
- 不做 GPL 协议引用的 prompt/skill（合规护栏；shadcn/ui MIT、Apache-2.0 可用）

---
_v0 draft 2026-05-25 — 后续 sitemap 详细 IA 见 `_research/sitemap.md`_
