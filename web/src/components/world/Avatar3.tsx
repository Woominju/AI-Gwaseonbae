"use client";
/**
 * AI 과선배 3.0 — "내 옷장" SD 아바타 (독자 디자인 · 손으로 쓴 SVG).
 * 2.3등신: 큰 둥근 머리(어깨 폭의 약 1.6배) + 아래쪽에 모인 이목구비 + 두 갈래 하이라이트 눈 + 볼 홍조.
 * 외곽선은 검정이 아닌 '채움색의 어두운 톤'(1.6~2.2px), 광원은 왼쪽 위 (docs/ART_DIRECTION_3_0.md §2·§3·§5).
 *
 * 좌표: 발끝이 (0,0), 위로 음수. size=1 에서 전체 키 약 150.
 * 레이어(뒤→앞): 그림자 · 등 액세서리 · 뒷머리 · 다리(하의·신발) · 허리(하의) · 목 · 상의/세트 · 끈 · 팔 · 목도리 · 머리(얼굴·앞머리·헤드폰·모자·안경) · 손가방
 * 애니메이션 피벗(엉덩이·어깨·목)은 지역 좌표 (0,0) 에 두고 CSS(world-avatar.css, w3a-*)가 회전·이동시킨다.
 */
import * as React from "react";
import type { AvatarLook3 } from "@/lib/world/wardrobe";

export type Avatar3State = "idle" | "walking" | "greeting" | "thinking" | "speaking" | "encouraging";

type Node = React.ReactNode;

/* ───────────── 색 도구 ───────────── */
type HSL = [number, number, number];

function hexToHsl(hex: string): HSL {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue = 0;
  if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return [hue * 60, s, l];
}

function hslToHex([h, s, l]: HSL): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 밝은 면 (왼쪽 위 빛) */
export function lighten(c: string, amt = 0.3): string {
  const [h, s, l] = hexToHsl(c);
  return hslToHex([h, s, clamp01(l + (1 - l) * amt)]);
}
/** 그림자 면 */
export function shadeOf(c: string, amt = 0.14): string {
  const [h, s, l] = hexToHsl(c);
  return hslToHex([h, clamp01(s * 1.04), clamp01(l * (1 - amt))]);
}
/** 외곽선: 채움색을 어둡게 (순수 검정 금지) */
export function inkOf(c: string): string {
  const [h, s, l] = hexToHsl(c);
  // 무채색에 가까우면 따뜻한 톤을 살짝 넣어 탁해 보이지 않게
  const hue = s < 0.08 ? 25 : h;
  const sat = s < 0.08 ? 0.14 : clamp01(s * 0.7 + 0.05);
  // 어두운 색은 덜 어둡게 해서 검정처럼 보이지 않게 한다
  const lk = l > 0.38 ? l * 0.58 : l * 0.62 + 0.03;
  return hslToHex([hue, sat, clamp01(lk)]);
}
/** 피부 외곽선: 더 부드럽고 덜 진하게 (예: #f8d5b8 → 따뜻한 갈색) */
export function skinInkOf(c: string): string {
  const [h, s, l] = hexToHsl(c);
  return hslToHex([Math.max(8, h - 6), clamp01(s * 0.5 + 0.04), clamp01(l * 0.7)]);
}

/* ───────────── 렌더 컨텍스트 (그라데이션 등록) ───────────── */
interface Ctx {
  uid: string;
  grads: Map<string, string>;
  look: AvatarLook3;
  /** 얼굴이 향한 쪽으로 이목구비를 살짝 옮기는 양 (3/4 시점) */
  fx: number;
  state: Avatar3State;
}

/** 위에서 아래로 밝음→기본→그림자 그라데이션 */
function grad(ctx: Ctx, c: string): string {
  const key = `g${c.replace("#", "")}`;
  ctx.grads.set(key, c);
  return `url(#${ctx.uid}-${key})`;
}

const SW = 1.8;
const ROUND = { strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function paint(ctx: Ctx, c: string, w = SW) {
  return { fill: grad(ctx, c), stroke: c === ctx.look.skin ? skinInkOf(c) : inkOf(c), strokeWidth: w, ...ROUND };
}
function flat(c: string, w = SW) {
  return { fill: c, stroke: inkOf(c), strokeWidth: w, ...ROUND };
}
function line(c: string, w = 1.2, opacity = 1) {
  return { fill: "none", stroke: c, strokeWidth: w, opacity, ...ROUND };
}

/* 고정 색 */
const C = {
  white: "#fbf8f2",
  shirtBlue: "#dbe8f6",
  gown: "#fbfcfd",
  charcoal: "#4c5162",
  legging: "#454a5d",
  sock: "#fbf7ef",
  eye: "#3b2627",
  eyeLow: "#9a6650",
  mouth: "#b0485a",
  mouthIn: "#8f3a4a",
  tongue: "#f08a96",
  blush: "#ff8f9e",
  gold: "#c99a3c",
  teal: "#14a3a3",
  navy: "#12305a",
};

/** 곡선 혹(곱슬·러플)을 이어 그리는 도우미: 시계 방향 진행 시 바깥으로 볼록 */
function scallop(pts: [number, number][], bulge: number, start = true): string {
  let d = start ? `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}` : "";
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const cx = (x1 + x2) / 2 + (dy / len) * bulge;
    const cy = (y1 + y2) / 2 + (-dx / len) * bulge;
    d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}
function arcPts(cx: number, cy: number, rx: number, ry: number, fromDeg: number, toDeg: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(t), cy - ry * Math.sin(t)]);
  }
  return out;
}

/* ───────────── 기준 치수 ───────────── */
const HEAD_PIVOT = -84; // 목
const HIP_Y = -50;
const LEG_X = 6.5;
const SHOULDER = { x: 16, y: -77 };
const EYE_Y = -102.5;
const EYE_X = 12.5;

/* ───────────── 얼굴 ───────────── */
const FACE_PATH: Record<AvatarLook3["faceShape"], string> = {
  round: "M-32.5,-113 C-32.5,-134 -18,-141 0,-141 C18,-141 32.5,-134 32.5,-113 C32.5,-93 18,-83.5 0,-83.5 C-18,-83.5 -32.5,-93 -32.5,-113 Z",
  soft: "M-32,-114 C-32,-135 -18,-141 0,-141 C18,-141 32,-135 32,-114 C32,-101 28.5,-91.5 20,-87 C13.5,-84 7,-83.5 0,-83.5 C-7,-83.5 -13.5,-84 -20,-87 C-28.5,-91.5 -32,-101 -32,-114 Z",
  oval: "M-31,-115 C-31,-135 -17.5,-141 0,-141 C17.5,-141 31,-135 31,-115 C31,-99 18,-82.5 0,-82.5 C-18,-82.5 -31,-99 -31,-115 Z",
};

function Ears(ctx: Ctx): Node {
  const s = ctx.look.skin;
  return (
    <g>
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * 30.5},-104.5) scale(${sx},1)`}>
          <ellipse cx={0} cy={0} rx={4.6} ry={5.8} {...paint(ctx, s)} />
          <path d="M-0.5,-2.5 Q2,-1 0.6,2.4" {...line(shadeOf(s, 0.18), 1.3, 0.8)} />
        </g>
      ))}
    </g>
  );
}

function Face(ctx: Ctx): Node {
  const s = ctx.look.skin;
  return (
    <g>
      <path d={FACE_PATH[ctx.look.faceShape]} {...paint(ctx, s, 1.9)} />
      {/* 오른쪽 아래 그림자면 + 왼쪽 위 볼 광택 */}
      <path d="M22,-104 C24,-96 18,-88 8,-86 C17,-90 22,-97 22,-104 Z" fill={shadeOf(s, 0.1)} opacity={0.55} />
      <ellipse cx={-17} cy={-117} rx={7} ry={4} fill="#fff" opacity={0.18} />
    </g>
  );
}

function Blush(ctx: Ctx): Node {
  const id = `${ctx.uid}-blush`;
  return (
    <g>
      {[-1, 1].map((sx) => {
        const x = sx * 19 + ctx.fx;
        return (
          <g key={sx}>
            <ellipse cx={x} cy={-94.5} rx={6.2} ry={3.8} fill={`url(#${id})`} />
            <path d={`M${x - 2.6},-93.6 l1.3,-1.8 M${x},-93.6 l1.3,-1.8 M${x + 2.6},-93.6 l1.3,-1.8`} {...line(C.blush, 0.8, 0.55)} />
          </g>
        );
      })}
    </g>
  );
}

function Eye(ctx: Ctx, cx: number, wink: boolean, side: -1 | 1): Node {
  const kind = ctx.look.eyes;
  const irisId = `url(#${ctx.uid}-iris)`;
  if (wink) {
    return (
      <g>
        <path d={`M${cx - 5.4},${EYE_Y + 1} Q${cx},${EYE_Y - 5.5} ${cx + 5.4},${EYE_Y + 1}`} {...line(C.eye, 2.2)} />
        <path d={`M${cx + side * 5.2},${EYE_Y + 0.5} l${side * 1.8},-1.6`} {...line(C.eye, 1.4)} />
      </g>
    );
  }
  const hl = (r1: number, r2: number, rx: number, ry: number) => (
    <>
      <circle cx={cx - rx * 0.32} cy={EYE_Y - ry * 0.34} r={r1} fill="#fff" />
      <circle cx={cx + rx * 0.36} cy={EYE_Y + ry * 0.36} r={r2} fill="#fff" opacity={0.92} />
    </>
  );
  switch (kind) {
    case "dot":
      return (
        <g>
          <ellipse cx={cx} cy={EYE_Y} rx={4.5} ry={5.6} fill={irisId} />
          {hl(1.7, 0.9, 4.5, 5.6)}
        </g>
      );
    case "sparkle":
      return (
        <g>
          <ellipse cx={cx} cy={EYE_Y + 0.3} rx={5.6} ry={7} fill={irisId} />
          <path d={`M${cx - 6.4},${EYE_Y - 3.6} Q${cx},${EYE_Y - 9.6} ${cx + 6.4},${EYE_Y - 3.6}`} {...line(C.eye, 2)} />
          <path d={`M${cx + side * 6},${EYE_Y - 4} l${side * 1.9},-1.5`} {...line(C.eye, 1.5)} />
          <ellipse cx={cx} cy={EYE_Y + 4} rx={3.4} ry={1.6} fill="#fff" opacity={0.22} />
          {hl(2.3, 1.15, 5.6, 7)}
          <path d={`M${cx + 2.4},${EYE_Y - 4.6} l0.5,1.1 l1.1,0.5 l-1.1,0.5 l-0.5,1.1 l-0.5,-1.1 l-1.1,-0.5 l1.1,-0.5 Z`} fill="#fff" opacity={0.9} />
        </g>
      );
    case "gentle":
      return (
        <g>
          <ellipse cx={cx} cy={EYE_Y + 0.6} rx={5} ry={6.2} fill={irisId} />
          <path d={`M${cx - 6},${EYE_Y - 2.2} Q${cx},${EYE_Y - 7} ${cx + 6},${EYE_Y - 2.2}`} {...line(C.eye, 2.3)} />
          <path d={`M${cx + side * 5.8},${EYE_Y - 2.4} q${side * 1.6},0.2 ${side * 2.2},1.6`} {...line(C.eye, 1.4)} />
          {hl(1.9, 1, 5, 6.2)}
        </g>
      );
    case "sleepy":
      return (
        <g>
          <path d={`M${cx - 5.6},${EYE_Y - 0.6} Q${cx},${EYE_Y - 2.4} ${cx + 5.6},${EYE_Y - 0.6} Q${cx + 5.2},${EYE_Y + 5.6} ${cx},${EYE_Y + 5.8} Q${cx - 5.2},${EYE_Y + 5.6} ${cx - 5.6},${EYE_Y - 0.6} Z`} fill={irisId} />
          <path d={`M${cx - 6.2},${EYE_Y - 0.8} Q${cx},${EYE_Y - 3.2} ${cx + 6.2},${EYE_Y - 0.8}`} {...line(C.eye, 2.2)} />
          <circle cx={cx - 1.8} cy={EYE_Y + 1.4} r={1.5} fill="#fff" />
          <circle cx={cx + 2} cy={EYE_Y + 3.6} r={0.8} fill="#fff" opacity={0.9} />
        </g>
      );
  }
}

