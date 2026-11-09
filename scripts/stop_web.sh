#!/usr/bin/env bash
# 이 프로젝트가 띄운 웹 서버만 종료 (포트 기준 PID 확인)
PORT="${1:-${WEB_PORT:-3100}}"
PID=$(ss -ltnp 2>/dev/null | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)
[ -n "$PID" ] && kill "$PID" && echo "stopped $PID" || echo "no server on $PORT"
