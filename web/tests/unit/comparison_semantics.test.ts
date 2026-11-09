/**
 * 3.0 최우선 버그 회귀 테스트: 진로 비교 수치와 설명의 방향 일치.
 * 2.0 생성형 모드에서 관찰된 실제 문장: "대학원 진학은 … 경제적 부담은 0.00으로 낮은 수준입니다" (계산값 0.00 = 부담 큼)
 */
import { describe, expect, it } from "vitest";
import { compareOptions, CRITERION_LABEL, PRIORITY_PRESETS } from "@/lib/comparison";
import { analysisBlock } from "@/lib/chat/orchestrator";
import { analyzeQuestion } from "@/lib/chat/intent";
import { band, checkConsistency, describeCriterion, interpretationTable } from "@/lib/comparisonText";
import { getSyntheticRecords } from "@/lib/data/records";
import { rankRecords } from "@/lib/scoring";
import type { StudentProfile } from "@/lib/types";

const P: StudentProfile = { department: "수학과", grade: 3, interest_fields: ["ai_ml", "data_science"], skills: ["python", "statistics"], career_types: [], values: [] };
const records = getSyntheticRecords();
const cmp = compareOptions({ profile: P, records, matches: rankRecords(P, records, null, "local_lexical_concept"), priorities: PRIORITY_PRESETS[3].weights, optionIds: ["graduate", "employment"] });
const grad = cmp.options.find((o) => o.id === "graduate")!;
const fb = grad.criteria.find((c) => c.key === "financial_burden")!;

describe("진로 비교 점수 의미", () => {
  it("정의: 모든 기준값 ∈ [0,1] (높을수록 유리), 적합도 ∈ [0,1]", () => {
    for (const o of cmp.options) {
      expect(o.weighted_score).toBeGreaterThanOrEqual(0);
      expect(o.weighted_score).toBeLessThanOrEqual(1);
      for (const c of o.criteria) expect(c.value >= 0 && c.value <= 1).toBe(true);
    }
    // 재현 조건: 대학원의 '경제적 부담 낮음' 값이 낮다(= 부담이 크다)
    expect(fb.value).toBeLessThanOrEqual(0.33);
  });
  it("describeCriterion 은 라벨의 '낮음'과 무관하게 값 방향으로 설명", () => {
    expect(describeCriterion("financial_burden", 0)).toContain("경제적 부담이 큰 편(불리)");
    expect(describeCriterion("financial_burden", 1)).toContain("경제적 부담이 작은 편(유리)");
    expect(describeCriterion("time_to_income", 0.1)).toContain("불리");
    expect(band(0.5)).toBe("neutral");
  });
  it("LLM 분석 블록에 방향이 명시된 해석과 '확률 아님'이 들어간다", () => {
    const a = analyzeQuestion("대학원 진학과 취업 중에 고민이에요");
    const block = analysisBlock(a, P, cmp);
    expect(block).toContain("1에 가까울수록 학생에게 유리");
    expect(block).toContain(`${CRITERION_LABEL.financial_burden} → 경제적 부담이 큰 편(불리)`);
    expect(block).toContain("확률이나 예측이 아니다");
    expect(block).toMatch(/양수 = '.+'에 유리하게 작용/);
  });
  it("2.0에서 관찰된 반전 서술을 검출한다", () => {
    const bad = "대학원 진학은 연구 전문성에서 매우 높은 점수를 받았지만, 경제적 부담은 0.00으로 낮은 수준입니다 [S-01].";
    const issues = checkConsistency(bad, cmp, CRITERION_LABEL);
    expect(issues.some((i) => i.key === "financial_burden" && i.option === grad.title)).toBe(true);
  });
  it("올바른 서술·라벨 인용은 오탐하지 않는다", () => {
    const ok = "대학원 진학은 경제적 부담이 큰 편입니다. 대학원 진학의 '경제적 부담 낮음' 값은 0.00입니다.";
    expect(checkConsistency(ok, cmp, CRITERION_LABEL)).toHaveLength(0);
  });
  it("계산값 해석표는 값과 방향 문구가 일치", () => {
    const t = interpretationTable(cmp, CRITERION_LABEL);
    expect(t).toContain(`${fb.value.toFixed(2)} · 경제적 부담이 큰 편(불리)`);
    expect(t).toContain("확률·예측이 아닌");
  });
});

describe("LLM 출력 정리", () => {
  it("프롬프트 구조 태그를 제거한다 (실제 Qwen3-14B 출력에서 관찰)", async () => {
    const { stripPromptTags } = await import("@/lib/chat/orchestrator");
    expect(stripPromptTags("관심 분야는 AI입니다. <evidence> S-01, S-06 </evidence>에 따르면")).not.toMatch(/<\/?evidence/);
  });
});

describe("일관성 검사 오탐 방지 (실제 Qwen3-14B 출력에서 관찰된 오탐)", () => {
  it("한 문장에 여러 기준이 섞여도 절 단위로 판정한다", () => {
    const s = "대학원 진학은 연구 전문성을 쌓기에 유리하지만, 경제적 부담이 크고 첫 직무까지 시간이 더 걸립니다 [S-01].";
    expect(checkConsistency(s, cmp, CRITERION_LABEL)).toHaveLength(0);
    const bad = "대학원 진학은 첫 직무까지 빠르게 도달할 수 있습니다.";
    const t = grad.criteria.find((c) => c.key === "time_to_income")!;
    if (t.value <= 0.33) expect(checkConsistency(bad, cmp, CRITERION_LABEL).some((i) => i.key === "time_to_income")).toBe(true);
  });
});
