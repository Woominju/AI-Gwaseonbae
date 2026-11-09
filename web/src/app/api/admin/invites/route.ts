import { NextResponse } from "next/server";
import { blocked, body, notFound, requireRole, str } from "@/lib/auth/guard.server";
import { createInvite } from "@/lib/alumni/store.server";

/** 선배 인증 코드 발급 — 코드는 응답에서 한 번만 보여 주고 해시만 저장 */
export async function POST(req: Request) {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  const b = await body(req);
  return NextResponse.json(createInvite({ note: str(b.note, 100), demo: b.demo !== false }));
}
