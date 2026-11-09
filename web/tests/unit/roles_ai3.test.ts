import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { classifyTurn } from "@/lib/lounge/stage";
import type { StudentProfile } from "@/lib/types";

const EMPTY: StudentProfile = { interest_fields: [], skills: [], career_types: [], values: [] };
const cwd0 = process.cwd();
let tmp = "";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }), headers: async () => new Headers() }));

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hufs3-"));
  process.chdir(tmp); // 저장소 파일을 임시 폴더에 생성
  process.env.FEATURE_ALUMNI_NETWORK = "1";
  process.env.FEATURE_CAMPUS_LOUNGE = "1";
});
afterAll(() => {
  process.chdir(cwd0);
  fs.rmSync(tmp, { recursive: true, force: true });
  delete process.env.AI_DEMO_GATE;
});

describe("서명 세션", () => {
  it("역할 변조·만료·잘못된 서명은 거부", async () => {
    const { encodeSession, decodeSession, newSession } = await import("@/lib/auth/session.server");
    const tok = encodeSession(newSession("student", "st_1"));
    expect(decodeSession(tok)?.role).toBe("student");
    const [body, sig] = tok.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), role: "admin" })).toString("base64url");
    expect(decodeSession(`${forged}.${sig}`)).toBeNull();
    expect(decodeSession(encodeSession({ role: "alumni", sub: "x", exp: Date.now() - 1 }))).toBeNull();
    expect(decodeSession("garbage")).toBeNull();
  });
  it("ADMIN_TOKEN 이 없거나 짧으면 관리자 로그인 불가", async () => {
    const { checkAdminToken } = await import("@/lib/auth/session.server");
    delete process.env.ADMIN_TOKEN;
    expect(checkAdminToken("")).toBe(false);
    process.env.ADMIN_TOKEN = "short";
    expect(checkAdminToken("short")).toBe(false);
    process.env.ADMIN_TOKEN = "a-very-long-admin-token-123";
    expect(checkAdminToken("a-very-long-admin-token-123")).toBe(true);
    expect(checkAdminToken("a-very-long-admin-token-124")).toBe(false);
  });
});

describe("실제 선배 워크플로", () => {
  it("초대 → 인증 → 경험 제출(대기) → 승인 → 게시판, 시연 계정은 실제 동문 수에 포함 안 됨", async () => {
    const st = await import("@/lib/alumni/store.server");
    const real = st.createInvite({ note: "테스트-실제", demo: false });
    const demo = st.createInvite({ note: "테스트-시연", demo: true });
    expect(st.redeemInvite("WRONGCODE000", { display_name: "x", department: "", graduation_year: null })).toBeNull();
    const a = st.redeemInvite(real.code, { display_name: "김선배", department: "수학과", graduation_year: 2020 })!;
    expect(a.verified).toBe(true);
    expect(st.redeemInvite(real.code, { display_name: "재사용", department: "", graduation_year: null })).toBeNull(); // 1회용
    const d = st.redeemInvite(demo.code, { display_name: "시연선배", department: "통계 계열", graduation_year: 2019 })!;
    const exp = { current_role: "데이터 분석가", career_field: "data_science", path_type: "industry_job" as const, key_skills: ["sql"], preparation: "SQL 프로젝트", difficulties: "", advice: "작게 시작" };
    const s1 = st.submitExperience(a.id, exp, { publish: true, use_for_ai: true })!;
    const s2 = st.submitExperience(d.id, exp, { publish: true, use_for_ai: true })!;
    expect(s1.status).toBe("pending");
    expect(st.board().experiences).toHaveLength(0); // 승인 전 비공개
    st.reviewSubmission(s1.id, "approve", "");
    st.reviewSubmission(s2.id, "approve", "");
    const b = st.board();
    expect(b.counts.real_verified_experiences).toBe(1);
    expect(b.counts.demo_experiences).toBe(1);
    expect(st.aiUsableExperiences().map((x) => x.sub.id)).toEqual([s1.id]); // 시연 계정은 RAG 제외
    // 질문: 동의 전 불가 → 동의 후 가능 → 철회 시 종료
    expect(st.askQuestion("st_1", a.id, "준비 기간이 궁금해요").ok).toBe(false);
    st.updateAlumniSettings(a.id, { mentoring_opt_in: true });
    const q = st.askQuestion("st_1", a.id, "준비 기간이 궁금해요");
    expect(q.ok).toBe(true);
    expect(st.questionsForStudent("st_2")).toHaveLength(0); // 다른 학생의 질문은 보이지 않음
    st.processWithdrawal(a.id);
    expect(st.board().counts.real_verified_experiences).toBe(0);
    expect(st.questionsForAlumni(a.id)[0].status).toBe("closed");
    // 초대 코드 원문은 저장하지 않음
    expect(fs.readFileSync(path.join(tmp, "data/alumni/store.json"), "utf8")).not.toContain(real.code);
  });
});

