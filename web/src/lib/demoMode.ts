/**
 * 외부 공개 시연 모드 (PUBLIC_DEMO=1).
 * - 관리자 화면·Import·평가 API를 서버에서 차단 (404)
 * - 가져온(실제) 데이터는 로딩하지 않고 가상 시연 데이터만 사용
 * - API 요청 속도 제한·본문 크기 제한 (middleware.ts)
 * 런타임 환경변수로 판정하므로 같은 빌드를 내부용(3100)·공개 시연용(3200)으로 함께 쓸 수 있다.
 */
export function isPublicDemo(): boolean {
  return process.env.PUBLIC_DEMO === "1";
}

/** 공개 시연에서 차단하는 경로 (페이지 + API) */
export const DEMO_BLOCKED_PREFIXES = ["/admin", "/api/import", "/api/eval", "/api/admin"];

export function isDemoBlockedPath(pathname: string): boolean {
  const p = pathname.toLowerCase().replace(/\/+$/, "");
  return DEMO_BLOCKED_PREFIXES.some((b) => p === b || p.startsWith(b + "/"));
}
