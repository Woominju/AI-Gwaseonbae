/**
 * AI 과선배 3.0 — "내 옷장" 캐릭터 데이터 (React 없음, 순수 TS).
 * 2.3등신 SD 아바타의 슬롯별 아이템 목록, 색 팔레트, 기본 외형, 입력 정규화.
 * 외형 설정은 브라우저 localStorage 에만 저장되고 상담 엔진에는 전달되지 않는다.
 * 그림은 src/components/world/Avatar3.tsx 가 담당한다 (docs/ART_DIRECTION_3_0.md §5).
 */

export type Slot = "hair" | "face" | "top" | "bottom" | "set" | "shoes" | "hat" | "glasses" | "accessory";
export type FaceShape = "round" | "soft" | "oval";
export type Eyes = "dot" | "sparkle" | "gentle" | "sleepy";
export type Expression = "smile" | "grin" | "calm" | "wink";

export interface AvatarLook3 {
  faceShape: FaceShape;
  eyes: Eyes;
  expression: Expression;
  skin: string;
  /** hair = 아이템 id (slot "hair") */
  hair: string;
  hairColor: string;
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  /** 세트·원피스: null 이 아니면 상의·하의를 대신한다 */
  set: string | null;
  shoes: string;
  hat: string | null;
  glasses: string | null;
  accessory: string | null;
}

export interface WardrobeItem {
  id: string;
  slot: Slot;
  /** 한국어 표시 이름 */
  name: string;
  tags?: string[];
  /** true 면 topColor(상의·세트) / bottomColor(하의) / hairColor(헤어) 로 색을 바꿀 수 있다 */
  colorable?: boolean;
}

export const ITEMS: WardrobeItem[] = [
  // 헤어 (hairColor 로 염색)
  { id: "hair_short", slot: "hair", name: "짧은 커트", tags: ["단정"], colorable: true },
  { id: "hair_sidepart", slot: "hair", name: "옆가르마", tags: ["단정"], colorable: true },
  { id: "hair_bob", slot: "hair", name: "단발 보브", tags: ["귀여움"], colorable: true },
  { id: "hair_long", slot: "hair", name: "긴 웨이브", tags: ["부드러움"], colorable: true },
  { id: "hair_ponytail", slot: "hair", name: "포니테일", tags: ["활발"], colorable: true },
  { id: "hair_bun", slot: "hair", name: "똥머리", tags: ["귀여움"], colorable: true },
  { id: "hair_curly", slot: "hair", name: "곱슬 펌", tags: ["발랄"], colorable: true },
  // 상의 (topColor)
  { id: "top_tee", slot: "top", name: "캠퍼스 반팔티", tags: ["캐주얼"], colorable: true },
  { id: "top_hoodie", slot: "top", name: "후드티", tags: ["캐주얼"], colorable: true },
  { id: "top_knit", slot: "top", name: "니트 스웨터", tags: ["포근"], colorable: true },
  { id: "top_jacket", slot: "top", name: "캐주얼 재킷", tags: ["캐주얼"], colorable: true },
  { id: "top_cardigan", slot: "top", name: "셔츠+가디건", tags: ["단정"], colorable: true },
  // 하의 (bottomColor)
  { id: "bottom_jeans", slot: "bottom", name: "청바지", tags: ["캐주얼"], colorable: true },
  { id: "bottom_slacks", slot: "bottom", name: "슬랙스", tags: ["단정"], colorable: true },
  { id: "bottom_skirt", slot: "bottom", name: "플리츠 스커트", tags: ["귀여움"], colorable: true },
  { id: "bottom_shorts", slot: "bottom", name: "반바지", tags: ["여름"], colorable: true },
  // 원피스·세트 (상의·하의 대신)
  { id: "set_suit", slot: "set", name: "정장", tags: ["면접", "단정"], colorable: true },
  { id: "set_labgown", slot: "set", name: "연구실 가운", tags: ["연구"] },
  { id: "set_padding", slot: "set", name: "겨울 패딩", tags: ["계절", "겨울"], colorable: true },
  { id: "set_sundress", slot: "set", name: "여름 원피스", tags: ["계절", "여름"], colorable: true },
  // 신발
  { id: "shoes_sneakers", slot: "shoes", name: "운동화" },
  { id: "shoes_hightop", slot: "shoes", name: "캔버스 하이탑" },
  { id: "shoes_loafers", slot: "shoes", name: "로퍼" },
  { id: "shoes_boots", slot: "shoes", name: "앵클부츠" },
  // 모자
  { id: "hat_beanie", slot: "hat", name: "비니" },
  { id: "hat_cap", slot: "hat", name: "야구모자" },
  { id: "hat_bucket", slot: "hat", name: "버킷햇" },
  { id: "hat_beret", slot: "hat", name: "베레모" },
  // 안경
  { id: "glasses_round", slot: "glasses", name: "동그란 안경" },
  { id: "glasses_square", slot: "glasses", name: "사각 안경" },
  { id: "glasses_oval", slot: "glasses", name: "얇은 금테" },
  // 액세서리
  { id: "acc_scarf", slot: "accessory", name: "목도리", tags: ["겨울"] },
  { id: "acc_backpack", slot: "accessory", name: "백팩" },
  { id: "acc_headphones", slot: "accessory", name: "헤드폰" },
  { id: "acc_crossbody", slot: "accessory", name: "크로스백" },
  { id: "acc_tote", slot: "accessory", name: "에코백" },
];

