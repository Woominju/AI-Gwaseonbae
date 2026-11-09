#!/usr/bin/env bash
# AI 과선배 4.0 격리 검증 서버 관리.
#   start : 3410(기능 ON) · 3411(기능 OFF) · 3412(공개 시연 잠금) 기동, PID 기록
#   stop  : 이 스크립트가 기록한 PID 중 이 워크트리에서 실행된 프로세스만 종료
#   status: 기록된 PID 상태 출력
# 실제 서비스 포트(3100·3101·3200·3310·3320)와 터널은 사용하지 않는다.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_SH="$ROOT/env.sh"
if [ ! -f "$ENV_SH" ] && GITC="$(git -C "$ROOT" rev-parse --git-common-dir 2>/dev/null)"; then ENV_SH="$(cd "$ROOT" && cd "$GITC/.." && pwd)/env.sh"; fi
RUN="$ROOT/run/4.0"
mkdir -p "$RUN"
# shellcheck disable=SC1091
if [ -f "$ENV_SH" ]; then source "$ENV_SH"; fi

# 테스트용 임시 비밀값: 실행 시 생성, Git 제외 경로에 권한 600 으로만 보관
ensure_secrets() {
  if [ ! -f "$RUN/test.env" ]; then
    # ADMIN_TOKEN 은 E2E 스펙에 고정된 테스트 전용 값이다. 127.0.0.1 격리 서버 외에는 쓰지 않는다.
    (umask 077; { echo "SESSION_SECRET=$(openssl rand -hex 32)"; echo "ADMIN_TOKEN=test-admin-token-123456"; } > "$RUN/test.env")
  fi
  set -a; source "$RUN/test.env"; set +a
}

start_one() {
  local port="$1"; shift
  if ss -ltn "sport = :$port" | grep -q LISTEN; then echo "포트 $port 사용 중 — 기동하지 않음" >&2; return 1; fi
  (cd "$ROOT/web" && env "$@" LLM_PROVIDER="${LLM_PROVIDER_4_0:-demo}" ML_SERVICE_URL="" \
    setsid nohup node node_modules/next/dist/bin/next start -H 127.0.0.1 -p "$port" > "$RUN/web_$port.log" 2>&1 < /dev/null &)
  # next start 는 실제 서버를 자식 프로세스로 띄운다 → 포트를 실제로 점유한 PID 를 기록해야 종료할 수 있다
  local i pid=""
  for i in $(seq 1 60); do
    pid="$(ss -ltnpH "sport = :$port" | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2 || true)"
    [ -n "$pid" ] && break
    sleep 0.5
  done
  [ -n "$pid" ] || { echo "포트 $port 기동 실패: $RUN/web_$port.log 확인" >&2; return 1; }
  echo "$pid" > "$RUN/web_$port.pid"
  echo "started $port pid=$pid"
}

stop_one() {
  local f="$1" pid cwd
  pid="$(cat "$f")"
  cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
  if [ "$cwd" = "$ROOT/web" ]; then kill "$pid" && echo "stopped pid=$pid ($(basename "$f"))"; else echo "건너뜀 pid=$pid: 이 워크트리 프로세스가 아니거나 이미 종료됨"; fi
  rm -f "$f"
}

case "${1:-}" in
  start)
    ensure_secrets
    FLAGS=(FEATURE_CAMPUS_LOUNGE=1 FEATURE_CAREER_INTEL=1 FEATURE_ALUMNI_NETWORK=1 FEATURE_COURSE_GRAPH=1)
    start_one 3410 "${FLAGS[@]}" SESSION_SECRET="$SESSION_SECRET" ADMIN_TOKEN="$ADMIN_TOKEN"
    start_one 3411 SESSION_SECRET="$SESSION_SECRET" ADMIN_TOKEN="$ADMIN_TOKEN"
    start_one 3412 "${FLAGS[@]}" PUBLIC_DEMO=1 SESSION_SECRET="$SESSION_SECRET" ADMIN_TOKEN="$ADMIN_TOKEN"
    ;;
  start-ai)
    # 실제 LLM 검증 인스턴스 (AI 시연 게이트 ON). vLLM 을 물리 GPU 2번·포트 8029 로 먼저 띄워야 한다
    ensure_secrets
    LLM_PROVIDER_4_0=local start_one 3413 FEATURE_COURSE_GRAPH=1 FEATURE_CAMPUS_LOUNGE=1 FEATURE_CAREER_INTEL=1 FEATURE_ALUMNI_NETWORK=1 SESSION_SECRET="$SESSION_SECRET" ADMIN_TOKEN="$ADMIN_TOKEN" \
      AI_DEMO_GATE=1 LOCAL_LLM_BASE_URL=http://127.0.0.1:8029/v1 LOCAL_LLM_SERVED_NAME=local-llm AI_DEMO_MAX_PER_USER_10M=2000 AI_DEMO_MAX_REQUESTS=5000 AI_DEMO_MAX_CONCURRENCY=4
    ;;
  stop) for f in "$RUN"/web_*.pid; do [ -e "$f" ] && stop_one "$f"; done ;;
  status) for f in "$RUN"/web_*.pid; do [ -e "$f" ] && { p="$(cat "$f")"; echo "$(basename "$f") pid=$p cwd=$(readlink "/proc/$p/cwd" 2>/dev/null || echo 종료됨)"; }; done ;;
  *) echo "usage: $0 start|start-ai|stop|status" >&2; exit 2 ;;
esac