function Eyes(ctx: Ctx): Node {
  const wink = ctx.look.expression === "wink";
  const L = -EYE_X + ctx.fx;
  const R = EYE_X + ctx.fx;
  const browC = shadeOf(ctx.look.hairColor, 0.1);
  const browY = ctx.look.eyes === "sparkle" ? -114.5 : -113.5;
  return (
    <g>
      <g transform={`translate(0,${EYE_Y})`}>
        <g className="w3a-p w3a-blink">
          <g transform={`translate(0,${-EYE_Y})`}>
            {Eye(ctx, L, false, -1)}
            {Eye(ctx, R, wink, 1)}
          </g>
        </g>
      </g>
      <path d={`M${L - 4.5},${browY + 1} Q${L},${browY - 2} ${L + 4.5},${browY + 0.4}`} {...line(browC, 1.8, 0.8)} />
      <path d={`M${R - 4.5},${browY + 0.4} Q${R},${browY - 2} ${R + 4.5},${browY + 1}`} {...line(browC, 1.8, 0.8)} />
    </g>
  );
}

function Mouth(ctx: Ctx): Node {
  const x = ctx.fx;
  const y = -91.5;
  const ex = ctx.look.expression;
  let m: Node;
  if (ex === "grin") {
    m = (
      <g>
        <path d={`M${x - 5.6},${y - 1.2} Q${x},${y - 0.2} ${x + 5.6},${y - 1.2} Q${x + 5},${y + 6.6} ${x},${y + 6.8} Q${x - 5},${y + 6.6} ${x - 5.6},${y - 1.2} Z`} fill={C.mouthIn} stroke={C.mouth} strokeWidth={1.3} strokeLinejoin="round" />
        <path d={`M${x - 3},${y + 5.4} Q${x},${y + 2.2} ${x + 3},${y + 5.4} Q${x},${y + 6.9} ${x - 3},${y + 5.4} Z`} fill={C.tongue} />
        <path d={`M${x - 4.4},${y - 0.6} Q${x},${y + 0.6} ${x + 4.4},${y - 0.6}`} {...line("#fff", 1.1, 0.85)} />
      </g>
    );
  } else if (ex === "calm") {
    m = <path d={`M${x - 3.2},${y + 0.6} Q${x},${y + 2.6} ${x + 3.2},${y + 0.6}`} {...line(C.mouth, 1.6)} />;
  } else if (ex === "wink") {
    m = (
      <g>
        <path d={`M${x - 4.2},${y} Q${x - 0.5},${y + 5.2} ${x + 4.6},${y - 1}`} {...line(C.mouth, 1.7)} />
        <path d={`M${x + 0.6},${y + 2.4} q1.2,2.6 2.6,0.4`} fill={C.tongue} stroke={C.mouth} strokeWidth={0.9} />
      </g>
    );
  } else {
    m = <path d={`M${x - 4.4},${y - 0.6} Q${x},${y + 4.6} ${x + 4.4},${y - 0.6} Q${x},${y + 1.4} ${x - 4.4},${y - 0.6} Z`} fill={C.mouthIn} stroke={C.mouth} strokeWidth={1.4} strokeLinejoin="round" />;
  }
  if (ctx.state !== "speaking") return m;
  return (
    <g>
      <g className="w3a-mouth-a">{m}</g>
      <g className="w3a-mouth-b">
        <path d={`M${x - 3.4},${y - 0.6} Q${x},${y - 1.6} ${x + 3.4},${y - 0.6} Q${x + 3.2},${y + 4.6} ${x},${y + 4.8} Q${x - 3.2},${y + 4.6} ${x - 3.4},${y - 0.6} Z`} fill={C.mouthIn} stroke={C.mouth} strokeWidth={1.3} strokeLinejoin="round" />
        <ellipse cx={x} cy={y + 3.4} rx={1.9} ry={1} fill={C.tongue} />
      </g>
    </g>
  );
}

function Nose(ctx: Ctx): Node {
  return <path d={`M${ctx.fx + 0.2},-97.6 q1.3,0.8 0,1.6`} {...line(shadeOf(ctx.look.skin, 0.28), 1.2, 0.7)} />;
}

/* ───────────── 헤어 ───────────── */

function hairPaint(ctx: Ctx, w = 1.9) {
  return { ...paint(ctx, ctx.look.hairColor, w) };
}
function hairShine(ctx: Ctx, d: string, w = 2.8): Node {
  return <path d={d} {...line(lighten(ctx.look.hairColor, 0.42), w, 0.6)} />;
}
function strand(ctx: Ctx, d: string): Node {
  return <path d={d} {...line(inkOf(ctx.look.hairColor), 1.1, 0.4)} />;
}

const CRANIUM = "M-35.5,-106 C-37.5,-135 -21,-151.5 0,-151.5 C21,-151.5 37.5,-135 35.5,-106 C34.5,-100 31.5,-96.5 28,-95.5 L-28,-95.5 C-31.5,-96.5 -34.5,-100 -35.5,-106 Z";

function HairBack(ctx: Ctx): Node {
  const hp = hairPaint(ctx);
  const hat = !!ctx.look.hat;
  switch (ctx.look.hair) {
    case "hair_bob":
      return (
        <g>
          <path d="M-39.5,-102 C-42.5,-133 -28,-153 0,-153 C28,-153 42.5,-133 39.5,-102 C39.5,-93 37,-87.5 31,-86 C27,-85 22,-86.5 20,-88.5 L-20,-88.5 C-22,-86.5 -27,-85 -31,-86 C-37,-87.5 -39.5,-93 -39.5,-102 Z" {...hp} />
          <path d="M-36,-94 C-34,-89.5 -30,-88 -25,-89" {...line(inkOf(ctx.look.hairColor), 1.1, 0.45)} />
          <path d="M36,-94 C34,-89.5 30,-88 25,-89" {...line(inkOf(ctx.look.hairColor), 1.1, 0.45)} />
        </g>
      );
    case "hair_long": {
      const ends = scallop([[38, -76], [33, -63], [24, -60], [14, -62]], 2.6, false);
      const endsL = scallop([[-14, -62], [-24, -60], [-33, -63], [-38, -76]], 2.6, false);
      return (
        <g>
          <path d={`M-38,-112 C-42,-140 -26,-153 0,-153 C26,-153 42,-140 38,-112 C40,-100 42.5,-90 40.5,-80 L38,-76 ${ends} L-14,-62 ${endsL} L-40.5,-80 C-42.5,-90 -40,-100 -38,-112 Z`} {...hp} />
          {strand(ctx, "M34,-100 C37,-90 37,-80 33,-68")}
          {strand(ctx, "M-34,-100 C-37,-90 -37,-80 -33,-68")}
        </g>
      );
    }
    case "hair_ponytail":
      return (
        <g>
          <path d={CRANIUM} {...hp} />
          <path d="M-22,-143 C-36,-149 -52,-138 -52,-118 C-52,-106 -47,-99 -50,-86 C-51.5,-80 -47,-79 -44.5,-84 C-41,-91 -39,-99 -39.5,-108 C-40,-118 -37,-126 -29,-131 Z" {...hp} />
          {strand(ctx, "M-46,-128 C-48,-116 -45,-104 -46,-90")}
          {hairShine(ctx, "M-45,-136 C-48,-130 -49,-124 -48.5,-119", 2.2)}
          <g transform="rotate(-28 -28 -136)">
            <rect x={-33} y={-139.5} width={10} height={7} rx={3.2} {...flat("#f06f86", 1.5)} />
            <circle cx={-30.5} cy={-137.5} r={1.1} fill="#fff" opacity={0.6} />
          </g>
        </g>
      );
    case "hair_bun":
      return (
        <g>
          <path d={CRANIUM} {...hp} />
          {!hat && (
            <g>
              <circle cx={5} cy={-154} r={12} {...hp} />
              <path d="M-3,-158 C0,-164 9,-166 13,-160" {...line(inkOf(ctx.look.hairColor), 1.1, 0.4)} />
              <path d="M-1,-152 C2,-147 10,-147 13,-151" {...line(inkOf(ctx.look.hairColor), 1.1, 0.4)} />
              {hairShine(ctx, "M-2.5,-158 C-0.5,-162 3,-164 6,-164.5", 2.4)}
            </g>
          )}
        </g>
      );
    case "hair_curly": {
      const pts = arcPts(0, -117, 41, 36, 208, -28, 13);
      return <path d={`${scallop(pts, 4.5)} L22,-94 L-22,-94 Z`} {...hp} />;
    }
    default:
      return <path d={CRANIUM} {...hp} />;
  }
}

