import "server-only";
/**
 * 서버 전용 데이터 저장소: 가상 시연 데이터 + (있다면) 가져온 실제 데이터.
 * 실제 데이터는 web/data/imported/records.json 에 저장되며 Import API로만 갱신된다.
 */
import fs from "node:fs";
import path from "node:path";
import type { SeniorRecord } from "../types";
import { SeniorRecordSchema } from "../schema";
import { getSyntheticRecords, normalizeRecord } from "./records";
import { isPublicDemo } from "../demoMode";
import { aiUsableExperiences } from "../alumni/store.server";
import { fieldLabel } from "../taxonomy";

/** 승인·검증·실제(비시연)·AI 활용 동의된 선배 경험만 RAG 레코드로 변환 (3.0) */
function verifiedAlumniRecords(): SeniorRecord[] {
  if (process.env.FEATURE_ALUMNI_NETWORK !== "1") return [];
  return aiUsableExperiences().map(({ sub, alumni }, i) => ({
    record_id: `A-${String(i + 1).padStart(3, "0")}`,
    department: alumni.department || "학과 비공개",
    department_is_demo_category: false,
    graduation_year: alumni.graduation_year ?? 0,
    career_field: [sub.experience.career_field],
    path_type: sub.experience.path_type,
    current_role: sub.experience.current_role,
    organization_type: "비공개",
    academic_background: { major: alumni.department || "비공개" },
    key_skills: sub.experience.key_skills,
    courses: [],
    projects: [],
    internships: [],
    certifications: [],
    career_decisions: [],
    preparation_timeline: [],
    months_to_first_role: null,
    difficulties: sub.experience.difficulties ? [sub.experience.difficulties] : [],
    lessons_learned: [],
    advice: sub.experience.advice ? [sub.experience.advice] : [],
    context_tags: [fieldLabel(sub.experience.career_field), sub.experience.preparation.slice(0, 300)],
    evidence_source: { type: "survey_self_report" as const, description: "검증된 실제 선배의 자기 보고 (관리자 승인)" },
    source_date: (sub.reviewed_at ?? sub.created_at).slice(0, 10),
    consent_status: "consented" as const,
    is_synthetic: false,
  }));
}

export const IMPORT_DIR = path.join(process.cwd(), "data", "imported");
export const IMPORT_FILE = path.join(IMPORT_DIR, "records.json");

let cache: { mtime: number; records: SeniorRecord[] } | null = null;

export function getImportedRecords(): SeniorRecord[] {
  try {
    const st = fs.statSync(IMPORT_FILE);
    if (cache && cache.mtime === st.mtimeMs) return cache.records;
    const arr = JSON.parse(fs.readFileSync(IMPORT_FILE, "utf8"));
    const recs: SeniorRecord[] = [];
    for (const x of Array.isArray(arr) ? arr : []) {
      const p = SeniorRecordSchema.safeParse(x);
      // 동의 철회·미동의 실제 기록은 서비스에서 제외
      if (p.success && (p.data.is_synthetic || p.data.consent_status === "consented")) recs.push(normalizeRecord(p.data as SeniorRecord));
    }
    cache = { mtime: st.mtimeMs, records: recs };
    return recs;
  } catch {
    return [];
  }
}

export function getAllRecords(): SeniorRecord[] {
  const synth = getSyntheticRecords();
  if (isPublicDemo()) return synth; // 공개 시연: 가상 데이터만
  const imported = getImportedRecords().filter((r) => !synth.some((s) => s.record_id === r.record_id));
  return [...synth, ...imported, ...verifiedAlumniRecords()];
}

export function getRecord(id: string): SeniorRecord | undefined {
  return getAllRecords().find((r) => r.record_id === id);
}
