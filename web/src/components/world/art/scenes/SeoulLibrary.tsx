import {
  ArchWindow, BookStack, Bookshelf, Chair, DeskLamp, ExitDoor, LightBeam, OpenBook, PendantLight, PottedPlant,
  Room, Table, Vignette, u, ln, FONT, Cloud,
} from "../kit";

const W = 1000;
const FY = 420;

function SLDefs() {
  return (
    <defs>
      <linearGradient id="w3-sl-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6e7cc" />
        <stop offset="1" stopColor="#ecd5ae" />
      </linearGradient>
      <linearGradient id="w3-sl-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8f5d3e" />
        <stop offset="1" stopColor="#6b432c" />
      </linearGradient>
      <linearGradient id="w3-sl-rug" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b5523f" />
        <stop offset="1" stopColor="#8f3d30" />
      </linearGradient>
    </defs>
  );
}

/** 창 밖 풍경(은행나무 + 하늘) */
function WindowView({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const id = `w3-sl-win-${x}`;
  const r = w / 2;
  return (
    <g>
      <clipPath id={id}>
        <path d={`M${x + 5} ${y + h} V${y + r} A${r - 5} ${r - 5} 0 0 1 ${x + w - 5} ${y + r} V${y + h} Z`} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={h} fill={u("skyWarm")} />
        <Cloud x={x + w * 0.45} y={y + h * 0.3} s={0.4} />
        <rect x={x} y={y + h * 0.62} width={w} height={h * 0.4} fill="#d3a07f" opacity={0.75} />
        <circle cx={x + w * 0.2} cy={y + h * 0.62} r={w * 0.35} fill="#f4c94a" opacity={0.9} />
        <circle cx={x + w * 0.85} cy={y + h * 0.66} r={w * 0.3} fill="#e9b43c" opacity={0.9} />
        <rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.18} />
      </g>
    </g>
  );
}

