# claude2master.com (2c-bs-claude2master)

中国大陆 Claude 用户的中文工具入口。流量站 → 引流到 Lurus 已有产品（newapi / forge / lutu / Platform）。

- Domain: `claude2master.com`（独立品牌站，与 dsnb.help 并行）
- Repo: 待创建（建议 `hanmahong5-arch/2c-bs-claude2master`，public）
- Hosting: **Vercel**（同 dsnb.help 模式）
- DNS: 阿里云 `@` + `www` → `76.76.21.21`
- Lifecycle: building → stage（待首次部署）
- Product Group: Web (P2)

## Owner 决策（2026-05-25）

1. **品牌**：硬上「Claude 2 Master」，不脱钩 — survival-first（见 [[survival-first-over-compliance]] memory）。Footer 加 Anthropic disclaimer 作最低限度风险缓解。
2. **后端**：全部 chat / API 调用走 `newapi.lurus.cn/v1`（prod 稳定），不走 newhub stage。
3. **API 主体**：复用 newapi 现有架构，本站不直调 Anthropic 官方 API。

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.3 (App Router, `output: standalone`) |
| Runtime | Bun（本地）/ Vercel runtime（生产） |
| UI | React 19.2.4 + Tailwind 4 + `lucide-react` |
| Animation | `framer-motion` 12 + CSS View Transitions |
| Content | MDX (prompts/tutorials), JSON registry (skills) — Phase 3 |
| Auth | Zitadel OIDC via Lurus Platform — Phase 3 |
| Chat backend | Edge Route Handler → `newapi.lurus.cn/v1/chat/completions` |
| Analytics | `@vercel/analytics` + `@vercel/speed-insights` |

## Design

详见 `_research/design.md`。

- **底盘**: LurusTech master (`--lt-paper #F5F2E8` / `--lt-ink #14130F`)
- **Product accent**: electric indigo `#7C5CFF` (`--c2m-accent`)
- **Fonts**: Inter Tight + Fraunces (display) + JetBrains Mono + system CJK
- **跟 Lurus 关系**: 家族同源（同 dsnb 模式 — 共享 paper token，独立 accent）

## Directory

```
src/
├── app/                # 12 P0 路由
│   ├── (Landing) page.tsx
│   ├── chat/           # 在线 chat（funnel 核心）
│   ├── prompts/        # SEO 主战场
│   ├── tutorials/      # Claude Code 教程
│   ├── skills/         # Skills 商店
│   ├── api-keys/       # API key 申请
│   ├── about/
│   ├── login/ signup/ auth/callback/
│   └── legal/          # privacy / terms / beian
├── components/         # Header / Footer / Hero / Card / Button ...
├── content/            # MDX seed (Phase 3)
└── lib/                # newapi-client / platform-client / trial-gate
_research/              # Phase 1 swarm 报告（不删，作为决策溯源）
scripts/ship.sh         # 一键发布
```

## Commands

```bash
bun install
bun run dev                              # http://localhost:3000
bun run build && bun run start           # production
bun run lint

./scripts/ship.sh "feat(c2m): xxx"       # lint + build + safe-stage + commit + push

# Vercel
bunx vercel ls --prod | head -5
bunx vercel --prod                       # 手动 redeploy
```

## Lurus 产品引流路径

| 来源页面 | 引流目标 | 触达方式 |
|----------|----------|----------|
| `/chat` 第 4 条 | newapi.lurus.cn 注册 | 注册即开 token + 赠额 |
| `/api-keys` | newapi.lurus.cn / hub.lurus.cn | SSO (Zitadel) |
| `/tutorials/claude-code-setup` | newapi.lurus.cn | `ANTHROPIC_BASE_URL=https://newapi.lurus.cn` |
| `/skills` | forge.lurus.cn | "在 Forge 里跑这个 skill" |
| `/about` | lutu / www.lurus.cn | 产品矩阵 |

## Gotchas

- `.com` 不走 CN IDC（避开 ICP 拦截，同 dsnb.help 教训）
- 营销文案克制，**不堆民族主义口号**（dsnb 教训沿用）
- 默认中文，v1 不做 i18n（不复用 dsnb 的 `(zh)/(en)` route group）
- Anthropic 商标硬上 — Footer 必带 disclaimer：`Not affiliated with Anthropic.`
- Prompt 库内容只收 MIT / CC0 / 自创；每条附 source

## 关联 skill

- `vercel-deploy` — 部署排查
- `cn-idc-icp` — 为什么不上 CN IDC
- `aliyun-dns` — DNS 改记录
- `lurus-routing` — newapi/newhub/Portkey 路由全景

## BMAD

| Resource | Path |
|----------|------|
| Phase 1 调研 | `_research/{market,positioning,sitemap,architecture,design,security-compliance}.md` |
| Sprint planning | `_bmad-output/` (Phase 3 起用) |
