import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/data/repository.server";
import { semanticScores } from "@/lib/retrieval/service";
import { profileToQuery, rankRecords } from "@/lib/scoring";
import { compareOptions, derivePriorities } from "@/lib/comparison";
import { PriorityWeightsSchema } from "@/lib/schema";
import { bad, parseProfile } from "../_util";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const profile = parseProfile(body?.profile);
  if (!profile) return bad("프로필 형식이 올바르지 않습니다.");
  const pr = PriorityWeightsSchema.safeParse(body?.priorities);
  const derived = derivePriorities(profile, typeof body?.preset === "string" ? body.preset : "balanced");
  const priorities = pr.success ? pr.data : derived.weights;
  const optionIds: string[] = Array.isArray(body?.options) ? body.options.slice(0, 3) : ["graduate", "employment"];
  const records = getAllRecords();
  const query = profileToQuery(profile);
  const sem = await semanticScores(query, records, "auto");
  const matches = rankRecords(profile, records, query ? sem.scores : null, sem.method);
  const result = compareOptions({ profile, records, matches, priorities, optionIds });
  return NextResponse.json({ ...result, adjustments: pr.success ? [] : derived.adjustments, retrieval: { method: sem.method } });
}
