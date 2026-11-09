/**
 * AI 과선배 3.0 — SVG 일러스트 키트 (docs/ART_DIRECTION_3_0.md 준수).
 *  - 광원: 왼쪽 위 고정. 모든 오브젝트 = 위가 밝은 그라데이션 + 오른쪽 아래 그림자면 + 접지 그림자.
 *  - 외곽선: 순수 검정 금지, 대상 색을 어둡게 한 색 1.5~2px.
 *  - 공용 <defs> 는 <KitDefs/> 로 SVG 당 1회 렌더한다(id 는 모두 "w3-" 접두사, 내용이 같아 중복돼도 안전).
 *  - 컴포넌트 좌표는 기본적으로 (x, y) = 바닥 접지점(아래 가운데), s = 배율.
 */
import type { ReactNode } from "react";

/* ───────────────────────── helpers ───────────────────────── */

export const FONT = "Pretendard, 'Pretendard Variable', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

/** 외곽선 속성 */
export const ln = (c: string, w = 1.6) => ({
  stroke: c,
  strokeWidth: w,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
});

export const u = (id: string) => `url(#w3-${id})`;

/** 결정적 난수(SSR/CSR 동일) */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const T = (x: number, y: number, s = 1, flip = false) =>
  `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;

/** 접지 그림자(타원, 블러) */
export function Shadow({ x, y, rx, ry, o = 0.18 }: { x: number; y: number; rx: number; ry?: number; o?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx * 0.22} fill={`rgba(40,30,20,${o})`} filter={u("soft")} />;
}

/* ───────────────────────── shared defs ───────────────────────── */

function LG({ id, stops, x2 = 0, y2 = 1, x1 = 0, y1 = 0 }: { id: string; stops: [number, string, number?][]; x1?: number; y1?: number; x2?: number; y2?: number }) {
  return (
    <linearGradient id={`w3-${id}`} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </linearGradient>
  );
}
function RG({ id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy }: { id: string; stops: [number, string, number?][]; cx?: number; cy?: number; r?: number; fx?: number; fy?: number }) {
  return (
    <radialGradient id={`w3-${id}`} cx={cx} cy={cy} r={r} fx={fx ?? cx} fy={fy ?? cy}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </radialGradient>
  );
}

export function KitDefs() {
  return (
    <defs>
      {/* sky & atmosphere */}
      <LG id="sky" stops={[[0, "#86c3fb"], [0.55, "#b9e0ff"], [1, "#e4f4ff"]]} />
      <LG id="skyWarm" stops={[[0, "#8cc2f5"], [0.5, "#c5e2fb"], [0.85, "#f6e6d6"], [1, "#ffd7b0"]]} />
      <LG id="skyFresh" stops={[[0, "#7fc4f6"], [0.6, "#bfe6fb"], [1, "#e8f8f2"]]} />
      <RG id="sun" stops={[[0, "#fffbe8", 0.95], [0.35, "#fff1c2", 0.45], [1, "#fff1c2", 0]]} />
      <RG id="bloom" cx={0.12} cy={0} r={0.75} stops={[[0, "#fff8e0", 0.55], [0.5, "#fff3d0", 0.18], [1, "#fff3d0", 0]]} />
      <RG id="vignette" cy={0.42} r={0.78} stops={[[0.6, "#2a1a0c", 0], [1, "#2a1a0c", 0.17]]} />
      <LG id="beam" stops={[[0, "#fff6d6", 0.42], [1, "#fff6d6", 0]]} />
      <LG id="beamCool" stops={[[0, "#f3fbff", 0.4], [1, "#f3fbff", 0]]} />
      <RG id="glow" stops={[[0, "#ffe7a6", 0.75], [0.4, "#ffd98a", 0.3], [1, "#ffd98a", 0]]} />
      <RG id="glowSoft" stops={[[0, "#fff1c9", 0.5], [1, "#fff1c9", 0]]} />
      <LG id="cloud" stops={[[0, "#ffffff"], [1, "#e6f0fb"]]} />
      {/* ground */}
      <LG id="grass" stops={[[0, "#b4e08a"], [0.4, "#9fd67a"], [1, "#6fb85c"]]} />
      <LG id="grassFar" stops={[[0, "#a9d796"], [1, "#86c27a"]]} />
      <LG id="path" stops={[[0, "#f4e4c6"], [1, "#e2c79c"]]} />
      <LG id="plaza" stops={[[0, "#efdcbc"], [0.35, "#f4e6cc"], [1, "#e6cfa6"]]} />
      <LG id="pave" stops={[[0, "#e7d6bf"], [1, "#d3b996"]]} />
      <LG id="dirt" stops={[[0, "#ecd6ac"], [1, "#d8b886"]]} />
      {/* materials */}
      <LG id="brick" stops={[[0, "#d8836a"], [0.6, "#c9715a"], [1, "#b25d48"]]} />
      <LG id="brickDeep" stops={[[0, "#bf6a55"], [1, "#9e4f3e"]]} />
      <LG id="stone" stops={[[0, "#f5f0e6"], [1, "#d6cdbd"]]} />
      <LG id="stoneGrey" stops={[[0, "#e4e1dc"], [1, "#b9b2a8"]]} />
      <LG id="wood" stops={[[0, "#d6a06b"], [0.55, "#c78d5b"], [1, "#9c6a42"]]} />
      <LG id="woodH" x2={1} y2={0} stops={[[0, "#d39b67"], [1, "#a8734a"]]} />
      <LG id="woodDark" stops={[[0, "#9a6544"], [1, "#6b432c"]]} />
      <LG id="walnut" stops={[[0, "#8c5a3c"], [0.5, "#75482f"], [1, "#5a3523"]]} />
      <LG id="birch" stops={[[0, "#f2dcb6"], [1, "#d8b88a"]]} />
      <LG id="birchH" x2={1} y2={0} stops={[[0, "#f3e0bf"], [1, "#d6b585"]]} />
      <LG id="cream" stops={[[0, "#fffaf2"], [1, "#f0e1c8"]]} />
      <LG id="metal" stops={[[0, "#f1f4f8"], [0.5, "#d3dbe4"], [1, "#a9b5c2"]]} />
      <LG id="metalH" x2={1} y2={0} stops={[[0, "#f4f7fa"], [0.45, "#d0d8e1"], [1, "#9eaab8"]]} />
      <LG id="glass" x2={1} y2={1} stops={[[0, "#eaf8ff"], [0.5, "#b9e1f5"], [1, "#8fc6e6"]]} />
      <LG id="glassWarm" stops={[[0, "#ffe9bd"], [1, "#f6c98a"]]} />
      <LG id="navy" stops={[[0, "#3b5a86"], [1, "#22406a"]]} />
      <LG id="teal" stops={[[0, "#5fcfc6"], [1, "#2a9f9d"]]} />
      <LG id="coral" stops={[[0, "#f39a84"], [1, "#d86a55"]]} />
      <LG id="mustard" stops={[[0, "#f7cf6a"], [1, "#dca63c"]]} />
      <LG id="sage" stops={[[0, "#c9dcc0"], [1, "#a8c39d"]]} />
      <LG id="cork" stops={[[0, "#e0b27e"], [1, "#c99460"]]} />
      <LG id="chalk" stops={[[0, "#3f5a50"], [1, "#2c4239"]]} />
      <LG id="whiteboard" x2={1} y2={1} stops={[[0, "#ffffff"], [0.6, "#f3f7fa"], [1, "#e3eaf0"]]} />
      <LG id="roofTile" stops={[[0, "#7c8a9c"], [1, "#4f5d70"]]} />
      <LG id="roofTeal" stops={[[0, "#6fa5ad"], [1, "#3f727d"]]} />
      <LG id="slate" stops={[[0, "#5f8277"], [1, "#3e5d55"]]} />
      <LG id="dancheong" stops={[[0, "#58b39f"], [1, "#2f8574"]]} />
      <LG id="pillar" stops={[[0, "#b7533f"], [1, "#8c3a2d"]]} />
      {/* foliage */}
      <RG id="leaf" cx={0.38} cy={0.32} r={0.7} stops={[[0, "#a9dc84"], [0.55, "#7cc96b"], [1, "#4f9e55"]]} />
      <RG id="leafDeep" cx={0.4} cy={0.35} r={0.7} stops={[[0, "#6fb862"], [1, "#3f8a4f"]]} />
      <RG id="ginkgo" cx={0.38} cy={0.32} r={0.7} stops={[[0, "#ffe892"], [0.55, "#f4c94a"], [1, "#d9a032"]]} />
      <RG id="ginkgoDeep" cx={0.4} cy={0.35} r={0.7} stops={[[0, "#e9b43c"], [1, "#c28626"]]} />
      <RG id="willow" cx={0.38} cy={0.3} r={0.7} stops={[[0, "#cdeba0"], [0.6, "#a5d67f"], [1, "#78b765"]]} />
      <LG id="pine" stops={[[0, "#77b46c"], [1, "#3f7d52"]]} />
      <LG id="trunk" x2={1} y2={0} stops={[[0, "#a9764c"], [1, "#7a5034"]]} />
      {/* water */}
      <LG id="water" stops={[[0, "#a7def4"], [0.45, "#8fd3f0"], [1, "#4fa9d8"]]} />
      <LG id="waterDeep" stops={[[0, "#7cc7ea"], [1, "#3f93c6"]]} />
      <RG id="pond" cy={0.4} stops={[[0, "#a6e0f5"], [0.7, "#7fc8ea"], [1, "#56acd9"]]} />
      {/* patterns */}
      <pattern id="w3-brickPat" width="28" height="14" patternUnits="userSpaceOnUse">
        <path d="M0 .5H28M0 7.5H28M7 .5V7.5M21 7.5V14" stroke="#efc2ad" strokeWidth="1.1" fill="none" opacity=".7" />
      </pattern>
      <pattern id="w3-tilePat" width="56" height="26" patternUnits="userSpaceOnUse">
        <path d="M0 .5H56M0 13.5H56M.5 0V13M28.5 13V26" stroke="rgba(150,110,70,0.18)" strokeWidth="1.2" fill="none" />
      </pattern>
      <pattern id="w3-paverPat" width="40" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 .5H40M0 10.5H40M.5 0V10M20.5 10V20" stroke="rgba(140,90,70,0.2)" strokeWidth="1.1" fill="none" />
      </pattern>
      <pattern id="w3-corkPat" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r=".9" fill="#a8743f" opacity=".45" />
        <circle cx="6.5" cy="5.5" r=".7" fill="#f3d3a6" opacity=".6" />
      </pattern>
      <pattern id="w3-feltPat" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r=".7" fill="#ffffff" opacity=".25" />
      </pattern>
      <pattern id="w3-slatPat" width="18" height="10" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="1.6" height="10" fill="rgba(120,80,40,0.25)" />
      </pattern>
      <pattern id="w3-wallPat" width="26" height="26" patternUnits="userSpaceOnUse">
        <circle cx="13" cy="13" r="1.4" fill="rgba(160,120,80,0.12)" />
      </pattern>
      {/* filters */}
      <filter id="w3-soft" x="-30%" y="-80%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id="w3-blur1" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.1" />
      </filter>
      <filter id="w3-blur6" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="w3-drop" x="-15%" y="-15%" width="140%" height="140%">
        <feDropShadow dx="2.5" dy="3" stdDeviation="2.5" floodColor="#3a2614" floodOpacity="0.2" />
      </filter>
    </defs>
  );
}

/* ───────────────────────── atmosphere ───────────────────────── */

export function Sky({ w, h = 600, tone = "sky", sun = true }: { w: number; h?: number; tone?: "sky" | "skyWarm" | "skyFresh"; sun?: boolean }) {
  return (
    <g>
      <rect width={w} height={h} fill={u(tone)} />
      {sun && (
        <>
          <circle cx={110} cy={60} r={160} fill={u("sun")} />
          <circle cx={110} cy={60} r={26} fill="#fffdf2" opacity={0.9} />
        </>
      )}
    </g>
  );
}

export function Cloud({ x, y, s = 1, o = 1 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={T(x, y, s)} opacity={o}>
      <ellipse cx={4} cy={6} rx={78} ry={14} fill="#b9d3ee" opacity={0.35} />
      <g fill={u("cloud")}>
        <circle cx={-44} cy={-6} r={20} />
        <circle cx={-14} cy={-22} r={30} />
        <circle cx={22} cy={-14} r={26} />
        <circle cx={50} cy={-2} r={18} />
        <rect x={-64} y={-8} width={130} height={16} rx={8} />
      </g>
      <circle cx={-22} cy={-32} r={12} fill="#ffffff" opacity={0.85} />
    </g>
  );
}

export function Clouds({ items }: { items: [number, number, number][] }) {
  return (
    <g>
      {items.map(([x, y, s], i) => (
        <g key={i} className={i % 2 ? "w3-cloud w3-cloud-b" : "w3-cloud"}>
          <Cloud x={x} y={y} s={s} o={0.95 - i * 0.04} />
        </g>
      ))}
    </g>
  );
}

/** 원경 언덕/산 띠. pts: 능선 꼭짓점 y 값을 균등 간격으로 */
export function Ridge({ w, base, pts, fill, o = 1, blur = false }: { w: number; base: number; pts: number[]; fill: string; o?: number; blur?: boolean }) {
  const step = w / (pts.length - 1);
  let d = `M0 ${base} L0 ${pts[0]}`;
  for (let i = 1; i < pts.length; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    d += ` C${x0 + step * 0.5} ${pts[i - 1]} ${x1 - step * 0.5} ${pts[i]} ${x1} ${pts[i]}`;
  }
  d += ` L${w} ${base} Z`;
  return <path d={d} fill={fill} opacity={o} filter={blur ? u("blur1") : undefined} />;
}

/** 원경 숲 실루엣(둥근 나무 머리가 이어진 띠) */
export function ForestBand({ w, y, h = 40, color, seed = 3, o = 1, pointy = false }: { w: number; y: number; h?: number; color: string; seed?: number; o?: number; pointy?: boolean }) {
  const r = rng(seed);
  const parts: ReactNode[] = [];
  let x = -20;
  let i = 0;
  while (x < w + 30) {
    const rr = h * (0.45 + r() * 0.4);
    if (pointy) {
      const hh = h * (0.9 + r() * 0.7);
      parts.push(<path key={i} d={`M${x - rr * 0.8} ${y + 4} Q${x - rr * 0.3} ${y - hh * 0.5} ${x} ${y - hh} Q${x + rr * 0.3} ${y - hh * 0.5} ${x + rr * 0.8} ${y + 4} Z`} />);
    } else {
      parts.push(<circle key={i} cx={x} cy={y - rr * 0.5} r={rr} />);
    }
    x += rr * (pointy ? 1.0 : 1.25);
    i++;
  }
  return (
    <g fill={color} opacity={o}>
      {parts}
      <rect x={0} y={y - 2} width={w} height={h} />
    </g>
  );
}

export function CitySkyline({ w, y, seed = 7, color = "#b9c4dc", o = 1 }: { w: number; y: number; seed?: number; color?: string; o?: number }) {
  const r = rng(seed);
  const items: ReactNode[] = [];
  let x = -10;
  let i = 0;
  while (x < w) {
    const bw = 40 + r() * 70;
    const bh = 50 + r() * 120;
    const kind = r();
    items.push(
      <g key={i}>
        <rect x={x} y={y - bh} width={bw} height={bh + 2} rx={2} />
        {kind > 0.75 && <rect x={x + bw * 0.4} y={y - bh - 22} width={4} height={22} />}
        {kind < 0.2 && <path d={`M${x} ${y - bh} L${x + bw / 2} ${y - bh - 18} L${x + bw} ${y - bh} Z`} />}
      </g>,
    );
    for (let wy = y - bh + 12; wy < y - 10; wy += 16) {
      for (let wx = x + 8; wx < x + bw - 10; wx += 14) {
        if (r() > 0.55) items.push(<rect key={`${i}-${wx}-${wy}`} x={wx} y={wy} width={6} height={7} rx={1} fill="#e8eefb" opacity={0.55} />);
      }
    }
    x += bw + 4 + r() * 10;
    i++;
  }
  return (
    <g fill={color} opacity={o}>
      {items}
    </g>
  );
}

export function Vignette({ w, h = 600 }: { w: number; h?: number }) {
  return (
    <g pointerEvents="none">
      <rect width={w} height={h} fill={u("bloom")} />
      <rect width={w} height={h} fill={u("vignette")} />
    </g>
  );
}

/** 사다리꼴 빛줄기(왼쪽 위 → 오른쪽 아래) */
export function LightBeam({ x, y, w, len, skew = 120, spread = 40, cool = false, o = 1 }: { x: number; y: number; w: number; len: number; skew?: number; spread?: number; cool?: boolean; o?: number }) {
  return (
    <path
      className="w3-beam"
      d={`M${x} ${y} L${x + w} ${y} L${x + w + skew + spread} ${y + len} L${x + skew - spread * 0.2} ${y + len} Z`}
      fill={u(cool ? "beamCool" : "beam")}
      opacity={o}
      pointerEvents="none"
    />
  );
}

/* ───────────────────────── foliage ───────────────────────── */

type Blob = [number, number, number];

/** 구름 덩어리형 잎: 바깥 실루엣에만 외곽선이 남도록 2회 그린다 */
function Foliage({ blobs, fill, back, line, hi }: { blobs: Blob[]; fill: string; back: string; line: string; hi: string }) {
  return (
    <g>
      {blobs.map(([x, y, r], i) => (
        <circle key={`b${i}`} cx={x + r * 0.16} cy={y + r * 0.2} r={r} fill={back} />
      ))}
      {blobs.map(([x, y, r], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r={r} fill={fill} {...ln(line, 1.7)} />
      ))}
      {blobs.map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r - 0.9} fill={fill} />
      ))}
      {blobs.map(([x, y, r], i) =>
        i % 2 === 0 ? <ellipse key={`h${i}`} cx={x - r * 0.35} cy={y - r * 0.42} rx={r * 0.32} ry={r * 0.2} fill={hi} opacity={0.6} transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.42})`} /> : null,
      )}
    </g>
  );
}

