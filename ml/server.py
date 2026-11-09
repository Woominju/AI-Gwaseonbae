"""
HUFS Career Atlas — ML 사이드카 (임베딩 + 리랭커).

- POST /embed  {"texts": [...]}                -> {"vectors": [[...]], "model": ..., "ms": ...}
- POST /rerank {"query": str, "docs": [...]}  -> {"scores": [0~1], "raw": [...], "model": ..., "ms": ...}
- GET  /health

127.0.0.1 에만 바인딩한다. 외부 공개가 필요하면 리버스 프록시 + 인증을 별도로 둘 것.
GPU 는 실행 시 CUDA_DEVICE_ORDER=PCI_BUS_ID CUDA_VISIBLE_DEVICES=<예약한 GPU> 로 지정한다.
"""
from __future__ import annotations

import hashlib
import math
import os
import time
from collections import OrderedDict

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import CrossEncoder, SentenceTransformer

EMBED_MODEL = os.environ.get("EMBED_MODEL", "BAAI/bge-m3")
RERANK_MODEL = os.environ.get("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MAX_TEXTS = 256
MAX_CHARS = 4000

app = FastAPI(title="HUFS Career Atlas ML sidecar")

t0 = time.time()
embedder = SentenceTransformer(EMBED_MODEL, device=DEVICE, model_kwargs={"torch_dtype": torch.float16 if DEVICE == "cuda" else torch.float32})
reranker = CrossEncoder(RERANK_MODEL, device=DEVICE, max_length=1024, model_kwargs={"torch_dtype": torch.float16 if DEVICE == "cuda" else torch.float32})
LOAD_SEC = round(time.time() - t0, 1)

_cache: "OrderedDict[str, list[float]]" = OrderedDict()
_CACHE_MAX = 5000


def _key(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


class EmbedReq(BaseModel):
    texts: list[str] = Field(..., max_length=MAX_TEXTS)


class RerankReq(BaseModel):
    query: str
    docs: list[str] = Field(..., max_length=MAX_TEXTS)


@app.get("/health")
def health():
    return {
        "ok": True,
        "device": DEVICE,
        "gpu": torch.cuda.get_device_name(0) if DEVICE == "cuda" else None,
        "embed_model": EMBED_MODEL,
        "rerank_model": RERANK_MODEL,
        "load_sec": LOAD_SEC,
        "cache_size": len(_cache),
    }


@app.post("/embed")
def embed(req: EmbedReq):
    start = time.perf_counter()
    texts = [t[:MAX_CHARS] for t in req.texts]
    missing = [t for t in dict.fromkeys(texts) if _key(t) not in _cache]
    if missing:
        vecs = embedder.encode(missing, batch_size=32, normalize_embeddings=True, convert_to_numpy=True)
        for t, v in zip(missing, vecs):
            _cache[_key(t)] = [float(x) for x in v]
            if len(_cache) > _CACHE_MAX:
                _cache.popitem(last=False)
    out = [_cache[_key(t)] for t in texts]
    return {"vectors": out, "model": EMBED_MODEL, "ms": round((time.perf_counter() - start) * 1000, 1), "computed": len(missing)}


@app.post("/rerank")
def rerank(req: RerankReq):
    if not req.query.strip():
        raise HTTPException(400, "empty query")
    start = time.perf_counter()
    pairs = [(req.query[:MAX_CHARS], d[:MAX_CHARS]) for d in req.docs]
    # activation_fn=Identity 로 raw logit 을 받아 시그모이드로 0~1 변환
    raw = reranker.predict(pairs, batch_size=32, activation_fn=torch.nn.Identity(), convert_to_numpy=True)
    raw = [float(r) for r in raw]
    scores = [1.0 / (1.0 + math.exp(-r)) for r in raw]
    return {"scores": scores, "raw": raw, "model": RERANK_MODEL, "ms": round((time.perf_counter() - start) * 1000, 1)}
