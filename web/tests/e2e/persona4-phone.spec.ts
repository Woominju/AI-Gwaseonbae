import { expect, test } from "@playwright/test";

test("모바일: 스타일 선택기가 잘리지 않고, 캠퍼스 버튼이 정리되어 있다", async ({ page }) => {
  await page.goto("/campus?scene=hub");
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await expect(page.getByTestId("sound-controls")).toBeHidden();
  await page.getByTestId("more-toggle").click();
  await expect(page.getByTestId("sound-controls")).toBeVisible();
  await page.getByTestId("more-toggle").click();

  await page.getByTestId("talk-button").click();
  await expect(page.getByTestId("style-toggle")).toBeVisible();
  await page.getByTestId("style-toggle").click();
  await page.getByTestId("style-reflection").click();
  await page.getByTestId("style-blend").check();
  await page.getByTestId("style-weight-50").click();
  const vp = page.viewportSize()!;
  for (const id of ["style-reflection", "style-weight-80", "style-apply"]) {
    await page.getByTestId(id).scrollIntoViewIfNeeded();
    const b = (await page.getByTestId(id).boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
    expect(b.height).toBeGreaterThanOrEqual(28);
  }
  await page.getByTestId("style-apply").click();
  await expect(page.getByTestId("style-current")).toContainText("성찰형 50");
  await expect(page.getByTestId("lounge-input")).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test("모바일: Career Market 에 가로 넘침이 없다", async ({ page }) => {
  await page.goto("/market");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
