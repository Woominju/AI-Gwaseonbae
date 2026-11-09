import {
  BookStack, Bookshelf, Chair, DeskLamp, ExitDoor, ForestView, Globe, Laptop, LightBeam, OpenBook, PottedPlant, Room,
  Rug, Table, Vignette, u, ln, FONT,
} from "../kit";

const W = 1000;
const FY = 420;

function GLiDefs() {
  return (
    <defs>
      <linearGradient id="w3-gli-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbf8f1" />
        <stop offset="1" stopColor="#eee6d6" />
      </linearGradient>
    </defs>
  );
}

function HangingPlant({ x, len }: { x: number; len: number }) {
  return (
    <g>
      <path d={`M${x} 34 V${34 + len}`} stroke="#a9835a" strokeWidth={1.4} />
      <path d={`M${x - 16} ${34 + len} H${x + 16} L${x + 12} ${54 + len} H${x - 12} Z`} fill="#fffaf2" {...ln("#c4ab86", 1.3)} />
      <g className="w3-sway-slow" fill={u("leaf")} {...ln("#3f7a45", 1.1)}>
        {[[-14, 60], [-18, 76], [-12, 94], [-16, 110], [14, 62], [18, 78], [12, 96], [0, 58]].map(([dx, dy], i) => (
          <ellipse key={i} cx={x + dx} cy={34 + len + dy - 40} rx={6} ry={9} transform={`rotate(${dx > 0 ? 20 : -20} ${x + dx} ${34 + len + dy - 40})`} />
        ))}
      </g>
    </g>
  );
}

export function GlobalLibraryBack({ lampOn }: { lampOn: boolean }) {
  return (
    <g>
      <GLiDefs />
      <Room w={W} floorY={FY} wall="url(#w3-gli-wall)" floor="birch" ceiling="#e2c79c" wallPattern={false} />
      {/* wood slat ceiling */}
      {[...Array(40)].map((_, i) => (
        <rect key={i} x={i * 25 + 4} y={0} width={14} height={30} fill="#d2b083" opacity={0.7} />
      ))}
      {/* oak feature wall left */}
      <rect x={110} y={34} width={180} height={FY - 48} fill={u("birch")} />
      <rect x={110} y={34} width={180} height={FY - 48} fill="url(#w3-slatPat)" />
      <rect x={278} y={34} width={12} height={FY - 48} fill="rgba(80,50,20,0.1)" />
      <g filter={u("drop")}>
        <rect x={140} y={70} width={120} height={34} rx={6} fill="#3e5d55" />
        <text x={200} y={92} textAnchor="middle" fontFamily={FONT} fontSize={13} fontWeight={800} fill="#fffaf2">
          FOREST LIBRARY
        </text>
      </g>
      {/* big window wall */}
      <ForestView id="gli" x={310} y={50} w={460} h={300} lake />
      <g fill="none" stroke="#56645d" strokeWidth={6}>
        <rect x={310} y={50} width={460} height={300} />
        <path d="M463 50 V350 M617 50 V350 M310 170 H770" strokeWidth={4} />
      </g>
      <rect x={302} y={346} width={476} height={10} rx={3} fill={u("birch")} {...ln("#a9835a", 1.3)} />
      <path d="M322 64 L360 64 L322 150 Z M476 64 L520 64 L476 160 Z" fill="#ffffff" opacity={0.18} />
      <LightBeam x={320} y={120} w={440} len={320} skew={120} spread={80} cool o={0.85} />

      <HangingPlant x={360} len={30} />
      <HangingPlant x={720} len={44} />

      <Bookshelf x={872} y={FY + 2} w={176} h={340} shelves={5} tone="birch" seed={21} plants />
      <PottedPlant x={786} y={FY + 6} s={1.0} kind="tall" pot="white" />

      <Globe x={250} y={FY + 4} />

      <Rug x={540} y={514} rx={290} ry={60} c1="#b9d0b1" c2="#f7f1e3" line="#86a47c" />

      {/* reading table */}
      <Chair x={410} y={FY + 2} tone="birch" seat="#9fc7b0" />
      <Chair x={600} y={FY + 2} tone="birch" seat="#9fc7b0" flip />
      <Table x={500} y={FY + 4} w={330} top={46} tone="birch" />
      <OpenBook x={392} y={FY - 46} s={0.9} />
      <Laptop x={590} y={FY - 46} s={0.9} screen="chart" />
      <BookStack x={636} y={FY - 46} colors={["#9fc7b0", "#e9c46a", "#f4a99a"]} />
      <PottedPlant x={350} y={FY - 46} s={0.42} kind="succulent" pot="sage" />
      <DeskLamp x={470} y={FY - 44} on={lampOn} kind="mushroom" />
      {!lampOn && <rect width={W} height={600} fill="#1f2a30" opacity={0.06} pointerEvents="none" />}

      <ExitDoor x={60} floorY={FY} tone="birch" />
      <Vignette w={W} />
    </g>
  );
}

export function GlobalLibraryFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(990 606)">
        <PottedPlant x={0} y={0} s={1.1} kind="monstera" pot="sage" />
      </g>
    </g>
  );
}
