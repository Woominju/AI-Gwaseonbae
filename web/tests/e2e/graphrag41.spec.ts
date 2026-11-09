import { expect, test } from "@playwright/test";

const EMPTY = { interest_fields: [], skills: [], career_types: [], values: [] };
const ADMIN = { "x-admin-token": "test-admin-token-123456" };
const turn = async (request: import("@playwright/test").APIRequestContext, question: string) => (await request.post("/api/lounge/chat", { data: { question, profile: EMPTY, history: [], place: "hub", persona: "analytical", greeting: "polite" } })).json();

test("관계 탐색: 검색 → 국소 그래프 → 상세의 출처 → 필터·깊이 → AI 선배 질문 연결", async ({ page }) => {
  await page.goto("/graph");
  await page.getByTestId("tab-explore").click();
  await expect(page.getByTestId("graph-notice")).toContainText("가상 시연");
  await expect(page.getByTestId("graph-detail-title")).toHaveText("데이터 분석가");
  await page.getByTestId("graph-search").fill("확률론");
  await page.getByTestId("graph-suggestion").first().click();
  await expect(page.getByTestId("graph-detail-title")).toHaveText("확률론");
  await expect(page.getByTestId("graph-detail")).toContainText("가상 수강편람");
  await expect(page.getByTestId("graph-detail")).toContainText("2026학년도");
  await expect(page.getByTestId("relation-status").first()).toBeVisible();
  const count = () => page.locator(".react-flow__node").count();
  await expect.poll(count).toBeGreaterThan(2);
  const one = await count();
  expect(one).toBeLessThanOrEqual(15);
  await page.getByTestId("depth-2").click();
  await expect.poll(count).toBeGreaterThan(one);
  expect(await count()).toBeLessThanOrEqual(25);
  await page.getByTestId("depth-1").click();
  await expect.poll(count).toBe(one);
  await page.getByTestId("filter-역량").click();
  await expect.poll(count).toBeLessThan(one);
  await page.getByTestId("graph-ask").click();
  await expect(page.getByTestId("lounge-input")).toHaveValue(/확률론 과목이 데이터 분석 진로/);
});

test("상담: 관계 근거가 출처 등급과 함께 표시되고 탐색 화면으로 이어진다", async ({ page }) => {
  await page.goto("/campus?scene=hub");
  await page.getByTestId("senior-0").click();
  await page.getByTestId("lounge-input").fill("수학과 학생이 데이터 분석가가 되려면 어떤 수업을 검토하면 좋을까요?");
  await page.getByTestId("lounge-send").click();
  await page.getByTestId("toggle-graph").click();
  await expect(page.getByTestId("lounge-graph")).toContainText("가상 수강편람");
  for (const b of await page.getByTestId("graph-fact-status").all()) await expect(b).toHaveText(/가상 시연|추론 후보|검증된/);
  await page.getByTestId("action-explore").click();
  await expect(page.getByTestId("graph-explorer")).toBeVisible();
});

test("필수 사례: 규칙 답변과 없는 관계", async ({ request }) => {
  const a = async (q: string) => (await turn(request, q)).core;
  expect((await a("수리통계학은 어느 학과에서 개설하나요?")).answer).toContain("수학과");
  expect((await a("선형대수학의 선수 과목이 수강편람에 명시되어 있나요?")).answer).toContain("기재되어 있지 않아요");
  expect((await a("확률론을 들으면 취업이 보장되나요?")).direct_kind).toBe("guarantee");
  expect((await a("2025학년도와 2026학년도 확률론 교과정보가 다르면 어떻게 답하나요?")).direct_kind).toBe("year_diff");
  expect((await a("비공개로 전환되거나 동의가 철회된 Q&A를 검색할 수 있나요?")).direct_kind).toBe("permission");
  expect((await a("양자역학과 마케팅 직무의 관계를 알려줘")).direct_kind).toBe("not_found");
  const real = await turn(request, "실제 한국외대 선배의 경험을 알려주세요.");
  expect(real.stage).toBe("real_alumni");
  expect(real.intro).toContain("없");
});

test("철회 회귀: 승인 후 그래프에 나타나고, 철회 즉시 그래프·상담·검색에서 사라진다", async ({ request }) => {
  const tag = `철회검증${Date.now().toString(36)}`;
  const q = `${tag} 확률론 수업이 진로에 어떤 도움을 주었나요`;
  const c = await request.post("/api/admin/qa", { headers: ADMIN, data: { question_text: q, answer_text: `${tag} 확률론 공부가 도움이 되었습니다`, source_type: "interview", source_reference: tag, consent_status: "consented", visibility: "public", department: "수학과", career_category: "data_science" } });
  const id = (await c.json()).item.question_id as string;
  const inGraph = async () => JSON.stringify(await (await request.get(`/api/graph/explore?center=${encodeURIComponent(`AlumniQA:${id}`)}`)).json()).includes(id);
  const inChat = async () => JSON.stringify(await turn(request, q)).includes(id);
  const inSearch = async () => JSON.stringify(await (await request.get(`/api/graph/explore?q=${encodeURIComponent(tag)}`)).json()).includes(id);
  expect(await inGraph()).toBe(false); // 승인 전
  await request.post(`/api/admin/qa/${id}`, { headers: ADMIN, data: { action: "verify", pii_checked: true } });
  expect(await inGraph()).toBe(true);
  expect(await inChat()).toBe(true);
  expect(await inSearch()).toBe(true);
  await request.post(`/api/admin/qa/${id}`, { headers: ADMIN, data: { action: "withdraw" } });
  expect(await inGraph()).toBe(false);
  expect(await inChat()).toBe(false);
  expect(await inSearch()).toBe(false);
});
