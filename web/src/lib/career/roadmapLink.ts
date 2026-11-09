/**
 * Skill Gap → 기존 로드맵 연계 (순수 함수). 기존 Roadmap 스키마(version 1)를 그대로 사용한다.
 * 로드맵이 없으면 이 직무를 기준으로 한 최소 로드맵을 새로 만든다.
 */
import type { Roadmap, RoadmapItem } from "../types";

export interface GapItemInput {
  skill: string;
  label: string;
  reason: string;
  alumni_ids: string[];
  synthetic_sources: boolean;
}

export function addSkillGapItems(r: Roadmap | null, occupationLabel: string, items: GapItemInput[], profileSummary: string, now = new Date()): { roadmap: Roadmap; added: number } {
  const ts = now.toISOString();
  const base: Roadmap = r ?? { version: 1, created_at: ts, updated_at: ts, basis: { option_id: "career_intel", option_title: `Career Intelligence · ${occupationLabel}`, profile_summary: profileSummary }, items: [] };
  const existing = new Set(base.items.map((i) => i.id));
  const add: RoadmapItem[] = [];
  for (const it of items) {
    const id = `ci-${it.skill}`;
    if (existing.has(id)) continue;
    add.push({
      id,
      horizon: 3,
      title: `${it.label} 역량 점검·학습 (${occupationLabel})`,
      purpose: `보유 여부가 아직 확인되지 않은 역량입니다. 먼저 내가 어느 수준인지 점검하고, 필요하면 작은 실습 결과물로 남기세요. 근거: ${it.reason}`,
      related_option: `Career Intelligence · ${occupationLabel}`,
      timing: "3개월 내",
      done: false,
      memo: "",
      evidence: { record_ids: it.alumni_ids.slice(0, 3), note: `Skill Gap 분석(AI 분석)${it.synthetic_sources ? " · 가상 공고/NCS Fixture 포함" : ""}` },
      custom: false,
    });
  }
  return { roadmap: { ...base, updated_at: ts, items: [...base.items, ...add] }, added: add.length };
}