function HairFront(ctx: Ctx): Node {
  const hp = hairPaint(ctx);
  switch (ctx.look.hair) {
    case "hair_short":
      return (
        <g>
          <path d="M-35.5,-107 C-37.5,-134 -23,-150.5 0,-150.5 C23,-150.5 37.5,-134 35.5,-107 C34,-111 33,-115 30.5,-119 C29,-115.5 27,-113.5 25,-112.5 C25,-117 23,-121.5 19.5,-124.5 C16.5,-119.5 11.5,-117 6.5,-116.5 C8,-119.5 8,-123 6.5,-126 C1.5,-120.5 -5,-118 -12,-117.5 C-10,-120 -9.5,-122.5 -10,-125.5 C-15,-120.5 -21,-118 -27,-117.5 C-29.5,-114 -31,-110 -31.5,-105 C-33.5,-105 -35,-105.5 -35.5,-107 Z" {...hp} />
          {strand(ctx, "M2,-142 C0,-134 -4,-127 -10,-122")}
          {strand(ctx, "M16,-141 C18,-134 18,-128 19,-124")}
          {hairShine(ctx, "M-22,-139 C-14,-145.5 -4,-147 4,-146")}
          {hairShine(ctx, "M11,-145 C14,-144.5 16.5,-143 18.5,-141.5", 2.2)}
        </g>
      );
    case "hair_sidepart":
      return (
        <g>
          <path d="M-35.5,-104 C-37.5,-134 -23,-150.5 0,-150.5 C23,-150.5 37.5,-134 35.5,-106 C34.5,-111 33.5,-115 31,-119.5 C27.5,-121.5 23,-125.5 19.5,-132 C18,-129 16.5,-127.5 14.5,-126.5 C8,-121.5 -2,-118.5 -13,-118.8 C-20,-119 -26,-116.5 -29.5,-112 C-31.5,-109 -32.5,-105.5 -32.5,-101.5 C-34,-101.5 -35.2,-102.5 -35.5,-104 Z" {...hp} />
          {strand(ctx, "M14,-140 C10,-132 2,-125 -10,-121.5")}
          {strand(ctx, "M-6,-143 C-12,-136 -20,-128 -27,-118")}
          {strand(ctx, "M20,-140 C22,-134 25,-128 30,-122")}
          {hairShine(ctx, "M-24,-138 C-16,-145 -6,-147 2,-146.5")}
          {hairShine(ctx, "M-18,-127 C-12,-124 -4,-123 2,-124", 2)}
        </g>
      );
    case "hair_bob":
      return (
        <g>
          <path d="M-37.5,-92 C-40,-121 -32,-151 0,-151 C32,-151 40,-121 37.5,-92 C35.5,-89.5 32,-89.5 29.8,-91.5 C30.4,-100 30,-110 28,-118 C22.5,-116.5 16.5,-118.5 11,-117.5 C5.5,-116.5 0,-118.5 -5.5,-117.5 C-11,-116.5 -16.5,-118.5 -22,-117.5 C-24.5,-117 -26.5,-118 -28,-118 C-30,-110 -30.4,-100 -29.8,-91.5 C-32,-89.5 -35.5,-89.5 -37.5,-92 Z" {...hp} />
          {strand(ctx, "M-18,-143 C-20,-134 -20,-126 -17,-118.5")}
          {strand(ctx, "M4,-145 C3,-135 3,-126 3,-118")}
          {strand(ctx, "M33.5,-115 C35,-106 35,-98 34,-92")}
          {strand(ctx, "M-33.5,-115 C-35,-106 -35,-98 -34,-92")}
          {hairShine(ctx, "M-25,-137 C-17,-145 -6,-147.5 4,-147")}
          {hairShine(ctx, "M-35,-112 C-35.5,-106 -35.5,-100 -35,-96", 2)}
        </g>
      );
    case "hair_long":
      return (
        <g>
          <path d="M-36,-100 C-38.5,-131 -25,-151 0,-151 C25,-151 38.5,-131 36,-100 C37.5,-92 38.5,-84 36.5,-76 C35,-71.5 31,-71 29.5,-74 C31.5,-80 31.5,-88 29.5,-96 C28.5,-105 26,-112.5 21,-117.5 C15,-121 9,-124.5 3,-131.5 L0,-133.5 L-3,-131.5 C-9,-124.5 -15,-121 -21,-117.5 C-26,-112.5 -28.5,-105 -29.5,-96 C-31.5,-88 -31.5,-80 -29.5,-74 C-31,-71 -35,-71.5 -36.5,-76 C-38.5,-84 -37.5,-92 -36,-100 Z" {...hp} />
          {strand(ctx, "M-2,-140 C-8,-130 -18,-123 -26,-112")}
          {strand(ctx, "M2,-140 C8,-130 18,-123 26,-112")}
          {strand(ctx, "M-33,-100 C-35,-92 -34,-84 -33,-77")}
          {strand(ctx, "M33,-100 C35,-92 34,-84 33,-77")}
          {hairShine(ctx, "M-24,-138 C-16,-145 -7,-147 -1,-146.5")}
          {hairShine(ctx, "M-34,-104 C-35.5,-96 -35,-88 -34,-83", 2)}
        </g>
      );
    case "hair_ponytail":
      return (
        <g>
          <path d="M-35.5,-106 C-37.5,-134 -23,-150.5 0,-150.5 C23,-150.5 37.5,-134 35.5,-106 C34.5,-110 32.5,-114 29.5,-117.5 C29.5,-121.5 28,-124.5 25.5,-127 C20,-121 12,-118.5 4,-118.5 C-4,-118.5 -11,-121 -15,-125 C-17,-120 -22,-117 -27.5,-116 C-30,-112 -31.5,-108 -31.8,-101 C-33.8,-101.5 -35.2,-103.5 -35.5,-106 Z" {...hp} />
          <path d="M30.5,-116 C32.5,-110 33,-104 32,-98" {...line(lighten(ctx.look.hairColor, 0.1), 2.6)} />
          {strand(ctx, "M8,-142 C8,-134 6,-126 3,-120")}
          {strand(ctx, "M-6,-142 C-9,-135 -12,-130 -15,-126")}
          {strand(ctx, "M20,-140 C22,-134 24,-130 25,-127")}
          {hairShine(ctx, "M-22,-139 C-14,-145.5 -4,-147 4,-146")}
        </g>
      );
    case "hair_bun":
      return (
        <g>
          <path d="M-35.5,-106 C-37.5,-134 -23,-150.5 0,-150.5 C23,-150.5 37.5,-134 35.5,-106 C34.5,-111 32,-116 28,-119.5 C22,-120 15,-122.5 10.5,-127 C8,-122 2,-119.5 -5,-119 C-12,-118.5 -19,-118.5 -24.5,-117 C-28.5,-114.5 -31,-110 -32,-104 C-34,-103.5 -35.2,-104.5 -35.5,-106 Z" {...hp} />
          <path d="M-31.5,-106 C-33,-99 -31,-93 -28.5,-90" {...line(ctx.look.hairColor, 2)} />
          <path d="M31.5,-108 C33,-101 31.5,-95 29,-91.5" {...line(ctx.look.hairColor, 2)} />
          <path d="M-31.5,-106 C-33,-99 -31,-93 -28.5,-90" {...line(inkOf(ctx.look.hairColor), 0.7, 0.6)} />
          {strand(ctx, "M10,-143 C11,-136 11,-131 10.5,-127")}
          {strand(ctx, "M-8,-143 C-12,-135 -16,-127 -21,-119")}
          {hairShine(ctx, "M-22,-139 C-14,-145.5 -4,-147 4,-146")}
        </g>
      );
    case "hair_curly": {
      const crown = arcPts(0, -117, 38, 34, 196, -16, 10);
      const bangs: [number, number][] = [[32, -113], [24, -119], [15, -117.5], [6, -120], [-3, -118], [-12, -120], [-21, -118], [-29, -114.5], [-35, -106]];
      return (
        <g>
          <path d={`${scallop(crown, 3.6)} ${scallop([crown[crown.length - 1], ...bangs], 3, false)} Z`} {...hp} />
          {strand(ctx, "M-14,-132 q3,-3 6,0")}
          {strand(ctx, "M6,-136 q3,-3 6,0")}
          {strand(ctx, "M18,-128 q3,-3 6,0")}
          {strand(ctx, "M-26,-124 q3,-3 6,0")}
          {hairShine(ctx, "M-24,-138 C-17,-144 -9,-146.5 -2,-147", 2.6)}
          {hairShine(ctx, "M6,-146.5 C9,-146.5 12,-145.5 14,-144.5", 2)}
        </g>
      );
    }
    default:
      return null;
  }
}

/* ───────────── 모자 · 헤드폰 · 안경 ───────────── */
function Hat(ctx: Ctx): Node {
  switch (ctx.look.hat) {
    case "hat_beanie": {
      const c = "#f0b84f";
      const band = "#e9a23f";
      return (
        <g>
          <path d="M-37.5,-121 C-39,-147 -22,-161 0,-161 C22,-161 39,-147 37.5,-121 Z" {...paint(ctx, c)} />
          {[-24, -12, 0, 12, 24].map((x) => (
            <path key={x} d={`M${x * 0.92},-157 C${x * 1.05},-146 ${x * 1.1},-136 ${x * 1.08},-128`} {...line(inkOf(c), 1, 0.3)} />
          ))}
          <path d="M-39.5,-128.5 C-26,-132.5 26,-132.5 39.5,-128.5 L40,-118.5 C26,-122 -26,-122 -40,-118.5 Z" {...paint(ctx, band)} />
          {[-34, -27, -20, -13, -6.5, 0, 6.5, 13, 20, 27, 34].map((x) => (
            <path key={x} d={`M${x},${-130.5 + Math.abs(x) * 0.03} L${x * 1.01},${-121.5 + Math.abs(x) * 0.07}`} {...line(inkOf(band), 1, 0.35)} />
          ))}
          <circle cx={2} cy={-162} r={7.5} {...paint(ctx, C.white, 1.7)} />
          <path d="M-1.5,-166 q2,-1.6 4.6,-0.6" {...line("#fff", 1.4, 0.9)} />
          <path d="M-22,-147 C-15,-153 -6,-156 2,-156" {...line("#fff", 2.6, 0.35)} />
        </g>
      );
    }
    case "hat_cap": {
      const c = "#f07e6a";
      return (
        <g>
          <path d="M-35.8,-123 C-37,-148 -20,-158 1,-158 C22,-158 37.5,-148 36.2,-123 Z" {...paint(ctx, c)} />
          <path d="M1,-158 C-2,-148 -3,-136 -3.5,-124" {...line(inkOf(c), 1.1, 0.45)} />
          <path d="M1,-158 C10,-150 15,-138 16,-124.5" {...line(inkOf(c), 1.1, 0.4)} />
          <path d="M-20,-155 C-12,-157 -5,-157.5 0,-157" {...line("#fff", 2.4, 0.3)} />
          <circle cx={4} cy={-142} r={4.6} fill={C.white} opacity={0.92} />
          <path d="M2.2,-142 l1.3,1.4 l2.6,-2.8" {...line(inkOf(c), 1.2)} />
          <ellipse cx={1} cy={-158} rx={3.4} ry={1.8} {...flat(shadeOf(c, 0.1), 1.3)} />
          <path d="M-31,-123.5 C-14,-129 18,-130 36,-124.5 C44,-122.5 47,-117.5 43,-115.5 C29,-119.5 -4,-121 -25,-118 C-30,-117.5 -32.5,-120.5 -31,-123.5 Z" {...paint(ctx, shadeOf(c, 0.08))} />
          <path d="M-26,-120.5 C-4,-123.5 26,-123 41,-118" {...line(inkOf(c), 0.9, 0.45)} strokeDasharray="1.8 1.6" />
        </g>
      );
    }
    case "hat_bucket": {
      const c = "#e9dcc2";
      const band = "#8fbf7f";
      return (
        <g>
          <path d="M-31.5,-125 C-33,-149 -18,-157.5 0,-157.5 C18,-157.5 33,-149 31.5,-125 Z" {...paint(ctx, c)} />
          <path d="M-32,-131.5 C-12,-135 12,-135 32,-131.5 L32,-125.5 C12,-128.5 -12,-128.5 -32,-125.5 Z" {...flat(band, 1.4)} />
          <path d="M-34.5,-128 C-12,-132 12,-132 34.5,-128 C41,-125 45.5,-120 47,-115.5 C30,-111.5 -30,-111.5 -47,-115.5 C-45.5,-120 -41,-125 -34.5,-128 Z" {...paint(ctx, shadeOf(c, 0.04))} />
          <path d="M-42,-117 C-25,-114 25,-114 42,-117" {...line(inkOf(c), 0.9, 0.5)} strokeDasharray="2 1.6" />
          <path d="M-20,-152 C-12,-155.5 -5,-156.5 2,-156" {...line("#fff", 2.4, 0.45)} />
          <circle cx={-18} cy={-140} r={1.6} fill="#f4a8bf" />
          <circle cx={-14.5} cy={-142.5} r={1.6} fill="#f4a8bf" />
          <circle cx={-15} cy={-138.5} r={1.6} fill="#f4a8bf" />
          <circle cx={-15.8} cy={-140.4} r={1.1} fill="#f6d15c" />
        </g>
      );
    }
    case "hat_beret": {
      const c = "#a8505f";
      return (
        <g>
          <path d="M-37,-128 C-42,-143 -25,-158 1,-158 C27,-158 45,-148 43,-135 C41.5,-128.5 31,-126.5 19,-127.5 C4,-128.5 -21,-123.5 -37,-128 Z" {...paint(ctx, c)} />
          <path d="M-34,-129.5 C-18,-127 4,-131 20,-130.5 C30,-130 38,-131 40.5,-134" {...line(inkOf(c), 1, 0.4)} />
          <path d="M1,-158 q0.5,-4 3.5,-5" {...line(inkOf(c), 2.2)} />
          <path d="M-24,-150 C-15,-155 -6,-156.5 2,-156.5" {...line("#fff", 2.4, 0.3)} />
        </g>
      );
    }
    default:
      return null;
  }
}

