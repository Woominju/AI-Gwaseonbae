/**
 * Career Knowledge Graph — 선배 기록에서 그래프를 생성한다 (순수 함수).
 *
 *   Department -STUDIED-> Course -DEVELOPED_SKILL-> Skill -PARTICIPATED_IN-> Experience
 *   Experience -LED_TO | RELATED_TO-> Career -PURSUED-> Role
 *
 * 관계 의미 (인과관계를 주장하지 않는다)
 *   STUDIED          reported_activity  : 해당 학과 선배가 이 과목을 수강했다고 기록
 *   DEVELOPED_SKILL  reported_activity  : 선배가 이 과목으로 해당 역량을 길렀다고 진술
 *   PARTICIPATED_IN  reported_activity  : 선배가 이 역량을 활용·개발한 활동에 참여했다고 기록
 *   LED_TO           self_reported_link : 선배 '본인이' 이 활동이 진로로 이어졌다고 진술한 경우에만 생성 (검증된 인과 아님)
 *   RELATED_TO       co_occurrence      : 같은 선배 기록에 함께 등장 (연결 진술 없음)
 *   PURSUED          reported_sequence  : 선배가 해당 진로 분야에서 이 직무를 선택
 *
 * 모든 노드·엣지는 근거 record_ids 를 가진다. GraphStore 인터페이스로 Neo4j 등으로 교체 가능하다.
 */
import type { CareerGraph, GraphEdge, GraphEdgeType, GraphNode, GraphNodeType, SeniorRecord } from "./types";
import { fieldLabel, skillLabel } from "./taxonomy";

export const NODE_ORDER: GraphNodeType[] = ["Department", "Course", "Skill", "Experience", "Career", "Role"];

export const NODE_LABEL: Record<GraphNodeType, string> = {
  Department: "학과",
  Course: "수강 과목",
  Skill: "역량",
  Experience: "경험·활동",
  Career: "진로 분야",
  Role: "직무",
};

export const EDGE_MEANING: Record<GraphEdgeType, string> = {
  STUDIED: "해당 학과 선배가 수강했다고 기록",
  DEVELOPED_SKILL: "선배가 이 과목으로 역량을 길렀다고 진술",
  PARTICIPATED_IN: "이 역량을 활용·개발한 활동에 참여했다고 기록",
  LED_TO: "선배 본인이 '진로로 이어졌다'고 진술 (인과 검증 아님)",
  RELATED_TO: "같은 선배 기록에 함께 등장 (연결 진술 없음)",
  PURSUED: "선배가 해당 분야에서 이 직무를 선택",
};

export function cleanCourseName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

export function nodeId(type: GraphNodeType, key: string): string {
  return `${type}:${key}`;
}

