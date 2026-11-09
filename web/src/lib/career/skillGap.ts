/**
 * Skill Gap Analysis (순수 함수 · 재현 가능). 수학적 정의는 docs/SKILL_GAP_METHODOLOGY.md.
 *
 *   S  = 학생이 입력한 역량(정규화)
 *   D  = NCS 매핑 역량 ∪ 공고 필수·우대 역량 ∪ {관련 선배 기록에서 2건 이상 등장한 핵심 역량}
 *   보유(held)      = S ∩ D
 *   미확인(unconfirmed) = D \ S        ← '부족'이 아니라 '보유 여부가 확인되지 않음'
 *   priority(s) = Σ_k w_k·x_k(s) / Σ_k w_k   (사용 가능한 출처 k 만 합산 — 출처가 없으면 분모에서 제외)
 *       x_ncs  = 1[s 가 NCS 능력단위에 매핑됨]
 *       x_post = (#필수 + 0.5·#우대) / N_공고
 *       x_alum = #선배 기록 중 핵심 역량 / M_선배
 *     × (1 − 0.3·max_{t∈S} rel(s,t))   (관련 역량을 이미 가진 경우 우선순위를 낮춤)
 */
import type { SeniorRecord } from "../types";
import { canonicalSkill, skillLabel, skillRelatedness } from "../taxonomy";
import type { CareerEvidence, EvidenceRole, SkillDemand, SkillGapResult } from "./types";

export const PRIORITY_WEIGHTS = { ncs: 0.3, postings: 0.4, alumni: 0.3 } as const;
export const ALUMNI_MIN_COUNT = 2;
export const PRIORITY_MIN = 0.2;

export interface SkillGapInput {
  occupation: { id: string; label: string };
  studentSkills: string[];
  ncs: CareerEvidence | null;
  postings: CareerEvidence[];
  postingsQuery: string;
  alumni: SeniorRecord[];
}

const round = (x: number) => Math.round(x * 1000) / 1000;

