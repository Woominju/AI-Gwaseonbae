import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/data/repository.server";
import { semanticScores } from "@/lib/retrieval/service";
import { profileToQuery, rankRecords } from "@/lib/scoring";
import { compareOptions, derivePriorities } from "@/lib/comparison";
import { generateRoadmap } from "@/lib/roadmap";
import { PriorityWeightsSchema } from "@/lib/schema";
import { bad, parseProfile } from "../_util";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const profile = parseProfile(body?.profile);
  if (!profile) return bad("프로필 형식이 올바르지 않습니다.");
  const pr = PriorityWeightsSchema.safeParse(body?.priorities);
  const priorities = pr.success ? pr.data : derivePriorities(profile, "balanced").weights;
  const records = getAllRecords();
  const query = profileToQuery(profile);
  const sem = await semanticScores(query, records, "auto");
  const matches = rankRecords(profile, records, query ? sem.scores : null, sem.method);
  const comparison = compareOptions({ profile, records, matches, priorities, optionIds: Array.isArray(body?.options) ? body.options : undefined });
  const roadmap = generateRoadmap({ profile, comparison, optionId: typeof body?.optionId === "string" ? body.optionId : undefined, matches, records });
  return NextResponse.json({ roadmap });
}
