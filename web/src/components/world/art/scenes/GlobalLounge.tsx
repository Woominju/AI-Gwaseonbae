import {
  ExitDoor, Frame, ForestView, Laptop, LightBeam, Mug, PendantLight, PottedPlant, Room, Rug, Shadow, Sofa, Table,
  VendingMachine, Vignette, WallClock, u, ln, FONT,
} from "../kit";

const W = 1000;
const FY = 420;

function GLoDefs() {
  return (
    <defs>
      <linearGradient id="w3-glo-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f1f5e8" />
        <stop offset="1" stopColor="#e2ebd6" />
      </linearGradient>
    </defs>
  );
}

/** 보드게임이 놓인 오픈 선반 */
function GameShelf({ x0, base = FY + 2 }: { x0: number; base?: number }) {
  const w = 128;
  const top = base - 190;
  const boxes = [
    ["#e2604c", "#ffd27a"], ["#14a3a3", "#ffffff"], ["#f4c94a", "#e2604c"], ["#7cc96b", "#ffffff"], ["#b9a7f2", "#ffffff"],
  ];
  return (
    <g>
      <Shadow x={x0 + w / 2 + 6} y={base} rx={w / 2 + 6} ry={6} />
      <rect x={x0} y={top} width={w} height={190} rx={4} fill={u("birch")} {...ln("#a9835a", 1.6)} />
      <rect x={x0 + 7} y={top + 7} width={w - 14} height={176} fill="#e3cfab" />
      {[1, 2].map((i) => (
        <rect key={i} x={x0 + 4} y={top + i * 62} width={w - 8} height={7} fill={u("birch")} {...ln("#a9835a", 1)} />
      ))}
      {/* stacked board games */}
      {boxes.slice(0, 3).map(([c, c2], i) => (
        <g key={i}>
          <rect x={x0 + 14 + i * 3} y={top + 62 - 12 * (i + 1)} width={62 - i * 6} height={11} rx={2} fill={c} {...ln("rgba(40,30,30,0.35)", 0.9)} />
          <rect x={x0 + 20 + i * 3} y={top + 62 - 12 * (i + 1) + 4} width={14} height={3} rx={1} fill={c2} opacity={0.9} />
        </g>
      ))}
      <PottedPlant x={x0 + 100} y={top + 62} s={0.42} kind="succulent" pot="white" />
      {/* standing boxes */}
      {boxes.slice(2).map(([c, c2], i) => (
        <g key={`s${i}`}>
          <rect x={x0 + 14 + i * 22} y={top + 84} width={18} height={40} rx={2} fill={c} {...ln("rgba(40,30,30,0.35)", 0.9)} />
          <circle cx={x0 + 23 + i * 22} cy={top + 98} r={4} fill={c2} opacity={0.9} />
        </g>
      ))}
      {/* dice + cards */}
      <rect x={x0 + 86} y={top + 112} width={12} height={12} rx={2} fill="#ffffff" {...ln("#c4ab86", 1)} />
      <circle cx={x0 + 92} cy={top + 118} r={1.4} fill="#e2604c" />
      <rect x={x0 + 102} y={top + 108} width={14} height={16} rx={2} fill="#14a3a3" transform={`rotate(8 ${x0 + 109} ${top + 116})`} />
      <rect x={x0 + 16} y={top + 152} width={96} height={20} rx={4} fill="#fff7ea" {...ln("#c4ab86", 1)} />
      <text x={x0 + 64} y={top + 166} textAnchor="middle" fontFamily={FONT} fontSize={9.5} fontWeight={800} fill="#8a4a2e">
        보드게임 대여
      </text>
    </g>
  );
}

