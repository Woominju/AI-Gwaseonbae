import { NextResponse } from "next/server";
import { blocked, notFound, requireRole } from "@/lib/auth/guard.server";
import { questionsForAlumni } from "@/lib/alumni/store.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (blocked()) return notFound();
  const s = await requireRole("alumni");
  if (s instanceof NextResponse) return s;
  return NextResponse.json({ questions: questionsForAlumni(s.sub) });
}
