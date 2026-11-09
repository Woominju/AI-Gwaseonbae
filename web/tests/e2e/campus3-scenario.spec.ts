import { expect, test } from "@playwright/test";

/** 지시서 3.0 §15 핵심 E2E 시나리오 1~18 (CPU Demo) */
test("학생: 역할 선택 → 캐릭터 생성 → 옷장 → 광장·두 캠퍼스 → AI 선배 상담 → 근거 → Career Market → 역량 비교 → 로드맵 → 복귀 → 새로고침 유지", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/"); // 1
  await page.getByTestId("role-student").click(); // 2
  await expect(page).toHaveURL(/\/wardrobe\?step=create/);
  await expect(page.getByTestId("avatar-create")).toBeVisible(); // 3
  await page.getByRole("button", { name: "단발 보브" }).click();
  await page.getByTestId("create-done").click();
  await expect(page.getByTestId("wardrobe")).toBeVisible();
  await page.getByTestId("slot-hair").click(); // 4
  await page.getByTestId("item-hair_curly").click();
  await page.getByTestId("slot-top").click();
  await page.getByTestId("item-top_knit").click();
  await page.getByTestId("wardrobe-save").click(); // 5
  await expect(page.getByTestId("wardrobe-toast")).toContainText("저장");
  await page.getByTestId("wardrobe-to-plaza").click(); // 6
  await expect(page).toHaveURL(/scene=hub/);
  await expect(page.getByTestId("student-avatar")).toBeVisible();
  const before = await page.getByTestId("student-avatar").getAttribute("style");
  await page.getByTestId("campus-scene").focus(); // 7
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.getByTestId("student-avatar").getAttribute("style")).not.toBe(before);
  await page.getByTestId("tab-world-seoul").click(); // 8
  await expect(page).toHaveURL(/scene=seoul_yard/);
  await page.getByTestId("tab-seoul_library").click();
  await expect(page).toHaveURL(/scene=seoul_library/);
  await page.getByTestId("tab-world-global").click(); // 9
  await expect(page).toHaveURL(/scene=global_lake/);
  await page.getByTestId("senior-0").click(); // 10
  await expect(page.getByTestId("senior-msg").first()).toBeVisible();
  await page.getByTestId("lounge-input").fill("선배는 나중에 뭐 하고 싶어요?"); // 11 자유 질문
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("senior-msg").nth(1)).toContainText("AI 선배"); // 12 AI임을 밝히며 답함
  await page.getByTestId("lounge-input").fill("저는 AI 분야에 관심이 있어요. 대학원에 갈지 취업할지 고민돼요.");
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("lounge-core-answer").last()).toContainText("LLM이 아니라");
  await page.getByTestId("toggle-evidence").last().click(); // 13
  await expect(page.getByTestId("lounge-evidence").last().getByRole("link").first()).toBeVisible();
  await page.getByTestId("action-market").last().click(); // 14
  await expect(page).toHaveURL(/\/market/);
  await expect(page.getByTestId("source-saramin")).toContainText("테스트 Fixture");
  await page.getByTestId("go-gap").click(); // 15
  await expect(page.getByTestId("gap-panel")).toContainText("부족한 역량이 아닙니다");
  await page.getByTestId("add-roadmap").click(); // 16
  await expect(page.getByTestId("roadmap-added")).toBeVisible();
  await page.goto("/roadmap");
  await expect(page.getByText("역량 점검·학습").first()).toBeVisible();
  await page.getByTestId("return-lounge").click(); // 17
  await expect(page).toHaveURL(/scene=global_lake/);
  await expect(page.getByTestId("user-msg").first()).toBeVisible();
  await page.reload(); // 18
  await expect(page.getByTestId("student-avatar")).toBeVisible();
  const look = await page.evaluate(() => JSON.parse(localStorage.getItem("hufs-atlas:wardrobe:v1") ?? "{}"));
  expect(look.hair).toBe("hair_curly");
  expect(look.top).toBe("top_knit");
  await page.goto("/roadmap");
  await expect(page.getByText("역량 점검·학습").first()).toBeVisible();
});

test("월드 인터랙션: 실내 이동·객체·소리 기본 꺼짐·움직임 줄이기·위기 안내·실제 선배 질문", async ({ page }) => {
  await page.goto("/campus?scene=seoul_yard");
  await expect(page.getByTestId("sound-toggle")).toHaveAttribute("aria-pressed", "false");
  await page.getByTestId("obj-door_library").click();
  await expect(page.getByTestId("object-popup")).toContainText("도서관");
  await page.getByTestId("object-go").click();
  await expect(page).toHaveURL(/scene=seoul_library/);
  await page.getByTestId("obj-lamp").click();
  await expect(page.getByTestId("object-popup")).toContainText("스탠드");
  await page.getByTestId("tab-seoul_cafe").click();
  await expect(page).toHaveURL(/scene=seoul_cafe/);
  await page.getByTestId("sound-toggle").click();
  await expect(page.getByTestId("sound-toggle")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("reduce-motion").check();
  await page.reload();
  await expect(page.getByTestId("reduce-motion")).toBeChecked();
  await page.getByTestId("reduce-motion").uncheck();
  await page.getByTestId("senior-1").click();
  await page.getByTestId("lounge-input").fill("실제 선배와 대화할 수 있나요?");
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("lounge-mode").last()).toContainText("저장소 집계");
  await expect(page.getByTestId("action-alumni").last()).toBeVisible();
  await page.getByTestId("lounge-input").fill("요즘 너무 힘들어서 죽고 싶다는 생각이 들어요");
  await page.getByTestId("lounge-send").click();
  await expect(page.getByTestId("safety-box")).toContainText("109");
});
