/**
 * AI 선배 페르소나.
 * 원칙: 페르소나는 '말투와 상담 진행 방식(프레임)'만 바꾼다.
 *   - 사실 답변(core)은 기존 상담 엔진(runChat)의 결과를 그대로 쓰며 페르소나와 무관하다.
 *   - 페르소나의 한마디는 기존 엔진의 3관점(warm/realistic/critical) 중 대응 관점을 사용한다
 *     (같은 근거, 같은 인용 검증).
 *   - 템플릿 문장에는 사실 주장·가짜 경험담(“내가 ○○에 붙었을 때…”)을 넣지 않는다.
 */
import type { SceneTheme } from "../world/world";
type PlaceId = SceneTheme;

export type PersonaId = "warm" | "realistic" | "analytical";
export type GreetingStyle = "casual" | "polite" | "playful";

export interface PersonaDef {
  id: PersonaId;
  name: string; // 캐릭터 이름 (가상)
  title: string; // 따뜻한 선배 등
  tagline: string;
  /** 기존 엔진 Perspectives 키 */
  perspective: "warm" | "realistic" | "critical";
  traits: string[];
}

export const PERSONAS: PersonaDef[] = [
  { id: "warm", name: "하루", title: "따뜻한 선배", tagline: "천천히 들어 주는 편안한 선배", perspective: "warm", traits: ["친근한 말투", "고민을 먼저 듣기", "부담 없는 질문"] },
  { id: "realistic", name: "도담", title: "현실적인 선배", tagline: "준비 과정과 조건을 짚어 주는 선배", perspective: "realistic", traits: ["준비 기간·조건", "근거 기록 중심", "구체적 행동 계획"] },
  { id: "analytical", name: "저울", title: "분석적인 선배", tagline: "선택지의 장단점과 전제를 따지는 선배", perspective: "critical", traits: ["선택지 비교", "추천의 전제·한계", "대안 분석"] },
];

export const GREETING_STYLES: { id: GreetingStyle; label: string }[] = [
  { id: "casual", label: "친근한 반말" },
  { id: "polite", label: "부드러운 존댓말" },
  { id: "playful", label: "장난스러운 인사" },
];

