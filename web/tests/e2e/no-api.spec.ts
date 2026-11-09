import { expect, test } from "@playwright/test";

test("API 키·GPU 없이: 로컬 검색 + Demo Mode 로 핵심 흐름 동작", async ({ page, request }) => {
  const st = await (await request.get("/api/status")).json();
  expect(st.llm.id).toBe("demo");
  expect(st.ml.ok).toBe(false);
  await page.goto("/");
  await page.getByTestId("cta-demo").click();
  await expect(page.getByTestId("match-card").first()).toBeVisible();
  await expect(page.getByTestId("retrieval-method")).toContainText("로컬");
  await page.goto("/chat");
  await page.getByTestId("example-question").first().click();
  await expect(page.getByTestId("answer-source").first()).toContainText("Demo Mode");
  await expect(page.getByTestId("assistant-answer").first()).toContainText("LLM이 아니라");
  await expect(page.getByTestId("chat-comparison")).toBeVisible();
  await page.goto("/compare");
  await page.getByTestId("preset-research").click();
  await expect(page.getByTestId("top-option")).toContainText("대학원");
  await page.getByTestId("preset-fast_job").click();
  await expect(page.getByTestId("top-option")).toContainText("취업");
});
