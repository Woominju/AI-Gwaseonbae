/**
 * HUFS Career Atlas — 핵심 도메인 타입.
 * 런타임 검증 스키마는 ./schema.ts (zod) 에 있으며, 이 파일의 타입과 1:1로 대응한다.
 */

/** 진로 경로 유형 — 비교 엔진과 그래프에서 공통으로 사용 */
export type PathType =
  | "graduate_school" // 대학원 진학
  | "industry_job" // 학부 졸업 후 민간 기업 취업
  | "finance" // 금융권
  | "foreign_company" // 외국계 기업
  | "public_sector" // 공공기관
  | "career_switch"; // 전공과 다른 분야로의 진출

export type ConsentStatus =
  | "synthetic_not_applicable" // 가상 데이터: 동의 대상 없음
  | "consented" // 실제 데이터: 서면/전자 동의 완료
  | "consent_withdrawn"
  | "pending";

export type EvidenceSourceType =
  | "synthetic_demo" // 서비스 시연용 가상 데이터
  | "survey_self_report" // 선배 설문(자기 보고)
  | "interview_verified"; // 인터뷰 + 운영자 확인

export interface Course {
  name: string;
  /** 선배가 이 과목을 통해 길렀다고 '진술한' 역량 (정규화된 역량 ID 또는 자유 텍스트) */
  skills_developed: string[];
}

export interface Experience {
  title: string;
  kind: "project" | "internship" | "research" | "competition" | "extracurricular";
  description: string;
  skills: string[];
  /** 기간(개월). 모르면 생략 */
  duration_months?: number;
  /** 활동 시점 (예: "3학년 2학기") */
  when?: string;
  /** 기관 유형 — 실제 기관명은 저장하지 않는다 (예: "국내 IT 플랫폼 기업(가상)") */
  org_type?: string;
  /**
   * 선배가 "이 경험이 다음 진로로 이어졌다"고 스스로 진술했는지 여부.
   * true일 때만 그래프에서 LED_TO 엣지를 만든다. 인과관계 검증을 의미하지 않는다.
   */
  self_reported_link?: boolean;
}

export interface CareerDecision {
  /** 결정 내용 (예: "석사 진학을 선택") */
  decision: string;
  /** 당시 고려한 대안 */
  alternatives: string[];
  /** 선배가 진술한 이유 */
  reason: string;
  when?: string;
}

export interface TimelineItem {
  /** 졸업(또는 첫 진로 시작) 시점을 0으로 한 상대 개월 (음수 = 졸업 전) */
  month_offset: number;
  label: string;
  activity: string;
  category: "study" | "project" | "internship" | "certification" | "application" | "research" | "reflection";
}

/** 선배 경험 기록 — DATA_SCHEMA.md 참고 */
export interface SeniorRecord {
  record_id: string;
  department: string;
  /** 학과명이 실제 학과로 확인되지 않은 시연용 분류인지 여부 */
  department_is_demo_category: boolean;
  graduation_year: number;
  career_field: string[]; // 정규화된 진로 분야 ID (taxonomy.ts)
  path_type: PathType;
  current_role: string;
  /** 실제 기업명 대신 기관 유형만 기재 */
  organization_type: string;
  academic_background: {
    major: string;
    double_major?: string;
    minor?: string;
    graduate_degree?: string;
  };
  key_skills: string[];
  courses: Course[];
  projects: Experience[];
  internships: Experience[];
  certifications: string[];
  career_decisions: CareerDecision[];
  preparation_timeline: TimelineItem[];
  /** 학부 졸업 후 첫 정규 직무(수입 발생)까지 개월. 학위 과정 재학 중이거나 미기재면 null */
  months_to_first_role: number | null;
  difficulties: string[];
  lessons_learned: string[];
  advice: string[];
  /** 기록 상의 요약 태그 (예: 경제적 부담, 연구 지향) */
  context_tags: string[];
  evidence_source: {
    type: EvidenceSourceType;
    description: string;
  };
  source_date: string; // ISO date
  consent_status: ConsentStatus;
  is_synthetic: boolean;
}

/* ---------------- 학생 프로필 ---------------- */

export type CareerTypePref =
  | "employment" // 취업
  | "graduate" // 대학원
  | "public" // 공공기관
  | "global" // 외국계·해외
  | "undecided";

