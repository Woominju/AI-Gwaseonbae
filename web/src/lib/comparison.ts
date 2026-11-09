/**
 * Career Scenario Explorer — 진로 선택지 비교 엔진 (순수 함수).
 *
 * 각 선택지(예: 대학원 진학 vs 학부 졸업 후 취업)에 대해
 *   1) 학생과 관련성이 높은 선배 기록(근거)을 고르고
 *   2) 6개 의사결정 기준의 값을 근거 기록·학생 프로필에서 계산한 뒤
 *   3) 학생의 우선순위 가중치로 가중합한다.
 * 우선순위가 바뀌면 3)의 가중치가 바뀌어 순위·결정 요인이 실제로 재계산된다.
 *
 * '우선순위 적합도'는 학생이 고른 가치 기준에 비춘 상대 비교값이며, 미래 결과의 예측·확률이 아니다.
 */
import type { ComparisonOption, ComparisonResult, CriterionKey, MatchResult, OptionCriterionScore, PathType, PriorityWeights, SeniorRecord, StudentProfile } from "./types";
import { canonicalSkill, skillLabel, skillRelatedness } from "./taxonomy";
import { coreSkillsForFields, fastnessOf } from "./scoring";

export const CRITERIA: { key: CriterionKey; label: string; description: string }[] = [
  { key: "research_depth", label: "연구 전문성", description: "깊이 있는 연구·방법론 전문성을 쌓을 수 있는 정도" },
  { key: "time_to_income", label: "빠른 경제적 독립", description: "졸업 후 첫 직무(수입)까지 걸린 기간 — 근거 기록의 중앙값" },
  { key: "flexibility", label: "진로 유연성", description: "이후 다른 진로로 전환하거나 선택지를 유지하기 쉬운 정도" },
  { key: "readiness_fit", label: "현재 준비도 적합", description: "학생의 현재 역량·경험이 이 경로 선배들의 역량과 겹치는 정도" },
  { key: "financial_burden", label: "경제적 부담 낮음", description: "선배 기록에서 경제적 부담이 언급된 비율의 역수" },
  { key: "evidence_support", label: "근거 충분성", description: "학생과 관련성 높은 선배 기록의 수와 관련도" },
];

export const CRITERION_LABEL = Object.fromEntries(CRITERIA.map((c) => [c.key, c.label])) as Record<CriterionKey, string>;

export const PRIORITY_PRESETS: { id: string; label: string; weights: PriorityWeights }[] = [
  { id: "research", label: "연구 전문성 우선", weights: { research_depth: 0.4, time_to_income: 0.05, flexibility: 0.1, readiness_fit: 0.2, financial_burden: 0.1, evidence_support: 0.15 } },
  { id: "fast_job", label: "빠른 취업·경제적 독립 우선", weights: { research_depth: 0.05, time_to_income: 0.4, flexibility: 0.1, readiness_fit: 0.2, financial_burden: 0.15, evidence_support: 0.1 } },
  { id: "keep_options", label: "다양한 진로 가능성 유지", weights: { research_depth: 0.1, time_to_income: 0.15, flexibility: 0.4, readiness_fit: 0.15, financial_burden: 0.1, evidence_support: 0.1 } },
  { id: "balanced", label: "균형", weights: { research_depth: 1 / 6, time_to_income: 1 / 6, flexibility: 1 / 6, readiness_fit: 1 / 6, financial_burden: 1 / 6, evidence_support: 1 / 6 } },
];

export interface OptionDef {
  id: string;
  title: string;
  path_types: PathType[];
  summary: string;
  /** 연구 전문성 기본값 — 설계 가정 (근거 기록과 50:50 혼합) */
  research_prior: number;
  /** 진로 유연성 기본값 — 설계 가정 (근거 기록과 50:50 혼합) */
  flexibility_prior: number;
  generic_pros: string[];
  generic_risks: string[];
  to_verify: string[];
}

