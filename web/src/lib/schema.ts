/**
 * 런타임 검증 스키마 (zod). types.ts 와 구조가 일치해야 한다.
 * 실제 선배 데이터 Import 시 이 스키마로 검증한다.
 */
import { z } from "zod";

const str = z.string().trim();

export const ExperienceSchema = z.object({
  title: str.min(1),
  kind: z.enum(["project", "internship", "research", "competition", "extracurricular"]),
  description: str.default(""),
  skills: z.array(str).default([]),
  duration_months: z.number().min(0).max(120).optional(),
  when: str.optional(),
  org_type: str.optional(),
  self_reported_link: z.boolean().optional(),
});

export const SeniorRecordSchema = z.object({
  record_id: str.regex(/^[A-Za-z0-9_-]{1,40}$/, "record_id는 영문/숫자/-/_ 1~40자"),
  department: str.min(1),
  department_is_demo_category: z.boolean().default(false),
  graduation_year: z.number().int().min(1960).max(2100),
  career_field: z.array(str).min(1),
  path_type: z.enum(["graduate_school", "industry_job", "finance", "foreign_company", "public_sector", "career_switch"]),
  current_role: str.min(1),
  organization_type: str.default("미기재"),
  academic_background: z.object({
    major: str.min(1),
    double_major: str.optional(),
    minor: str.optional(),
    graduate_degree: str.optional(),
  }),
  key_skills: z.array(str).default([]),
  courses: z.array(z.object({ name: str.min(1), skills_developed: z.array(str).default([]) })).default([]),
  projects: z.array(ExperienceSchema).default([]),
  internships: z.array(ExperienceSchema).default([]),
  certifications: z.array(str).default([]),
  career_decisions: z
    .array(z.object({ decision: str.min(1), alternatives: z.array(str).default([]), reason: str.default(""), when: str.optional() }))
    .default([]),
  preparation_timeline: z
    .array(
      z.object({
        month_offset: z.number().int().min(-120).max(240),
        label: str.default(""),
        activity: str.min(1),
        category: z.enum(["study", "project", "internship", "certification", "application", "research", "reflection"]),
      }),
    )
    .default([]),
  months_to_first_role: z.number().min(0).max(240).nullable().default(null),
  difficulties: z.array(str).default([]),
  lessons_learned: z.array(str).default([]),
  advice: z.array(str).default([]),
  context_tags: z.array(str).default([]),
  evidence_source: z.object({
    type: z.enum(["synthetic_demo", "survey_self_report", "interview_verified"]),
    description: str.default(""),
  }),
  source_date: str.regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  consent_status: z.enum(["synthetic_not_applicable", "consented", "consent_withdrawn", "pending"]),
  is_synthetic: z.boolean(),
});

export const StudentProfileSchema = z.object({
  department: str.max(40).optional(),
  grade: z.number().int().min(1).max(5).optional(),
  double_major: str.max(40).optional(),
  minor: str.max(40).optional(),
  interest_fields: z.array(str.max(40)).max(12).default([]),
  skills: z.array(str.max(40)).max(40).default([]),
  has_project: z.boolean().optional(),
  has_internship: z.boolean().optional(),
  has_research: z.boolean().optional(),
  experience_notes: str.max(1000).optional(),
  target_timing: z.enum(["within_1y", "1_2y", "2y_plus", "undecided"]).optional(),
  career_types: z.array(z.enum(["employment", "graduate", "public", "global", "undecided"])).default([]),
  grad_school_pref: z.number().min(0).max(1).optional(),
  fast_employment_pref: z.number().min(0).max(1).optional(),
  financial_constraint: z.enum(["none", "some", "strong"]).optional(),
  weekly_hours: z.number().min(0).max(80).optional(),
  values: z.array(str.max(40)).max(10).default([]),
  concern: str.max(1000).optional(),
});

export const MatchWeightsSchema = z.object({
  semantic: z.number().min(0).max(1),
  career: z.number().min(0).max(1),
  skill: z.number().min(0).max(1),
  context: z.number().min(0).max(1),
  evidence: z.number().min(0).max(1),
});

export const PriorityWeightsSchema = z.object({
  research_depth: z.number().min(0).max(1),
  time_to_income: z.number().min(0).max(1),
  flexibility: z.number().min(0).max(1),
  readiness_fit: z.number().min(0).max(1),
  financial_burden: z.number().min(0).max(1),
  evidence_support: z.number().min(0).max(1),
});
