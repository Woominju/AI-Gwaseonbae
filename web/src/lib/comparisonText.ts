/**
 * 진로 비교 수치 ↔ 설명 일관성 (3.0 버그 수정).
 *
 * 정의(types.ts OptionCriterionScore): value ∈ [0,1], **높을수록 학생에게 유리**.
 *   - "경제적 부담 낮음" 0.00 = 경제적 부담이 '큰' 편(불리)  ← 2.0에서 LLM이 반대로 서술한 사례
 *   - decisive_criteria.delta = 우선순위 가중치 × (1위 값 − 2위 값). 양수면 1위 경로에 유리하게 작용.
 * 숫자와 라벨만 LLM에 넘기면 라벨의 '낮음'과 숫자의 '낮음'이 섞여 해석이 반전될 수 있으므로,
 * 방향이 명시된 문장을 결정적으로 만들어 전달하고, 생성 후 반전 서술을 검사한다.
 */
import type { ComparisonResult, CriterionKey } from "./types";

type Band = "favorable" | "neutral" | "unfavorable";

export function band(v: number): Band {
  return v >= 0.67 ? "favorable" : v <= 0.33 ? "unfavorable" : "neutral";
}

const PHRASE: Record<CriterionKey, Record<Band, string>> = {
  research_depth: { favorable: "연구 전문성을 쌓기에 유리", neutral: "연구 전문성 측면은 중간", unfavorable: "연구 전문성 측면에서 불리" },
  time_to_income: { favorable: "첫 수입까지 비교적 빠름(유리)", neutral: "첫 수입까지 기간은 중간", unfavorable: "첫 수입까지 오래 걸리는 편(불리)" },
  flexibility: { favorable: "이후 진로 전환 여지가 큼(유리)", neutral: "진로 유연성은 중간", unfavorable: "진로 전환 여지가 작은 편(불리)" },
  readiness_fit: { favorable: "현재 준비도와 잘 맞음(유리)", neutral: "현재 준비도와의 겹침은 중간", unfavorable: "현재 준비도와 차이가 큼(불리)" },
  financial_burden: { favorable: "경제적 부담이 작은 편(유리)", neutral: "경제적 부담은 중간", unfavorable: "경제적 부담이 큰 편(불리)" },
  evidence_support: { favorable: "근거 선배 기록이 충분함", neutral: "근거 선배 기록은 보통", unfavorable: "근거 선배 기록이 부족함" },
};

/** 예: describeCriterion("financial_burden", 0) → "경제적 부담이 큰 편(불리) [값 0.00, 1에 가까울수록 유리]" */
export function describeCriterion(key: CriterionKey, v: number): string {
  return `${PHRASE[key][band(v)]} [값 ${v.toFixed(2)}, 1에 가까울수록 유리]`;
}

export const SCORE_SEMANTICS =
  "모든 기준값은 0~1이며 1에 가까울수록 학생에게 유리하다(예: '경제적 부담 낮음' 기준의 0.00은 경제적 부담이 크다는 뜻). 우선순위 적합도는 학생이 정한 가치 기준에 따른 상대 비교값이며 취업·합격 확률이나 예측이 아니다.";

/** LLM 분석 블록용 기준별 설명 줄 */
export function criterionLines(cmp: ComparisonResult, label: Record<CriterionKey, string>): string[] {
  return cmp.options.map((o) => `${o.title} 기준별 해석: ${o.criteria.map((c) => `${label[c.key]} → ${describeCriterion(c.key, c.value)}`).join("; ")}`);
}

export function decisiveLine(cmp: ComparisonResult, label: Record<CriterionKey, string>): string {
  const first = cmp.options.find((o) => o.id === cmp.ranking[0])?.title ?? "1위";
  return `결정 요인(양수 = '${first}'에 유리하게 작용, 음수 = 불리하게 작용): ${cmp.decisive_criteria
    .slice(0, 3)
    .map((d) => `${label[d.key]} ${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(2)}`)
    .join(", ")}`;
}

