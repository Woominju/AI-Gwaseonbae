import { expect, test, type Page } from "@playwright/test";

async function fillDemoProfile(page: Page) {
  await page.goto("/");
  await expect(page.getByText("나만의 진로 경로")).toBeVisible();
  await page.getByTestId("cta-start").click();
  await expect(page).toHaveURL(/\/profile/);
  await page.getByLabel(/소속 학과/).selectOption("수학과");
  await page.getByLabel("학년").selectOption("3");
  const fields = page.getByTestId("interest-fields");
  await fields.getByRole("button", { name: "AI·머신러닝" }).click();
  await fields.getByRole("button", { name: "데이터 사이언스·분석" }).click();
  await page.getByRole("button", { name: "대학원 진학" }).click();
  await page.getByRole("button", { name: "기업 취업" }).click();
  await page.getByLabel("보유 역량").fill("파이썬, 통계, 선형대수");
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(page.getByTestId("skills")).toContainText("Python");
  // 프로젝트 있음 / 인턴십 없음
  await page.locator("div", { hasText: /^프로젝트 경험있음없음미입력$/ }).getByRole("button", { name: "있음" }).click();
  await page.locator("div", { hasText: /^인턴십 경험있음없음미입력$/ }).getByRole("button", { name: "없음" }).click();
  await page.getByLabel("지금의 고민 (선택)").fill("대학원 진학과 학부 졸업 후 취업 사이에서 고민하고 있어요.");
  await page.getByTestId("save-profile").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("시연 시나리오 1~11: 프로필 → 추천 → 그래프 → 상담 → 비교 재계산 → 로드맵 저장", async ({ page }) => {
  // 1~2
  await fillDemoProfile(page);
  // 3. 개인화 추천 + 가상 데이터 안내
  await expect(page.getByTestId("synthetic-notice").first()).toContainText("본 사례는 서비스 기능 시연을 위한 가상 데이터입니다");
  const cards = page.getByTestId("match-card");
  await expect(cards.first()).toBeVisible();
  await expect(cards.first()).toContainText("이 선배 경로가 추천된 이유");
  const topText = await cards.first().innerText();
  expect(topText).toMatch(/S-0(1|6|2|4)/);

  // 가중치 변경 → 점수 재계산
  const before = await page.getByTestId("match-score").allInnerTexts();
  await page.getByTestId("weight-preset-context_first").click();
  await expect.poll(async () => (await page.getByTestId("match-score").allInnerTexts()).join()).not.toBe(before.join());

  // 4. 선배 준비 과정 확인
  await cards.first().getByRole("link", { name: /준비 과정·근거 기록 보기/ }).click();
  await expect(page.getByText("준비 타임라인")).toBeVisible();
  await expect(page.getByTestId("is-synthetic")).toHaveText("true");

  // 5. 그래프 탐색
  await page.goto("/graph");
  await expect(page.getByTestId("graph-stats")).toBeVisible();
  await page.locator(".react-flow__node", { hasText: "AI·머신러닝" }).first().click();
  await expect(page.getByTestId("graph-evidence")).toContainText("가상 S-01");

  // 6~7. 상담: 대학원 vs 취업 비교
  await page.goto("/chat");
  await page.getByTestId("example-question").first().click();
  const answer = page.getByTestId("assistant-answer").first();
  await expect(answer).toBeVisible({ timeout: 150_000 });
  await expect(page.getByTestId("chat-comparison")).toBeVisible();
  await expect(page.getByTestId("evidence-panel")).toContainText("가상 S-");
  await expect(page.getByTestId("answer-source").first()).toBeVisible();

  // 8~9. 우선순위 변경 → 재계산
  await page.goto("/compare");
  await page.getByTestId("preset-research").click();
  await expect(page.getByTestId("top-option")).toContainText("대학원");
  const gradResearch = await page.getByTestId("score-graduate").innerText();
  await page.getByTestId("preset-fast_job").click();
  await expect(page.getByTestId("top-option")).toContainText("취업");
  await expect(page.getByTestId("change-panel")).toContainText("1순위가 바뀌었습니다");
  expect(await page.getByTestId("score-graduate").innerText()).not.toBe(gradResearch);

  // 10. 로드맵 생성
  await page.getByTestId("to-roadmap").click();
  await expect(page).toHaveURL(/\/roadmap\?option=employment/);
  page.on("dialog", (d) => d.accept());
  await page.getByTestId("generate-roadmap").click();
  await expect(page.getByTestId("roadmap-item").first()).toBeVisible();
  await expect(page.getByTestId("roadmap-basis")).toContainText("취업");

  // 11. 체크 → 저장 → 새로고침 후 유지
  await page.getByTestId("roadmap-item").first().getByRole("checkbox").check();
  const prog = await page.getByTestId("roadmap-progress").innerText();
  expect(prog).not.toBe("0%");
  await page.reload();
  await expect(page.getByTestId("roadmap-item").first().getByRole("checkbox")).toBeChecked();
  await expect(page.getByTestId("roadmap-progress")).toHaveText(prog);
});

test("근거 부족·공식 정보 질문은 지어내지 않는다", async ({ page }) => {
  await page.goto("/chat");
  await page.getByTestId("chat-input").fill("졸업 요건 학점이 몇 학점인가요?");
  await page.getByTestId("chat-send").click();
  const a = page.getByTestId("assistant-answer").last();
  await expect(a).toContainText("공식 자료", { timeout: 60_000 });
  await page.getByTestId("chat-input").fill("오늘 저녁 메뉴 추천해 줘");
  await page.getByTestId("chat-send").click();
  await expect(page.getByText("근거 부족").last()).toBeVisible({ timeout: 60_000 });
});

test("선배 DB 필터와 평가 모듈", async ({ page }) => {
  await page.goto("/seniors");
  await expect(page.getByTestId("senior-count")).toHaveText("19건");
  await page.getByLabel("학과").selectOption("수학과");
  await expect(page.getByTestId("senior-count")).toHaveText("6건");
  await page.getByTestId("senior-search").fill("학부연구생");
  await expect(page.getByTestId("senior-count")).toHaveText("1건"); // 수학과 + 학부연구생 = S-01
  await page.goto("/admin");
  await page.getByTestId("run-retrieval-eval").click();
  await expect(page.getByTestId("retrieval-eval")).toContainText("키워드 (BM25)", { timeout: 60_000 });
});
