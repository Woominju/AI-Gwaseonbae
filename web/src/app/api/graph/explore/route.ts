import { NextResponse } from "next/server";
import { getFeatures } from "@/lib/features";
import { getSession } from "@/lib/auth/session.server";
import { currentGraph } from "@/lib/graphrag/data.server";
import { localGraph, searchNodes } from "@/lib/graphrag/explore";
import { type KNodeType } from "@/lib/graphrag/schema";

export const dynamic = "force-dynamic";

const TYPES: KNodeType[] = ["Department", "Course", "Skill", "Experience", "Career", "Role", "Topic", "AlumniQA"];

/** 요청마다 최신 권한으로 그래프를 만든다. 철회·비공개 Q&A 는 노드 자체가 생기지 않는다 */
export async function GET(req: Request) {
  if (!getFeatures().course_graph) return new NextResponse("Not Found", { status: 404 });
  const u = new URL(req.url);
  const sess = await getSession();
  const { graph, catalog } = currentGraph(sess?.role === "student" || sess?.role === "admin" ? "student" : "anonymous");
  const q = (u.searchParams.get("q") ?? "").slice(0, 60);
  if (q) return NextResponse.json({ suggestions: searchNodes(graph, q) });
  const center = u.searchParams.get("center") ?? "Role:occ:data_analyst";
  const depth = u.searchParams.get("depth") === "2" ? 2 : 1;
  const raw = u.searchParams.get("types");
  const types = raw ? (raw.split(",").filter((t) => TYPES.includes(t as KNodeType)) as KNodeType[]) : null;
  return NextResponse.json({
    ...localGraph(graph, center, depth, types),
    data_notice: catalog.documents.every((d) => d.status === "synthetic_demo") ? "현재 수강편람 관계는 모두 가상 시연 데이터입니다. 실제 한국외대 교과정보가 아닙니다." : null,
    counts: { nodes: graph.nodes.length, edges: graph.edges.length },
  });
}
