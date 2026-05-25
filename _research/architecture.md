# claude2master.com 技术架构

## TL;DR

Next.js 16 + App Router + Bun + Tailwind 4 + Framer Motion 12 + shadcn/ui，沿用 dsnb/www-next 同栈零学习成本。**认证 + 数据库走 Lurus Platform**（Zitadel OIDC + `/api/v1/wallet/redeem` 发激活码），Chat 后端 Server Action stream → newhub V2 多租户 endpoint。Vercel 部署，阿里云 DNS A 记录 → 76.76.21.21。无独立 DB。

---

## 决策 1: 框架与运行时

- **推荐**: Next.js **16.2.3** + App Router + React **19.2.4** + Bun（本地 / CI）+ Vercel runtime（生产）
- **理由**:
  - dsnb (`2c-bs-dsnb`) 和 www-next (`2c-bs-www-next`) 都已锁定 `next@16.2.3 + react@19.2.4 + bun + tailwind@4`，本项目跟齐 = 零调研成本 + 可直接 fork 配置（`next.config.ts`、`eslint.config.mjs`、`tsconfig.json`、`postcss.config.mjs`）
  - App Router：Server Components 默认 + Server Actions 是 chat stream / 内部 API proxy 的最干净写法；Pages Router 已属遗留
  - Bun：Lurus 全局规约（根 CLAUDE.md 明文禁用 npm/yarn/npx/node）
  - React 19：dsnb/www-next 已实战 1 个月稳定，next 16 + react 19.2 是当前组合
- **风险**: Next 16 + React 19 仍属新；个别第三方库（旧 Radix 衍生）可能 peer warning。已有 dsnb 实测全绿
- **ETA**: 0 调研

## 决策 2: UI 库与设计

- **推荐**: **Tailwind 4 + shadcn/ui（按需取组件，不装 npm 包）+ Framer Motion 12 + lucide-react**
- **理由**:
  - 工具站需要的 UI 复杂度 > dsnb（裸 Tailwind 够）但 ≈ tally 前端（已用 shadcn）。Prompt 卡片、Chat UI、Skills 商店列表、API key 管理表单全是 shadcn 现成组件
  - shadcn 是 copy-paste 源码进 `src/components/ui/`，非依赖，不增加 bundle，无版本锁死
  - lucide-react 比 heroicons 图标多 5x，工具站需要丰富图标
  - Framer Motion 12：dsnb/www-next 同栈，复用动画 preset
- **风险**: shadcn 源码进仓库 → 风格演进需要手动 re-pull。可接受
- **ETA**: 0.5 天搭设计系统 token

## 决策 3: 认证

- **推荐**: **Zitadel OIDC via Lurus Platform**（沿用 lucrum / tally / lutu 同一账号体系）
- **理由**:
  - 用户 1 套账号通吃 lurus 全家桶（lucrum / tally / claude2master），不重复注册
  - Platform 已有完整端点：`/api/v1/auth/login` / `/auth/register` / `/auth/wechat/login` / `/whoami` / `/account/me/overview`（openapi.yaml 1086-2549 行）
  - 用户充值 / 兑换激活码 / 订阅 / 发票 / 推广分成全部走 Platform 现成 endpoint，零自建
  - Clerk = 外部依赖 + 数据出境 + 跟 Lurus 体系断链 → 不要
- **具体集成流程**:
  1. Zitadel Console 新建 Web App：clientId `claude2master.lurus.cn`，redirect `https://claude2master.com/api/auth/callback/zitadel`，PKCE on
  2. Next.js 用 `next-auth@5 (beta)` 或自写 OIDC client（参考 lucrum 实现），配 `ZITADEL_ISSUER=https://auth.lurus.cn` + `ZITADEL_CLIENT_ID` + `ZITADEL_CLIENT_SECRET`
  3. 登录回调后用 id_token 调 `https://identity.lurus.cn/api/v1/whoami` 拿账户信息
  4. 后续所有 Platform API 调用走 `Authorization: Bearer <zitadel_jwt>`
- **风险**: claude2master.com 是非 .cn TLD，Zitadel cookie domain 需配 `auth.lurus.cn` + cross-origin（auth.lurus.cn ↔ claude2master.com）。Zitadel 支持 multi-redirect-URI 即可
- **ETA**: 1 天（含 Zitadel app 创建 + DNS 验证 + 微信扫码端点接入）

## 决策 4: 数据库 + 用户/订单数据

