/**
 * 정규화 사전(Taxonomy).
 * - 진로 분야, 역량, 학과(시연용 분류), 가치관을 ID로 정규화한다.
 * - 동의어(aliases)는 로컬 검색의 '개념 확장(concept expansion)'에 사용된다.
 * - 분야 간 친화도(affinity)와 분야별 핵심 역량은 '설계 가정'이며 검증된 통계가 아니다.
 */
import type { PathType } from "./types";

export interface CareerFieldDef {
  id: string;
  label: string;
  aliases: string[];
  core_skills: string[]; // 이 분야 선배 기록에서 자주 언급되는 역량(설계 가정)
}

export const CAREER_FIELDS: CareerFieldDef[] = [
  { id: "ai_ml", label: "AI·머신러닝", aliases: ["ai", "인공지능", "머신러닝", "기계학습", "딥러닝", "ml", "llm", "모델링", "ai 연구"], core_skills: ["python", "machine_learning", "deep_learning", "linear_algebra", "statistics", "research_writing"] },
  { id: "data_science", label: "데이터 사이언스·분석", aliases: ["데이터", "데이터분석", "데이터 분석", "데이터사이언스", "데이터 사이언스", "분석가", "애널리스트", "data"], core_skills: ["python", "sql", "statistics", "data_visualization", "machine_learning", "communication"] },
  { id: "software", label: "소프트웨어 개발", aliases: ["개발", "개발자", "백엔드", "프론트엔드", "프로그래밍", "소프트웨어", "엔지니어", "코딩"], core_skills: ["programming", "algorithms", "database", "cloud", "git"] },
  { id: "data_engineering", label: "데이터 엔지니어링", aliases: ["데이터 엔지니어", "파이프라인", "etl", "빅데이터 플랫폼"], core_skills: ["sql", "python", "cloud", "database", "programming"] },
  { id: "finance", label: "금융·리스크", aliases: ["금융", "은행", "증권", "보험", "리스크", "핀테크", "퀀트", "금융권"], core_skills: ["statistics", "financial_analysis", "excel", "sql", "certification_finance"] },
  { id: "business_strategy", label: "경영·전략·기획", aliases: ["기획", "전략", "컨설팅", "경영", "사업개발", "pm", "프로덕트"], core_skills: ["business_analysis", "communication", "excel", "presentation", "data_visualization"] },
  { id: "marketing", label: "마케팅·그로스", aliases: ["마케팅", "그로스", "브랜드", "광고", "퍼포먼스"], core_skills: ["data_visualization", "sql", "communication", "business_analysis"] },
  { id: "public_policy", label: "공공·정책", aliases: ["공공기관", "공기업", "공무원", "정책", "통계청", "공공"], core_skills: ["statistics", "ncs", "report_writing", "foreign_language"] },
  { id: "global_business", label: "글로벌 비즈니스·해외영업", aliases: ["해외영업", "무역", "외국계", "글로벌", "해외", "국제"], core_skills: ["foreign_language", "communication", "business_analysis", "negotiation"] },
  { id: "localization_language_tech", label: "현지화·언어 기술", aliases: ["번역", "통역", "현지화", "로컬라이제이션", "언어 데이터", "nlp", "자연어"], core_skills: ["foreign_language", "linguistics", "data_annotation", "communication", "python"] },
  { id: "ux_research", label: "UX 리서치·서비스 기획", aliases: ["ux", "사용자 조사", "리서치", "서비스 기획", "ux 리서처"], core_skills: ["user_research", "communication", "statistics", "presentation"] },
  { id: "research_academia", label: "연구·학계", aliases: ["연구", "대학원", "학계", "박사", "석사", "연구원", "연구실"], core_skills: ["research_writing", "linear_algebra", "statistics", "foreign_language", "mathematical_proof"] },
];

export interface SkillDef {
  id: string;
  label: string;
  aliases: string[];
  group: "programming" | "math_stats" | "data" | "business" | "language" | "research" | "certification" | "soft";
}

