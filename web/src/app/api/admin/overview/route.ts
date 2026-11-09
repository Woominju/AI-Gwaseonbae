import { NextResponse } from "next/server";
import { blocked, notFound, requireRole } from "@/lib/auth/guard.server";
import { adminOverview } from "@/lib/alumni/store.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  return NextResponse.json(adminOverview());
}
