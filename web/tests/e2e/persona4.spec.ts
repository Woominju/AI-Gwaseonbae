import { expect, test } from "@playwright/test";

const Q = "저는 수학과 학생이고 AI 분야에 관심이 있어요. 대학원과 취업 중 고민돼요.";

async function talk(page: import("@playwright/test").Page) {
  await page.goto("/campus?scene=hub");
  await page.getByTestId("senior-0").click();
  await expect(page.getByTestId("style-toggle")).toBeVisible();
}

async function ask(page: import("@playwright/test").Page, text: string) {
  await page.getByTestId("lounge-input").fill(text);
  await page.getByTestId("lounge-send").click();
}

test("스타일 선택·블렌딩·저장·다시 듣기: 사실 답변은 같고 설명만 달라진다", async ({ page }) => {
  await talk(page);
  await expect(page.getByTestId("style-current")).toHaveText("공감형"); // 하루(따뜻한 선배)의 기본값
  await ask(page, Q);
  await expect(page.getByTestId("persona-view").last()).toBeVisible();
  await expect(page.getByTestId("lounge-mode").last()).toContainText("CPU Demo");
  const core1 = await page.getByTestId("lounge-core-answer").last().innerText();
  const view1 = await page.getByTestId("persona-view").last().innerText();

  await page.getByTestId("style-toggle").click();
  await page.getByTestId("style-strategy").click();
  await page.getByTestId("style-blend").check();
  await page.getByTestId("style-second-empathy").click();
  await page.getByTestId("style-weight-70").click();
  await expect(page.getByTestId("style-preview")).toContainText("예시");
  await page.getByTestId("style-apply").click();
  await expect(page.getByTestId("style-current")).toHaveText("전략형 70 · 공감형 30");

  await page.getByTestId("style-replay").click();
  await expect(page.getByTestId("persona-view")).toHaveCount(2);
  await expect(page.getByTestId("persona-view").last()).toContainText("전략형 70 · 공감형 30");
  expect(await page.getByTestId("lounge-core-answer").last().innerText()).toBe(core1);
  expect(await page.getByTestId("persona-view").last().innerText()).not.toBe(view1);
  await expect(page.getByTestId("style-replay")).toHaveCount(0);

  await page.getByTestId("decision-brief").last().locator("summary").click();
  await expect(page.getByTestId("decision-brief").last()).toContainText("확률이 아니에요");

  await page.reload();
  await page.getByTestId("senior-0").click();
  await expect(page.getByTestId("style-current")).toHaveText("전략형 70 · 공감형 30");
});

test("근거 출처 구분: Q&A 는 가상 배지로 표시되고 실제 선배로 표기되지 않는다", async ({ page }) => {
  await talk(page);
  await ask(page, "대학원 연구실에 연락하기 전에 무엇을 해야 하나요?");
  await expect(page.getByTestId("toggle-qa").last()).toBeVisible();
  await page.getByTestId("toggle-qa").last().click();
  const tiers = page.getByTestId("qa-tier");
  expect(await tiers.count()).toBeGreaterThan(0);
  for (const t of await tiers.all()) await expect(t).toContainText("가상");
  await expect(page.getByTestId("lounge-qa")).toContainText("가상 시연 Q&A");
  await expect(page.getByTestId("lounge-qa")).not.toContainText("실제 선배 Q");
});

test("Q&A 승인 절차: 미승인 항목은 상담에 쓰이지 않고, 승인·철회가 즉시 반영된다", async ({ page, request }) => {
  const ADMIN = { "x-admin-token": "test-admin-token-123456" };
  const marker = `가상검증단어${Date.now().toString(36)}`;
  const text = `${marker} 직무를 준비하려면 관련 경험을 어떻게 쌓아야 하나요?`;
  const created = await request.post("/api/admin/qa", { headers: ADMIN, data: { question_text: text, answer_text: `${marker} 직무는 작은 프로젝트로 시작했습니다.`, source_type: "interview", source_reference: `e2e-${marker}`, consent_status: "consented", visibility: "public", department: "수학과", career_category: "ai_ml" } });
  expect(created.status()).toBe(201);
  const id = (await created.json()).item.question_id as string;
  const qaIds = async () => (await (await request.post("/api/lounge/chat", { data: { question: text, profile: { interest_fields: [], skills: [], career_types: [], values: [] }, history: [], place: "hub", persona: "warm", greeting: "polite" } })).json()).core.qa.map((q: { id: string }) => q.id) as string[];
  expect(await qaIds()).not.toContain(id);
  expect((await request.post(`/api/admin/qa/${id}`, { headers: ADMIN, data: { action: "verify", pii_checked: false } })).status()).toBe(400);
  expect((await request.post(`/api/admin/qa/${id}`, { headers: ADMIN, data: { action: "verify", pii_checked: true } })).status()).toBe(200);
  expect(await qaIds()).toContain(id);
  expect((await request.post(`/api/admin/qa/${id}`, { headers: ADMIN, data: { action: "withdraw" } })).status()).toBe(200);
  expect(await qaIds()).not.toContain(id);
  expect((await request.get("/api/admin/qa")).status()).toBe(401);
  await page.goto("/campus");
});

test("장애 대응: 응답 없음은 취소할 수 있고, 프록시 오류는 사람이 읽을 수 있는 문구로 보인다", async ({ page }) => {
  await talk(page);
  await page.route("**/api/lounge/chat", () => {});
  await ask(page, Q);
  await expect(page.getByTestId("lounge-waiting")).toBeVisible();
  await page.getByTestId("lounge-cancel").click();
  await expect(page.getByTestId("lounge-waiting")).toHaveCount(0);
  await expect(page.getByTestId("lounge-input")).toBeEnabled();
  await page.unroute("**/api/lounge/chat");
  await page.route("**/api/lounge/chat", (r) => r.fulfill({ status: 524, contentType: "text/html", body: "<html>timeout</html>" }));
  await ask(page, Q);
  await expect(page.getByText("서버가 요청을 처리하지 못했어요")).toBeVisible();
  await expect(page.getByText("Unexpected token")).toHaveCount(0);
});

test("상태 조회 실패에도 화면이 멈추지 않는다", async ({ page }) => {
  await page.route("**/api/status", (r) => r.fulfill({ status: 429, contentType: "application/json", body: '{"error":"too many"}' }));
  await page.goto("/dashboard");
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.getByText("확인 실패").first()).toBeVisible();
  await page.goto("/campus?scene=hub");
  await expect(page.getByTestId("engine-badge")).toContainText("상태 확인 실패");
});

test("정적 파일을 받지 못하면 안내가 뜬다", async ({ page }) => {
  await page.route("**/_next/static/chunks/**", (r) => r.fulfill({ status: 400, body: "" }));
  await page.goto("/campus?scene=hub", { waitUntil: "load" });
  await expect(page.getByTestId("asset-error")).toBeVisible();
});
