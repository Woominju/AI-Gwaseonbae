import { NextResponse } from "next/server";
import { blocked, err, notFound, requireRole } from "@/lib/auth/guard.server";
import { resolveReport } from "@/lib/alumni/store.server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  if (!resolveReport((await ctx.params).id)) return err("신고를 찾을 수 없습니다.", 404);
  return NextResponse.json({ ok: true });
}