function Trunk({ h, w = 14, branches = true }: { h: number; w?: number; branches?: boolean }) {
  return (
    <g>
      <path d={`M${-w / 2 - 3} 0 Q${-w / 2} ${-h * 0.4} ${-w / 2 + 2} ${-h} L${w / 2 - 2} ${-h} Q${w / 2} ${-h * 0.4} ${w / 2 + 4} 0 Z`} fill={u("trunk")} {...ln("#6a442c", 1.5)} />
      {branches && (
        <path d={`M0 ${-h * 0.6} Q${-w * 1.2} ${-h * 0.85} ${-w * 1.8} ${-h * 1.05} M${w * 0.2} ${-h * 0.7} Q${w * 1.3} ${-h * 0.9} ${w * 1.6} ${-h * 1.1}`} stroke="#7a5034" strokeWidth={4} fill="none" strokeLinecap="round" />
      )}
      <path d={`M${-w / 2 + 3} -6 Q${-w / 2 + 3} ${-h * 0.5} ${-w / 2 + 4} ${-h + 4}`} stroke="#c59466" strokeWidth={2} fill="none" opacity={0.6} strokeLinecap="round" />
    </g>
  );
}

export type TreeKind = "round" | "ginkgo" | "ginkgoGreen" | "willow" | "pine" | "cherry";

export function Tree({ x, y, s = 1, kind = "round", sway = true, flip = false }: { x: number; y: number; s?: number; kind?: TreeKind; sway?: boolean; flip?: boolean }) {
  let crown: ReactNode = null;
  let trunkH = 70;
  if (kind === "round" || kind === "cherry") {
    const fill = kind === "cherry" ? "#f8c9d4" : u("leaf");
    const back = kind === "cherry" ? "#e39aae" : "#3f8a4f";
    const line = kind === "cherry" ? "#d0849a" : "#3f7a45";
    const hi = kind === "cherry" ? "#fff0f4" : "#d4f0a8";
    crown = (
      <Foliage
        blobs={[[-40, -92, 28], [40, -94, 28], [0, -84, 30], [-26, -126, 34], [26, -128, 33], [0, -152, 30], [-50, -116, 22], [52, -118, 22]]}
        fill={fill}
        back={back}
        line={line}
        hi={hi}
      />
    );
  } else if (kind === "ginkgo" || kind === "ginkgoGreen") {
    trunkH = 64;
    const g = kind === "ginkgo";
    crown = (
      <Foliage
        blobs={[[-34, -84, 24], [34, -86, 24], [0, -78, 26], [-26, -116, 26], [26, -118, 26], [0, -110, 24], [-16, -148, 24], [18, -150, 23], [0, -178, 20], [-40, -104, 18], [42, -106, 18]]}
        fill={g ? u("ginkgo") : u("leaf")}
        back={g ? "#c28626" : "#3f8a4f"}
        line={g ? "#b98429" : "#3f7a45"}
        hi={g ? "#fff4c0" : "#d4f0a8"}
      />
    );
  } else if (kind === "willow") {
    trunkH = 78;
    const strands: ReactNode[] = [];
    const r = rng(11);
    for (let i = 0; i < 15; i++) {
      const sx = -62 + i * 9;
      const sy = -112 + Math.abs(sx) * 0.4;
      const len = 70 + r() * 40 - Math.abs(sx) * 0.3;
      strands.push(
        <path key={i} d={`M${sx} ${sy} q${4 + r() * 4} ${len * 0.5} ${sx > 0 ? 6 : -2} ${len}`} stroke={i % 3 === 0 ? "#78b765" : i % 3 === 1 ? "#9fd07a" : "#b9e08f"} strokeWidth={5} fill="none" strokeLinecap="round" />,
      );
    }
    crown = (
      <g>
        <Foliage blobs={[[-34, -118, 30], [30, -120, 30], [0, -138, 32], [-56, -102, 20], [56, -104, 20]]} fill={u("willow")} back="#6aa85a" line="#6a9f55" hi="#eefcc8" />
        <g className={sway ? "w3-sway-slow" : undefined}>{strands}</g>
      </g>
    );
  } else if (kind === "pine") {
    trunkH = 30;
    crown = (
      <g {...ln("#3a6e48", 1.6)}>
        <path d="M-52 -26 Q-20 -40 0 -96 Q20 -40 52 -26 Q0 -14 -52 -26 Z" fill={u("pine")} />
        <path d="M-42 -66 Q-16 -80 0 -132 Q16 -80 42 -66 Q0 -56 -42 -66 Z" fill={u("pine")} />
        <path d="M-30 -104 Q-10 -118 0 -164 Q10 -118 30 -104 Q0 -96 -30 -104 Z" fill={u("pine")} />
        <path d="M-16 -86 Q-8 -100 -2 -120" stroke="#a6d68e" strokeWidth={3} fill="none" opacity={0.7} />
        <path d="M-26 -48 Q-12 -60 -4 -80" stroke="#a6d68e" strokeWidth={3} fill="none" opacity={0.7} />
      </g>
    );
  }
  return (
    <g transform={T(x, y, s, flip)}>
      <Shadow x={6} y={0} rx={kind === "pine" ? 40 : 54} ry={9} />
      <Trunk h={trunkH} w={kind === "pine" ? 12 : 14} branches={kind !== "pine"} />
      <g className={sway && kind !== "willow" && kind !== "pine" ? "w3-sway" : undefined}>{crown}</g>
    </g>
  );
}

export function Bush({ x, y, w = 90, s = 1, kind = "green", flowers }: { x: number; y: number; w?: number; s?: number; kind?: "green" | "deep" | "ginkgo"; flowers?: string }) {
  const n = Math.max(3, Math.round(w / 26));
  const blobs: Blob[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const bx = -w / 2 + 14 + t * (w - 28);
    const mid = 1 - Math.abs(t - 0.5) * 1.2;
    blobs.push([bx, -14 - mid * 10, 15 + mid * 8]);
  }
  const fill = kind === "ginkgo" ? u("ginkgo") : kind === "deep" ? u("leafDeep") : u("leaf");
  const r = rng(Math.round(x + w));
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={4} y={0} rx={w / 2 + 6} ry={7} />
      <Foliage blobs={blobs} fill={fill} back={kind === "ginkgo" ? "#c28626" : "#3f8a4f"} line={kind === "ginkgo" ? "#b98429" : "#3f7a45"} hi="#d4f0a8" />
      {flowers &&
        blobs.map(([bx, by, br], i) => (
          <g key={i}>
            <Flower x={bx - br * 0.3 + r() * 6} y={by - br * 0.3} c={flowers} s={0.7} />
            <Flower x={bx + br * 0.35} y={by + br * 0.15} c={flowers} s={0.6} />
          </g>
        ))}
    </g>
  );
}

export function Flower({ x, y, c = "#f6a3b8", s = 1 }: { x: number; y: number; c?: string; s?: number }) {
  return (
    <g transform={T(x, y, s)}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-3.6} rx={2.8} ry={3.6} fill={c} transform={`rotate(${a})`} />
      ))}
      <circle r={2.2} fill="#ffd86b" />
      <circle cx={-0.6} cy={-0.6} r={0.8} fill="#fff6d0" />
    </g>
  );
}

export function GrassTuft({ x, y, s = 1, c = "#6fb85c" }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <path
      transform={T(x, y, s)}
      d="M-10 0 Q-9 -10 -14 -16 Q-5 -10 -3 0 M-3 0 Q-2 -14 0 -22 Q3 -12 3 0 M3 0 Q6 -10 13 -15 Q9 -8 10 0 Z"
      fill={c}
      stroke="#4f9550"
      strokeWidth={1}
      strokeLinejoin="round"
    />
  );
}

export function FlowerBed({ x, y, w = 140, colors = ["#f6a3b8", "#ffd27a", "#b9a7f2", "#ffffff"], kind = "stone", seed = 5 }: { x: number; y: number; w?: number; colors?: string[]; kind?: "stone" | "wood"; seed?: number }) {
  const r = rng(seed);
  const fl: ReactNode[] = [];
  const n = Math.round(w / 9);
  for (let i = 0; i < n; i++) {
    const fx = -w / 2 + 10 + r() * (w - 20);
    const fy = -22 - r() * 16;
    fl.push(<Flower key={i} x={fx} y={fy} c={colors[i % colors.length]} s={0.75 + r() * 0.35} />);
  }
  return (
    <g transform={T(x, y)}>
      <Shadow x={4} y={2} rx={w / 2 + 8} ry={8} />
      <path d={`M${-w / 2} -18 Q0 -26 ${w / 2} -18 L${w / 2 - 4} 0 Q0 6 ${-w / 2 + 4} 0 Z`} fill={kind === "stone" ? u("stone") : u("wood")} {...ln(kind === "stone" ? "#b7ab97" : "#8a5a3b", 1.6)} />
      <path d={`M${-w / 2 + 2} -16 Q0 -22 ${w / 2 - 2} -16`} stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.6} />
      <path d={`M${-w / 2 + 6} -19 Q0 -50 ${w / 2 - 6} -19 Q0 -26 ${-w / 2 + 6} -19 Z`} fill={u("leaf")} {...ln("#3f7a45", 1.4)} />
      {fl}
    </g>
  );
}

export function PottedPlant({ x, y, s = 1, kind = "round", pot = "terracotta" }: { x: number; y: number; s?: number; kind?: "round" | "monstera" | "tall" | "succulent"; pot?: "terracotta" | "white" | "woven" | "sage" }) {
  const potFill = pot === "terracotta" ? u("coral") : pot === "white" ? u("cream") : pot === "sage" ? u("sage") : u("mustard");
  const potLine = pot === "terracotta" ? "#b85a45" : pot === "white" ? "#c9b89c" : pot === "sage" ? "#7f9c75" : "#b98429";
  let leaves: ReactNode;
  if (kind === "monstera") {
    leaves = (
      <g {...ln("#3f7a45", 1.5)}>
        {[[-34, -70, -40], [30, -78, 35], [-8, -104, -5], [-40, -112, -30], [34, -116, 25]].map(([lx, ly, a], i) => (
          <g key={i}>
            <path d={`M0 -26 Q${lx * 0.4} ${ly * 0.6} ${lx} ${ly}`} stroke="#4f8f4f" strokeWidth={2.4} fill="none" />
            <path transform={`translate(${lx} ${ly}) rotate(${a})`} d="M0 18 C-22 10 -24 -14 0 -22 C24 -14 22 10 0 18 Z M0 18 L0 -16 M-4 -2 L-16 -8 M4 4 L16 -2 M-4 8 L-14 8" fill={u("leafDeep")} />
          </g>
        ))}
      </g>
    );
  } else if (kind === "tall") {
    const lv: [number, number, number, number][] = [
      [-16, -150, -40, 1], [14, -162, 30, 1], [-2, -178, -5, 0.95], [-20, -124, -60, 1.05], [18, -132, 55, 1],
      [-14, -98, -70, 0.95], [16, -104, 65, 0.95], [-10, -74, -75, 0.85], [12, -78, 70, 0.85],
    ];
    leaves = (
      <g>
        <path d="M0 -32 Q-4 -90 2 -170" stroke="#7a5034" strokeWidth={4} fill="none" strokeLinecap="round" />
        {lv.map(([lx, ly, a, k], i) => (
          <g key={i} transform={`translate(${lx} ${ly}) rotate(${a}) scale(${k})`}>
            <path d="M0 14 C-15 8 -14 -14 0 -20 C14 -14 15 8 0 14 Z" fill={i % 3 === 0 ? u("leafDeep") : u("leaf")} {...ln("#3f7a45", 1.4)} />
            <path d="M0 12 V-16" stroke="#3f7a45" strokeWidth={1} opacity={0.6} />
            <path d="M-4 -4 Q-6 -12 -2 -16" stroke="#d4f0a8" strokeWidth={1.6} fill="none" opacity={0.7} />
          </g>
        ))}
      </g>
    );
  } else if (kind === "succulent") {
    leaves = (
      <g {...ln("#4f8f6f", 1.2)} fill="#9fd3b0">
        <path d="M-12 -24 Q-16 -40 -6 -44 Q-4 -32 -2 -24 Z" />
        <path d="M12 -24 Q16 -40 6 -44 Q4 -32 2 -24 Z" />
        <path d="M-4 -24 Q0 -50 4 -24 Z" fill="#b6e2c2" />
      </g>
    );
  } else {
    leaves = <Foliage blobs={[[-14, -44, 16], [14, -46, 16], [0, -60, 18]]} fill={u("leaf")} back="#3f8a4f" line="#3f7a45" hi="#d4f0a8" />;
  }
  const big = kind === "succulent" ? 0.55 : 1;
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={3} y={0} rx={26 * big} ry={5} />
      <g className={kind === "succulent" ? undefined : "w3-sway-slow"}>{leaves}</g>
      <g transform={`scale(${big})`}>
        <path d="M-22 -34 L22 -34 L17 0 L-17 0 Z" fill={potFill} {...ln(potLine, 1.6)} />
        <rect x={-25} y={-38} width={50} height={9} rx={4} fill={potFill} {...ln(potLine, 1.6)} />
        <path d="M8 -28 L5 -2" stroke="rgba(60,30,20,0.12)" strokeWidth={8} />
        {pot === "woven" && <path d="M-20 -22 H20 M-19 -14 H19 M-18 -6 H18" stroke="#b98429" strokeWidth={1.2} opacity={0.6} />}
      </g>
    </g>
  );
}

/* ───────────────────────── outdoor props ───────────────────────── */

