/**
 * 질문 중심 국소 그래프 검색 (순수 함수).
 *   개체 연결 → 1~2단계 이웃 탐색 → 씨앗 사이를 잇는 경로 우선 → 학년도·출처 등급 정리 → 인용 가능한 사실(G-xx)
 * 그래프 DB 없이 메모리에서 동작한다. Microsoft GraphRAG 의 커뮤니티 요약은 구현하지 않았다.
 */
import { normalizeText, extractConcepts } from "../taxonomy";
import { OCCUPATIONS } from "../career/occupations";
import { EDGE_TEXT, STATUS_LABEL, type DataStatus, type KEdge, type KNode, type KnowledgeGraph, type SourceDoc } from "./schema";

export interface GraphFact {
  id: string;
  edge_id: string;
  type: string;
  text: string;
  status: DataStatus;
  status_label: string;
  doc_title: string | null;
  locator: string | null;
  academic_year: number | null;
  term: string | null;
  source_ids: string[];
}

export interface GraphPath {
  text: string;
  node_ids: string[];
  connects_seeds: boolean;
}

export interface GraphRetrieval {
  seeds: { id: string; label: string; type: KNode["type"] }[];
  facts: GraphFact[];
  paths: GraphPath[];
  year_scope: number[];
  notices: string[];
  ms?: number;
}

const WEIGHT: Record<DataStatus, number> = { official: 1, alumni_verified: 0.9, external_verified: 0.85, synthetic_demo: 0.6, inferred_candidate: 0.3 };
const LOW_VALUE = new Set(["RELATED_TO", "DOCUMENT_SUPPORTS_CLAIM"]);
/** 이 노드를 거쳐 지나가면 무관한 항목까지 퍼진다 */
const NO_PASS: KNode["type"][] = ["SourceDocument", "Department"];
const MAX_FACTS = 14;
const MAX_BRIDGES = 6;
/** 종류별 최대 항목 수 (진술 기록이 과목 근거를 밀어내지 않게 한다) */
const TYPE_CAP: Record<string, number> = { LED_TO: 2, PARTICIPATED_IN: 2, PURSUED: 2 };
/** 직무 카탈로그 별칭에 없는 진로 표현 */
const ROLE_PHRASES: Record<string, string[]> = { software_engineer: ["소프트웨어 개발"], ml_engineer: ["ai 개발", "머신러닝 개발"] };

export function linkEntities(question: string, g: KnowledgeGraph, history: string[] = []): KNode[] {
  const find = (text: string): KNode[] => {
    const n = normalizeText(text);
    const c = extractConcepts(text);
    const ids = new Set<string>();
    for (const x of g.nodes) if ((x.type === "Course" || x.type === "Topic") && x.label.length >= 2 && n.includes(normalizeText(x.label))) ids.add(x.id);
    c.skills.forEach((s) => ids.add(`Skill:${s}`));
    c.fields.forEach((f) => ids.add(`Career:${f}`));
    c.departments.forEach((d) => ids.add(`Department:${d}`));
    // 긴 별칭 우선으로 직무를 찾아 '데이터 분석가'와 '데이터 분석'이 겹치지 않게 한다
    for (const o of OCCUPATIONS) if ([o.label, ...o.aliases, ...(ROLE_PHRASES[o.id] ?? [])].some((a) => n.includes(normalizeText(a)))) ids.add(`Role:occ:${o.id}`);
    return g.nodes.filter((x) => ids.has(x.id));
  };
  const direct = find(question);
  if (direct.length) return direct;
  // "이 과목"처럼 지시어만 있으면 직전 사용자 발화에서 찾는다
  if (/이\s*(과목|수업|강의)|그\s*(과목|수업|강의)/.test(question)) for (const h of [...history].reverse()) { const hit = find(h); if (hit.length) return hit; }
  return [];
}

export function yearsInQuestion(q: string): number[] {
  return [...new Set([...q.matchAll(/(20\d{2})\s*학년도/g)].map((m) => Number(m[1])))];
}

