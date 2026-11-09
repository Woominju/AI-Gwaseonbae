#!/usr/bin/env bash
# 웹 서버 (Next.js production). 127.0.0.1 에만 바인딩 → SSH 포트포워딩으로 접속.
# 사용: bash scripts/start_web.sh [port]   (빌드: cd web && npm run build)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f env.sh ] && source env.sh  # 선택: 프로젝트 전용 PATH·캐시 (env.sh.example 참고)
PORT="${1:-${WEB_PORT:-3100}}"
cd web
echo $$ > ../logs/web.pid
NEXT_TELEMETRY_DISABLED=1 exec npx next start -H 127.0.0.1 -p "$PORT"