export function Bench({ x, y, s = 1, flip = false, tone = "wood" }: { x: number; y: number; s?: number; flip?: boolean; tone?: "wood" | "birch" }) {
  const wf = tone === "birch" ? u("birch") : u("wood");
  const wl = tone === "birch" ? "#b08a5a" : "#8a5a3b";
  return (
    <g transform={T(x, y, s, flip)}>
      <Shadow x={4} y={0} rx={62} ry={8} />
      <g {...ln("#3b4b5c", 1.5)} fill="#5b6f84">
        <path d="M-48 0 L-44 -30 L-38 -30 L-42 0 Z" />
        <path d="M42 0 L44 -30 L50 -30 L48 0 Z" />
        <path d="M-46 -30 L-48 -66 L-42 -66 L-40 -30 Z" />
        <path d="M44 -30 L46 -66 L52 -66 L50 -30 Z" />
      </g>
      <g {...ln(wl, 1.5)} fill={wf}>
        <rect x={-56} y={-70} width={114} height={11} rx={5} />
        <rect x={-56} y={-54} width={114} height={10} rx={5} />
        <path d="M-60 -36 L60 -36 L56 -26 L-56 -26 Z" />
      </g>
      <path d="M-52 -66 H50" stroke="#f3d2a6" strokeWidth={1.5} opacity={0.7} />
      <path d="M-56 -34 H54" stroke="#f3d2a6" strokeWidth={1.5} opacity={0.7} />
    </g>
  );
}

export function LampPost({ x, y, s = 1, color = "#3d5a6c", glow = true }: { x: number; y: number; s?: number; color?: string; glow?: boolean }) {
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={3} y={0} rx={18} ry={4} />
      {glow && <circle cx={0} cy={-176} r={46} fill={u("glowSoft")} />}
      <path d="M-12 0 L-9 -14 L9 -14 L12 0 Z" fill={color} {...ln("#2b3f4d", 1.4)} />
      <rect x={-3.5} y={-160} width={7} height={148} rx={3} fill={color} {...ln("#2b3f4d", 1.4)} />
      <path d="M-1.5 -156 V-20" stroke="#8fb0c2" strokeWidth={1.5} opacity={0.6} />
      <path d="M-14 -160 L14 -160 L10 -168 L-10 -168 Z" fill={color} {...ln("#2b3f4d", 1.4)} />
      <path d="M-11 -168 L-13 -190 L13 -190 L11 -168 Z" fill="#fff1c2" {...ln("#c9a35a", 1.4)} />
      <path d="M-6 -186 L-6 -172" stroke="#ffffff" strokeWidth={2} opacity={0.8} />
      <path d="M-16 -190 Q0 -206 16 -190 Z" fill={color} {...ln("#2b3f4d", 1.4)} />
      <circle cx={0} cy={-206} r={3} fill={color} />
    </g>
  );
}

export function Signpost({ x, y, s = 1, labels, tone = "wood" }: { x: number; y: number; s?: number; labels: { text: string; dir: "l" | "r"; color?: string; shift?: number }[]; tone?: "wood" | "birch" }) {
  const wf = tone === "birch" ? u("birch") : u("wood");
  const wl = tone === "birch" ? "#a9835a" : "#8a5a3b";
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={4} y={0} rx={28} ry={6} />
      <rect x={-6} y={-150} width={12} height={150} rx={4} fill={wf} {...ln(wl, 1.6)} />
      <path d="M-3 -146 V-6" stroke="#f3d2a6" strokeWidth={1.6} opacity={0.6} />
      <circle cx={0} cy={-154} r={7} fill={wf} {...ln(wl, 1.5)} />
      {labels.map((l, i) => {
        const yy = -138 + i * 34;
        const wdt = Math.max(66, l.text.length * 13 + 26);
        const d =
          l.dir === "r"
            ? `M-14 ${yy} H${wdt - 26} L${wdt - 12} ${yy + 12} L${wdt - 26} ${yy + 24} H-14 Z`
            : `M14 ${yy} H${-wdt + 26} L${-wdt + 12} ${yy + 12} L${-wdt + 26} ${yy + 24} H14 Z`;
        const cx = l.dir === "r" ? (wdt - 40) / 2 : -(wdt - 40) / 2;
        return (
          <g key={i} filter={u("drop")} transform={l.shift ? `translate(${l.shift} 0)` : undefined}>
            <path d={d} fill={l.color ?? u("cream")} {...ln(wl, 1.6)} />
            <text x={cx} y={yy + 16.5} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={700} fill="#5a3a24">
              {l.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function Fountain({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={6} y={2} rx={150} ry={20} o={0.2} />
      {/* basin */}
      <path d="M-140 -34 Q-140 0 0 4 Q140 0 140 -34 L140 -46 Q0 -10 -140 -46 Z" fill={u("stone")} {...ln("#b2a48d", 1.8)} />
      <path d="M-140 -46 Q0 -10 140 -46" fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.6} />
      {[-110, -66, -22, 22, 66, 110].map((bx) => (
        <path key={bx} d={`M${bx} ${-34 + Math.abs(bx) * 0.08} v${28 - Math.abs(bx) * 0.1}`} stroke="#c9bca6" strokeWidth={1.4} opacity={0.7} />
      ))}
      <ellipse cx={0} cy={-48} rx={140} ry={26} fill={u("stone")} {...ln("#b2a48d", 1.8)} />
      <ellipse cx={0} cy={-48} rx={126} ry={19} fill={u("pond")} />
      <ellipse cx={-30} cy={-52} rx={60} ry={6} fill="#ffffff" opacity={0.35} />
      <g className="w3-ripple">
        <ellipse cx={0} cy={-46} rx={70} ry={10} fill="none" stroke="#ffffff" strokeWidth={1.5} opacity={0.55} />
      </g>
      <g className="w3-ripple w3-delay">
        <ellipse cx={0} cy={-46} rx={100} ry={14} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.4} />
      </g>
      {/* pedestal */}
      <path d="M-18 -50 Q-12 -90 -14 -112 L14 -112 Q12 -90 18 -50 Z" fill={u("stone")} {...ln("#b2a48d", 1.6)} />
      <path d="M-9 -54 Q-6 -86 -8 -108" stroke="#ffffff" strokeWidth={2} opacity={0.6} fill="none" />
      {/* upper bowl */}
      <path d="M-62 -116 Q0 -86 62 -116 Q40 -100 0 -98 Q-40 -100 -62 -116 Z" fill={u("stoneGrey")} {...ln("#a89a83", 1.6)} />
      <ellipse cx={0} cy={-116} rx={62} ry={11} fill={u("stone")} {...ln("#b2a48d", 1.6)} />
      <ellipse cx={0} cy={-116} rx={52} ry={7} fill={u("pond")} />
      {/* top */}
      <path d="M-8 -118 Q-6 -136 -10 -146 L10 -146 Q6 -136 8 -118 Z" fill={u("stone")} {...ln("#b2a48d", 1.4)} />
      <ellipse cx={0} cy={-148} rx={20} ry={5} fill={u("stone")} {...ln("#b2a48d", 1.4)} />
      {/* water */}
      <g className="w3-fountain">
        <path d="M0 -150 Q-6 -196 0 -212 Q6 -196 0 -150 Z" fill="#dff4ff" opacity={0.85} />
        <path d="M0 -206 Q-34 -204 -46 -120 M0 -206 Q34 -204 46 -120" stroke="#cdeeff" strokeWidth={4} fill="none" opacity={0.8} strokeLinecap="round" />
        <path d="M0 -200 Q-20 -196 -26 -122 M0 -200 Q20 -196 26 -122" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.8} strokeLinecap="round" />
        <path d="M-58 -112 Q-80 -96 -92 -56 M58 -112 Q80 -96 92 -56 M-30 -104 Q-40 -86 -46 -54 M30 -104 Q40 -86 46 -54" stroke="#d6f1ff" strokeWidth={3} fill="none" opacity={0.75} strokeLinecap="round" />
      </g>
      <g className="w3-twinkle">
        <circle cx={-46} cy={-124} r={2.4} fill="#ffffff" />
        <circle cx={40} cy={-60} r={2} fill="#ffffff" />
        <circle cx={-90} cy={-60} r={1.8} fill="#ffffff" />
      </g>
    </g>
  );
}

/** 한국 전통 정자(독자 디자인). 앞에서 본 직사각 정자: 기단·마루·기둥·단청 창방·휘어 올라간 기와지붕 */
export function Pavilion({ x, y, s = 1, w = 240, tone = "classic", onWater = false, sign }: { x: number; y: number; s?: number; w?: number; tone?: "classic" | "teal"; onWater?: boolean; sign?: string }) {
  const hw = w / 2;
  const roofFill = tone === "teal" ? u("roofTeal") : u("roofTile");
  const roofLine = tone === "teal" ? "#2f5a63" : "#3d4858";
  const tileLine = tone === "teal" ? "#88bcc2" : "#93a1b3";
  const floorY = onWater ? -40 : -44;
  const postTop = floorY - 112;
  const eaveY = postTop - 16;
  const tiles: ReactNode[] = [];
  for (let tx = -hw - 4; tx <= hw + 4; tx += 11) {
    const k = tx / (hw + 30);
    tiles.push(<path key={tx} d={`M${tx * 0.72} ${eaveY - 66} Q${tx * 0.86} ${eaveY - 30} ${tx * 1.08} ${eaveY + 6 - k * k * 22}`} stroke={tileLine} strokeWidth={1.6} fill="none" opacity={0.55} />);
  }
  const posts = [-hw + 18, -hw * 0.36, hw * 0.36, hw - 18];
  return (
    <g transform={T(x, y, s)}>
      {!onWater && <Shadow x={8} y={2} rx={hw + 40} ry={14} o={0.22} />}
      {/* base / stilts */}
      {onWater ? (
        <g>
          {posts.map((px) => (
            <rect key={px} x={px - 6} y={floorY} width={12} height={46} rx={3} fill={u("stoneGrey")} {...ln("#8f877b", 1.4)} />
          ))}
          <ellipse cx={0} cy={8} rx={hw + 10} ry={7} fill="#3f93c6" opacity={0.3} />
        </g>
      ) : (
        <g>
          <path d={`M${-hw - 26} -18 L${hw + 26} -18 L${hw + 32} 0 L${-hw - 32} 0 Z`} fill={u("stone")} {...ln("#b2a48d", 1.6)} />
          <path d={`M${-hw - 16} ${floorY + 8} L${hw + 16} ${floorY + 8} L${hw + 26} -18 L${-hw - 26} -18 Z`} fill={u("stoneGrey")} {...ln("#a59a88", 1.6)} />
          {[-0.75, -0.25, 0.25, 0.75].map((k) => (
            <path key={k} d={`M${k * hw} ${floorY + 10} V-20`} stroke="#9e9584" strokeWidth={1.2} opacity={0.6} />
          ))}
          <path d="M-36 0 L-30 -10 L30 -10 L36 0 Z" fill={u("stone")} {...ln("#b2a48d", 1.4)} />
        </g>
      )}
      {/* maru floor */}
      <path d={`M${-hw - 12} ${floorY - 6} L${hw + 12} ${floorY - 6} L${hw + 16} ${floorY + 8} L${-hw - 16} ${floorY + 8} Z`} fill={u("wood")} {...ln("#8a5a3b", 1.6)} />
      <path d={`M${-hw - 10} ${floorY - 4} H${hw + 10}`} stroke="#f3d2a6" strokeWidth={1.4} opacity={0.7} />
      {/* interior shade */}
      <rect x={-hw + 18} y={postTop} width={w - 36} height={floorY - 6 - postTop} fill="#7a4a35" opacity={0.28} />
      <rect x={-hw + 18} y={postTop} width={w - 36} height={18} fill="#3a2418" opacity={0.18} />
      {/* posts */}
      {posts.map((px) => (
        <g key={px}>
          <rect x={px - 7} y={postTop} width={14} height={floorY - 6 - postTop} rx={3} fill={u("pillar")} {...ln("#6e2d22", 1.5)} />
          <path d={`M${px - 3} ${postTop + 4} V${floorY - 10}`} stroke="#e08a72" strokeWidth={2} opacity={0.6} />
          <rect x={px - 10} y={floorY - 12} width={20} height={7} rx={2} fill={u("stoneGrey")} {...ln("#8f877b", 1.2)} />
        </g>
      ))}
      {/* railing */}
      <g {...ln("#7a4a2e", 1.4)}>
        <path d={`M${-hw + 18} ${floorY - 28} H${-hw * 0.36} M${hw * 0.36} ${floorY - 28} H${hw - 18}`} stroke="#a3683f" strokeWidth={5} />
        {[...Array(9)].map((_, i) => {
          const rx1 = -hw + 26 + i * ((hw * 0.64 - 26) / 8);
          return <path key={`l${i}`} d={`M${rx1} ${floorY - 26} V${floorY - 6}`} stroke="#b97a4c" strokeWidth={2.4} />;
        })}
        {[...Array(9)].map((_, i) => {
          const rx1 = hw * 0.36 + 8 + i * ((hw * 0.64 - 26) / 8);
          return <path key={`r${i}`} d={`M${rx1} ${floorY - 26} V${floorY - 6}`} stroke="#b97a4c" strokeWidth={2.4} />;
        })}
      </g>
      {/* changbang (단청 띠) */}
      <rect x={-hw + 6} y={postTop - 4} width={w - 12} height={16} rx={2} fill={u("dancheong")} {...ln("#245f53", 1.4)} />
      {[...Array(Math.floor((w - 24) / 22))].map((_, i) => (
        <g key={i}>
          <circle cx={-hw + 20 + i * 22} cy={postTop + 4} r={4} fill="#f6d77a" opacity={0.9} />
          <circle cx={-hw + 20 + i * 22} cy={postTop + 4} r={1.6} fill="#d85b4a" />
        </g>
      ))}
      {/* rafters under eaves */}
      <path d={`M${-hw - 34} ${eaveY + 2} Q0 ${eaveY + 14} ${hw + 34} ${eaveY + 2} L${hw + 10} ${postTop - 4} L${-hw - 10} ${postTop - 4} Z`} fill="#4f9f8d" {...ln("#2f6b5d", 1.4)} />
      {[...Array(15)].map((_, i) => {
        const rx1 = -hw - 20 + i * ((w + 40) / 14);
        return <circle key={i} cx={rx1} cy={eaveY + 7 + (1 - (rx1 / (hw + 30)) ** 2) * 4} r={2.4} fill="#f6e4a8" />;
      })}
      {/* roof */}
      <path
        d={`M${-hw - 56} ${eaveY - 24} Q${-hw - 30} ${eaveY + 2} ${-hw * 0.5} ${eaveY + 6} Q0 ${eaveY + 10} ${hw * 0.5} ${eaveY + 6} Q${hw + 30} ${eaveY + 2} ${hw + 56} ${eaveY - 24} Q${hw + 20} ${eaveY - 22} ${hw * 0.62} ${eaveY - 64} L${-hw * 0.62} ${eaveY - 64} Q${-hw - 20} ${eaveY - 22} ${-hw - 56} ${eaveY - 24} Z`}
        fill={roofFill}
        {...ln(roofLine, 1.8)}
      />
      {tiles}
      <path d={`M${-hw - 50} ${eaveY - 22} Q${-hw - 26} ${eaveY - 2} ${-hw * 0.5} ${eaveY + 1} Q0 ${eaveY + 5} ${hw * 0.5} ${eaveY + 1} Q${hw + 26} ${eaveY - 2} ${hw + 50} ${eaveY - 22}`} stroke="#d6dde6" strokeWidth={4} fill="none" opacity={0.7} />
      <path d={`M${-hw * 0.6} ${eaveY - 60} Q${-hw * 0.9} ${eaveY - 30} ${-hw - 30} ${eaveY - 18}`} stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.25} />
      {/* ridge */}
      <path d={`M${-hw * 0.7} ${eaveY - 62} Q0 ${eaveY - 56} ${hw * 0.7} ${eaveY - 62} L${hw * 0.76} ${eaveY - 80} Q0 ${eaveY - 70} ${-hw * 0.76} ${eaveY - 80} Z`} fill={roofFill} {...ln(roofLine, 1.6)} />
      <path d={`M${-hw * 0.68} ${eaveY - 72} Q0 ${eaveY - 64} ${hw * 0.68} ${eaveY - 72}`} stroke="#eef2f6" strokeWidth={2.4} fill="none" opacity={0.6} />
      {sign && (
        <g filter={u("drop")}>
          <rect x={-58} y={postTop - 2} width={116} height={30} rx={4} fill="#3e2a1e" {...ln("#2a1a10", 1.2)} />
          <rect x={-54} y={postTop + 2} width={108} height={22} rx={3} fill={u("cream")} />
          <text x={0} y={postTop + 18} textAnchor="middle" fontFamily={FONT} fontSize={12.5} fontWeight={800} fill="#3a4a5c">
            {sign}
          </text>
        </g>
      )}
    </g>
  );
}

export function Kiosk({ x, y, s = 1, title = "진로 정보" }: { x: number; y: number; s?: number; title?: string }) {
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={6} y={0} rx={62} ry={9} />
      {/* awning stall body */}
      <path d="M-48 -6 L-48 -104 L48 -104 L48 -6 Z" fill={u("cream")} {...ln("#c4ab86", 1.6)} />
      <path d="M48 -104 L58 -98 L58 0 L48 -6 Z" fill="#d9c3a0" {...ln("#c4ab86", 1.4)} />
      <rect x={-48} y={-8} width={106} height={8} rx={2} fill={u("wood")} {...ln("#8a5a3b", 1.3)} />
      {/* counter */}
      <rect x={-54} y={-62} width={108} height={12} rx={4} fill={u("wood")} {...ln("#8a5a3b", 1.5)} />
      <rect x={-44} y={-50} width={88} height={40} rx={4} fill={u("teal")} opacity={0.9} {...ln("#1f7d7b", 1.4)} />
      <text x={0} y={-25} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={800} fill="#ffffff">
        {title}
      </text>
      {/* screen */}
      <rect x={-34} y={-98} width={68} height={32} rx={5} fill="#24405f" {...ln("#1a2f47", 1.4)} />
      <rect x={-30} y={-94} width={60} height={24} rx={3} fill="#3b7bb0" />
      <path d="M-24 -76 L-14 -84 L-4 -80 L8 -90 L22 -86" stroke="#9ff0e8" strokeWidth={2} fill="none" />
      <rect x={-24} y={-92} width={20} height={3} rx={1.5} fill="#ffffff" opacity={0.7} />
      <path d="M-28 -94 L-14 -94 L-30 -72 Z" fill="#ffffff" opacity={0.15} />
      {/* brochures */}
      <rect x={-50} y={-74} width={14} height={12} rx={2} fill="#ffd27a" {...ln("#c99a3a", 1)} />
      <rect x={36} y={-74} width={14} height={12} rx={2} fill="#f6a3b8" {...ln("#c97a8f", 1)} />
      {/* awning */}
      <path d="M-62 -104 L62 -104 L54 -132 L-54 -132 Z" fill="#ffffff" {...ln("#1f7d7b", 1.6)} />
      {[-54, -32, -10, 12, 34].map((ax, i) => (
        <path key={ax} d={`M${ax + (i ? 0 : 0)} -132 L${ax + 22} -132 L${ax + 24 + 2} -104 L${ax - 2 + 2} -104 Z`} fill={u("teal")} opacity={i % 2 ? 0 : 1} />
      ))}
      <path d="M-62 -104 Q-51 -92 -40 -104 Q-29 -92 -18 -104 Q-7 -92 4 -104 Q15 -92 26 -104 Q37 -92 48 -104 Q55 -94 62 -104" fill="#ffffff" {...ln("#1f7d7b", 1.4)} />
      <rect x={-30} y={-158} width={60} height={24} rx={8} fill={u("navy")} {...ln("#163257", 1.4)} />
      <text x={0} y={-141} textAnchor="middle" fontFamily={FONT} fontSize={11.5} fontWeight={800} fill="#ffffff">
        INFO
      </text>
      <circle cx={-46} cy={-150} r={4} fill="#ffd86b" className="w3-twinkle" />
    </g>
  );
}

/** 귀여운 옷장 부스(줄무늬 지붕 + 커튼 + 거울) */
export function WardrobeBooth({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={6} y={0} rx={84} ry={11} />
      {/* back body */}
      <path d="M-70 0 L-70 -150 Q0 -170 70 -150 L70 0 Z" fill="#f7e0e6" {...ln("#d3a2ae", 1.7)} />
      <path d="M70 -150 L82 -142 L82 -4 L70 0 Z" fill="#e5c2cb" {...ln("#d3a2ae", 1.4)} />
      {/* opening */}
      <path d="M-52 -4 L-52 -120 Q0 -142 52 -120 L52 -4 Z" fill="#8a5a6a" opacity={0.35} />
      {/* clothes rack inside */}
      <path d="M-44 -112 H44" stroke="#a9825a" strokeWidth={3} strokeLinecap="round" />
      {[[-32, "#7ec4e8"], [-12, "#ffd27a"], [8, "#9fd67a"], [28, "#f6a3b8"]].map(([cx, c]) => (
        <g key={cx as number} transform={`translate(${cx} -112)`}>
          <path d="M0 0 L-10 8 L10 8 Z" fill="none" stroke="#a9825a" strokeWidth={1.4} />
          <path d="M-11 8 L11 8 L13 46 L-13 46 Z" fill={c as string} {...ln("rgba(80,60,60,0.35)", 1.2)} />
        </g>
      ))}
      {/* mirror */}
      <ellipse cx={0} cy={-36} rx={18} ry={24} fill={u("glass")} {...ln("#c9a35a", 2)} />
      <path d="M-8 -48 L4 -54" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
      {/* curtains */}
      <path d="M-56 -2 Q-48 -60 -54 -124 Q-30 -132 -22 -128 Q-34 -70 -40 -2 Z" fill={u("coral")} {...ln("#b85a45", 1.5)} />
      <path d="M56 -2 Q48 -60 54 -124 Q30 -132 22 -128 Q34 -70 40 -2 Z" fill={u("coral")} {...ln("#b85a45", 1.5)} />
      <path d="M-48 -110 Q-44 -60 -48 -10" stroke="#ffc1b2" strokeWidth={2} fill="none" opacity={0.7} />
      <rect x={-49} y={-70} width={14} height={5} rx={2} fill="#ffd27a" />
      <rect x={35} y={-70} width={14} height={5} rx={2} fill="#ffd27a" />
      {/* striped roof */}
      <path d="M-84 -144 Q0 -230 84 -144 Q0 -164 -84 -144 Z" fill="#ffffff" {...ln("#d3a2ae", 1.7)} />
      {[-60, -28, 4, 36].map((sx) => (
        <path key={sx} d={`M${sx} ${-152 + Math.abs(sx) * 0.08} Q${sx + 10} -194 ${sx + 16} ${-160 - (40 - Math.abs(sx + 8) * 0.6)} L${sx + 26} ${-158 - (40 - Math.abs(sx + 20) * 0.5)} Q${sx + 22} -192 ${sx + 16} ${-152 + Math.abs(sx + 16) * 0.04} Z`} fill="#f6a3b8" opacity={0.85} />
      ))}
      <path d="M-84 -144 Q-71 -132 -58 -146 Q-44 -132 -30 -148 Q-16 -134 0 -150 Q16 -134 30 -148 Q44 -132 58 -146 Q71 -132 84 -144" fill="#ffffff" {...ln("#d3a2ae", 1.5)} />
      <circle cx={0} cy={-196} r={8} fill={u("mustard")} {...ln("#b98429", 1.4)} />
      {/* sign */}
      <g filter={u("drop")}>
        <rect x={-40} y={-176} width={80} height={22} rx={11} fill={u("cream")} {...ln("#d3a2ae", 1.4)} />
        <text x={0} y={-160.5} textAnchor="middle" fontFamily={FONT} fontSize={11.5} fontWeight={800} fill="#a04f66">
          나의 옷장
        </text>
      </g>
      {/* hanger icon decoration */}
      <path d="M62 -60 l8 -6 l8 6" stroke="#d3a2ae" strokeWidth={1.6} fill="none" />
    </g>
  );
}

/** 지붕 달린 게시판(야외) */
export function NoticeBoard({ x, y, s = 1, title = "선배 경험 게시판" }: { x: number; y: number; s?: number; title?: string }) {
  const notes = [
    [-58, -150, "#fff3a8", -4],
    [-20, -156, "#bfe6ff", 3],
    [18, -150, "#ffd0dc", -2],
    [52, -154, "#d8f5c2", 4],
    [-50, -112, "#ffd0dc", 2],
    [-12, -110, "#fff3a8", -3],
    [28, -114, "#ffffff", 2],
    [58, -108, "#bfe6ff", -4],
  ] as const;
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={6} y={0} rx={86} ry={10} />
      <rect x={-78} y={-130} width={10} height={130} rx={3} fill={u("wood")} {...ln("#8a5a3b", 1.5)} />
      <rect x={68} y={-130} width={10} height={130} rx={3} fill={u("wood")} {...ln("#8a5a3b", 1.5)} />
      <rect x={-86} y={-182} width={172} height={110} rx={8} fill={u("wood")} {...ln("#8a5a3b", 1.7)} />
      <rect x={-78} y={-174} width={156} height={94} rx={5} fill={u("cork")} />
      <rect x={-78} y={-174} width={156} height={94} rx={5} fill="url(#w3-corkPat)" />
      <path d="M78 -174 V-80 H-78" stroke="rgba(80,40,10,0.18)" strokeWidth={4} fill="none" />
      {notes.map(([nx, ny, c, r], i) => (
        <g key={i} transform={`translate(${nx} ${ny + 20}) rotate(${r})`}>
          <rect x={-14} y={-14} width={28} height={26} rx={2} fill={c} {...ln("rgba(120,90,50,0.35)", 1)} />
          <path d="M-9 -4 H9 M-9 2 H5" stroke="#9a8a76" strokeWidth={1.4} opacity={0.6} />
          <circle cx={0} cy={-12} r={2.6} fill={i % 2 ? "#e2604c" : "#14a3a3"} />
        </g>
      ))}
      <path d="M-100 -180 Q0 -214 100 -180 L92 -196 Q0 -226 -92 -196 Z" fill={u("brick")} {...ln("#9e4f3e", 1.6)} />
      <path d="M-92 -196 Q0 -226 92 -196" stroke="#f0a58e" strokeWidth={2} fill="none" opacity={0.6} />
      <g filter={u("drop")}>
        <rect x={-62} y={-80} width={124} height={22} rx={11} fill={u("cream")} {...ln("#c4ab86", 1.3)} />
        <text x={0} y={-64.5} textAnchor="middle" fontFamily={FONT} fontSize={11.5} fontWeight={800} fill="#5a3a24">
          {title}
        </text>
      </g>
    </g>
  );
}

