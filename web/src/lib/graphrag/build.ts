/**
 * 지식 그래프 구성 (순수 함수). 기존 선배 기록 그래프(buildGraph)를 재사용하고 수강편람·직무·Q&A 관계를 더한다.
 * 호출할 때마다 전달된 최신 데이터로 새로 만든다: 저장된 그래프가 없으므로 철회된 Q&A 가 남을 수 없다.
 */
import { buildGraph, cleanCourseName } from "../graph";
import { fieldLabel, normalizeText, skillLabel, SKILLS, extractConcepts } from "../taxonomy";
import { OCCUPATIONS } from "../career/occupations";
import type { QaItem } from "../qa/schema";
import { tierOf } from "../qa/schema";
import type { SeniorRecord } from "../types";
import type { CatalogFile, DataStatus, KEdge, KNode, KnowledgeGraph, SourceDoc } from "./schema";

export interface NcsStandards {
  standards: Record<string, { name: string; mapped_skills: string[] }[]>;
}

export interface BuildInput {
  records: SeniorRecord[];
  catalog: CatalogFile;
  qa: QaItem[];
  ncs: NcsStandards;
  updatedAt?: string;
}

const SKILL_IDS = new Set(SKILLS.map((s) => s.id));

function docStatus(d: SourceDoc): DataStatus {
  return d.status === "official" ? "official" : "synthetic_demo";
}