const STEM: Record<CriterionKey, RegExp> = {
  research_depth: /연구\s*전문성/,
  time_to_income: /경제적\s*독립|첫\s*(직무|수입)/,
  flexibility: /유연성/,
  readiness_fit: /준비도/,
  financial_burden: /경제적\s*부담/,
  evidence_support: /근거\s*(충분성|기록)/,
};

export interface ConsistencyIssue {
  option: string;
  key: CriterionKey;
  value: number;
  sentence: string;
}

/**
 * 생성된 답변에서 '기준 + 선택지'가 함께 언급된 문장의 방향이 계산값과 반대인지 검사.
 * 규칙 기반이므로 모든 오류를 잡지는 못한다(미탐 가능). 오탐을 줄이기 위해 라벨 원문은 제거 후 판정.
 */
export function checkConsistency(answer: string, cmp: ComparisonResult, label: Record<CriterionKey, string>): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const sentences = answer.split(/(?<=[.!?。])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  for (const o of cmp.options) {
    const short = o.title.replace(/^경로 [A-Z] · /, "");
    const optRe = new RegExp(short.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    for (const s of sentences) {
      const mentionsOther = cmp.options.some((x) => x !== o && new RegExp(x.title.replace(/^경로 [A-Z] · /, "").split(/\s+/)[0]).test(s));
      if (!optRe.test(s) || mentionsOther) continue; // 한 선택지만 언급한 문장만 판정 (귀속 모호성 회피)
      // 절 단위로 판정: 한 문장에 여러 기준이 섞이면('A는 유리하지만, B는 오래 걸림') 다른 절의 단어를 귀속하지 않는다
      const clauses = s.split(/,|，|지만|반면|그러나|하고\s|이고\s|으며|며\s|고\s/).map((x) => x.trim()).filter(Boolean);
      for (const c of o.criteria) {
        const clause = clauses.find((x) => STEM[c.key].test(x));
        if (!clause) continue;
        const t = clause.split(label[c.key]).join(" ");
        const b = band(c.value);
        let bad = false;
        if (c.key === "financial_burden") {
          if (b === "unfavorable" && /부담[이은는가도]?\s*(\S+\s*)?(낮|적|작|덜)/.test(t)) bad = true;
          if (b === "favorable" && /부담[이은는가도]?\s*(\S+\s*)?(높|크|많)/.test(t)) bad = true;
        } else if (c.key === "time_to_income") {
          if (b === "unfavorable" && /빠르|빨리|빠른|유리/.test(t)) bad = true;
          if (b === "favorable" && /오래|더\s*걸|늦|불리/.test(t)) bad = true;
        } else {
          if (b === "unfavorable" && /유리|강점|높은\s*(점수|수준)/.test(t)) bad = true;
          if (b === "favorable" && /불리|약점|낮은\s*(점수|수준)/.test(t)) bad = true;
        }
        if (bad) issues.push({ option: o.title, key: c.key, value: c.value, sentence: s.slice(0, 160) });
      }
    }
  }
  return issues;
}

/** 답변 끝에 붙이는 계산값 해석 (Markdown 목록 — 채팅 렌더러가 표를 지원하지 않으므로 목록 사용) */
export function interpretationTable(cmp: ComparisonResult, label: Record<CriterionKey, string>): string {
  const opts = cmp.ranking.map((id) => cmp.options.find((o) => o.id === id)!).filter(Boolean);
  const short = (t: string) => t.replace(/^경로 [A-Z] · /, "");
  const rows = opts[0].criteria.map((c) => `- **${label[c.key]}**: ${opts.map((o) => { const v = o.criteria.find((x) => x.key === c.key)!.value; return `${short(o.title)} ${v.toFixed(2)} · ${PHRASE[c.key][band(v)]}`; }).join(" / ")}`);
  return `**계산값 해석** (값은 0~1, 1에 가까울수록 유리 · 적합도는 확률·예측이 아닌 우선순위 기준 상대 비교값)\n\n${rows.join("\n")}`;
}
