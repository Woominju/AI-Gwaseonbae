import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole } from "@/lib/auth/guard.server";
import { getAlumni, submissionsForAlumni, updateAlumniSettings, type Visibility } from "@/lib/alumni/store.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (blocked()) return notFound();
  const s = await requireRole("alumni");
  if (s instanceof NextResponse) return s;
  const al = getAlumni(s.sub);
  if (!al) return err("선배 정보를 찾을 수 없습니다.", 404);
  return NextResponse.json({ alumni: al, submissions: submissionsForAlumni(al.id) });
}

export async function PATCH(req: Request) {
  if (blocked()) return notFound();
  const s = await requireRole("alumni");
  if (s instanceof NextResponse) return s;
  const b = await body(req);
  const vis = ["public", "students_only", "anonymous"].includes(b.visibility as string) ? (b.visibility as Visibility) : undefined;
  const al = updateAlumniSettings(s.sub, { mentoring_opt_in: typeof b.mentoring_opt_in === "boolean" ? b.mentoring_opt_in : undefined, visibility: vis, withdrawal: b.withdrawal === true });
  if (!al) return err("변경할 수 없습니다.", 403);
  return NextResponse.json({ alumni: al });
}