export function Duck({ x, y, s = 1, flip = false, baby = false }: { x: number; y: number; s?: number; flip?: boolean; baby?: boolean }) {
  const body = baby ? "#ffe17a" : "#ffffff";
  const line = baby ? "#c9a23a" : "#a9b3bf";
  return (
    <g transform={T(x, y, s, flip)}>
      <ellipse cx={0} cy={2} rx={22} ry={4} fill="#3f93c6" opacity={0.35} />
      <path d="M-18 0 Q-22 -16 -6 -18 Q2 -18 6 -10 L18 -12 Q16 0 8 2 Z" fill={body} {...ln(line, 1.5)} />
      <path d="M-12 -8 Q-4 -2 4 -6" stroke={line} strokeWidth={1.2} fill="none" opacity={0.7} />
      <circle cx={10} cy={-20} r={8} fill={body} {...ln(line, 1.5)} />
      <path d="M16 -21 L24 -19 L16 -16 Z" fill="#f5a142" {...ln("#d07f2a", 1)} />
      <circle cx={12} cy={-22} r={1.5} fill="#2d3a4a" />
      <circle cx={12.5} cy={-22.6} r={0.5} fill="#ffffff" />
      {!baby && <ellipse cx={9} cy={-16} rx={2.6} ry={1.6} fill="#ffc2c2" opacity={0.8} />}
    </g>
  );
}

export function LotusLeaf({ x, y, s = 1, flower = false }: { x: number; y: number; s?: number; flower?: boolean }) {
  return (
    <g transform={T(x, y, s)}>
      <path d="M0 0 L-24 -4 A26 9 0 1 0 -18 5 Z" transform="scale(-1 1)" fill="#7cc96b" {...ln("#4f8f4f", 1.3)} />
      <path d="M-6 -2 L-18 -6 M-4 0 L-20 2 M0 -2 L4 -7" stroke="#a9dc84" strokeWidth={1} opacity={0.8} />
      {flower && (
        <g transform="translate(6 -6)">
          <path d="M0 0 Q-9 -6 -6 -14 Q-2 -8 0 -16 Q2 -8 6 -14 Q9 -6 0 0 Z" fill="#ffc2d4" {...ln("#d98aa3", 1.1)} />
          <path d="M0 -2 Q-2 -8 0 -12 Q2 -8 0 -2" fill="#fff0f5" />
        </g>
      )}
    </g>
  );
}

export function Rock({ x, y, s = 1, tone = "#cfc6b8" }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={T(x, y, s)}>
      <path d="M-18 0 Q-20 -12 -8 -16 Q4 -20 14 -12 Q22 -4 18 0 Z" fill={tone} {...ln("#9e9584", 1.4)} />
      <path d="M-12 -10 Q-6 -15 2 -14" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.6} strokeLinecap="round" />
    </g>
  );
}

/* ───────────────────────── architecture ───────────────────────── */

export function ArchWindow({ x, y, w, h, frame = "#fff7ea", line = "#c4ab86", glass = "glass", mullion = true, warm = false, see = false }: { x: number; y: number; w: number; h: number; frame?: string; line?: string; glass?: string; mullion?: boolean; warm?: boolean; see?: boolean }) {
  const r = w / 2;
  const d = `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`;
  const inset = 5;
  const ri = r - inset;
  const di = `M${x + inset} ${y + h - inset} V${y + r} A${ri} ${ri} 0 0 1 ${x + w - inset} ${y + r} V${y + h - inset} Z`;
  return (
    <g>
      <path d={`${d} ${di}`} fill={frame} fillRule="evenodd" {...ln(line, 1.6)} />
      <path d={di} fill={warm ? u("glassWarm") : u(glass)} opacity={see ? 0.28 : 1} />
      <path d={`M${x + inset + 4} ${y + h * 0.75} L${x + inset + 4} ${y + r} L${x + w * 0.45} ${y + inset + 6}`} stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d={`M${x + w * 0.2} ${y + h - inset} L${x + w - inset} ${y + h * 0.45} L${x + w - inset} ${y + h * 0.62} L${x + w * 0.42} ${y + h - inset} Z`} fill="#ffffff" opacity={0.18} />
      {mullion && <path d={`M${x + r} ${y + inset} V${y + h - inset} M${x + inset} ${y + r + (h - r) * 0.45} H${x + w - inset}`} stroke={frame} strokeWidth={3} />}
      <rect x={x - 4} y={y + h - 2} width={w + 8} height={7} rx={2} fill={frame} {...ln(line, 1.4)} />
    </g>
  );
}

