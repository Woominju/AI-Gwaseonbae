import { NextResponse } from "next/server";
import { blocked, body, err, notFound, str } from "@/lib/auth/guard.server";
import { newSession, setSession } from "@/lib/auth/session.server";
import { redeemInvite } from "@/lib/alumni/store.server";

const tries = new Map<string, number[]>();

export async function POST(req: Request) {
  if (blocked()) return notFound();
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local";
  const t = (tries.get(ip) ?? []).filter((x) => Date.now() - x < 600_000);
  if (t.length >= 10) return err("시도 횟수가 많습니다. 10분 후 다시 시도하세요.", 429);
  tries.set(ip, [...t, Date.now()]);
  const b = await body(req);
  const code = str(b.code, 40);
  const display_name = str(b.display_name, 20);
  if (!code || !display_name) return err("인증 코드와 표시 이름을 입력하세요.");
  const gy = Number(b.graduation_year);
  const al = redeemInvite(code, { display_name, department: str(b.department, 30), graduation_year: Number.isInteger(gy) && gy > 1950 && gy < 2100 ? gy : null });
  if (!al) return err("유효하지 않거나 이미 사용·만료된 인증 코드입니다.", 403);
  await setSession(newSession("alumni", al.id));
  return NextResponse.json({ ok: true, alumni: { id: al.id, verified: al.verified, demo: al.demo } });
}
