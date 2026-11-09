/**
 * Personalized Career Matching — 재현 가능한 점수 계산 모듈 (순수 함수).
 *
 *   S(x,e) = Σ_i w_i · s_i(x,e) / Σ_{i: s_i 계산 가능} w_i
 *
 *   기본 가중치: semantic .30 · career .25 · skill .20 · context .15 · evidence .10
 *   (설계 가정이며 학습·검증된 최적값이 아니다)
 *
 * 누락 데이터 처리 원칙
 *   - 학생 입력이 없어 계산할 수 없는 세부 점수는 0이 아니라 null(계산 불가)로 둔다.
 *   - 최종 점수는 계산 가능한 항목의 가중치만으로 재정규화한다.
 *   - coverage = (계산 가능한 항목의 가중치 합) / (전체 가중치 합) 을 함께 반환하고,
 *     coverage 가 낮으면 신뢰도를 '낮음'으로 표시한다.
 *
 * 점수는 '선배 경험이 학생에게 참고가 될 관련성'이며, 취업 성공 확률이 아니다.
 */
import type { MatchResult, MatchWeights, SeniorRecord, SemanticMethod, StudentProfile, SubScore } from "./types";
import { CAREER_FIELDS, canonicalSkill, departmentAffinity, fieldAffinity, fieldLabel, skillLabel, skillRelatedness, PATH_TYPE_LABEL } from "./taxonomy";

export const DEFAULT_WEIGHTS: MatchWeights = { semantic: 0.3, career: 0.25, skill: 0.2, context: 0.15, evidence: 0.1 };

export const WEIGHT_PRESETS: { id: string; label: string; description: string; weights: MatchWeights }[] = [
  { id: "default", label: "기본 (설계 가정)", description: "지시서의 초기 가중치", weights: DEFAULT_WEIGHTS },
  { id: "career_first", label: "관심 진로 중시", description: "관심 분야·진로 유형 일치를 크게 반영", weights: { semantic: 0.2, career: 0.4, skill: 0.15, context: 0.15, evidence: 0.1 } },
  { id: "skill_first", label: "보유 역량 중시", description: "지금 가진 역량과 비슷한 선배를 우선", weights: { semantic: 0.2, career: 0.2, skill: 0.4, context: 0.1, evidence: 0.1 } },
  { id: "context_first", label: "전공·상황 중시", description: "같은 학과·비슷한 제약조건의 선배를 우선", weights: { semantic: 0.2, career: 0.2, skill: 0.15, context: 0.35, evidence: 0.1 } },
];

export const SUBSCORE_LABEL: Record<keyof MatchWeights, string> = {
  semantic: "의미 유사도",
  career: "진로 관련성",
  skill: "역량 관련성",
  context: "맥락 유사도",
  evidence: "근거 품질",
};