function FloorLamp({ x, base = FY + 4 }: { x: number; base?: number }) {
  return (
    <g>
      <Shadow x={x + 4} y={base} rx={22} ry={4} />
      <circle cx={x + 30} cy={base - 210} r={80} fill={u("glowSoft")} />
      <path d={`M${x} ${base - 2} V${base - 170} Q${x} ${base - 214} ${x + 30} ${base - 216}`} stroke="#56645d" strokeWidth={4} fill="none" strokeLinecap="round" />
      <ellipse cx={x} cy={base - 3} rx={18} ry={5} fill="#56645d" />
      <path d={`M${x + 10} ${base - 196} Q${x + 30} ${base - 232} ${x + 52} ${base - 196} Z`} fill={u("mustard")} {...ln("#a9802f", 1.5)} />
      <ellipse cx={x + 31} cy={base - 196} rx={21} ry={4} fill="#fff3c4" />
    </g>
  );
}

export function GlobalLoungeBack() {
  return (
    <g>
      <GLoDefs />
      <Room w={W} floorY={FY} wall="url(#w3-glo-wall)" floor="honey" ceiling="#c99d6a" wallPattern={false} />
      {/* oak slat panel lower wall */}
      <rect x={0} y={250} width={W} height={FY - 264} fill={u("birch")} />
      <rect x={0} y={250} width={W} height={FY - 264} fill="url(#w3-slatPat)" />
      <rect x={0} y={246} width={W} height={6} rx={2} fill="#c99d6a" />

      {/* window with hills */}
      <ForestView id="glo" x={226} y={64} w={300} h={180} hills />
      <g fill="none" stroke="#f6ead2" strokeWidth={7}>
        <rect x={226} y={64} width={300} height={180} rx={6} />
        <path d="M376 64 V244" strokeWidth={4} />
      </g>
      <rect x={226} y={64} width={300} height={180} rx={6} fill="none" {...ln("#a9835a", 1.5)} />
      <path d="M216 56 Q376 40 536 56 L536 70 Q376 58 216 70 Z" fill="#9fc7b0" opacity={0.9} {...ln("#6f9f84", 1.2)} />
      <LightBeam x={236} y={120} w={280} len={300} skew={130} spread={60} o={0.7} />

      <WallClock x={640} y={104} r={20} tone="#fffaf2" rim="#56645d" />
      <Frame x={590} y={150} w={60} h={70} fill="#f6ead2" line="#a9835a">
        <circle cx={620} cy={185} r={14} fill="#9fd67a" />
        <path d="M606 200 Q620 170 634 200 Z" fill="#7cc96b" />
      </Frame>
      <Frame x={662} y={160} w={70} h={52} fill="#f6ead2" line="#a9835a">
        <text x={697} y={191} textAnchor="middle" fontFamily={FONT} fontSize={10} fontWeight={800} fill="#3e5d55">
          쉬어 가요
        </text>
      </Frame>

      <PendantLight x={380} len={20} kind="rattan" />
      <PendantLight x={600} len={40} kind="rattan" />

      <Rug x={470} y={508} rx={280} ry={58} c1="#f4c94a" c2="#fff4d4" line="#c99a3a" />

      <FloorLamp x={150} />
      <Sofa x={380} y={FY + 6} w={250} c="#9fc7b0" line="#6f9f84" hi="#e2f3e8" />
      {/* low table */}
      <Table x={584} y={FY + 6} w={130} top={38} tone="birch" />
      <Laptop x={560} y={FY - 34} s={0.95} screen="chart" />
      <Mug x={614} y={FY - 34} s={0.9} c="#fffaf2" />
      <g transform={`translate(634 ${FY - 34})`}>
        <rect x={-2} y={-8} width={26} height={8} rx={2} fill="#e2604c" {...ln("rgba(40,30,30,0.35)", 0.8)} />
        <rect x={0} y={-15} width={22} height={7} rx={2} fill="#14a3a3" {...ln("rgba(40,30,30,0.35)", 0.8)} />
      </g>

      <GameShelf x0={668} />
      <VendingMachine x={866} y={FY + 4} s={0.98} />
      <PottedPlant x={958} y={FY + 6} s={0.8} kind="tall" pot="woven" />

      <ExitDoor x={60} floorY={FY} tone="birch" />
      <Vignette w={W} />
    </g>
  );
}

export function GlobalLoungeFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(-6 606)">
        <PottedPlant x={0} y={0} s={1.05} kind="monstera" pot="sage" />
      </g>
    </g>
  );
}
