#!/usr/bin/env bash
# 로컬 LLM (vLLM OpenAI 호환 서버). 공용 GPU 서버에서는 사용 전 예약을 확인하세요.
# 사용: LLM_GPU=1 bash scripts/start_llm.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f env.sh ] && source env.sh  # 선택: 프로젝트 전용 PATH·캐시 (env.sh.example 참고)
export CUDA_DEVICE_ORDER=PCI_BUS_ID CUDA_VISIBLE_DEVICES="${LLM_GPU:-1}"
export PATH="$PWD/ml/.venv/bin:$PATH"  # ninja 등 JIT 빌드 도구
# venv 의 base python(conda)이 요구하는 libstdc++ 를 우선 사용
export LD_LIBRARY_PATH="$(dirname "$(readlink -f ml/.venv/bin/python)")/../lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
# 캐시를 vibe_coding 내부로 고정
export XDG_CACHE_HOME="$PWD/ml/.cache" VLLM_CACHE_ROOT="$PWD/ml/.cache/vllm" FLASHINFER_WORKSPACE_BASE="$PWD/ml/.cache"
# FlashInfer 샘플러 JIT 빌드가 이 서버에서 실패하므로 PyTorch 샘플러 사용
export VLLM_USE_FLASHINFER_SAMPLER=0
exec ml/.venv/bin/vllm serve "${LOCAL_LLM_MODEL:-Qwen/Qwen3-14B}" \
  --host 127.0.0.1 --port "${LLM_PORT:-8009}" \
  --served-model-name local-llm \
  --max-model-len 16384 --gpu-memory-utilization 0.88 \
  --dtype bfloat16
