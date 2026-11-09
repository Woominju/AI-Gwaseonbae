/**
 * 아바타 설정 (사전 제작 옵션 조합). 브라우저 localStorage 에만 저장한다.
 * 외형 설정은 상담 엔진에 전달되지 않는다 → 상담 품질·출처 신뢰도와 무관.
 */
import { isGreetingStyle, isPersonaId, type GreetingStyle, type PersonaId } from "./personas";

export const HAIR = ["short", "bob", "curly", "ponytail", "buzz", "bun"] as const;
export const ACCESSORY = ["none", "glasses", "beanie", "headphones", "scarf", "cap"] as const;
export const EXPRESSION = ["smile", "grin", "calm", "cheeky"] as const;
export const OUTFIT = ["#2a5591", "#14a3a3", "#e2725b", "#7c5cbf", "#e9b949", "#3f8f5a"] as const;
export const HAIR_COLOR = ["#2b2118", "#5a3a22", "#a0522d", "#1f2a44", "#7a7a7a"] as const;
export const SKIN = ["#f6d7b8", "#e8b98f", "#c68b5e", "#8d5a3b"] as const;

export type Hair = (typeof HAIR)[number];
export type Accessory = (typeof ACCESSORY)[number];
export type Expression = (typeof EXPRESSION)[number];

export const HAIR_LABEL: Record<Hair, string> = { short: "짧은 머리", bob: "단발", curly: "곱슬", ponytail: "포니테일", buzz: "까까머리", bun: "똥머리" };
export const ACCESSORY_LABEL: Record<Accessory, string> = { none: "없음", glasses: "안경", beanie: "비니", headphones: "헤드폰", scarf: "목도리", cap: "야구모자" };
export const EXPRESSION_LABEL: Record<Expression, string> = { smile: "미소", grin: "활짝", calm: "차분", cheeky: "능청" };

export interface AvatarLook {
  hair: Hair;
  hairColor: string;
  outfit: string;
  skin: string;
  accessory: Accessory;
  expression: Expression;
}

export interface SeniorConfig {
  slot: 0 | 1 | 2;
  persona: PersonaId;
  greeting: GreetingStyle;
  look: AvatarLook;
}

export const DEFAULT_SENIORS: SeniorConfig[] = [
  { slot: 0, persona: "warm", greeting: "casual", look: { hair: "bob", hairColor: HAIR_COLOR[1], outfit: OUTFIT[2], skin: SKIN[0], accessory: "scarf", expression: "smile" } },
  { slot: 1, persona: "realistic", greeting: "casual", look: { hair: "short", hairColor: HAIR_COLOR[0], outfit: OUTFIT[1], skin: SKIN[1], accessory: "cap", expression: "grin" } },
  { slot: 2, persona: "analytical", greeting: "polite", look: { hair: "curly", hairColor: HAIR_COLOR[3], outfit: OUTFIT[3], skin: SKIN[2], accessory: "glasses", expression: "calm" } },
];

export const DEFAULT_STUDENT: AvatarLook = { hair: "ponytail", hairColor: HAIR_COLOR[0], outfit: OUTFIT[0], skin: SKIN[1], accessory: "headphones", expression: "smile" };

const pick = <T extends string>(v: unknown, allowed: readonly T[], fb: T): T => (allowed.includes(v as T) ? (v as T) : fb);
const color = (v: unknown, allowed: readonly string[], fb: string) => (typeof v === "string" && allowed.includes(v) ? v : fb);

/** localStorage 등 신뢰할 수 없는 입력을 허용 옵션으로만 정규화 */
export function sanitizeLook(x: unknown, fb: AvatarLook): AvatarLook {
  const o = (x ?? {}) as Record<string, unknown>;
  return {
    hair: pick(o.hair, HAIR, fb.hair),
    hairColor: color(o.hairColor, HAIR_COLOR, fb.hairColor),
    outfit: color(o.outfit, OUTFIT, fb.outfit),
    skin: color(o.skin, SKIN, fb.skin),
    accessory: pick(o.accessory, ACCESSORY, fb.accessory),
    expression: pick(o.expression, EXPRESSION, fb.expression),
  };
}

export function sanitizeSeniors(x: unknown): SeniorConfig[] {
  const arr = Array.isArray(x) ? x : [];
  return DEFAULT_SENIORS.map((d, i) => {
    const o = (arr[i] ?? {}) as Record<string, unknown>;
    return { slot: d.slot, persona: isPersonaId(o.persona) ? o.persona : d.persona, greeting: isGreetingStyle(o.greeting) ? o.greeting : d.greeting, look: sanitizeLook(o.look, d.look) };
  });
}

export const LOUNGE_KEYS = {
  seniors: "hufs-atlas:lounge:seniors:v1",
  student: "hufs-atlas:lounge:student:v1",
  prefs: "hufs-atlas:lounge:prefs:v1", // 소리·움직임 감소 설정
  chat: "hufs-atlas:lounge:chat:v1", // sessionStorage (탭 종료 시 삭제)
  ret: "hufs-atlas:lounge:return:v1", // sessionStorage: 대시보드 이동 후 복귀 정보
  naming: "hufs-atlas:lounge:naming:v1",
} as const;

export type AvatarState = "idle" | "greeting" | "thinking" | "speaking" | "encouraging" | "walking";
