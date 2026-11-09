/**
 * 페르소나·블렌딩 실제 응답 측정.
 * 사용: EVAL_URL=http://127.0.0.1:3413 EVAL_ADMIN_TOKEN=<토큰> npx tsx scripts/eval-persona.ts [출력.json]
 * 자동 지표는 대리 지표다. 품질의 최종 판단은 사람이 원문을 읽어 확인해야 한다 (원문을 JSON 에 함께 저장).
 */
import fs from "node:fs";
import { numbersIn } from "../src/lib/counsel/guard";
import type { StyleSetting } from "../src/lib/counsel/styles";
import type { LoungeTurn } from "../src/lib/lounge/turn.server";

const URL = process.env.EVAL_URL ?? "http://127.0.0.1:3413";
const OUT = process.argv[2] ?? "persona_eval.json";
const REPEAT = Number(process.env.EVAL_REPEAT ?? 2);

const CONDITIONS: { name: string; style: StyleSetting }[] = [
  { name: "전략형", style: { primary: "strategy", secondary: null, primaryWeight: 100 } },
  { name: "분석형", style: { primary: "analysis", secondary: null, primaryWeight: 100 } },
  { name: "공감형", style: { primary: "empathy", secondary: null, primaryWeight: 100 } },
  { name: "도전형", style: { primary: "challenge", secondary: null, primaryWeight: 100 } },
  { name: "성찰형", style: { primary: "reflection", secondary: null, primaryWeight: 100 } },
  { name: "전략60+공감40", style: { primary: "strategy", secondary: "empathy", primaryWeight: 60 } },
  { name: "분석70+도전30", style: { primary: "analysis", secondary: "challenge", primaryWeight: 70 } },
  // 비중 변화 측정 (같은 두 스타일)
  { name: "전략50+공감50", style: { primary: "strategy", secondary: "empathy", primaryWeight: 50 } },
  { name: "전략80+공감20", style: { primary: "strategy", secondary: "empathy", primaryWeight: 80 } },
];

const PROFILE = { department: "수학과", year: 3, interest_fields: ["ai_ml", "data_science"], skills: ["python", "statistics"], career_types: [], values: [], weekly_hours: 12, has_internship: false, has_project: true };
const QUESTIONS = [
  "학점이 2.8인 수학과 학생인데 대학원과 취업 중 어떤 선택이 좋을까요?",
  "데이터 분석가가 되려면 지금부터 뭘 준비해야 할까요?",
  "제 현재 스펙에서 부족한 부분은 무엇인가요?",
  "인턴 경험이 없는데 AI 직무를 준비해도 될까요? 선배들은 어떻게 했나요?",
];

/** 스타일별 표지 표현 (차별성 대리 지표) */
const MARKERS: Record<string, RegExp> = {
  strategy: /단계|순서|일정|목표|시점|계획|마일스톤|점검/g,
  challenge: /시도|실험|도전|대안|다른 길|다시|막히|작게 해|부딪/g,
  empathy: /마음|괜찮|부담|고마|막막|힘들|천천히|걱정/g,
  analysis: /근거|표본|전제|비교|기준|해석|일반화|확인된|한계/g,
  reflection: /나에게|스스로|왜|어떤|무엇이|기준|가치|\?/g,
};
const ACTION = /(해 보세요|해보세요|적어 보|정해 보|시작해|만들어 보|찾아 보|물어보|확인해|정리해|골라|해 봐|해봐|적어 봐)/;

interface Row {
  question: string;
  condition: string;
  repeat: number;
  source: string | undefined;
  label: string | undefined;
  http_ms: number;
  timing: LoungeTurn["timing"];
  text: string;
  core_hash: string;
  evidence: string[];
  qa: string[];
  markers: Record<string, number>;
  has_action: boolean;
  mentions_profile: boolean;
  cites: string[];
  invalid_cites: string[];
  unknown_numbers: string[];
  notices: string[];
}

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
};

