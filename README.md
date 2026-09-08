[中文](./README.zh-CN.md)

# claude2master.com

A Chinese-language gateway site that helps mainland-China users try, learn, and get API access to mainstream AI coding assistants without a VPN — no self-signed accounts, no foreign card required.

`claude2master.com` is the third `.com` brand site from Lurus's Web product group (same "thin C-end entry point" playbook as its sibling sites). It is a Next.js content + funnel site: a free-trial chat widget, a Chinese tutorial library, a prompt/skills/MCP directory, and a daily "radar" that turns upstream GitHub releases and engineering blog posts into Chinese-summarized changelog articles — all of it routing paid usage to Lurus's self-hosted LLM gateway (`newapi.lurus.cn`). It does not train or host any model itself, and it does not proxy or resell any vendor's official service. Deployed status: `prod` (Vercel) per `lurus.yaml:73`. Some integrations declared in `.env.example` are placeholders only — see the "not wired" notes in the Configuration table below.

## Core capabilities

- **Free-trial chat** — 3 free messages per browser (`HttpOnly` cookie counter, not a real auth session), streamed via SSE, forwarded to `newapi.lurus.cn/v1/chat/completions` on an edge function (`src/app/api/chat/route.ts`). The underlying model id is a server-only config value never exposed to the UI (`ENGINE_MODEL`, defaults to `deepseek-chat`).
- **Daily radar pipeline** — a scheduled CI job fetches new releases from a fixed list of coding-agent repos (`src/lib/tools.ts` `TOOLS`) plus a curated set of engineering blogs (`scripts/radar/blogs.yaml`), summarizes them in Chinese through the same `newapi.lurus.cn` gateway, and commits the result straight to `main` as MDX (`.github/workflows/daily-radar.yml`, `scripts/radar/fetch-releases.sh`).
- **Weekly digest as a reviewed PR** — a Monday job drafts a weekly recap from the past 7 days of changelog entries and opens a PR (label `auto-radar`) instead of auto-merging, so a human reviews it before it ships (`.github/workflows/weekly-digest.yml`, `scripts/radar/digest-draft.ts`).
- **Reference libraries** — prompt library, tutorials, skills directory, MCP server directory, coding-error knowledge base, LLM price comparison, and a token counter, each backed by a single hand-curated data module under `src/lib/` (`prompts.ts`, `tutorials.ts`, `skills.ts`, `mcp-directory.ts`, `error-kb.ts`, `llm-prices.ts`).
- **Mainland-reachability table** — a manually curated (not live-probed) table of which major AI services are direct-reachable vs. proxy-needed from mainland China, with an explicit "as of" date (`src/lib/service-access.ts`).
- **SEO landing pages + feeds** — per-keyword landing pages (`src/app/zh/[slug]`, `src/lib/seo-landings.ts`), channel/tool-scoped RSS feeds (`src/app/feed/[channel]/route.ts`, `src/app/feed/tool/[key]/route.ts`), and dynamic OG images (`src/app/og/[slug]/route.tsx`).

## Quick start

Package manager is Bun (see `bun.lock`).

```bash
bun install
cp .env.example .env.local        # fill in at least NEXT_PUBLIC_NEWAPI_BASE_URL + NEWAPI_TRIAL_TOKEN to exercise /chat
bun run dev                       # http://localhost:3000
bun test                          # 100 tests / 8 files as of this check
bun run lint
bun run build && bun run start
```

Ship script (lint + build + safe-stage + commit + push + explicit Vercel deploy, since this Vercel project is **not** Git-connected):

```bash
./scripts/ship.sh "feat(c2m): xxx"
./scripts/ship.sh --no-checks "wip: ..."   # skip lint+build, use sparingly
```

## Architecture

Next.js 16 App Router, React 19, Tailwind 4. Content is file-based (frontmatter + MDX under `src/content/`), read at request time via a small hand-rolled frontmatter parser (`src/lib/content.ts`) — no CMS, no database.

```
src/
  app/
    api/chat/route.ts        # trial chat proxy (edge runtime)
    api/subscribe/route.ts   # Buttondown newsletter subscribe
    chat/ tutorials/ prompts/ skills/ mcp/ tools/ errors/
    changelog/ weekly/ harness/ rank/ access/ zh/[slug]/   # content + SEO surfaces
    feed.xml/ feed/[channel]/ feed/tool/[key]/ og/[slug]/  # RSS + OG image
    legal/ about/ login/ signup/ subscribe/ api-keys/
  components/                # UI + broadcast (audio player) widgets
  content/
    changelog/*.mdx          # daily radar output (bot-committed)
    harness/*.mdx            # editorial deep-dive articles
  lib/                       # single-source-of-truth data/logic modules (see table below)
  proxy.ts                   # request-scoped RSS-reader UA detection for /feed* routes
scripts/
  radar/                     # fetch-releases.sh, fetch-blogs.ts, summarize.ts, digest-draft.ts, tts-generate*.ts
  ship.sh                    # lint+build+commit+push+deploy in one shot
```

