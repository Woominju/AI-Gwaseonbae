/**
 * 평가 CLI — 실행 중인 서버의 /api/eval 을 호출하고 결과를 ../results/eval/ 에 Markdown 으로 저장.
 * 사용: npm run eval -- [--base http://127.0.0.1:3100] [--llm]
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://127.0.0.1:3100";
const useLLM = args.includes("--llm");
const outDir = path.resolve(__dirname, "../../results/eval");

async function post(body: object) {
  const r = await fetch(`${base}/api/eval`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const f = (x: number | null | undefined) => (x === null || x === undefined ? "-" : x.toFixed(3));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const ret = await post({ kind: "retrieval" });
  const demo = await post({ kind: "answers", use_llm: false });
  const llm = useLLM ? await post({ kind: "answers", use_llm: true }) : null;
  const lines = [
    `# 평가 결과 (${new Date().toISOString()})`,
    "",
    "> 질문·정답 레이블은 개발자가 가상 시연 데이터로 직접 지정. 기능 점검용 실제 계산값이며 일반화된 성능 주장이 아님.",
    "",
    `## 검색 비교 (질문 ${ret.n_questions}, 기록 ${ret.n_records}, ML ${ret.ml_available ? "연결" : "미연결"}) — 원본: web/data/runtime/eval_runs/${ret.file}`,
    "",
    "| 방식 | P@3 | Recall@5 | nDCG@5 | MRR | 평균 지연(ms) |",
    "|---|---|---|---|---|---|",
    ...Object.entries(ret.methods as Record<string, { available: boolean; p3: number; r5: number; ndcg5: number; mrr: number; ms: number }>).map(([k, m]) =>
      m.available ? `| ${k} | ${f(m.p3)} | ${f(m.r5)} | ${f(m.ndcg5)} | ${f(m.mrr)} | ${m.ms.toFixed(1)} |` : `| ${k} | 사용 불가 | | | | |`,
    ),
  ];
  for (const a of [demo, llm].filter(Boolean)) {
    lines.push("", `## 응답 시스템 비교 — 생성: ${a.generator} — 원본: web/data/runtime/eval_runs/${a.file}`, "", "| 시스템 | 근거 수 | 인용 수 | 근거 충실도 | 개인화 | 근거부족 처리 | 비교 균형 | 평균 지연(ms) |", "|---|---|---|---|---|---|---|---|");
    for (const s of a.summary) lines.push(`| ${s.system} | ${f(s.mean_evidence)} | ${f(s.mean_cited)} | ${f(s.faithfulness)} | ${f(s.personalization_rate)} | ${f(s.refusal_ok_rate)} | ${f(s.balance)} | ${Math.round(s.mean_ms)} |`);
  }
  const out = path.join(outDir, `eval_${new Date().toISOString().replace(/[:.]/g, "-")}.md`);
  fs.writeFileSync(out, lines.join("\n") + "\n");
  console.log(lines.join("\n"));
  console.log(`\nsaved: ${out}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
