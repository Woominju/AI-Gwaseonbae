import { describe, expect, it } from "vitest";
import {
  CLOTH_COLORS,
  DEFAULT_SENIOR_LOOKS,
  DEFAULT_STUDENT_LOOK,
  EXPRESSIONS,
  EYES,
  FACE_SHAPES,
  HAIR_COLORS,
  ITEMS,
  SENIOR_LOOKS_KEY,
  SKIN_TONES,
  SLOT_LABEL,
  WARDROBE_KEY,
  sanitizeLook3,
  type AvatarLook3,
  type Slot,
} from "@/lib/world/wardrobe";

const ids = (slot: Slot) => ITEMS.filter((i) => i.slot === slot).map((i) => i.id);

function isValid(l: AvatarLook3): boolean {
  const slotOk = (v: string | null, slot: Slot, optional: boolean) => (v === null ? optional : ids(slot).includes(v));
  return (
    FACE_SHAPES.some((f) => f.id === l.faceShape) &&
    EYES.some((e) => e.id === l.eyes) &&
    EXPRESSIONS.some((e) => e.id === l.expression) &&
    SKIN_TONES.includes(l.skin) &&
    HAIR_COLORS.includes(l.hairColor) &&
    CLOTH_COLORS.includes(l.topColor) &&
    CLOTH_COLORS.includes(l.bottomColor) &&
    slotOk(l.hair, "hair", false) &&
    slotOk(l.top, "top", false) &&
    slotOk(l.bottom, "bottom", false) &&
    slotOk(l.set, "set", true) &&
    slotOk(l.shoes, "shoes", false) &&
    slotOk(l.hat, "hat", true) &&
    slotOk(l.glasses, "glasses", true) &&
    slotOk(l.accessory, "accessory", true)
  );
}

describe("wardrobe 아이템 목록", () => {
  it("모든 아이템 id 는 고유하다", () => {
    const all = ITEMS.map((i) => i.id);
    expect(new Set(all).size).toBe(all.length);
  });
  it("슬롯별 최소 개수를 만족한다", () => {
    const min: Partial<Record<Slot, number>> = { hair: 6, top: 5, bottom: 4, set: 3, shoes: 3, hat: 3, glasses: 2, accessory: 3 };
    for (const [slot, n] of Object.entries(min) as [Slot, number][]) expect(ids(slot).length, slot).toBeGreaterThanOrEqual(n);
  });
  it("필수 아이템 종류가 포함된다", () => {
    for (const id of ["hair_ponytail", "hair_bun", "top_hoodie", "top_cardigan", "bottom_skirt", "set_suit", "set_labgown", "shoes_boots", "hat_bucket", "glasses_round", "glasses_square", "acc_scarf", "acc_backpack"])
      expect(ITEMS.some((i) => i.id === id), id).toBe(true);
  });
  it("모든 슬롯에 한국어 라벨이 있고 이름은 한국어다", () => {
    expect(SLOT_LABEL.set).toBe("원피스·세트");
    expect(Object.keys(SLOT_LABEL)).toHaveLength(9);
    for (const it of ITEMS) expect(it.name).toMatch(/[가-힣]/);
  });
  it("저장 키", () => {
    expect(WARDROBE_KEY).toBe("hufs-atlas:wardrobe:v1");
    expect(SENIOR_LOOKS_KEY).toBe("hufs-atlas:world:senior-looks:v1");
  });
});

describe("기본 외형", () => {
  it("학생·선배 3명의 기본값은 모두 유효하다", () => {
    expect(isValid(DEFAULT_STUDENT_LOOK)).toBe(true);
    for (const l of DEFAULT_SENIOR_LOOKS) expect(isValid(l)).toBe(true);
  });
  it("선배 3명은 서로 다르게 생겼다", () => {
    const sig = DEFAULT_SENIOR_LOOKS.map((l) => [l.hair, l.set ?? l.top, l.hat, l.glasses, l.accessory].join("|"));
    expect(new Set(sig).size).toBe(3);
  });
  it("기본값은 sanitize 해도 그대로다", () => {
    expect(sanitizeLook3(DEFAULT_STUDENT_LOOK, DEFAULT_SENIOR_LOOKS[0])).toEqual(DEFAULT_STUDENT_LOOK);
    for (const l of DEFAULT_SENIOR_LOOKS) expect(sanitizeLook3(l, DEFAULT_STUDENT_LOOK)).toEqual(l);
  });
});

describe("sanitizeLook3", () => {
  const fb = DEFAULT_STUDENT_LOOK;
  it("객체가 아니면 fallback", () => {
    for (const x of [null, undefined, 3, "x", [], [1, 2]]) expect(sanitizeLook3(x, fb)).toEqual(fb);
  });
  it("알 수 없는 id·색·열거값은 fallback 으로", () => {
    const out = sanitizeLook3(
      { hair: "hair_mohawk", top: "<script>", shoes: "shoes_rocket", skin: "#000000", hairColor: "red", topColor: "url(javascript:1)", bottomColor: 5, faceShape: "square", eyes: "laser", expression: "angry", set: "set_armor", hat: "hat_crown", glasses: "glasses_x", accessory: "acc_sword" },
      fb,
    );
    expect(out).toEqual(fb);
  });
  it("다른 슬롯의 id 는 거부한다", () => {
    const out = sanitizeLook3({ ...fb, hair: "top_tee", top: "bottom_jeans", bottom: "set_suit", set: "top_hoodie", shoes: "hat_cap", hat: "glasses_round", glasses: "acc_scarf", accessory: "hair_bob" }, fb);
    expect(out).toEqual(fb);
  });
  it("유효한 값은 받아들이고, 선택 슬롯의 null 은 '없음'으로 유지한다", () => {
    const fbWithHat: AvatarLook3 = { ...fb, hat: "hat_cap", accessory: "acc_scarf" };
    const out = sanitizeLook3({ ...fb, hair: "hair_curly", set: "set_padding", hat: null, accessory: null, glasses: "glasses_square", topColor: CLOTH_COLORS[3], skin: SKIN_TONES[5] }, fbWithHat);
    expect(out.hair).toBe("hair_curly");
    expect(out.set).toBe("set_padding");
    expect(out.hat).toBeNull();
    expect(out.accessory).toBeNull();
    expect(out.glasses).toBe("glasses_square");
    expect(out.topColor).toBe(CLOTH_COLORS[3]);
    expect(out.skin).toBe(SKIN_TONES[5]);
  });
  it("필드가 빠지면 fallback 값을 쓴다", () => {
    expect(sanitizeLook3({ hair: "hair_bob" }, fb)).toEqual({ ...fb, hair: "hair_bob" });
  });
  it("결과는 항상 유효하다", () => {
    expect(isValid(sanitizeLook3({ hair: 1, set: {}, hat: [] , skin: "#FDE4D0" }, fb))).toBe(true);
  });
});
