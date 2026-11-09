import { NextResponse } from "next/server";
import { body, err, notFound, requireRole } from "@/lib/auth/guard.server";
import { demoStatus, gateEnabled, startDemo, stopDemo } from "@/lib/aiDemo.server";
import { isPublicDemo } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

/** 실제 AI 시연 모드 제어 (관리자 전용, 공개 시연 인스턴스에서는 404 → scripts/ai_demo.sh 로 로컬 제어) */
export async function GET() {
  if (isPublicDemo()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  return NextResponse.json(demoStatus());
}

export async function POST(req: Request) {
  if (isPublicDemo()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  if (!gateEnabled()) return err("이 인스턴스는 AI_DEMO_GATE=1 로 실행되지 않았습니다.", 409);
  const m = Number((await body(req)).minutes);
  try {
    startDemo(m, "admin");
  } catch (e) {
    return err((e as Error).message);
  }
  return NextResponse.json(demoStatus());
}

export async function DELETE() {
  if (isPublicDemo()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  stopDemo("manual");
  return NextResponse.json(demoStatus());
}
