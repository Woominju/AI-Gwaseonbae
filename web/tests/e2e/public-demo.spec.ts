import { expect, test } from "@playwright/test";

test("공개 시연(3200): 관리자 차단, 메뉴 숨김, 가상 데이터 표시, CPU 핵심 흐름", async ({ page, request }) => {
  const st = await (await request.get("/api/status")).json();
  expect(st.public_demo).toBe(true);
  expect(st.llm.id).toBe("demo");
  expect((await request.get("/admin")).status()).toBe(404);
  expect((await request.post("/api/import", { data: { format: "json", content: "[]", commit: true } })).status()).toBe(404);
  expect((await request.post("/api/eval", { data: { kind: "retrieval" } })).status()).toBe(404);

  await page.goto("/");
  await page.getByTestId("cta-demo").click();
  await expect(page.getByTestId("match-card").first()).toBeVisible();
  await expect(page.getByTestId("synthetic-notice").first()).toContainText("가상 데이터");
  await expect(page.getByRole("link", { name: "데이터·평가" })).toHaveCount(0);
  await expect(page.getByTestId("retrieval-method")).toContainText("로컬");

  await page.goto("/graph");
  await page.locator(".react-flow__node", { hasText: "AI·머신러닝" }).first().click();
  await expect(page.getByTestId("graph-evidence")).toContainText("가상 S-");

  await page.goto("/chat");
  await page.getByTestId("example-question").first().click();
  await expect(page.getByTestId("answer-source").first()).toContainText("Demo Mode");

  await page.goto("/compare");
  await page.getByTestId("preset-research").click();
  await expect(page.getByTestId("top-option")).toContainText("대학원");
  await page.getByTestId("preset-fast_job").click();
  await expect(page.getByTestId("top-option")).toContainText("취업");
  page.on("dialog", (d) => d.accept());
  await page.getByTestId("to-roadmap").click();
  await page.getByTestId("generate-roadmap").click();
  await page.getByTestId("roadmap-item").first().getByRole("checkbox").check();
  await page.reload();
  await expect(page.getByTestId("roadmap-item").first().getByRole("checkbox")).toBeChecked();
});
