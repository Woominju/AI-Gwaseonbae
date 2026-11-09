import {
  Corkboard, ExitDoor, ForestView, LightBeam, Mailbox, Mug, PendantLight, PottedPlant, Room, Rug, Shadow, StickyNote,
  Vignette, Whiteboard, u, ln, FONT,
} from "../kit";

const W = 1000;
const FY = 420;

function GCDefs() {
  return (
    <defs>
      <linearGradient id="w3-gco-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d6e6cf" />
        <stop offset="1" stopColor="#bfd5b6" />
      </linearGradient>
      <linearGradient id="w3-gco-wains" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#efdcb9" />
        <stop offset="1" stopColor="#dcc097" />
      </linearGradient>
    </defs>
  );
}

/** 원목 낮은 벤치형 수납 + 바구니 */
function BirchBench({ x0, w, base = FY + 2 }: { x0: number; w: number; base?: number }) {
  return (
    <g>
      <Shadow x={x0 + w / 2 + 6} y={base} rx={w / 2 + 4} ry={6} />
      <rect x={x0} y={base - 52} width={w} height={46} rx={5} fill={u("birch")} {...ln("#a9835a", 1.6)} />
      <rect x={x0 - 4} y={base - 58} width={w + 8} height={9} rx={4} fill={u("birch")} {...ln("#a9835a", 1.3)} />
      {[...Array(Math.floor(w / 60))].map((_, i) => (
        <g key={i}>
          <path d={`M${x0 + 12 + i * 60} ${base - 42} h44 l-4 30 h-36 Z`} fill={u("mustard")} {...ln("#a9802f", 1.2)} />
          <path d={`M${x0 + 14 + i * 60} ${base - 32} h40 M${x0 + 15 + i * 60} ${base - 22} h38`} stroke="#a9802f" strokeWidth={1} opacity={0.6} />
        </g>
      ))}
      <rect x={x0 + 6} y={base - 6} width={8} height={6} fill="#a9835a" />
      <rect x={x0 + w - 14} y={base - 6} width={8} height={6} fill="#a9835a" />
    </g>
  );
}

function FloorCushion({ x, y, c, line }: { x: number; y: number; c: string; line: string }) {
  return (
    <g>
      <Shadow x={x + 3} y={y} rx={34} ry={6} />
      <ellipse cx={x} cy={y - 10} rx={32} ry={14} fill={c} {...ln(line, 1.6)} />
      <ellipse cx={x - 8} cy={y - 15} rx={14} ry={4} fill="#ffffff" opacity={0.35} />
      <circle cx={x} cy={y - 10} r={2.4} fill={line} />
    </g>
  );
}

