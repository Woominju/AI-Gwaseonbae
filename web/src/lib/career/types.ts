/**
 * Career Intelligence Engine — 외부 직무·채용 근거 데이터 구조.
 * 기존 선배 경험(SeniorRecord)과 분리해서 저장·표시한다.
 * 서로 다른 출처의 정보를 같은 의미로 취급하지 않도록 source_type 과 evidence_role 을 반드시 붙인다.
 */

export type SourceProvider = "ncs" | "saramin" | "work24" | "hufs_alumni" | "university";

export type SourceType =
  | "alumni_interview" // 선배(동문) 경험 — 현재는 가상 시연 기록
  | "recruitment_posting" // 채용공고에 기재된 요구사항
  | "official_occupation_standard" // NCS 등 공식 직무 역량 기준
  | "university_resource"; // 대학 공식 자료

export type VerificationStatus =
  | "live_api" // 인증키로 실시간 조회
  | "transcribed_official" // 공식 출처를 사람이 옮겨 적음 (실시간 아님, 원문 대조 필요)
  | "synthetic_fixture" // 테스트·시연용 가상 데이터
  | "unverified";

export interface CareerEvidence {
  id: string;
  source_provider: SourceProvider;
  source_type: SourceType;
  source_url: string | null;
  title: string;
  occupation: string; // OccupationDef.id
  required_skills: string[]; // 정규화 역량 ID (taxonomy)
  preferred_skills: string[];
  qualifications: string[];
  experience_requirements: string | null;
  description: string;
  published_at: string | null;
  fetched_at: string; // ISO
  expires_at: string | null; // 공고 마감 또는 캐시 만료
  license_information: string;
  verification_status: VerificationStatus;
  is_synthetic: boolean;
  /** 원문 표현 (매핑 전) — 역량 ID 매핑은 설계 가정이므로 원문을 함께 보존 */
  raw_terms?: string[];
  /** NCS 등: 능력단위 등 하위 단위 */
  units?: { code?: string; name: string; mapped_skills: string[] }[];
  /** 공고: 기업명·지역 등 표시용 메타 (기업명은 공개 공고 원문 기준) */
  meta?: Record<string, string>;
}

/** 답변·화면에서 근거의 '역할'을 구분 */
export type EvidenceRole = "alumni_experience" | "official_standard" | "job_market" | "ai_analysis";

export const EVIDENCE_ROLE_LABEL: Record<EvidenceRole, string> = {
  alumni_experience: "선배 경험",
  official_standard: "공식 직무정보",
  job_market: "채용시장 정보",
  ai_analysis: "AI 분석",
};

export interface ProviderStatus {
  provider: SourceProvider;
  label: string;
  /** live: 실시간 연동됨 · fixture: 테스트 Fixture 사용 · not_configured: 키 없음 · disabled: 정책상 비활성 · not_implemented */
  mode: "live" | "fixture" | "transcribed" | "not_configured" | "disabled" | "not_implemented";
  detail: string;
  docs_url: string;
}

export interface SkillDemand {
  skill: string; // 역량 ID
  label: string;
  /** 공식 기준(NCS)에 매핑된 능력단위 수 */
  ncs_units: string[];
  /** 공고 중 필수로 등장한 수 / 우대로 등장한 수 */
  posting_required: number;
  posting_preferred: number;
  posting_total: number; // 분석 대상 공고 수 (분모)
  /** 관련 선배 기록 중 핵심 역량으로 기록한 수 */
  alumni_count: number;
  alumni_total: number;
  alumni_ids: string[];
  /** 0~1 우선 학습 후보 점수 (SKILL_GAP_METHODOLOGY.md) */
  priority: number;
}

export interface SkillGapResult {
  occupation: { id: string; label: string };
  /** 학생이 '보유했다고 입력한' 역량 중 직무 요구와 겹치는 것 */
  held: { skill: string; label: string; sources: EvidenceRole[] }[];
  /** 학생이 입력했지만 이 직무 근거에는 나타나지 않은 역량 */
  held_other: { skill: string; label: string }[];
  /** 직무에서 요구·우대되는 역량 전체 (출처별 빈도 포함) */
  demanded: SkillDemand[];
  /** 요구 역량 중 보유 여부가 '확인되지 않은' 역량 — 부족하다고 단정하지 않는다 */
  unconfirmed: (SkillDemand & { related_held: { skill: string; label: string; relatedness: number }[] })[];
  /** 우선 학습 후보 (unconfirmed 상위) */
  priorities: (SkillDemand & { reason: string })[];
  sample: { postings: number; postings_synthetic: boolean; postings_query: string; postings_fetched_at: string | null; ncs_units: number; ncs_mode: string; alumni: number };
  caveats: string[];
}