`src/lib/` modules worth knowing before editing content:

| Module | Role |
|---|---|
| `tools.ts` | registry of tracked coding-agent repos; order must match `scripts/radar/fetch-releases.sh`'s `REPOS` |
| `outbound.ts` | single construction point for all outbound links to `newapi`/`forge`/`hub`, with UTM + affiliate-code attribution |
| `content.ts` / `content-types.ts` | MDX frontmatter reader + shared content types (`changelog` / `digest` / `harness` channels) |
| `service-access.ts` | mainland-reachability reference table |
| `llm-prices.ts` | per-vendor official pricing snapshot, with an `AS_OF` date |
| `coding-rank.ts` | static "v0" reference ranking, explicitly labeled non-benchmark |

## Configuration

From `.env.example`; copy to `.env.local` for local dev, set in the Vercel dashboard for prod.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_NEWAPI_BASE_URL` | recommended | `https://newapi.lurus.cn` | base URL for the trial-chat backend |
| `NEWAPI_TRIAL_TOKEN` | for `/chat` to work | _(empty)_ | shared trial token; `/api/chat` returns `503` when unset |
| `NEWAPI_CHAT_MODEL` | no | `deepseek-chat` | server-only model id, read in `src/app/api/chat/route.ts`, not in `.env.example` |
| `BUTTONDOWN_API_KEY` | for `/subscribe` to work | _(empty)_ | `/api/subscribe` returns `503` when unset; not in `.env.example` |
| `BUTTONDOWN_BASE_URL` | no | `https://api.buttondown.com/v1` | not in `.env.example` |
| `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | no | _(empty)_ | **declared but not wired**: no code under `src/` reads or calls these; `/login` and `/auth/callback` are static placeholder pages that redirect users to `newapi` instead |
| `PLATFORM_BASE_URL` / `PLATFORM_INTERNAL_KEY` | no | _(empty)_ | same "Phase 3, not wired" status as the OIDC vars |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | no | _(empty)_ | declared for a future KV-backed trial gate; current trial gate is a plain client-visible cookie counter (`src/app/api/chat/route.ts`), no KV code exists yet |

## Site sections

Not an API-first service; primary surface is the site itself. Main route groups (`src/app/`):

| Path | Purpose |
|---|---|
| `/chat` | free-trial chat (3 messages, cookie-gated) |
| `/tutorials`, `/prompts`, `/skills`, `/mcp` | Chinese tutorial library, prompt library, skills directory, MCP server directory |
| `/tools`, `/tools/price`, `/tools/tokens` | tool landing, LLM price comparison, token counter |
| `/errors` | coding-agent error lookup knowledge base |
| `/changelog`, `/weekly`, `/harness` | daily radar output, weekly digest, editorial deep-dives |
| `/rank` | static (non-benchmark) coding-tool reference ranking |
| `/access` | mainland-China reachability reference table |
| `/api-keys`, `/login`, `/signup` | outbound funnel to `newapi.lurus.cn` account/billing |
| `/zh/[slug]` | per-keyword SEO landing pages |
| `/feed.xml`, `/feed/[channel]`, `/feed/tool/[key]` | RSS |

## Development conventions

From this repo's internal dev-convention doc (not reproduced verbatim here, summarized):

- Chinese-only Prompt library entries must be MIT/CC0/original-with-source only.
- Footer must always carry a not-affiliated-with-vendor disclaimer (see `src/components/Footer.tsx`).
- Ship path is `bun run lint && bun run build` before every push; `scripts/ship.sh` encodes this.
- `TOOLS` in `src/lib/tools.ts` and `REPOS` in `scripts/radar/fetch-releases.sh` must be kept in sync by hand (no build-time check, by design).

## Related Lurus services

Confirmed by code (not just docs) — env vars, fetch calls, or outbound links in `src/`:

| Service | Relationship |
|---|---|
| `newapi.lurus.cn` | LLM gateway: backs `/api/chat`, referenced as `NEXT_PUBLIC_NEWAPI_BASE_URL`, and is the primary outbound funnel target (`src/lib/outbound.ts`) |
| `forge.lurus.cn` | outbound funnel target only (agent-workbench product); linked from `/about`, `/skills` |
| `hub.lurus.cn` | outbound funnel target only (multi-tenant layer over newapi); linked from `/about` |
| Lurus self-hosted TTS (CosyVoice2) | consumed indirectly through `newapi`'s audio endpoint for radar-content narration; audio generation itself runs as a local cron job, not in CI (see comments in `.github/workflows/daily-radar.yml`) |

## License

No `LICENSE` file is present in this repository and `package.json` declares `"private": true` with no `license` field. Treat the code as all-rights-reserved unless Lurus states otherwise elsewhere.

> Not affiliated with, endorsed by, or sponsored by any AI model vendor. Any third-party product names appearing only inside data tables (e.g. the reachability/pricing tables) are trademarks of their respective owners.
