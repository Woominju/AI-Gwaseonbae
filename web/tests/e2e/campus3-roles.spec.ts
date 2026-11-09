import { expect, test } from "@playwright/test";

const ADMIN = { "x-admin-token": "test-admin-token-123456" };

test("역할 분리: 서버 권한 검증 · 선배 인증 · 승인 전 비공개 · 시연용 계정 표시 · 질문/답변", async ({ browser, request }) => {
  // 권한 없는 접근
  expect((await request.get("/api/admin/overview")).status()).toBe(401);
  await request.post("/api/session/student");
  expect((await request.get("/api/admin/overview")).status()).toBe(403); // 학생 세션으로 관리자 API 불가
  expect((await request.get("/api/admin/overview", { headers: { cookie: "hufs_session=eyJyb2xlIjoiYWRtaW4ifQ.forged" } })).status()).toBe(401); // 위조 쿠키
  expect((await request.post("/api/alumni/submissions", { data: { current_role: "x" } })).status()).toBe(403); // 학생은 경험 등록 불가
  const before = (await (await request.get("/api/alumni/board")).json()).experiences.length;
  // 관리자: 시연용 인증 코드 발급
  const inv = await (await request.post("/api/admin/invites", { headers: ADMIN, data: { note: "E2E 시연", demo: true } })).json();
  expect(inv.code).toMatch(/^[A-Z0-9]{12}$/);

  // 선배: 코드 인증 → 경험 등록
  const actx = await browser.newContext();
  const al = await actx.newPage();
  await al.goto("/alumni/join");
  await al.getByLabel("인증 코드").fill("WRONGCODE123");
  await al.getByLabel("표시 이름").fill("테스트선배");
  await al.getByTestId("join-submit").click();
  await expect(al.getByTestId("join-error")).toBeVisible();
  await al.getByLabel("인증 코드").fill(inv.code);
  await al.getByLabel("학과").fill("수학과");
  await al.getByTestId("join-submit").click();
  await expect(al).toHaveURL(/\/alumni\/me/);
  await expect(al.getByTestId("alumni-status")).toContainText("시연용 계정");
  const myId = (await (await al.request.get("/api/session")).json()).alumni.id as string;
  await al.getByLabel("현재(또는 첫) 직무").fill("데이터 분석가");
  await al.getByLabel("핵심 역량 (쉼표로 구분)").fill("SQL, 파이썬");
  await al.getByLabel("학업·준비 과정").fill("SQL 프로젝트와 공모전으로 준비했어요. 연락처 없이 작성.");
  await al.getByTestId("consent-publish").check();
  await al.getByTestId("exp-submit").click();
  await expect(al.getByTestId("exp-msg")).toContainText("관리자 검토 후");

  // 승인 전: 게시판 비공개
  let board = await (await request.get("/api/alumni/board")).json();
  expect(board.experiences.length).toBe(before);
  const ov = await (await request.get("/api/admin/overview", { headers: ADMIN })).json();
  expect((await request.post(`/api/admin/submissions/${ov.pending[0].id}`, { headers: ADMIN, data: { action: "approve" } })).status()).toBe(200);
  board = await (await request.get("/api/alumni/board")).json();
  expect(board.experiences.length).toBe(before + 1);
  expect(board.counts.real_verified_experiences).toBe(0); // 시연용 계정은 실제 동문 수에 포함 안 됨

  // 학생: 질문 가능한 선배 없음 → 선배가 질문 받기 켬 → 질문 → 답변
  const sctx = await browser.newContext();
  const st = await sctx.newPage();
  await st.goto("/");
  await st.getByTestId("role-student").click();
  await st.goto("/alumni");
  await expect(st.getByTestId("alumni-experiences")).toContainText("시연용 계정");
  await al.getByTestId("optin").check();
  await st.reload();
  await st.getByTestId("mentor-select").selectOption(myId);
  await st.getByTestId("question-text").fill("SQL은 얼마나 공부하셨나요?");
  await st.getByTestId("question-send").click();
  await expect(st.getByTestId("ask-msg")).toContainText("질문을 남겼어요");
  await al.reload();
  await al.getByTestId("answer-input").fill("하루 1시간씩 3개월 했어요.");
  await al.getByTestId("answer-send").click();
  await st.reload();
  await expect(st.getByTestId("question-answer")).toContainText("3개월");
  await actx.close();
  await sctx.close();
});
