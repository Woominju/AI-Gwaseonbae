import { NextResponse } from "next/server";
import { blocked, body, err, notFound, str } from "@/lib/auth/guard.server";
import { getSession } from "@/lib/auth/session.server";
import { addReport } from "@/lib/alumni/store.server";

export async function POST(req: Request) {
  if (blocked()) return notFound();
  if (!(await getSession())) return err("로그인(학생으로 시작)이 필요합니다.", 401);
  const b = await body(req);
  const type = ["submission", "answer", "ai_message"].includes(b.target_type as string) ? (b.target_type as "submission") : null;
  const reason = str(b.reason, 500);
  if (!type || !reason) return err("신고 대상과 사유를 입력하세요.");
  addReport({ target_type: type, target_id: str(b.target_id, 60), reason });
  return NextResponse.json({ ok: true });
}
