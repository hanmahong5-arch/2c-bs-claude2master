[English](./README.md)

# claude2master.com

面向中国大陆用户的中文入口站，帮你**不翻墙**试用、学习主流 AI 编码助手，并拿到官方 API 访问方式——不用自己办国外账号、不用外币支付。

`claude2master.com` 是 Lurus Web 产品组的第三个独立 `.com` 品牌站（与同组姐妹站同一套「最薄 C 端入口」打法）。它是一个 Next.js 内容 + 引流站：免登录试用对话组件、中文教程库、prompt / skills / MCP 目录，以及每日自动把上游 GitHub release 与工程博客文章翻译摘要成中文 changelog 文章的「雷达」管线——所有付费使用最终都导向 Lurus 自营 LLM 网关 `newapi.lurus.cn`。本站不训练也不托管任何模型，也不代理或转售任何厂商的官方服务。部署状态：`prod`（Vercel），见 `lurus.yaml:73`。`.env.example` 里声明的部分集成目前只是占位符——见下方「配置」表格里标注「未接入」的几行。

## 核心能力

- **免登录试用对话** —— 每个浏览器 3 条免费额度（`HttpOnly` cookie 计数器，不是真实登录会话），SSE 流式转发到 `newapi.lurus.cn/v1/chat/completions`，跑在 edge function 上（`src/app/api/chat/route.ts`）。底层模型 id 是纯服务端配置值，从不对 UI 暴露（`ENGINE_MODEL`，默认 `deepseek-chat`）。
- **每日雷达管线** —— 定时 CI 任务从一份固定的编码 agent 仓库清单（`src/lib/tools.ts` 的 `TOOLS`）加一批精选工程博客（`scripts/radar/blogs.yaml`）抓新内容，经同一个 `newapi.lurus.cn` 网关做中文摘要，直接以 MDX 形式 commit 到 `main`（`.github/workflows/daily-radar.yml`、`scripts/radar/fetch-releases.sh`）。
- **周报走 PR 人审** —— 每周一的任务从过去 7 天 changelog 汇总生成周报草稿，开一个带 `auto-radar` 标签的 PR 而不是直接自动合并，必须人工审后才上线（`.github/workflows/weekly-digest.yml`、`scripts/radar/digest-draft.ts`）。
- **速查类目录** —— prompt 库、教程库、skills 目录、MCP server 目录、报错速查库、LLM 价格对照表、token 计数器，均由 `src/lib/` 下单一信息源数据模块驱动（`prompts.ts`、`tutorials.ts`、`skills.ts`、`mcp-directory.ts`、`error-kb.ts`、`llm-prices.ts`）。
- **大陆可访问性对照表** —— 人工整理（非实时探测）的主流 AI 服务大陆直连/需代理对照表，明确标注数据核实日期（`src/lib/service-access.ts`）。
- **SEO 落地页 + 订阅源** —— 按关键词生成的独立落地页（`src/app/zh/[slug]`、`src/lib/seo-landings.ts`）、分频道/分工具的 RSS（`src/app/feed/[channel]/route.ts`、`src/app/feed/tool/[key]/route.ts`），以及动态 OG 图（`src/app/og/[slug]/route.tsx`）。

## 快速开始

包管理器为 Bun（见 `bun.lock`）。

```bash
bun install
cp .env.example .env.local        # 至少填 NEXT_PUBLIC_NEWAPI_BASE_URL + NEWAPI_TRIAL_TOKEN 才能跑通 /chat
bun run dev                       # http://localhost:3000
bun test                          # 本次核查为 100 用例 / 8 个文件
bun run lint
bun run build && bun run start
```

一键发布脚本（lint + build + 安全 stage + commit + push + 显式 Vercel 部署——因为这个 Vercel 项目**没有**接 Git 自动部署）：

```bash
./scripts/ship.sh "feat(c2m): xxx"
./scripts/ship.sh --no-checks "wip: ..."   # 跳过 lint+build，谨慎使用
```

## 架构

Next.js 16 App Router + React 19 + Tailwind 4。内容走文件驱动（`src/content/` 下的 frontmatter + MDX），请求时经一个自写的轻量 frontmatter 解析器读取（`src/lib/content.ts`）——无 CMS，无数据库。

```
src/
  app/
    api/chat/route.ts        # 试用对话代理 (edge runtime)
    api/subscribe/route.ts   # Buttondown newsletter 订阅
    chat/ tutorials/ prompts/ skills/ mcp/ tools/ errors/
    changelog/ weekly/ harness/ rank/ access/ zh/[slug]/   # 内容 + SEO 页面
    feed.xml/ feed/[channel]/ feed/tool/[key]/ og/[slug]/  # RSS + OG 图
    legal/ about/ login/ signup/ subscribe/ api-keys/
  components/                # UI 组件 + broadcast(音频播放) 组件
  content/
    changelog/*.mdx          # 每日雷达产出 (bot commit)
    harness/*.mdx            # 编辑部深度文章
  lib/                       # 单一信息源的数据/逻辑模块 (见下表)
  proxy.ts                   # /feed* 路由上识别 RSS 阅读器 UA 的请求级检测
scripts/
  radar/                     # fetch-releases.sh、fetch-blogs.ts、summarize.ts、digest-draft.ts、tts-generate*.ts
  ship.sh                    # lint+build+commit+push+deploy 一条龙
```

改内容前值得先了解的 `src/lib/` 模块：

