/**
 * 수강편람·지식 그래프 데이터 모델 (4.1). 설계: docs/GRAPHRAG_4_1_DESIGN.md
 * 자료에 없는 값은 추론으로 채우지 않는다: prerequisites 가 null 이면 '미기재', [] 이면 '자료에 없다고 명시'.
 */
import { z } from "zod";

export const SourceDocSchema = z.object({
  doc_id: z.string().min(3).max(40),
  title: z.string().min(2).max(120),
  publisher: z.string().max(80),
  academic_year: z.number().int().min(2000).max(2100),
  term: z.string().max(20),
  campus: z.string().max(30),
  url: z.string().url().nullable(),
  status: z.enum(["official", "synthetic_demo"]),
  /** 학교 등 권리자의 사용 허가를 확인했는가 */
  license_confirmed: z.boolean(),
  retrieved_at: z.string().max(30),
});
export type SourceDoc = z.infer<typeof SourceDocSchema>;

export const CatalogCourseSchema = z.object({
  course_code: z.string().max(30),
  name: z.string().min(1).max(80),
  department: z.string().max(40),
  academic_year: z.number().int(),
  term: z.string().max(20),
  campus: z.string().max(30),
  credits: z.number().nullable(),
  overview: z.string().max(1500).nullable(),
  prerequisites: z.array(z.string().max(80)).nullable(),
  /** 자료에 명시된 주제. taxonomy 역량 ID 이거나 자유 문구 */
  topics: z.array(z.string().max(60)),
  doc_id: z.string(),
  locator: z.string().max(80),
});
export type CatalogCourse = z.infer<typeof CatalogCourseSchema>;

export const CatalogFileSchema = z.object({
  documents: z.array(SourceDocSchema),
  courses: z.array(CatalogCourseSchema),
});
export type CatalogFile = z.infer<typeof CatalogFileSchema>;

/** 공식 자료로 인정하려면 출처 URL 과 사용 허가 확인이 모두 필요하다 */
export function officialDocUsable(d: SourceDoc): boolean {
  return d.status === "official" && d.license_confirmed && !!d.url;
}

export type DataStatus = "official" | "external_verified" | "alumni_verified" | "inferred_candidate" | "synthetic_demo";

export const STATUS_LABEL: Record<DataStatus, string> = {
  official: "공식 원문 명시",
  external_verified: "검증된 외부 자료",
  alumni_verified: "검증된 선배의 자기 보고",
  inferred_candidate: "규칙 추론 후보 (검증 안 됨)",
  synthetic_demo: "가상 시연 데이터",
};

export type KNodeType = "Department" | "Course" | "Skill" | "Experience" | "Career" | "Role" | "Topic" | "AlumniQA" | "SourceDocument";

export const KNODE_LABEL: Record<KNodeType, string> = {
  Department: "학과",
  Course: "과목",
  Skill: "역량",
  Experience: "활동·경험",
  Career: "진로 분야",
  Role: "직무",
  Topic: "주제",
  AlumniQA: "선배 Q&A",
  SourceDocument: "출처 문서",
};

export interface KNode {
  id: string;
  type: KNodeType;
  label: string;
  meaning?: string;
}

export interface KEdge {
  id: string;
  type: string;
  source: string;
  target: string;
  data_status: DataStatus;
  verification: "verified" | "unverified" | "demo";
  method: string;
  doc_id: string | null;
  locator: string | null;
  academic_year: number | null;
  term: string | null;
  updated_at: string;
  /** 사람이 확인할 수 있는 근거 문장 */
  evidence: string;
  record_ids: string[];
  qa_ids: string[];
}

export interface KnowledgeGraph {
  nodes: KNode[];
  edges: KEdge[];
  documents: SourceDoc[];
}

export const EDGE_TEXT: Record<string, string> = {
  DEPARTMENT_OFFERS_COURSE: "개설 과목",
  COURSE_EXPLICITLY_COVERS_TOPIC: "자료에 명시된 주제",
  COURSE_REQUIRES_PREREQUISITE: "명시된 선수 과목",
  DOCUMENT_SUPPORTS_CLAIM: "출처 문서",
  ROLE_REQUIRES_SKILL: "직무 예시 역량",
  FIELD_HAS_ROLE: "진로 분야의 직무",
  COURSE_MAY_RELATE_TO_ROLE: "추론 후보: 관련 가능성",
  QA_MENTIONS_COURSE: "Q&A 에서 언급",
  QA_MENTIONS_SKILL: "Q&A 에서 언급",
  STUDIED: "선배 기록의 수강 과목",
  DEVELOPED_SKILL: "선배가 진술한 역량",
  PARTICIPATED_IN: "활동에서 사용",
  LED_TO: "선배 본인이 진술한 연결",
  RELATED_TO: "같은 기록에 함께 등장",
  PURSUED: "분야의 직무 선택 기록",
};
