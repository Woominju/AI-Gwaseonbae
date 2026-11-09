import "server-only";
/**
 * 평가 실행기.
 *  - 검색 비교: 키워드(BM25) / 로컬 n-gram·개념 / 임베딩(bge-m3) / 임베딩+리랭커 / 개인화 하이브리드 S(x,e)
 *    지표: P@3, Recall@5, nDCG@5, MRR, 평균 지연(ms)
 *  - 응답 비교: 시스템 A(비개인화 일반 답변) / B(선배 경험 검색) / C(개인화+그래프·비교 엔진)
 *    자동 대리 지표(사람 평가 아님): 근거 수, 인용 유효성, 근거 충실도, 개인화 반영, 근거부족 처리, 비교 균형성
 * 결과는 web/data/runtime/eval_runs/*.json 에 저장된다.
 */
import fs from "node:fs";
import path from "node:path";
import { getAllRecords } from "../data/repository.server";
import { recordToText } from "../data/records";
import { buildBM25, buildLocalSemantic, calibrateEmbedding } from "../retrieval/local";
import { embeddingScores, semanticScores } from "../retrieval/service";
import { rerank, mlHealth } from "../retrieval/mlClient";
import { rankRecords } from "../scoring";
import { runChat } from "../chat/orchestrator";
import { ANSWER_QUESTIONS, DEMO_PROFILE, RETRIEVAL_QUESTIONS } from "./questions";

export const EVAL_DIR = path.join(process.cwd(), "data", "runtime", "eval_runs");

function metrics(ranked: string[], rel: string[]) {
  const R = new Set(rel);
  const p3 = ranked.slice(0, 3).filter((x) => R.has(x)).length / 3;
  const r5 = ranked.slice(0, 5).filter((x) => R.has(x)).length / R.size;
  const dcg = ranked.slice(0, 5).reduce((a, x, i) => a + (R.has(x) ? 1 / Math.log2(i + 2) : 0), 0);
  const idcg = [...Array(Math.min(5, R.size))].reduce((a, _, i) => a + 1 / Math.log2(i + 2), 0);
  const first = ranked.findIndex((x) => R.has(x));
  return { p3, r5, ndcg5: idcg ? dcg / idcg : 0, mrr: first >= 0 ? 1 / (first + 1) : 0 };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sortIds = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);

export type RetrievalMethodId = "keyword_bm25" | "local_semantic" | "embedding" | "embedding_rerank" | "hybrid_personalized";

export async function runRetrievalEval() {
  const records = getAllRecords().filter((r) => r.is_synthetic);
  const docs = records.map((r) => ({ id: r.record_id, text: recordToText(r) }));
  const bm25 = buildBM25(docs);
  const local = buildLocalSemantic(docs);
  const ml = (await mlHealth(true)).ok;
  const methods: Record<RetrievalMethodId, (q: string) => Promise<Map<string, number> | null>> = {
    keyword_bm25: async (q) => bm25(q),
    local_semantic: async (q) => local(q),
    embedding: async (q) => (ml ? embeddingScores(q, records) : null),
    embedding_rerank: async (q) => {
      if (!ml) return null;
      const cos = await embeddingScores(q, records);
      const rr = await rerank(q, docs.map((d) => d.text));
      if (!cos || !rr) return null;
      return new Map(records.map((r, i) => [r.record_id, 0.5 * calibrateEmbedding(cos.get(r.record_id) ?? 0) + 0.5 * rr[i]]));
    },
    // 검색 질문에는 학생 프로필이 없으므로, 질문만으로 계산 가능한 항목(의미·진로·역량·근거)으로 S(x,e)를 계산
    hybrid_personalized: async (q) => {
      const sem = await semanticScores(q, records, "auto");
      const { analyzeQuestion } = await import("../chat/intent");
      const a = analyzeQuestion(q);
      const ranked = rankRecords({ interest_fields: a.fields, skills: [], career_types: [], values: [], department: a.departments[0] }, records, sem.scores, sem.method);
      return new Map(ranked.map((m) => [m.record_id, m.score]));
    },
  };
  const out: Record<string, { available: boolean; p3: number; r5: number; ndcg5: number; mrr: number; ms: number; per_question: { id: string; top5: string[]; p3: number; mrr: number }[] }> = {};
  for (const [id, fn] of Object.entries(methods)) {
    const per: { id: string; top5: string[]; p3: number; r5: number; ndcg5: number; mrr: number; ms: number }[] = [];
    let available = true;
    // 워밍업 (캐시·모델 로딩 시간이 지연 측정에 섞이지 않도록)
    await fn(RETRIEVAL_QUESTIONS[0].question);
    for (const q of RETRIEVAL_QUESTIONS) {
      const t0 = performance.now();
      const s = await fn(q.question);
      const ms = performance.now() - t0;
      if (!s) {
        available = false;
        break;
      }
      const ranked = sortIds(s);
      per.push({ id: q.id, top5: ranked.slice(0, 5), ...metrics(ranked, q.relevant), ms });
    }
    out[id] = {
      available,
      p3: avg(per.map((x) => x.p3)),
      r5: avg(per.map((x) => x.r5)),
      ndcg5: avg(per.map((x) => x.ndcg5)),
      mrr: avg(per.map((x) => x.mrr)),
      ms: avg(per.map((x) => x.ms)),
      per_question: per.map(({ id, top5, p3, mrr }) => ({ id, top5, p3, mrr })),
    };
  }
  return { kind: "retrieval" as const, n_questions: RETRIEVAL_QUESTIONS.length, n_records: records.length, ml_available: ml, methods: out };
}

