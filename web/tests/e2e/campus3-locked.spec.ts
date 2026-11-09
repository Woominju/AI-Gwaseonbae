import { expect, test } from "@playwright/test";

test("공개 시연 잠금 + 3.0: 관리자·선배 쓰기 404, 실제 선배 데이터 비노출, 외부 API 미호출, 상담 속도 제한", async ({ page, request }) => {
  const st = await (await request.get("/api/status")).json();
  expect(st.public_demo).toBe(true);
  for (const p of ["/admin", "/admin/alumni", "/api/admin/overview", "/api/admin/ai-demo"]) expect((await request.get(p)).status(), p).toBe(404);
  expect((await request.post("/api/admin/login", { data: { token: "x" } })).status()).toBe(404);
  expect((await request.post("/api/alumni/redeem", { data: { code: "X" } })).status()).toBe(404);
  expect((await request.post("/api/questions", { data: {} })).status()).toBe(404);
  const b = await (await request.get("/api/alumni/board")).json();
  expect(b.experiences).toEqual([]);
  const src = await (await request.get("/api/career/sources")).json();
  expect(src.sources.every((s: { mode: string }) => s.mode !== "live")).toBe(true);
  await page.goto("/campus?scene=hub");
  await page.getByTestId("senior-1").click();
  await page.getByTestId("lounge-starter").nth(0).click();
  await expect(page.getByTestId("senior-msg").nth(1)).toBeVisible();
  let limited = 0;
  for (let i = 0; i < 15; i++) if ((await request.post("/api/lounge/chat", { headers: { "cf-connecting-ip": "198.51.100.33" }, data: { question: "데이터 분석 준비", place: "hub", persona: "warm", profile: {} } })).status() === 429) limited++;
  expect(limited).toBeGreaterThan(0);
});
