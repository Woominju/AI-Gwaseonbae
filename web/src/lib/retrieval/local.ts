/**
 * API·GPU 없이 동작하는 로컬 검색.
 *
 * 1) keywordBM25        — 어절(공백) 단위 BM25. 평가용 '단순 키워드 검색' 기준선.
 * 2) localSemantic      — 문자 2·3-gram TF-IDF + 개념 확장(taxonomy 동의어 → 분야/역량 개념 토큰)
 *                         코사인 유사도. 한국어 조사·어미 변화와 동의어(예: 인공지능↔AI)를 일부 흡수한다.
 *                         진짜 '의미' 임베딩은 아니므로 SemanticMethod = "local_lexical_concept" 로 표기한다.
 */
import { extractConcepts, normalizeText } from "../taxonomy";

export interface DocInput {
  id: string;
  text: string;
}

/* ---------- BM25 (keyword baseline) ---------- */

function wordTokens(text: string): string[] {
  return normalizeText(text).split(" ").filter((w) => w.length >= 1);
}

export function buildBM25(docs: DocInput[], k1 = 1.2, b = 0.75) {
  const toks = docs.map((d) => wordTokens(d.text));
  const avgdl = toks.reduce((a, t) => a + t.length, 0) / Math.max(1, toks.length);
  const df = new Map<string, number>();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) ?? 0) + 1);
  const N = docs.length;
  const tfs = toks.map((t) => {
    const m = new Map<string, number>();
    for (const w of t) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  });
  return function score(query: string): Map<string, number> {
    const q = [...new Set(wordTokens(query))];
    const out = new Map<string, number>();
    docs.forEach((d, i) => {
      let s = 0;
      for (const w of q) {
        const f = tfs[i].get(w);
        if (!f) continue;
        const n = df.get(w) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        s += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avgdl));
      }
      out.set(d.id, s);
    });
    return out;
  };
}

/* ---------- Local semantic (char n-gram + concept expansion) ---------- */

const CONCEPT_WEIGHT = 3.0; // 개념 토큰 가중 (설계 가정)

function charNgrams(text: string): string[] {
  const out: string[] = [];
  for (const w of normalizeText(text).split(" ")) {
    if (!w) continue;
    const s = `_${w}_`;
    for (const n of [2, 3]) for (let i = 0; i + n <= s.length; i++) out.push(s.slice(i, i + n));
  }
  return out;
}

function conceptTokens(text: string): string[] {
  const c = extractConcepts(text);
  return [...c.fields.map((f) => `#F:${f}`), ...c.skills.map((s) => `#S:${s}`), ...c.departments.map((d) => `#D:${d}`)];
}

type SparseVec = Map<string, number>;

function norm(v: SparseVec): number {
  let s = 0;
  for (const x of v.values()) s += x * x;
  return Math.sqrt(s);
}

export function cosine(a: SparseVec, b: SparseVec): number {
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [k, x] of small) {
    const y = big.get(k);
    if (y) dot += x * y;
  }
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot / d;
}

export function buildLocalSemantic(docs: DocInput[]) {
  const grams = docs.map((d) => charNgrams(d.text));
  const concepts = docs.map((d) => conceptTokens(d.text));
  const df = new Map<string, number>();
  for (let i = 0; i < docs.length; i++) for (const g of new Set([...grams[i], ...concepts[i]])) df.set(g, (df.get(g) ?? 0) + 1);
  const N = docs.length;
  const idf = (g: string) => Math.log((N + 1) / ((df.get(g) ?? 0) + 1)) + 1;

  const vec = (g: string[], c: string[]): SparseVec => {
    const v: SparseVec = new Map();
    for (const x of g) v.set(x, (v.get(x) ?? 0) + 1);
    for (const [k, tf] of v) v.set(k, (1 + Math.log(tf)) * idf(k));
    for (const x of new Set(c)) v.set(x, CONCEPT_WEIGHT * idf(x) * (1 + Math.log(1 + c.filter((y) => y === x).length)));
    return v;
  };
  const docVecs = docs.map((_, i) => vec(grams[i], concepts[i]));

  return function score(query: string): Map<string, number> {
    const qv = vec(charNgrams(query), conceptTokens(query));
    const out = new Map<string, number>();
    docs.forEach((d, i) => out.set(d.id, cosine(qv, docVecs[i])));
    return out;
  };
}

/**
 * 원시 코사인 → 0~1 보정. 로컬 방식의 코사인은 대체로 0.02~0.45 범위라
 * 고정 상한(0.45)으로 나누어 클리핑한다. 상한값은 시연 데이터로 정한 설계 가정이다.
 */
export function calibrateLocal(cos: number): number {
  return Math.max(0, Math.min(1, cos / 0.45));
}

/**
 * bge-m3 코사인 보정: 0.40 이하 → 0, 0.80 이상 → 1.
 * 시연 데이터에서 무관한 질의(예: "저녁 메뉴")의 코사인이 0.30~0.41, 관련 질의 상위가 0.6~0.75로
 * 관측되어 정한 값이다 (설계 가정, 실제 데이터로 재보정 필요).
 */
export function calibrateEmbedding(cos: number): number {
  return Math.max(0, Math.min(1, (cos - 0.4) / (0.8 - 0.4)));
}