export interface StudentProfile {
  department?: string;
  grade?: number; // 1~5 (5 = 초과학기)
  double_major?: string;
  minor?: string;
  interest_fields: string[]; // taxonomy career field IDs
  skills: string[]; // 자유 입력 + 정규화
  has_project?: boolean;
  has_internship?: boolean;
  has_research?: boolean;
  experience_notes?: string;
  target_timing?: "within_1y" | "1_2y" | "2y_plus" | "undecided";
  career_types: CareerTypePref[];
  /* 선택 입력 */
  grad_school_pref?: number; // 0~1
  fast_employment_pref?: number; // 0~1
  financial_constraint?: "none" | "some" | "strong";
  weekly_hours?: number; // 준비에 투자 가능한 주당 시간
  values: string[]; // value IDs (taxonomy VALUES)
  concern?: string; // 현재 고민 (자유 서술)
}

/* ---------------- 매칭 ---------------- */

export interface MatchWeights {
  semantic: number;
  career: number;
  skill: number;
  context: number;
  evidence: number;
}

export type SubScoreKey = keyof MatchWeights;

export interface SubScore {
  key: SubScoreKey;
  /** 0~1, 계산 불가(입력 누락)이면 null */
  value: number | null;
  weight: number;
  /** 사람이 읽을 수 있는 설명 */
  reason: string;
}

export interface MatchResult {
  record_id: string;
  score: number; // 0~1, 가용 가중치로 재정규화된 값
  subscores: SubScore[];
  /** 사용 가능한 입력이 차지하는 가중치 비율 (0~1) */
  coverage: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  gaps: string[];
  matched_skills: string[];
  semantic_method: SemanticMethod;
}

export type SemanticMethod = "local_lexical_concept" | "embedding" | "embedding_rerank";

/* ---------------- 진로 비교 ---------------- */

export type CriterionKey =
  | "research_depth"
  | "time_to_income"
  | "flexibility"
  | "readiness_fit"
  | "financial_burden"
  | "evidence_support";

export type PriorityWeights = Record<CriterionKey, number>;

export interface OptionCriterionScore {
  key: CriterionKey;
  value: number; // 0~1 (높을수록 학생에게 유리)
  basis: "data" | "assumption" | "mixed";
  explanation: string;
}

export interface ComparisonOption {
  id: string;
  path_types: PathType[];
  title: string;
  summary: string;
  preparation: string[];
  required_skills: string[];
  pros: string[];
  risks: string[];
  typical_months: number | null; // 근거 기록에서 계산된 준비 기간 중앙값
  criteria: OptionCriterionScore[];
  weighted_score: number;
  evidence_record_ids: string[];
  missing_skills: string[];
  to_verify: string[];
}

export interface ComparisonResult {
  options: ComparisonOption[];
  priorities: PriorityWeights;
  ranking: string[];
  /** 순위를 가장 크게 가른 기준 (기여도 차이 순) */
  decisive_criteria: { key: CriterionKey; delta: number }[];
  notes: string[];
}

/* ---------------- 로드맵 ---------------- */

export interface RoadmapItem {
  id: string;
  horizon: 1 | 3 | 6 | 12;
  title: string;
  purpose: string;
  related_option: string;
  timing: string;
  done: boolean;
  evidence: { record_ids: string[]; note: string };
  memo: string;
  custom?: boolean;
}

export interface Roadmap {
  version: 1;
  created_at: string;
  updated_at: string;
  basis: { option_id: string; option_title: string; profile_summary: string };
  items: RoadmapItem[];
}

/* ---------------- 그래프 ---------------- */

export type GraphNodeType = "Department" | "Course" | "Skill" | "Experience" | "Career" | "Role";
export type GraphEdgeType =
  | "STUDIED"
  | "DEVELOPED_SKILL"
  | "PARTICIPATED_IN"
  | "PURSUED"
  | "LED_TO"
  | "RELATED_TO";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  record_ids: string[];
}

export interface GraphEdge {
  id: string;
  type: GraphEdgeType;
  source: string;
  target: string;
  record_ids: string[];
  /** 관계의 근거 성격 */
  semantics: "reported_activity" | "reported_sequence" | "self_reported_link" | "co_occurrence";
}

export interface CareerGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
