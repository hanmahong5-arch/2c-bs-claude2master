#!/usr/bin/env bash
# fetch-releases.sh — 抓 anthropics/claude-code + openai/codex 最新 release
#
# 输入: scripts/radar/state.json (lastSeen.<repo>)
# 输出: stdout, JSON Lines, 每行一条新 release:
#   {"repo":"anthropics/claude-code","tag":"v1.2.0","name":"...","body":"...","html_url":"...","published_at":"..."}
#
# 依赖: curl + jq
# Auth: $GITHUB_TOKEN (可选; 提供则用 Bearer, 否则匿名 60req/h)
#
# Exit codes:
#   0 — 正常 (无新 release 时不输出, 也是 0)
#   1 — 网络 / jq 解析失败 / state.json 损坏

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${SCRIPT_DIR}/state.json"
REPOS=("anthropics/claude-code" "openai/codex")

if ! command -v jq >/dev/null 2>&1; then
  echo "fetch-releases: jq is required" >&2
  exit 1
fi

if [ ! -f "$STATE_FILE" ]; then
  echo "fetch-releases: state file missing: $STATE_FILE" >&2
  exit 1
fi

auth_header=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  auth_header=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

for repo in "${REPOS[@]}"; do
  last_seen=$(jq -r --arg r "$repo" '.lastSeen[$r] // ""' "$STATE_FILE")

  # GitHub REST: /repos/{owner}/{repo}/releases?per_page=5
  # 5 已远超日常增量；超过 5 个未追则 last_seen 早就需要 reset
  resp=$(curl -sfL \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "${auth_header[@]}" \
    "https://api.github.com/repos/${repo}/releases?per_page=5" \
    || echo "[]")

  if [ -z "$resp" ] || [ "$resp" = "[]" ]; then
    continue
  fi

  # 按发布时间倒序; 找出 tag_name > last_seen 的所有 release
  # GitHub 默认按 created_at 倒序; 我们再按 published_at 排正序输出, 便于按时间 commit
  echo "$resp" | jq -c --arg repo "$repo" --arg seen "$last_seen" '
    [ .[]
      | select(.draft == false)
      | select(.prerelease == false)
      | select(.tag_name != $seen)
    ]
    | sort_by(.published_at)
    | .[]
    | {
        repo: $repo,
        tag: .tag_name,
        name: .name,
        body: .body,
        html_url: .html_url,
        published_at: .published_at
      }
  '
done
