import { expect, test } from "@playwright/test";

test("모바일 관계 탐색: 캔버스 대신 주변 관계와 상세를 보여 주고 잘리지 않는다", async ({ page }) => {
  await page.goto("/graph?view=explore&center=" + encodeURIComponent("Course:확률론"));
  await expect(page.getByTestId("graph-detail-title")).toHaveText("확률론");
  await expect(page.getByTestId("graph-canvas")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.getByTestId("relation").first().getByRole("button").click();
  await expect(page.getByTestId("graph-detail-title")).not.toHaveText("확률론");
  await page.getByTestId("graph-search").fill("통계");
  await expect(page.getByTestId("graph-suggestion").first()).toBeVisible();
});