async function ask(question: string, style: StyleSetting): Promise<{ t: LoungeTurn; ms: number }> {
  const t0 = performance.now();
  const res = await fetch(`${URL}/api/lounge/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, profile: PROFILE, history: [], place: "hub", persona: "realistic", greeting: "polite", style }) });
  const t = (await res.json()) as LoungeTurn;
  if (!res.ok) throw new Error(JSON.stringify(t));
  return { t, ms: Math.round(performance.now() - t0) };
}

function jaccard(a: string, b: string): number {
  const tok = (s: string) => new Set(s.replace(/\[[A-Z]-\d+\]/g, "").split(/[\s,.?!]+/).filter((x) => x.length > 1));
  const A = tok(a), B = tok(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / (A.size + B.size - inter || 1);
}

const median = (x: number[]) => { const s = [...x].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

async function main() {
  // EVAL_ONLY: 일부 조건만 측정 (정규식)
  if (process.env.EVAL_ONLY) { const re = new RegExp(process.env.EVAL_ONLY); for (let i = CONDITIONS.length - 1; i >= 0; i--) if (!re.test(CONDITIONS[i].name)) CONDITIONS.splice(i, 1); }
  const admin = process.env.EVAL_ADMIN_TOKEN;
  if (admin) {
    const r = await fetch(`${URL}/api/admin/ai-demo`, { method: "POST", headers: { "content-type": "application/json", "x-admin-token": admin }, body: JSON.stringify({ minutes: 120 }) });
    console.log("ai-demo start", r.status);
  }
  const rows: Row[] = [];
  for (const question of QUESTIONS) {
    for (const c of CONDITIONS) {
      for (let repeat = 0; repeat < REPEAT; repeat++) {
        const { t, ms } = await ask(question, c.style);
        const text = t.persona_view?.text ?? "";
        const core = t.core!;
        const allowed = new Set([...core.evidence.map((e) => e.record_id), ...core.qa.map((q) => q.id)]);
        const cites = [...text.matchAll(/\[([A-Z]-\d+)\]/g)].map((m) => m[1]);
        const ctxNumbers = numbersIn(JSON.stringify({ a: core.answer, e: core.evidence, c: core.comparison, p: PROFILE, d: t.decision }));
        const markers = Object.fromEntries(Object.entries(MARKERS).map(([k, re]) => [k, (text.match(re) ?? []).length]));
        rows.push({
          question, condition: c.name, repeat, source: t.persona_view?.source, label: t.persona_view?.label, http_ms: ms, timing: t.timing, text,
          core_hash: hash(core.answer), evidence: core.evidence.map((e) => e.record_id), qa: core.qa.map((q) => q.id), markers,
          has_action: ACTION.test(text), mentions_profile: /수학|3학년|12시간|파이썬|Python|통계|인턴|프로젝트|2\.8/.test(text),
          cites, invalid_cites: cites.filter((x) => !allowed.has(x)), unknown_numbers: [...numbersIn(text)].filter((n) => !ctxNumbers.has(n)), notices: [...(t.notices ?? []), ...core.notices],
        });
        console.log(`${c.name} r${repeat} ${t.persona_view?.source} ${ms}ms cached=${t.timing?.core_cached} calls=${t.timing?.llm_calls}`);
      }
    }
  }

  const summary = Object.fromEntries(CONDITIONS.map((c) => {
    const r = rows.filter((x) => x.condition === c.name);
    const fresh = r.filter((x) => !x.timing?.core_cached);
    const cached = r.filter((x) => x.timing?.core_cached);
    return [c.name, {
      n: r.length, llm_rate: r.filter((x) => x.source === "llm").length / r.length,
      median_ms_core_miss: median(fresh.map((x) => x.http_ms)), median_ms_core_hit: median(cached.map((x) => x.http_ms)),
      median_chars: median(r.map((x) => x.text.length)), action_rate: r.filter((x) => x.has_action).length / r.length, profile_rate: r.filter((x) => x.mentions_profile).length / r.length,
      invalid_cites: r.reduce((s, x) => s + x.invalid_cites.length, 0), guard_rejects: r.reduce((s, x) => s + (x.timing?.guard_issues ? 1 : 0), 0), mean_markers: Object.fromEntries(Object.keys(MARKERS).map((k) => [k, +(r.reduce((s, x) => s + x.markers[k], 0) / r.length).toFixed(2)])),
    }];
  }));

  const perQ = QUESTIONS.map((q) => {
    const r = rows.filter((x) => x.question === q);
    const singles = CONDITIONS.slice(0, 5).map((c) => r.find((x) => x.condition === c.name && x.repeat === 0)).filter((x): x is Row => !!x);
    const sims: number[] = [];
    for (let i = 0; i < singles.length; i++) for (let j = i + 1; j < singles.length; j++) sims.push(jaccard(singles[i].text, singles[j].text));
    const repeatSims = CONDITIONS.map((c) => { const [a, b] = r.filter((x) => x.condition === c.name); return a && b ? jaccard(a.text, b.text) : null; }).filter((x): x is number => x !== null);
    return { question: q, same_core: new Set(r.map((x) => x.core_hash)).size === 1, same_evidence: new Set(r.map((x) => x.evidence.join())).size === 1, same_qa: new Set(r.map((x) => x.qa.join())).size === 1, mean_pair_jaccard_styles: +(sims.reduce((a, b) => a + b, 0) / sims.length).toFixed(3), mean_repeat_jaccard_same_style: repeatSims.length ? +(repeatSims.reduce((a, b) => a + b, 0) / repeatSims.length).toFixed(3) : null };
  });

  fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), url: URL, profile: PROFILE, summary, perQ, rows }, null, 1));
  console.log(JSON.stringify({ summary, perQ }, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