function Headphones(ctx: Ctx, part: "band" | "cups"): Node {
  const c = "#7cc6c0";
  const d = "#4c5f7a";
  if (part === "band") {
    return (
      <g>
        <path d="M-37,-110 C-41,-140 -24,-157 0,-157 C24,-157 41,-140 37,-110" {...line(inkOf(d), 6.2)} />
        <path d="M-37,-110 C-41,-140 -24,-157 0,-157 C24,-157 41,-140 37,-110" {...line(d, 4.2)} />
        <path d="M-30,-140 C-22,-150 -12,-153.5 -3,-154" {...line("#fff", 1.2, 0.35)} />
      </g>
    );
  }
  return (
    <g>
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * 36.5},-106) scale(${sx},1)`}>
          <rect x={-4.5} y={-9.5} width={9.5} height={19} rx={4.6} {...paint(ctx, c)} />
          <rect x={1.2} y={-7} width={3.4} height={14} rx={1.7} fill={d} opacity={0.85} />
          <path d="M-2.4,-6 L-2.4,4" {...line("#fff", 1.2, 0.5)} />
        </g>
      ))}
    </g>
  );
}

function Glasses(ctx: Ctx): Node {
  const L = -EYE_X + ctx.fx;
  const R = EYE_X + ctx.fx;
  const y = EYE_Y;
  const lens = { fill: "#ffffff", fillOpacity: 0.22 };
  switch (ctx.look.glasses) {
    case "glasses_round": {
      const c = "#6b4a3a";
      const r = 8.4;
      return (
        <g {...line(c, 1.6)}>
          <circle cx={L} cy={y} r={r} {...lens} />
          <circle cx={R} cy={y} r={r} {...lens} />
          <path d={`M${L + r},${y - 1} Q${ctx.fx},${y - 4} ${R - r},${y - 1}`} />
          <path d={`M${L - r},${y - 1.5} L-31,${y - 3}`} />
          <path d={`M${R + r},${y - 1.5} L31,${y - 3}`} />
          <path d={`M${L - 4.5},${y - 5} q2,-1.8 4.4,-1.8`} {...line("#fff", 1.2, 0.8)} />
          <path d={`M${R - 4.5},${y - 5} q2,-1.8 4.4,-1.8`} {...line("#fff", 1.2, 0.8)} />
        </g>
      );
    }
    case "glasses_square": {
      const c = "#3f4b6b";
      return (
        <g {...line(c, 1.7)}>
          <rect x={L - 8.6} y={y - 6.8} width={17.2} height={13.2} rx={3.4} {...lens} />
          <rect x={R - 8.6} y={y - 6.8} width={17.2} height={13.2} rx={3.4} {...lens} />
          <path d={`M${L + 8.6},${y - 2} Q${ctx.fx},${y - 4.5} ${R - 8.6},${y - 2}`} />
          <path d={`M${L - 8.6},${y - 3} L-31,${y - 4}`} />
          <path d={`M${R + 8.6},${y - 3} L31,${y - 4}`} />
          <path d={`M${L - 5.5},${y - 4} l3.5,-0.2`} {...line("#fff", 1.3, 0.8)} />
          <path d={`M${R - 5.5},${y - 4} l3.5,-0.2`} {...line("#fff", 1.3, 0.8)} />
        </g>
      );
    }
    case "glasses_oval": {
      const c = C.gold;
      return (
        <g {...line(c, 1.3)}>
          <ellipse cx={L} cy={y + 0.5} rx={8.6} ry={6.8} {...lens} />
          <ellipse cx={R} cy={y + 0.5} rx={8.6} ry={6.8} {...lens} />
          <path d={`M${L + 8.4},${y - 1} Q${ctx.fx},${y - 3.6} ${R - 8.4},${y - 1}`} />
          <path d={`M${L - 8.5},${y - 0.6} L-31,${y - 3}`} />
          <path d={`M${R + 8.5},${y - 0.6} L31,${y - 3}`} />
          <path d={`M${L - 4.6},${y - 3.6} q2,-1.4 4.2,-1.4`} {...line("#fff", 1.1, 0.8)} />
          <path d={`M${R - 4.6},${y - 3.6} q2,-1.4 4.2,-1.4`} {...line("#fff", 1.1, 0.8)} />
        </g>
      );
    }
    default:
      return null;
  }
}

/* ───────────── 의상 데이터 해석 ───────────── */
type SleeveKind = "short" | "long" | "puff" | "puffy";
interface Sleeve {
  kind: SleeveKind;
  color: string;
  cuff?: string;
  /** 소매 밖으로 살짝 보이는 안쪽 옷 소맷단 */
  inner?: string;
}
type LegKind = "jeans" | "slacks" | "shorts" | "legging" | "bare";
interface Legs {
  kind: LegKind;
  color: string;
  socks: boolean;
}

function outfit(look: AvatarLook3): { sleeve: Sleeve; legs: Legs } {
  const t = look.topColor;
  const b = look.bottomColor;
  switch (look.set) {
    case "set_suit":
      return { sleeve: { kind: "long", color: t, inner: C.white }, legs: { kind: "slacks", color: t, socks: false } };
    case "set_labgown":
      return { sleeve: { kind: "long", color: C.gown, inner: C.shirtBlue }, legs: { kind: "slacks", color: C.charcoal, socks: false } };
    case "set_padding":
      return { sleeve: { kind: "puffy", color: t, cuff: shadeOf(t, 0.12) }, legs: { kind: "legging", color: C.legging, socks: false } };
    case "set_sundress":
      return { sleeve: { kind: "puff", color: t }, legs: { kind: "bare", color: look.skin, socks: true } };
  }
  let sleeve: Sleeve;
  switch (look.top) {
    case "top_tee":
      sleeve = { kind: "short", color: t };
      break;
    case "top_hoodie":
      sleeve = { kind: "long", color: t, cuff: shadeOf(t, 0.12) };
      break;
    case "top_knit":
      sleeve = { kind: "long", color: t, cuff: shadeOf(t, 0.08) };
      break;
    case "top_jacket":
      sleeve = { kind: "long", color: t, cuff: shadeOf(t, 0.12), inner: C.white };
      break;
    default:
      sleeve = { kind: "long", color: t, inner: C.white };
  }
  let legs: Legs;
  switch (look.bottom) {
    case "bottom_slacks":
      legs = { kind: "slacks", color: b, socks: false };
      break;
    case "bottom_skirt":
      legs = { kind: "bare", color: look.skin, socks: true };
      break;
    case "bottom_shorts":
      legs = { kind: "shorts", color: b, socks: true };
      break;
    default:
      legs = { kind: "jeans", color: b, socks: false };
  }
  return { sleeve, legs };
}

/* ───────────── 다리 · 신발 ───────────── */
function Shoe(ctx: Ctx): Node {
  switch (ctx.look.shoes) {
    case "shoes_loafers": {
      const c = "#9a5f3d";
      return (
        <g>
          <path d="M-5.8,40.5 C-6.2,38 -2.5,37.2 1,37.2 C5.5,37.2 8.4,38.8 9.8,42 C11,44.4 10.4,47.4 8,47.6 L-5.4,47.6 C-7.4,47.6 -7.4,43.4 -5.8,40.5 Z" {...paint(ctx, c)} />
          <path d="M-6.4,47 L10,47 C10.4,48.6 9.6,50 8,50 L-5.2,50 C-6.8,50 -7.2,48.6 -6.4,47 Z" {...flat("#5a3524", 1.4)} />
          <path d="M-2.5,40.6 C0,39.6 4,39.8 6.5,41.2" {...line(inkOf(c), 1.3)} />
          <rect x={0.4} y={40.4} width={3.4} height={1.6} rx={0.8} fill="#4a2b1d" opacity={0.7} />
          <path d="M-3.6,39.4 q2,-1 4.2,-1" {...line("#fff", 1.1, 0.4)} />
        </g>
      );
    }
    case "shoes_boots": {
      const c = "#8a5a43";
      return (
        <g>
          <path d="M-6.4,27 L6.4,27 L6.8,37.5 C9.8,38.6 11,41.6 10.6,45.4 L-6.8,45.4 Z" {...paint(ctx, c)} />
          <path d="M-6.8,25.2 C-2,24 2,24 6.8,25.2 L6.9,29.2 C2,28.2 -2,28.2 -6.9,29.2 Z" {...flat("#f3e6cf", 1.3)} />
          <path d="M-7.2,45 L11,45 C11.4,47.4 10.4,50 8,50 L-5.6,50 C-7.4,50 -7.8,47.4 -7.2,45 Z" {...flat("#4f3226", 1.4)} />
          <path d="M3.4,31 L3.6,38" {...line(inkOf(c), 0.9, 0.5)} strokeDasharray="1.4 1.2" />
          <path d="M-4.2,31 L-4.2,40" {...line("#fff", 1.3, 0.3)} />
        </g>
      );
    }
    case "shoes_hightop": {
      const c = "#e05a5a";
      return (
        <g>
          <path d="M-6,29 L6,29 L6.4,36.8 C9.4,38 10.8,41 10.4,44.4 L-6.6,44.4 Z" {...paint(ctx, c)} />
          <path d="M3.2,38.2 C6.8,38.6 10.4,40.5 10.4,44.4 L2.2,44.4 Z" {...flat(C.white, 1.2)} />
          <path d="M-7,44 L10.8,44 C11.2,46.8 10.4,50 7.6,50 L-5.4,50 C-7.6,50 -7.8,46.8 -7,44 Z" {...flat(C.white, 1.4)} />
          <path d="M-6.6,47.2 L10.9,47.2" {...line("#e05a5a", 0.9, 0.7)} />
          <path d="M-2.4,31 l4,2 M-2.4,33.6 l4,2 M1.6,31 l-4,2 M1.6,33.6 l-4,2" {...line(C.white, 1, 0.9)} />
          <circle cx={-4.2} cy={36.8} r={1.5} fill={C.white} stroke={inkOf(c)} strokeWidth={0.7} />
        </g>
      );
    }
    default: {
      const c = C.white;
      const accent = "#7cc6c0";
      return (
        <g>
          <path d="M-5.6,35.6 C-6,33.2 -3,32.6 0,32.6 C4,32.6 6.2,34 6.6,36.4 C9.4,37.8 10.6,40.8 10.2,44.2 L-6.4,44.2 C-7,41 -6.6,38.2 -5.6,35.6 Z" {...paint(ctx, c)} />
          <path d="M-4.6,40.8 C-1,38 3,38.4 9,41.8" {...line(accent, 1.8)} />
          <path d="M-2.4,35 l4.6,1.4 M-2.6,37.4 l4.6,1.2" {...line(inkOf(c), 1, 0.7)} />
          <path d="M-7,43.6 L10.6,43.6 C11,46.6 10.2,50 7.4,50 L-5.4,50 C-7.6,50 -7.8,46.6 -7,43.6 Z" {...flat("#f2d6a8", 1.4)} />
          <path d="M-6.4,46.6 L10.8,46.6" {...line(inkOf("#f2d6a8"), 0.9, 0.5)} strokeDasharray="1.6 1.3" />
        </g>
      );
    }
  }
}

function LegCover(ctx: Ctx, legs: Legs): Node {
  const c = legs.color;
  switch (legs.kind) {
    case "jeans":
      return (
        <g>
          <path d="M-6.6,-4 L-6.3,36.6 C-6.3,38 -5.2,38.6 -4,38.6 L4.3,38.6 C5.6,38.6 6.6,38 6.6,36.6 L7,-4 Z" {...paint(ctx, c)} />
          <path d="M-6.4,33 L6.7,33 L6.6,37 C6.6,38.2 5.6,38.6 4.3,38.6 L-4,38.6 C-5.2,38.6 -6.3,38 -6.3,37 Z" {...flat(lighten(c, 0.22), 1.4)} />
          <path d="M4.4,0 L4.3,32" {...line(lighten(c, 0.5), 0.9, 0.7)} strokeDasharray="1.6 1.4" />
          <path d="M-3.6,4 L-3.6,30" {...line("#fff", 1.4, 0.18)} />
        </g>
      );
    case "slacks":
      return (
        <g>
          <path d="M-6.6,-4 L-6,38 C-6,39.2 -5,39.6 -4,39.6 L4.4,39.6 C5.4,39.6 6.4,39.2 6.4,38 L7,-4 Z" {...paint(ctx, c)} />
          <path d="M0.4,2 L0.3,38" {...line(inkOf(c), 0.9, 0.45)} />
          <path d="M-3.4,4 L-3.4,34" {...line("#fff", 1.4, 0.16)} />
        </g>
      );
    case "shorts":
      return (
        <g>
          <path d="M-6.8,-4 L-7.6,13.6 C-7.6,14.8 -6.6,15.4 -5.4,15.4 L5.6,15.4 C6.8,15.4 7.6,14.8 7.5,13.6 L7,-4 Z" {...paint(ctx, c)} />
          <path d="M-7.3,11.2 L7.4,11.2" {...line(inkOf(c), 0.9, 0.5)} strokeDasharray="1.6 1.4" />
        </g>
      );
    case "legging":
      return (
        <g>
          <path d="M-5.6,-4 L-5.2,38 L5.4,38 L6,-4 Z" {...paint(ctx, c)} />
          <path d="M-3,4 L-3,34" {...line("#fff", 1.2, 0.15)} />
        </g>
      );
    default:
      return null;
  }
}

function Leg(ctx: Ctx, legs: Legs): Node {
  const s = ctx.look.skin;
  return (
    <g>
      <path d="M-4.8,-3 L-4.4,38 L4.6,38 L5,-3 Z" {...paint(ctx, s)} />
      {legs.socks && (
        <g>
          <path d="M-4.7,29 L4.9,29 L4.8,38 L-4.6,38 Z" {...flat(C.sock, 1.3)} />
          <path d="M-4.6,31.4 L4.8,31.4" {...line("#f08a96", 1, 0.7)} />
        </g>
      )}
      {LegCover(ctx, legs)}
      {Shoe(ctx)}
    </g>
  );
}

/** 엉덩이(허리) 부분: 다리 위·상의 아래, 걸을 때 고정 */
function Hips(ctx: Ctx, legs: Legs): Node {
  const look = ctx.look;
  if (look.set === "set_sundress") return null;
  if (!look.set && look.bottom === "bottom_skirt") {
    const c = look.bottomColor;
    const pleats = [-17, -10, -3.5, 3.5, 10, 17];
    return (
      <g>
        <path d="M-18.5,-58 L18.5,-58 C21.5,-50 24.5,-42 27,-35.5 C18,-32 -18,-32 -27,-35.5 C-24.5,-42 -21.5,-50 -18.5,-58 Z" {...paint(ctx, c)} />
        {pleats.map((x) => (
          <path key={x} d={`M${x * 0.72},-54 L${x * 1.18},-33.8`} {...line(inkOf(c), 0.9, 0.38)} />
        ))}
        <path d="M-25,-37.5 C-15,-34.6 15,-34.6 25,-37.5" {...line(lighten(c, 0.55), 1.4, 0.8)} />
        <path d="M-15,-52 L-19.5,-38" {...line("#fff", 1.6, 0.25)} />
      </g>
    );
  }
  if (legs.kind === "bare") return null;
  const c = legs.color;
  return (
    <g>
      <path d="M-19,-58 L19,-58 L19.8,-49 C19.6,-44 17,-40.5 13.4,-40.5 L1.4,-40.5 Q0,-41.4 -1.4,-40.5 L-13.4,-40.5 C-17,-40.5 -19.6,-44 -19.8,-49 Z" {...paint(ctx, c)} />
      <path d="M0,-47 L0,-41.5" {...line(inkOf(c), 1, 0.5)} />
      {legs.kind === "jeans" && <path d="M-17,-46 C-14,-43.5 -10,-43.5 -7,-46" {...line(lighten(c, 0.5), 0.9, 0.7)} strokeDasharray="1.4 1.2" />}
    </g>
  );
}

/* ───────────── 상의 · 세트 ───────────── */
const TORSO = "M-9,-82.5 C-15,-82.5 -19.5,-81 -20.5,-76 L-21.5,-52 C-21.7,-48.5 -19.5,-47 -16.5,-47 L16.5,-47 C19.5,-47 21.7,-48.5 21.5,-52 L20.5,-76 C19.5,-81 15,-82.5 9,-82.5 Z";
const TORSO_WIDE = "M-9.5,-83 C-16,-83 -21,-81.5 -22,-76 L-23,-53 C-23,-49 -21,-47.5 -18,-47.5 L18,-47.5 C21,-47.5 23,-49 23,-53 L22,-76 C21,-81.5 16,-83 9.5,-83 Z";
const SIDE_SHADE = "M13,-81.5 C17.5,-80 20,-77.5 20.5,-73 L21.5,-52 C21.6,-49 19.6,-47.2 16.6,-47.2 L11,-47.2 C15.5,-56 16.5,-70 13,-81.5 Z";

function sideShade(c: string): Node {
  return <path d={SIDE_SHADE} fill={shadeOf(c, 0.12)} opacity={0.7} />;
}
/** 좌우 대칭 판(재킷·가디건·가운 앞판): 오른쪽 판을 그리고 거울 복사 */
function mirrorPair(node: (sx: 1 | -1) => Node): Node {
  return (
    <>
      <g transform="scale(-1,1)">{node(-1)}</g>
      <g>{node(1)}</g>
    </>
  );
}

function Torso(ctx: Ctx): Node {
  const look = ctx.look;
  const t = look.topColor;
  const ink = inkOf(t);
  if (look.set) return SetTorso(ctx);
  switch (look.top) {
    case "top_tee":
      return (
        <g>
          <path d={TORSO} {...paint(ctx, t)} />
          {sideShade(t)}
          <path d="M-8.5,-82.4 C-5,-77.6 5,-77.6 8.5,-82.4" fill={shadeOf(t, 0.18)} stroke={ink} strokeWidth={1.4} />
          <path d="M-20.4,-50 L20.4,-50" {...line(ink, 0.9, 0.45)} strokeDasharray="1.8 1.5" />
          <g transform="translate(-8,-67)">
            <circle r={4.6} {...flat(lighten(t, 0.75), 1.2)} />
            <path d="M0,-2.6 L0.8,-0.8 L2.6,-0.6 L1.2,0.6 L1.6,2.4 L0,1.4 L-1.6,2.4 L-1.2,0.6 L-2.6,-0.6 L-0.8,-0.8 Z" fill={t} />
          </g>
          <path d="M-17,-74 C-18,-66 -18,-60 -17.5,-54" {...line("#fff", 2, 0.22)} />
        </g>
      );
    case "top_hoodie":
      return (
        <g>
          <path d="M-16,-84 C-21,-90 -12,-92 0,-92 C12,-92 21,-90 16,-84 Z" {...paint(ctx, shadeOf(t, 0.1))} />
          <path d={TORSO_WIDE} {...paint(ctx, t)} />
          {sideShade(t)}
          <path d="M-16.5,-83.5 C-14,-75 14,-75 16.5,-83.5 C13,-78.8 -13,-78.8 -16.5,-83.5 Z" {...paint(ctx, shadeOf(t, 0.12), 1.5)} />
          <path d="M-4.4,-78.6 C-4.8,-74 -5.4,-70 -5.6,-66.6" {...line(C.white, 1.3)} />
          <path d="M4.4,-78.6 C4.8,-74 5.2,-70.5 5.8,-67.6" {...line(C.white, 1.3)} />
          <rect x={-6.6} y={-67.4} width={2} height={3} rx={0.9} fill={inkOf(C.white)} opacity={0.6} />
          <rect x={4.8} y={-68.4} width={2} height={3} rx={0.9} fill={inkOf(C.white)} opacity={0.6} />
          <path d="M-12.5,-62 C-6,-63.5 6,-63.5 12.5,-62 L15.5,-52.5 L-15.5,-52.5 Z" {...paint(ctx, shadeOf(t, 0.04), 1.4)} />
          <path d="M-11,-60.6 C-5,-61.8 5,-61.8 11,-60.6" {...line(lighten(t, 0.4), 0.9, 0.6)} strokeDasharray="1.6 1.3" />
          <path d="M-23,-51.5 L23,-51.5 L22.9,-49.6 C22.6,-48 21,-47.5 18,-47.5 L-18,-47.5 C-21,-47.5 -22.6,-48 -22.9,-49.6 Z" fill={shadeOf(t, 0.12)} stroke={ink} strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M-18,-74 C-19,-67 -19,-61 -18.5,-56" {...line("#fff", 2, 0.22)} />
        </g>
      );
    case "top_knit": {
      const hi = lighten(t, 0.35);
      const cable = (x: number) =>
        `M${x},-78 c2.6,2 2.6,4 0,6 c-2.6,2 -2.6,4 0,6 c2.6,2 2.6,4 0,6 c-2.6,2 -2.6,4 0,6 c2.6,2 2.6,3.5 0,5`;
      return (
        <g>
          <path d={TORSO_WIDE} {...paint(ctx, t)} />
          {sideShade(t)}
          <path d={cable(0)} {...line(shadeOf(t, 0.2), 1.6, 0.8)} />
          <path d={cable(0)} {...line(hi, 0.8, 0.8)} transform="translate(-0.6,-0.6)" />
          {[-12, -7.5, 7.5, 12].map((x) => (
            <path key={x} d={`M${x},-78 L${x * 1.08},-53`} {...line(shadeOf(t, 0.16), 1, 0.55)} strokeDasharray="1.8 1.2" />
          ))}
          <path d="M-9.5,-83 C-5.5,-77 5.5,-77 9.5,-83" fill="none" stroke={ink} strokeWidth={4.2} strokeLinecap="round" />
          <path d="M-9.5,-83 C-5.5,-77 5.5,-77 9.5,-83" fill="none" stroke={shadeOf(t, 0.08)} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M-23,-52.5 L23,-52.5 L22.9,-49.6 C22.6,-48 21,-47.5 18,-47.5 L-18,-47.5 C-21,-47.5 -22.6,-48 -22.9,-49.6 Z" fill={shadeOf(t, 0.08)} stroke={ink} strokeWidth={1.2} strokeLinejoin="round" />
          {[-19, -15, -11, -7, -3, 1, 5, 9, 13, 17].map((x) => (
            <path key={x} d={`M${x + 1},-51.6 L${x + 1},-48.4`} {...line(ink, 0.8, 0.35)} />
          ))}
          <path d="M-18,-74 C-19,-67 -19,-61 -18.5,-57" {...line("#fff", 2, 0.22)} />
        </g>
      );
    }
    case "top_jacket": {
      const inner = C.white;
      return (
        <g>
          <path d={TORSO} {...paint(ctx, inner)} />
          <path d="M-6,-80.5 C-3,-78 3,-78 6,-80.5" {...line(inkOf(inner), 1.1, 0.6)} />
          {mirrorPair(() => (
            <g>
              <path d="M8.5,-83 C15.5,-83.5 21.5,-82 22.5,-76 L23.6,-50 C23.6,-46.6 21.4,-45 18,-45 L4,-45 C4.4,-56 4.2,-66 5.4,-76 Z" {...paint(ctx, t)} />
              <path d="M8.5,-83 C12.5,-82 13.6,-78.5 12.6,-74.5 L7.4,-70.5 L5.4,-76 Z" {...paint(ctx, shadeOf(t, 0.1), 1.4)} />
              <path d="M10.5,-59 L19.5,-59 L19.6,-56 C17,-55 13,-55 10.4,-56 Z" {...flat(shadeOf(t, 0.08), 1.2)} />
              <path d="M5.8,-75 C5,-66 5,-56 5.4,-46" {...line(lighten(t, 0.45), 0.9, 0.7)} strokeDasharray="1.6 1.3" />
              <path d="M18,-72 C19.5,-66 20,-60 20.4,-51" {...line(shadeOf(t, 0.16), 2.2, 0.6)} />
            </g>
          ))}
          <path d="M-0.4,-76 L-0.4,-48" {...line(inkOf(inner), 1, 0.25)} />
          <path d="M-19,-76 C-20,-68 -20.4,-60 -20,-52" {...line("#fff", 2, 0.2)} />
          <rect x={-16} y={-71} width={5.2} height={3.4} rx={1} fill={C.teal} opacity={0.9} />
        </g>
      );
    }
    default: {
      // 셔츠 + 가디건
      const shirt = C.white;
      return (
        <g>
          <path d={TORSO} {...paint(ctx, shirt)} />
          <path d="M0,-80 L-8.6,-83.2 C-9.6,-80 -8.8,-77 -6.6,-74.6 Z" {...flat(shirt, 1.3)} />
          <path d="M0,-80 L8.6,-83.2 C9.6,-80 8.8,-77 6.6,-74.6 Z" {...flat(shirt, 1.3)} />
          {mirrorPair((sx) => (
            <g>
              <path d="M9,-83 C16,-83 21.5,-81.5 22.5,-76 L23.4,-51.5 C23.4,-48.2 21.4,-46.6 18,-46.6 L-0.8,-46.6 L-0.8,-62 Z" {...paint(ctx, t)} />
              <path d="M9,-83 L-0.8,-62 L-0.8,-46.6" {...line(lighten(t, 0.35), 1.2, 0.9)} transform="translate(1.6,0)" />
              <path d="M23.4,-51 L-0.8,-51" {...line(inkOf(t), 0.9, 0.4)} />
              {sx === 1 && [-58, -53.5].map((y) => <circle key={y} cx={1.6} cy={y} r={1.25} {...flat("#f5ead3", 0.9)} />)}
              <path d="M18,-74 C19.5,-67 20,-60 20.4,-52" {...line(shadeOf(t, 0.14), 2.2, 0.5)} />
            </g>
          ))}
          <path d="M-0.6,-74 L-0.6,-64" {...line(inkOf(shirt), 0.9, 0.4)} />
          <circle cx={-0.6} cy={-70} r={0.8} fill={inkOf(shirt)} opacity={0.5} />
        </g>
      );
    }
  }
}

function SetTorso(ctx: Ctx): Node {
  const look = ctx.look;
  const t = look.topColor;
  switch (look.set) {
    case "set_suit": {
      const tie = ["#f08a74", "#f4a8bf", "#9c4a5a"].includes(t) ? "#2f4f86" : "#e36a6a";
      return (
        <g>
          <path d={TORSO} {...paint(ctx, C.white)} />
          <path d="M0,-79.5 L-8.4,-83.2 C-9.4,-80 -8.6,-77.2 -6.6,-75 Z" {...flat(C.white, 1.2)} />
          <path d="M0,-79.5 L8.4,-83.2 C9.4,-80 8.6,-77.2 6.6,-75 Z" {...flat(C.white, 1.2)} />
          <path d="M-2.2,-79.4 L2.2,-79.4 L1.6,-76.6 L3,-63.5 L0,-60.5 L-3,-63.5 L-1.6,-76.6 Z" {...paint(ctx, tie, 1.3)} />
          {mirrorPair((sx) => (
            <g>
              <path d="M7.5,-83 C15.5,-83.5 21.8,-82 22.8,-76 L23.8,-47 C23.8,-43.6 21.4,-42 18,-42 L-0.6,-42 L-0.6,-58 Z" {...paint(ctx, t)} />
              <path d="M7.5,-83 L11.6,-77 L8.6,-74.6 L-0.6,-58 L4.6,-75 Z" {...paint(ctx, shadeOf(t, 0.12), 1.3)} />
              <path d="M18,-72 C19.5,-66 20.4,-58 20.6,-46" {...line(shadeOf(t, 0.18), 2.2, 0.55)} />
              <path d="M10.8,-52 L19.6,-52" {...line(inkOf(t), 1, 0.55)} />
              {sx === 1 && <path d="M12.6,-69 L18,-69 L16.6,-66 L14.6,-67.4 Z" fill={C.white} stroke={inkOf(C.white)} strokeWidth={0.8} />}
              {sx === 1 && [-54, -47.5].map((y) => <circle key={y} cx={2.2} cy={y} r={1.3} {...flat(shadeOf(t, 0.3), 0.9)} />)}
            </g>
          ))}
        </g>
      );
    }
    case "set_labgown": {
      const g = C.gown;
      return (
        <g>
          <path d={TORSO} {...paint(ctx, C.shirtBlue)} />
          <path d="M0,-79.5 L-8.4,-83.2 C-9.4,-80 -8.6,-77.2 -6.6,-75 Z" {...flat(C.shirtBlue, 1.2)} />
          <path d="M0,-79.5 L8.4,-83.2 C9.4,-80 8.6,-77.2 6.6,-75 Z" {...flat(C.shirtBlue, 1.2)} />
          <path d="M-0.4,-76 L-0.4,-48" {...line(inkOf(C.shirtBlue), 0.9, 0.5)} />
          {[-72, -66, -60, -54].map((y) => <circle key={y} cx={-0.4} cy={y} r={0.75} fill={inkOf(C.shirtBlue)} opacity={0.6} />)}
          {mirrorPair((sx) => (
            <g>
              <path d="M6.5,-83 C15.5,-83.5 21.8,-82 22.8,-76 L25.6,-33 C25.8,-30.2 23.8,-28.8 20.6,-28.8 L3.4,-28.8 C3.4,-44 3.6,-58 4,-68 Z" {...paint(ctx, g)} />
              <path d="M6.5,-83 L11,-76.5 L7.4,-73.5 L4,-68 L4.4,-77 Z" {...paint(ctx, shadeOf(g, 0.06), 1.3)} />
              <path d="M18,-72 C19.5,-62 21,-50 22.4,-31" {...line(shadeOf(g, 0.12), 2.4, 0.7)} />
              <path d="M11.4,-45 L20.8,-45 L21.2,-36.4 C18,-35.4 14.4,-35.4 11.6,-36.4 Z" {...flat(g, 1.2)} />
              {sx === 1 && <circle cx={4.4} cy={-56} r={1.15} {...flat("#e7edf3", 0.9)} />}
              {sx === 1 && <circle cx={4.4} cy={-46} r={1.15} {...flat("#e7edf3", 0.9)} />}
              {sx === -1 && (
                <g>
                  <path d="M10.6,-70 L18.6,-70 L18.8,-64 L10.8,-64 Z" {...flat(g, 1.1)} />
                  <rect x={12} y={-73.4} width={1.8} height={5} rx={0.9} fill="#3c8bd9" />
                  <rect x={14.8} y={-72.6} width={1.8} height={4.4} rx={0.9} fill="#e36a6a" />
                </g>
              )}
            </g>
          ))}
          <rect x={8.6} y={-69.4} width={8} height={4.6} rx={1.2} fill={C.teal} />
          <rect x={10} y={-67.6} width={5.2} height={1} rx={0.5} fill="#fff" opacity={0.85} />
        </g>
      );
    }
    case "set_padding": {
      const ink = inkOf(t);
      const quilts = [-74, -65, -56, -47];
      return (
        <g>
          <path d="M-10.5,-84.5 C-18.5,-84.5 -24.5,-82.5 -25.5,-76 C-27.4,-74 -27.4,-66 -26,-65 C-27.6,-63 -27.6,-56 -26.4,-55 C-27.8,-53 -27.6,-45 -26.4,-42 C-26,-39 -23,-37.5 -19,-37.5 L19,-37.5 C23,-37.5 26,-39 26.4,-42 C27.6,-45 27.8,-53 26.4,-55 C27.6,-56 27.6,-63 26,-65 C27.4,-66 27.4,-74 25.5,-76 C24.5,-82.5 18.5,-84.5 10.5,-84.5 Z" {...paint(ctx, t)} />
          {quilts.map((y) => (
            <path key={y} d={`M-25.6,${y + 9} C-14,${y + 11} 14,${y + 11} 25.6,${y + 9}`} {...line(ink, 1, 0.45)} />
          ))}
          {quilts.map((y) => (
            <path key={`h${y}`} d={`M-20,${y + 4} C-12,${y + 2.6} -4,${y + 2.6} 0,${y + 3}`} {...line("#fff", 1.6, 0.25)} />
          ))}
          <path d="M14,-80 C21,-72 23,-58 22,-40" {...line(shadeOf(t, 0.14), 3, 0.5)} />
          <path d="M-13.5,-85.5 C-13.5,-89.5 13.5,-89.5 13.5,-85.5 L13,-79 C8,-76.5 -8,-76.5 -13,-79 Z" {...paint(ctx, shadeOf(t, 0.06), 1.6)} />
          <path d="M0.4,-78 L0.4,-38" {...line(ink, 1.2, 0.6)} />
          <rect x={-0.8} y={-77.4} width={2.6} height={4.6} rx={1.1} fill={C.gold} stroke={inkOf(C.gold)} strokeWidth={0.7} />
          <path d="M-18,-58 L-12.5,-48" {...line(ink, 1.1, 0.5)} />
          <path d="M18,-58 L12.5,-48" {...line(ink, 1.1, 0.5)} />
        </g>
      );
    }
    case "set_sundress": {
      const ink = inkOf(t);
      const ruffleLR: [number, number][] = [[-28.5, -31.5], [-21, -29.6], [-14, -28.6], [-7, -28.2], [0, -28], [7, -28.2], [14, -28.6], [21, -29.6], [28.5, -31.5]];
      const ruffleRL = ruffleLR.slice().reverse();
      return (
        <g>
          <path d={`M-9,-82.5 C-14.5,-82.5 -18.5,-81 -19.2,-76 L-19,-58 C-23,-50 -26.5,-40 -28.5,-31.5 ${scallop(ruffleLR, -2.2, false)} C26.5,-40 23,-50 19,-58 L19.2,-76 C18.5,-81 14.5,-82.5 9,-82.5 Z`} {...paint(ctx, t)} />
          <path d={`M-26.2,-35 C-10,-32.2 10,-32.2 26.2,-35 L28.5,-31.5 ${scallop(ruffleRL, 2.2, false)} Z`} fill={lighten(t, 0.45)} stroke={ink} strokeWidth={1.3} strokeLinejoin="round" />
          {[[-12, -48], [6, -44], [17, -40], [-20, -38], [-4, -38], [11, -52], [-14, -64], [10, -70], [1, -60]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={1.3} fill="#fff" opacity={0.75} />
          ))}
          <path d="M-19.2,-60 C-8,-57.4 8,-57.4 19.2,-60 L19.4,-56.4 C8,-53.8 -8,-53.8 -19.4,-56.4 Z" {...flat(lighten(t, 0.6), 1.2)} />
          <path d="M13,-58 l-3,-3.6 l0.4,4.4 Z M13,-58 l3.6,-2.6 l-1.2,4.2 Z" {...flat(lighten(t, 0.6), 1)} />
          <path d="M-9,-82.5 C-11.5,-78.5 -6,-76 0,-79 C-2,-75 -8,-74 -11,-77" fill={C.white} stroke={inkOf(C.white)} strokeWidth={1.1} strokeLinejoin="round" />
          <path d="M9,-82.5 C11.5,-78.5 6,-76 0,-79 C2,-75 8,-74 11,-77" fill={C.white} stroke={inkOf(C.white)} strokeWidth={1.1} strokeLinejoin="round" />
          <path d="M14,-80 C17.5,-72 18,-64 18.4,-58 C22,-50 25,-42 26.5,-34" {...line(shadeOf(t, 0.14), 2.4, 0.55)} />
          <path d="M-18,-54 L-24,-36" {...line("#fff", 1.8, 0.25)} />
        </g>
      );
    }
    default:
      return null;
  }
}

/* ───────────── 팔 ───────────── */
const ARM_SKIN = "M4.4,-2.6 C6.4,6 7.2,14 7.4,22 L-1.2,23 C-3.4,16.6 -5,8.4 -4.4,-1.4 C-4,-6.4 4,-7 4.4,-2.6 Z";
const SLEEVE_LONG = "M4.8,-2.8 C6.9,6 7.7,13.5 7.9,20.6 L-1.5,21.8 C-3.9,15.6 -5.5,8 -4.9,-1.4 C-4.4,-7 4.4,-7.6 4.8,-2.8 Z";
const SLEEVE_SHORT = "M4.8,-2.8 C5.8,1.8 6.4,6 6.8,10 L-4.4,11.2 C-5.2,7.4 -5.4,3.6 -4.9,-1.4 C-4.4,-7 4.4,-7.6 4.8,-2.8 Z";
const SLEEVE_PUFF = "M5,-3 C8.4,1 8.6,7.4 6.6,10.4 C3.6,12.6 -2.4,12.8 -5,10.8 C-7.4,6.4 -6.6,0.4 -4.6,-2.6 C-3,-6.8 3.6,-7 5,-3 Z";
const SLEEVE_PUFFY = "M5.6,-3.4 C8.8,4 9.8,12 9.6,20.4 L-2.6,22 C-5.8,15 -7.2,7 -6,-1.6 C-5.2,-8 4.6,-8.8 5.6,-3.4 Z";

function Arm(ctx: Ctx, sl: Sleeve): Node {
  const s = ctx.look.skin;
  const sc = sl.color;
  const ink = inkOf(sc);
  let sleeve: Node;
  switch (sl.kind) {
    case "short":
      sleeve = (
        <g>
          <path d={SLEEVE_SHORT} {...paint(ctx, sc)} />
          <path d="M-4.6,8.6 L6.6,7.5" {...line(ink, 0.9, 0.45)} strokeDasharray="1.6 1.3" />
        </g>
      );
      break;
    case "puff":
      sleeve = (
        <g>
          <path d={SLEEVE_PUFF} {...paint(ctx, sc)} />
          <path d="M-1.4,1 C-1.6,4.6 -1.2,8 -0.6,10.6 M2.6,0.4 C3,4 3.2,7.6 3,10.6" {...line(ink, 0.8, 0.35)} />
          <path d="M-5,10.4 C-2,12.2 3.6,12 6.6,10" {...line(lighten(sc, 0.6), 1.4, 0.9)} />
        </g>
      );
      break;
    case "puffy":
      sleeve = (
        <g>
          <path d={SLEEVE_PUFFY} {...paint(ctx, sc)} />
          <path d="M-6.4,6.2 C-2,7.4 4,7 8.8,5.6 M-5,14.4 C-1,15.4 5,15 9.4,13.6" {...line(ink, 0.9, 0.45)} />
          <path d="M-2.6,19.4 L9.6,18 L9.6,20.6 L-2.4,22 Z" fill={sl.cuff ?? shadeOf(sc, 0.12)} stroke={ink} strokeWidth={1.1} strokeLinejoin="round" />
        </g>
      );
      break;
    default:
      sleeve = (
        <g>
          {sl.inner && <path d="M-1.6,19.6 L7.8,18.6 L7.8,21.8 L-1,22.8 Z" {...flat(sl.inner, 1.1)} />}
          <path d={SLEEVE_LONG} {...paint(ctx, sc)} transform={sl.inner ? "translate(0,-1.4)" : undefined} />
          {sl.cuff && <path d="M-1.4,17.6 L7.9,16.6 L7.9,20.6 L-1.5,21.8 Z" fill={sl.cuff} stroke={ink} strokeWidth={1.1} strokeLinejoin="round" />}
          {sl.cuff && <path d="M1,18 L1,21.4 M3.4,17.6 L3.4,21.2 M5.8,17.3 L5.8,20.9" {...line(ink, 0.7, 0.35)} />}
          <path d="M-2.4,3 C-2.6,8 -1.8,12 -0.6,15" {...line("#fff", 1.6, 0.22)} />
        </g>
      );
  }
  return (
    <g>
      <path d={ARM_SKIN} {...paint(ctx, s)} />
      <circle cx={3.2} cy={24.6} r={4.7} {...paint(ctx, s)} />
      {sleeve}
    </g>
  );
}

/* ───────────── 액세서리 ───────────── */
const BAG = "#f2b84b";

function BackpackBack(ctx: Ctx): Node {
  const ink = inkOf(BAG);
  return (
    <g>
      <path d="M-22,-82 C-22,-88 -16,-90 -10,-90 L10,-90 C16,-90 22,-88 22,-82 L23,-50 C23,-45 19,-43 14,-43 L-14,-43 C-19,-43 -23,-45 -23,-50 Z" {...paint(ctx, BAG)} />
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`scale(${sx},1)`}>
          <path d="M21,-74 C26,-74.5 29.5,-72 29.5,-67 L29.5,-53 C29.5,-49.5 27,-47.5 23.5,-47.5 L21.5,-47.5 Z" {...paint(ctx, shadeOf(BAG, 0.06), 1.6)} />
          <path d="M22,-66.5 L29.2,-66.5" {...line(ink, 1, 0.6)} />
          <path d="M23.5,-72 C25.5,-72 27.2,-71 27.6,-69" {...line("#fff", 1.2, 0.5)} />
        </g>
      ))}
    </g>
  );
}
function BackpackStraps(ctx: Ctx): Node {
  const c = shadeOf(BAG, 0.18);
  return (
    <g>
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`scale(${sx},1)`}>
          <path d="M9.5,-82.6 C13,-82.8 15.4,-81.6 16,-78 L17.4,-55 L13.2,-55 L12.2,-76 C12,-78.6 10.6,-79.4 9,-79.6 Z" {...paint(ctx, c, 1.4)} />
          <rect x={12.4} y={-66} width={5.6} height={3.6} rx={1} {...flat("#d7dde6", 1)} />
        </g>
      ))}
    </g>
  );
}

function CrossStrap(): Node {
  const c = "#8a5a43";
  return (
    <g>
      <path d="M-13.5,-82.5 L-9.6,-83.6 L18.4,-55.4 L15.4,-52.8 Z" fill={c} stroke={inkOf(c)} strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M-11.6,-82.4 L16.8,-54.2" {...line("#fff", 0.6, 0.3)} strokeDasharray="1.4 1.2" />
    </g>
  );
}
function CrossBag(ctx: Ctx): Node {
  const c = "#e0866f";
  return (
    <g transform="translate(14,-52)">
      <path d="M-7.6,-3.6 C-7.6,-5.4 -6.2,-6 -4.6,-6 L4.6,-6 C6.2,-6 7.6,-5.4 7.6,-3.6 L7.4,5 C7.4,7 6,8 4,8 L-4,8 C-6,8 -7.4,7 -7.4,5 Z" {...paint(ctx, c)} />
      <path d="M-7.6,-3.6 C-7.6,-5.4 -6.2,-6 -4.6,-6 L4.6,-6 C6.2,-6 7.6,-5.4 7.6,-3.6 L7.4,1.6 C3,3.4 -3,3.4 -7.4,1.6 Z" {...paint(ctx, shadeOf(c, 0.12), 1.3)} />
      <rect x={-1.4} y={0.4} width={2.8} height={3.2} rx={0.8} fill={C.gold} stroke={inkOf(C.gold)} strokeWidth={0.6} />
      <path d="M-5.6,-4.2 L5.6,-4.2" {...line("#fff", 0.7, 0.4)} strokeDasharray="1.4 1.1" />
    </g>
  );
}

function Scarf(ctx: Ctx): Node {
  const c = "#e8746c";
  const st = "#fbefdc";
  return (
    <g>
      <path d="M8,-77 L16.6,-77.4 L18.4,-57.6 L9.6,-56.8 Z" {...paint(ctx, c)} />
      <path d="M8.6,-70.6 L17,-71 M9,-65 L17.6,-65.4" {...line(st, 2, 0.95)} />
      <path d="M10.4,-56.8 l-0.4,3.4 M12.6,-57 l0,3.4 M14.8,-57.2 l0.3,3.4 M17,-57.4 l0.6,3.2" {...line(inkOf(c), 1.3)} />
      <path d="M-19,-85 C-13,-77.5 13,-77.5 19,-85 C20.6,-82 20.6,-78 18,-75.2 C10,-69.6 -10,-69.6 -18,-75.2 C-20.6,-78 -20.6,-82 -19,-85 Z" {...paint(ctx, c)} />
      <path d="M-19.6,-80.4 C-12,-73.6 12,-73.6 19.6,-80.4" {...line(st, 2.2, 0.95)} />
      <path d="M-17,-81 C-14,-79 -12,-78 -9,-77.4" {...line("#fff", 1.6, 0.35)} />
    </g>
  );
}

function Tote(ctx: Ctx): Node {
  const c = "#efe2c8";
  const ink = inkOf(c);
  return (
    <g>
      <path d="M-15.6,-81.6 C-21,-74 -27,-66 -29.6,-60" {...line(ink, 3)} />
      <path d="M-15.6,-81.6 C-21,-74 -27,-66 -29.6,-60" {...line(c, 1.6)} />
      <path d="M-13,-81 C-15,-73 -18,-66 -21.6,-60" {...line(ink, 3)} />
      <path d="M-13,-81 C-15,-73 -18,-66 -21.6,-60" {...line(c, 1.6)} />
      <path d="M-34.6,-61.6 L-17.6,-61.6 L-16.4,-41.6 C-16.4,-39.6 -17.6,-38.6 -19.6,-38.6 L-32.6,-38.6 C-34.6,-38.6 -35.8,-39.6 -35.8,-41.6 Z" {...paint(ctx, c)} />
      <path d="M-29.4,-53 C-29.4,-56 -25.6,-56 -25.6,-53 C-25.6,-56 -21.8,-56 -21.8,-53 C-21.8,-50 -25.6,-47.6 -25.6,-46.6 C-25.6,-47.6 -29.4,-50 -29.4,-53 Z" fill="#f08a96" opacity={0.85} />
      <path d="M-33.6,-58.6 L-33.8,-42" {...line("#fff", 1.6, 0.4)} />
      <path d="M-34.4,-59.2 L-17.8,-59.2" {...line(ink, 0.8, 0.4)} strokeDasharray="1.4 1.2" />
    </g>
  );
}

/* ───────────── 효과 (말풍선 · 반짝임 · 이름표) ───────────── */
const STAR = "M0,-6 C0.8,-1.2 1.2,-0.8 6,0 C1.2,0.8 0.8,1.2 0,6 C-0.8,1.2 -1.2,0.8 -6,0 C-1.2,-0.8 -0.8,-1.2 0,-6 Z";

function Sparkles(): Node {
  const pts: [number, number, number][] = [
    [-40, -138, 1],
    [42, -122, 0.75],
    [32, -160, 0.6],
  ];
  return (
    <g>
      {pts.map(([x, y, k], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(${k})`}>
          <g className={`w3a-p w3a-sparkle w3a-sparkle-${i}`}>
            <path d={STAR} fill="#ffd45c" stroke="#e8a93a" strokeWidth={0.9} strokeLinejoin="round" />
            <circle r={1.3} fill="#fff" />
          </g>
        </g>
      ))}
    </g>
  );
}

