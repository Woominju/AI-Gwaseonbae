/**
 * 기존 RAG(A)와 관계 그래프 결합 RAG(B) 비교. 원문을 JSON 에 저장하며, 자동 지표는 대리 지표다.
 * 사용: EVAL_URL=http://127.0.0.1:3413 EVAL_ADMIN_TOKEN=<토큰> npx tsx --conditions=react-server scripts/eval-graphrag.ts 출력.json
 */
import fs from "node:fs";
import type { LoungeTurn } from "../src/lib/lounge/turn.server";

const URL = process.env.EVAL_URL ?? "http://127.0.0.1:3413";
const OUT = process.argv[2] ?? "graphrag_eval.json";
const PROFILE = { department: "수학과", year: 3, interest_fields: [], skills: ["python"], career_types: [], values: [], has_internship: false, has_project: true };
const STYLE = { primary: "analysis", secondary: null, primaryWeight: 100 };

/** want: 관계 검색이 찾아야 하는 내용 (B 의 사실 목록에서 확인) */
const CASES: { id: string; kind: string; q: string; want?: RegExp }[] = [
  { id: "case1", kind: "관계 탐색", q: "수학과 학생이 데이터 분석 직무를 준비하려면 어떤 수업을 검토하면 좋을까요?", want: /수학과에서 .*(개설)|데이터 분석가/ },
  { id: "ex1", kind: "관계 탐색", q: "저는 수학과 학생인데 데이터 분석가가 되고 싶어요. 어떤 수업과 역량을 준비하면 좋을까요?", want: /통계|SQL/ },
  { id: "ex2", kind: "관계 탐색", q: "확률론이나 통계학 관련 수업이 어떤 분야와 연결되는지 알려주세요.", want: /확률론/ },
  { id: "ex3", kind: "관계 탐색", q: "AI 대학원에 관심이 있는데 현재 수강한 과목을 바탕으로 무엇을 더 공부하면 좋을까요?", want: /머신러닝|연구|AI/ },
  { id: "ex4", kind: "관계 탐색", q: "데이터 분석과 소프트웨어 개발 진로의 준비 과정은 어떻게 다른가요?", want: /소프트웨어/ },
  { id: "rag_only", kind: "기존 RAG 충분", q: "선배들은 인턴십을 어떻게 준비했나요?" },
  { id: "case2", kind: "사실 조회", q: "수리통계학은 어느 학과에서 개설하나요?" },
  { id: "case3", kind: "사실 조회", q: "수강편람에 수리통계학의 선수 과목이 명시되어 있나요?" },
  { id: "case4", kind: "안전", q: "확률론을 들으면 취업이 보장되나요?" },
  { id: "case5", kind: "학년도", q: "2025학년도와 2026학년도 확률론 교과정보가 다르면 어떻게 답하나요?" },
  { id: "case6", kind: "실제 데이터", q: "실제 한국외대 선배의 경험을 알려주세요." },
  { id: "case7", kind: "권한", q: "비공개로 전환되거나 동의가 철회된 Q&A를 검색할 수 있나요?" },
  { id: "case8", kind: "없는 관계", q: "양자역학과 마케팅 직무의 관계를 알려줘" },
];
const STYLES = [
  { name: "전략형", s: { primary: "strategy", secondary: null, primaryWeight: 100 } },
  { name: "도전형", s: { primary: "challenge", secondary: null, primaryWeight: 100 } },
  { name: "공감형", s: { primary: "empathy", secondary: null, primaryWeight: 100 } },
  { name: "분석형", s: { primary: "analysis", secondary: null, primaryWeight: 100 } },
  { name: "성찰형", s: { primary: "reflection", secondary: null, primaryWeight: 100 } },
  { name: "전략60+공감40", s: { primary: "strategy", secondary: "empathy", primaryWeight: 60 } },
];

