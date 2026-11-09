/**
 * 선배 경험 데이터 접근 계층 (순수 함수 — 클라이언트/서버/테스트 공용).
 * 서버 전용 파일 I/O(실제 데이터 Import 반영)는 ./repository.server.ts 에 있다.
 */
import raw from "@/data/seniors.synthetic.json";
import type { SeniorRecord } from "../types";
import { canonicalSkill, fieldLabel, skillLabel, PATH_TYPE_LABEL } from "../taxonomy";

export function normalizeRecord(r: SeniorRecord): SeniorRecord {
  const canon = (xs: string[]) => [...new Set(xs.map(canonicalSkill))];
  return {
    ...r,
    key_skills: canon(r.key_skills),
    courses: r.courses.map((c) => ({ ...c, skills_developed: canon(c.skills_developed) })),
    projects: r.projects.map((p) => ({ ...p, skills: canon(p.skills) })),
    internships: r.internships.map((p) => ({ ...p, skills: canon(p.skills) })),
  };
}

const SYNTHETIC: SeniorRecord[] = (raw as SeniorRecord[]).map(normalizeRecord);

export function getSyntheticRecords(): SeniorRecord[] {
  return SYNTHETIC;
}

/** 검색·임베딩용 기록 텍스트 (선배 진술 필드 위주) */
export function recordToText(r: SeniorRecord): string {
  const parts = [
    `학과: ${r.department}`,
    r.academic_background.double_major ? `복수전공: ${r.academic_background.double_major}` : "",
    r.academic_background.minor ? `부전공: ${r.academic_background.minor}` : "",
    r.academic_background.graduate_degree ? `대학원: ${r.academic_background.graduate_degree}` : "",
    `현재 직무: ${r.current_role} (${r.organization_type})`,
    `진로 분야: ${r.career_field.map(fieldLabel).join(", ")} / 경로: ${PATH_TYPE_LABEL[r.path_type]}`,
    `핵심 역량: ${r.key_skills.map(skillLabel).join(", ")}`,
    `수강 과목: ${r.courses.map((c) => c.name).join(", ")}`,
    ...r.projects.map((p) => `프로젝트: ${p.title} - ${p.description}`),
    ...r.internships.map((p) => `인턴십: ${p.title} - ${p.description}`),
    ...r.career_decisions.map((d) => `결정: ${d.decision}. 이유: ${d.reason}`),
    `어려움: ${r.difficulties.join(" ")}`,
    `교훈: ${r.lessons_learned.join(" ")}`,
    `조언: ${r.advice.join(" ")}`,
    `맥락: ${r.context_tags.join(", ")}`,
  ];
  return parts.filter(Boolean).join("\n");
}
