import { NextResponse } from "next/server";
import { body, err, notFound } from "@/lib/auth/guard.server";
import { checkAdminToken, newSession, setSession } from "@/lib/auth/session.server";
import { isPublicDemo } from "@/lib/demoMode";

const tries = new Map<string, number[]>();

export async function POST(req: Request) {
  if (isPublicDemo()) return notFound();
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const t = (tries.get(ip) ?? []).filter((x) => Date.now() - x < 600_000);
  if (t.length >= 10) return err("시도 횟수가 많습니다.", 429);
  tries.set(ip, [...t, Date.now()]);
  if (!checkAdminToken((await body(req)).token)) return err("관리자 토큰이 올바르지 않습니다 (ADMIN_TOKEN 미설정 시 로그인 불가).", 403);
  await setSession(newSession("admin", "admin"));
  return NextResponse.json({ ok: true });
}
