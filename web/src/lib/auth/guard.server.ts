import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isPublicDemo } from "../demoMode";
import { checkAdminToken, getSession, type Role, type Session } from "./session.server";

export const notFound = () => new NextResponse("Not Found", { status: 404 });
export const err = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export function alumniFeature(): boolean {
  return process.env.FEATURE_ALUMNI_NETWORK === "1";
}

/** 쓰기·개인 기능: 기능 꺼짐 또는 공개 시연 모드면 404 */
export function blocked(): boolean {
  return !alumniFeature() || isPublicDemo();
}

/** 서버 측 역할 검증. 관리자는 세션 또는 x-admin-token(스크립트용)으로 인정 */
export async function requireRole(role: Role): Promise<Session | NextResponse> {
  if (role === "admin") {
    const h = await headers();
    if (checkAdminToken(h.get("x-admin-token"))) return { role: "admin", sub: "admin", exp: Date.now() + 60_000 };
  }
  const s = await getSession();
  if (!s) return err("로그인이 필요합니다.", 401);
  if (s.role !== role) return err("권한이 없습니다.", 403);
  return s;
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return {}; // JSON 요청만 처리 (CSRF 완화)
  const b = await req.json().catch(() => ({}));
  return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
}

export const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");
