#!/usr/bin/env bash
# fetch-releases.sh — 抓 8 个 agent CLI/工具的最新 release
# REPOS 顺序与展示名必须与 src/lib/tools.ts 的 TOOLS 一致 —— 改一处记得改另一处。
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
# 顺序须与 src/lib/tools.ts 的 TOOLS 数组一致。
REPOS=(
  "anthropics/claude-code" "openai/codex"
  "google-gemini/gemini-cli" "Aider-AI/aider" "cline/cline"
  "block/goose" "sst/opencode" "RooCodeInc/Roo-Code"
)

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

  # GitHub REST: /repos/{owner}/{repo}/releases?per_page=15
  # 15(原 5): gemini-cli / codex 等以 prerelease(nightly/alpha)为主, draft+prerelease
  # 过滤后真 stable 可能被推到窗口末尾。取 15 留足余量, 避免一批全是 prerelease → []
  # 静默漏抓最新 stable; 同时 last_seen 掉队>15 才需 reset(罕见)。
  resp=$(curl -sfL \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "${auth_header[@]}" \
    "https://api.github.com/repos/${repo}/releases?per_page=15" \
    || echo "[]")

  if [ -z "$resp" ] || [ "$resp" = "[]" ]; then
    continue
  fi

  # 只输出比 last_seen "更新" 的 release。
  # 注意: 不能用 `tag_name != $seen` —— 那只排掉 last_seen 那一条, 其余(含已处理的旧版)
  # 每次都重新 emit → 每天重复摘要 + churn commit。改为按时间倒序定位 last_seen 的位置,
  # 只取它之前(更新)的那些。三种情形分流:
  #   $seen == ""  : 全新 repo(扩源首见)→ 只 seed 最新 1 条, 页面分组立即有内容又不刷屏
  #   $i == null   : 已知 repo 但 last_seen 掉出本批(断档 >15, 罕见)→ 全 emit 补齐
  #   else         : 常规 → 仅取比 last_seen 更新的那几条
  echo "$resp" | jq -c --arg repo "$repo" --arg seen "$last_seen" '
    [ .[]
      | select(.draft == false)
      | select(.prerelease == false)
    ]
    | sort_by(.published_at) | reverse
    | . as $rels
    | ([ $rels[].tag_name ] | index($seen)) as $i
    | (if $seen == "" then ($rels | .[0:1])
       elif $i == null then $rels
       else ($rels | .[0:$i]) end)
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
