import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole } from "@/lib/auth/guard.server";
import { processWithdrawal } from "@/lib/alumni/store.server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  if ((await body(req)).action !== "withdraw") return err("action 은 withdraw");
  if (!processWithdrawal((await ctx.params).id)) return err("선배를 찾을 수 없습니다.", 404);
  return NextResponse.json({ ok: true });
}
