import { expect, test } from "@playwright/test";

test("모바일: 메뉴 이동, 시연 프로필, 대시보드·비교", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("cta-demo").click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("match-card").first()).toBeVisible();
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("link", { name: "진로 비교" }).click();
  await expect(page).toHaveURL(/\/compare/);
  // 모든 우선순위 버튼이 화면 안에 있어야 한다
  const vw = page.viewportSize()!.width;
  for (const id of ["preset-research", "preset-fast_job", "preset-keep_options", "preset-balanced"]) {
    const b = (await page.getByTestId(id).boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(vw);
  }
  await page.getByTestId("preset-fast_job").click();
  await expect(page.getByTestId("top-option")).toContainText("취업");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
