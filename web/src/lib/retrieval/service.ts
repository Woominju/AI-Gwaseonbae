import "server-only";
/**
 * 의미 유사도 계산 서비스.
 *   auto              : ML 사이드카가 살아 있으면 embedding(+rerank), 아니면 로컬
 *   local             : 로컬 n-gram·개념 확장 (API·GPU 불필요)
 *   embedding         : bge-m3 코사인 (보정 후 0~1)
 *   embedding_rerank  : 0.5·임베딩 + 0.5·bge-reranker 점수
 */
import type { SeniorRecord, SemanticMethod } from "../types";
import { recordToText } from "../data/records";
import { buildLocalSemantic, calibrateEmbedding, calibrateLocal } from "./local";
import { embed, mlHealth, rerank } from "./mlClient";

export type RetrievalMode = "auto" | "local" | "embedding" | "embedding_rerank";

export interface SemanticOutput {
  scores: Map<string, number>;
  method: SemanticMethod;
  ms: number;
  fallback?: string;
}

const vecCache = new Map<string, number[]>();
let localIdx: { key: string; fn: (q: string) => Map<string, number> } | null = null;

function localScores(query: string, records: SeniorRecord[]): Map<string, number> {
  const key = records.map((r) => r.record_id).join(",");
  if (!localIdx || localIdx.key !== key) localIdx = { key, fn: buildLocalSemantic(records.map((r) => ({ id: r.record_id, text: recordToText(r) }))) };
  const raw = localIdx.fn(query);
  return new Map([...raw].map(([k, v]) => [k, calibrateLocal(v)]));
}

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

export async function embeddingScores(query: string, records: SeniorRecord[]): Promise<Map<string, number> | null> {
  const texts = records.map(recordToText);
  const need = texts.filter((t) => !vecCache.has(t));
  if (need.length) {
    const v = await embed(need);
    if (!v) return null;
    need.forEach((t, i) => vecCache.set(t, v[i]));
  }
  const q = await embed([query]);
  if (!q) return null;
  return new Map(records.map((r, i) => [r.record_id, dot(q[0], vecCache.get(texts[i])!)]));
}

/** 임의 문서 묶음의 의미 유사도 (Q&A 검색). 선배 기록과 같은 임베딩·리랭커·로컬 경로를 재사용한다 */
export async function textScores(query: string, docs: { id: string; text: string }[], mode: RetrievalMode = "auto"): Promise<SemanticOutput> {
  const t0 = performance.now();
  if (!query.trim() || !docs.length) return { scores: new Map(), method: "local_lexical_concept", ms: 0 };
  const h = mode === "local" ? { ok: false } : await mlHealth();
  if (h.ok) {
    const need = docs.map((d) => d.text).filter((t) => !vecCache.has(t));
    const v = need.length ? await embed(need) : [];
    const q = await embed([query]);
    if (v && q) {
      need.forEach((t, i) => vecCache.set(t, v[i]));
      const emb = docs.map((d) => calibrateEmbedding(dot(q[0], vecCache.get(d.text)!)));
      const rr = process.env.ENABLE_RERANK === "false" ? null : await rerank(query, docs.map((d) => d.text));
      if (rr) return { scores: new Map(docs.map((d, i) => [d.id, 0.5 * emb[i] + 0.5 * rr[i]])), method: "embedding_rerank", ms: performance.now() - t0 };
      return { scores: new Map(docs.map((d, i) => [d.id, emb[i]])), method: "embedding", ms: performance.now() - t0 };
    }
  }
  const raw = buildLocalSemantic(docs)(query);
  return { scores: new Map([...raw].map(([k, x]) => [k, calibrateLocal(x)])), method: "local_lexical_concept", ms: performance.now() - t0 };
}

export async function semanticScores(query: string, records: SeniorRecord[], mode: RetrievalMode = "auto"): Promise<SemanticOutput> {
  const t0 = performance.now();
  if (!query.trim()) return { scores: new Map(), method: "local_lexical_concept", ms: 0 };
  let want = mode;
  let fallback: string | undefined;
  if (mode === "auto") {
    const h = await mlHealth();
    want = h.ok ? (process.env.ENABLE_RERANK === "false" ? "embedding" : "embedding_rerank") : "local";
  }
  if (want === "embedding" || want === "embedding_rerank") {
    const cos = await embeddingScores(query, records);
    if (cos) {
      const emb = new Map([...cos].map(([k, v]) => [k, calibrateEmbedding(v)]));
      if (want === "embedding") return { scores: emb, method: "embedding", ms: performance.now() - t0 };
      const rr = await rerank(query, records.map(recordToText));
      if (rr) {
        const out = new Map(records.map((r, i) => [r.record_id, 0.5 * (emb.get(r.record_id) ?? 0) + 0.5 * rr[i]]));
        return { scores: out, method: "embedding_rerank", ms: performance.now() - t0 };
      }
      return { scores: emb, method: "embedding", ms: performance.now() - t0, fallback: "리랭커 응답 실패 → 임베딩만 사용" };
    }
    fallback = "ML 서비스 응답 실패 → 로컬 검색으로 대체";
  }
  return { scores: localScores(query, records), method: "local_lexical_concept", ms: performance.now() - t0, fallback };
}
