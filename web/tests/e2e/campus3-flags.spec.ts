import { expect, test } from "@playwright/test";

test("Feature Flag 꺼짐: 3.0 신규 경로 404 · 기존 화면 동일", async ({ page, request }) => {
  const st = await (await request.get("/api/status")).json();
  expect(st.features).toMatchObject({ campus_lounge: false, career_intel: false, alumni_network: false });
  for (const p of ["/campus", "/campus?scene=hub", "/wardrobe", "/market", "/alumni", "/alumni/join"]) expect((await request.get(p)).status(), p).toBe(404);
  for (const p of ["/api/alumni/board", "/api/questions", "/api/admin/overview"]) expect((await request.get(p)).status(), p).toBe(404);
  await page.goto("/");
  await expect(page.getByTestId("role-select")).toHaveCount(0);
  await page.getByTestId("cta-demo").click();
  await expect(page.getByTestId("match-card").first()).toBeVisible();
});
