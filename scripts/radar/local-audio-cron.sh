#!/usr/bin/env bash
# local-audio-cron.sh — GPU 情感播报音频生成 + 上线 (Windows Task Scheduler 每天 10:00 调)。
#
# CI (daily-radar.yml) 09:30CN 只提交 MDX + state.json + 部署 (文章快速上线, 不带音频)。
# 本脚本随后用 CosyVoice2 补带情感的音频, 仅当有新音频时再提交 + 部署一次。
# TTS 主路径 = R5 常驻服务 (office-debian-2, Quadro RTX 5000, systemd 自启, 鉴权 Bearer);
# 本机 WSL 服务已退役为可选回退 (设 COSY_URL=http://localhost:8123 即可切回)。
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

COSY_URL="${COSY_URL:-http://100.120.110.73:8123}"
# R5 服务开了 Bearer 鉴权; key 不进 git, 本机放 ~/.cosy_api_key (与 R5 /root/.cosy_api_key 同值)
COSY_API_KEY="${COSY_API_KEY:-$(cat "$HOME/.cosy_api_key" 2>/dev/null || true)}"

log() { printf '[cron] %s\n' "$*"; }

# 1. 同步最新内容 (CI 已提交当天 MDX)
log "git pull --ff-only"
git pull --ff-only || log "pull skipped (dirty/offline) — 继续用本地内容"

# 2. 探活 R5 常驻服务 (systemd 自启, 无需远程拉起; 偶发重启给 ~60s 余量)
log "probe $COSY_URL/healthz"
healthy=0
for i in $(seq 1 20); do
  if curl -fsS --max-time 3 "$COSY_URL/healthz" >/dev/null 2>&1; then
    healthy=1
    log "cosyvoice healthy (after $((i * 3))s)"
    break
  fi
  sleep 3
done
[ "$healthy" = 1 ] || log "cosyvoice not healthy → 生成器自带 fallback 退 edge-tts"

# 3. 生成音频 (cosy 版自带 fallback: COSY 不可达就退 edge-tts; 透传 --limit 等参数)
log "generate audio"
COSY_URL="$COSY_URL" COSY_API_KEY="$COSY_API_KEY" \
  bun run scripts/radar/tts-generate-cosy.ts "$@"

# 4. 仅当 public/audio/ 有变更才提交 + 部署 (含未暂存与已暂存)
if git diff --quiet -- public/audio/ && git diff --cached --quiet -- public/audio/; then
  log "no audio changes → nothing to ship"
  exit 0
fi

log "audio changed → commit + push + deploy"
git add public/audio/
git commit -m "chore(radar): CosyVoice2 emotion audio $(date -u +%Y-%m-%d)"
git push
# 复用 ship.sh 已登录的 vercel 态 (本项目 git push 不自动部署)。
bunx vercel --prod --yes
log "done"
