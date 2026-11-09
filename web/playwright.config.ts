import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: scripts/test_servers_4_0.sh 로 띄운 격리 서버를 사용한다.
 *  - 3410 : 기능 ON (CPU Demo) · 3411 : 기능 OFF · 3412 : 공개 시연 잠금 · 3413 : 실제 LLM(선택)
 * 기본 포트를 실행 중인 서비스(3100·3101·3200·3310·3320)로 두지 않는다: 테스트가 쓰기 API 를 호출하기 때문이다.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "../results/e2e/artifacts/report.json" }]],
  outputDir: "../results/e2e/artifacts",
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", locale: "ko-KR" },
  projects: [
    { name: "full-desktop", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_FULL_URL ?? "http://127.0.0.1:3411" }, testIgnore: /no-api|mobile|public-demo|campus[0-9]?-[a-z-]+\.spec|persona4|graphrag41/ },
    { name: "full-mobile", use: { ...devices["Pixel 7"], baseURL: process.env.E2E_FULL_URL ?? "http://127.0.0.1:3411" }, testMatch: /mobile/ },
    { name: "public-demo", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_DEMO_URL ?? "http://127.0.0.1:3412" }, testMatch: /public-demo/ },
    // AI 과선배 2.0·3.0 (워크트리 검증 인스턴스)
    { name: "campus", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_CAMPUS_URL ?? "http://127.0.0.1:3410" }, testMatch: /campus-market|campus3-(scenario|roles)|persona4\.spec|graphrag41\.spec/ },
    { name: "campus-phone", use: { ...devices["Pixel 7"], baseURL: process.env.E2E_CAMPUS_URL ?? "http://127.0.0.1:3410" }, testMatch: /campus3-phone|persona4-phone|graphrag41-phone/ },
    { name: "campus-off", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_CAMPUS_OFF_URL ?? "http://127.0.0.1:3411" }, testMatch: /campus3-flags|graphrag41-off/ },
    { name: "campus-lock", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_CAMPUS_LOCK_URL ?? "http://127.0.0.1:3412" }, testMatch: /campus3-locked/ },
    { name: "campus-ai", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_CAMPUS_AI_URL ?? "http://127.0.0.1:3413" }, testMatch: /campus3-ai/ },
    { name: "no-api", use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_NOAPI_URL ?? "http://127.0.0.1:3411" }, testMatch: /no-api/ },
  ],
});
