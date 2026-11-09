import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/data/repository.server";
import { semanticScores, type RetrievalMode } from "@/lib/retrieval/service";
import { DEFAULT_WEIGHTS, profileToQuery, rankRecords } from "@/lib/scoring";
import { MatchWeightsSchema } from "@/lib/schema";
import { bad, parseProfile } from "../_util";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const profile = parseProfile(body?.profile);
  if (!profile) return bad("프로필 형식이 올바르지 않습니다.");
  const w = MatchWeightsSchema.safeParse(body?.weights);
  const weights = w.success ? w.data : DEFAULT_WEIGHTS;
  const mode: RetrievalMode = ["local", "embedding", "embedding_rerank"].includes(body?.mode) ? body.mode : "auto";
  const records = getAllRecords();
  const query = profileToQuery(profile);
  const sem = await semanticScores(query, records, mode);
  const results = rankRecords(profile, records, query ? sem.scores : null, sem.method, weights);
  return NextResponse.json({ results, query, retrieval: { method: sem.method, ms: Math.round(sem.ms), fallback: sem.fallback }, weights });
}