export function getPersona(id: string | null | undefined): PersonaDef {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

export function isPersonaId(x: unknown): x is PersonaId {
  return x === "warm" || x === "realistic" || x === "analytical";
}

export function isGreetingStyle(x: unknown): x is GreetingStyle {
  return x === "casual" || x === "polite" || x === "playful";
}

const PLACE_HOOK: Record<PlaceId, { casual: string; polite: string; playful: string }> = {
  plaza: { casual: "광장 바람 좋다.", polite: "광장 바람이 좋네요.", playful: "광장 벤치 명당은 내가 맡아 뒀지!" },
  library: { casual: "(작은 목소리로) 여기 도서관이니까 살살 얘기하자.", polite: "(작은 목소리로) 도서관이니 조용히 이야기해요.", playful: "(속삭임) 사서님 몰래 진로 토크 시작~" },
  cafe: { casual: "커피 한 잔 시켜 놨어.", polite: "커피 한 잔 하면서 이야기해요.", playful: "오늘의 메뉴는 '진로 고민 라떼', 샷 추가로!" },
  counsel: { casual: "여기 상담실은 조용해서 좋아.", polite: "상담실이라 차분하게 이야기할 수 있어요.", playful: "상담실 화이트보드는 오늘 우리 차지!" },
};

/** 캐릭터 설정 (가상 · 일관성 유지용). 실제 경험이 아니며 그렇게 말하지 않는다 */
export const CHARACTER_SHEET: Record<PersonaId, { likes: string; dream: string; style: string }> = {
  warm: { likes: "광장 벤치에서 햇볕 쬐기, 따뜻한 유자차", dream: "고민하는 후배가 자기만의 속도로 길을 찾는 걸 옆에서 지켜보는 것", style: "다정하고 부드러운 말투, 공감 먼저" },
  realistic: { likes: "할 일 목록 지우기, 카페 창가 자리", dream: "막막한 고민을 '이번 주에 할 일 3개'로 바꿔 주는 선배가 되는 것", style: "솔직하고 간결한 말투, 구체적 행동 제안" },
  analytical: { likes: "장단점 표 그리기, 도서관 구석 자리", dream: "어떤 선택이든 근거와 전제를 분명히 보고 고를 수 있게 돕는 것", style: "차분하고 논리적인 말투, 질문으로 생각 정리" },
};

/** 캐릭터 질문(CPU 템플릿): 가상 캐릭터임을 유지하며 친근하게 */
export function characterReply(persona: PersonaId, style: GreetingStyle): string {
  const c = CHARACTER_SHEET[persona];
  const p = style === "polite";
  return p
    ? `저는 실제 사람이 아니라 AI 선배라서, 진짜로 졸업하거나 취업한 경험은 없어요. 그래도 꿈을 하나 꼽자면 ${c.dream}이에요. 좋아하는 건 ${c.likes}! 요즘 가장 궁금한 건 뭐예요?`
    : `나는 실제 사람이 아니라 AI 선배라서, 진짜로 졸업하거나 취업한 경험은 없어. 그래도 꿈을 꼽자면 ${c.dream}이야. 좋아하는 건 ${c.likes}! 너는 요즘 뭐가 제일 궁금해?`;
}

export function smalltalkReply(persona: PersonaId, style: GreetingStyle): string {
  const p = style === "polite";
  if (persona === "warm") return p ? "안녕하세요! 와 줘서 반가워요. 오늘 하루는 어땠어요?" : "안녕! 와 줘서 반가워. 오늘 하루는 어땠어?";
  if (persona === "realistic") return p ? "안녕하세요! 반가워요. 오늘 정리하고 싶은 고민이 있으면 하나만 꺼내 봐요." : "안녕! 반가워. 오늘 정리하고 싶은 고민 있으면 하나만 꺼내 봐.";
  return p ? "안녕하세요. 반가워요. 오늘은 어떤 선택지를 함께 따져 볼까요?" : "안녕, 반가워. 오늘은 어떤 선택지를 같이 따져 볼까?";
}

const GREET: Record<PersonaId, Record<GreetingStyle, string>> = {
  warm: {
    casual: "안녕! 무슨 고민이 있어서 왔어? 진로 이야기여도 좋고, 그냥 막막한 마음을 정리해도 괜찮아.",
    polite: "안녕하세요! 어떤 고민이 있어서 오셨어요? 진로 이야기도 좋고, 막막한 마음을 정리해 보는 것도 괜찮아요.",
    playful: "어서 와~ 고민 상담소 영업 중! 진로든, 그냥 막막함이든 다 받아 줄게.",
  },
  realistic: {
    casual: "왔구나. 지금 제일 걸리는 게 뭐야? 같이 하나씩 정리해 보자.",
    polite: "반가워요. 지금 가장 걸리는 고민이 무엇인지부터 같이 정리해 볼까요?",
    playful: "오, 왔네! 고민 하나 꺼내 봐. 해야 할 일 목록으로 바꿔 줄게.",
  },
  analytical: {
    casual: "안녕. 고민되는 선택지가 있으면 말해 줘. 장단점이랑 전제를 같이 따져 보자.",
    polite: "안녕하세요. 고민 중인 선택지가 있다면 알려 주세요. 장단점과 전제를 함께 따져 볼게요.",
    playful: "안녕! 오늘의 저울에 올릴 고민은 뭐야? A냐 B냐, 일단 올려 봐.",
  },
};

export function greeting(persona: PersonaId, style: GreetingStyle, place: PlaceId): string {
  return `${PLACE_HOOK[place][style]} ${GREET[persona][style]}`;
}

const polite = (style: GreetingStyle) => style === "polite";

/** 근거 기반 답변 앞에 붙는 페르소나 도입 문장 (사실 주장 없음) */
export function careerIntro(persona: PersonaId, style: GreetingStyle, evidenceCount: number): string {
  const p = polite(style);
  if (evidenceCount === 0)
    return p ? "솔직하게 말씀드리면, 이 질문에 딱 맞는 선배 기록은 찾지 못했어요. 지어내지 않고 아는 만큼만 말할게요." : "솔직히 말하면, 이 질문에 딱 맞는 선배 기록은 못 찾았어. 지어내지 않고 아는 만큼만 말할게.";
  const n = `관련 선배 기록 ${evidenceCount}건`;
  switch (persona) {
    case "warm":
      return p ? `고민을 꺼내 줘서 고마워요. 저는 AI라 직접 겪은 경험은 없지만, ${n}을 찾아봤어요. 천천히 같이 봐요.` : `얘기해 줘서 고마워. 나는 AI라 직접 겪은 건 없지만, ${n}을 찾아봤어. 천천히 같이 보자.`;
    case "realistic":
      return p ? `${n}을 근거로 준비 조건과 기간 위주로 정리해 볼게요.` : `${n}을 근거로 준비 조건이랑 기간 위주로 정리해 볼게.`;
    case "analytical":
      return p ? `${n}을 근거로, 선택지와 그 전제를 나눠서 볼게요. 결론보다 판단 기준을 먼저 봐 주세요.` : `${n}을 근거로 선택지랑 전제를 나눠 볼게. 결론보다 판단 기준을 먼저 봐 줘.`;
  }
}

/** 답변 끝의 다음 행동 제안 문장 */
export function careerOutro(persona: PersonaId, style: GreetingStyle): string {
  const p = polite(style);
  switch (persona) {
    case "warm":
      return p ? "오늘은 여기서 하나만 골라 작게 시작해 봐도 충분해요." : "오늘은 여기서 하나만 골라서 작게 시작해 봐도 충분해.";
    case "realistic":
      return p ? "아래 버튼으로 로드맵에 바로 옮겨 두면 잊지 않아요." : "아래 버튼으로 로드맵에 바로 옮겨 두면 안 잊어버려.";
    case "analytical":
      return p ? "우선순위를 바꾸면 비교 결과도 달라져요. 진로 비교 화면에서 직접 확인해 보세요." : "우선순위를 바꾸면 비교 결과도 달라져. 진로 비교 화면에서 직접 돌려 봐.";
  }
}

/** 가벼운 대화(비진로) 응답 — 사실 주장 없이 공감 + 부담 없는 질문 */
export function lightReply(persona: PersonaId, style: GreetingStyle, kind: "chat" | "worry" | "thanks"): string {
  const p = polite(style);
  if (kind === "thanks") return p ? "이야기 나눠 줘서 고마워요. 언제든 다시 들러요. 실제 선배나 학교 상담 창구와도 꼭 이야기해 보세요." : "얘기해 줘서 고마워. 언제든 또 들러. 실제 선배나 학교 상담 창구랑도 꼭 이야기해 봐.";
  if (kind === "worry") {
    if (persona === "warm") return p ? "막막한 마음이 드는 건 자연스러운 일이에요. 지금 가장 마음에 걸리는 게 무엇인지 한 가지만 말해 줄래요?" : "막막한 건 당연해. 지금 제일 마음에 걸리는 거 하나만 말해 줄래?";
    if (persona === "realistic") return p ? "막막할 땐 범위를 좁히는 게 도움이 돼요. 기간(언제까지)이나 분야 중 하나만 먼저 정해 볼까요?" : "막막할 땐 범위를 좁히는 게 좋아. 기간이나 분야 중 하나만 먼저 정해 볼까?";
    return p ? "막막함을 조금 나눠 보면, 정보가 부족한 건지 선택이 어려운 건지에 따라 다음 단계가 달라져요. 어느 쪽에 가까워요?" : "막막함을 나눠 보면, 정보가 부족한 건지 선택이 어려운 건지에 따라 다음 단계가 달라. 어느 쪽에 가까워?";
  }
  if (persona === "warm") return p ? "좋아요, 가볍게 이야기해요. 요즘 학교생활은 어때요? 수업, 동아리, 아니면 그냥 피곤한 하루였는지도요." : "좋아, 가볍게 얘기하자. 요즘 학교생활은 어때? 수업, 동아리, 아니면 그냥 피곤한 하루였는지도.";
  if (persona === "realistic") return p ? "좋아요. 요즘 가장 시간을 많이 쓰는 일이 뭐예요? 거기서 진로 힌트가 나오기도 해요." : "좋아. 요즘 제일 시간 많이 쓰는 일이 뭐야? 거기서 진로 힌트가 나오기도 하거든.";
  return p ? "좋아요. 최근에 '이건 재밌었다' 싶었던 수업이나 활동이 있었나요? 거기서부터 실마리를 찾아봐요." : "좋아. 최근에 '이건 재밌었다' 싶었던 수업이나 활동 있었어? 거기서 실마리를 찾아보자.";
}

/** 관심 분야가 없을 때 한 번만 하는 추가 질문 */
export function clarifyReply(persona: PersonaId, style: GreetingStyle): string {
  const p = polite(style);
  if (persona === "analytical") return p ? "정해지지 않은 건 문제가 아니라 출발점이에요. 비교를 하려면 후보가 필요하니, 조금이라도 끌리는 분야를 골라 주세요. 없으면 '아직 모르겠어요'도 괜찮아요." : "안 정해진 건 문제가 아니라 출발점이야. 비교하려면 후보가 필요하니까 조금이라도 끌리는 분야를 골라 줘. 없으면 '아직 모르겠어요'도 괜찮아.";
  if (persona === "realistic") return p ? "괜찮아요. 범위를 좁히려면 관심 가는 분야를 하나만 골라 주세요. 그 분야 선배들의 준비 과정을 찾아볼게요." : "괜찮아. 범위를 좁히려면 관심 가는 분야 하나만 골라 줘. 그 분야 선배들 준비 과정을 찾아볼게.";
  return p ? "괜찮아요, 많은 사람이 그 자리에서 시작해요. 조금이라도 끌리는 분야가 있으면 하나만 골라 줄래요? 없으면 '아직 모르겠어요'를 눌러도 돼요." : "괜찮아, 다들 거기서 시작해. 조금이라도 끌리는 분야가 있으면 하나만 골라 줄래? 없으면 '아직 모르겠어요' 눌러도 돼.";
}

export const AI_DISCLOSURE = "AI 선배는 실제 사람이 아닌 AI 상담 도우미입니다. 선배 기록은 모두 가상 시연 데이터입니다.";