- **推荐**: **不自建 DB**，用户/订单/订阅/钱包/激活码全走 Lurus Platform REST API
- **理由**:
  - Platform openapi.yaml 列出所有 wallet / topup / redeem / orders / subscriptions / invoices / refunds 端点（行 1395-1860）已是金融级精度（DECIMAL(20,4)、idempotency、零资金损失保证）
  - 用户数据归 Lurus 平台 = 跨产品数据复用 + 集中合规审计 + 用户跨产品 LTV 可见
  - Supabase = 数据出境（CN 用户 PII）+ 跨境延迟 + 跟 Lurus 体系完全脱节 → P0 不要
  - 跨网调 R6 Platform：claude2master.com (Vercel edge) → identity.lurus.cn (R6 43.226.38.244) 国际公网 ~80-150ms，落地后 Server Component 缓存 + ISR 即可
  - **唯一例外**：Prompt 库静态数据 → MDX/JSON 进仓库；用户收藏 Prompt → Platform 暂无 endpoint，**可推迟到 v2**（v1 走 localStorage）
- **风险**: 跨境 Platform 延迟 > 200ms 时影响 SSR FCP → 用 Server Component 缓存 + `revalidate` 60s 缓解
- **ETA**: 0 自建工作

## 决策 5: Chat 后端

- **推荐**: **Next.js Server Action / Route Handler edge stream → newhub V2 endpoint**（不 iframe LobeChat）
- **架构**:
  ```
  Browser ↔ /api/chat (Edge Runtime, ReadableStream)
              ↓ Authorization: Bearer <newhub_token>
          hub.lurus.cn/v1/chat/completions (OpenAI 兼容)
              ↓
          newapi/upstream provider
  ```
- **理由**:
  - 自建 chat UI 才能整合"Prompt 一键填入 / 模板切换 / 命中 Skills 商店推 prompt"等工具站差异化
  - iframe LobeChat = 失去样式控制 + 失去 prompt 注入能力 + UX 断层
  - Edge Runtime stream：`POST /api/chat` 用 `ReadableStream` 转发 SSE，前端 `fetch + reader.read()` 渲染。免装 LangChain / vercel ai SDK 都行，但 `ai@4` 的 `streamText` 写起来最干净
- **免登录 3 条试用流程**:
  1. 浏览器首次访问发 cookie `c2m_trial_id=<uuid>`，server 端 KV（Upstash Redis free / Vercel KV）记 `trial:<uuid> = N`，TTL 7 天
  2. 每次 `/api/chat` 调用：未登录 → `INCR trial:<uuid>`，超过 3 → 返 `402 + redirect_url=/login`
  3. 登录后：从 Platform `/account/me/llm-token` 拿用户 newhub token（**复用 openapi.yaml 行 1300 的端点**），后续请求带这个 token
- **风险**: Vercel Hobby 免费 KV 配额（10K commands/day）够 MVP，超量切付费或换 Upstash
- **ETA**: 2 天（含 SSE / cookie / KV trial gate）

## 决策 6: 内容管理

- **推荐**:
  - **Prompt 库** → `content/prompts/*.mdx`（仓库内 MDX，git 即审核流），未来量大切 Sanity
  - **Claude Code 教程** → `content/tutorials/*.mdx`（同上）+ 自动生成左侧目录树
  - **Skills 商店** → 扫描 `~/.claude/skills/` 公开版本（手动维护 `content/skills/registry.json`），展示元数据 + 链接到 GitHub raw + 一键复制安装命令
- **理由**:
  - MDX = 0 运营成本，开发者可直接 PR；Sanity / Notion API 早期是过度工程
  - Prompt 数据来源：(a) 整理 awesome-claude-prompts / awesome-chatgpt-prompts（MIT/CC0 过滤）→ JSON 种子，(b) UGC 走 v2 GitHub Discussions 引流即可（不自建 forum）
  - Skills 商店初期照搬本机已有 25+ skills 列表，做"目录 + 描述 + 触发场景"展示，链回 GitHub
- **风险**: MDX 在 App Router 配 `@next/mdx` + frontmatter 解析需 0.5 天搭脚手架
- **ETA**: 1.5 天

## 决策 7: 部署 + 域名 + CDN

- **推荐**: **Vercel 直连（无 Cloudflare 中间层）+ 阿里云 DNS**
- **部署**:
  - Vercel project 名 `2c-bs-claude2master`，scope `hanmahong5-2845s-projects`（与 dsnb 同）
  - Git push main → Vercel auto-deploy；本地 `bunx vercel --prod` 应急
  - Env vars (Vercel dashboard 设)：`ZITADEL_*`、`PLATFORM_INTERNAL_KEY`、`NEWHUB_BASE_URL=https://hub.lurus.cn`、`KV_URL`