export const SKILLS: SkillDef[] = [
  { id: "python", label: "Python", aliases: ["파이썬", "python", "pandas", "판다스", "numpy"], group: "programming" },
  { id: "r", label: "R", aliases: ["r언어", "r 프로그래밍"], group: "programming" },
  { id: "programming", label: "프로그래밍(일반)", aliases: ["java", "자바", "c++", "c언어", "javascript", "자바스크립트", "코딩", "프로그래밍", "typescript"], group: "programming" },
  { id: "algorithms", label: "자료구조·알고리즘", aliases: ["알고리즘", "자료구조", "코딩테스트", "코테"], group: "programming" },
  { id: "git", label: "Git·협업 도구", aliases: ["git", "github", "깃", "깃허브"], group: "programming" },
  { id: "cloud", label: "클라우드·배포", aliases: ["aws", "gcp", "클라우드", "docker", "도커", "쿠버네티스", "배포", "ncp", "네이버클라우드"], group: "programming" },
  { id: "database", label: "데이터베이스", aliases: ["db", "데이터베이스", "mysql", "postgresql"], group: "data" },
  { id: "sql", label: "SQL", aliases: ["sql", "쿼리"], group: "data" },
  { id: "statistics", label: "통계", aliases: ["통계", "통계학", "회귀분석", "확률", "확률통계", "가설검정", "수리통계"], group: "math_stats" },
  { id: "linear_algebra", label: "선형대수", aliases: ["선형대수", "선형대수학", "행렬"], group: "math_stats" },
  { id: "optimization", label: "최적화", aliases: ["최적화", "수리계획", "운영과학", "or"], group: "math_stats" },
  { id: "mathematical_proof", label: "수학적 증명·이론", aliases: ["해석학", "증명", "대수학", "위상수학", "수학 이론"], group: "math_stats" },
  { id: "machine_learning", label: "머신러닝", aliases: ["머신러닝", "기계학습", "scikit-learn", "사이킷런", "ml"], group: "data" },
  { id: "deep_learning", label: "딥러닝", aliases: ["딥러닝", "pytorch", "파이토치", "tensorflow", "신경망", "llm", "트랜스포머"], group: "data" },
  { id: "data_visualization", label: "데이터 시각화", aliases: ["시각화", "tableau", "태블로", "대시보드", "power bi"], group: "data" },
  { id: "data_annotation", label: "데이터 구축·라벨링", aliases: ["라벨링", "어노테이션", "데이터 구축", "말뭉치", "코퍼스"], group: "data" },
  { id: "excel", label: "엑셀·스프레드시트", aliases: ["엑셀", "excel", "스프레드시트"], group: "business" },
  { id: "financial_analysis", label: "재무·금융 분석", aliases: ["재무", "재무분석", "회계", "밸류에이션", "금융공학"], group: "business" },
  { id: "business_analysis", label: "비즈니스 분석", aliases: ["시장조사", "비즈니스 분석", "사업분석", "케이스 스터디"], group: "business" },
  { id: "presentation", label: "발표·보고서 작성", aliases: ["발표", "ppt", "프레젠테이션"], group: "soft" },
  { id: "report_writing", label: "보고서·문서 작성", aliases: ["보고서", "문서 작성", "글쓰기", "작문"], group: "soft" },
  { id: "communication", label: "커뮤니케이션", aliases: ["커뮤니케이션", "소통", "협업", "팀워크"], group: "soft" },
  { id: "negotiation", label: "협상", aliases: ["협상", "영업"], group: "soft" },
  { id: "foreign_language", label: "외국어", aliases: ["영어", "외국어", "토익", "토플", "오픽", "중국어", "스페인어", "독일어", "프랑스어", "일본어", "러시아어", "아랍어", "베트남어", "통번역"], group: "language" },
  { id: "linguistics", label: "언어학", aliases: ["언어학", "형태론", "통사론", "의미론", "말뭉치언어학"], group: "language" },
  { id: "research_writing", label: "연구·논문 작성", aliases: ["논문", "연구", "학회", "학부연구생", "리서치 페이퍼"], group: "research" },
  { id: "user_research", label: "사용자 조사", aliases: ["인터뷰", "사용자 조사", "ux 리서치", "설문 설계", "fgi"], group: "research" },
  { id: "ncs", label: "NCS·공공기관 필기", aliases: ["ncs", "psat", "필기시험", "공기업 필기"], group: "certification" },
  { id: "certification_finance", label: "금융 자격증", aliases: ["투자자산운용사", "frm", "cfa", "신용분석사", "금융자격증"], group: "certification" },
  { id: "certification_data", label: "데이터 자격증", aliases: ["adsp", "sqld", "빅데이터분석기사", "정보처리기사", "사회조사분석사"], group: "certification" },
];

