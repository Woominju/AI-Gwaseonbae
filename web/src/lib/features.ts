/**
 * Feature Flag (런타임 환경변수 — 같은 빌드를 3100·3101·3200에서 함께 쓰기 때문에 빌드 타임 값을 쓰지 않는다).
 * 기본값은 모두 "꺼짐". 명시적으로 "1"을 줄 때만 신규 기능이 노출된다.
 *   FEATURE_CAMPUS_LOUNGE=1  → /campus (HUFS 선배마을 · Campus Lounge), /api/lounge/*
 *   FEATURE_CAREER_INTEL=1   → /market (Career Market · My Skill Gap), /api/career/*
 *   FEATURE_COURSE_GRAPH=1   → 관계 그래프 검색(GraphRAG), /graph?view=explore, /api/graph/explore
 */
export interface FeatureFlags {
  campus_lounge: boolean;
  career_intel: boolean;
  course_graph: boolean;
}

export function getFeatures(): FeatureFlags {
  return {
    campus_lounge: process.env.FEATURE_CAMPUS_LOUNGE === "1",
    career_intel: process.env.FEATURE_CAREER_INTEL === "1",
    course_graph: process.env.FEATURE_COURSE_GRAPH === "1",
  };
}
