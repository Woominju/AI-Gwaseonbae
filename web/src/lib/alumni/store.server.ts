import "server-only";
/**
 * 실제 선배 네트워크 저장소 (JSON 파일, 단일 프로세스 전제) — docs/USER_ROLES_3_0.md
 *  - 초대 코드(해시만 저장) → 선배 인증 → 경험 제출(pending) → 관리자 승인 → 공개
 *  - demo 플래그: 시연용으로 발급한 계정·경험은 "시연용 계정"으로만 표시하고 실제 동문으로 공개하지 않으며 RAG 에 넣지 않는다
 *  - 질문은 '검증 + 질문 수신 동의(mentoring_opt_in)'한 선배에게만 가능
 * 위치: web/data/alumni/store.json (git 제외). 운영 시에는 DB·백업·암호화로 교체 필요.
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { hashCode, randomId } from "../auth/session.server";

export type Visibility = "public" | "students_only" | "anonymous";

export interface Invite { code_hash: string; alumni_id: string; created_at: string; expires_at: string; used_at: string | null; demo: boolean; note: string }
export interface Alumni {
  id: string;
  display_name: string;
  department: string;
  graduation_year: number | null;
  verified: boolean;
  demo: boolean;
  mentoring_opt_in: boolean;
  visibility: Visibility;
  created_at: string;
  withdrawal_requested_at: string | null;
}
export interface ExperienceInput {
  current_role: string;
  career_field: string;
  path_type: "graduate_school" | "industry_job" | "finance" | "foreign_company" | "public_sector" | "career_switch";
  key_skills: string[];
  preparation: string;
  difficulties: string;
  advice: string;
}
export interface Submission {
  id: string;
  alumni_id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  experience: ExperienceInput;
  consent: { publish: boolean; use_for_ai: boolean; at: string };
  created_at: string;
  reviewed_at: string | null;
  review_note: string;
  demo: boolean;
}
export interface Question { id: string; student_sid: string; alumni_id: string; text: string; answer: string | null; status: "open" | "answered" | "closed"; created_at: string; answered_at: string | null }
export interface Report { id: string; target_type: "submission" | "answer" | "ai_message"; target_id: string; reason: string; status: "open" | "resolved"; created_at: string }
interface Store { invites: Invite[]; alumni: Alumni[]; submissions: Submission[]; questions: Question[]; reports: Report[]; audit: { at: string; actor: string; action: string; target: string }[] }

const DIR = path.join(process.cwd(), "data", "alumni");
const FILE = path.join(DIR, "store.json");
const empty = (): Store => ({ invites: [], alumni: [], submissions: [], questions: [], reports: [], audit: [] });

export function load(): Store {
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return empty();
  }
}

function save(s: Store) {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, FILE);
}

function mutate<T>(fn: (s: Store) => T): T {
  const s = load();
  const r = fn(s);
  save(s);
  return r;
}

const now = () => new Date().toISOString();
const audit = (s: Store, actor: string, action: string, target: string) => s.audit.push({ at: now(), actor, action, target });

/* ---------- 관리자 ---------- */

export function createInvite(opts: { note: string; demo: boolean; days?: number }): { code: string; alumni_id: string; expires_at: string } {
  const code = randomBytes(9).toString("base64url").replace(/[-_]/g, "X").slice(0, 12).toUpperCase();
  return mutate((s) => {
    const alumni_id = randomId("al");
    const exp = new Date(Date.now() + (opts.days ?? 14) * 86400_000).toISOString();
    s.invites.push({ code_hash: hashCode(code), alumni_id, created_at: now(), expires_at: exp, used_at: null, demo: opts.demo, note: opts.note.slice(0, 100) });
    audit(s, "admin", "invite.create", alumni_id);
    return { code, alumni_id, expires_at: exp };
  });
}

