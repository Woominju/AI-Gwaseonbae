import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole, str } from "@/lib/auth/guard.server";
import { submitExperience, type ExperienceInput } from "@/lib/alumni/store.server";
import { CAREER_FIELDS, canonicalSkill } from "@/lib/taxonomy";
import { detectInjection } from "@/lib/security/injection";

const PATHS = ["graduate_school", "industry_job", "finance", "foreign_company", "public_sector", "career_switch"] as const;
const PII = /\d{2,3}-\d{3,4}-\d{4}|[\w.+-]+@[\w-]+\.[\w.]+|\d{6}-\d{7}|20\d{6}/;

export async function POST(req: Request) {
  if (blocked()) return notFound();
  const s = await requireRole("alumni");
  if (s instanceof NextResponse) return s;
  const b = await body(req);
  const exp: ExperienceInput = {
    current_role: str(b.current_role, 60),
    career_field: CAREER_FIELDS.some((f) => f.id === b.career_field) ? (b.career_field as string) : "",
    path_type: PATHS.includes(b.path_type as (typeof PATHS)[number]) ? (b.path_type as ExperienceInput["path_type"]) : "industry_job",
    key_skills: (Array.isArray(b.key_skills) ? b.key_skills : []).slice(0, 10).map((x) => canonicalSkill(String(x).slice(0, 30))).filter(Boolean),
    preparation: str(b.preparation, 1500),
    difficulties: str(b.difficulties, 800),
    advice: str(b.advice, 800),
  };
  if (!exp.current_role || !exp.career_field || !exp.preparation) return err("직무, 분야, 준비 과정은 필수입니다.");
  const text = [exp.current_role, exp.preparation, exp.difficulties, exp.advice].join(" ");
  if (PII.test(text)) return err("연락처·이메일·주민번호·학번 등 개인정보는 적지 마세요.");
  if (detectInjection(text).length) return err("시스템 지시문으로 보이는 문구는 등록할 수 없습니다.");
  if (b.consent_publish !== true) return err("공개 동의가 필요합니다.");
  const sub = submitExperience(s.sub, exp, { publish: true, use_for_ai: b.consent_ai === true });
  if (!sub) return err("등록할 수 없습니다 (미인증 계정이거나 검토 대기 5건 초과).", 403);
  return NextResponse.json({ submission: sub });
}
