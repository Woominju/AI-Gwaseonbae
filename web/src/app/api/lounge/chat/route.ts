import { NextResponse } from "next/server";
import { getFeatures } from "@/lib/features";
import { handleLoungeTurn } from "@/lib/lounge/turn.server";
import { getScene } from "@/lib/world/world";
import { getSession } from "@/lib/auth/session.server";
import { isGreetingStyle, isPersonaId } from "@/lib/lounge/personas";
import { PriorityWeightsSchema } from "@/lib/schema";
import { sanitizeStyleSetting } from "@/lib/counsel/styles";
import { bad, parseProfile } from "../../_util";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!getFeatures().campus_lounge) return new NextResponse("Not Found", { status: 404 });
  const body = await req.json().catch(() => null);
  const q = typeof body?.question === "string" ? body.question.trim() : "";
  if (!q) return bad("질문을 입력해 주세요.");
  if (q.length > 1000) return bad("질문은 1000자 이내로 입력해 주세요.");
  const scene = typeof body?.place === "string" ? getScene(body.place) : undefined;
  if (!scene) return bad("장소 값이 올바르지 않습니다.");
  if (!isPersonaId(body?.persona)) return bad("선배 성격 값이 올바르지 않습니다.");
  const greeting = isGreetingStyle(body?.greeting) ? body.greeting : "casual";
  const profile = parseProfile(body?.profile);
  if (!profile) return bad("프로필 형식이 올바르지 않습니다.");
  const pr = PriorityWeightsSchema.safeParse(body?.priorities);
  const history = Array.isArray(body?.history)
    ? body.history
        .filter((h: { role?: string; content?: unknown }) => (h?.role === "user" || h?.role === "assistant") && typeof h.content === "string")
        .slice(-6)
        .map((h: { role: "user" | "assistant"; content: string }) => ({ role: h.role, content: h.content.slice(0, 1500) }))
    : [];
  const sess = await getSession();
  const userKey = sess?.sub ?? req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const carry = Array.isArray(body?.carry) ? body.carry.filter((x: unknown) => typeof x === "string").slice(0, 6) : [];
  const turn = await handleLoungeTurn({ user_key: userKey, carry, question: q, profile, history, place: scene.theme, persona: body.persona, greeting, clarified: body?.clarified === true, priorities: pr.success ? pr.data : undefined, style: sanitizeStyleSetting(body?.style) ?? undefined, graph_off: body?.graph === false, audience: sess?.role === "student" || sess?.role === "admin" ? "student" : "anonymous" });
  return NextResponse.json(turn);
}
