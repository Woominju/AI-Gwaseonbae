import { expect, test } from "@playwright/test";

test("Career Market · Skill Gap: 연동 상태 정직 표시, 미확인≠부족, 로드맵 연계", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("cta-demo").click();
  await page.goto("/market?occupation=data_analyst");
  await expect(page.getByTestId("source-saramin")).toContainText("테스트 Fixture");
  await expect(page.getByTestId("source-work24")).toContainText("미연동");
  await expect(page.getByTestId("ncs-panel")).toContainText("실제 NCS 원문이 아닌 예시");
  await expect(page.getByTestId("postings-panel")).toContainText("가상 공고");
  await expect(page.getByTestId("demand-table")).toContainText("SQL");
  await page.getByTestId("go-gap").click();
  await expect(page.getByTestId("gap-held")).toContainText("Python");
  await expect(page.getByTestId("gap-unconfirmed")).toContainText("SQL");
  await expect(page.getByTestId("gap-panel")).toContainText("부족한 역량이 아닙니다");
  await page.getByTestId("add-roadmap").click();
  await expect(page.getByTestId("roadmap-added")).toBeVisible();
  await page.goto("/roadmap");
  await expect(page.getByText("역량 점검·학습").first()).toBeVisible();
  await page.goto("/market?occupation=software_engineer");
  await expect(page.getByTestId("occupation-select")).toHaveValue("software_engineer");
});
