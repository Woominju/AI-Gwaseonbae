import { describe, expect, it } from "vitest";
import { getSyntheticRecords } from "@/lib/data/records";
import { applyGraphFilter, buildGraph, filterRecordsForGraph, highlightForNode, toCypher, cleanCourseName } from "@/lib/graph";

const records = getSyntheticRecords();
const g = buildGraph(records);
const byId = new Map(records.map((r) => [r.record_id, r]));

describe("career knowledge graph", () => {
  it("6종 노드 타입과 6종 엣지 타입을 생성한다", () => {
    expect(new Set(g.nodes.map((n) => n.type)).size).toBe(6);
    expect(new Set(g.edges.map((e) => e.type))).toEqual(new Set(["STUDIED", "DEVELOPED_SKILL", "PARTICIPATED_IN", "PURSUED", "LED_TO", "RELATED_TO"]));
  });

  it("모든 엣지의 근거 기록이 실제로 해당 관계를 포함한다", () => {
    const nodes = new Map(g.nodes.map((n) => [n.id, n]));
    for (const e of g.edges) {
      expect(e.record_ids.length).toBeGreaterThan(0);
      for (const rid of e.record_ids) {
        const r = byId.get(rid)!;
        expect(r).toBeDefined();
        expect(nodes.get(e.source)!.record_ids).toContain(rid);
        expect(nodes.get(e.target)!.record_ids).toContain(rid);
        if (e.type === "STUDIED") expect(r.courses.map((c) => cleanCourseName(c.name))).toContain(nodes.get(e.target)!.label);
        if (e.type === "LED_TO") expect([...r.projects, ...r.internships].some((x) => x.self_reported_link)).toBe(true);
      }
    }
  });

  it("LED_TO 는 선배 본인 진술(self_reported_link)이 있는 경우에만 생성된다", () => {
    for (const e of g.edges.filter((x) => x.type === "LED_TO")) expect(e.semantics).toBe("self_reported_link");
    for (const e of g.edges.filter((x) => x.type === "RELATED_TO")) expect(e.semantics).toBe("co_occurrence");
  });

  it("학과 필터는 해당 학과 기록만 남긴다", () => {
    const sub = buildGraph(filterRecordsForGraph(records, { department: "수학과" }));
    const rids = new Set(sub.nodes.flatMap((n) => n.record_ids));
    for (const id of rids) expect(byId.get(id)!.department).toBe("수학과");
    expect(sub.nodes.filter((n) => n.type === "Department").map((n) => n.label)).toEqual(["수학과"]);
  });

  it("최소 근거 수 필터와 경험 노드 제외가 동작한다", () => {
    const f = applyGraphFilter(g, { min_support: 2, include_experiences: false });
    expect(f.edges.every((e) => e.record_ids.length >= 2)).toBe(true);
    expect(f.nodes.some((n) => n.type === "Experience")).toBe(false);
  });

  it("진로 노드 클릭 시 관련 기록의 경로를 강조한다", () => {
    const h = highlightForNode(g, "Career:ai_ml");
    expect(h.recordIds).toEqual(expect.arrayContaining(["S-01", "S-06", "S-09", "S-16"]));
    expect(h.nodeIds.has("Department:수학과")).toBe(true);
  });

  it("Cypher 내보내기 (Neo4j 확장)", () => {
    const c = toCypher(applyGraphFilter(g, { min_support: 3 }));
    expect(c).toContain("MERGE (:");
  });
});