| 模块 | 作用 |
|---|---|
| `tools.ts` | 被跟踪的编码 agent 仓库注册表；顺序必须与 `scripts/radar/fetch-releases.sh` 的 `REPOS` 保持一致 |
| `outbound.ts` | 所有到 `newapi`/`forge`/`hub` 的出站链接的唯一构造点，带 UTM + 邀请码归因 |
| `content.ts` / `content-types.ts` | MDX frontmatter 读取器 + 共享内容类型（`changelog` / `digest` / `harness` 三个频道） |
| `service-access.ts` | 大陆可访问性参考表 |
| `llm-prices.ts` | 各厂商官方定价快照，带 `AS_OF` 核实日期 |
| `coding-rank.ts` | 静态「v0」参考榜单，明确标注非实测 benchmark |

## 配置

来自 `.env.example`；本地开发复制为 `.env.local`，生产在 Vercel dashboard 配置。

| 变量 | 是否必填 | 默认值 | 说明 |
|---|---|---|---|
| `NEXT_PUBLIC_NEWAPI_BASE_URL` | 建议填 | `https://newapi.lurus.cn` | 试用对话后端 base URL |
| `NEWAPI_TRIAL_TOKEN` | `/chat` 要能用则必填 | _(空)_ | 共享试用 token；未设置时 `/api/chat` 返回 `503` |
| `NEWAPI_CHAT_MODEL` | 否 | `deepseek-chat` | 服务端专用模型 id，读取自 `src/app/api/chat/route.ts`，未列在 `.env.example` 里 |
| `BUTTONDOWN_API_KEY` | `/subscribe` 要能用则必填 | _(空)_ | 未设置时 `/api/subscribe` 返回 `503`；未列在 `.env.example` 里 |
| `BUTTONDOWN_BASE_URL` | 否 | `https://api.buttondown.com/v1` | 未列在 `.env.example` 里 |
| `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | 否 | _(空)_ | **已声明但未接入**：`src/` 下没有任何代码读取或调用这几个变量；`/login`、`/auth/callback` 目前是静态占位页，实际把用户导去 newapi |
| `PLATFORM_BASE_URL` / `PLATFORM_INTERNAL_KEY` | 否 | _(空)_ | 与上面 OIDC 变量同为「Phase 3、未接入」状态 |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | 否 | _(空)_ | 为未来的 KV 版试用额度限制预留；当前试用限制只是一个前端可见的明文 cookie 计数器（`src/app/api/chat/route.ts`），没有任何 KV 相关代码 |

## 站点分区

不是 API-first 服务，主要形态是站点本身。主要路由分组（`src/app/`）：

| 路径 | 用途 |
|---|---|
| `/chat` | 免登录试用对话（3 条，cookie 限额） |
| `/tutorials`、`/prompts`、`/skills`、`/mcp` | 中文教程库、prompt 库、skills 目录、MCP server 目录 |
| `/tools`、`/tools/price`、`/tools/tokens` | 工具落地页、LLM 价格对照、token 计数器 |
| `/errors` | 编码助手报错速查库 |
| `/changelog`、`/weekly`、`/harness` | 每日雷达产出、周报、编辑部深度文章 |
| `/rank` | 静态（非实测）编程工具参考榜单 |
| `/access` | 大陆可访问性参考表 |
| `/api-keys`、`/login`、`/signup` | 导向 `newapi.lurus.cn` 开户/计费的出站漏斗 |
| `/zh/[slug]` | 按关键词的 SEO 落地页 |
| `/feed.xml`、`/feed/[channel]`、`/feed/tool/[key]` | RSS |

## 开发约定

来自本仓开发约定文档（未逐字照抄，以下为摘要）：

- Prompt 库条目只收 MIT / CC0 / 自创附来源的内容。
- Footer 必须始终带「与相关厂商无隶属关系」的免责声明（见 `src/components/Footer.tsx`）。
- 每次 push 前的发布路径是 `bun run lint && bun run build`；`scripts/ship.sh` 把这一步固化下来。
- `src/lib/tools.ts` 的 `TOOLS` 与 `scripts/radar/fetch-releases.sh` 的 `REPOS` 需手动保持同步（故意不加构建期校验）。

## 相关 Lurus 服务

以代码为准确认（不只是文档里提）——`src/` 里有实际的环境变量、fetch 调用或出站链接：

| 服务 | 关系 |
|---|---|
| `newapi.lurus.cn` | LLM 网关：支撑 `/api/chat`，通过 `NEXT_PUBLIC_NEWAPI_BASE_URL` 引用，也是主要出站引流目标（`src/lib/outbound.ts`） |
| `forge.lurus.cn` | 仅作为出站引流目标（Agent 工作台产品）；在 `/about`、`/skills` 中被链接 |
| `hub.lurus.cn` | 仅作为出站引流目标（newapi 之上的多租户层）；在 `/about` 中被链接 |
| Lurus 自托管 TTS（CosyVoice2） | 通过 `newapi` 的音频接口间接被雷达内容的语音播报使用；音频生成本身跑在本地定时任务里，不在 CI 路径中（见 `.github/workflows/daily-radar.yml` 注释） |

## License

仓库内没有 `LICENSE` 文件，`package.json` 声明 `"private": true` 且无 `license` 字段。在 Lurus 另行声明之前，请视为版权保留（all rights reserved）。

> 与任何 AI 模型厂商均无隶属、代言或赞助关系。仅出现在数据表格（如可访问性/价格对照表）中的第三方产品名称归其各自权利人所有。