export const SLOT_LABEL: Record<Slot, string> = {
  hair: "헤어",
  face: "얼굴",
  top: "상의",
  bottom: "하의",
  set: "원피스·세트",
  shoes: "신발",
  hat: "모자",
  glasses: "안경",
  accessory: "액세서리",
};

/** 밝은 톤 → 어두운 톤 */
export const SKIN_TONES: string[] = ["#fde4d0", "#f8d5b8", "#efc29d", "#dca67c", "#bf8460", "#8f5b3e"];
export const HAIR_COLORS: string[] = ["#2f2622", "#4b3328", "#7b4a2d", "#b07a48", "#dcb36f", "#3c3a5c", "#8c5a76", "#6b6f7a"];
export const CLOTH_COLORS: string[] = [
  "#2f4f86", // 네이비
  "#5b82bf", // 데님 블루
  "#8ec5ea", // 하늘
  "#2aa39a", // 틸
  "#8fbf7f", // 세이지
  "#f0c45a", // 머스터드
  "#f08a74", // 코랄
  "#f4a8bf", // 핑크
  "#a08ad8", // 라일락
  "#f3ead9", // 크림
  "#c9ad85", // 베이지
  "#55596a", // 차콜
  "#9c4a5a", // 버건디
];

export const FACE_SHAPES: { id: FaceShape; name: string }[] = [
  { id: "round", name: "동글" },
  { id: "soft", name: "말랑" },
  { id: "oval", name: "갸름" },
];
export const EYES: { id: Eyes; name: string }[] = [
  { id: "dot", name: "콩눈" },
  { id: "sparkle", name: "반짝눈" },
  { id: "gentle", name: "순한 눈" },
  { id: "sleepy", name: "나른한 눈" },
];
export const EXPRESSIONS: { id: Expression; name: string }[] = [
  { id: "smile", name: "미소" },
  { id: "grin", name: "활짝" },
  { id: "calm", name: "차분" },
  { id: "wink", name: "윙크" },
];

export const DEFAULT_STUDENT_LOOK: AvatarLook3 = {
  faceShape: "round",
  eyes: "sparkle",
  expression: "smile",
  skin: SKIN_TONES[1],
  hair: "hair_ponytail",
  hairColor: HAIR_COLORS[1],
  top: "top_hoodie",
  topColor: "#f08a74",
  bottom: "bottom_jeans",
  bottomColor: "#5b82bf",
  set: null,
  shoes: "shoes_sneakers",
  hat: null,
  glasses: null,
  accessory: "acc_backpack",
};

