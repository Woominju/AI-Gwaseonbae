import { NextResponse } from "next/server";
import { getFeatures } from "@/lib/features";
import { analyzeCareer } from "@/lib/career/engine.server";
import { getOccupation } from "@/lib/career/occupations";
import { bad, parseProfile } from "../../_util";

export async function POST(req: Request) {
  if (!getFeatures().career_intel) return new NextResponse("Not Found", { status: 404 });
  const body = await req.json().catch(() => null);
  const profile = parseProfile(body?.profile);
  if (!profile) return bad("프로필 형식이 올바르지 않습니다.");
  const occ = typeof body?.occupation === "string" ? getOccupation(body.occupation) : undefined;
  if (!occ) return bad("지원하지 않는 직무입니다.");
  const r = await analyzeCareer(profile, occ.id);
  return NextResponse.json(r);
}
