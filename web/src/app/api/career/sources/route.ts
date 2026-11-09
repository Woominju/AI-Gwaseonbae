import { NextResponse } from "next/server";
import { getFeatures } from "@/lib/features";
import { providerStatuses } from "@/lib/career/providers.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getFeatures().career_intel) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({ sources: providerStatuses() });
}
