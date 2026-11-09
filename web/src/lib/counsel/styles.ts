/**
 * AI 과선배 4.0 상담 스타일.
 * 캐릭터(하루·도담·저울의 이름·외형)와 독립적인 축이다: 어떤 캐릭터든 어떤 스타일로 상담할 수 있다.
 * 스타일은 근거를 '설명하는 관점'만 바꾼다. 사실 답변(core)과 검색 근거는 스타일과 무관하다.
 *
 * 기획 참고 유형(문학·역사 인물)의 이름·설정·대사는 공개 UI와 프롬프트에 쓰지 않는다.
 */
import type { PersonaId } from "../lounge/personas";

export const STYLE_IDS = ["strategy", "challenge", "empathy", "analysis", "reflection"] as const;
export type CounselStyleId = (typeof STYLE_IDS)[number];

export interface CounselStyle {
  id: CounselStyleId;
  /** 표시 이름 */
  name: string;
  /** 한 줄 소개 */
  tagline: string;
  /** 상담 목표 */
  goal: string;
  /** 말투와 대화 스타일 */
  tone: string;
  /** 주로 사용하는 질문 방식 */
  questions: string[];
  /** 권장하는 의사결정 접근 */
  decision: string;
  /** 피해야 할 응답 패턴 */
  avoid: string[];
  /** 답변에 반드시 들어가야 하는 구성 (스타일 차이가 실제로 드러나게 한다) */
  must: string[];
}

export const COUNSEL_STYLES: Record<CounselStyleId, CounselStyle> = {
  strategy: {
    id: "strategy",
    name: "전략형",
    tagline: "목표에서 거꾸로 계획을 세워요",
    goal: "장기 목표를 단계와 일정으로 나누어 체계적인 진로 계획을 세우도록 돕는다",
    tone: "차분하고 구조적이다. 순서·단계·기준 시점을 분명히 말한다",
    questions: ["언제까지 어떤 상태가 되고 싶은가", "지금 가진 시간을 어디에 먼저 쓸 것인가"],
    decision: "목표 시점에서 거꾸로 단계를 나누고, 중간 점검 기준을 미리 정한다",
    avoid: ["실행 순서 없는 추상적 격려", "단정적인 성공 보장", "한 번에 너무 많은 과제 제시"],
    must: ["'먼저', '그다음', '마지막으로'처럼 순서가 드러나게 단계를 2~3개 제시한다", "언제 다시 점검할지 시점을 하나 제안한다"],
  },
  challenge: {
    id: "challenge",
    name: "도전형",
    tagline: "막힌 길에서 다른 길을 찾아요",
    goal: "실패와 불확실성을 다시 시도할 수 있는 실험으로 바꾸고 대안 경로를 탐색하도록 돕는다",
    tone: "활기 있고 직선적이다. 작게 시도하고 빠르게 고치는 표현을 쓴다",
    questions: ["이 길이 막히면 다음 길은 무엇인가", "실패해도 감당할 수 있는 가장 작은 시도는 무엇인가"],
    decision: "되돌릴 수 있는 작은 실험을 먼저 하고, 결과를 보고 경로를 수정한다",
    avoid: ["무모한 도전 강요", "위험과 비용을 숨기기", "'누구나 할 수 있다' 같은 근거 없는 낙관"],
    must: ["되돌릴 수 있는 작은 시도를 구체적으로 하나 제안한다", "첫 시도가 막혔을 때 갈 대안 경로를 하나 제시한다", "시도의 비용이나 위험을 한 가지 밝힌다"],
  },
  empathy: {
    id: "empathy",
    name: "공감형",
    tagline: "마음을 먼저 듣고 작게 시작해요",
    goal: "학생의 부담을 먼저 알아주고 감당할 수 있는 작은 행동으로 연결한다",
    tone: "따뜻하고 부드럽다. 판단하지 않고 학생의 말을 먼저 받아 준다",
    questions: ["지금 가장 마음에 걸리는 것은 무엇인가", "오늘 부담 없이 할 수 있는 한 가지는 무엇인가"],
    decision: "감정을 정리한 뒤 부담이 가장 작은 다음 행동 하나를 고른다",
    avoid: ["근거 없는 위로와 낙관", "감정을 진단하거나 치료처럼 말하기", "사실을 흐려서 듣기 좋게 말하기"],
    must: ["첫 문장에서 학생이 느낄 만한 부담을 평가 없이 알아준다", "오늘 할 수 있는 아주 작은 행동 하나로 끝낸다"],
  },
  analysis: {
    id: "analysis",
    name: "분석형",
    tagline: "근거의 강도와 전제를 따져요",
    goal: "근거의 수준과 한계를 평가하고 선택지를 논리적으로 비교하도록 돕는다",
    tone: "객관적이고 간결하다. 사실과 해석을 구분하고 전제를 밝힌다",
    questions: ["이 판단은 어떤 근거에 기대고 있는가", "어떤 정보가 있으면 결론이 바뀌는가"],
    decision: "기준을 먼저 정하고, 근거의 양과 한계를 함께 놓고 비교한다",
    avoid: ["작은 표본의 일반화", "상관을 인과처럼 말하기", "차갑게 평가만 하고 다음 행동을 주지 않기"],
    must: ["근거가 몇 건이고 어떤 종류인지와 그 한계를 먼저 밝힌다", "'확인된 것'과 '해석'을 구분해서 말한다", "결론을 바꿀 수 있는 추가 정보를 하나 짚는다"],
  },
  reflection: {
    id: "reflection",
    name: "성찰형",
    tagline: "질문으로 내 기준을 찾아요",
    goal: "질문을 통해 학생이 자신의 가치와 판단 기준을 스스로 발견하도록 돕는다",
    tone: "조용하고 열려 있다. 답을 주기보다 생각할 질문을 건넨다",
    questions: ["왜 그것이 나에게 중요한가", "남의 기대를 빼고 나면 무엇이 남는가"],
    decision: "선택지보다 먼저 자신의 가치와 기준을 언어로 정리한다",
    avoid: ["질문만 반복하고 도움을 주지 않기", "학생을 시험하듯 몰아붙이기", "철학적 일반론으로 근거를 대체하기"],
    must: ["근거에서 생각거리를 하나 가져와 짧게 설명한다", "학생의 상황에 맞춘 질문을 2~3개만 한다", "질문의 답을 적어 볼 방법을 하나 제안한다"],
  },
};