export function GlobalCounselBack() {
  return (
    <g>
      <GCDefs />
      <Room w={W} floorY={FY} wall="url(#w3-gco-wall)" floor="birch" wainscot={{ y: 320, fill: "url(#w3-gco-wains)", line: "#b9976a" }} ceiling="#d8b88a" wallPattern={false} />
      {/* exposed beams */}
      {[200, 500, 800].map((x) => (
        <rect key={x} x={x - 8} y={0} width={16} height={44} fill="#c99d6a" />
      ))}

      {/* whiteboard on birch frame */}
      <Whiteboard x={220} y={110} w={220} h={170} frame="#ead3ab" frameLine="#a9835a" title="선택지 비교">
        <circle cx={300} cy={196} r={44} fill="#9fd67a" opacity={0.35} stroke="#3f9e6f" strokeWidth={2} />
        <circle cx={360} cy={196} r={44} fill="#8fc6e6" opacity={0.35} stroke="#2f6fb0" strokeWidth={2} />
        <text x={286} y={200} textAnchor="middle" fontFamily={FONT} fontSize={10.5} fontWeight={800} fill="#2f6b4a">
          연구
        </text>
        <text x={376} y={200} textAnchor="middle" fontFamily={FONT} fontSize={10.5} fontWeight={800} fill="#24507a">
          현업
        </text>
        <text x={330} y={200} textAnchor="middle" fontFamily={FONT} fontSize={14} fontWeight={900} fill="#d85b4a">
          ♥
        </text>
      </Whiteboard>

      {/* felt roadmap board */}
      <Corkboard x={520} y={100} w={240} h={190} kind="felt" title="나의 로드맵">
        <path d="M546 168 C590 150 620 196 650 172 S720 150 740 176" stroke="#fffaf2" strokeWidth={2} fill="none" strokeDasharray="5 4" />
        {[
          [556, 172, "#fffaf2", -3, "1개월"],
          [612, 182, "#ffe7a6", 4, "3개월"],
          [670, 168, "#d8f5c2", -2, "6개월"],
          [728, 180, "#ffd0dc", 3, "12개월"],
        ].map(([x, y, c, r, t]) => (
          <g key={t as string}>
            <StickyNote x={x as number} y={y as number} c={c as string} r={r as number} w={40} pin="#3e5d55" blank />
            <text x={x as number} y={(y as number) + 4} textAnchor="middle" fontFamily={FONT} fontSize={9.5} fontWeight={800} fill="#3e5d55" transform={`rotate(${r} ${x} ${y})`}>
              {t as string}
            </text>
          </g>
        ))}
        {[[566, 246, "#ffe7a6"], [624, 252, "#fffaf2"], [684, 244, "#d8f5c2"]].map(([x, y, c], i) => (
          <StickyNote key={i} x={x as number} y={y as number} c={c as string} r={i * 3 - 3} w={34} pin="#e2604c" />
        ))}
        <path d="M716 232 l10 -14 l10 14 l-6 0 l0 20 l-8 0 l0 -20 Z" fill="#f4c94a" {...ln("#b98429", 1)} />
      </Corkboard>

      {/* tall forest window */}
      <ForestView id="gco" x={796} y={70} w={168} h={270} />
      <g fill="none" stroke="#f6ead2" strokeWidth={7}>
        <rect x={796} y={70} width={168} height={270} rx={4} />
        <path d="M880 70 V340 M796 200 H964" strokeWidth={4} />
      </g>
      <rect x={796} y={70} width={168} height={270} rx={4} fill="none" {...ln("#a9835a", 1.5)} />
      <rect x={786} y={338} width={188} height={10} rx={3} fill={u("birch")} {...ln("#a9835a", 1.3)} />
      <PottedPlant x={820} y={340} s={0.4} kind="succulent" pot="white" />
      <PottedPlant x={940} y={340} s={0.42} kind="round" pot="terracotta" />
      {/* light falls from the window toward the room */}
      <path d="M800 90 L960 90 L840 470 L640 470 Z" fill={u("beamCool")} opacity={0.5} className="w3-beam" />
      <LightBeam x={120} y={40} w={100} len={380} skew={150} spread={50} o={0.35} />

      <PendantLight x={330} len={46} kind="rattan" />
      <PendantLight x={640} len={46} kind="rattan" />

      <BirchBench x0={530} w={220} />
      <Mug x={560} y={FY - 56} s={0.85} c="#9fc7b0" />
      <PottedPlant x={720} y={FY - 56} s={0.45} kind="round" pot="white" />
      <PottedPlant x={480} y={FY + 6} s={1.0} kind="monstera" pot="woven" />
      <BirchBench x0={244} w={176} />

      <Rug x={620} y={512} rx={290} ry={60} c1="#9fc7b0" c2="#f7f1e3" line="#6f9f84" />
      <FloorCushion x={910} y={FY + 12} c="#f4c94a" line="#b98429" />

      <Mailbox x={180} y={FY + 4} kind="birdhouse" label="질문함" />
      <ExitDoor x={60} floorY={FY} tone="birch" />
      <Vignette w={W} />
    </g>
  );
}

export function GlobalCounselFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(994 606)">
        <PottedPlant x={0} y={0} s={1.0} kind="tall" pot="sage" />
      </g>
    </g>
  );
}