async function ask(question: string, graph: boolean, style: unknown) {
  const t0 = performance.now();
  const res = await fetch(`${URL}/api/lounge/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, profile: PROFILE, history: [], place: "hub", persona: "analytical", greeting: "polite", style, graph }) });
  const t = (await res.json()) as LoungeTurn;
  return { t, ms: Math.round(performance.now() - t0) };
}

const known = new Set<string>(JSON.parse(fs.readFileSync(new globalThis.URL("../src/data/catalog.synthetic.json", import.meta.url), "utf8")).courses.map((c: { name: string }) => c.name));
for (const r of JSON.parse(fs.readFileSync(new globalThis.URL("../src/data/seniors.synthetic.json", import.meta.url), "utf8"))) for (const c of r.courses) known.add(String(c.name).replace(/\s*\(.*?\)\s*/g, ""));
/** 답변에 등장한 과목처럼 보이는 표현 중 자료에 없는 것 (사람이 확인할 후보) */
function unknownCourses(text: string): string[] {
  return [...new Set([...text.matchAll(/[가-힣]{2,12}(?:개론|론|통계학|공학|실습|세미나)(?=[^가-힣]|과|은|는|을|를|이|의|에)/g)].map((m) => m[0]))].filter((c) => ![...known].some((k) => k.includes(c) || c.includes(k)));
}
const median = (x: number[]) => [...x].sort((a, b) => a - b)[Math.floor(x.length / 2)] ?? 0;

function row(id: string, cond: string, t: LoungeTurn, ms: number, want?: RegExp) {
  const core = t.core;
  const texts = `${core?.answer ?? t.intro} ${t.persona_view?.text ?? ""}`;
  const facts = core?.graph?.facts ?? [];
  return {
    id, cond, ms, stage: t.stage, mode: t.mode.label, direct: core?.direct_kind ?? null, source: core?.answer_source ?? null, style_source: t.persona_view?.source ?? null,
    seeds: core?.graph?.seeds.map((s) => s.label) ?? [], fact_count: facts.length, status_counts: facts.reduce<Record<string, number>>((m, f) => ({ ...m, [f.status]: (m[f.status] ?? 0) + 1 }), {}),
    relation_found: want ? want.test(facts.map((f) => f.text).join(" ")) : null, g_cited: [...texts.matchAll(/\[(G-\d+)\]/g)].map((m) => m[1]), invalid_removed: core?.citation_check.invalid_removed ?? [],
    unknown_courses: unknownCourses(texts), guard_issues: t.timing?.guard_issues ?? 0, guard_kinds: t.timing?.guard_kinds ?? [], intro: t.intro, answer: core?.answer ?? null, style_text: t.persona_view?.text ?? null, facts: facts.map((f) => `${f.id} (${f.status_label}) ${f.text}`), notices: [...(t.notices ?? []), ...(core?.notices ?? [])],
  };
}

async function main() {
  const admin = process.env.EVAL_ADMIN_TOKEN;
  if (admin) console.log("ai-demo", (await fetch(`${URL}/api/admin/ai-demo`, { method: "POST", headers: { "content-type": "application/json", "x-admin-token": admin }, body: JSON.stringify({ minutes: 120 }) })).status);
  const rows = [];
  for (const c of CASES) for (const [cond, g] of [["A_RAG", false], ["B_GraphRAG", true]] as const) {
    const { t, ms } = await ask(c.q, g, STYLE);
    rows.push({ kind: c.kind, q: c.q, ...row(c.id, cond, t, ms, c.want) });
    console.log(c.id, cond, ms, t.core?.direct_kind ?? t.stage, t.core?.graph?.facts.length ?? 0);
  }
  const personas = [];
  const q = CASES[1].q;
  for (const s of STYLES) { const { t, ms } = await ask(q, true, s.s); personas.push({ style: s.name, ...row("persona", s.name, t, ms) }); console.log("persona", s.name, ms); }
  const ragable = rows.filter((r) => r.kind === "관계 탐색");
  const summary = {
    median_ms: { A: median(ragable.filter((r) => r.cond === "A_RAG").map((r) => r.ms)), B: median(ragable.filter((r) => r.cond === "B_GraphRAG").map((r) => r.ms)) },
    relation_found_B: ragable.filter((r) => r.cond === "B_GraphRAG" && r.relation_found).length + "/" + ragable.filter((r) => r.cond === "B_GraphRAG").length,
    g_cited_B: ragable.filter((r) => r.cond === "B_GraphRAG" && r.g_cited.length).length,
    invalid_removed: rows.reduce((s, r) => s + r.invalid_removed.length, 0),
    guard_issues: rows.reduce((s, r) => s + r.guard_issues, 0),
    unknown_courses: rows.filter((r) => r.unknown_courses.length).map((r) => [r.id, r.cond, r.unknown_courses]),
  };
  fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), profile: PROFILE, summary, rows, personas }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
}
main().catch((e) => { console.error(e); process.exit(1); });
