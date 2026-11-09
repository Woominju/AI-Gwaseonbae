/**
 * 공개 시연 보안 미들웨어 (Node.js 런타임 — 런타임 환경변수 사용).
 * PUBLIC_DEMO=1 일 때만 동작:
 *   1) 관리자·Import·평가 경로 404
 *   2) 클라이언트별 API 요청 속도 제한 (메모리, 단일 프로세스)
 *   3) API 요청 본문 크기 제한
 * 모든 응답에 기본 보안 헤더를 붙인다.
 */
import { NextResponse, type NextRequest } from "next/server";
import { isDemoBlockedPath, isPublicDemo } from "@/lib/demoMode";

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|fonts/|favicon.ico).*)"],
};

const WINDOW_MS = 60_000;
const LIMITS = { chat: 12, api: 120 }; // 분당 요청 수
const MAX_BODY = 64 * 1024;
const hits = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}

function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return arr.length > limit;
}

function withHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export function middleware(req: NextRequest) {
  if (!isPublicDemo()) return withHeaders(NextResponse.next());
  const { pathname } = req.nextUrl;
  if (isDemoBlockedPath(pathname)) {
    return withHeaders(new NextResponse("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } }));
  }
  if (pathname.startsWith("/api/")) {
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_BODY) return withHeaders(NextResponse.json({ error: "요청 본문이 너무 큽니다." }, { status: 413 }));
    const ip = clientKey(req);
    const isChat = pathname === "/api/chat" || pathname === "/api/lounge/chat"; // 라운지도 상담 엔진(runChat)을 호출
    if (rateLimited(`${isChat ? "chat" : "api"}:${ip}`, isChat ? LIMITS.chat : LIMITS.api)) {
      return withHeaders(NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429, headers: { "retry-after": "30" } }));
    }
  }
  const res = withHeaders(NextResponse.next());
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
