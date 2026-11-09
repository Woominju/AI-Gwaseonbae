import { NextResponse } from "next/server";
import { alumniFeature, notFound } from "@/lib/auth/guard.server";
import { board } from "@/lib/alumni/store.server";
import { isPublicDemo } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

/** 공개 게시판: 승인된 경험 + 질문 수신 동의 선배. 공개 시연에서는 실제 선배 데이터를 노출하지 않는다. */
export async function GET() {
  if (!alumniFeature()) return notFound();
  if (isPublicDemo()) return NextResponse.json({ experiences: [], mentors: [], counts: { real_verified_experiences: 0, demo_experiences: 0, real_mentors: 0, demo_mentors: 0 }, public_demo: true });
  return NextResponse.json(board());
}
