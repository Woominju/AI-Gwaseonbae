import "server-only";
/**
 * Career Intelligence Engine — 선배 경험 × 공식 직무정보(NCS) × 채용공고 를 역할별로 묶는다.
 * Dashboard(/market), Campus Lounge, (향후) Knowledge Graph 가 같은 함수를 사용한다.
 */
import type { StudentProfile } from "../types";
import { getAllRecords } from "../data/repository.server";
import { fieldLabel, PATH_TYPE_LABEL } from "../taxonomy";
import { getOccupation, type OccupationDef } from "./occupations";
import { getNcsStandard, getPostings, providerStatuses } from "./providers.server";
import { computeSkillGap } from "./skillGap";
import type { CareerEvidence, ProviderStatus, SkillGapResult } from "./types";

export interface CareerAnalysis {
  occupation: { id: string; label: string; fields: string[]; ncs: OccupationDef["ncs"] };
  sources: ProviderStatus[];
  ncs: CareerEvidence | null;
  postings: CareerEvidence[];
  postings_live: boolean;
  alumni: { record_id: string; department: string; current_role: string; path_label: string; key_skills: string[]; is_synthetic: boolean }[];
  gap: SkillGapResult;
  /** 근거 역할별 요약 문장 (AI 분석은 위 3개 근거에서 계산된 값만 사용) */
  summary: { alumni_experience: string; official_standard: string; job_market: string; ai_analysis: string };
  notices: string[];
  generated_at: string;
}

export async function analyzeCareer(profile: StudentProfile, occupationId: string): Promise<CareerAnalysis | null> {
  const o = getOccupation(occupationId);
  if (!o) return null;
  const notices: string[] = [];
  const [ncs, posts] = await Promise.all([getNcsStandard(o), getPostings(o)]);
  if (ncs.notice) notices.push(ncs.notice);
  if (posts.notice) notices.push(posts.notice);
  const alumniRecs = getAllRecords().filter((r) => r.career_field.some((f) => o.fields.includes(f)));
  const gap = computeSkillGap({ occupation: { id: o.id, label: o.label }, studentSkills: profile.skills, ncs: ncs.ev, postings: posts.list, postingsQuery: posts.query, alumni: alumniRecs });

  const top = gap.demanded.slice(0, 4).map((d) => d.label).join(", ");
  const pr = gap.priorities.map((p) => p.label);
  const heldL = gap.held.map((h) => h.label);
  const alumniIds = alumniRecs.slice(0, 4).map((r) => `[${r.record_id}]`).join("");
  const postTop = gap.demanded.filter((d) => d.posting_required + d.posting_preferred > 0).sort((a, b) => b.posting_required + b.posting_preferred - (a.posting_required + a.posting_preferred)).slice(0, 3);

  const summary = {
    alumni_experience: alumniRecs.length
      ? `${o.fields.map(fieldLabel).join("·")} 분야 선배 기록 ${alumniRecs.length}건 ${alumniIds} (가상 시연 데이터). 주요 경로: ${[...new Set(alumniRecs.map((r) => PATH_TYPE_LABEL[r.path_type]))].slice(0, 3).join(", ")}.`
      : "이 직무와 연결된 선배 기록이 없습니다.",
    official_standard: ncs.ev
      ? `${ncs.ev.title}: 능력단위 ${ncs.ev.units?.length ?? 0}개${ncs.ev.is_synthetic ? " — 테스트 Fixture(실제 NCS 명칭 아님)" : ""}.`
      : "이 직무에 연결된 NCS 자료가 없습니다.",
    job_market: posts.list.length
      ? `${posts.live ? "사람인 실시간 조회" : "가상 공고 Fixture"} ${posts.list.length}건(검색어 “${posts.query}”)에서 자주 언급된 역량: ${postTop.map((d) => `${d.label} ${d.posting_required + d.posting_preferred}건`).join(", ")}.${posts.live ? "" : " 실제 채용공고가 아닙니다."}`
      : "분석할 채용공고가 없습니다. 최신 공고를 조회하지 못했습니다.",
    ai_analysis: `요구·우대 역량 상위: ${top || "-"}. ${heldL.length ? `입력한 역량 중 ${heldL.join(", ")}은(는) 이 직무 근거와 겹칩니다. ` : "입력한 역량 중 겹치는 항목이 없거나 역량이 입력되지 않았습니다. "}${pr.length ? `보유 여부가 확인되지 않은 역량 중 먼저 점검해 볼 후보: ${pr.join(", ")}.` : ""} (확인되지 않은 역량 = 부족한 역량이 아님)`,
  };

  return {
    occupation: { id: o.id, label: o.label, fields: o.fields, ncs: o.ncs },
    sources: providerStatuses(),
    ncs: ncs.ev,
    postings: posts.list,
    postings_live: posts.live,
    alumni: alumniRecs.map((r) => ({ record_id: r.record_id, department: r.department, current_role: r.current_role, path_label: PATH_TYPE_LABEL[r.path_type], key_skills: r.key_skills, is_synthetic: r.is_synthetic })),
    gap,
    summary,
    notices,
    generated_at: new Date().toISOString(),
  };
}
