import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole, str } from "@/lib/auth/guard.server";
import { reviewSubmission } from "@/lib/alumni/store.server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  const b = await body(req);
  const action = b.action === "approve" || b.action === "reject" ? b.action : null;
  if (!action) return err("action 은 approve 또는 reject");
  const r = reviewSubmission((await ctx.params).id, action, str(b.note, 300));
  if (!r) return err("검토할 수 없는 항목입니다 (대기 상태 아님 또는 미인증 선배).", 409);
  return NextResponse.json({ submission: r });
}