- **DNS（阿里云）**:
  ```
  claude2master.com.       A     76.76.21.21
  www.claude2master.com.   A     76.76.21.21
  ```
  走 `aliyun-dns` skill 一键配
- **是否上 Cloudflare**: **不上**。Vercel 自带 anycast + LE 证 + CDN，再叠 CF 反加复杂度；唯一 CF 用途是 DDoS 防护，MVP 阶段过度
- **国内可达性验证**: 测试三网（电信/移动/联通）`curl -I https://claude2master.com/`，目标 < 500ms TTFB。dsnb.help 同栈已验证 OK
- **ETA**: 0.5 天

---

## 完整技术栈（最终方案）

| Layer | Choice |
|-------|--------|
| 框架 | Next.js 16.2.3 App Router |
| 运行时 | React 19.2.4 + Bun（dev/CI）+ Vercel Edge Runtime（chat stream） |
| UI | Tailwind 4 + shadcn/ui (copy-paste) + lucide-react + Framer Motion 12 |
| 内容 | MDX (prompts/tutorials)、JSON registry (skills) |
| 认证 | Zitadel OIDC + 自建薄 client（参考 lucrum） |
| 状态/计费 | Lurus Platform REST `/api/v1/*`（identity / wallet / subscriptions / redeem / invoices） |
| Chat | Server Route → newhub `hub.lurus.cn/v1/chat/completions` (OpenAI-compat) |
| 限流/Trial | Vercel KV / Upstash Redis（cookie-uuid → count） |
| 部署 | Vercel auto-deploy on `main` push |
| DNS | aliyun-dns → 76.76.21.21 |
| 监控 | `@vercel/analytics` + `@vercel/speed-insights`（同 dsnb） |

## 文件目录结构（建议）

```
2c-bs-claude2master/
├── CLAUDE.md
├── README.md
├── package.json
├── next.config.ts            # standalone + viewTransition
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── bun.lock
├── scripts/
│   └── ship.sh               # 抄 dsnb：lint + build + safe-stage + commit + push
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx (Landing)
│   │   ├── globals.css
│   │   ├── chat/page.tsx
│   │   ├── prompts/page.tsx, [slug]/page.tsx
│   │   ├── tutorials/page.tsx, [...slug]/page.tsx
│   │   ├── skills/page.tsx
│   │   ├── api-key/page.tsx                # 拿 newhub token
│   │   ├── login/page.tsx, callback/
│   │   ├── api/
│   │   │   ├── chat/route.ts               # Edge stream → newhub
│   │   │   ├── auth/callback/zitadel/route.ts
│   │   │   └── trial/route.ts              # cookie + KV gate
│   │   ├── sitemap.ts, robots.ts, not-found.tsx
│   ├── components/
│   │   ├── ui/                             # shadcn copy
│   │   ├── hero.tsx, prompt-card.tsx, chat/, skill-card.tsx
│   ├── content/
│   │   ├── prompts/*.mdx
│   │   ├── tutorials/*.mdx
│   │   └── skills/registry.json
│   ├── lib/
│   │   ├── platform-client.ts              # fetch wrapper for identity.lurus.cn
│   │   ├── newhub-client.ts                # OpenAI-compat client
│   │   ├── zitadel.ts                      # OIDC client
│   │   ├── trial-gate.ts                   # KV + cookie logic
│   │   └── content.ts                      # MDX loader
│   └── middleware.ts                       # zitadel session check
├── public/og-image.png, favicon.ico
└── deploy/                                  # Vercel-only, no K8s
```

## 部署架构图（文字版）

```
                    ┌─────────────────────────────────────────────┐
   CN User ──HTTPS─→│  claude2master.com (Vercel anycast)         │
                    │  - Next 16 SSR + Edge Runtime               │
                    │  - Static MDX (Prompt 库/教程)              │
                    │  - shadcn UI                                │
                    └────────┬───────────────────────┬────────────┘
                             │ Server Action         │ OIDC
                             ▼                       ▼
              ┌─────────────────────────┐    ┌──────────────────┐
              │ hub.lurus.cn            │    │ auth.lurus.cn    │
              │ (R6 newhub:8850)        │    │ (Zitadel)        │
              │  /v1/chat/completions   │    │                  │
              └────────┬────────────────┘    └────────┬─────────┘
                       │                              │
                       ▼                              ▼
              ┌────────────────────┐         ┌─────────────────────┐
              │ newapi.lurus.cn    │         │ identity.lurus.cn   │
              │ (R1 newapi)        │         │ (R6 platform-core)  │
              │  upstream models   │         │  /api/v1/*          │
              └────────────────────┘         │  wallet/redeem/etc  │
                                              └─────────────────────┘
```