export function RectWindow({ x, y, w, h, frame = "#fff7ea", line = "#c4ab86", cols = 2, rows = 2, warm = false, see = false }: { x: number; y: number; w: number; h: number; frame?: string; line?: string; cols?: number; rows?: number; warm?: boolean; see?: boolean }) {
  const lines: ReactNode[] = [];
  for (let c = 1; c < cols; c++) lines.push(<path key={`c${c}`} d={`M${x + (w * c) / cols} ${y + 4} V${y + h - 4}`} stroke={frame} strokeWidth={3} />);
  for (let r = 1; r < rows; r++) lines.push(<path key={`r${r}`} d={`M${x + 4} ${y + (h * r) / rows} H${x + w - 4}`} stroke={frame} strokeWidth={3} />);
  return (
    <g>
      <path d={`M${x} ${y} h${w} v${h} h${-w} Z M${x + 4} ${y + 4} v${h - 8} h${w - 8} v${-(h - 8)} Z`} fill={frame} fillRule="evenodd" {...ln(line, 1.5)} />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={2} fill={warm ? u("glassWarm") : u("glass")} opacity={see ? 0.25 : 1} />
      <path d={`M${x + 8} ${y + h - 10} L${x + w * 0.55} ${y + 8} L${x + w * 0.72} ${y + 8} L${x + 18} ${y + h - 10} Z`} fill="#ffffff" opacity={0.28} />
      {lines}
      <rect x={x - 3} y={y + h - 2} width={w + 6} height={6} rx={2} fill={frame} {...ln(line, 1.2)} />
    </g>
  );
}

/** 문(아치형 또는 사각). (x, y) = 문 아래 가운데 */
export function Door({ x, y, w = 64, h = 120, arch = true, fill = "woodDark", line = "#5e3c28", glassTop = true, open = false, frame = "#f5ead6", frameLine = "#b9a383", double = false }: { x: number; y: number; w?: number; h?: number; arch?: boolean; fill?: string; line?: string; glassTop?: boolean; open?: boolean; frame?: string; frameLine?: string; double?: boolean }) {
  const hw = w / 2;
  const top = -h;
  const r = arch ? hw : 0;
  const outer = arch
    ? `M${-hw - 8} 0 V${top + r} A${hw + 8} ${hw + 8} 0 0 1 ${hw + 8} ${top + r} V0 Z`
    : `M${-hw - 8} 0 V${top - 8} H${hw + 8} V0 Z`;
  const inner = arch ? `M${-hw} 0 V${top + r} A${hw} ${hw} 0 0 1 ${hw} ${top + r} V0 Z` : `M${-hw} 0 V${top} H${hw} V0 Z`;
  return (
    <g transform={T(x, y)}>
      <path d={outer} fill={frame} {...ln(frameLine, 1.6)} />
      <path d={inner} fill={open ? "#ffe8b8" : u(fill)} {...ln(line, 1.5)} />
      {open && <path d={inner} fill={u("glow")} />}
      {!open && (
        <g>
          {double && <path d={`M0 ${top + (arch ? 4 : 2)} V-2`} stroke={line} strokeWidth={1.6} />}
          {glassTop && (
            <path
              d={arch ? `M${-hw + 8} ${top + r + 6} A${hw - 8} ${hw - 8} 0 0 1 ${hw - 8} ${top + r + 6} Z` : `M${-hw + 8} ${top + 8} H${hw - 8} V${top + h * 0.35} H${-hw + 8} Z`}
              fill={u("glassWarm")}
              {...ln(line, 1.2)}
            />
          )}
          <rect x={-hw + 8} y={top + r + 16} width={double ? hw - 13 : w - 16} height={h * 0.28} rx={3} fill="none" stroke="rgba(255,230,200,0.35)" strokeWidth={1.5} />
          {double && <rect x={5} y={top + r + 16} width={hw - 13} height={h * 0.28} rx={3} fill="none" stroke="rgba(255,230,200,0.35)" strokeWidth={1.5} />}
          <rect x={-hw + 8} y={-h * 0.36} width={double ? hw - 13 : w - 16} height={h * 0.26} rx={3} fill="none" stroke="rgba(255,230,200,0.3)" strokeWidth={1.5} />
          {double && <rect x={5} y={-h * 0.36} width={hw - 13} height={h * 0.26} rx={3} fill="none" stroke="rgba(255,230,200,0.3)" strokeWidth={1.5} />}
          <circle cx={double ? -6 : hw - 10} cy={-h * 0.45} r={3.4} fill="#f6d77a" {...ln("#b98429", 1)} />
          {double && <circle cx={6} cy={-h * 0.45} r={3.4} fill="#f6d77a" {...ln("#b98429", 1)} />}
          <path d={`M${hw - 4} ${top + r} V-4`} stroke="rgba(30,15,5,0.22)" strokeWidth={6} />
        </g>
      )}
    </g>
  );
}

/** 문 위 명판 */
export function Plaque({ x, y, text, w, fill = "cream", color = "#5a3a24", line = "#c4ab86", size = 12 }: { x: number; y: number; text: string; w?: number; fill?: string; color?: string; line?: string; size?: number }) {
  const ww = w ?? text.length * size * 0.95 + 24;
  return (
    <g filter={u("drop")}>
      <rect x={x - ww / 2} y={y - 12} width={ww} height={24} rx={8} fill={fill.startsWith("#") ? fill : u(fill)} {...ln(line, 1.4)} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={FONT} fontSize={size} fontWeight={800} fill={color}>
        {text}
      </text>
    </g>
  );
}

export function Steps({ x, y, w, n = 3, sh = 7, depth = 6, fill = "stone", line = "#b2a48d" }: { x: number; y: number; w: number; n?: number; sh?: number; depth?: number; fill?: string; line?: string }) {
  return (
    <g>
      {[...Array(n)].map((_, i) => {
        const ww = w + (n - 1 - i) * 0 + i * depth * 2;
        const yy = y - (n - i) * sh;
        return (
          <g key={i}>
            <rect x={x - ww / 2} y={yy} width={ww} height={sh + 1} rx={2} fill={u(fill)} {...ln(line, 1.3)} />
            <path d={`M${x - ww / 2 + 3} ${yy + 1.5} H${x + ww / 2 - 3}`} stroke="#ffffff" strokeWidth={1.3} opacity={0.6} />
          </g>
        );
      })}
    </g>
  );
}

export function Awning({ x, y, w, c1 = "#3f8f78", c2 = "#fff7ea", line = "#2f6b5d", depth = 26 }: { x: number; y: number; w: number; c1?: string; c2?: string; line?: string; depth?: number }) {
  const n = Math.round(w / 20);
  const sw = w / n;
  const stripes: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    stripes.push(<path key={i} d={`M${x + i * sw + 6} ${y} L${x + (i + 1) * sw + 6} ${y} L${x + (i + 1) * sw - 4 + 4} ${y + depth} L${x + i * sw - 4 + 4} ${y + depth} Z`} fill={i % 2 ? c2 : c1} />);
  }
  let scal = `M${x - 2} ${y + depth}`;
  for (let i = 0; i < n; i++) scal += ` Q${x + i * sw + sw / 2} ${y + depth + 12} ${x + (i + 1) * sw} ${y + depth}`;
  return (
    <g filter={u("drop")}>
      <path d={`M${x + 6} ${y} H${x + w + 6} L${x + w} ${y + depth} H${x - 2} Z`} fill={c2} {...ln(line, 1.5)} />
      {stripes}
      <path d={`${scal} L${x + w} ${y + depth} Z`} fill={c1} {...ln(line, 1.4)} />
      <path d={`M${x + 6} ${y} H${x + w + 6} L${x + w} ${y + depth} H${x - 2} Z`} fill="none" {...ln(line, 1.5)} />
    </g>
  );
}

/* ───────────────────────── interior ───────────────────────── */

/** 실내 기본 쉘: 벽 + 몰딩 + 바닥(원근 판재) + 천장 띠 */
export function Room({ w, floorY = 420, wall, wallLine = "#d9c3a0", floor = "wood", wainscot, ceiling, wallPattern = true }: { w: number; floorY?: number; wall: string; wallLine?: string; floor?: "wood" | "birch" | "walnut" | "honey"; wainscot?: { y: number; fill: string; line: string }; ceiling?: string; wallPattern?: boolean }) {
  const floorFill = floor === "birch" ? "#ecd4ae" : floor === "walnut" ? "#a06c48" : floor === "honey" ? "#d9a873" : "#c99466";
  const floorFar = floor === "birch" ? "#dcc19a" : floor === "walnut" ? "#86563a" : floor === "honey" ? "#c48f5c" : "#b07d52";
  const seam = floor === "birch" ? "rgba(150,110,60,0.25)" : "rgba(90,50,25,0.28)";
  const vx = w / 2;
  const vy = floorY - 900;
  const seams: ReactNode[] = [];
  for (let i = -14; i <= 14; i++) {
    const bx = vx + i * (w / 11);
    const t = (floorY - vy) / (600 - vy);
    const topX = vx + (bx - vx) * t;
    seams.push(<path key={`s${i}`} d={`M${topX} ${floorY} L${bx} 600`} stroke={seam} strokeWidth={1.2} />);
  }
  const rows: ReactNode[] = [];
  let yy = floorY + 14;
  let gap = 14;
  let k = 0;
  while (yy < 600) {
    rows.push(<path key={`r${k}`} d={`M0 ${yy} H${w}`} stroke={seam} strokeWidth={1} opacity={0.7} />);
    gap *= 1.22;
    yy += gap;
    k++;
  }
  return (
    <g>
      <rect width={w} height={floorY} fill={wall} />
      {wallPattern && <rect width={w} height={floorY} fill="url(#w3-wallPat)" />}
      {wainscot && (
        <g>
          <rect x={0} y={wainscot.y} width={w} height={floorY - wainscot.y} fill={wainscot.fill} />
          <rect x={0} y={wainscot.y - 6} width={w} height={8} fill="#fff7ea" opacity={0.85} />
          <path d={`M0 ${wainscot.y + 2} H${w}`} stroke={wainscot.line} strokeWidth={1.6} />
          {[...Array(Math.ceil(w / 90))].map((_, i) => (
            <rect key={i} x={i * 90 + 12} y={wainscot.y + 14} width={66} height={floorY - wainscot.y - 32} rx={4} fill="none" stroke={wainscot.line} strokeWidth={1.4} opacity={0.5} />
          ))}
        </g>
      )}
      {ceiling && (
        <g>
          <rect width={w} height={30} fill={ceiling} />
          <rect y={28} width={w} height={6} fill="rgba(60,30,10,0.18)" />
        </g>
      )}
      {/* floor */}
      <rect y={floorY} width={w} height={600 - floorY} fill={floorFill} />
      <rect y={floorY} width={w} height={40} fill={floorFar} opacity={0.6} />
      {seams}
      {rows}
      <rect y={floorY} width={w} height={600 - floorY} fill={u("bloom")} opacity={0.6} />
      {/* baseboard */}
      <rect x={0} y={floorY - 14} width={w} height={14} fill="#fff7ea" />
      <path d={`M0 ${floorY - 14} H${w}`} stroke={wallLine} strokeWidth={1.5} />
      <rect x={0} y={floorY} width={w} height={6} fill="rgba(40,25,10,0.16)" />
    </g>
  );
}

/** 실내 출구 문(왼쪽) + 발매트 */
export function ExitDoor({ x = 60, floorY = 420, tone = "wood", label = "나가기" }: { x?: number; floorY?: number; tone?: "wood" | "birch" | "glass"; label?: string }) {
  const fill = tone === "birch" ? "birch" : tone === "glass" ? "glass" : "woodDark";
  const line = tone === "birch" ? "#a9835a" : tone === "glass" ? "#6f8ea4" : "#5e3c28";
  return (
    <g>
      <Door x={x} y={floorY - 2} w={70} h={176} arch={tone === "wood"} fill={fill} line={line} glassTop={tone !== "glass"} frame={tone === "birch" ? "#f6ead2" : "#f5ead6"} />
      {tone === "glass" && <path d={`M${x - 26} ${floorY - 150} L${x - 6} ${floorY - 170} M${x - 28} ${floorY - 120} L${x + 10} ${floorY - 160}`} stroke="#ffffff" strokeWidth={3} opacity={0.6} strokeLinecap="round" />}
      <g filter={u("drop")}>
        <rect x={x - 26} y={floorY - 214} width={52} height={20} rx={6} fill="#3f9e6f" {...ln("#2b7350", 1.2)} />
        <text x={x} y={floorY - 199.5} textAnchor="middle" fontFamily={FONT} fontSize={11} fontWeight={800} fill="#ffffff">
          {label}
        </text>
      </g>
      <path d={`M${x - 46} ${floorY + 14} L${x + 46} ${floorY + 14} L${x + 52} ${floorY + 30} L${x - 52} ${floorY + 30} Z`} fill={u("coral")} opacity={0.85} {...ln("#b85a45", 1.3)} />
      <path d={`M${x - 40} ${floorY + 22} H${x + 42}`} stroke="#ffd2c4" strokeWidth={1.4} strokeDasharray="4 4" />
    </g>
  );
}

/** 책장. (x,y) 아래 가운데. tone: walnut(서울) / birch(글로벌) */
export function Bookshelf({ x, y, w, h, shelves = 5, tone = "walnut", seed = 1, plants = false, crown = true }: { x: number; y: number; w: number; h: number; shelves?: number; tone?: "walnut" | "birch" | "wood"; seed?: number; plants?: boolean; crown?: boolean }) {
  const r = rng(seed);
  const frame = tone === "birch" ? u("birch") : tone === "wood" ? u("wood") : u("walnut");
  const fl = tone === "birch" ? "#a9835a" : tone === "wood" ? "#8a5a3b" : "#4a2b1a";
  const back = tone === "birch" ? "#e6d2b0" : tone === "wood" ? "#8e5f3e" : "#4f3020";
  const colors = tone === "birch" ? ["#9fc7b0", "#e9c46a", "#f4a99a", "#8fb8de", "#e8ddc8", "#b7a3d6", "#7fb07a"] : ["#b5523f", "#3f6f8f", "#d9a441", "#4f8a5f", "#8a4f6f", "#e6d3b0", "#c97a4a", "#2f5a6f"];
  const x0 = x - w / 2;
  const top = y - h;
  const sh = (h - 22) / shelves;
  const items: ReactNode[] = [];
  for (let sI = 0; sI < shelves; sI++) {
    const by = top + 12 + (sI + 1) * sh;
    let bx = x0 + 12;
    let k = 0;
    while (bx < x0 + w - 18) {
      const roll = r();
      if (plants && roll < 0.1 && bx < x0 + w - 40) {
        items.push(<PottedPlant key={`p${sI}-${k}`} x={bx + 14} y={by} s={0.42} kind="round" pot="white" />);
        bx += 30;
      } else if (roll < 0.2 && bx < x0 + w - 40) {
        // leaning / stacked
        const bw = 22 + r() * 10;
        for (let j = 0; j < 3; j++) items.push(<rect key={`st${sI}-${k}-${j}`} x={bx + j} y={by - 7 * (j + 1)} width={bw - j * 2} height={6.5} rx={1.5} fill={colors[Math.floor(r() * colors.length)]} {...ln("rgba(40,20,10,0.35)", 0.8)} />);
        bx += bw + 4;
      } else {
        const bw = 8 + r() * 7;
        const bh = sh * (0.55 + r() * 0.32);
        const c = colors[Math.floor(r() * colors.length)];
        const tilt = roll > 0.92 ? 8 : 0;
        items.push(
          <g key={`b${sI}-${k}`} transform={tilt ? `rotate(${tilt} ${bx + bw} ${by})` : undefined}>
            <rect x={bx} y={by - bh} width={bw} height={bh} rx={1.5} fill={c} {...ln("rgba(40,20,10,0.35)", 0.8)} />
            <path d={`M${bx + 1.5} ${by - bh + 5} H${bx + bw - 1.5} M${bx + 1.5} ${by - 6} H${bx + bw - 1.5}`} stroke="#fff3d6" strokeWidth={1} opacity={0.55} />
            <path d={`M${bx + 2} ${by - bh + 3} V${by - 3}`} stroke="#ffffff" strokeWidth={1.2} opacity={0.25} />
          </g>,
        );
        bx += bw + 0.8;
      }
      k++;
    }
  }
  return (
    <g>
      <Shadow x={x + 8} y={y} rx={w / 2 + 8} ry={7} />
      <rect x={x0} y={top} width={w} height={h} rx={4} fill={frame} {...ln(fl, 1.7)} />
      <rect x={x0 + 9} y={top + 12} width={w - 18} height={h - 22} fill={back} />
      <rect x={x0 + 9} y={top + 12} width={w - 18} height={h - 22} fill="rgba(0,0,0,0.12)" />
      {items}
      {[...Array(shelves)].map((_, i) => (
        <g key={i}>
          <rect x={x0 + 6} y={top + 12 + (i + 1) * sh - 1} width={w - 12} height={7} rx={1} fill={frame} {...ln(fl, 1)} />
          <rect x={x0 + 9} y={top + 12 + (i + 1) * sh + 6} width={w - 18} height={4} fill="rgba(0,0,0,0.16)" />
        </g>
      ))}
      {crown && <rect x={x0 - 6} y={top - 8} width={w + 12} height={14} rx={4} fill={frame} {...ln(fl, 1.6)} />}
      <path d={`M${x0 + 4} ${top + 4} V${y - 6}`} stroke="#ffffff" strokeWidth={2} opacity={0.18} />
      <rect x={x0 + w - 10} y={top + 6} width={7} height={h - 10} fill="rgba(0,0,0,0.12)" />
    </g>
  );
}