/** 역량 간 관련도 (같은 그룹 0.4, 아래 명시 쌍은 지정값). 설계 가정. */
export const SKILL_RELATED: Record<string, Record<string, number>> = {
  python: { r: 0.6, programming: 0.6, machine_learning: 0.5, sql: 0.4 },
  machine_learning: { deep_learning: 0.8, statistics: 0.6, python: 0.5, linear_algebra: 0.5 },
  deep_learning: { machine_learning: 0.8, linear_algebra: 0.5, python: 0.5 },
  statistics: { machine_learning: 0.6, r: 0.5, data_visualization: 0.3, certification_data: 0.4 },
  sql: { database: 0.8, python: 0.4, certification_data: 0.4 },
  database: { sql: 0.8 },
  linear_algebra: { optimization: 0.6, mathematical_proof: 0.5, machine_learning: 0.5 },
  optimization: { linear_algebra: 0.6, mathematical_proof: 0.4 },
  report_writing: { research_writing: 0.5, presentation: 0.5 },
  research_writing: { report_writing: 0.5, mathematical_proof: 0.3 },
  linguistics: { foreign_language: 0.5, data_annotation: 0.5 },
  data_annotation: { linguistics: 0.5 },
  business_analysis: { data_visualization: 0.4, excel: 0.5, financial_analysis: 0.4 },
  financial_analysis: { business_analysis: 0.4, certification_finance: 0.6, excel: 0.4 },
  user_research: { communication: 0.4, statistics: 0.3 },
};

/** 분야 친화도 (대칭). 명시되지 않은 쌍은 0. 설계 가정. */
const FIELD_AFFINITY_PAIRS: [string, string, number][] = [
  ["ai_ml", "data_science", 0.75],
  ["ai_ml", "research_academia", 0.6],
  ["ai_ml", "software", 0.45],
  ["ai_ml", "data_engineering", 0.45],
  ["ai_ml", "localization_language_tech", 0.35],
  ["data_science", "data_engineering", 0.6],
  ["data_science", "finance", 0.45],
  ["data_science", "marketing", 0.45],
  ["data_science", "business_strategy", 0.35],
  ["data_science", "public_policy", 0.35],
  ["data_science", "research_academia", 0.35],
  ["data_science", "ux_research", 0.3],
  ["software", "data_engineering", 0.6],
  ["finance", "business_strategy", 0.45],
  ["business_strategy", "marketing", 0.55],
  ["business_strategy", "global_business", 0.5],
  ["business_strategy", "ux_research", 0.4],
  ["global_business", "localization_language_tech", 0.5],
  ["global_business", "public_policy", 0.3],
  ["public_policy", "research_academia", 0.3],
  ["localization_language_tech", "ux_research", 0.35],
];

export function fieldAffinity(a: string, b: string): number {
  if (a === b) return 1;
  for (const [x, y, v] of FIELD_AFFINITY_PAIRS) {
    if ((x === a && y === b) || (x === b && y === a)) return v;
  }
  return 0;
}

export interface DepartmentDef {
  id: string;
  label: string;
  group: "math_science" | "computing" | "business" | "language_global";
  /** 실제 학과명 확인 전이므로 시연용 분류로 처리 */
  demo_category: true;
}

export const DEPARTMENTS: DepartmentDef[] = [
  { id: "수학과", label: "수학과", group: "math_science", demo_category: true },
  { id: "통계 계열", label: "통계 계열", group: "math_science", demo_category: true },
  { id: "컴퓨터공학 계열", label: "컴퓨터공학 계열", group: "computing", demo_category: true },
  { id: "경영 계열", label: "경영 계열", group: "business", demo_category: true },
  { id: "경제 계열", label: "경제 계열", group: "business", demo_category: true },
  { id: "언어 계열", label: "언어 계열(외국어 전공)", group: "language_global", demo_category: true },
  { id: "국제지역 계열", label: "국제지역 계열", group: "language_global", demo_category: true },
];

