import { expect, test } from "@playwright/test";

test("플래그 꺼짐: 관계 탐색 API 404, 탭 없음, 기존 그래프 유지", async ({ page, request }) => {
  expect((await request.get("/api/graph/explore")).status()).toBe(404);
  await page.goto("/graph?view=explore");
  await expect(page.getByTestId("graph-tabs")).toHaveCount(0);
  await expect(page.getByText("커리어 그래프").first()).toBeVisible();
});
