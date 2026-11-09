import { describe, expect, it } from "vitest";
import { getSyntheticRecords } from "@/lib/data/records";
import { rankRecords } from "@/lib/scoring";
import { compareOptions, derivePriorities, PRIORITY_PRESETS } from "@/lib/comparison";
import { DEMO_PROFILE } from "@/lib/eval/questions";

const records = getSyntheticRecords();
const matches = rankRecords(DEMO_PROFILE, records, null, "local_lexical_concept");
const preset = (id: string) => PRIORITY_PRESETS.find((p) => p.id === id)!.weights;

describe("career comparison", () => {
  it("연구 전문성 우선 → 대학원, 빠른 취업 우선 → 취업이 1순위 (시연 시나리오 8·9)", () => {
    const research = compareOptions({ profile: DEMO_PROFILE, records, matches, priorities: preset("research") });
    const fast = compareOptions({ profile: DEMO_PROFILE, records, matches, priorities: preset("fast_job") });
    expect(research.ranking[0]).toBe("graduate");
    expect(fast.ranking[0]).toBe("employment");
    // 기준별 값(데이터 기반)은 동일하고 가중치만 바뀐다
    const g1 = research.options.find((o) => o.id === "graduate")!.criteria.map((c) => c.value);
    const g2 = fast.options.find((o) => o.id === "graduate")!.criteria.map((c) => c.value);
    expect(g1).toEqual(g2);
    expect(research.decisive_criteria[0].key).not.toBe(fast.decisive_criteria[0].key);
  });

  it("각 선택지에 근거 기록이 연결되고, 근거는 해당 경로 유형이다", () => {
    const r = compareOptions({ profile: DEMO_PROFILE, records, matches, priorities: preset("balanced") });
    for (const o of r.options) {
      expect(o.evidence_record_ids.length).toBeGreaterThan(0);
      for (const id of o.evidence_record_ids) expect(o.path_types).toContain(records.find((x) => x.record_id === id)!.path_type);
    }
  });

  it("빠른 경제적 독립 값은 근거 기록의 개월 수에서 계산된다", () => {
    const r = compareOptions({ profile: DEMO_PROFILE, records, matches, priorities: preset("balanced") });
    const g = r.options.find((o) => o.id === "graduate")!;
    const e = r.options.find((o) => o.id === "employment")!;
    expect(g.typical_months!).toBeGreaterThan(e.typical_months!);
    expect(e.criteria.find((c) => c.key === "time_to_income")!.basis).toBe("data");
  });

  it("경제적 제약이 크면 경제적 부담 가중치가 올라간다", () => {
    const a = derivePriorities({ ...DEMO_PROFILE, financial_constraint: "strong" }, "research");
    const b = derivePriorities(DEMO_PROFILE, "research");
    expect(a.weights.financial_burden).toBeGreaterThan(b.weights.financial_burden);
    expect(a.adjustments.length).toBe(1);
  });

  it("예측이 아님을 명시하는 노트가 포함된다", () => {
    const r = compareOptions({ profile: DEMO_PROFILE, records, matches, priorities: preset("balanced") });
    expect(r.notes.join(" ")).toContain("예측이 아닙니다");
  });
});
