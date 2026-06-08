#!/usr/bin/env bash
# local-audio-cron.sh — 本地 GPU 情感播报音频生成 + 上线 (Windows Task Scheduler 每天 10:00 调)。
#
# CI (daily-radar.yml) 09:30CN 只提交 MDX + state.json + 部署 (文章快速上线, 不带音频)。
# 本脚本随后在本机 (RTX 4070) 用 CosyVoice2 补带情感的音频, 仅当有新音频时再提交 + 部署一次。
#
# 幂等: 已有 mp3 跳过; 无新音频 → 不 commit 不部署。漏跑一天仅当天暂无新音频, 不报错。
#
# 安装为计划任务 (PowerShell / cmd, 一次性):
#   schtasks /Create /TN c2m-daily-audio /SC DAILY /ST 10:00 ^
#     /TR "C:\Program Files\Git\bin\bash.exe -lc 'scripts/radar/local-audio-cron.sh'"
#   # 补"开机即补跑" (PowerShell):
#   Set-ScheduledTask -TaskName c2m-daily-audio `
#     -Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_DIR"

WSL_DISTRO="${WSL_DISTRO:-Ubuntu-24.04}"
COSY_URL="${COSY_URL:-http://localhost:8123}"

log() { printf '[cron] %s\n' "$*"; }

# 1. 同步最新内容 (CI 已提交当天 MDX)
log "git pull --ff-only"
git pull --ff-only || log "pull skipped (dirty/offline) — 继续用本地内容"

# 2. 启动 WSL GPU 服务 (幂等: 已在跑则 no-op)
log "start cosyvoice.service in WSL ($WSL_DISTRO)"
wsl.exe -d "$WSL_DISTRO" -u root -- bash -lc \
  'loginctl enable-linger root >/dev/null 2>&1 || true; systemctl --user start cosyvoice 2>/dev/null || true' \
  || log "wsl start failed → 将回退 edge-tts"

# 3. 探活: 等模型加载 (冷启动 ~30-60s), 最多 ~120s
log "probe $COSY_URL/healthz"
healthy=0
for i in $(seq 1 40); do
  if curl -fsS --max-time 3 "$COSY_URL/healthz" >/dev/null 2>&1; then
    healthy=1
    log "cosyvoice healthy (after $((i * 3))s)"
    break
  fi
  sleep 3
done
[ "$healthy" = 1 ] || log "cosyvoice not healthy → 生成器自带 fallback 退 edge-tts"

# 4. 生成音频 (cosy 版自带 fallback: COSY 不可达就退 edge-tts; 透传 --limit 等参数)
log "generate audio"
COSY_URL="$COSY_URL" bun run scripts/radar/tts-generate-cosy.ts "$@"

# 5. 仅当 public/audio/ 有变更才提交 + 部署 (含未暂存与已暂存)
if git diff --quiet -- public/audio/ && git diff --cached --quiet -- public/audio/; then
  log "no audio changes → nothing to ship"
  exit 0
fi

log "audio changed → commit + push + deploy"
git add public/audio/
git commit -m "chore(radar): local CosyVoice2 emotion audio $(date -u +%Y-%m-%d)"
git push
# 复用 ship.sh 已登录的 vercel 态 (本项目 git push 不自动部署)。
bunx vercel --prod --yes
log "done"
