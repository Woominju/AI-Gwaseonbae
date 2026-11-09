import {
  CafeCounter, Chair, CoffeeMachine, ExitDoor, Frame, Laptop, LightBeam, MenuBoard, Mug, PendantLight, PottedPlant,
  RectWindow, Room, Table, Vignette, CitySkyline, Tree, u, ln, FONT,
} from "../kit";

const W = 1000;
const FY = 420;

function SCDefs() {
  return (
    <defs>
      <linearGradient id="w3-sc-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbeedd" />
        <stop offset="1" stopColor="#f1dcc0" />
      </linearGradient>
      <linearGradient id="w3-sc-tile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e9f1ea" />
        <stop offset="1" stopColor="#d7e6da" />
      </linearGradient>
    </defs>
  );
}

function StreetView({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <clipPath id="w3-sc-clip">
        <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} />
      </clipPath>
      <g clipPath="url(#w3-sc-clip)">
        <rect x={x} y={y} width={w} height={h} fill={u("skyWarm")} />
        <g transform={`translate(${x} 0)`}>
          <CitySkyline w={w} y={y + h * 0.62} seed={41} color="#c9c3d9" />
          <rect x={20} y={y + h * 0.4} width={90} height={h * 0.3} fill={u("brick")} opacity={0.85} />
          <rect x={130} y={y + h * 0.48} width={80} height={h * 0.25} fill={u("brickDeep")} opacity={0.85} />
          <rect x={0} y={y + h * 0.7} width={w} height={h * 0.3} fill="#e2d3bf" />
          <Tree x={w * 0.72} y={y + h * 0.86} s={0.7} kind="ginkgo" sway={false} />
          <Tree x={w * 0.18} y={y + h * 0.9} s={0.55} kind="ginkgo" sway={false} />
        </g>
        <rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.15} />
      </g>
    </g>
  );
}

