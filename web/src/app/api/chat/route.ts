import { NextResponse } from "next/server";
import { runChat } from "@/lib/chat/orchestrator";
import { PriorityWeightsSchema } from "@/lib/schema";
import { bad, parseProfile } from "../_util";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const q = typeof body?.question === "string" ? body.question.trim() : "";
  if (!q) return bad("질문을 입력해 주세요.");
  if (q.length > 1000) return bad("질문은 1000자 이내로 입력해 주세요.");
  const profile = parseProfile(body?.profile);
  if (!profile) return bad("프로필 형식이 올바르지 않습니다.");
  const pr = PriorityWeightsSchema.safeParse(body?.priorities);
  const history = Array.isArray(body?.history)
    ? body.history.filter((h: { role?: string; content?: unknown }) => (h?.role === "user" || h?.role === "assistant") && typeof h.content === "string").slice(-6)
    : [];
  const result = await runChat({ question: q, profile, history, multi_perspective: !!body?.multi_perspective, priorities: pr.success ? pr.data : undefined });
  return NextResponse.json(result);
}
