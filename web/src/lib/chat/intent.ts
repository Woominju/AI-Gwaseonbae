/**
 * 질문 분석: 의도(intent)와 개체(분야·역량·학과)를 규칙 기반으로 추출한다.
 * LLM 없이도 재현 가능하며, LLM 모드에서도 검색 질의 구성에 같은 결과를 사용한다.
 */
import { extractConcepts, normalizeText } from "../taxonomy";

export type Intent =
  | "compare_paths"
  | "department_overview"
  | "skill_requirements"
  | "gap_analysis"
  | "internship_prep"
  | "official_info"
  | "general"
  | "out_of_scope";

export interface QuestionAnalysis {
  intent: Intent;
  fields: string[];
  skills: string[];
  departments: string[];
  options: string[]; // 비교 대상 선택지 ID
  official_topics: string[];
  injection_suspected: boolean;
}

const OFFICIAL_TOPICS: [string, RegExp][] = [
  ["졸업 요건", /졸업\s*(요건|학점|조건|기준)/],
  ["학사 규정", /학사\s*(규정|일정|제도)|수강\s*신청|재수강|휴학|복학|전과/],
  ["장학금 제도", /장학(금)?\s*(기준|조건|신청|일정|제도)/],
  ["채용 일정", /(채용|공채|모집)\s*(일정|기간|마감|날짜)|언제\s*(뽑|채용|공고)/],
  ["복수전공 신청 요건", /복수\s*전공\s*(신청|요건|조건|자격)/],
  ["연봉·합격률 등 수치 정보", /연봉|초봉|급여|합격률|합격\s*확률|취업률/],
];

const CAREER_SIGNAL = /진로|취업|대학원|직무|인턴|준비|선배|역량|스펙|포트폴리오|연구|회사|기업|공공|금융|전공|학과|자격증|프로젝트|커리어|진학|분야|면접|지원/;

export function analyzeQuestion(q: string): QuestionAnalysis {
  const n = normalizeText(q);
  const c = extractConcepts(q);
  const official = OFFICIAL_TOPICS.filter(([, re]) => re.test(q)).map(([t]) => t);
  const injection = /(이전|위의?)\s*(지시|명령).*(무시|잊)|ignore (all )?previous|system prompt|시스템 프롬프트/i.test(q);
  const grad = /대학원|석사|박사|진학|연구실/.test(q);
  const job = /취업|입사|회사|기업|바로\s*일|실무/.test(q);
  const pub = /공공|공기업|공무원/.test(q);
  let intent: Intent = "general";
  const options: string[] = [];
  if ((grad && (job || pub)) || /(어떤|무엇을?)\s*선택|고민|비교|vs|중\s*(어떤|어디|뭐)/.test(n) && (grad || job || pub)) {
    intent = "compare_paths";
    if (grad) options.push("graduate");
    if (job || !pub) options.push("employment");
    if (pub) options.push("public");
  } else if (official.length) intent = "official_info";
  else if (/부족|보완|약점|갭|모자/.test(q)) intent = "gap_analysis";
  else if (/인턴|현장실습/.test(q)) intent = "internship_prep";
  else if (/(어떤|무슨)\s*(분야|진로|곳|회사|직무).*(진출|갔|가나|가요|했)|진출했|어디로/.test(q)) intent = "department_overview";
  else if (/필요|준비|갖춰|공부|역량|스펙/.test(q)) intent = "skill_requirements";
  if (official.length && intent !== "compare_paths") intent = "official_info";
  if (intent === "general" && !CAREER_SIGNAL.test(q) && !c.fields.length && !c.skills.length) intent = "out_of_scope";
  return { intent, fields: c.fields, skills: c.skills, departments: c.departments, options: [...new Set(options)], official_topics: official, injection_suspected: injection };
}

export const INTENT_LABEL: Record<Intent, string> = {
  compare_paths: "진로 선택지 비교",
  department_overview: "학과 선배 진출 분야",
  skill_requirements: "직무 준비 요소",
  gap_analysis: "부족한 준비 요소 분석",
  internship_prep: "인턴십 준비",
  official_info: "공식 학사·채용 정보",
  general: "일반 진로 질문",
  out_of_scope: "서비스 범위 밖 질문",
};