export const STYLE_LIST: CounselStyle[] = STYLE_IDS.map((id) => COUNSEL_STYLES[id]);

export function isStyleId(x: unknown): x is CounselStyleId {
  return typeof x === "string" && (STYLE_IDS as readonly string[]).includes(x);
}

/** 사용자가 고른 설명 스타일 설정. 비중은 추천 정확도·성공 확률이 아니라 설명 관점의 상대적 비중이다 */
export interface StyleSetting {
  primary: CounselStyleId;
  secondary: CounselStyleId | null;
  /** 기본 스타일의 비중(%) — 혼합 시 50·60·70·80, 단독이면 100 */
  primaryWeight: number;
}

export const BLEND_WEIGHTS = [50, 60, 70, 80] as const;
export const STYLE_STORAGE_KEY = "hufs-atlas:counsel:style:v1";

/** 총 8문장 예산: 비중이 실제 문장 수로 반영된다 */
const BUDGET: Record<number, [number, number]> = { 50: [4, 4], 60: [5, 3], 70: [6, 2], 80: [7, 1], 100: [8, 0] };

export function sentenceBudget(s: StyleSetting): { primary: number; secondary: number; total: number } {
  const [primary, secondary] = BUDGET[s.secondary ? s.primaryWeight : 100] ?? BUDGET[100];
  return { primary, secondary, total: primary + secondary };
}

/** 3.0 캐릭터 성격을 처음 표시할 기본 스타일로 사상 (저장된 사용자 설정은 그대로 유지) */
export function defaultStyleFor(persona: PersonaId): StyleSetting {
  const primary: CounselStyleId = persona === "warm" ? "empathy" : persona === "realistic" ? "strategy" : "analysis";
  return { primary, secondary: null, primaryWeight: 100 };
}

/** localStorage·요청 본문 등 신뢰할 수 없는 입력을 허용된 값으로 정규화. 형식이 틀리면 null */
export function sanitizeStyleSetting(x: unknown): StyleSetting | null {
  const o = x as Partial<StyleSetting> | null;
  if (!o || typeof o !== "object" || !isStyleId(o.primary)) return null;
  const secondary = isStyleId(o.secondary) && o.secondary !== o.primary ? o.secondary : null;
  if (!secondary) return { primary: o.primary, secondary: null, primaryWeight: 100 };
  const w = BLEND_WEIGHTS.includes(o.primaryWeight as (typeof BLEND_WEIGHTS)[number]) ? (o.primaryWeight as number) : 60;
  return { primary: o.primary, secondary, primaryWeight: w };
}

export function styleLabel(s: StyleSetting): string {
  const p = COUNSEL_STYLES[s.primary].name;
  return s.secondary ? `${p} ${s.primaryWeight} · ${COUNSEL_STYLES[s.secondary].name} ${100 - s.primaryWeight}` : p;
}