function ThinkBubble({ side }: { side: 1 | -1 }): Node {
  const x = side * 40;
  return (
    <g className="w3a-bubble" transform={`translate(${x},-156)`}>
      <circle cx={-side * 12} cy={16} r={2.2} fill="#fffaf2" stroke="#d9c6a6" strokeWidth={1.2} />
      <circle cx={-side * 7} cy={10} r={3.4} fill="#fffaf2" stroke="#d9c6a6" strokeWidth={1.2} />
      <rect x={-13} y={-10} width={26} height={16} rx={8} fill="#fffaf2" stroke="#d9c6a6" strokeWidth={1.3} />
      {[-6, 0, 6].map((dx, i) => (
        <circle key={dx} className={`w3a-dot w3a-dot-${i}`} cx={dx} cy={-2} r={1.9} fill={C.navy} opacity={0.75} />
      ))}
    </g>
  );
}

const textW = (s: string) => Array.from(s).reduce((w, ch) => w + (/[ᄀ-ᇿ㄰-㆏가-힯]/.test(ch) ? 10.4 : 6.4), 0);

function NamePlate({ label, badge, y }: { label: string; badge?: string; y: number }): Node {
  const fs = 10.5;
  const lw = textW(label) * (fs / 11);
  const bw = badge ? textW(badge) * (8.5 / 11) + 9 : 0;
  const gap = badge ? 4 : 0;
  const w = lw + bw + gap + 14;
  const left = -w / 2;
  return (
    <g className="w3a-plate" transform={`translate(0,${y})`}>
      <rect x={left} y={-9} width={w} height={18} rx={9} fill="#fffaf2" fillOpacity={0.94} stroke="#ead9bf" strokeWidth={1.2} />
      {badge && (
        <g>
          <rect x={left + 5} y={-5.8} width={bw} height={11.6} rx={5.8} fill={C.teal} />
          <text x={left + 5 + bw / 2} y={3} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#fff" style={{ fontFamily: "inherit" }}>
            {badge}
          </text>
        </g>
      )}
      <text x={left + 7 + bw + gap + lw / 2} y={3.7} textAnchor="middle" fontSize={fs} fontWeight={700} fill={C.navy} style={{ fontFamily: "inherit" }}>
        {label}
      </text>
    </g>
  );
}