function factText(e: KEdge, label: (id: string) => string): string {
  const s = label(e.source), t = label(e.target);
  const yr = e.academic_year ? ` (${e.academic_year}학년도${e.term ? ` ${e.term}` : ""})` : "";
  switch (e.type) {
    case "DEPARTMENT_OFFERS_COURSE": return `${s}에서 ${t} 개설${yr}`;
    case "COURSE_EXPLICITLY_COVERS_TOPIC": return `${s}의 자료에 명시된 주제: ${t}${yr}`;
    case "COURSE_REQUIRES_PREREQUISITE": return `${s}의 명시된 선수 과목: ${t}${yr}`;
    case "ROLE_REQUIRES_SKILL": return `${s} 직무 예시에 ${t} 역량 포함 (${e.evidence})`;
    case "FIELD_HAS_ROLE": return `${s} 분야의 직무 예시: ${t}`;
    case "COURSE_MAY_RELATE_TO_ROLE": return `${s}와 ${t}의 관련 가능성 (${e.evidence})`;
    case "QA_MENTIONS_COURSE": case "QA_MENTIONS_SKILL": return `Q&A '${s}'에서 ${t} 언급`;
    case "STUDIED": return `선배 기록에서 ${s} 소속 선배가 ${t} 수강 [${e.record_ids.slice(0, 3).join(", ")}]`;
    case "DEVELOPED_SKILL": return `선배 기록에서 ${s}로 ${t} 역량을 길렀다고 진술 [${e.record_ids.slice(0, 3).join(", ")}]`;
    case "PARTICIPATED_IN": return `선배 기록에서 ${s} 역량을 활동 '${t}'에 사용 [${e.record_ids.slice(0, 3).join(", ")}]`;
    case "LED_TO": return `선배 본인이 '${s}'이(가) ${t} 진로로 이어졌다고 진술 (인과 검증 아님) [${e.record_ids.slice(0, 3).join(", ")}]`;
    case "PURSUED": return `${s} 분야에서 ${t} 직무를 택한 선배 기록 [${e.record_ids.slice(0, 3).join(", ")}]`;
    default: return `${s} — ${EDGE_TEXT[e.type] ?? e.type} — ${t}`;
  }
}

/** 학년도 범위: 질문에 학년도가 있으면 그 해만, 없으면 과목별 최신 자료만. 다른 해로 추정하지 않는다 */
function yearFilter(edges: KEdge[], years: number[], compareYears: boolean): KEdge[] {
  if (compareYears) return edges;
  if (years.length) return edges.filter((e) => e.academic_year === null || years.includes(e.academic_year));
  const latest = new Map<string, number>();
  const key = (e: KEdge) => `${e.type}|${e.source}|${e.target}`;
  const courseOf = (e: KEdge) => (e.source.startsWith("Course:") ? e.source : e.target);
  const courseLatest = new Map<string, number>();
  for (const e of edges) if (e.academic_year !== null) {
    latest.set(key(e), Math.max(latest.get(key(e)) ?? 0, e.academic_year));
    courseLatest.set(courseOf(e), Math.max(courseLatest.get(courseOf(e)) ?? 0, e.academic_year));
  }
  return edges.filter((e) => e.academic_year === null || e.academic_year === courseLatest.get(courseOf(e)));
}

interface Bridge { id: string; text: string; path: string; node_ids: string[]; doc_id: string | null; locator: string | null; year: number | null; term: string | null; shared: number }

/**
 * 학과–과목–역량–직무 연결. 과목 주제와 직무 예시 역량의 일치에서 얻은 '추론 후보'이므로 등급을 낮춰 표시한다.
 * 학과가 질문이나 프로필에 있으면 그 학과 개설 과목으로 좁힌다.
 */
