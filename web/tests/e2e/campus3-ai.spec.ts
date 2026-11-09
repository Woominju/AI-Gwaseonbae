import { expect, test } from "@playwright/test";

const ADMIN = { "x-admin-token": "test-admin-token-123456" };

/** 실제 생성형 AI(Qwen3-14B) 시연 모드 — AI_DEMO_GATE=1 인스턴스 + vLLM(8019) 필요 */
test("생성형 AI 시연: 비활성=CPU → 60분 시작=LLM 자유 대화·근거 상담 → 종료=즉시 CPU", async ({ page, request }) => {
  test.setTimeout(300_000);
  await request.delete("/api/admin/ai-demo", { headers: ADMIN });
  let st = await (await request.get("/api/status")).json();
  expect(st.ai_demo.gate).toBe(true);
  expect(st.llm.id).toBe("demo");
  expect((await request.post("/api/admin/ai-demo", { headers: ADMIN, data: { minutes: 30 } })).status()).toBe(400);
  expect((await request.post("/api/admin/ai-demo", { headers: ADMIN, data: { minutes: 60 } })).status()).toBe(200);
  st = await (await request.get("/api/status")).json();
  expect(st.llm.id).toBe("local");
  expect(st.ai_demo.active).toBe(true);

  await page.goto("/campus?scene=hub");
  await expect(page.getByTestId("engine-badge")).toContainText("생성형 AI 상담");
  await page.getByTestId("senior-0").click();
  await page.getByTestId("lounge-input").fill("안녕하세요! 선배는 어떤 걸 좋아해요?");
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("lounge-mode").nth(0)).toContainText("생성형 AI", { timeout: 60_000 });
  await page.getByTestId("lounge-input").fill("저는 AI 분야에 관심이 있어요. 대학원과 취업 중 무엇을 먼저 고민해야 할까요?");
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("lounge-mode").last()).toContainText("생성형 AI 상담", { timeout: 120_000 });
  await expect(page.getByTestId("lounge-core-answer").last()).toContainText("계산값 해석");
  await page.getByTestId("toggle-evidence").last().click();
  await expect(page.getByTestId("lounge-evidence").last()).toContainText("가상");

  // 종료 → 이후 요청은 CPU Demo
  await request.delete("/api/admin/ai-demo", { headers: ADMIN });
  await page.getByTestId("lounge-input").fill("데이터 분석가가 되려면 무엇이 필요한가요?");
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("lounge-mode").last()).toContainText("CPU Demo", { timeout: 60_000 });
  const ds = await (await request.get("/api/admin/ai-demo", { headers: ADMIN })).json();
  expect(ds.active).toBe(false);
});