/* ───────────── 조립 ───────────── */
export interface Avatar3Props {
  look: AvatarLook3;
  state?: Avatar3State;
  facing?: 1 | -1;
  size?: number;
  label?: string;
  badge?: string;
  highlight?: boolean;
}

export function Avatar3({ look, state = "idle", facing = 1, size = 1, label, badge, highlight }: Avatar3Props): React.JSX.Element {
  const rid = React.useId();
  const uid = `w3a${rid.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ctx: Ctx = { uid, grads: new Map(), look, fx: 2.6, state };
  const { sleeve, legs } = outfit(look);
  const acc = look.accessory;
  const raised = state === "greeting" || state === "encouraging";

  const pivot = (x: number, y: number, cls: string, child: Node, mirror = false) => (
    <g transform={`translate(${x},${y})`}>
      <g className={`w3a-p ${cls}`}>{mirror ? <g transform="scale(-1,1)">{child}</g> : child}</g>
    </g>
  );
  const headPivot = (child: Node) => pivot(0, HEAD_PIVOT, "w3a-head", <g transform={`translate(0,${-HEAD_PIVOT})`}>{child}</g>);

  const armL = pivot(-SHOULDER.x, SHOULDER.y, "w3a-arm w3a-arm-l", Arm(ctx, sleeve), true);
  const armR = pivot(SHOULDER.x, SHOULDER.y, "w3a-arm w3a-arm-r", Arm(ctx, sleeve));

  // 그리기 순서대로 호출해야 그라데이션이 모두 등록된다
  const upperBack = (
    <g className="w3a-upper">
      {acc === "acc_backpack" && BackpackBack(ctx)}
      {headPivot(HairBack(ctx))}
    </g>
  );
  const legsNode = (
    <g>
      {pivot(-LEG_X, HIP_Y, "w3a-leg w3a-leg-l", Leg(ctx, legs), true)}
      {pivot(LEG_X, HIP_Y, "w3a-leg w3a-leg-r", Leg(ctx, legs))}
      {Hips(ctx, legs)}
    </g>
  );
  const head = headPivot(
    <g>
      {Ears(ctx)}
      {Face(ctx)}
      {Blush(ctx)}
      {Nose(ctx)}
      {Eyes(ctx)}
      {Mouth(ctx)}
      {HairFront(ctx)}
      {acc === "acc_headphones" && Headphones(ctx, "band")}
      {Hat(ctx)}
      {acc === "acc_headphones" && Headphones(ctx, "cups")}
      {Glasses(ctx)}
    </g>,
  );
  const upperFront = (
    <g className="w3a-upper">
      <path d="M-5.5,-90 L-5.5,-80 L5.5,-80 L5.5,-90 Z" fill={shadeOf(look.skin, 0.12)} />
      {Torso(ctx)}
      {acc === "acc_backpack" && BackpackStraps(ctx)}
      {acc === "acc_crossbody" && CrossStrap()}
      {armL}
      {!raised && armR}
      {acc === "acc_crossbody" && CrossBag(ctx)}
      {acc === "acc_scarf" && Scarf(ctx)}
      {head}
      {raised && armR}
      {acc === "acc_tote" && Tote(ctx)}
    </g>
  );

  const defs = (
    <defs>
      {Array.from(ctx.grads.entries()).map(([key, c]) => (
        <linearGradient key={key} id={`${uid}-${key}`} x1="0.15" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor={lighten(c, 0.3)} />
          <stop offset="0.5" stopColor={c} />
          <stop offset="1" stopColor={shadeOf(c, 0.1)} />
        </linearGradient>
      ))}
      <linearGradient id={`${uid}-iris`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.35" stopColor={C.eye} />
        <stop offset="1" stopColor={C.eyeLow} />
      </linearGradient>
      <radialGradient id={`${uid}-blush`}>
        <stop offset="0" stopColor={C.blush} stopOpacity={0.62} />
        <stop offset="1" stopColor={C.blush} stopOpacity={0} />
      </radialGradient>
    </defs>
  );

  const topY = look.hat ? -170 : look.hair === "hair_bun" ? -174 : -164;

  return (
    <g className={`w3a w3a-${state}`} transform={size !== 1 ? `scale(${size})` : undefined} data-state={state}>
      {defs}
      {highlight && (
        <g className="w3a-ring">
          <ellipse cx={0} cy={0} rx={30} ry={8.5} fill={C.teal} fillOpacity={0.14} stroke={C.teal} strokeOpacity={0.7} strokeWidth={2} />
          <ellipse cx={0} cy={0} rx={22} ry={5.6} fill="none" stroke="#7fdcd6" strokeOpacity={0.6} strokeWidth={1} />
        </g>
      )}
      <ellipse className="w3a-shadow" cx={0} cy={0.5} rx={21} ry={5} fill="rgba(40,30,20,0.18)" />
      <g transform={facing === -1 ? "scale(-1,1)" : undefined}>
        <g className="w3a-hop">
          <g className="w3a-body">
            {upperBack}
            {legsNode}
            {upperFront}
          </g>
        </g>
      </g>
      {state === "thinking" && <ThinkBubble side={facing} />}
      {state === "encouraging" && <Sparkles />}
      {label && <NamePlate label={label} badge={badge} y={topY} />}
    </g>
  );
}

export function AvatarPreview3({ look, state = "idle", className, title, facing = 1 }: { look: AvatarLook3; state?: Avatar3State; className?: string; title?: string; facing?: 1 | -1 }): React.JSX.Element {
  return (
    <svg viewBox="-62 -182 124 192" className={className} role="img" aria-label={title ?? "아바타 미리보기"}>
      {title && <title>{title}</title>}
      <Avatar3 look={look} state={state} facing={facing} />
    </svg>
  );
}