/** 책상/테이블 (정면). (x,y)=아래 가운데, top = 상판 높이 */
export function Table({ x, y, w, top, tone = "wood", legs = "four", cloth }: { x: number; y: number; w: number; top: number; tone?: "wood" | "walnut" | "birch" | "white"; legs?: "four" | "pedestal"; cloth?: string }) {
  const f = tone === "walnut" ? u("walnut") : tone === "birch" ? u("birch") : tone === "white" ? u("cream") : u("wood");
  const l = tone === "walnut" ? "#4a2b1a" : tone === "birch" ? "#a9835a" : tone === "white" ? "#c4ab86" : "#8a5a3b";
  const ty = y - top;
  return (
    <g>
      <Shadow x={x + 6} y={y} rx={w / 2 + 6} ry={7} />
      {legs === "four" ? (
        <g fill={f} {...ln(l, 1.5)}>
          <rect x={x - w / 2 + 10} y={ty} width={10} height={top} rx={3} />
          <rect x={x + w / 2 - 20} y={ty} width={10} height={top} rx={3} />
          <rect x={x - w / 2 + 16} y={ty + 8} width={w - 32} height={10} rx={2} opacity={0.9} />
        </g>
      ) : (
        <g fill={f} {...ln(l, 1.5)}>
          <rect x={x - 6} y={ty} width={12} height={top - 6} rx={3} />
          <ellipse cx={x} cy={y - 3} rx={w * 0.26} ry={5} />
        </g>
      )}
      <path d={`M${x - w / 2 - 6} ${ty - 10} L${x + w / 2 + 6} ${ty - 10} L${x + w / 2} ${ty + 4} L${x - w / 2} ${ty + 4} Z`} fill={f} {...ln(l, 1.6)} />
      <path d={`M${x - w / 2 - 2} ${ty - 8} H${x + w / 2 + 2}`} stroke="#ffffff" strokeWidth={1.6} opacity={0.45} />
      {cloth && <path d={`M${x - w * 0.3} ${ty - 10} H${x + w * 0.3} L${x + w * 0.28} ${ty + 14} Q${x} ${ty + 20} ${x - w * 0.28} ${ty + 14} Z`} fill={cloth} opacity={0.9} />}
      <rect x={x - w / 2} y={ty + 4} width={w} height={4} fill="rgba(40,20,10,0.16)" />
    </g>
  );
}

export function Chair({ x, y, s = 1, tone = "wood", back = true, flip = false, seat }: { x: number; y: number; s?: number; tone?: "wood" | "walnut" | "birch"; back?: boolean; flip?: boolean; seat?: string }) {
  const f = tone === "walnut" ? u("walnut") : tone === "birch" ? u("birch") : u("wood");
  const l = tone === "walnut" ? "#4a2b1a" : tone === "birch" ? "#a9835a" : "#8a5a3b";
  return (
    <g transform={T(x, y, s, flip)}>
      <Shadow x={4} y={0} rx={22} ry={4} />
      <g fill={f} {...ln(l, 1.4)}>
        <rect x={-18} y={-40} width={6} height={40} rx={2} />
        <rect x={12} y={-40} width={6} height={40} rx={2} />
        {back && <rect x={-18} y={-86} width={6} height={50} rx={2} />}
        {back && <rect x={-18} y={-88} width={34} height={22} rx={7} />}
        <rect x={-22} y={-46} width={44} height={10} rx={4} fill={seat ?? f} />
      </g>
    </g>
  );
}

export function DeskLamp({ x, y, s = 1, on = true, kind = "banker" }: { x: number; y: number; s?: number; on?: boolean; kind?: "banker" | "mushroom" | "arm" }) {
  return (
    <g transform={T(x, y, s)}>
      {on && <circle cx={0} cy={-24} r={90} fill={u("glow")} className="w3-glow" />}
      {kind === "banker" && (
        <g>
          <ellipse cx={0} cy={-2} rx={22} ry={5} fill="#c9a35a" {...ln("#8f6c2c", 1.3)} />
          <rect x={-3} y={-34} width={6} height={32} fill="#d8b36a" {...ln("#8f6c2c", 1.1)} />
          <path d="M-34 -32 Q-34 -54 0 -56 Q34 -54 34 -32 Z" fill="#3f8a62" {...ln("#2a6045", 1.5)} />
          <path d="M-26 -38 Q-20 -50 0 -52" stroke="#9fe0b8" strokeWidth={2.4} fill="none" opacity={0.7} />
          <rect x={-34} y={-34} width={68} height={5} rx={2} fill={on ? "#fff1b8" : "#d8c9a6"} />
          <path d="M18 -10 v-14" stroke="#d8b36a" strokeWidth={1.6} />
          <circle cx={18} cy={-8} r={2.4} fill="#d8b36a" />
        </g>
      )}
      {kind === "mushroom" && (
        <g>
          <path d="M-14 0 Q0 -6 14 0 Z" fill={u("birch")} {...ln("#a9835a", 1.2)} />
          <rect x={-5} y={-34} width={10} height={32} rx={4} fill={u("birch")} {...ln("#a9835a", 1.2)} />
          <path d="M-30 -32 Q-28 -64 0 -66 Q28 -64 30 -32 Z" fill={on ? "#fff3cf" : "#ece3d2"} {...ln("#c4ab86", 1.5)} />
          <path d="M-22 -40 Q-18 -56 -4 -60" stroke="#ffffff" strokeWidth={2.4} fill="none" opacity={0.8} />
        </g>
      )}
      {kind === "arm" && (
        <g>
          <ellipse cx={0} cy={-2} rx={16} ry={4} fill="#5b6f84" {...ln("#3b4b5c", 1.2)} />
          <path d="M0 -2 L-10 -40 L18 -58" stroke="#5b6f84" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M10 -66 L34 -52 L24 -40 Z" fill="#14a3a3" {...ln("#0f7f7f", 1.3)} />
        </g>
      )}
      {on && kind !== "arm" && <path d={kind === "banker" ? "M-34 -30 L34 -30 L64 6 L-64 6 Z" : "M-30 -32 L30 -32 L60 6 L-60 6 Z"} fill="#fff3c4" opacity={0.28} />}
    </g>
  );
}

export function OpenBook({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={T(x, y, s)}>
      <path d="M-34 0 L-30 -10 Q-15 -14 0 -8 Q15 -14 30 -10 L34 0 Q15 -4 0 2 Q-15 -4 -34 0 Z" fill="#8a4f3f" {...ln("#5e3326", 1.2)} />
      <path d="M-30 -4 Q-15 -16 0 -6 L0 -2 Q-15 -8 -30 -2 Z" fill="#fffaf0" {...ln("#c4ab86", 1)} />
      <path d="M30 -4 Q15 -16 0 -6 L0 -2 Q15 -8 30 -2 Z" fill="#f5ecdc" {...ln("#c4ab86", 1)} />
      <path d="M-24 -8 Q-14 -12 -4 -8 M-24 -5 Q-14 -9 -4 -5 M4 -8 Q14 -12 24 -8 M4 -5 Q14 -9 22 -5" stroke="#b9a383" strokeWidth={0.9} fill="none" />
    </g>
  );
}

export function BookStack({ x, y, s = 1, colors = ["#3f6f8f", "#d9a441", "#b5523f"] }: { x: number; y: number; s?: number; colors?: string[] }) {
  return (
    <g transform={T(x, y, s)}>
      {colors.map((c, i) => (
        <g key={i}>
          <rect x={-18 + (i % 2) * 3} y={-8 * (i + 1)} width={34 - i * 3} height={7.5} rx={1.5} fill={c} {...ln("rgba(40,20,10,0.4)", 0.9)} />
          <path d={`M${-16 + (i % 2) * 3} ${-8 * (i + 1) + 2} H${12 - i * 3}`} stroke="#fff3d6" strokeWidth={1} opacity={0.6} />
        </g>
      ))}
    </g>
  );
}

export function Laptop({ x, y, s = 1, screen = "chart", flip = false }: { x: number; y: number; s?: number; screen?: "chart" | "table"; flip?: boolean }) {
  return (
    <g transform={T(x, y, s, flip)}>
      <path d="M-30 0 L30 0 L34 -4 L-26 -4 Z" fill={u("metal")} {...ln("#8a96a6", 1.2)} />
      <path d="M-24 -4 L-18 -42 L30 -42 L28 -4 Z" fill="#5b6f84" {...ln("#3b4b5c", 1.4)} />
      <path d="M-20 -7 L-15 -38 L27 -38 L25 -7 Z" fill="#dff3ff" />
      {screen === "chart" ? (
        <g>
          <rect x={-12} y={-24} width={6} height={14} fill="#14a3a3" />
          <rect x={-2} y={-30} width={6} height={20} fill="#f4a64a" />
          <rect x={8} y={-20} width={6} height={10} fill="#14a3a3" />
          <rect x={18} y={-27} width={4} height={17} fill="#f4a64a" />
        </g>
      ) : (
        <g stroke="#8fb0c8" strokeWidth={1.2}>
          <path d="M-14 -32 H24 M-15 -26 H23 M-16 -20 H22 M-16 -14 H21" />
          <path d="M3 -34 L1 -10" />
        </g>
      )}
      <path d="M-14 -36 L-4 -36 L-16 -12 Z" fill="#ffffff" opacity={0.4} />
      <circle cx={6} cy={-40} r={1} fill="#9ff0e8" className="w3-twinkle" />
    </g>
  );
}

