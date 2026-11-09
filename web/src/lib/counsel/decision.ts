/**
 * 다중 관점 진로 비교 (Phase D): 비교 엔진의 계산값으로 '실제 선택'을 돕는 정리표를 만든다.
 * 스타일과 무관한 규칙 기반 출력이며 LLM 을 호출하지 않는다. Tree of Thoughts 구현이 아니다
 * (복수 후보 생성·평가·탐색 경로 수정이 없다. docs/RAG_QA_DESIGN_4_0.md 후속 연구 항목 참고).
 */
import type { ComparisonResult, StudentProfile } from "../types";

export interface DecisionOption {
  title: string;
  score: number;
  evidence: string[];
  months: number | null;
  pro: string;
  risk: string;
  missing: string[];
}

export interface DecisionBrief {
  options: DecisionOption[];
  /** 현실적인 조건 분석 */
  conditions: string[];
  /** 장기적인 준비 전략 */
  long_term: string[];
  /** 대안 탐색 */
  alternatives: string[];
  /** 본인이 중요하게 여기는 가치 확인 */
  values: string[];
  /** 추천 후속 행동 */
  next_actions: string[];
  /** 불확실성 */
  uncertainty: string[];
}

/** 질문에 적힌 학점(4.5 만점 가정 없이 값만 읽음) */
export function gpaInQuestion(q: string): number | null {
  const m = q.match(/(?:학점|GPA|평점)\s*(?:이|은|는|:)?\s*([0-4](?:\.\d{1,2})?)/i);
  return m ? Number(m[1]) : null;
}

export function buildDecisionBrief(cmp: ComparisonResult, profile: StudentProfile, question: string): DecisionBrief {
  const opts = cmp.ranking.map((id) => cmp.options.find((o) => o.id === id)!).filter(Boolean);
  const [first, second] = opts;
  const options: DecisionOption[] = opts.map((o) => ({
    title: o.title,
    score: o.weighted_score,
    evidence: o.evidence_record_ids,
    months: o.typical_months ?? null,
    pro: o.pros[0] ?? "-",
    risk: o.risks[0] ?? "-",
    missing: o.missing_skills.slice(0, 4),
  }));

  const conditions: string[] = [];
  const gpa = gpaInQuestion(question);
  if (gpa !== null) conditions.push(`학점 ${gpa}만으로 합격이나 취업 가능성을 판단할 수 없어요. 이 서비스는 학점으로 가능성을 계산하지 않으며, 지원 요건은 각 기관의 공식 모집 안내에서 확인해야 해요.`);
  for (const o of opts) if (o.missing_skills.length) conditions.push(`${o.title}: 프로필 기준 확인이 필요한 역량은 ${o.missing_skills.slice(0, 3).join(", ")}이에요.`);
  if (profile.has_internship === undefined && profile.has_project === undefined) conditions.push("인턴·프로젝트 경험을 프로필에 입력하면 조건을 더 구체적으로 비교할 수 있어요.");
  if (profile.weekly_hours) conditions.push(`주당 ${profile.weekly_hours}시간 기준이면 한 학기(약 16주)에 약 ${profile.weekly_hours * 16}시간을 쓸 수 있어요.`);

  const long_term = opts.map((o) => (o.typical_months != null ? `${o.title}: 근거 기록의 첫 직무까지 중앙값은 ${o.typical_months}개월이에요. 표본이 작으니 일정의 참고선으로만 보세요.` : `${o.title}: 근거 기록에서 기간을 확인할 수 없어, 공식 일정을 기준으로 계획을 세워야 해요.`));

  const alternatives: string[] = [];
  if (first && second) alternatives.push(`두 길을 동시에 끝까지 준비하기보다, 한 학기 동안 '${first.title}'을 주 경로로 두고 '${second.title}'은 작은 경험으로 시험해 볼 수 있어요.`);
  alternatives.push("결정을 미루는 것도 선택지예요. 다만 언제 무엇을 보고 결정할지 날짜와 기준을 정해 두세요.");

  const values = ["연구 자체에 흥미가 있는가, 아니면 학위가 필요한 직무를 원하는가?", "경제적 독립이 얼마나 빨리 필요한가?", "2~3년 뒤 어떤 일을 매일 하고 있기를 바라는가?"];

  const next_actions: string[] = [];
  const firstEv = first?.evidence_record_ids[0];
  if (firstEv) next_actions.push(`근거 기록 [${firstEv}]의 준비 과정을 읽어 보기`);
  next_actions.push("희망 대학원·채용 공고 2~3개의 공식 지원 요건을 표로 정리하기");
  if (first?.missing_skills[0]) next_actions.push(`${first.missing_skills[0]}을(를) 확인할 수 있는 작은 프로젝트 하나 정하기`);
  next_actions.push("실제 선배나 학교 진로 상담 창구에 지금 정리한 내용을 물어보기");

  const margin = first && second ? first.weighted_score - second.weighted_score : null;
  const uncertainty = [
    "비교 점수는 입력한 우선순위에 따른 적합도이며, 합격이나 성공 확률이 아니에요.",
    margin !== null && Math.abs(margin) < 0.05 ? `두 경로의 점수 차이가 ${Math.abs(margin).toFixed(2)}로 작아서, 우선순위를 조금만 바꿔도 순서가 달라질 수 있어요.` : "우선순위를 바꾸면 순서가 달라질 수 있어요.",
    "근거 수가 적고, 현재 선배 기록은 시연 데이터를 포함하므로 일반화할 수 없어요.",
  ];

  return { options, conditions, long_term, alternatives, values, next_actions, uncertainty };
}