export const OPTION_DEFS: OptionDef[] = [
  {
    id: "graduate",
    title: "경로 A · 대학원 진학",
    path_types: ["graduate_school"],
    summary: "석사(또는 박사) 과정에서 연구 경험과 방법론 전문성을 쌓은 뒤 연구·전문 직무로 진출",
    research_prior: 0.9,
    flexibility_prior: 0.5,
    generic_pros: ["연구 경력이 요구되는 직무에 지원할 수 있는 자격을 갖출 수 있음", "한 분야를 깊게 공부할 시간이 확보됨"],
    generic_risks: ["학위 기간 동안 수입이 제한적일 수 있음", "연구실·지도교수와의 적합도에 따라 경험 차이가 큼"],
    to_verify: ["관심 연구실의 연구 주제와 모집 계획 (연구실·학과 공식 안내 확인)", "대학원 장학금·연구비 지원 조건 (학교 공식 공지 확인)", "목표 직무가 실제로 석사 이상을 요구하는지 (채용 공고 확인)"],
  },
  {
    id: "employment",
    title: "경로 B · 학부 졸업 후 취업",
    path_types: ["industry_job", "finance", "foreign_company", "career_switch"],
    summary: "학부 졸업 후 기업에 입사해 실무 경험을 쌓고, 필요하면 이후 대학원을 재검토",
    research_prior: 0.3,
    flexibility_prior: 0.65,
    generic_pros: ["실무 경험과 수입을 비교적 빨리 얻을 수 있음", "현업에서 필요한 문제를 경험한 뒤 대학원을 다시 판단할 수 있음"],
    generic_risks: ["연구 중심 직무는 학위 요건 때문에 지원이 제한될 수 있음", "구현·실무 역량을 포트폴리오로 증명해야 함"],
    to_verify: ["희망 직무 채용 공고의 실제 자격 요건", "경력개발센터의 인턴십·현장실습 프로그램 (학교 공식 안내 확인)"],
  },
  {
    id: "public",
    title: "경로 C · 공공기관",
    path_types: ["public_sector"],
    summary: "공공기관의 통계·국제협력 등 직무로 진출",
    research_prior: 0.25,
    flexibility_prior: 0.4,
    generic_pros: ["고용 안정성을 중시하는 경우 고려할 수 있음"],
    generic_risks: ["필기시험 준비 기간이 길어질 수 있음", "채용 인원이 기관별로 적을 수 있음"],
    to_verify: ["기관별 채용 공고와 직무기술서 (공식 공고 확인)"],
  },
];

export function getOptionDefs(ids: string[]): OptionDef[] {
  const out = ids.map((id) => OPTION_DEFS.find((o) => o.id === id)).filter(Boolean) as OptionDef[];
  return out.length >= 2 ? out : OPTION_DEFS.slice(0, 2);
}

export function normalizePriorities(p: PriorityWeights): PriorityWeights {
  const sum = Object.values(p).reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...PRIORITY_PRESETS[3].weights };
  return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v / sum])) as PriorityWeights;
}

