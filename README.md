# claude2master.com

**中国大陆用 Claude，从入门到精通** — Lurus Web 产品组第三个 .com 站。

Prompt 库 · 在线 Chat · Claude Code 教程 · Skills 商店 · API key 申请。

## Stack

- Next.js 16 (App Router, `viewTransition`) + React 19 + Bun
- Tailwind 4 + Framer Motion 12 + lucide-react
- Deploy: Vercel + 阿里云 DNS (`A → 76.76.21.21`)
- Backend: Lurus newapi (`newapi.lurus.cn/v1`) + Platform identity (`identity.lurus.cn/api/v1`)

## Run

```bash
bun install
bun run dev          # http://localhost:3000
bun run build
bun run lint
```

## Ship

```bash
./scripts/ship.sh "feat(c2m): xxx"           # lint + build + safe-stage + commit + push
./scripts/ship.sh --no-checks "wip: ..."     # skip checks (use sparingly)
```

Vercel auto-deploys on `main` push, ~30s.

## Docs

- `_research/` — Phase 1 swarm 调研报告（market / positioning / sitemap / architecture / design / security）
- `CLAUDE.md` — 项目规约 + 命令 + BMAD 资源
- `lurus.yaml` (repo root) — Lurus 公司架构真源

## License

Proprietary. © Lurus.

> Not affiliated with Anthropic. Claude is a trademark of Anthropic PBC.
