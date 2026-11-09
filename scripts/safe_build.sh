#!/usr/bin/env bash
# 안전 빌드: 이 워크트리의 web/ 에서 next-server 가 실행 중이면 빌드를 거부한다.
# 실행 중인 서버 아래에서 .next 를 교체하면 기존 정적 파일이 400 이 되어 화면이 멈춘다 (docs/VALIDATION_4_0.md §1).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_SH="$ROOT/env.sh"
if [ ! -f "$ENV_SH" ] && GITC="$(git -C "$ROOT" rev-parse --git-common-dir 2>/dev/null)"; then ENV_SH="$(cd "$ROOT" && cd "$GITC/.." && pwd)/env.sh"; fi
for d in /proc/[0-9]*; do
  [ "$(readlink "$d/cwd" 2>/dev/null || true)" = "$ROOT/web" ] || continue
  if tr '\0' ' ' < "$d/cmdline" 2>/dev/null | grep -qE 'next-server|next start'; then
    echo "빌드 거부: 이 워크트리에서 서버가 실행 중입니다 (pid ${d#/proc/}). 먼저 중지하세요: bash scripts/test_servers_4_0.sh stop" >&2
    exit 1
  fi
done
# shellcheck disable=SC1091
if [ -f "$ENV_SH" ]; then source "$ENV_SH"; fi
cd "$ROOT/web" && npm run build
