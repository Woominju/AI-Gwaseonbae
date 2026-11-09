import { describe, expect, it } from "vitest";
import { getSyntheticRecords } from "@/lib/data/records";
import { computeMatch, DEFAULT_WEIGHTS, normalizeWeights, rankRecords, profileToQuery, WEIGHT_PRESETS } from "@/lib/scoring";
import { DEMO_PROFILE } from "@/lib/eval/questions";
import type { StudentProfile } from "@/lib/types";

const records = getSyntheticRecords();
const empty: StudentProfile = { interest_fields: [], skills: [], career_types: [], values: [] };

describe("matching score", () => {
  it("모든 점수와 세부 점수가 0~1 범위", () => {
    const sem = new Map(records.map((r, i) => [r.record_id, (i % 7) / 6]));
    for (const m of rankRecords(DEMO_PROFILE, records, sem, "local_lexical_concept")) {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(1);
      for (const s of m.subscores) if (s.value !== null) { expect(s.value).toBeGreaterThanOrEqual(0); expect(s.value).toBeLessThanOrEqual(1); }
    }
  });

  it("점수 내림차순 정렬이 일관된다", () => {
    const ranked = rankRecords(DEMO_PROFILE, records, null, "local_lexical_concept");
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
  });

  it("시연 프로필(수학과·AI)의 상위 5건에 수학과 AI/데이터 기록이 포함된다", () => {
    const ranked = rankRecords(DEMO_PROFILE, records, null, "local_lexical_concept");
    const top5 = ranked.slice(0, 5).map((m) => m.record_id);
    expect(top5).toContain("S-01");
    expect(top5).toContain("S-06");
    expect(top5).not.toContain("S-17"); // 해외영업
  });

  it("프로필이 다르면 추천 결과가 달라진다", () => {
    const lang: StudentProfile = { ...empty, department: "언어 계열", interest_fields: ["global_business"], skills: ["영어"], career_types: ["global"] };
    const a = rankRecords(DEMO_PROFILE, records, null, "local_lexical_concept").slice(0, 3).map((m) => m.record_id);
    const b = rankRecords(lang, records, null, "local_lexical_concept").slice(0, 3).map((m) => m.record_id);
    expect(a).not.toEqual(b);
    expect(b.some((id) => ["S-13", "S-14", "S-17"].includes(id))).toBe(true);
  });

  it("가중치 변경 시 점수가 재계산된다", () => {
    const r = records.find((x) => x.record_id === "S-02")!;
    const a = computeMatch(DEMO_PROFILE, r, { value: 0.2, method: "local_lexical_concept" }, DEFAULT_WEIGHTS);
    const b = computeMatch(DEMO_PROFILE, r, { value: 0.2, method: "local_lexical_concept" }, WEIGHT_PRESETS.find((p) => p.id === "context_first")!.weights);
    expect(a.score).not.toBeCloseTo(b.score, 5);
  });

  it("가중치 프리셋은 순위를 실제로 바꾼다", () => {
    const orders = WEIGHT_PRESETS.map((p) => rankRecords(DEMO_PROFILE, records, null, "local_lexical_concept", p.weights).map((m) => m.record_id).join());
    expect(new Set(orders).size).toBeGreaterThan(1);
  });

  it("빈 프로필: 계산 불가 항목은 null, coverage 낮음, 신뢰도 low", () => {
    const m = computeMatch(empty, records[0], { value: null, method: "local_lexical_concept" });
    expect(m.subscores.find((s) => s.key === "career")!.value).toBeNull();
    expect(m.subscores.find((s) => s.key === "semantic")!.value).toBeNull();
    expect(m.coverage).toBeCloseTo(DEFAULT_WEIGHTS.skill * 0 + DEFAULT_WEIGHTS.evidence, 5);
    expect(m.confidence).toBe("low");
    expect(profileToQuery(empty)).toBe("");
  });

  it("가중치 정규화: 합이 1, 0이면 기본값", () => {
    const n = normalizeWeights({ semantic: 2, career: 2, skill: 2, context: 2, evidence: 2 });
    expect(Object.values(n).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(normalizeWeights({ semantic: 0, career: 0, skill: 0, context: 0, evidence: 0 })).toEqual(DEFAULT_WEIGHTS);
  });

  it("부족 역량(gaps)을 제시한다", () => {
    const r = records.find((x) => x.record_id === "S-06")!;
    const m = computeMatch(DEMO_PROFILE, r, { value: 0.5, method: "local_lexical_concept" });
    expect(m.gaps.length).toBeGreaterThan(0);
    expect(m.matched_skills).toContain("python");
  });
});