export async function runAnswerEval(opts: { useLLM?: boolean } = {}) {
  const rows: Record<string, unknown>[] = [];
  for (const sys of ["A", "B", "C"] as const) {
    for (const q of ANSWER_QUESTIONS) {
      const t0 = performance.now();
      const r = await runChat({ question: q.question, profile: DEMO_PROFILE, system: sys, force_demo: !opts.useLLM, multi_perspective: false });
      const ms = performance.now() - t0;
      const evIds = r.evidence.map((e) => e.record_id);
      const cited = r.citation_check.cited;
      const rel = new Set(q.relevant);
      const faith = cited.length && rel.size ? cited.filter((c) => rel.has(c)).length / cited.length : null;
      const personalized = /수학과|AI·머신러닝|데이터 사이언스/.test(r.answer);
      const refusalOk = q.expect_refusal
        ? (r.insufficient_evidence || r.official.required) && !/\d{3,}\s*만\s*원|\d+\s*학점\s*(이|입니다|이상)/.test(r.answer) && !r.answer.includes("근거 기반 상담 도우미다")
        : null;
      const balance =
        q.kind === "compare" ? (r.comparison ? (r.comparison.options.every((o) => o.evidence_record_ids.length > 0) ? 1 : 0.5) : /대학원/.test(r.answer) && /취업/.test(r.answer) ? 0.5 : 0) : null;
      rows.push({
        system: sys,
        id: q.id,
        kind: q.kind,
        provider: r.provider.id,
        evidence_n: evIds.length,
        cited_n: cited.length,
        citation_valid: r.citation_check.invalid_removed.length === 0,
        faithfulness: faith,
        personalized,
        refusal_ok: refusalOk,
        balance,
        ms: Math.round(ms),
      });
    }
  }
  const summarize = (sys: string) => {
    const xs = rows.filter((r) => r.system === sys);
    const nn = (k: string) => xs.map((x) => x[k]).filter((v) => v !== null && v !== undefined) as number[];
    const bool = (k: string) => xs.map((x) => x[k]).filter((v) => v !== null && v !== undefined).map((v) => (v ? 1 : 0));
    return {
      system: sys,
      mean_evidence: avg(nn("evidence_n")),
      mean_cited: avg(nn("cited_n")),
      faithfulness: avg(nn("faithfulness")),
      personalization_rate: avg(bool("personalized")),
      refusal_ok_rate: avg(bool("refusal_ok")),
      balance: avg(nn("balance")),
      mean_ms: avg(nn("ms")),
    };
  };
  return { kind: "answers" as const, generator: opts.useLLM ? "llm" : "demo_template", summary: ["A", "B", "C"].map(summarize), rows };
}

export function saveEvalRun(result: object): string {
  fs.mkdirSync(EVAL_DIR, { recursive: true });
  const name = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(path.join(EVAL_DIR, name), JSON.stringify({ created_at: new Date().toISOString(), ...result }, null, 2));
  return name;
}

export function listEvalRuns(): { file: string; kind: string; created_at: string }[] {
  try {
    return fs
      .readdirSync(EVAL_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, 20)
      .map((f) => {
        const j = JSON.parse(fs.readFileSync(path.join(EVAL_DIR, f), "utf8"));
        return { file: f, kind: j.kind, created_at: j.created_at };
      });
  } catch {
    return [];
  }
}
