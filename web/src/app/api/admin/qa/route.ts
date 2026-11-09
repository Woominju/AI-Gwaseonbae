import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole } from "@/lib/auth/guard.server";
import { QaCreateSchema, detectPII } from "@/lib/qa/schema";
import { createQa, listQa } from "@/lib/qa/store.server";

export async function GET() {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  return NextResponse.json({ items: listQa() });
}

/** 실제 Q&A 등록: 항상 pending 으로 저장되며, 승인 전에는 검색에 쓰이지 않는다 */
export async function POST(req: Request) {
  if (blocked()) return notFound();
  const s = await requireRole("admin");
  if (s instanceof NextResponse) return s;
  const p = QaCreateSchema.safeParse(await body(req));
  if (!p.success) return err("입력 형식이 올바르지 않습니다.");
  return NextResponse.json({ item: createQa(p.data), pii_warnings: detectPII(`${p.data.question_text}\n${p.data.answer_text}`) }, { status: 201 });
}