export function buildKnowledgeGraph(input: BuildInput): KnowledgeGraph {
  const updated_at = input.updatedAt ?? "2026-11-09";
  const nodes = new Map<string, KNode>();
  const edges = new Map<string, KEdge>();
  const addNode = (n: KNode) => {
    const old = nodes.get(n.id);
    nodes.set(n.id, old ? { ...n, ...old, meaning: old.meaning ?? n.meaning } : n);
    return n.id;
  };
  const addEdge = (e: Omit<KEdge, "id" | "updated_at"> & { id?: string }) => {
    const id = e.id ?? `${e.type}|${e.source}|${e.target}|${e.doc_id ?? ""}`;
    if (!edges.has(id)) edges.set(id, { ...e, id, updated_at });
    return id;
  };

  // 1) 선배 기록 그래프 재사용
  const base = buildGraph(input.records);
  const syn = new Map(input.records.map((r) => [r.record_id, r.is_synthetic]));
  for (const n of base.nodes) addNode({ id: n.id, type: n.type, label: n.label });
  for (const e of base.edges) {
    const allSyn = e.record_ids.every((r) => syn.get(r));
    addEdge({
      id: e.id, type: e.type, source: e.source, target: e.target,
      data_status: allSyn ? "synthetic_demo" : "alumni_verified", verification: allSyn ? "demo" : "verified", method: `record:${e.semantics}`,
      doc_id: null, locator: null, academic_year: null, term: null,
      evidence: `선배 기록 ${e.record_ids.join(", ")}`, record_ids: e.record_ids, qa_ids: [],
    });
  }

  // 2) 수강편람: 자료에 있는 관계만 만든다
  const docById = new Map(input.catalog.documents.map((d) => [d.doc_id, d]));
  for (const d of input.catalog.documents) addNode({ id: `SourceDocument:${d.doc_id}`, type: "SourceDocument", label: d.title, meaning: `${d.publisher} · ${d.academic_year}학년도 ${d.term}` });
  const courseTopics = new Map<string, Set<string>>();
  for (const c of input.catalog.courses) {
    const d = docById.get(c.doc_id);
    if (!d) continue;
    const status = docStatus(d);
    const meta = { data_status: status, verification: status === "official" ? ("verified" as const) : ("demo" as const), doc_id: d.doc_id, locator: c.locator, academic_year: c.academic_year, term: c.term, record_ids: [], qa_ids: [] };
    const name = cleanCourseName(c.name);
    const course = addNode({ id: `Course:${name}`, type: "Course", label: name });
    const dept = addNode({ id: `Department:${c.department}`, type: "Department", label: c.department });
    addEdge({ ...meta, type: "DEPARTMENT_OFFERS_COURSE", source: dept, target: course, method: "catalog:field", evidence: `${c.academic_year}학년도 ${c.term} ${c.campus}, ${c.department} 개설, ${c.credits ?? "학점 미기재"}${c.credits ? "학점" : ""}${c.overview ? `. 강의 개요: ${c.overview}` : ""}` });
    addEdge({ ...meta, type: "DOCUMENT_SUPPORTS_CLAIM", source: `SourceDocument:${d.doc_id}`, target: course, method: "catalog:field", evidence: `${d.title} ${c.locator}` });
    for (const t of c.topics) {
      const isSkill = SKILL_IDS.has(t);
      const target = isSkill ? addNode({ id: `Skill:${t}`, type: "Skill", label: skillLabel(t) }) : addNode({ id: `Topic:${t}`, type: "Topic", label: t });
      addEdge({ ...meta, type: "COURSE_EXPLICITLY_COVERS_TOPIC", source: course, target, method: "catalog:field", evidence: `${name}의 주제로 '${isSkill ? skillLabel(t) : t}' 명시 (${c.academic_year}학년도 ${c.term})` });
      if (isSkill && c.academic_year === Math.max(...input.catalog.courses.filter((x) => x.name === c.name).map((x) => x.academic_year))) (courseTopics.get(name) ?? courseTopics.set(name, new Set()).get(name)!).add(t);
    }
    for (const p of c.prerequisites ?? []) {
      const pre = addNode({ id: `Course:${cleanCourseName(p)}`, type: "Course", label: cleanCourseName(p) });
      addEdge({ ...meta, type: "COURSE_REQUIRES_PREREQUISITE", source: course, target: pre, method: "catalog:field", evidence: `${name}의 선수 과목으로 '${p}' 명시 (${c.academic_year}학년도 ${c.term})` });
    }
  }

  // 3) 직무-역량 (NCS 예시 Fixture: 실제 NCS 원문이 아님)
  const roleSkills = new Map<string, Set<string>>();
  for (const o of OCCUPATIONS) {
    const role = addNode({ id: `Role:occ:${o.id}`, type: "Role", label: o.label, meaning: "직무 예시 항목 (테스트용 Fixture)" });
    for (const f of o.fields) addEdge({ type: "FIELD_HAS_ROLE", source: addNode({ id: `Career:${f}`, type: "Career", label: fieldLabel(f) }), target: role, data_status: "synthetic_demo", verification: "demo", method: "fixture:occupations", doc_id: null, locator: null, academic_year: null, term: null, evidence: `직무 카탈로그 예시: ${fieldLabel(f)} 분야의 ${o.label}`, record_ids: [], qa_ids: [] });
    for (const std of input.ncs.standards[o.id] ?? []) {
      for (const s of std.mapped_skills) {
        roleSkills.set(o.id, (roleSkills.get(o.id) ?? new Set()).add(s));
        addEdge({ type: "ROLE_REQUIRES_SKILL", source: role, target: addNode({ id: `Skill:${s}`, type: "Skill", label: skillLabel(s) }), data_status: "synthetic_demo", verification: "demo", method: "fixture:ncs", doc_id: null, locator: null, academic_year: null, term: null, evidence: `테스트용 Fixture의 능력단위 예시 '${std.name}'`, record_ids: [], qa_ids: [] });
      }
    }
  }

  // 4) 추론 후보: 과목 주제와 직무 예시 역량의 일치. 확정 사실로 쓰지 않는다
  for (const [name, topics] of courseTopics) {
    for (const o of OCCUPATIONS) {
      const common = [...topics].filter((t) => roleSkills.get(o.id)?.has(t));
      if (!common.length) continue;
      addEdge({ type: "COURSE_MAY_RELATE_TO_ROLE", source: `Course:${name}`, target: `Role:occ:${o.id}`, data_status: "inferred_candidate", verification: "unverified", method: "rule:topic-skill-overlap", doc_id: null, locator: null, academic_year: null, term: null, evidence: `과목 주제와 직무 예시 역량이 '${common.map(skillLabel).join(", ")}'에서 겹침 (규칙 추론, 전문가 검증 없음, 취업과의 관계를 뜻하지 않음)`, record_ids: [], qa_ids: [] });
    }
  }

  // 5) Q&A: 호출자가 권한을 통과한 항목만 넘긴다
  const courseNames = [...nodes.values()].filter((n) => n.type === "Course").map((n) => n.label);
  for (const q of input.qa) {
    const tier = tierOf(q);
    const status: DataStatus = tier === "synthetic_demo" ? "synthetic_demo" : tier === "official_doc" ? "official" : "alumni_verified";
    const qid = addNode({ id: `AlumniQA:${q.question_id}`, type: "AlumniQA", label: q.question_text.slice(0, 40), meaning: q.answer_text });
    const text = `${q.question_text} ${q.answer_text}`;
    const meta = { data_status: status, verification: status === "synthetic_demo" ? ("demo" as const) : ("verified" as const), method: "qa:mention", doc_id: null, locator: null, academic_year: null, term: null, record_ids: [], qa_ids: [q.question_id] };
    const nt = normalizeText(text);
    for (const c of courseNames) if (nt.includes(normalizeText(c))) addEdge({ ...meta, type: "QA_MENTIONS_COURSE", source: qid, target: `Course:${c}`, evidence: `Q&A ${q.question_id}에서 언급` });
    for (const s of extractConcepts(text).skills) addEdge({ ...meta, type: "QA_MENTIONS_SKILL", source: qid, target: addNode({ id: `Skill:${s}`, type: "Skill", label: skillLabel(s) }), evidence: `Q&A ${q.question_id}에서 언급` });
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()], documents: input.catalog.documents };
}