export function SeoulLibraryBack({ lampOn }: { lampOn: boolean }) {
  const wins = [350, 520, 690];
  return (
    <g>
      <SLDefs />
      <Room w={W} floorY={FY} wall="url(#w3-sl-wall)" floor="walnut" wainscot={{ y: 300, fill: "url(#w3-sl-panel)", line: "#4a2b1a" }} ceiling="#6b432c" />
      {/* ceiling beams */}
      {[0, 250, 500, 750].map((x) => (
        <rect key={x} x={x + 110} y={0} width={18} height={40} fill="#5a3523" />
      ))}
      {/* pilasters */}
      {[330, 500, 670, 800].map((x) => (
        <rect key={x} x={x - 6} y={30} width={12} height={270} fill="#e3c9a0" opacity={0.7} />
      ))}
      {/* tall arched windows */}
      {wins.map((x) => (
        <g key={x}>
          <WindowView x={x} y={60} w={90} h={226} />
          <ArchWindow x={x} y={60} w={90} h={226} frame="#7a4a30" line="#4a2b1a" glass="glass" mullion={false} see />
          <path d={`M${x + 45} 66 V282 M${x + 6} 180 H${x + 84}`} stroke="#7a4a30" strokeWidth={4} />
          {/* curtain tie */}
          <path d={`M${x - 8} 56 Q${x - 14} 160 ${x - 4} 290 L${x + 8} 290 Q${x + 2} 200 ${x + 10} 64 Z`} fill="#3f6f5f" opacity={0.9} {...ln("#2a4f43", 1.3)} />
        </g>
      ))}
      {/* poster by window */}
      <g filter={u("drop")}>
        <rect x={805} y={150} width={72} height={112} rx={3} fill="#fffaf0" {...ln("#c4ab86", 1.4)} />
        <rect x={812} y={158} width={58} height={58} rx={2} fill="#2f5a7a" />
        <path d="M818 206 L832 186 L844 196 L862 170" stroke="#ffd27a" strokeWidth={3} fill="none" strokeLinecap="round" />
        <circle cx={862} cy={170} r={4} fill="#ffd27a" />
        <text x={841} y={232} textAnchor="middle" fontFamily={FONT} fontSize={9.5} fontWeight={800} fill="#2f5a7a">
          우선순위가
        </text>
        <text x={841} y={245} textAnchor="middle" fontFamily={FONT} fontSize={9.5} fontWeight={800} fill="#2f5a7a">
          길을 바꿔요
        </text>
        <circle cx={812} cy={155} r={3} fill="#e2604c" />
        <circle cx={870} cy={155} r={3} fill="#e2604c" />
      </g>
      {/* bookshelves */}
      <Bookshelf x={220} y={FY + 2} w={176} h={352} shelves={6} tone="walnut" seed={4} />
      {/* rolling ladder */}
      <g {...ln("#5a3523", 1.3)}>
        <path d="M282 422 L270 96" stroke="#a6714b" strokeWidth={6} strokeLinecap="round" />
        <path d="M306 422 L294 96" stroke="#a6714b" strokeWidth={6} strokeLinecap="round" />
        {[...Array(9)].map((_, i) => (
          <path key={i} d={`M${281 - i * 1.2} ${400 - i * 35} H${305 - i * 1.2}`} stroke="#c48a5c" strokeWidth={4} />
        ))}
        <path d="M262 96 H302" stroke="#c9a35a" strokeWidth={3} />
      </g>
      <Bookshelf x={962} y={FY + 2} w={130} h={352} shelves={6} tone="walnut" seed={9} />

      {/* pendants */}
      <PendantLight x={430} len={80} kind="glass" />
      <PendantLight x={620} len={80} kind="glass" />

      {/* light beams from windows (top-left light) */}
      {wins.map((x) => (
        <LightBeam key={x} x={x + 8} y={120} w={74} len={340} skew={150} spread={50} o={0.85} />
      ))}
      {/* dust motes */}
      <g className="w3-twinkle" fill="#fff6d6">
        {[[420, 210], [470, 290], [590, 250], [640, 330], [760, 230], [800, 360], [530, 380]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.6} />
        ))}
      </g>

      {/* rug runner */}
      <g>
        <path d="M260 470 L780 470 L860 560 L180 560 Z" fill="url(#w3-sl-rug)" {...ln("#6e2d22", 1.6)} />
        <path d="M282 480 L760 480 L828 550 L212 550 Z" fill="none" stroke="#e8b44a" strokeWidth={2.4} opacity={0.8} />
        <path d="M300 488 L742 488 L804 542 L238 542 Z" fill="none" stroke="#f3d39a" strokeWidth={1.2} strokeDasharray="6 5" opacity={0.7} />
        {[340, 520, 700].map((x) => (
          <path key={x} d={`M${x} 503 l14 12 l-14 12 l-14 -12 Z`} fill="#e8b44a" opacity={0.75} transform={`translate(${(x - 520) * 0.12} 0)`} />
        ))}
      </g>

      {/* chairs behind desk */}
      <Chair x={380} y={FY + 2} tone="walnut" seat="#3f6f5f" />
      <Chair x={560} y={FY + 2} tone="walnut" seat="#3f6f5f" />
      <Chair x={660} y={FY + 2} tone="walnut" seat="#3f6f5f" flip />
      {/* long reading desk */}
      <Table x={520} y={FY + 4} w={400} top={48} tone="walnut" />
      <rect x={322} y={FY - 38} width={396} height={6} fill="#3f6f5f" opacity={0.7} />
      <OpenBook x={430} y={FY - 47} />
      <BookStack x={360} y={FY - 46} />
      <BookStack x={650} y={FY - 46} colors={["#4f8a5f", "#e6d3b0", "#8a4f6f", "#d9a441"]} />
      <PottedPlant x={700} y={FY - 46} s={0.45} kind="succulent" pot="white" />
      <DeskLamp x={520} y={FY - 46} on={lampOn} kind="banker" />
      {!lampOn && <rect width={W} height={600} fill="#1f1830" opacity={0.08} pointerEvents="none" />}

      <ExitDoor x={60} floorY={FY} tone="wood" />
      <PottedPlant x={124} y={FY + 6} s={0.8} kind="tall" pot="terracotta" />
      <Vignette w={W} />
    </g>
  );
}

export function SeoulLibraryFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(985 606)">
        <PottedPlant x={0} y={0} s={1.15} kind="monstera" pot="terracotta" />
      </g>
    </g>
  );
}
