/**
 * 개인별 진로 로드맵 생성 (순수 함수) + 저장/복원 헬퍼.
 * 각 활동은 근거(선배 기록 ID 또는 '학생 프로필 기반 AI 분석')를 함께 가진다.
 */
import type { ComparisonResult, MatchResult, Roadmap, RoadmapItem, SeniorRecord, StudentProfile } from "./types";
import { canonicalSkill, fieldLabel, skillLabel } from "./taxonomy";

function addMonths(d: Date, m: number): string {
  const x = new Date(d.getFullYear(), d.getMonth() + m, 1);
  return `${x.getFullYear()}년 ${x.getMonth() + 1}월`;
}

export function profileSummary(p: StudentProfile): string {
  const bits = [p.department, p.grade ? `${p.grade}학년` : "", p.interest_fields.map(fieldLabel).join("·")].filter(Boolean);
  return bits.join(" / ") || "프로필 미입력";
}

export interface RoadmapInput {
  profile: StudentProfile;
  comparison: ComparisonResult;
  optionId?: string; // 기본: 비교 1순위
  matches: MatchResult[];
  records: SeniorRecord[];
  now?: Date;
}

export function generateRoadmap(input: RoadmapInput): Roadmap {
  const { profile, comparison, records } = input;
  const now = input.now ?? new Date();
  const optId = input.optionId ?? comparison.ranking[0];
  const opt = comparison.options.find((o) => o.id === optId) ?? comparison.options[0];
  const other = comparison.options.find((o) => o.id !== opt.id);
  const evIds = opt.evidence_record_ids;
  const evRecs = records.filter((r) => evIds.includes(r.record_id));
  const mySkills = new Set(profile.skills.map(canonicalSkill));
  const items: RoadmapItem[] = [];
  const add = (it: Omit<RoadmapItem, "done" | "memo">) => items.push({ ...it, done: false, memo: "" });
  const isGrad = opt.id === "graduate";

  // 1개월
  add({
    id: "m1-role-research",
    horizon: 1,
    title: "관심 직무의 역량 요구사항 조사",
    purpose: `'${opt.title}' 선배들의 핵심 역량(${opt.required_skills.slice(0, 4).join(", ") || "-"})을 실제 채용 공고·연구실 모집 요건과 비교해 차이를 확인합니다.`,
    related_option: opt.title,
    timing: `${addMonths(now, 1)}까지`,
    evidence: { record_ids: evIds.slice(0, 3), note: "근거 선배 기록의 핵심 역량 목록" },
  });
  add({
    id: "m1-senior-review",
    horizon: 1,
    title: `관련 선배 기록 ${Math.min(3, evIds.length) || 1}건 정독하고 질문 목록 만들기`,
    purpose: "선배들의 준비 순서와 어려움을 보고, 내 상황에서 확인할 질문을 정리합니다 (동문 멘토링·상담 시 활용).",
    related_option: opt.title,
    timing: `${addMonths(now, 1)}까지`,
    evidence: { record_ids: evIds.slice(0, 3), note: "선배 기록의 준비 과정·어려움 필드" },
  });
  if (isGrad) {
    add({
      id: "m1-lab-scan",
      horizon: 1,
      title: "관심 연구실 3곳 탐색 및 최근 논문 읽기",
      purpose: "연구 주제와 분위기가 맞는지 확인합니다. 모집 일정은 연구실·학과 공식 안내로 확인하세요.",
      related_option: opt.title,
      timing: `${addMonths(now, 1)}까지`,
      evidence: { record_ids: evRecs.filter((r) => r.advice.some((a) => a.includes("연구실") || a.includes("논문"))).map((r) => r.record_id), note: "연구실 탐색을 조언한 선배 기록" },
    });
  }

  // 3개월: 부족 역량 학습 + 프로젝트
  const missingIds = evRecs
    .flatMap((r) => r.key_skills)
    .filter((s) => !mySkills.has(s))
    .reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map<string, number>());
  const topMissing = [...missingIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s);
  for (const s of topMissing) {
    add({
      id: `m3-skill-${s}`,
      horizon: 3,
      title: `${skillLabel(s)} 역량 보완`,
      purpose: `근거 선배 ${missingIds.get(s)}명이 핵심 역량으로 기록했지만 현재 프로필에는 없습니다. 작은 실습 결과물로 남기세요.`,
      related_option: opt.title,
      timing: `${addMonths(now, 3)}까지`,
      evidence: { record_ids: evRecs.filter((r) => r.key_skills.includes(s)).map((r) => r.record_id), note: "해당 역량을 핵심 역량으로 기록한 선배" },
    });
  }
  add({
    id: "m3-project",
    horizon: 3,
    title: profile.has_project ? "기존 프로젝트를 포트폴리오로 보완" : "관심 분야 첫 프로젝트 완성",
    purpose: isGrad
      ? "연구 질문을 정하고 재현 실험·보고서 형태로 정리합니다 (연구실 컨택 시 제시할 결과물)."
      : "작더라도 끝까지 완성·배포한 결과물을 만듭니다. 선배들은 완성된 결과물이 면접에서 가장 많이 다뤄졌다고 기록했습니다.",
    related_option: opt.title,
    timing: `${addMonths(now, 3)}까지`,
    evidence: { record_ids: evRecs.filter((r) => r.projects.length).map((r) => r.record_id).slice(0, 3), note: "프로젝트 경험이 있는 근거 선배" },
  });

  // 6개월
  if (isGrad) {
    add({
      id: "m6-research",
      horizon: 6,
      title: profile.has_research ? "연구 경험을 발표·보고서로 정리" : "학부연구생 참여 또는 연구실 면담",
      purpose: "대학원 선택 전에 연구가 나에게 맞는지 직접 확인합니다.",
      related_option: opt.title,
      timing: `${addMonths(now, 6)}까지`,
      evidence: { record_ids: evRecs.filter((r) => r.projects.some((p) => p.kind === "research")).map((r) => r.record_id), note: "학부연구생 경험을 기록한 선배" },
    });
  } else {
    add({
      id: "m6-internship",
      horizon: 6,
      title: profile.has_internship ? "인턴십 경험을 직무 역량 중심으로 정리" : "인턴십·현장실습·멘토링 기회 탐색 및 지원",
      purpose: "실무 경험을 확보합니다. 학교 프로그램과 모집 일정은 경력개발 관련 부서의 공식 안내로 확인하세요.",
      related_option: opt.title,
      timing: `${addMonths(now, 6)}까지`,
      evidence: { record_ids: evRecs.filter((r) => r.internships.length).map((r) => r.record_id), note: "인턴십 경험이 있는 근거 선배" },
    });
  }
  if (other) {
    add({
      id: "m6-alt-check",
      horizon: 6,
      title: `대안 경로(${other.title.replace(/^경로 [A-Z] · /, "")}) 정보 점검`,
      purpose: "한 경로만 준비하지 않도록, 대안 경로 선배의 기록과 요구 역량을 한 번 더 확인합니다.",
      related_option: other.title,
      timing: `${addMonths(now, 6)}까지`,
      evidence: { record_ids: other.evidence_record_ids.slice(0, 2), note: "대안 경로의 근거 선배" },
    });
  }

  // 12개월
  add({
    id: "m12-reassess",
    horizon: 12,
    title: "진로 선택 재평가",
    purpose: "그동안의 경험을 프로필에 반영하고, 비교 화면에서 우선순위를 다시 조정해 결과가 어떻게 달라지는지 확인합니다.",
    related_option: "전체",
    timing: `${addMonths(now, 12)}`,
    evidence: { record_ids: [], note: "학생 프로필 기반 AI 분석 (선배 진술 아님)" },
  });
  add({
    id: "m12-apply",
    horizon: 12,
    title: isGrad ? "대학원 지원 서류·연구계획서 준비" : "지원서·포트폴리오 정리 및 지원",
    purpose: "구체적인 지원 일정·자격은 각 기관의 공식 공고에서 확인합니다 (이 서비스는 일정 정보를 제공하지 않습니다).",
    related_option: opt.title,
    timing: `${addMonths(now, 12)}`,
    evidence: { record_ids: evRecs.filter((r) => r.preparation_timeline.some((t) => t.category === "application")).map((r) => r.record_id).slice(0, 3), note: "지원 준비 시기를 기록한 선배" },
  });

  const ts = now.toISOString();
  return { version: 1, created_at: ts, updated_at: ts, basis: { option_id: opt.id, option_title: opt.title, profile_summary: profileSummary(profile) }, items };
}