## 风险清单

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Zitadel cross-origin cookie 配置 (auth.lurus.cn ↔ .com) | 中 | 登录失败 | Zitadel app `ZITADEL_ALLOWED_REDIRECT_DOMAINS` 加 claude2master.com；登录用 PKCE + state，避免 cookie 跨域 |
| Vercel → R6 Platform 跨境延迟 > 300ms | 中 | SSR FCP 慢 | Server Component 缓存 + `revalidate=60`；钱包/订单等动态走客户端 fetch |
| newhub `hub.lurus.cn` 当前 DNS 缺失（MEMORY.md 待配） | 高 | Chat 直接不工作 | 项目 init 第 1 天必须先配 DNS → 走 `aliyun-dns` skill |
| Vercel Hobby 100GB/月流量 | 低 | 超量收费 | 早期低风险；接近时升 Pro 或挂 CF cache |
| 免登录 trial KV 被刷（同 IP 大量 uuid） | 中 | 滥用 | 多维度：cookie-uuid + IP + UA hash 三选一 INCR；接 Vercel 自带 fingerprint |
| shadcn 与 Tailwind 4 兼容（仍 v3 文档为主） | 低 | 个别组件 className 不生效 | shadcn 官方已加 tailwind v4 alpha 支持；dsnb 已实测 OK |
| Prompt 库版权 | 中 | 法律 | 只收 MIT / CC0 / 自创；每个 prompt 附 source 字段 |

## 下一步（给脚手架 agent 的 handoff）

**项目 init 命令**:
```bash
cd C:/Users/Anita/Desktop/lurus
# 用 dsnb 当模板（同栈最近邻）
cp -r 2c-bs-dsnb 2c-bs-claude2master-temp
mv 2c-bs-claude2master/_research 2c-bs-claude2master-temp/_research
rm -rf 2c-bs-claude2master
mv 2c-bs-claude2master-temp 2c-bs-claude2master
cd 2c-bs-claude2master
rm -rf .git node_modules .next deploy/ promotion/ src/content/*
# 改 package.json name → 2c-bs-claude2master，version → 0.0.1
bun install
git init && git branch -M main
```

**关键依赖（在 dsnb 基础上加）**:
```bash
bun add @next/mdx @mdx-js/loader @mdx-js/react gray-matter
bun add @vercel/kv               # trial gate
bun add ai                       # vercel ai sdk (streamText helper)
bun add openai                   # newhub OpenAI-compat
bun add next-auth@beta @auth/core   # 或自写 OIDC client
bun add zod react-hook-form @hookform/resolvers
bun add cmdk                     # ⌘K 命令面板（Chat / Prompt 跳转）
# shadcn 走 `bunx shadcn@latest init` + `bunx shadcn@latest add button card dialog drawer input textarea sheet command tabs`
bun add lucide-react
bun add -d @types/mdx
```

**第一个 commit 应该是**:
```
chore(init): bootstrap 2c-bs-claude2master from dsnb template

- Next 16 + React 19 + Bun + Tailwind 4 + Framer Motion 12 (dsnb 同栈)
- 清空 dsnb 业务文件，保留 next.config.ts / tsconfig / eslint / postcss / scripts/ship.sh
- _research/architecture.md 锁定 7 项决策
- README.md TODO list + CLAUDE.md 框架（待 scaffold 第二轮填）
```

**前 5 步建议顺序**（脚手架 agent 接手）:
1. 配 `aliyun-dns` 给 claude2master.com 加 A 记录 76.76.21.21；同时配 hub.lurus.cn → 43.226.38.244（如尚未配）
2. 写 `src/lib/platform-client.ts` + `src/lib/newhub-client.ts` 两个最小 fetch wrapper
3. 写 `src/app/api/chat/route.ts` edge stream（先硬编码 token 走通 chat），再接 trial-gate
4. 抄 dsnb `src/components/Hero.tsx` 做 Landing
5. Zitadel app 创建 + 接入登录回调（最后做，前面用 mock session）
