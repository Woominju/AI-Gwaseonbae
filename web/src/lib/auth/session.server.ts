import "server-only";
/**
 * 서버 서명 세션 (HMAC-SHA256, HttpOnly · SameSite=Strict 쿠키).
 * 역할: student(익명) | alumni(초대 코드로 인증된 선배) | admin(ADMIN_TOKEN 로그인).
 * 클라이언트가 역할 값을 바꾸면 서명 검증에 실패하므로 권한을 얻을 수 없다.
 * SESSION_SECRET 이 없으면 프로세스마다 임의 비밀값을 생성한다(재시작 시 모든 세션 무효).
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type Role = "student" | "alumni" | "admin";

export interface Session {
  role: Role;
  /** 주체 ID: 학생 = 익명 ID, 선배 = alumni_id, 관리자 = "admin" */
  sub: string;
  exp: number;
}

export const COOKIE = "hufs_session";
const TTL: Record<Role, number> = { student: 30 * 86400_000, alumni: 7 * 86400_000, admin: 4 * 3600_000 };
const SECRET = (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 ? process.env.SESSION_SECRET : randomBytes(32).toString("hex")) as string;

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("base64url");

export function encodeSession(s: Session): string {
  const body = b64(JSON.stringify(s));
  return `${body}.${sign(body)}`;
}

export function decodeSession(raw: string | undefined | null, now = Date.now()): Session | null {
  if (!raw || raw.length > 2000) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expect = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (expect.length !== got.length || !timingSafeEqual(expect, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (!["student", "alumni", "admin"].includes(s.role) || typeof s.sub !== "string" || typeof s.exp !== "number" || s.exp < now) return null;
    return s;
  } catch {
    return null;
  }
}

export function newSession(role: Role, sub: string): Session {
  return { role, sub, exp: Date.now() + TTL[role] };
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return decodeSession(c.get(COOKIE)?.value);
}

export async function setSession(s: Session) {
  const c = await cookies();
  c.set(COOKIE, encodeSession(s), { httpOnly: true, sameSite: "strict", path: "/", secure: process.env.NODE_ENV === "production" && process.env.COOKIE_INSECURE !== "1", maxAge: Math.floor((s.exp - Date.now()) / 1000) });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

export function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

/** ADMIN_TOKEN 상수시간 비교. 토큰이 설정되지 않았거나 12자 미만이면 관리자 로그인 불가 */
export function checkAdminToken(t: unknown): boolean {
  const real = process.env.ADMIN_TOKEN ?? "";
  if (real.length < 12 || typeof t !== "string") return false;
  const a = Buffer.from(createHmac("sha256", "cmp").update(t).digest());
  const b = Buffer.from(createHmac("sha256", "cmp").update(real).digest());
  return timingSafeEqual(a, b);
}

/** 초대 코드 해시 (원문은 저장하지 않음) */
export function hashCode(code: string): string {
  return createHmac("sha256", "alumni-invite").update(code.trim().toUpperCase()).digest("hex");
}
