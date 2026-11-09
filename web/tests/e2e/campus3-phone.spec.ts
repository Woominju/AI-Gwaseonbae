import { expect, test } from "@playwright/test";

test("모바일: 캐릭터 만들기 → 캠퍼스 터치 이동 → 대화 탭 전환", async ({ page }) => {
  await page.goto("/wardrobe?step=create");
  await page.getByTestId("create-done").click();
  await page.goto("/campus?scene=hub");
  await expect(page.getByTestId("campus-scene")).toBeVisible();
  const before = await page.getByTestId("student-avatar").getAttribute("style");
  const box = (await page.getByTestId("campus-scene").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.85);
  await expect.poll(() => page.getByTestId("student-avatar").getAttribute("style")).not.toBe(before);
  await page.getByTestId("talk-button").click();
  await expect(page.getByTestId("lounge-chat")).toBeVisible();
  await page.getByTestId("lounge-starter").first().click();
  await expect(page.getByTestId("senior-msg").nth(1)).toBeVisible();
  await page.getByTestId("mobile-scene").click();
  await expect(page.getByTestId("campus-scene")).toBeVisible();
});