function courseRoleBridges(question: string, seeds: GraphRetrieval["seeds"], edges: KEdge[], label: (id: string) => string, department?: string): Bridge[] {
  if (!/수업|과목|강의|공부|준비/.test(question)) return [];
  const roles = seeds.filter((s) => s.type === "Role").map((s) => s.id);
  if (!roles.length) for (const s of seeds) if (s.type === "Career") roles.push(...edges.filter((e) => e.type === "FIELD_HAS_ROLE" && e.source === s.id).map((e) => e.target));
  if (!roles.length) return [];
  const depts = seeds.filter((s) => s.type === "Department").map((s) => s.id);
  if (!depts.length && department) depts.push(`Department:${department}`);
  const offers = edges.filter((e) => e.type === "DEPARTMENT_OFFERS_COURSE" && (!depts.length || depts.includes(e.source)));
  const out: Bridge[] = [];
  for (const role of [...new Set(roles)]) {
    const skills = new Set(edges.filter((e) => e.type === "ROLE_REQUIRES_SKILL" && e.source === role).map((e) => e.target));
    for (const o of offers) {
      const shared = edges.filter((e) => e.type === "COURSE_EXPLICITLY_COVERS_TOPIC" && e.source === o.target && skills.has(e.target)).map((e) => e.target);
      if (!shared.length) continue;
      const names = [...new Set(shared)].map(label).join(", ");
      out.push({
        id: `bridge|${role}|${o.target}`, shared: shared.length, doc_id: o.doc_id, locator: o.locator, year: o.academic_year, term: o.term, node_ids: [o.source, o.target, ...shared, role],
        path: `${label(o.source)} → ${label(o.target)} → ${names} → ${label(role)}`,
        text: `${label(o.source)} 개설 ${label(o.target)}의 자료에 '${names}' 주제가 명시되어 있고, ${label(role)} 직무 예시에 같은 역량이 포함됨 (관련 가능성의 추론이며 취업과의 인과 관계가 아님)`,
      });
    }
  }
  const seen = new Set<string>();
  return out.sort((a, b) => b.shared - a.shared || a.id.localeCompare(b.id)).filter((b) => !seen.has(b.id) && !!seen.add(b.id)).slice(0, MAX_BRIDGES);
}