/** 학과 계열 간 유사도 (설계 가정) */
const DEPT_GROUP_AFFINITY: Record<string, Record<string, number>> = {
  math_science: { computing: 0.5, business: 0.3, language_global: 0.1 },
  computing: { math_science: 0.5, business: 0.25, language_global: 0.15 },
  business: { math_science: 0.3, computing: 0.25, language_global: 0.4 },
  language_global: { business: 0.4, computing: 0.15, math_science: 0.1 },
};

export function departmentAffinity(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  if (a === b) return 1;
  const da = DEPARTMENTS.find((d) => d.id === a);
  const db = DEPARTMENTS.find((d) => d.id === b);
  if (!da || !db) return normalizeText(a) === normalizeText(b) ? 1 : 0.1;
  if (da.group === db.group) return 0.7;
  return DEPT_GROUP_AFFINITY[da.group]?.[db.group] ?? 0.1;
}

export const VALUES = [
  { id: "research_expertise", label: "연구 전문성" },
  { id: "financial_independence", label: "빠른 경제적 독립" },
  { id: "keep_options", label: "다양한 진로 가능성 유지" },
  { id: "stability", label: "고용 안정성" },
  { id: "global", label: "글로벌 환경" },
  { id: "social_impact", label: "사회적 기여" },
  { id: "work_life_balance", label: "일과 삶의 균형" },
] as const;

export const PATH_TYPE_LABEL: Record<PathType, string> = {
  graduate_school: "대학원 진학",
  industry_job: "학부 졸업 후 기업 취업",
  finance: "금융권 진출",
  foreign_company: "외국계 기업",
  public_sector: "공공기관",
  career_switch: "전공과 다른 분야",
};

/* ---------------- 정규화 유틸 ---------------- */

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[·・‧∙]/g, " ")
    .replace(/[^\p{L}\p{N}+#\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const skillIndex = new Map<string, string>();
for (const s of SKILLS) {
  skillIndex.set(normalizeText(s.id), s.id);
  skillIndex.set(normalizeText(s.label), s.id);
  for (const a of s.aliases) skillIndex.set(normalizeText(a), s.id);
}

/** 자유 텍스트 역량 → 정규화 ID. 매칭 실패 시 원문을 소문자로 반환 */
export function canonicalSkill(raw: string): string {
  const n = normalizeText(raw);
  return skillIndex.get(n) ?? n;
}

export function skillLabel(id: string): string {
  return SKILLS.find((s) => s.id === id)?.label ?? id;
}

export function fieldLabel(id: string): string {
  return CAREER_FIELDS.find((f) => f.id === id)?.label ?? id;
}

export function skillRelatedness(a: string, b: string): number {
  if (a === b) return 1;
  const direct = SKILL_RELATED[a]?.[b] ?? SKILL_RELATED[b]?.[a];
  if (direct !== undefined) return direct;
  const ga = SKILLS.find((s) => s.id === a)?.group;
  const gb = SKILLS.find((s) => s.id === b)?.group;
  if (ga && gb && ga === gb && ga !== "soft") return 0.3;
  return 0;
}

/** 텍스트에서 언급된 분야·역량·학과 개념을 추출 (개념 확장용) */
export function extractConcepts(text: string): { fields: string[]; skills: string[]; departments: string[] } {
  const n = " " + normalizeText(text) + " ";
  const fields = new Set<string>();
  const skills = new Set<string>();
  const departments = new Set<string>();
  for (const f of CAREER_FIELDS) {
    for (const a of [f.label, ...f.aliases]) {
      const na = normalizeText(a);
      if (na.length >= 2 && n.includes(na)) fields.add(f.id);
      else if (na.length < 2 && n.includes(" " + na + " ")) fields.add(f.id);
    }
  }
  for (const s of SKILLS) {
    for (const a of [s.label, ...s.aliases]) {
      const na = normalizeText(a);
      if (na.length >= 3 ? n.includes(na) : n.includes(" " + na + " ")) skills.add(s.id);
    }
  }
  for (const d of DEPARTMENTS) {
    const core = normalizeText(d.id.replace(/ 계열$/, ""));
    if (n.includes(core)) departments.add(d.id);
  }
  return { fields: [...fields], skills: [...skills], departments: [...departments] };
}
