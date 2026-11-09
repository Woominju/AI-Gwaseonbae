/**
 * Career Intelligence 대상 직무 카탈로그.
 * - fields: 기존 taxonomy 진로 분야 ID (선배 기록 연결용)
 * - ncs: NCS 세분류 후보. 코드는 공개 2차 자료 기준이며 공식 API로 재확인 전까지 code_verified=false
 * - saramin_keywords: 사람인 job-search `keywords` 검색어
 */
import { normalizeText } from "../taxonomy";

export interface OccupationDef {
  id: string;
  label: string;
  aliases: string[];
  fields: string[];
  ncs: { name: string; code: string | null; code_verified: boolean; path: string } | null;
  saramin_keywords: string;
}

export const OCCUPATIONS: OccupationDef[] = [
  { id: "data_analyst", label: "데이터 분석가", aliases: ["데이터 분석가", "데이터분석가", "데이터 분석", "데이터분석", "데이터 애널리스트", "data analyst", "데이터 사이언티스트"], fields: ["data_science"], ncs: { name: "빅데이터분석", code: "20010105", code_verified: false, path: "정보통신 > 정보기술 > (소분류 미확인) > 빅데이터분석" }, saramin_keywords: "데이터 분석" },
  { id: "ml_engineer", label: "AI·머신러닝 엔지니어", aliases: ["머신러닝 엔지니어", "ai 엔지니어", "인공지능 엔지니어", "ml 엔지니어", "ai 개발자", "딥러닝 엔지니어"], fields: ["ai_ml"], ncs: { name: "인공지능모델링", code: "20010703", code_verified: false, path: "정보통신 > 정보기술 > 인공지능 > 인공지능모델링" }, saramin_keywords: "머신러닝" },
  { id: "software_engineer", label: "소프트웨어 개발자", aliases: ["소프트웨어 개발자", "백엔드 개발자", "개발자", "프로그래머", "웹 개발자", "소프트웨어 엔지니어"], fields: ["software"], ncs: { name: "응용SW엔지니어링", code: "20010202", code_verified: false, path: "정보통신 > 정보기술 > 정보기술개발 > 응용SW엔지니어링" }, saramin_keywords: "백엔드 개발" },
  { id: "global_sales", label: "해외영업·글로벌 비즈니스", aliases: ["해외영업", "해외 영업", "무역", "글로벌 비즈니스", "수출"], fields: ["global_business"], ncs: null, saramin_keywords: "해외영업" },
  { id: "business_planning", label: "경영기획·전략", aliases: ["경영기획", "전략기획", "사업기획", "기획자", "전략"], fields: ["business_strategy"], ncs: { name: "경영기획", code: null, code_verified: false, path: "경영·회계·사무 > 기획사무 > 경영기획" }, saramin_keywords: "경영기획" },
];

export function getOccupation(id: string | null | undefined): OccupationDef | undefined {
  return OCCUPATIONS.find((o) => o.id === id);
}

/** 질문에서 직무 언급 탐지 (긴 별칭 우선) */
export function detectOccupation(text: string): OccupationDef | undefined {
  const n = normalizeText(text);
  let best: { o: OccupationDef; len: number } | undefined;
  for (const o of OCCUPATIONS)
    for (const a of o.aliases) {
      const na = normalizeText(a);
      if (n.includes(na) && (!best || na.length > best.len)) best = { o, len: na.length };
    }
  return best?.o;
}

/** 프로필 관심 분야로 기본 직무 추정 */
export function occupationForFields(fields: string[]): OccupationDef | undefined {
  return OCCUPATIONS.find((o) => o.fields.some((f) => fields.includes(f)));
}

/** Career Intelligence 를 호출할 만한 질문인지 (채용시장·역량 비교) */
export const INTEL_SIGNAL = /채용|공고|요즘|시장|요구(하|되)|역량.*(비교|차이)|(비교|차이).*역량|지원하기\s*전|무엇을\s*공부|뭘\s*공부|어떤\s*역량/;
