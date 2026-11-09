#!/usr/bin/env bash
# GPU ML 사이드카 실행. 공용 GPU 서버에서는 사용 전 예약을 확인하세요.
# 사용: ML_GPU=0 bash scripts/start_ml.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f env.sh ] && source env.sh  # 선택: 프로젝트 전용 PATH·캐시 (env.sh.example 참고)
export CUDA_DEVICE_ORDER=PCI_BUS_ID CUDA_VISIBLE_DEVICES="${ML_GPU:-0}"
export XDG_CACHE_HOME="$PWD/ml/.cache"
cd ml && exec .venv/bin/uvicorn server:app --host 127.0.0.1 --port "${ML_PORT:-8008}"
