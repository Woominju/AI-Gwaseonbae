import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/data/repository.server";
import { InMemoryGraphStore, toCypher } from "@/lib/graph";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const store = new InMemoryGraphStore(getAllRecords());
  const g = await store.getGraph({
    department: u.searchParams.get("department") || undefined,
    career_field: u.searchParams.get("field") || undefined,
    min_support: Number(u.searchParams.get("min") ?? 1) || 1,
    include_experiences: u.searchParams.get("exp") !== "0",
  });
  if (u.searchParams.get("format") === "cypher") return new NextResponse(toCypher(g), { headers: { "content-type": "text/plain; charset=utf-8" } });
  return NextResponse.json(g);
}