/** 프리셋 + 학생 제약조건으로 초기 우선순위 계산 (조정 내역도 반환) */
export function derivePriorities(profile: StudentProfile, presetId: string): { weights: PriorityWeights; adjustments: string[] } {
  const base = { ...(PRIORITY_PRESETS.find((p) => p.id === presetId) ?? PRIORITY_PRESETS[3]).weights };
  const adjustments: string[] = [];
  if (profile.financial_constraint === "strong") {
    base.financial_burden += 0.1;
    adjustments.push("경제적 제약 '큼' 입력 → '경제적 부담 낮음' 기준 가중치 +0.10");
  } else if (profile.financial_constraint === "some") {
    base.financial_burden += 0.05;
    adjustments.push("경제적 제약 '있음' 입력 → '경제적 부담 낮음' 기준 가중치 +0.05");
  }
  return { weights: normalizePriorities(base), adjustments };
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const STRAIN = ["경제적 부담", "학위 기간 수입 감소", "장기 학위"];

export interface CompareInput {
  profile: StudentProfile;
  records: SeniorRecord[];
  matches: MatchResult[]; // rankRecords 결과 (학생-선배 관련성)
  priorities: PriorityWeights;
  optionIds?: string[];
  evidencePerOption?: number;
}

export function compareOptions(input: CompareInput): ComparisonResult {
  const { profile, records, matches } = input;
  const pri = normalizePriorities(input.priorities);
  const defs = getOptionDefs(input.optionIds ?? ["graduate", "employment"]);
  const k = input.evidencePerOption ?? 4;
  const scoreOf = new Map(matches.map((m) => [m.record_id, m.score]));
  const mySkills = [...new Set(profile.skills.map(canonicalSkill))];
  const notes: string[] = [];

  const options: ComparisonOption[] = defs.map((def) => {
    const pool = records
      .filter((r) => def.path_types.includes(r.path_type))
      .map((r) => ({ r, s: scoreOf.get(r.record_id) ?? 0 }))
      .sort((a, b) => b.s - a.s);
    const ev = pool.filter((x) => x.s >= 0.3).slice(0, k);
    const evRecs = ev.map((x) => x.r);

    // 연구 전문성: 설계 가정 50% + 근거 기록(대학원 학위/연구 경험/연구 지향 태그) 50%
    const researchData = evRecs.length
      ? mean(evRecs.map((r) => (r.academic_background.graduate_degree ? 1 : r.projects.some((p) => p.kind === "research") || r.context_tags.includes("연구 지향") ? 0.5 : 0.15)))
      : null;
    const research: OptionCriterionScore =
      researchData === null
        ? { key: "research_depth", value: def.research_prior, basis: "assumption", explanation: "관련 근거 기록이 없어 설계 가정값만 사용" }
        : { key: "research_depth", value: 0.5 * def.research_prior + 0.5 * researchData, basis: "mixed", explanation: `설계 가정 ${def.research_prior.toFixed(2)} + 근거 기록의 연구 경험 비율 ${researchData.toFixed(2)}` };

    // 빠른 경제적 독립: 근거 기록의 '졸업 후 첫 직무까지 개월' 중앙값 (재학 중=null → 36개월로 간주)
    const months = evRecs.map((r) => r.months_to_first_role ?? 36);
    const med = median(months);
    const time: OptionCriterionScore =
      med === null
        ? { key: "time_to_income", value: 0.5, basis: "assumption", explanation: "근거 기록이 없어 중립값(0.5)" }
        : { key: "time_to_income", value: fastnessOf({ months_to_first_role: med } as SeniorRecord), basis: "data", explanation: `근거 기록 ${evRecs.length}건의 첫 직무까지 기간 중앙값 ${med}개월` };

    // 진로 유연성: 설계 가정 50% + ('선택지 유지' 태그 비율, 경로 내 분야 다양성) 50%
    const allOfPath = records.filter((r) => def.path_types.includes(r.path_type));
    const diversity = Math.min(1, new Set(allOfPath.flatMap((r) => r.career_field)).size / 6);
    const keepTag = evRecs.length ? evRecs.filter((r) => r.context_tags.includes("선택지 유지")).length / evRecs.length : 0;
    const flexData = 0.5 * diversity + 0.5 * keepTag;
    const flex: OptionCriterionScore = {
      key: "flexibility",
      value: 0.5 * def.flexibility_prior + 0.5 * flexData,
      basis: "mixed",
      explanation: `설계 가정 ${def.flexibility_prior.toFixed(2)} + 경로 내 진로 분야 다양성 ${diversity.toFixed(2)}·'선택지 유지' 진술 비율 ${keepTag.toFixed(2)}`,
    };

    // 현재 준비도: 근거 선배들의 핵심 역량(빈도순)과 학생 보유 역량의 관련도 + 경험 유형 일치
    const freq = new Map<string, number>();
    for (const r of evRecs) for (const s of r.key_skills) freq.set(s, (freq.get(s) ?? 0) + 1);
    let required = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 7);
    if (!required.length) required = coreSkillsForFields(profile.interest_fields).slice(0, 6);
    const skillFit = mySkills.length && required.length ? mean(required.map((t) => Math.max(0, ...mySkills.map((m) => skillRelatedness(m, t))))) : null;
    const missing = required.filter((t) => Math.max(0, ...mySkills.map((m) => skillRelatedness(m, t))) < 0.5);
    const expHit =
      def.id === "graduate"
        ? profile.has_research
          ? 1
          : profile.has_project
            ? 0.5
            : 0.2
        : profile.has_internship
          ? 1
          : profile.has_project
            ? 0.6
            : 0.2;
    const expKnown = profile.has_research !== undefined || profile.has_project !== undefined || profile.has_internship !== undefined;
    const readinessVal = skillFit === null ? (expKnown ? expHit : 0.5) : expKnown ? 0.7 * skillFit + 0.3 * expHit : skillFit;
    const readiness: OptionCriterionScore = {
      key: "readiness_fit",
      value: readinessVal,
      basis: skillFit === null && !expKnown ? "assumption" : "data",
      explanation:
        skillFit === null && !expKnown
          ? "보유 역량·경험이 입력되지 않아 중립값(0.5)"
          : `선배 핵심 역량 ${required.length}개 대비 보유 역량 관련도 ${skillFit === null ? "-" : skillFit.toFixed(2)}, 관련 경험 일치 ${expHit.toFixed(2)}`,
    };

    // 경제적 부담 낮음: 1 - (근거 기록 중 경제적 부담 언급 비율)
    const strainRatio = evRecs.length ? evRecs.filter((r) => r.context_tags.some((t) => STRAIN.includes(t))).length / evRecs.length : null;
    const fin: OptionCriterionScore =
      strainRatio === null
        ? { key: "financial_burden", value: 0.5, basis: "assumption", explanation: "근거 기록이 없어 중립값(0.5)" }
        : { key: "financial_burden", value: 1 - strainRatio, basis: "data", explanation: `근거 기록 중 경제적 부담 언급 ${(strainRatio * 100).toFixed(0)}%` };

    // 근거 충분성
    const support = Math.min(1, ev.length / k) * (ev.length ? mean(ev.map((x) => x.s)) / 0.8 : 0);
    const evid: OptionCriterionScore = {
      key: "evidence_support",
      value: Math.min(1, support),
      basis: "data",
      explanation: `관련 근거 기록 ${ev.length}건 (평균 관련도 ${ev.length ? mean(ev.map((x) => x.s)).toFixed(2) : "-"})`,
    };
    if (ev.length < 2) notes.push(`'${def.title}'은(는) 학생과 관련성 높은 선배 기록이 ${ev.length}건뿐이라 비교 근거가 부족합니다.`);

    const criteria = [research, time, flex, readiness, fin, evid];
    const weighted = criteria.reduce((a, c) => a + pri[c.key] * c.value, 0);

    const prep = [...new Set(evRecs.flatMap((r) => r.preparation_timeline.filter((t) => t.month_offset < 0).map((t) => t.activity)))].slice(0, 5);
    const evidencePros = evRecs.flatMap((r) => r.lessons_learned.slice(0, 1).map((l) => `[${r.record_id}] ${l}`)).slice(0, 2);
    const evidenceRisks = evRecs.flatMap((r) => r.difficulties.slice(0, 1).map((d) => `[${r.record_id}] ${d}`)).slice(0, 3);

    return {
      id: def.id,
      path_types: def.path_types,
      title: def.title,
      summary: def.summary,
      preparation: prep,
      required_skills: required.map(skillLabel),
      pros: [...def.generic_pros, ...evidencePros],
      risks: [...def.generic_risks, ...evidenceRisks],
      typical_months: med,
      criteria,
      weighted_score: weighted,
      evidence_record_ids: evRecs.map((r) => r.record_id),
      missing_skills: missing.map(skillLabel),
      to_verify: def.to_verify,
    };
  });

  const ranking = [...options].sort((a, b) => b.weighted_score - a.weighted_score).map((o) => o.id);
  const [o1, o2] = ranking.map((id) => options.find((o) => o.id === id)!);
  const decisive = o2
    ? (Object.keys(pri) as CriterionKey[])
        .map((key) => {
          const v1 = o1.criteria.find((c) => c.key === key)!.value;
          const v2 = o2.criteria.find((c) => c.key === key)!.value;
          return { key, delta: pri[key] * (v1 - v2) };
        })
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    : [];
  if (o2 && Math.abs(o1.weighted_score - o2.weighted_score) < 0.03) notes.push("두 선택지의 우선순위 적합도 차이가 매우 작습니다. 어느 한쪽이 낫다고 보기 어렵습니다.");
  notes.push("우선순위 적합도는 선택한 가치 기준에 따른 상대 비교값이며, 합격·취업 가능성이나 미래 결과의 예측이 아닙니다.");
  return { options, priorities: pri, ranking, decisive_criteria: decisive, notes };
}
