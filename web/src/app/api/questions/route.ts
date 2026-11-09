import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole, str } from "@/lib/auth/guard.server";
import { askQuestion, questionsForStudent } from "@/lib/alumni/store.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (blocked()) return notFound();
  const s = await requireRole("student");
  if (s instanceof NextResponse) return s;
  return NextResponse.json({ questions: questionsForStudent(s.sub) });
}

export async function POST(req: Request) {
  if (blocked()) return notFound();
  const s = await requireRole("student");
  if (s instanceof NextResponse) return s;
  const b = await body(req);
  const text = str(b.text, 1000);
  if (text.length < 5) return err("질문을 5자 이상 입력하세요.");
  if (/\d{2,3}-\d{3,4}-\d{4}|[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) return err("연락처·이메일 등 개인정보는 적지 마세요.");
  const r = askQuestion(s.sub, str(b.alumni_id, 40), text);
  if (!r.ok) return err(r.error, 403);
  return NextResponse.json({ question: { ...r.q, student_sid: undefined } });
}
