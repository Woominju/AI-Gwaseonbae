import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth/session.server";
import { alumniFeature } from "@/lib/auth/guard.server";
import { getAlumni, publicName } from "@/lib/alumni/store.server";
import { isPublicDemo } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  const al = s?.role === "alumni" ? getAlumni(s.sub) : undefined;
  return NextResponse.json({
    role: s?.role ?? null,
    alumni: al ? { id: al.id, name: publicName(al), verified: al.verified, demo: al.demo } : null,
    alumni_network: alumniFeature() && !isPublicDemo(),
  });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