export function SeoulCafeBack() {
  return (
    <g>
      <SCDefs />
      <Room w={W} floorY={FY} wall="url(#w3-sc-wall)" floor="honey" ceiling="#9c6a42" />
      {/* exposed brick accent wall behind counter */}
      <rect x={112} y={30} width={330} height={FY - 44} fill={u("brick")} />
      <rect x={112} y={30} width={330} height={FY - 44} fill="url(#w3-brickPat)" />
      <rect x={430} y={30} width={12} height={FY - 44} fill="rgba(70,20,10,0.12)" />
      {/* mint tile wainscot on right wall */}
      <rect x={442} y={300} width={W - 442} height={FY - 314} fill="url(#w3-sc-tile)" />
      <rect x={442} y={300} width={W - 442} height={FY - 314} fill="url(#w3-tilePat)" opacity={0.8} />
      <rect x={442} y={296} width={W - 442} height={6} fill="#fff7ea" />

      {/* window to the street */}
      <StreetView x={480} y={84} w={250} h={200} />
      <RectWindow x={480} y={84} w={250} h={200} cols={3} rows={2} frame="#2f5a4f" line="#1f3e36" see />
      <path d="M470 76 H740 L732 92 H478 Z" fill="#2f5a4f" {...ln("#1f3e36", 1.4)} />
      {/* small plants on sill */}
      <PottedPlant x={510} y={290} s={0.4} kind="succulent" pot="white" />
      <PottedPlant x={700} y={290} s={0.4} kind="round" pot="terracotta" />
      <LightBeam x={490} y={140} w={230} len={300} skew={150} spread={60} o={0.7} />

      {/* frames */}
      <Frame x={780} y={110} w={64} h={78} fill="#2f5a4f" line="#1f3e36">
        <circle cx={812} cy={149} r={16} fill="#c98a55" />
        <path d="M806 140 q6 9 0 18 M812 136 q-2 13 4 26" stroke="#7a4a2e" strokeWidth={1.6} fill="none" />
      </Frame>
      <Frame x={860} y={128} w={84} h={60} fill="#c9a35a" line="#8f6c2c">
        <text x={902} y={164} textAnchor="middle" fontFamily={FONT} fontSize={11} fontWeight={800} fill="#2f5a4f">
          오늘도 한 잔
        </text>
      </Frame>

      {/* shelf with jars on brick */}
      <rect x={340} y={232} width={92} height={7} rx={2} fill={u("wood")} {...ln("#8a5a3b", 1.2)} />
      {[350, 372, 396, 418].map((x, i) => (
        <g key={x}>
          <rect x={x - 8} y={210} width={16} height={22} rx={4} fill="#fff7ea" opacity={0.85} {...ln("#c4ab86", 1)} />
          <rect x={x - 6} y={220} width={12} height={10} rx={2} fill={["#8a5a3b", "#c98a55", "#5e3c28", "#e3b97a"][i]} />
        </g>
      ))}

      <MenuBoard
        x={166}
        y={90}
        w={176}
        h={124}
        lines={[
          ["직무 역량 라떼", "4.5"],
          ["채용공고 아메리카노", "3.8"],
          ["인턴 준비 스무디", "5.0"],
        ]}
      />

      {/* pendants */}
      <PendantLight x={260} len={34} kind="dome" />
      <PendantLight x={600} len={60} kind="dome" />
      <PendantLight x={800} len={70} kind="dome" />

      {/* counter */}
      <CafeCounter x0={116} w={316} top={298} />
      <CoffeeMachine x={180} y={300} />
      {/* grinder */}
      <g transform="translate(250 300)">
        <rect x={-12} y={-30} width={24} height={30} rx={4} fill="#5b6f84" {...ln("#3b4b5c", 1.3)} />
        <path d="M-10 -30 L-14 -52 L14 -52 L10 -30 Z" fill="#f0e6d6" opacity={0.85} {...ln("#8a96a6", 1.2)} />
        <rect x={-10} y={-48} width={20} height={12} fill="#8a5a3b" opacity={0.8} />
      </g>
      {/* cake dome */}
      <g transform="translate(320 300)">
        <ellipse cx={0} cy={-2} rx={26} ry={4} fill="#e6dccb" {...ln("#b2a48d", 1)} />
        <path d="M-16 -4 L-16 -18 L16 -18 L16 -4 Z" fill="#f8d6c4" {...ln("#d39a85", 1)} />
        <path d="M-16 -18 L16 -18 L16 -12 L-16 -12 Z" fill="#fff6ec" />
        <circle cx={0} cy={-22} r={4} fill="#e2604c" />
        <path d="M-24 -2 Q-24 -46 0 -46 Q24 -46 24 -2" fill="#eaf8ff" opacity={0.45} {...ln("#a9c4d6", 1.2)} />
        <path d="M-16 -30 Q-14 -40 -4 -42" stroke="#ffffff" strokeWidth={2} fill="none" />
      </g>
      {/* register */}
      <g transform="translate(398 300)">
        <rect x={-18} y={-16} width={36} height={16} rx={3} fill="#3b4b5c" />
        <path d="M-12 -16 L-8 -34 L14 -34 L12 -16 Z" fill="#5b6f84" {...ln("#3b4b5c", 1.2)} />
        <rect x={-6} y={-31} width={16} height={9} rx={1} fill="#9ff0e8" />
      </g>
      <Mug x={290} y={300} s={0.8} c="#d85b4a" steam={false} />

      {/* tables */}
      <Chair x={540} y={FY + 6} tone="wood" seat="#d85b4a" />
      <Chair x={668} y={FY + 6} tone="wood" seat="#d85b4a" flip />
      <Table x={604} y={FY + 8} w={100} top={52} tone="white" legs="pedestal" />
      <Mug x={588} y={FY - 46} s={0.9} />
      <Mug x={622} y={FY - 46} s={0.9} c="#ffd27a" steam={false} />

      <Chair x={868} y={FY + 6} tone="wood" seat="#2f5a4f" flip />
      <Table x={786} y={FY + 8} w={120} top={52} tone="white" legs="pedestal" />
      <Laptop x={784} y={FY - 46} s={1.05} screen="table" />
      <Mug x={826} y={FY - 46} s={0.85} c="#2f5a4f" steam={false} />

      {/* plants */}
      <PottedPlant x={958} y={FY + 8} s={1.05} kind="monstera" pot="woven" />
      <g>
        <path d="M460 30 V64" stroke="#7a5034" strokeWidth={1.4} />
        <path d="M444 64 H476 L472 84 H448 Z" fill={u("coral")} {...ln("#b85a45", 1.3)} />
        <g className="w3-sway-slow" fill={u("leaf")} {...ln("#3f7a45", 1.1)}>
          {[[-12, 92], [-8, 108], [-12, 124], [12, 92], [14, 108], [10, 124], [0, 100]].map(([dx, yy], i) => (
            <ellipse key={i} cx={460 + dx} cy={yy} rx={6} ry={9} />
          ))}
        </g>
      </g>

      <ExitDoor x={60} floorY={FY} tone="glass" />
      <Vignette w={W} />
    </g>
  );
}

export function SeoulCafeFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(0 600)">
        <PottedPlant x={18} y={8} s={0.9} kind="tall" pot="terracotta" />
      </g>
    </g>
  );
}
