/**
 * 선배 Q&A 데이터 모델 (Phase C). 설계: docs/RAG_QA_DESIGN_4_0.md
 * 실제 데이터와 시연 데이터의 구분(is_synthetic)은 제거하지 않는다.
 */
import { z } from "zod";

export const QaSourceType = z.enum(["alumni_submission", "alumni_answer", "survey", "interview", "official_doc", "synthetic_demo"]);
export const QaVerified = z.enum(["pending", "verified", "rejected", "withdrawn"]);
export const QaConsent = z.enum(["consented", "not_requested", "withdrawn", "not_applicable"]);
export const QaVisibility = z.enum(["public", "students_only", "internal"]);

export const QaItemSchema = z.object({
  question_id: z.string().regex(/^Q-\d{2,3}$/),
  question_text: z.string().min(5).max(1000),
  answer_text: z.string().min(5).max(3000),
  source_type: QaSourceType,
  /** 출처 추적용 참조 (제출 ID·설문 번호·공식 문서 URL 등). 개인 식별 정보를 넣지 않는다 */
  source_reference: z.string().max(300),
  verified_status: QaVerified,
  is_synthetic: z.boolean(),
  consent_status: QaConsent,
  visibility: QaVisibility,
  department: z.string().max(40),
  career_category: z.string().max(40),
  created_at: z.string(),
  updated_at: z.string(),
  /** 추가 필드: 관리자 검토 기록 */
  pii_checked: z.boolean(),
  reviewed_by: z.string().max(40).nullable(),
  review_note: z.string().max(300),
});
export type QaItem = z.infer<typeof QaItemSchema>;

/** 관리자 등록 입력: 항상 pending 으로 시작하며 실제 데이터로만 등록한다 */
export const QaCreateSchema = z.object({
  question_text: z.string().trim().min(5).max(1000),
  answer_text: z.string().trim().min(5).max(3000),
  source_type: z.enum(["alumni_submission", "alumni_answer", "survey", "interview", "official_doc"]),
  source_reference: z.string().trim().min(1).max(300),
  consent_status: z.enum(["consented", "not_requested", "not_applicable"]),
  visibility: QaVisibility,
  department: z.string().trim().max(40),
  career_category: z.string().trim().max(40),
});
export type QaCreate = z.infer<typeof QaCreateSchema>;

export type EvidenceTier = "verified_alumni" | "official_doc" | "synthetic_demo";

export const TIER_LABEL: Record<EvidenceTier, string> = {
  verified_alumni: "검증된 실제 선배 답변 (자기 보고)",
  official_doc: "공식 문서",
  synthetic_demo: "가상 시연 Q&A",
};

export function tierOf(i: Pick<QaItem, "is_synthetic" | "source_type">): EvidenceTier {
  if (i.is_synthetic) return "synthetic_demo";
  return i.source_type === "official_doc" ? "official_doc" : "verified_alumni";
}

/**
 * 검색·상담 사용 가능 여부. 실제 데이터는 승인 + 동의 + 개인정보 점검 + 출처가 모두 있어야 한다.
 * official_doc 은 개인의 동의 대상이 아니므로 not_applicable 도 허용한다.
 */
export function ragEligible(i: QaItem): boolean {
  if (i.verified_status !== "verified" || i.visibility === "internal") return false;
  if (i.is_synthetic) return i.source_type === "synthetic_demo";
  if (i.source_type === "synthetic_demo" || !i.pii_checked || !i.source_reference.trim()) return false;
  return i.consent_status === "consented" || (i.source_type === "official_doc" && i.consent_status === "not_applicable");
}

const PII: [string, RegExp][] = [
  ["전화번호", /(?<!\d)01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}(?!\d)/],
  ["이메일", /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ["주민등록번호", /(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[-\s]?[1-4]\d{6}(?!\d)/],
  ["학번", /(?<!\d)(?:19|20)\d{7}(?!\d)/],
];

/** 승인 전 자동 점검: 발견되면 승인을 막는다. 이름 등 정규식으로 못 잡는 정보는 관리자가 확인한다 */
export function detectPII(text: string): string[] {
  return PII.filter(([, re]) => re.test(text)).map(([k]) => k);
}
