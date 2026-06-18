# claude2master.com (2c-bs-claude2master)

中国大陆 Claude 用户的中文工具入口，流量站 → 引流 Lurus 产品（newapi / forge / lutu / Platform）。Lurus Web 产品组 (P2)。domain `claude2master.com`（`.com` 不上 CN IDC，Vercel 托管）。Next.js 16 / React 19 / Tailwind 4 / Bun。chat 后端走 `newapi.lurus.cn/v1`（不走 newhub stage，不直调 Anthropic 官方）。

## Commands

```bash
bun install
bun run dev                              # :3000
bun run build && bun run start
bun run lint

./scripts/ship.sh "feat(c2m): xxx"       # lint + build + safe-stage + commit + push
bunx vercel --prod                       # 手动 redeploy
```

> 真源/细节: 品牌硬上「Claude 2 Master」(survival-first)，Footer 必带 `Not affiliated with Anthropic.` · Prompt 库只收 MIT/CC0/自创附 source · 设计 `_research/design.md` · `/vercel-deploy` `/cn-idc-icp` `/aliyun-dns` `/lurus-routing` skill。
