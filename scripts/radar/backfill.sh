#!/usr/bin/env bash
# backfill.sh — 一次性 replay 过去 90 天真实 GitHub releases
#
# 用法:
#   GITHUB_TOKEN=ghp_... NEWAPI_TRIAL_TOKEN=sk-... bash scripts/radar/backfill.sh
#   GITHUB_TOKEN=ghp_... NEWAPI_TRIAL_TOKEN=sk-... bash scripts/radar/backfill.sh --dry-run
#
# 守 §4.1: 拉真实 archive, 不编造版本号; published_at 是 GitHub 给的真实时间。
# summarize.ts 用 .published_at.slice(0, 10) 排日期, 所以 MDX 落到真实历史日期, 不挤今天。
#
# 实践 backfill 走单独流程: editor 先 curl -I 验 5 个 URL 还 200, 再用 practices-seed.jsonl 喂 summarize.ts。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DRY_RUN_ARG=""
if [ "${1:-}" = "--dry-run" ]; then DRY_RUN_ARG="--dry-run"; fi

if [ -z "${NEWAPI_TRIAL_TOKEN:-}" ]; then
  echo "backfill: NEWAPI_TRIAL_TOKEN required" >&2
  exit 1
fi

SINCE=$(date -u -d '90 days ago' +%Y-%m-%dT00:00:00Z 2>/dev/null \
        || date -u -v-90d +%Y-%m-%dT00:00:00Z)

auth_header=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  auth_header=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

{
  for repo in anthropics/claude-code openai/codex; do
    echo "[backfill] fetching $repo since $SINCE" >&2
    # sort_by(published_at) 升序 → summarize.ts 最后处理的 = 最新 release,
    # 使 state.lastSeen 落到最新 tag (与 fetch-releases.sh 不变量一致)。
    curl -sfL \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "${auth_header[@]}" \
      "https://api.github.com/repos/${repo}/releases?per_page=30" \
    | jq -c --arg r "$repo" --arg s "$SINCE" '
        [ .[] | select(.draft==false and .prerelease==false and .published_at >= $s) ]
        | sort_by(.published_at) | .[]
        | {kind:"release", repo:$r, tag:.tag_name, name:.name, body:.body,
           html_url:.html_url, published_at:.published_at}'
  done
} | tee "${ROOT}/radar-backfill.jsonl" \
  | bun run "${SCRIPT_DIR}/summarize.ts" ${DRY_RUN_ARG}

echo "[backfill] done. raw jsonl saved to radar-backfill.jsonl" >&2
