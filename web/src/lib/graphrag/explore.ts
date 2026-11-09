/** 관계 탐색 화면용 조회 (순수 함수): 노드 검색, 국소 그래프, 노드 상세 */
import { normalizeText } from "../taxonomy";
import { OCCUPATIONS } from "../career/occupations";
import { EDGE_TEXT, KNODE_LABEL, STATUS_LABEL, type DataStatus, type KEdge, type KNode, type KNodeType, type KnowledgeGraph } from "./schema";

export interface ExploreNode { id: string; type: KNodeType; type_label: string; label: string; hop: number }
export interface ExploreEdge { id: string; source: string; target: string; type: string; type_label: string; status: DataStatus; status_label: string }
export interface Relation {
  other: { id: string; label: string; type_label: string };
  direction: "out" | "in";
  type_label: string;
  status: DataStatus;
  status_label: string;
  verification: KEdge["verification"];
  evidence: string;
  doc_title: string | null;
  locator: string | null;
  academic_year: number | null;
  term: string | null;
}
export interface NodeDetail { id: string; label: string; type: KNodeType; type_label: string; meaning: string; relations: Relation[]; ask: string }
export interface ExploreResult { center: ExploreNode | null; nodes: ExploreNode[]; edges: ExploreEdge[]; truncated: boolean; detail: NodeDetail | null }

const EXPLORABLE: KNodeType[] = ["Department", "Course", "Skill", "Experience", "Career", "Role", "Topic", "AlumniQA"];
const RANK: Record<DataStatus, number> = { official: 5, alumni_verified: 4, external_verified: 3, synthetic_demo: 2, inferred_candidate: 1 };
const LIMIT = { hop1: 14, hop2: 10 };

export function searchNodes(g: KnowledgeGraph, q: string, limit = 10): ExploreNode[] {
  const n = normalizeText(q);
  if (!n) return [];
  const alias = new Map(OCCUPATIONS.map((o) => [`Role:occ:${o.id}`, o.aliases.map(normalizeText)]));
  const hit = (x: KNode) => {
    const l = normalizeText(x.label);
    if (l === n) return 3;
    if (l.includes(n)) return 2;
    return alias.get(x.id)?.some((a) => a.includes(n) || n.includes(a)) ? 1 : 0;
  };
  return g.nodes
    .filter((x) => EXPLORABLE.includes(x.type) && hit(x) > 0)
    .sort((a, b) => hit(b) - hit(a) || a.label.length - b.label.length)
    .slice(0, limit)
    .map((x) => ({ id: x.id, type: x.type, type_label: KNODE_LABEL[x.type], label: x.label, hop: 0 }));
}

export function localGraph(g: KnowledgeGraph, center: string, depth: 1 | 2, types: KNodeType[] | null): ExploreResult {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const c = byId.get(center);
  if (!c) return { center: null, nodes: [], edges: [], truncated: false, detail: null };
  const allow = (id: string) => { const t = byId.get(id)?.type; return !!t && EXPLORABLE.includes(t) && (!types || types.includes(t)); };
  const conn = (u: string) => g.edges.filter((e) => (e.source === u || e.target === u) && e.type !== "RELATED_TO").map((e) => ({ e, v: e.source === u ? e.target : e.source })).filter((x) => allow(x.v));
  const strength = (u: string, v: string) => Math.max(...g.edges.filter((e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)).map((e) => RANK[e.data_status]));
  const degree = (v: string) => g.edges.filter((e) => e.source === v || e.target === v).length;
  const order = (u: string, ids: string[]) => [...new Set(ids)].sort((a, b) => strength(u, b) - strength(u, a) || degree(b) - degree(a) || a.localeCompare(b));

  const h1All = order(center, conn(center).map((x) => x.v));
  const h1 = h1All.slice(0, LIMIT.hop1);
  let truncated = h1All.length > h1.length;
  const included = new Map<string, number>([[center, 0], ...h1.map((v) => [v, 1] as [string, number])]);
  if (depth === 2) {
    const h2All = [...new Set(h1.flatMap((u) => (byId.get(u)?.type === "Department" ? [] : order(u, conn(u).map((x) => x.v))).slice(0, 3)))].filter((v) => !included.has(v));
    h2All.slice(0, LIMIT.hop2).forEach((v) => included.set(v, 2));
    truncated ||= h2All.length > LIMIT.hop2;
  }
  // 같은 두 노드 사이에는 가장 신뢰 수준이 높은 관계 하나만 그린다
  const best = new Map<string, KEdge>();
  for (const e of g.edges) {
    if (e.type === "RELATED_TO" || !included.has(e.source) || !included.has(e.target)) continue;
    // 같은 고리끼리의 선은 그리지 않는다 (가독성). 세부 연결은 상세 패널에서 본다
    if (Math.abs(included.get(e.source)! - included.get(e.target)!) !== 1) continue;
    const k = [e.source, e.target].sort().join("|");
    const o = best.get(k);
    if (!o || RANK[e.data_status] > RANK[o.data_status] || (RANK[e.data_status] === RANK[o.data_status] && (e.academic_year ?? 0) > (o.academic_year ?? 0))) best.set(k, e);
  }
  const toNode = (id: string, hop: number): ExploreNode => { const n = byId.get(id)!; return { id, type: n.type, type_label: KNODE_LABEL[n.type], label: n.label, hop }; };
  return {
    center: toNode(center, 0),
    nodes: [...included].map(([id, hop]) => toNode(id, hop)),
    edges: [...best.values()].map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.type, type_label: EDGE_TEXT[e.type] ?? e.type, status: e.data_status, status_label: STATUS_LABEL[e.data_status] })),
    truncated,
    detail: nodeDetail(g, center),
  };
}

export function nodeDetail(g: KnowledgeGraph, id: string): NodeDetail | null {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const n = byId.get(id);
  if (!n) return null;
  const docs = new Map(g.documents.map((d) => [d.doc_id, d]));
  const relations: Relation[] = g.edges
    .filter((e) => (e.source === id || e.target === id) && byId.get(e.source === id ? e.target : e.source)?.type !== "SourceDocument" && e.type !== "RELATED_TO")
    .sort((a, b) => RANK[b.data_status] - RANK[a.data_status] || (b.academic_year ?? 0) - (a.academic_year ?? 0))
    .map((e) => {
      const other = byId.get(e.source === id ? e.target : e.source)!;
      return { other: { id: other.id, label: other.label, type_label: KNODE_LABEL[other.type] }, direction: e.source === id ? "out" : "in", type_label: EDGE_TEXT[e.type] ?? e.type, status: e.data_status, status_label: STATUS_LABEL[e.data_status], verification: e.verification, evidence: e.evidence, doc_title: e.doc_id ? docs.get(e.doc_id)?.title ?? null : null, locator: e.locator, academic_year: e.academic_year, term: e.term };
    });
  const offer = g.edges.filter((e) => e.type === "DEPARTMENT_OFFERS_COURSE" && e.target === id).sort((a, b) => (b.academic_year ?? 0) - (a.academic_year ?? 0))[0];
  const meaning = n.meaning ?? offer?.evidence ?? `${KNODE_LABEL[n.type]} 항목입니다. 등록된 연결은 아래에서 출처와 함께 확인할 수 있어요.`;
  const ask = n.type === "Course" ? `${n.label} 과목이 데이터 분석 진로와 어떤 관계가 있는지 근거와 함께 설명해 줘.` : `${n.label}에 대해 관련 과목과 역량을 근거와 함께 설명해 줘.`;
  return { id, label: n.label, type: n.type, type_label: KNODE_LABEL[n.type], meaning, relations, ask };
}