export function roadmapProgress(r: Roadmap): number {
  return r.items.length ? r.items.filter((i) => i.done).length / r.items.length : 0;
}

export function updateItem(r: Roadmap, id: string, patch: Partial<Pick<RoadmapItem, "done" | "memo" | "title" | "timing">>): Roadmap {
  return { ...r, updated_at: new Date().toISOString(), items: r.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
}

export function addCustomItem(r: Roadmap, horizon: RoadmapItem["horizon"], title: string): Roadmap {
  const it: RoadmapItem = {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    horizon,
    title,
    purpose: "직접 추가한 활동",
    related_option: "직접 추가",
    timing: `${horizon}개월 내`,
    done: false,
    evidence: { record_ids: [], note: "사용자 직접 입력" },
    memo: "",
    custom: true,
  };
  return { ...r, updated_at: new Date().toISOString(), items: [...r.items, it] };
}

export function removeItem(r: Roadmap, id: string): Roadmap {
  return { ...r, updated_at: new Date().toISOString(), items: r.items.filter((i) => i.id !== id) };
}

export const ROADMAP_KEY = "hufs-atlas:roadmap:v1";

export function saveRoadmap(storage: Pick<Storage, "setItem">, r: Roadmap) {
  storage.setItem(ROADMAP_KEY, JSON.stringify(r));
}

export function loadRoadmap(storage: Pick<Storage, "getItem">): Roadmap | null {
  try {
    const raw = storage.getItem(ROADMAP_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as Roadmap;
    if (r?.version !== 1 || !Array.isArray(r.items)) return null;
    return r;
  } catch {
    return null;
  }
}
