import { NextResponse } from "next/server";
import { blocked, body, err, notFound, requireRole, str } from "@/lib/auth/guard.server";
import { answerQuestion } from "@/lib/alumni/store.server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (blocked()) return notFound();
  const s = await requireRole("alumni");
  if (s instanceof NextResponse) return s;
  const { id } = await ctx.params;
  const answer = str((await body(req)).answer, 2000);
  if (!answer) return err("답변을 입력하세요.");
  const q = answerQuestion(s.sub, id, answer);
  if (!q) return err("답변할 수 없는 질문입니다.", 404);
  return NextResponse.json({ question: { ...q, student_sid: undefined } });
}