describe("AI 시연 게이트", () => {
  it("게이트: 비활성 → 차단, 시작 → 허용, 만료·재시작 이전 세션 → 차단, 한도", async () => {
    process.env.AI_DEMO_GATE = "1";
    process.env.AI_DEMO_MAX_CONCURRENCY = "1";
    const d = await import("@/lib/aiDemo.server");
    expect(d.llmAllowed()).toBe(false);
    expect(d.acquireLLM("u", "t").ok).toBe(false);
    expect(() => d.startDemo(30, "t")).toThrow();
    d.startDemo(60, "test");
    expect(d.llmAllowed()).toBe(true);
    const a = d.acquireLLM("u", "t");
    expect(a.ok).toBe(true);
    expect(d.acquireLLM("u2", "t").ok).toBe(false); // 동시 1개 제한
    if (a.ok) a.release({ prompt_tokens: 10, completion_tokens: 5 });
    expect(d.demoStatus().usage.prompt_tokens).toBe(10);
    const file = path.join(tmp, "data/runtime/ai_demo.json");
    const st = JSON.parse(fs.readFileSync(file, "utf8"));
    fs.writeFileSync(file, JSON.stringify({ ...st, expires_at: Date.now() - 1 }));
    expect(d.llmAllowed()).toBe(false); // 만료
    expect(JSON.parse(fs.readFileSync(file, "utf8")).active).toBe(false);
    fs.writeFileSync(file, JSON.stringify({ ...st, active: true, started_at: d.BOOT_AT - 1000, expires_at: Date.now() + 3600_000 }));
    expect(d.llmAllowed()).toBe(false); // 이전 프로세스에서 시작된 세션은 무효
    d.startDemo(120, "test");
    d.stopDemo("manual");
    expect(d.llmAllowed()).toBe(false);
    delete process.env.AI_DEMO_GATE;
    expect(d.llmAllowed()).toBe(true); // 게이트 없는 인스턴스는 기존 동작
  });
});

describe("AI 상담 3.0 질문 유형·문맥", () => {
  it("유형 분류", () => {
    expect(classifyTurn("안녕하세요!", EMPTY).stage).toBe("smalltalk");
    expect(classifyTurn("선배는 나중에 뭐 하고 싶어요?", EMPTY).stage).toBe("character");
    expect(classifyTurn("안녕하세요! 선배는 어떤 걸 좋아해요?", EMPTY).stage).toBe("character");
    expect(classifyTurn("우리 학교 실제 선배의 경험을 알려주세요.", EMPTY).stage).toBe("real_alumni");
    expect(classifyTurn("실제 선배와 대화할 수 있나요?", EMPTY).stage).toBe("real_alumni");
    expect(classifyTurn("선배들은 인턴십을 어떻게 준비했나요?", EMPTY).stage).toBe("career");
    expect(classifyTurn("수학과 학생인데 어떤 직업을 선택할 수 있나요?", EMPTY).stage).toBe("career");
    expect(classifyTurn("저는 진로가 너무 막막해요.", EMPTY).stage).toBe("light");
  });
  it("다중 턴: 앞에서 말한 관심 분야를 이어받는다", async () => {
    const { carriedFields } = await import("@/lib/lounge/turn.server");
    const h = [{ role: "user" as const, content: "저는 AI 분야에 관심이 있어요." }, { role: "assistant" as const, content: "좋아요" }];
    expect(carriedFields("그럼 대학원에 가야 할까요?", h)).toContain("ai_ml");
    expect(carriedFields("데이터 분석은요?", h)).toEqual([]); // 현재 질문에 분야가 있으면 이어받지 않음
  });
  it("가짜 경험담 검출", async () => {
    const { FABRICATION } = await import("@/lib/lounge/turn.server");
    expect(FABRICATION.test("제가 졸업했을 때는 취업이 쉬웠어요")).toBe(true);
    expect(FABRICATION.test("내가 다녔던 회사에서는")).toBe(true);
    expect(FABRICATION.test("나는 AI라서 실제로 졸업하거나 취업한 경험은 없어")).toBe(false);
  });
  it("CPU 모드: 캐릭터 질문은 AI임을 밝히고, 실제 선배 요청은 저장소 집계로 답한다", async () => {
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const c = await handleLoungeTurn({ question: "선배는 나중에 뭐 하고 싶어요?", profile: EMPTY, history: [], place: "plaza", persona: "warm", greeting: "casual" });
    expect(c.stage).toBe("character");
    expect(c.intro).toContain("AI 선배");
    expect(c.core).toBeUndefined();
    const r = await handleLoungeTurn({ question: "실제 선배와 대화할 수 있나요?", profile: EMPTY, history: [], place: "plaza", persona: "warm", greeting: "casual" });
    expect(r.stage).toBe("real_alumni");
    expect(r.actions.map((a) => a.id)).toContain("alumni");
  });
});
