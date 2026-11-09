import { NextResponse } from "next/server";
import { getFeatures } from "@/lib/features";
import { OCCUPATIONS } from "@/lib/career/occupations";

export async function GET() {
  if (!getFeatures().career_intel) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({ occupations: OCCUPATIONS.map((o) => ({ id: o.id, label: o.label, ncs: o.ncs })) });
}