export function Mug({ x, y, s = 1, c = "#fffaf2", steam = true }: { x: number; y: number; s?: number; c?: string; steam?: boolean }) {
  return (
    <g transform={T(x, y, s)}>
      {steam && (
        <g className="w3-steam" opacity={0.7}>
          <path d="M-3 -16 q-4 -6 0 -12 q4 -6 0 -12" stroke="#ffffff" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M4 -18 q-3 -5 0 -10 q3 -5 0 -9" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      )}
      <path d="M8 -12 q8 0 8 5 q0 5 -8 5" stroke="#d9c7aa" strokeWidth={2.4} fill="none" />
      <path d="M-9 -14 L9 -14 L8 0 L-8 0 Z" fill={c} {...ln("#c4ab86", 1.2)} />
      <ellipse cx={0} cy={-14} rx={9} ry={2.4} fill="#8a5a3b" />
    </g>
  );
}

export function PendantLight({ x, y = 0, len, s = 1, kind = "dome", on = true }: { x: number; y?: number; len: number; s?: number; kind?: "dome" | "rattan" | "bulb" | "glass"; on?: boolean }) {
  return (
    <g transform={T(x, y, s)}>
      <g className="w3-swing">
        <path d={`M0 0 V${len}`} stroke="#5a4a3e" strokeWidth={1.5} />
        {on && <circle cx={0} cy={len + 26} r={70} fill={u("glowSoft")} />}
        {kind === "dome" && (
          <g>
            <path d={`M-26 ${len + 22} Q-24 ${len} 0 ${len} Q24 ${len} 26 ${len + 22} Z`} fill={u("teal")} {...ln("#1f7d7b", 1.5)} />
            <path d={`M-18 ${len + 14} Q-14 ${len + 4} -4 ${len + 3}`} stroke="#bff0ea" strokeWidth={2} fill="none" />
          </g>
        )}
        {kind === "rattan" && (
          <g>
            <path d={`M-28 ${len + 26} Q-26 ${len} 0 ${len} Q26 ${len} 28 ${len + 26} Z`} fill={u("mustard")} {...ln("#a9802f", 1.5)} />
            <path d={`M-22 ${len + 14} H22 M-26 ${len + 21} H26 M-10 ${len + 4} V${len + 26} M10 ${len + 4} V${len + 26}`} stroke="#a9802f" strokeWidth={1} opacity={0.6} />
          </g>
        )}
        {kind === "glass" && (
          <g>
            <circle cx={0} cy={len + 16} r={16} fill="#fff6dc" opacity={0.6} {...ln("#c9b48a", 1.3)} />
            <rect x={-5} y={len - 2} width={10} height={5} rx={1.5} fill="#5a4a3e" />
          </g>
        )}
        <circle cx={0} cy={len + (kind === "glass" ? 18 : 24)} r={kind === "glass" ? 6 : 5} fill={on ? "#fff3c4" : "#e6dcc8"} />
      </g>
    </g>
  );
}

export function Rug({ x, y, rx, ry, c1, c2, line }: { x: number; y: number; rx: number; ry: number; c1: string; c2: string; line: string }) {
  return (
    <g>
      <ellipse cx={x + 4} cy={y + 4} rx={rx + 2} ry={ry + 2} fill="rgba(40,25,10,0.14)" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={c1} {...ln(line, 1.6)} />
      <ellipse cx={x} cy={y} rx={rx * 0.82} ry={ry * 0.78} fill="none" stroke={c2} strokeWidth={5} opacity={0.8} />
      <ellipse cx={x} cy={y} rx={rx * 0.6} ry={ry * 0.55} fill="none" stroke={c2} strokeWidth={2} strokeDasharray="8 6" opacity={0.7} />
      <ellipse cx={x - rx * 0.25} cy={y - ry * 0.3} rx={rx * 0.4} ry={ry * 0.2} fill="#ffffff" opacity={0.12} />
    </g>
  );
}

export function WallClock({ x, y, r = 18, tone = "#fff7ea", rim = "#8a5a3b" }: { x: number; y: number; r?: number; tone?: string; rim?: string }) {
  return (
    <g filter={u("drop")}>
      <circle cx={x} cy={y} r={r} fill={tone} stroke={rim} strokeWidth={3.5} />
      {[0, 90, 180, 270].map((a) => (
        <circle key={a} cx={x + Math.sin((a * Math.PI) / 180) * (r - 5)} cy={y - Math.cos((a * Math.PI) / 180) * (r - 5)} r={1.4} fill={rim} />
      ))}
      <path d={`M${x} ${y} L${x} ${y - r * 0.6} M${x} ${y} L${x + r * 0.45} ${y + r * 0.1}`} stroke="#4a3a30" strokeWidth={2} strokeLinecap="round" />
      <circle cx={x} cy={y} r={1.8} fill="#d85b4a" />
    </g>
  );
}

export function Frame({ x, y, w, h, fill = "#c9a35a", line = "#8f6c2c", children }: { x: number; y: number; w: number; h: number; fill?: string; line?: string; children?: ReactNode }) {
  return (
    <g filter={u("drop")}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} {...ln(line, 1.5)} />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx={1} fill="#fffaf0" {...ln(line, 1)} />
      {children}
      <path d={`M${x + 3} ${y + 3} H${x + w - 3}`} stroke="#ffffff" strokeWidth={1.4} opacity={0.5} />
    </g>
  );
}

export function StickyNote({ x, y, c, r = 0, w = 30, pin = "#e2604c", blank = false }: { x: number; y: number; c: string; r?: number; w?: number; pin?: string; blank?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x={-w / 2 + 1.5} y={-w / 2 + 2.5} width={w} height={w} rx={2} fill="rgba(60,30,10,0.18)" />
      <rect x={-w / 2} y={-w / 2} width={w} height={w} rx={2} fill={c} {...ln("rgba(120,90,50,0.3)", 0.8)} />
      {!blank && <path d={`M${-w / 2 + 5} ${-w / 2 + 11} H${w / 2 - 5} M${-w / 2 + 5} ${-w / 2 + 17} H${w / 2 - 9}`} stroke="#8a7a66" strokeWidth={1.3} opacity={0.55} />}
      <path d={`M${w / 2 - 8} ${w / 2} L${w / 2} ${w / 2 - 8} L${w / 2} ${w / 2} Z`} fill="rgba(0,0,0,0.1)" />
      <circle cx={0} cy={-w / 2 + 3} r={2.8} fill={pin} />
      <circle cx={-0.8} cy={-w / 2 + 2.2} r={0.9} fill="#ffffff" opacity={0.8} />
    </g>
  );
}

export function Globe({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={4} y={0} rx={34} ry={6} />
      <path d="M-30 0 L-8 -44 M30 0 L8 -44 M0 0 L0 -44" stroke="#a9835a" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={0} cy={-2} rx={30} ry={5} fill={u("birch")} {...ln("#a9835a", 1.3)} />
      <rect x={-12} y={-52} width={24} height={10} rx={4} fill={u("birch")} {...ln("#a9835a", 1.3)} />
      <circle cx={0} cy={-96} r={44} fill="none" stroke="#c9a35a" strokeWidth={5} />
      <circle cx={0} cy={-96} r={38} fill="#7cc4e8" {...ln("#3f8fb8", 1.6)} />
      <path d="M-24 -118 Q-10 -128 2 -120 Q8 -108 -4 -104 Q-16 -96 -22 -104 Z M8 -96 Q22 -100 28 -86 Q24 -72 12 -70 Q4 -80 8 -96 Z M-30 -86 Q-22 -80 -20 -70 Q-28 -72 -34 -80 Z" fill="#9fd67a" {...ln("#5aa85a", 1.1)} />
      <ellipse cx={-14} cy={-112} rx={12} ry={7} fill="#ffffff" opacity={0.45} transform="rotate(-30 -14 -112)" />
      <path d="M0 -140 V-52" stroke="#c9a35a" strokeWidth={2.4} />
    </g>
  );
}

/** 바깥 숲 풍경(창문 안쪽용). 창 영역을 clipPath 로 자른다 */
export function ForestView({ id, x, y, w, h, lake = false, hills = false }: { id: string; x: number; y: number; w: number; h: number; lake?: boolean; hills?: boolean }) {
  const cid = `w3-clip-${id}`;
  return (
    <g>
      <clipPath id={cid}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${cid})`}>
        <rect x={x} y={y} width={w} height={h} fill={u("skyFresh")} />
        <Cloud x={x + w * 0.3} y={y + h * 0.2} s={0.6} />
        <Ridge w={w} base={y + h} pts={[y + h * 0.5, y + h * 0.38, y + h * 0.45, y + h * 0.33, y + h * 0.42]} fill="#a9cfc0" o={0.9} />
        <g transform={`translate(${x} 0)`}>
          <Ridge w={w} base={y + h} pts={[y + h * 0.6, y + h * 0.5, y + h * 0.56, y + h * 0.48, y + h * 0.55, y + h * 0.5]} fill={hills ? "#9fcf86" : "#82b98a"} />
          {!hills && <ForestBand w={w} y={y + h * 0.72} h={h * 0.16} color="#5f9e6e" seed={9} pointy />}
          {hills && <ForestBand w={w} y={y + h * 0.78} h={h * 0.1} color="#78b46f" seed={4} />}
          {lake && <rect x={0} y={y + h * 0.8} width={w} height={h * 0.2} fill={u("water")} />}
          {lake && <path d={`M${w * 0.1} ${y + h * 0.86} H${w * 0.3} M${w * 0.5} ${y + h * 0.9} H${w * 0.7}`} stroke="#ffffff" strokeWidth={2} opacity={0.6} className="w3-shimmer" />}
          {!lake && <rect x={0} y={y + h * 0.84} width={w} height={h * 0.16} fill="#8cc874" />}
        </g>
      </g>
    </g>
  );
}

export function Sofa({ x, y, w = 240, s = 1, c = "#f0a58e", line = "#c4705c", hi = "#ffd2c4" }: { x: number; y: number; w?: number; s?: number; c?: string; line?: string; hi?: string }) {
  const hw = w / 2;
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={6} y={0} rx={hw + 14} ry={9} />
      <rect x={-hw + 6} y={-8} width={10} height={8} rx={2} fill="#8a5a3b" />
      <rect x={hw - 16} y={-8} width={10} height={8} rx={2} fill="#8a5a3b" />
      <rect x={-hw + 14} y={-96} width={w - 28} height={60} rx={20} fill={c} {...ln(line, 1.7)} />
      <path d={`M0 -92 V-42`} stroke={line} strokeWidth={1.4} opacity={0.5} />
      <rect x={-hw + 4} y={-52} width={w - 8} height={44} rx={14} fill={c} {...ln(line, 1.7)} />
      <path d={`M0 -50 V-12`} stroke={line} strokeWidth={1.4} opacity={0.5} />
      <rect x={-hw - 8} y={-70} width={30} height={64} rx={14} fill={c} {...ln(line, 1.7)} />
      <rect x={hw - 22} y={-70} width={30} height={64} rx={14} fill={c} {...ln(line, 1.7)} />
      <path d={`M${-hw + 28} -86 Q${-hw / 2} -92 -10 -88`} stroke={hi} strokeWidth={3} fill="none" opacity={0.8} strokeLinecap="round" />
      <path d={`M${-hw + 16} -46 H${hw - 20}`} stroke={hi} strokeWidth={2.4} opacity={0.6} strokeLinecap="round" />
      <rect x={-hw + 4} y={-22} width={w - 8} height={14} rx={7} fill="rgba(80,30,20,0.12)" />
      {/* cushions */}
      <rect x={-hw + 26} y={-80} width={36} height={32} rx={10} fill="#fff1d6" transform={`rotate(-8 ${-hw + 44} -64)`} {...ln("#d9b98a", 1.3)} />
      <rect x={hw - 64} y={-80} width={36} height={32} rx={10} fill={u("teal")} transform={`rotate(8 ${hw - 46} -64)`} {...ln("#1f7d7b", 1.3)} />
    </g>
  );
}

export function VendingMachine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const cans = ["#e2604c", "#14a3a3", "#f4c94a", "#7cc96b", "#8fb8de", "#f6a3b8"];
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={6} y={0} rx={70} ry={9} />
      <circle cx={-10} cy={-180} r={110} fill={u("glowSoft")} opacity={0.6} />
      <rect x={-60} y={-286} width={120} height={286} rx={12} fill="#3f9e9a" {...ln("#226f6c", 1.8)} />
      <rect x={60} y={-280} width={12} height={276} rx={4} fill="#2a7b78" {...ln("#226f6c", 1.4)} />
      <path d="M-52 -280 V-12" stroke="#8fe0da" strokeWidth={2} opacity={0.6} />
      <rect x={-50} y={-270} width={78} height={170} rx={6} fill="#eaf8ff" {...ln("#226f6c", 1.4)} />
      {[0, 1, 2, 3].map((row) => (
        <g key={row}>
          {[0, 1, 2, 3].map((col) => (
            <g key={col}>
              <rect x={-44 + col * 18} y={-262 + row * 40} width={12} height={26} rx={4} fill={cans[(row * 4 + col) % cans.length]} {...ln("rgba(40,40,60,0.35)", 0.8)} />
              <rect x={-42 + col * 18} y={-258 + row * 40} width={3} height={16} rx={1.5} fill="#ffffff" opacity={0.6} />
            </g>
          ))}
          <rect x={-48} y={-234 + row * 40} width={74} height={4} fill="#c3d6e2" />
          {[0, 1, 2, 3].map((col) => (
            <rect key={`p${col}`} x={-44 + col * 18} y={-229 + row * 40} width={12} height={5} rx={1} fill="#ffffff" />
          ))}
        </g>
      ))}
      <path d="M-46 -266 L-20 -266 L-46 -150 Z" fill="#ffffff" opacity={0.3} />
      {/* panel */}
      <rect x={32} y={-266} width={20} height={70} rx={4} fill="#2a7b78" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={42} cy={-254 + i * 12} r={3.4} fill={i === 1 ? "#ffd86b" : "#bdeee9"} className={i === 1 ? "w3-twinkle" : undefined} />
      ))}
      <rect x={34} y={-186} width={16} height={6} rx={2} fill="#1a4f4d" />
      {/* tray */}
      <rect x={-46} y={-80} width={74} height={34} rx={6} fill="#1a4f4d" {...ln("#123b39", 1.2)} />
      <rect x={-40} y={-74} width={62} height={8} rx={3} fill="#2a6b69" />
      <rect x={-30} y={-90} width={60} height={4} rx={2} fill="#8fe0da" opacity={0.7} />
      <text x={-11} y={-28} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={800} fill="#ffffff">
        DRINK
      </text>
    </g>
  );
}

/** 우편함 스타일 질문함 */
export function Mailbox({ x, y, s = 1, kind = "post", label = "질문함" }: { x: number; y: number; s?: number; kind?: "post" | "birdhouse"; label?: string }) {
  if (kind === "birdhouse") {
    return (
      <g transform={T(x, y, s)}>
        <Shadow x={4} y={0} rx={26} ry={5} />
        <rect x={-5} y={-74} width={10} height={74} rx={3} fill={u("birch")} {...ln("#a9835a", 1.4)} />
        <path d="M-14 0 L14 0 L8 -8 L-8 -8 Z" fill={u("birch")} {...ln("#a9835a", 1.2)} />
        <rect x={-30} y={-120} width={60} height={48} rx={5} fill={u("sage")} {...ln("#6f8f66", 1.6)} />
        <path d="M30 -120 L36 -116 L36 -74 L30 -72 Z" fill="#8fae86" {...ln("#6f8f66", 1.2)} />
        <path d="M-40 -116 L0 -150 L40 -116 L34 -112 L0 -140 L-34 -112 Z" fill={u("wood")} {...ln("#8a5a3b", 1.6)} />
        <path d="M-34 -118 L0 -146" stroke="#f3d2a6" strokeWidth={1.6} opacity={0.7} />
        <rect x={-18} y={-110} width={36} height={6} rx={3} fill="#3e5d55" />
        <path d="M-6 -92 q-4 -6 0 -8 q2 -1 3 1 q1 -2 3 -1 q4 2 0 8 l-3 3 Z" fill="#e2604c" />
        <rect x={-22} y={-86} width={44} height={10} rx={3} fill="#fffaf2" opacity={0.9} />
        <text x={0} y={-78} textAnchor="middle" fontFamily={FONT} fontSize={8} fontWeight={800} fill="#3e5d55">
          {label}
        </text>
        <circle cx={22} cy={-130} r={3} fill="#f6a3b8" />
        <Flower x={-26} y={-112} c="#ffd27a" s={0.8} />
      </g>
    );
  }
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={4} y={0} rx={28} ry={5} />
      <rect x={-6} y={-60} width={12} height={60} rx={3} fill="#5b6f84" {...ln("#3b4b5c", 1.4)} />
      <path d="M-16 0 L16 0 L10 -8 L-10 -8 Z" fill="#5b6f84" {...ln("#3b4b5c", 1.2)} />
      <path d="M-32 -60 V-104 Q-32 -124 0 -124 Q32 -124 32 -104 V-60 Z" fill={u("coral")} {...ln("#b85a45", 1.7)} />
      <path d="M32 -104 L38 -100 V-62 L32 -60 Z" fill="#c4604c" />
      <path d="M-24 -100 Q-22 -116 -4 -118" stroke="#ffd2c4" strokeWidth={3} fill="none" opacity={0.8} strokeLinecap="round" />
      <rect x={-18} y={-106} width={36} height={6} rx={3} fill="#7a3426" />
      <rect x={-24} y={-90} width={48} height={18} rx={5} fill={u("cream")} {...ln("#d9b98a", 1.1)} />
      <text x={0} y={-77} textAnchor="middle" fontFamily={FONT} fontSize={10} fontWeight={800} fill="#a04434">
        {label}
      </text>
      <path d="M32 -112 H40 V-96 H34" fill="#ffd86b" stroke="#c99a3a" strokeWidth={1.2} />
      <path d="M-4 -66 q-5 -6 0 -9 q3 -1 4 1 q1 -2 4 -1 q5 3 0 9 l-4 3 Z" fill="#fff1d6" />
    </g>
  );
}

export function Whiteboard({ x, y, w, h, frame = "#c3ccd6", frameLine = "#8a96a6", title, children }: { x: number; y: number; w: number; h: number; frame?: string; frameLine?: string; title?: string; children?: ReactNode }) {
  return (
    <g filter={u("drop")}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={frame} {...ln(frameLine, 1.6)} />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx={3} fill={u("whiteboard")} />
      <path d={`M${x + 16} ${y + h - 14} L${x + w * 0.35} ${y + 12} L${x + w * 0.42} ${y + 12} L${x + 26} ${y + h - 14} Z`} fill="#ffffff" opacity={0.5} />
      {title && (
        <text x={x + w / 2} y={y + 28} textAnchor="middle" fontFamily={FONT} fontSize={13} fontWeight={800} fill="#2f5a7a">
          {title}
        </text>
      )}
      {children}
      <rect x={x + w * 0.2} y={y + h} width={w * 0.6} height={7} rx={2} fill={frame} {...ln(frameLine, 1.2)} />
      <rect x={x + w * 0.26} y={y + h - 3} width={18} height={5} rx={2} fill="#e2604c" />
      <rect x={x + w * 0.26 + 22} y={y + h - 3} width={18} height={5} rx={2} fill="#2f6fb0" />
      <rect x={x + w * 0.26 + 44} y={y + h - 3} width={18} height={5} rx={2} fill="#3f9e6f" />
    </g>
  );
}

/** 붉은 벽돌 건물 몸체(서울). x0 = 왼쪽, top = 몸체 윗변, base = 바닥선 */
export function BrickBuilding({ x0, top, w, base = 420, tone = "brick", roof = "slate", roofH = 34, children }: { x0: number; top: number; w: number; base?: number; tone?: "brick" | "brickDeep"; roof?: "slate" | "flat" | "gable"; roofH?: number; children?: ReactNode }) {
  const h = base - top;
  const x1 = x0 + w;
  return (
    <g>
      <Shadow x={x0 + w / 2 + 10} y={base} rx={w / 2 + 16} ry={10} o={0.2} />
      {roof === "slate" && (
        <g>
          <path d={`M${x0 - 4} ${top} L${x0 + 18} ${top - roofH} L${x1 - 18} ${top - roofH} L${x1 + 4} ${top} Z`} fill={u("slate")} {...ln("#2f4a43", 1.7)} />
          {[...Array(Math.floor((w - 40) / 16))].map((_, i) => (
            <path key={i} d={`M${x0 + 22 + i * 16} ${top - roofH + 3} L${x0 + 14 + i * 16 - (i - (w - 40) / 32) * 0.4} ${top - 2}`} stroke="#86a89c" strokeWidth={1} opacity={0.45} />
          ))}
          <path d={`M${x0 + 18} ${top - roofH + 2} H${x1 - 18}`} stroke="#a9c9bd" strokeWidth={2} opacity={0.7} />
        </g>
      )}
      {roof === "gable" && (
        <g>
          <path d={`M${x0 - 10} ${top + 2} L${x0 + w / 2} ${top - roofH} L${x1 + 10} ${top + 2} Z`} fill={u("slate")} {...ln("#2f4a43", 1.7)} />
          <path d={`M${x0 + 12} ${top - 2} L${x0 + w / 2} ${top - roofH + 14} L${x1 - 12} ${top - 2} Z`} fill={u("stone")} {...ln("#b2a48d", 1.4)} />
          <path d={`M${x0 - 6} ${top} L${x0 + w / 2} ${top - roofH + 3}`} stroke="#a9c9bd" strokeWidth={2} opacity={0.7} />
        </g>
      )}
      <rect x={x0} y={top} width={w} height={h} fill={u(tone)} {...ln("#8f4636", 1.7)} />
      <rect x={x0} y={top} width={w} height={h} fill="url(#w3-brickPat)" />
      <rect x={x1 - 14} y={top} width={14} height={h} fill="rgba(70,20,10,0.13)" />
      <rect x={x0 + 1} y={top} width={6} height={h} fill="#ffffff" opacity={0.1} />
      {/* cornice */}
      <rect x={x0 - 6} y={top - 4} width={w + 12} height={13} rx={2} fill={u("stone")} {...ln("#b2a48d", 1.4)} />
      {[...Array(Math.floor(w / 14))].map((_, i) => (
        <rect key={i} x={x0 + 4 + i * 14} y={top + 9} width={7} height={5} fill="#e6dccb" opacity={0.9} />
      ))}
      {children}
      {/* plinth */}
      <rect x={x0 - 3} y={base - 18} width={w + 6} height={18} fill={u("stoneGrey")} {...ln("#9e9584", 1.4)} />
      <path d={`M${x0} ${base - 16} H${x1}`} stroke="#ffffff" strokeWidth={1.4} opacity={0.6} />
    </g>
  );
}

/** 은행잎 하나 */
export function GinkgoLeaf({ x, y, r = 0, s = 1, c = "#f4c94a" }: { x: number; y: number; r?: number; s?: number; c?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
      d="M0 0 L0 -3 M0 -3 Q-7 -5 -7 -10 Q-3 -13 0 -9 Q3 -13 7 -10 Q7 -5 0 -3 Z"
      fill={c}
      stroke="#c9952f"
      strokeWidth={0.8}
      strokeLinejoin="round"
    />
  );
}

export function LeafScatter({ x0, x1, y0, y1, n, seed = 3, colors = ["#f4c94a", "#ffd86b", "#e9b43c"] }: { x0: number; x1: number; y0: number; y1: number; n: number; seed?: number; colors?: string[] }) {
  const r = rng(seed);
  return (
    <g>
      {[...Array(n)].map((_, i) => {
        const yy = y0 + r() * (y1 - y0);
        const t = (yy - y0) / Math.max(1, y1 - y0);
        return <GinkgoLeaf key={i} x={x0 + r() * (x1 - x0)} y={yy} r={r() * 360} s={0.8 + t * 0.7} c={colors[i % colors.length]} />;
      })}
    </g>
  );
}

/** 카페 카운터. x0 = 왼쪽, top = 상판 높이(y), base = 바닥 */
export function CafeCounter({ x0, w, top, base = 420, front = "wood" }: { x0: number; w: number; top: number; base?: number; front?: "wood" | "birch" | "teal" }) {
  const f = front === "birch" ? u("birch") : front === "teal" ? u("teal") : u("wood");
  const l = front === "birch" ? "#a9835a" : front === "teal" ? "#1f7d7b" : "#8a5a3b";
  return (
    <g>
      <Shadow x={x0 + w / 2 + 8} y={base} rx={w / 2 + 10} ry={8} />
      <rect x={x0} y={top + 10} width={w} height={base - top - 10} fill={f} {...ln(l, 1.7)} />
      {[...Array(Math.floor(w / 22))].map((_, i) => (
        <path key={i} d={`M${x0 + 14 + i * 22} ${top + 20} V${base - 10}`} stroke="rgba(80,40,10,0.22)" strokeWidth={2} />
      ))}
      {[...Array(Math.floor(w / 22))].map((_, i) => (
        <path key={`h${i}`} d={`M${x0 + 16 + i * 22} ${top + 22} V${base - 14}`} stroke="#ffffff" strokeWidth={1.2} opacity={0.22} />
      ))}
      <rect x={x0} y={base - 12} width={w} height={12} fill="rgba(50,25,10,0.22)" />
      <rect x={x0 + w - 12} y={top + 10} width={12} height={base - top - 10} fill="rgba(50,25,10,0.12)" />
      <rect x={x0 - 8} y={top} width={w + 16} height={14} rx={4} fill={u("stone")} {...ln("#b2a48d", 1.6)} />
      <path d={`M${x0 - 4} ${top + 3} H${x0 + w + 4}`} stroke="#ffffff" strokeWidth={1.6} opacity={0.8} />
    </g>
  );
}

export function CoffeeMachine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={T(x, y, s)}>
      <Shadow x={4} y={0} rx={44} ry={5} />
      <g className="w3-steam">
        <path d="M-16 -86 q-6 -10 0 -18 q6 -8 0 -18" stroke="#ffffff" strokeWidth={3.4} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d="M2 -88 q-5 -8 0 -15 q5 -7 0 -14" stroke="#ffffff" strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.7} />
      </g>
      {/* cups on top */}
      <rect x={-30} y={-90} width={14} height={10} rx={2} fill="#fffaf2" {...ln("#c4ab86", 1)} />
      <rect x={-12} y={-90} width={14} height={10} rx={2} fill="#fffaf2" {...ln("#c4ab86", 1)} />
      <rect x={-40} y={-82} width={80} height={80} rx={10} fill={u("metalH")} {...ln("#7d8a9a", 1.7)} />
      <rect x={-40} y={-82} width={80} height={14} rx={6} fill="#d85b4a" {...ln("#a8412f", 1.4)} />
      <path d="M-34 -78 H20" stroke="#ffb5a6" strokeWidth={2} opacity={0.8} />
      {/* gauges */}
      <circle cx={-20} cy={-56} r={8} fill="#fffaf2" {...ln("#7d8a9a", 1.3)} />
      <path d="M-20 -56 l4 -4" stroke="#d85b4a" strokeWidth={1.6} />
      <circle cx={20} cy={-56} r={8} fill="#fffaf2" {...ln("#7d8a9a", 1.3)} />
      <path d="M20 -56 l-4 -3" stroke="#d85b4a" strokeWidth={1.6} />
      {/* group heads */}
      <rect x={-26} y={-42} width={16} height={8} rx={2} fill="#5b6f84" />
      <rect x={10} y={-42} width={16} height={8} rx={2} fill="#5b6f84" />
      <path d="M-36 -34 H-26 M26 -34 H44" stroke="#5b6f84" strokeWidth={3} strokeLinecap="round" />
      {/* cup under */}
      <path d="M-24 -20 L-12 -20 L-13 -10 L-23 -10 Z" fill="#fffaf2" {...ln("#c4ab86", 1)} />
      <path d="M-18 -33 V-21" stroke="#8a5a3b" strokeWidth={2} />
      <rect x={-38} y={-10} width={76} height={6} rx={2} fill="#7d8a9a" />
      <path d="M-34 -76 L-34 -14" stroke="#ffffff" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
      <path d="M40 -80 L46 -76 L46 -4 L40 -2 Z" fill="#8e9aab" />
    </g>
  );
}

export function MenuBoard({ x, y, w, h, title = "MENU", lines }: { x: number; y: number; w: number; h: number; title?: string; lines: [string, string][] }) {
  return (
    <g filter={u("drop")}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={u("wood")} {...ln("#8a5a3b", 1.7)} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={3} fill={u("chalk")} />
      <path d={`M${x + 14} ${y + h - 18} L${x + w * 0.4} ${y + 14}`} stroke="#ffffff" strokeWidth={10} opacity={0.04} />
      <text x={x + w / 2} y={y + 32} textAnchor="middle" fontFamily={FONT} fontSize={16} fontWeight={900} fill="#ffe7a6" letterSpacing={2}>
        {title}
      </text>
      <path d={`M${x + w / 2 - 34} ${y + 40} q34 6 68 0`} stroke="#f6a3b8" strokeWidth={1.6} fill="none" />
      {lines.map(([a, b], i) => (
        <g key={i}>
          <text x={x + 18} y={y + 62 + i * 20} fontFamily={FONT} fontSize={11} fontWeight={700} fill="#f6f1e6">
            {a}
          </text>
          <text x={x + w - 18} y={y + 62 + i * 20} textAnchor="end" fontFamily={FONT} fontSize={11} fontWeight={700} fill="#9ff0e8">
            {b}
          </text>
        </g>
      ))}
      <g transform={`translate(${x + w - 30} ${y + 24})`}>
        <path d="M-7 -2 L7 -2 L6 8 L-6 8 Z" fill="none" stroke="#fff1d6" strokeWidth={1.3} />
        <path d="M7 0 q4 0 4 3 q0 3 -4 3" fill="none" stroke="#fff1d6" strokeWidth={1.2} />
        <path d="M-2 -6 q-2 -3 0 -5 M2 -6 q-2 -3 0 -5" stroke="#fff1d6" strokeWidth={1} fill="none" />
      </g>
    </g>
  );
}

/** 코르크/펠트 보드 + 포스트잇. kind: cork(서울) / felt(글로벌) */
export function Corkboard({ x, y, w, h, kind = "cork", title, children }: { x: number; y: number; w: number; h: number; kind?: "cork" | "felt"; title?: string; children?: ReactNode }) {
  const frame = kind === "cork" ? u("woodDark") : u("birch");
  const fl = kind === "cork" ? "#5e3c28" : "#a9835a";
  return (
    <g filter={u("drop")}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={frame} {...ln(fl, 1.7)} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={3} fill={kind === "cork" ? u("cork") : "#9fb9c4"} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={3} fill={kind === "cork" ? "url(#w3-corkPat)" : "url(#w3-feltPat)"} />
      <path d={`M${x + w - 8} ${y + 8} V${y + h - 8} H${x + 8}`} stroke="rgba(60,30,10,0.16)" strokeWidth={5} fill="none" />
      {title && (
        <g>
          <rect x={x + w / 2 - 50} y={y + 14} width={100} height={20} rx={4} fill="#fffaf2" opacity={0.95} />
          <text x={x + w / 2} y={y + 28} textAnchor="middle" fontFamily={FONT} fontSize={11.5} fontWeight={800} fill="#5a3a24">
            {title}
          </text>
        </g>
      )}
      {children}
    </g>
  );
}

/** 앞쪽으로 뻗은 나무 다리(원근 사다리꼴). (x, yTop)→(x, yBot) */
export function Bridge({ x, yTop, yBot, wTop = 50, wBot = 110 }: { x: number; yTop: number; yBot: number; wTop?: number; wBot?: number }) {
  const n = 9;
  const planks: ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const yy = yTop + (yBot - yTop) * t;
    const hw = (wTop + (wBot - wTop) * t) / 2;
    planks.push(<path key={i} d={`M${x - hw} ${yy} H${x + hw}`} stroke="#8a5a3b" strokeWidth={1.2} opacity={0.55} />);
  }
  const posts: ReactNode[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const yy = yTop + (yBot - yTop) * t;
    const hw = (wTop + (wBot - wTop) * t) / 2;
    const ph = 14 + t * 12;
    posts.push(
      <g key={i}>
        <rect x={x - hw - 3} y={yy - ph} width={5 + t * 2} height={ph} rx={1.5} fill={u("pillar")} {...ln("#6e2d22", 1)} />
        <rect x={x + hw - 2} y={yy - ph} width={5 + t * 2} height={ph} rx={1.5} fill={u("pillar")} {...ln("#6e2d22", 1)} />
      </g>,
    );
  }
  const hwT = wTop / 2;
  const hwB = wBot / 2;
  return (
    <g>
      {/* supports in water */}
      {[0.3, 0.65].map((t) => {
        const yy = yTop + (yBot - yTop) * t;
        const hw = (wTop + (wBot - wTop) * t) / 2;
        return (
          <g key={t}>
            <rect x={x - hw + 2} y={yy} width={6} height={14 + t * 6} fill="#7a5034" />
            <rect x={x + hw - 8} y={yy} width={6} height={14 + t * 6} fill="#7a5034" />
            <ellipse cx={x} cy={yy + 16 + t * 6} rx={hw + 6} ry={3} fill="#3f93c6" opacity={0.3} />
          </g>
        );
      })}
      <path d={`M${x - hwT} ${yTop} L${x + hwT} ${yTop} L${x + hwB} ${yBot} L${x - hwB} ${yBot} Z`} fill={u("wood")} {...ln("#8a5a3b", 1.6)} />
      <path d={`M${x - hwT + 3} ${yTop + 2} L${x - hwB + 6} ${yBot - 2}`} stroke="#f3d2a6" strokeWidth={2} opacity={0.6} />
      {planks}
      <path d={`M${x - hwB} ${yBot} L${x + hwB} ${yBot} L${x + hwB} ${yBot + 6} L${x - hwB} ${yBot + 6} Z`} fill="#9c6a42" />
      {posts}
      <path d={`M${x - hwT - 1} ${yTop - 13} L${x - hwB - 1} ${yBot - 25}`} stroke="#b7533f" strokeWidth={4} strokeLinecap="round" />
      <path d={`M${x + hwT + 1} ${yTop - 13} L${x + hwB + 1} ${yBot - 25}`} stroke="#b7533f" strokeWidth={4} strokeLinecap="round" />
      <path d={`M${x - hwT - 1} ${yTop - 14} L${x - hwB - 1} ${yBot - 26}`} stroke="#e08a72" strokeWidth={1.2} opacity={0.7} />
    </g>
  );
}

/** 유리 커튼월(격자 + 따뜻한 실내 실루엣) */
export function GlassWall({ x, y, w, h, cols = 4, rows = 2, mullion = "#56645d", interior = true }: { x: number; y: number; w: number; h: number; cols?: number; rows?: number; mullion?: string; interior?: boolean }) {
  const r = rng(Math.round(x * 3 + w));
  const shelves: ReactNode[] = [];
  if (interior) {
    for (let i = 0; i < cols * 2; i++) {
      const bx = x + 6 + (i * (w - 12)) / (cols * 2);
      const bh = h * (0.25 + r() * 0.25);
      shelves.push(<rect key={i} x={bx} y={y + h - bh} width={(w - 12) / (cols * 2) - 4} height={bh} fill={["#c98a55", "#d9a441", "#9fc7b0", "#e9b0a0"][i % 4]} opacity={0.45} />);
    }
  }
  const lines: ReactNode[] = [];
  for (let c = 1; c < cols; c++) lines.push(<path key={`c${c}`} d={`M${x + (w * c) / cols} ${y} V${y + h}`} stroke={mullion} strokeWidth={3} />);
  for (let rr = 1; rr < rows; rr++) lines.push(<path key={`r${rr}`} d={`M${x} ${y + (h * rr) / rows} H${x + w}`} stroke={mullion} strokeWidth={3} />);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={u(interior ? "glassWarm" : "glass")} />
      {interior && <rect x={x} y={y} width={w} height={h} fill={u("glass")} opacity={0.35} />}
      {shelves}
      {interior && <circle cx={x + w * 0.5} cy={y + h * 0.25} r={Math.min(w, h) * 0.5} fill={u("glowSoft")} />}
      <path d={`M${x + 8} ${y + h - 8} L${x + w * 0.35} ${y + 6} L${x + w * 0.5} ${y + 6} L${x + 24} ${y + h - 8} Z`} fill="#ffffff" opacity={0.3} />
      {lines}
      <rect x={x} y={y} width={w} height={h} fill="none" {...ln(mullion, 2.6)} />
    </g>
  );
}