export function buildGraph(records: SeniorRecord[]): CareerGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addNode = (type: GraphNodeType, key: string, label: string, rid: string) => {
    const id = nodeId(type, key);
    const n = nodes.get(id) ?? { id, type, label, record_ids: [] };
    if (!n.record_ids.includes(rid)) n.record_ids.push(rid);
    nodes.set(id, n);
    return id;
  };
  const addEdge = (type: GraphEdgeType, source: string, target: string, rid: string, semantics: GraphEdge["semantics"]) => {
    const id = `${type}|${source}|${target}`;
    const e = edges.get(id) ?? { id, type, source, target, record_ids: [], semantics };
    if (!e.record_ids.includes(rid)) e.record_ids.push(rid);
    edges.set(id, e);
  };

  for (const r of records) {
    const rid = r.record_id;
    const dept = addNode("Department", r.department, r.department, rid);
    for (const c of r.courses) {
      const cname = cleanCourseName(c.name);
      const course = addNode("Course", cname, cname, rid);
      addEdge("STUDIED", dept, course, rid, "reported_activity");
      for (const s of c.skills_developed) addEdge("DEVELOPED_SKILL", course, addNode("Skill", s, skillLabel(s), rid), rid, "reported_activity");
    }
    const careerIds = r.career_field.map((f) => addNode("Career", f, fieldLabel(f), rid));
    const role = addNode("Role", r.current_role, r.current_role, rid);
    for (const cid of careerIds) addEdge("PURSUED", cid, role, rid, "reported_sequence");
    for (const ex of [...r.projects, ...r.internships]) {
      const exId = addNode("Experience", `${rid}:${ex.title}`, ex.title, rid);
      for (const s of ex.skills) addEdge("PARTICIPATED_IN", addNode("Skill", s, skillLabel(s), rid), exId, rid, "reported_activity");
      for (const cid of careerIds) {
        if (ex.self_reported_link) addEdge("LED_TO", exId, cid, rid, "self_reported_link");
        else addEdge("RELATED_TO", exId, cid, rid, "co_occurrence");
      }
    }
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export interface GraphFilter {
  department?: string;
  career_field?: string;
  /** 엣지의 최소 근거 기록 수 */
  min_support?: number;
  include_experiences?: boolean;
}

export function filterRecordsForGraph(records: SeniorRecord[], f: GraphFilter): SeniorRecord[] {
  return records.filter((r) => (!f.department || r.department === f.department) && (!f.career_field || r.career_field.includes(f.career_field)));
}

export function applyGraphFilter(g: CareerGraph, f: GraphFilter): CareerGraph {
  const min = f.min_support ?? 1;
  let edges = g.edges.filter((e) => e.record_ids.length >= min);
  let nodes = g.nodes;
  if (f.include_experiences === false) {
    nodes = nodes.filter((n) => n.type !== "Experience");
    edges = edges.filter((e) => !e.source.startsWith("Experience:") && !e.target.startsWith("Experience:"));
  }
  const used = new Set(edges.flatMap((e) => [e.source, e.target]));
  nodes = nodes.filter((n) => used.has(n.id) || n.type === "Department");
  return { nodes, edges };
}

/** 노드 선택 시 강조할 경로: 그 노드의 근거 기록들이 공유하는 엣지·노드 */
export function highlightForNode(g: CareerGraph, id: string): { recordIds: string[]; nodeIds: Set<string>; edgeIds: Set<string> } {
  const node = g.nodes.find((n) => n.id === id);
  if (!node) return { recordIds: [], nodeIds: new Set(), edgeIds: new Set() };
  const rids = new Set(node.record_ids);
  const edgeIds = new Set<string>();
  const nodeIds = new Set<string>([id]);
  for (const e of g.edges) {
    if (e.record_ids.some((r) => rids.has(r))) {
      edgeIds.add(e.id);
      nodeIds.add(e.source);
      nodeIds.add(e.target);
    }
  }
  return { recordIds: [...rids].sort(), nodeIds, edgeIds };
}

/** 한 선배 기록의 경로를 사람이 읽을 수 있는 체인으로 */
export function recordPathSummary(r: SeniorRecord): string {
  const courses = r.courses.slice(0, 2).map((c) => cleanCourseName(c.name)).join("·");
  const skills = r.key_skills.slice(0, 3).map(skillLabel).join("·");
  const ex = [...r.projects, ...r.internships].slice(0, 1).map((e) => e.title).join("");
  return [r.department, courses, skills, ex, r.career_field.map(fieldLabel).join("/"), r.current_role].filter(Boolean).join(" → ");
}

/* ---------- GraphStore: Neo4j 등 그래프 DB로 확장하기 위한 인터페이스 ---------- */

export interface GraphStore {
  getGraph(filter: GraphFilter): Promise<CareerGraph>;
  getNeighbors(nodeId: string): Promise<GraphNode[]>;
}

export class InMemoryGraphStore implements GraphStore {
  constructor(private records: SeniorRecord[]) {}
  async getGraph(filter: GraphFilter) {
    return applyGraphFilter(buildGraph(filterRecordsForGraph(this.records, filter)), filter);
  }
  async getNeighbors(id: string) {
    const g = buildGraph(this.records);
    const ids = new Set(g.edges.flatMap((e) => (e.source === id ? [e.target] : e.target === id ? [e.source] : [])));
    return g.nodes.filter((n) => ids.has(n.id));
  }
}

/** Neo4j 이관용 Cypher 내보내기 (MERGE 문) */
export function toCypher(g: CareerGraph): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const lines = g.nodes.map((n) => `MERGE (:${n.type} {id:'${esc(n.id)}', label:'${esc(n.label)}', record_ids:[${n.record_ids.map((r) => `'${esc(r)}'`).join(",")}]});`);
  for (const e of g.edges)
    lines.push(
      `MATCH (a {id:'${esc(e.source)}'}),(b {id:'${esc(e.target)}'}) MERGE (a)-[:${e.type} {semantics:'${e.semantics}', record_ids:[${e.record_ids.map((r) => `'${esc(r)}'`).join(",")}]}]->(b);`,
    );
  return lines.join("\n");
}
