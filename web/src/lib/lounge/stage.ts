/**
 * Campus Lounge 대화 단계 판정 (규칙 기반 · 재현 가능).
 *   safety  : 위기·민감 신호 → 검색·생성 없이 공식 지원 채널 안내
 *   closing : 감사·종료 인사
 *   light   : 비진로 가벼운 대화·막연한 불안 → 공감 + 부담 없는 질문 (사실 주장 없음)
 *   clarify : 진로 신호는 있으나 분야가 전혀 없을 때 1회 추가 질문
 *   career  : 기존 상담 엔진(runChat) 호출
 */
import { analyzeQuestion } from "../chat/intent";
import type { StudentProfile } from "../types";

export type LoungeStage = "safety" | "closing" | "smalltalk" | "character" | "real_alumni" | "light" | "clarify" | "career";

const SAFETY = /죽고\s*싶|자살|자해|극단적\s*(선택|생각)|살기\s*싫|사라지고\s*싶|목숨|해치고\s*싶|학대|폭행|성폭력|성희롱|스토킹|괴롭힘을?\s*당|공황\s*(발작|이\s*와)|숨이\s*안\s*쉬/;
/** 수강편람·근거 권한 질문은 잡담으로 분류되면 안 된다 */
const CATALOG_Q = /수강편람|교과목|선수\s*과목|개설|이\s*(과목|수업)|학년도|(철회|비공개).{0,20}(Q&?A|질문|답변|검색)|보장되나/i;
const CLOSING = /^(고마워(요)?|감사(합니다|해요)|땡큐|잘\s*있어|안녕히|그만할게|이만\s*갈게|bye)[\s!.~]*$/i;
const LIGHT = /가볍게|그냥\s*(얘기|이야기|수다)|수다|심심|이야기하고\s*싶|얘기하고\s*싶/;
const WORRY = /막막|불안|걱정돼|걱정이|힘들어|지쳤|지쳐|우울|자신이?\s*없|겁나|무서/;
const GREETING = /^(안녕|하이|hello|hi|반가워|반갑습니다|좋은\s*(아침|하루))[\s!.~?요하세]*$/i;
const CHARACTER = /(선배|너|당신)(님)?(는|은|도|가)\s.*(뭐\s*하고\s*싶|꿈|좋아|싫어|취미|몇\s*살|이름|어디\s*살|누구|정체|진짜\s*사람|사람이에요|사람이야|AI야|AI예요)/i;
const REAL_ALUMNI = /실제\s*(선배|동문)|진짜\s*선배|현직\s*선배|(실제|진짜).*선배.*(대화|연결|질문|만나|경험)/;
const UNDECIDED = /(진로|꿈|하고\s*싶은\s*(것|게|일))[이가은는]?\s*(아직|잘)?\s*(안\s*정해|정해지지|없어|모르겠)|뭘\s*(해야|하고\s*싶은지)\s*모르/;

export interface StageResult {
  stage: LoungeStage;
  lightKind?: "chat" | "worry" | "thanks";
}

export function classifyTurn(text: string, profile: StudentProfile, opts: { clarified?: boolean } = {}): StageResult {
  const q = text.trim();
  if (SAFETY.test(q)) return { stage: "safety" };
  if (CATALOG_Q.test(q)) return { stage: "career" };
  if (CLOSING.test(q)) return { stage: "closing", lightKind: "thanks" };
  if (REAL_ALUMNI.test(q)) return { stage: "real_alumni" };
  if (GREETING.test(q)) return { stage: "smalltalk" };
  if (CHARACTER.test(q) && !/선배들/.test(q)) return { stage: "character" };
  const a = analyzeQuestion(q);
  const hasEntity = a.fields.length > 0 || a.skills.length > 0 || a.departments.length > 0;
  if (a.injection_suspected || a.official_topics.length) return { stage: "career" }; // 가드레일은 기존 엔진이 처리
  if (UNDECIDED.test(q) && !hasEntity) {
    if (!opts.clarified && !profile.interest_fields.length) return { stage: "clarify" };
    return { stage: "career" };
  }
  if (!hasEntity && (a.intent === "out_of_scope" || a.intent === "general")) {
    if (WORRY.test(q)) return { stage: "light", lightKind: "worry" };
    if (LIGHT.test(q) || a.intent === "out_of_scope") return { stage: "light", lightKind: "chat" };
  }
  return { stage: "career" };
}

/**
 * 위기 신호 응답. 상담 엔진·LLM을 거치지 않는 고정 문구.
 * 번호는 정부 안내로 2026-11-09 확인 (109: 보건복지부 통합번호, 1577-0199: 정신건강 위기상담, 1388: 만 9~24세). 운영 전 주기적으로 재확인.
 */
export const SAFETY_LINES = [
  "지금 이야기해 준 마음이 많이 무겁게 들려요. 저는 AI라서 이런 고민을 충분히 도와드릴 수 없어요. 혼자 견디지 말고 지금 바로 사람과 이야기해 주세요.",
  "자살예방상담전화 109 (24시간)",
  "정신건강 위기상담전화 1577-0199 (24시간)",
  "청소년 상담 1388 (만 9~24세, 24시간)",
  "긴급한 위험이 있다면 112 또는 119",
  "학교 학생상담 관련 부서(교내 상담센터)에서도 상담을 받을 수 있어요.",
];