export function reviewSubmission(id: string, action: "approve" | "reject", note: string): Submission | null {
  return mutate((s) => {
    const sub = s.submissions.find((x) => x.id === id);
    if (!sub || sub.status !== "pending") return null;
    const al = s.alumni.find((a) => a.id === sub.alumni_id);
    if (action === "approve" && !al?.verified) return null; // 미인증 선배의 경험은 승인 불가
    sub.status = action === "approve" ? "approved" : "rejected";
    sub.reviewed_at = now();
    sub.review_note = note.slice(0, 300);
    audit(s, "admin", `submission.${action}`, id);
    return sub;
  });
}

/** 철회 처리: 선배 계정 비공개 + 경험 철회 + 미답변 질문 종료 */
export function processWithdrawal(alumniId: string): boolean {
  return mutate((s) => {
    const al = s.alumni.find((a) => a.id === alumniId);
    if (!al) return false;
    al.verified = false;
    al.mentoring_opt_in = false;
    al.display_name = "(철회됨)";
    for (const sub of s.submissions) if (sub.alumni_id === alumniId) sub.status = "withdrawn";
    for (const q of s.questions) if (q.alumni_id === alumniId && q.status === "open") q.status = "closed";
    audit(s, "admin", "alumni.withdraw", alumniId);
    return true;
  });
}

export function resolveReport(id: string): boolean {
  return mutate((s) => {
    const r = s.reports.find((x) => x.id === id);
    if (!r) return false;
    r.status = "resolved";
    audit(s, "admin", "report.resolve", id);
    return true;
  });
}

/* ---------- 선배 ---------- */

export function redeemInvite(code: string, profile: { display_name: string; department: string; graduation_year: number | null }): Alumni | null {
  const h = hashCode(code);
  return mutate((s) => {
    const inv = s.invites.find((i) => i.code_hash === h);
    if (!inv || inv.used_at || Date.parse(inv.expires_at) < Date.now()) return null;
    inv.used_at = now();
    const al: Alumni = {
      id: inv.alumni_id,
      display_name: profile.display_name.slice(0, 20),
      department: profile.department.slice(0, 30),
      graduation_year: profile.graduation_year,
      verified: true,
      demo: inv.demo,
      mentoring_opt_in: false,
      visibility: "students_only",
      created_at: now(),
      withdrawal_requested_at: null,
    };
    s.alumni.push(al);
    audit(s, al.id, "invite.redeem", al.id);
    return al;
  });
}

export function getAlumni(id: string): Alumni | undefined {
  return load().alumni.find((a) => a.id === id);
}

export function updateAlumniSettings(id: string, patch: { mentoring_opt_in?: boolean; visibility?: Visibility; withdrawal?: boolean }): Alumni | null {
  return mutate((s) => {
    const al = s.alumni.find((a) => a.id === id);
    if (!al || !al.verified) return null;
    if (typeof patch.mentoring_opt_in === "boolean") al.mentoring_opt_in = patch.mentoring_opt_in;
    if (patch.visibility) al.visibility = patch.visibility;
    if (patch.withdrawal) {
      al.withdrawal_requested_at = now();
      al.mentoring_opt_in = false;
    }
    audit(s, id, "alumni.settings", id);
    return al;
  });
}

export function submitExperience(alumniId: string, exp: ExperienceInput, consent: { publish: boolean; use_for_ai: boolean }): Submission | null {
  return mutate((s) => {
    const al = s.alumni.find((a) => a.id === alumniId);
    if (!al?.verified) return null;
    if (s.submissions.filter((x) => x.alumni_id === alumniId && x.status === "pending").length >= 5) return null;
    const sub: Submission = { id: randomId("sub"), alumni_id: alumniId, status: "pending", experience: exp, consent: { ...consent, at: now() }, created_at: now(), reviewed_at: null, review_note: "", demo: al.demo };
    s.submissions.push(sub);
    audit(s, alumniId, "submission.create", sub.id);
    return sub;
  });
}

export function answerQuestion(alumniId: string, qid: string, answer: string): Question | null {
  return mutate((s) => {
    const q = s.questions.find((x) => x.id === qid && x.alumni_id === alumniId);
    if (!q || q.status === "closed") return null;
    q.answer = answer.slice(0, 2000);
    q.status = "answered";
    q.answered_at = now();
    audit(s, alumniId, "question.answer", qid);
    return q;
  });
}