export function normalizeWeights(w: MatchWeights): MatchWeights {
  const sum = w.semantic + w.career + w.skill + w.context + w.evidence;
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  return { semantic: w.semantic / sum, career: w.career / sum, skill: w.skill / sum, context: w.context / sum, evidence: w.evidence / sum };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/* ---------------- 학생 프로필 → 질의 텍스트 ---------------- */

export function profileToQuery(p: StudentProfile): string {
  const parts: string[] = [];
  if (p.department) parts.push(`${p.department} 학생`);
  if (p.double_major) parts.push(`복수전공 ${p.double_major}`);
  if (p.interest_fields.length) parts.push(`관심 분야 ${p.interest_fields.map(fieldLabel).join(", ")}`);
  if (p.skills.length) parts.push(`보유 역량 ${p.skills.map((s) => skillLabel(canonicalSkill(s))).join(", ")}`);
  if (p.career_types.includes("graduate")) parts.push("대학원 진학 고려");
  if (p.career_types.includes("employment")) parts.push("취업 고려");
  if (p.career_types.includes("public")) parts.push("공공기관 고려");
  if (p.career_types.includes("global")) parts.push("외국계 해외 고려");
  if (p.experience_notes) parts.push(p.experience_notes);
  if (p.concern) parts.push(p.concern);
  return parts.join(". ");
}

/* ---------------- 세부 점수 ---------------- */

const CAREER_TYPE_TO_PATH: Record<string, SeniorRecord["path_type"][]> = {
  employment: ["industry_job", "finance", "career_switch", "foreign_company"],
  graduate: ["graduate_school"],
  public: ["public_sector"],
  global: ["foreign_company"],
};

export function careerRelevance(p: StudentProfile, r: SeniorRecord): { value: number | null; reason: string } {
  const types = p.career_types.filter((t) => t !== "undecided");
  if (!p.interest_fields.length && !types.length) return { value: null, reason: "관심 진로가 입력되지 않아 계산하지 않았습니다." };
  const parts: { v: number; w: number }[] = [];
  let reason = "";
  if (p.interest_fields.length) {
    let best = 0;
    let bestPair: [string, string] | null = null;
    for (const i of p.interest_fields)
      for (const f of r.career_field) {
        const a = fieldAffinity(i, f);
        if (a > best) {
          best = a;
          bestPair = [i, f];
        }
      }
    // 관심 분야 중 선배 분야와 직접 일치(≥0.75)하는 비율로 소폭 보정
    const covered = p.interest_fields.filter((i) => r.career_field.some((f) => fieldAffinity(i, f) >= 0.75)).length / p.interest_fields.length;
    const v = clamp01(0.8 * best + 0.2 * covered);
    parts.push({ v, w: 0.75 });
    reason = bestPair
      ? best === 1
        ? `관심 분야 '${fieldLabel(bestPair[0])}'와 선배 진로 분야가 일치합니다.`
        : `관심 분야 '${fieldLabel(bestPair[0])}'와 선배 분야 '${fieldLabel(bestPair[1])}'가 관련됩니다(친화도 ${best.toFixed(2)}).`
      : "관심 분야와 선배 진로 분야의 관련성이 낮습니다.";
  }
  if (types.length) {
    const hit = types.some((t) => CAREER_TYPE_TO_PATH[t]?.includes(r.path_type));
    parts.push({ v: hit ? 1 : 0.25, w: 0.25 });
    reason += hit ? ` 희망 진로 유형과 선배 경로(${PATH_TYPE_LABEL[r.path_type]})가 맞습니다.` : ` 선배 경로(${PATH_TYPE_LABEL[r.path_type]})는 희망 진로 유형과 다릅니다.`;
  }
  const wsum = parts.reduce((a, b) => a + b.w, 0);
  return { value: parts.reduce((a, b) => a + b.v * b.w, 0) / wsum, reason: reason.trim() };
}

export function coreSkillsForFields(fields: string[]): string[] {
  return [...new Set(fields.flatMap((f) => CAREER_FIELDS.find((x) => x.id === f)?.core_skills ?? []))];
}

export function skillRelevance(
  p: StudentProfile,
  r: SeniorRecord,
): { value: number | null; reason: string; matched: string[]; gaps: string[] } {
  const mine = [...new Set(p.skills.map(canonicalSkill))];
  const theirs = r.key_skills;
  if (!theirs.length) return { value: null, reason: "선배 기록에 역량 정보가 없습니다.", matched: [], gaps: [] };
  const parts: { v: number; w: number }[] = [];
  const matched: string[] = [];
  const gaps: string[] = [];
  let reason = "";
  if (mine.length) {
    const sims = theirs.map((t) => {
      const best = Math.max(0, ...mine.map((m) => skillRelatedness(m, t)));
      if (best >= 1) matched.push(t);
      else if (best < 0.5) gaps.push(t);
      return best;
    });
    parts.push({ v: mean(sims), w: 0.6 });
    reason = matched.length
      ? `보유 역량 중 ${matched.map(skillLabel).join(", ")}이(가) 선배 핵심 역량과 겹칩니다.`
      : "보유 역량과 직접 겹치는 선배 핵심 역량이 없습니다.";
  } else {
    gaps.push(...theirs);
  }
  if (p.interest_fields.length) {
    const core = coreSkillsForFields(p.interest_fields);
    const rel = theirs.map((t) => Math.max(0, ...core.map((c) => skillRelatedness(c, t))));
    parts.push({ v: mean(rel), w: 0.4 });
    reason += ` 선배 역량 중 관심 분야 핵심 역량과의 관련도 평균 ${mean(rel).toFixed(2)}.`;
  }
  if (!parts.length) return { value: null, reason: "보유 역량과 관심 분야가 모두 비어 있어 계산하지 않았습니다.", matched, gaps };
  const wsum = parts.reduce((a, b) => a + b.w, 0);
  return { value: parts.reduce((a, b) => a + b.v * b.w, 0) / wsum, reason: reason.trim(), matched, gaps };
}

export function fastnessOf(r: SeniorRecord): number {
  const m = r.months_to_first_role;
  if (m === null) return 0.05;
  if (m <= 3) return 1;
  if (m <= 8) return 0.65;
  if (m <= 12) return 0.45;
  if (m <= 24) return 0.2;
  return 0.1;
}

const FINANCIAL_STRAIN_TAGS = ["경제적 부담", "학위 기간 수입 감소", "장기 학위"];

export function contextSimilarity(p: StudentProfile, r: SeniorRecord): { value: number | null; reason: string } {
  const comps: { v: number; label: string }[] = [];
  const dept = departmentAffinity(p.department, r.department);
  if (dept !== null) comps.push({ v: dept, label: dept === 1 ? "같은 학과" : dept >= 0.7 ? "같은 계열 학과" : dept >= 0.4 ? "관련 계열 학과" : "다른 계열 학과" });
  if (p.double_major) {
    const theirs = [r.academic_background.double_major, r.academic_background.minor].filter(Boolean) as string[];
    const best = theirs.length ? Math.max(...theirs.map((t) => departmentAffinity(p.double_major, t) ?? 0)) : 0.2;
    comps.push({ v: best, label: best >= 0.7 ? "비슷한 복수·부전공" : "다른 복수·부전공" });
  }
  if (p.grad_school_pref !== undefined) {
    const isGrad = r.path_type === "graduate_school" ? 1 : 0;
    comps.push({ v: 1 - Math.abs(p.grad_school_pref - isGrad), label: "대학원 선호도 정렬" });
  }
  if (p.fast_employment_pref !== undefined) {
    comps.push({ v: 1 - Math.abs(p.fast_employment_pref - fastnessOf(r)), label: "빠른 취업 선호도 정렬" });
  }
  if (p.financial_constraint && p.financial_constraint !== "none") {
    const strain = r.context_tags.some((t) => FINANCIAL_STRAIN_TAGS.includes(t));
    const v = strain ? (p.financial_constraint === "strong" ? 0.2 : 0.5) : 0.9;
    comps.push({ v, label: strain ? "경제적 부담이 있었던 경로" : "경제적 부담 언급이 적은 경로" });
  }
  if (!comps.length) return { value: null, reason: "학과·선호도 등 맥락 정보가 없어 계산하지 않았습니다." };
  return { value: mean(comps.map((c) => c.v)), reason: comps.map((c) => `${c.label}(${c.v.toFixed(2)})`).join(", ") };
}

const VERIFICATION: Record<SeniorRecord["evidence_source"]["type"], number> = {
  synthetic_demo: 0.4,
  survey_self_report: 0.7,
  interview_verified: 1,
};

export function evidenceQuality(r: SeniorRecord, now = new Date("2026-11-04")): { value: number; reason: string } {
  const fields = [
    r.key_skills.length,
    r.courses.length,
    r.projects.length + r.internships.length,
    r.career_decisions.length,
    r.preparation_timeline.length,
    r.difficulties.length,
    r.lessons_learned.length,
    r.advice.length,
    r.certifications.length || r.context_tags.length,
    r.months_to_first_role !== null ? 1 : 0,
  ];
  const completeness = fields.filter((x) => x > 0).length / fields.length;
  const ageYears = (now.getTime() - new Date(r.source_date).getTime()) / (365.25 * 864e5);
  const recency = ageYears <= 1 ? 1 : ageYears <= 3 ? 0.7 : 0.4;
  const verification = VERIFICATION[r.evidence_source.type];
  const consentOk = r.is_synthetic || r.consent_status === "consented";
  const value = consentOk ? 0.5 * completeness + 0.3 * verification + 0.2 * recency : 0;
  const src = r.is_synthetic ? "가상 시연 데이터" : r.evidence_source.type === "interview_verified" ? "인터뷰 확인 기록" : "설문 자기보고";
  return { value, reason: `기록 완성도 ${(completeness * 100).toFixed(0)}%, 출처: ${src}, 작성일 ${r.source_date}` };
}

/* ---------------- 종합 ---------------- */

export interface SemanticInput {
  value: number | null;
  method: SemanticMethod;
  detail?: string;
}

export function computeMatch(p: StudentProfile, r: SeniorRecord, semantic: SemanticInput, weights: MatchWeights = DEFAULT_WEIGHTS): MatchResult {
  const w = normalizeWeights(weights);
  const career = careerRelevance(p, r);
  const skill = skillRelevance(p, r);
  const ctx = contextSimilarity(p, r);
  const ev = evidenceQuality(r);
  const methodLabel = semantic.method === "embedding_rerank" ? "임베딩+리랭커" : semantic.method === "embedding" ? "임베딩" : "로컬 n-gram·개념 확장";
  const subscores: SubScore[] = [
    { key: "semantic", value: semantic.value, weight: w.semantic, reason: semantic.value === null ? "질의로 쓸 프로필·질문이 없어 계산하지 않았습니다." : `학생 질의와 선배 기록의 ${methodLabel} 유사도${semantic.detail ? ` (${semantic.detail})` : ""}` },
    { key: "career", value: career.value, weight: w.career, reason: career.reason },
    { key: "skill", value: skill.value, weight: w.skill, reason: skill.reason },
    { key: "context", value: ctx.value, weight: w.context, reason: ctx.reason },
    { key: "evidence", value: ev.value, weight: w.evidence, reason: ev.reason },
  ];
  const avail = subscores.filter((s) => s.value !== null);
  const availW = avail.reduce((a, s) => a + s.weight, 0);
  const score = availW > 0 ? avail.reduce((a, s) => a + s.weight * (s.value as number), 0) / availW : 0;
  const coverage = availW; // 가중치 합이 1로 정규화되어 있으므로 그대로 비율

  const confidence: MatchResult["confidence"] = coverage >= 0.8 && score >= 0.5 ? "high" : coverage >= 0.55 && score >= 0.35 ? "medium" : "low";

  const reasons: string[] = [];
  const dept = departmentAffinity(p.department, r.department);
  if (dept !== null) reasons.push(dept === 1 ? `같은 학과(${r.department}) 선배의 경험입니다.` : `전공 관련성: ${r.department} (유사도 ${dept.toFixed(2)})`);
  if (career.value !== null) reasons.push(career.reason);
  if (skill.matched.length) reasons.push(`보유 역량 유사: ${skill.matched.map(skillLabel).join(", ")}`);
  const refs = [...r.projects, ...r.internships].slice(0, 2).map((e) => e.title);
  if (refs.length) reasons.push(`참고할 경험: ${refs.join(" / ")}`);

  return {
    record_id: r.record_id,
    score: clamp01(score),
    subscores,
    coverage,
    confidence,
    reasons,
    gaps: skill.gaps.map(skillLabel),
    matched_skills: skill.matched,
    semantic_method: semantic.method,
  };
}

export function rankRecords(
  p: StudentProfile,
  records: SeniorRecord[],
  semantic: Map<string, number> | null,
  method: SemanticMethod,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): MatchResult[] {
  return records
    .map((r) => computeMatch(p, r, { value: semantic ? semantic.get(r.record_id) ?? null : null, method }, weights))
    .sort((a, b) => b.score - a.score || a.record_id.localeCompare(b.record_id));
}