/** [따뜻한 선배, 현실적인 선배, 분석적인 선배] */
export const DEFAULT_SENIOR_LOOKS: [AvatarLook3, AvatarLook3, AvatarLook3] = [
  {
    faceShape: "soft",
    eyes: "gentle",
    expression: "smile",
    skin: SKIN_TONES[0],
    hair: "hair_long",
    hairColor: HAIR_COLORS[2],
    top: "top_knit",
    topColor: "#f3ead9",
    bottom: "bottom_skirt",
    bottomColor: "#c9ad85",
    set: null,
    shoes: "shoes_loafers",
    hat: null,
    glasses: null,
    accessory: "acc_scarf",
  },
  {
    faceShape: "round",
    eyes: "dot",
    expression: "grin",
    skin: SKIN_TONES[2],
    hair: "hair_short",
    hairColor: HAIR_COLORS[0],
    top: "top_jacket",
    topColor: "#8fbf7f",
    bottom: "bottom_jeans",
    bottomColor: "#2f4f86",
    set: null,
    shoes: "shoes_hightop",
    hat: "hat_cap",
    glasses: null,
    accessory: "acc_crossbody",
  },
  {
    faceShape: "oval",
    eyes: "sparkle",
    expression: "calm",
    skin: SKIN_TONES[3],
    hair: "hair_sidepart",
    hairColor: HAIR_COLORS[5],
    top: "top_cardigan",
    topColor: "#a08ad8",
    bottom: "bottom_slacks",
    bottomColor: "#55596a",
    set: "set_labgown",
    shoes: "shoes_loafers",
    hat: null,
    glasses: "glasses_round",
    accessory: null,
  },
];

export const WARDROBE_KEY = "hufs-atlas:wardrobe:v1";
export const SENIOR_LOOKS_KEY = "hufs-atlas:world:senior-looks:v1";

const ITEM_BY_ID = new Map(ITEMS.map((it) => [it.id, it]));

export function getItem(id: string | null | undefined): WardrobeItem | undefined {
  return id ? ITEM_BY_ID.get(id) : undefined;
}

export function itemsOf(slot: Slot): WardrobeItem[] {
  return ITEMS.filter((it) => it.slot === slot);
}

const isSlotItem = (v: unknown, slot: Slot): v is string => typeof v === "string" && ITEM_BY_ID.get(v)?.slot === slot;
const pickItem = (v: unknown, slot: Slot, fb: string): string => (isSlotItem(v, slot) ? v : fb);
/** 선택 슬롯: 명시적 null 은 "없음", 그 밖의 잘못된 값은 fallback */
const pickOptional = (v: unknown, slot: Slot, fb: string | null): string | null => (v === null ? null : isSlotItem(v, slot) ? v : fb);
const pickColor = (v: unknown, allowed: readonly string[], fb: string): string => {
  if (typeof v !== "string") return fb;
  const lower = v.toLowerCase();
  return allowed.includes(lower) ? lower : fb;
};
const pickEnum = <T extends string>(v: unknown, list: readonly { id: T }[], fb: T): T => (list.some((o) => o.id === v) ? (v as T) : fb);

/** localStorage 등 신뢰할 수 없는 입력을 허용 목록(allow-list)으로만 정규화한다. */
export function sanitizeLook3(x: unknown, fallback: AvatarLook3): AvatarLook3 {
  const o = (x && typeof x === "object" && !Array.isArray(x) ? x : {}) as Record<string, unknown>;
  const fb = fallback;
  return {
    faceShape: pickEnum(o.faceShape, FACE_SHAPES, fb.faceShape),
    eyes: pickEnum(o.eyes, EYES, fb.eyes),
    expression: pickEnum(o.expression, EXPRESSIONS, fb.expression),
    skin: pickColor(o.skin, SKIN_TONES, fb.skin),
    hair: pickItem(o.hair, "hair", fb.hair),
    hairColor: pickColor(o.hairColor, HAIR_COLORS, fb.hairColor),
    top: pickItem(o.top, "top", fb.top),
    topColor: pickColor(o.topColor, CLOTH_COLORS, fb.topColor),
    bottom: pickItem(o.bottom, "bottom", fb.bottom),
    bottomColor: pickColor(o.bottomColor, CLOTH_COLORS, fb.bottomColor),
    set: pickOptional(o.set, "set", fb.set),
    shoes: pickItem(o.shoes, "shoes", fb.shoes),
    hat: pickOptional(o.hat, "hat", fb.hat),
    glasses: pickOptional(o.glasses, "glasses", fb.glasses),
    accessory: pickOptional(o.accessory, "accessory", fb.accessory),
  };
}
