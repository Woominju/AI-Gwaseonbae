import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole, str } from "@/lib/auth/guard.server";
import { reviewQa } from "@/lib/qa/store.server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  const b = await body(req);
  const action = b.action === "verify" || b.action === "reject" || b.action === "withdraw" ? b.action : null;
  if (!action) return err("action 은 verify, reject, withdraw 중 하나여야 합니다.");
  const r = reviewQa((await ctx.params).id, action, s.sub, str(b.note, 300), b.pii_checked === true);
  if (!r.ok) return err(r.error, r.status);
  return NextResponse.json({ item: r.item });
}