/* ---------- 학생 ---------- */

export function askQuestion(studentSid: string, alumniId: string, text: string): { ok: true; q: Question } | { ok: false; error: string } {
  return mutate((s) => {
    const al = s.alumni.find((a) => a.id === alumniId);
    if (!al || !al.verified || !al.mentoring_opt_in) return { ok: false as const, error: "질문 수신에 동의한 검증된 선배가 아닙니다." };
    const day = s.questions.filter((q) => q.student_sid === studentSid && Date.now() - Date.parse(q.created_at) < 86400_000);
    if (day.length >= 5) return { ok: false as const, error: "질문은 하루 5개까지 남길 수 있습니다." };
    const q: Question = { id: randomId("q"), student_sid: studentSid, alumni_id: alumniId, text: text.slice(0, 1000), answer: null, status: "open", created_at: now(), answered_at: null };
    s.questions.push(q);
    audit(s, "student", "question.create", q.id);
    return { ok: true as const, q };
  });
}

export function addReport(r: Omit<Report, "id" | "status" | "created_at">): Report {
  return mutate((s) => {
    const rep: Report = { ...r, reason: r.reason.slice(0, 500), id: randomId("rp"), status: "open", created_at: now() };
    s.reports.push(rep);
    return rep;
  });
}

/* ---------- 공개 조회 ---------- */

export function publicName(al: Alumni): string {
  return al.visibility === "anonymous" ? `${al.department || "학과 비공개"} 선배` : al.display_name;
}

export function board() {
  const s = load();
  const byId = new Map(s.alumni.map((a) => [a.id, a]));
  const approved = s.submissions.filter((x) => x.status === "approved" && x.consent.publish && byId.get(x.alumni_id)?.verified);
  const mentors = s.alumni.filter((a) => a.verified && a.mentoring_opt_in);
  return {
    experiences: approved.map((x) => {
      const al = byId.get(x.alumni_id)!;
      return { id: x.id, alumni_id: al.id, name: publicName(al), department: al.department, graduation_year: al.visibility === "anonymous" ? null : al.graduation_year, demo: x.demo, experience: x.experience, approved_at: x.reviewed_at };
    }),
    mentors: mentors.map((a) => ({ id: a.id, name: publicName(a), department: a.department, demo: a.demo })),
    counts: { real_verified_experiences: approved.filter((x) => !x.demo).length, demo_experiences: approved.filter((x) => x.demo).length, real_mentors: mentors.filter((m) => !m.demo).length, demo_mentors: mentors.filter((m) => m.demo).length },
  };
}

/** RAG 에 넣을 수 있는 경험: 승인 + 검증 + 실제(비시연) + AI 활용 동의 */
export function aiUsableExperiences() {
  const s = load();
  const byId = new Map(s.alumni.map((a) => [a.id, a]));
  return s.submissions.filter((x) => x.status === "approved" && !x.demo && x.consent.use_for_ai && byId.get(x.alumni_id)?.verified).map((x) => ({ sub: x, alumni: byId.get(x.alumni_id)! }));
}

export function adminOverview() {
  const s = load();
  return {
    pending: s.submissions.filter((x) => x.status === "pending"),
    submissions: s.submissions,
    alumni: s.alumni,
    invites: s.invites.map(({ code_hash: _h, ...rest }) => (void _h, rest)),
    reports: s.reports,
    questions: { total: s.questions.length, open: s.questions.filter((q) => q.status === "open").length },
    audit: s.audit.slice(-50),
  };
}

export function questionsForStudent(sid: string) {
  const s = load();
  return s.questions.filter((q) => q.student_sid === sid).map((q) => ({ ...q, student_sid: undefined, alumni_name: (() => { const a = s.alumni.find((x) => x.id === q.alumni_id); return a ? publicName(a) : "?"; })() }));
}

export function questionsForAlumni(id: string) {
  return load().questions.filter((q) => q.alumni_id === id).map((q) => ({ ...q, student_sid: undefined }));
}

export function submissionsForAlumni(id: string) {
  return load().submissions.filter((x) => x.alumni_id === id);
}
