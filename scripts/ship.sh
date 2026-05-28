#!/usr/bin/env bash
# ship.sh — one-shot ship to Vercel for claude2master.com.
#
# Usage:
#   ./scripts/ship.sh "commit message"
#   ./scripts/ship.sh --no-checks "wip: quick fix"   # skip lint+build (use sparingly)
#
# What it does:
#   1. Show working-tree state
#   2. bun run lint && bun run build  (unless --no-checks)
#   3. Stage tracked changes + untracked files (excluding .env* / credentials*)
#   4. Print staged diff stat
#   5. Commit with the given message + Co-Authored-By trailer
#   6. Push to origin (Vercel auto-deploys ~30s after)
#
# Bash-only. Runs in Windows Git Bash (MSYS2) too.

set -euo pipefail

skip_checks=0
if [[ "${1:-}" == "--no-checks" ]]; then
  skip_checks=1
  shift
fi

msg="${1:-}"
if [[ -z "$msg" ]]; then
  echo "usage: ./scripts/ship.sh [--no-checks] \"commit message\"" >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

# 1. State snapshot
echo "── git status ──"
git status -s
if [[ -z "$(git status -s)" ]]; then
  echo "nothing to ship. exiting."
  exit 0
fi
echo

# 2. Checks
if [[ "$skip_checks" -eq 0 ]]; then
  echo "── bun run lint ──"
  bun run lint
  echo
  echo "── bun run build ──"
  bun run build
  echo
else
  echo "(skipping lint+build per --no-checks)"
  echo
fi

# 3. Stage — modified + untracked, minus sensitive paths.
staged=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  case "$f" in
    .env|.env.*|*credentials*|*.pem|*.key)
      echo "skip (sensitive): $f"
      continue
      ;;
  esac
  git add -- "$f"
  staged=$((staged+1))
done < <(git ls-files -m -o --exclude-standard)

if [[ "$staged" -eq 0 ]]; then
  echo "nothing safe to stage. exiting."
  exit 0
fi

# 4. Show what's going in
echo
echo "── staged diff ──"
git diff --cached --stat
echo

# 5. Commit
git commit -m "$(cat <<EOF
$msg

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"

# 6. Push
echo
echo "── pushing ──"
git push

echo
echo "✓ Pushed. Vercel auto-deploy ~30s. Check: bunx vercel ls --prod | head -5"