export function retrieveGraph(question: string, g: KnowledgeGraph, opts: { history?: string[]; maxHops?: 1 | 2; department?: string } = {}): GraphRetrieval {
  const years = yearsInQuestion(question);
  const compareYears = years.length > 1 || /학년도.*(다르|차이|변경|바뀌)/.test(question);
  const seedsN = linkEntities(question, g, opts.history);
  const seeds = seedsN.map((n) => ({ id: n.id, label: n.label, type: n.type }));
  const notices: string[] = [];
  const knownYears = [...new Set(g.documents.map((d) => d.academic_year))].sort();
  const missing = years.filter((y) => !knownYears.includes(y));
  if (missing.length) notices.push(`${missing.join(", ")}학년도 자료는 등록되어 있지 않아 다른 학년도 자료로 대신하지 않습니다.`);
  if (!seeds.length) return { seeds, facts: [], paths: [], year_scope: years, notices };

  const edges = yearFilter(g.edges, years, compareYears);
  const label = (id: string) => g.nodes.find((n) => n.id === id)?.label ?? id;
  const typeOf = new Map(g.nodes.map((n) => [n.id, n.type]));
  const adj = new Map<string, KEdge[]>();
  for (const e of edges) {
    (adj.get(e.source) ?? adj.set(e.source, []).get(e.source)!).push(e);
    (adj.get(e.target) ?? adj.set(e.target, []).get(e.target)!).push(e);
  }

  // 씨앗별 최대 2단계 탐색: 각 노드까지의 경로(엣지 목록)를 기록
  const maxHops = opts.maxHops ?? 2;
  const seedSet = new Set(seeds.map((s) => s.id));
  const reached = new Map<string, Map<string, KEdge[]>>();
  for (const s of seeds) {
    const seen = new Map<string, KEdge[]>([[s.id, []]]);
    let frontier = [s.id];
    for (let h = 0; h < maxHops; h++) {
      const next: string[] = [];
      for (const u of frontier) {
        if (u !== s.id && NO_PASS.includes(typeOf.get(u)!)) continue;
        for (const e of adj.get(u) ?? []) {
          if (LOW_VALUE.has(e.type)) continue;
          const v = e.source === u ? e.target : e.source;
          if (seen.has(v)) continue;
          seen.set(v, [...seen.get(u)!, e]);
          next.push(v);
        }
      }
      frontier = next;
    }
    reached.set(s.id, seen);
  }

  // 점수: 씨앗 사이를 잇는 엣지 > 씨앗 1단계 > 2단계, 등급 가중
  const score = new Map<string, number>();
  const bump = (e: KEdge, w: number) => score.set(e.id, Math.max(score.get(e.id) ?? 0, w * WEIGHT[e.data_status]));
  const paths: GraphPath[] = [];
  const list = seeds.map((s) => s.id);
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = reached.get(list[i])!, b = reached.get(list[j])!;
    const meets = [...a.keys()].filter((x) => b.has(x)).sort((x, y) => a.get(x)!.length + b.get(x)!.length - a.get(y)!.length - b.get(y)!.length);
    for (const m of meets.slice(0, 4)) {
      const chain = [...a.get(m)!, ...b.get(m)!];
      chain.forEach((e) => bump(e, 3));
      const ids = [...new Set(chain.flatMap((e) => [e.source, e.target]))];
      paths.push({ text: `${label(list[i])} ↔ ${m === list[i] || m === list[j] ? "" : `${label(m)} ↔ `}${label(list[j])}`, node_ids: ids, connects_seeds: true });
    }
  }
  for (const s of list) for (const [, chain] of reached.get(s)!) {
    if (chain.length === 1) bump(chain[0], 2);
    if (chain.length === 2) bump(chain[1], 1);
  }
  const bridges = courseRoleBridges(question, seeds, edges, label, opts.department);
  paths.unshift(...bridges.slice(0, 3).map((b) => ({ text: b.path, node_ids: b.node_ids, connects_seeds: true })));
  const uniq = [...edges].filter((e) => score.has(e.id)).sort((x, y) => score.get(y.id)! - score.get(x.id)! || x.id.localeCompare(y.id));
  // 같은 종류가 한 사실 목록을 독점하지 않게 종류당 상한을 둔다
  const perType = new Map<string, number>();
  const picked: KEdge[] = [];
  for (const e of uniq) {
    const c = perType.get(e.type) ?? 0;
    if (c >= (TYPE_CAP[e.type] ?? 5) || picked.length + bridges.length >= MAX_FACTS) continue;
    perType.set(e.type, c + 1);
    picked.push(e);
  }
  const docs = new Map<string, SourceDoc>(g.documents.map((d) => [d.doc_id, d]));
  const bridgeFacts: GraphFact[] = bridges.map((b, i) => ({
    id: `G-${String(i + 1).padStart(2, "0")}`, edge_id: b.id, type: "COURSE_ROLE_BRIDGE", text: b.text, status: "inferred_candidate", status_label: STATUS_LABEL.inferred_candidate,
    doc_title: b.doc_id ? docs.get(b.doc_id)?.title ?? null : null, locator: b.locator, academic_year: b.year, term: b.term, source_ids: [],
  }));
  const facts: GraphFact[] = bridgeFacts.concat(picked.map((e, i) => ({
    id: `G-${String(bridges.length + i + 1).padStart(2, "0")}`, edge_id: e.id, type: e.type, text: factText(e, label), status: e.data_status, status_label: STATUS_LABEL[e.data_status],
    doc_title: e.doc_id ? docs.get(e.doc_id)?.title ?? null : null, locator: e.locator, academic_year: e.academic_year, term: e.term, source_ids: [...e.record_ids, ...e.qa_ids],
  })));
  void seedSet;
  return { seeds, facts, paths: paths.slice(0, 6), year_scope: years, notices };
}

export function graphPromptBlock(r: GraphRetrieval): string {
  if (!r.facts.length) return "";
  const lines = r.facts.map((f) => `[${f.id}] (${f.status_label}) ${f.text}${f.doc_title ? ` — 출처: ${f.doc_title} ${f.locator ?? ""}` : ""}`);
  return `<graph_evidence>\n관계 근거 목록. 각 항목의 등급을 그대로 따른다. 과목을 언급하면 해당 [G-xx]를 붙인다. 이 목록과 선배 기록에 없는 과목명을 만들지 않는다. SQL 같은 역량을 과목처럼 쓰지 않는다.\n${lines.join("\n")}\n</graph_evidence>`;
}