export function computeSkillGap(input: SkillGapInput): SkillGapResult {
  const S = new Set(input.studentSkills.map(canonicalSkill).filter(Boolean));
  const N = input.postings.length;
  const M = input.alumni.length;
  const ncsUnits = input.ncs?.units ?? [];
  const hasNcs = ncsUnits.length > 0;

  const stat = new Map<string, Omit<SkillDemand, "priority" | "label">>();
  const get = (s: string) => {
    let v = stat.get(s);
    if (!v) {
      v = { skill: s, ncs_units: [], posting_required: 0, posting_preferred: 0, posting_total: N, alumni_count: 0, alumni_total: M, alumni_ids: [] };
      stat.set(s, v);
    }
    return v;
  };
  for (const u of ncsUnits) for (const s of new Set(u.mapped_skills)) get(s).ncs_units.push(u.name);
  for (const p of input.postings) {
    const req = new Set(p.required_skills);
    for (const s of req) get(s).posting_required++;
    for (const s of new Set(p.preferred_skills)) if (!req.has(s)) get(s).posting_preferred++;
  }
  const alumniFreq = new Map<string, string[]>();
  for (const r of input.alumni) for (const s of new Set(r.key_skills)) alumniFreq.set(s, [...(alumniFreq.get(s) ?? []), r.record_id]);
  for (const [s, ids] of alumniFreq) {
    const inOther = stat.has(s);
    if (inOther || ids.length >= ALUMNI_MIN_COUNT) {
      const v = get(s);
      v.alumni_count = ids.length;
      v.alumni_ids = ids;
    }
  }

  const wSum = (hasNcs ? PRIORITY_WEIGHTS.ncs : 0) + (N ? PRIORITY_WEIGHTS.postings : 0) + (M ? PRIORITY_WEIGHTS.alumni : 0);
  const maxRel = (s: string) => {
    let best: { skill: string; label: string; relatedness: number }[] = [];
    for (const t of S) {
      if (t === s) continue;
      const r = skillRelatedness(s, t);
      if (r >= 0.4) best.push({ skill: t, label: skillLabel(t), relatedness: r });
    }
    best = best.sort((a, b) => b.relatedness - a.relatedness).slice(0, 2);
    return best;
  };
  const demanded: SkillDemand[] = [...stat.values()].map((v) => {
    const xN = v.ncs_units.length ? 1 : 0;
    const xP = N ? (v.posting_required + 0.5 * v.posting_preferred) / N : 0;
    const xA = M ? v.alumni_count / M : 0;
    const base = wSum ? ((hasNcs ? PRIORITY_WEIGHTS.ncs * xN : 0) + (N ? PRIORITY_WEIGHTS.postings * xP : 0) + (M ? PRIORITY_WEIGHTS.alumni * xA : 0)) / wSum : 0;
    return { ...v, label: skillLabel(v.skill), priority: round(base) };
  });
  demanded.sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label, "ko"));

  const roles = (d: SkillDemand): EvidenceRole[] => [
    ...(d.ncs_units.length ? (["official_standard"] as const) : []),
    ...(d.posting_required + d.posting_preferred ? (["job_market"] as const) : []),
    ...(d.alumni_count ? (["alumni_experience"] as const) : []),
  ];
  const held = demanded.filter((d) => S.has(d.skill)).map((d) => ({ skill: d.skill, label: d.label, sources: roles(d) }));
  const held_other = [...S].filter((s) => !stat.has(s)).map((s) => ({ skill: s, label: skillLabel(s) }));
  const unconfirmed = demanded
    .filter((d) => !S.has(d.skill))
    .map((d) => {
      const rel = maxRel(d.skill);
      const disc = 1 - 0.3 * (rel[0]?.relatedness ?? 0);
      return { ...d, priority: round(d.priority * disc), related_held: rel };
    })
    .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label, "ko"));

  const priorities = unconfirmed
    .filter((d) => d.priority >= PRIORITY_MIN)
    .slice(0, 3)
    .map((d) => ({
      ...d,
      reason: [
        d.ncs_units.length ? `NCS 능력단위 ${d.ncs_units.length}개에 관련` : "",
        N && d.posting_required + d.posting_preferred ? `분석 공고 ${N}건 중 필수 ${d.posting_required}·우대 ${d.posting_preferred}` : "",
        M && d.alumni_count ? `관련 선배 기록 ${M}건 중 ${d.alumni_count}건의 핵심 역량` : "",
        d.related_held.length ? `보유 역량 '${d.related_held[0].label}'과 관련(우선순위 일부 하향)` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    }));

  const postingsSynthetic = input.postings.some((p) => p.is_synthetic);
  const caveats = [
    "‘미확인’ 역량은 부족하다는 뜻이 아니라, 프로필에 입력되지 않아 보유 여부를 알 수 없다는 뜻입니다.",
    N ? `공고 빈도는 검색 조건(“${input.postingsQuery}”)으로 가져온 공고 ${N}건 기준이며 전체 채용시장의 요구 비율이 아닙니다.` : "분석에 사용한 채용공고가 없습니다 (사람인 API 인증키 미설정 또는 결과 없음).",
    postingsSynthetic ? "현재 채용공고는 실제 공고가 아닌 테스트용 가상 공고(Fixture)입니다." : "",
    hasNcs ? "NCS 능력단위 → 역량 매핑은 이 서비스의 설계 가정이며 NCS 공식 매핑이 아닙니다." : "NCS 공식 직무 자료가 연결되지 않았습니다.",
    M ? `선배 기록 ${M}건은 가상 시연 데이터입니다. 선배 경험과 공고의 공통점은 인과관계를 뜻하지 않습니다.` : "관련 선배 기록이 없습니다.",
  ].filter(Boolean);

  const fetched = input.postings.map((p) => p.fetched_at).sort().pop() ?? null;
  return {
    occupation: input.occupation,
    held,
    held_other,
    demanded,
    unconfirmed,
    priorities,
    sample: { postings: N, postings_synthetic: postingsSynthetic, postings_query: input.postingsQuery, postings_fetched_at: fetched, ncs_units: ncsUnits.length, ncs_mode: input.ncs?.verification_status ?? "none", alumni: M },
    caveats,
  };
}
