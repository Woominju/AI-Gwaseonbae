import {
  BookStack, Corkboard, DeskLamp, ExitDoor, Frame, Mailbox, Mug, PendantLight, PottedPlant, Room, Rug, StickyNote,
  Vignette, WallClock, Whiteboard, LightBeam, Shadow, u, ln, FONT,
} from "../kit";

const W = 1000;
const FY = 420;

function SCoDefs() {
  return (
    <defs>
      <linearGradient id="w3-sco-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7ecdb" />
        <stop offset="1" stopColor="#eedcc0" />
      </linearGradient>
      <linearGradient id="w3-sco-wains" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b5a86" />
        <stop offset="1" stopColor="#2a4670" />
      </linearGradient>
    </defs>
  );
}

/** 낮은 수납장 */
function Credenza({ x0, w, h = 58, base = FY + 2 }: { x0: number; w: number; h?: number; base?: number }) {
  const top = base - h;
  const n = Math.max(2, Math.round(w / 70));
  return (
    <g>
      <Shadow x={x0 + w / 2 + 6} y={base} rx={w / 2 + 6} ry={6} />
      <rect x={x0} y={top} width={w} height={h - 6} rx={4} fill={u("walnut")} {...ln("#4a2b1a", 1.6)} />
      {[...Array(n)].map((_, i) => (
        <g key={i}>
          <rect x={x0 + 8 + (i * (w - 16)) / n} y={top + 10} width={(w - 16) / n - 6} height={h - 26} rx={3} fill="none" stroke="#b07a52" strokeWidth={1.4} opacity={0.7} />
          <circle cx={x0 + 8 + ((i + 0.5) * (w - 16)) / n} cy={top + h / 2 - 2} r={2.4} fill="#e8c46a" />
        </g>
      ))}
      <rect x={x0 - 4} y={top - 4} width={w + 8} height={8} rx={3} fill={u("walnut")} {...ln("#4a2b1a", 1.3)} />
      <path d={`M${x0} ${top - 1} H${x0 + w}`} stroke="#c48a5c" strokeWidth={1.4} opacity={0.7} />
      <rect x={x0 + 6} y={base - 8} width={8} height={8} fill="#4a2b1a" />
      <rect x={x0 + w - 14} y={base - 8} width={8} height={8} fill="#4a2b1a" />
    </g>
  );
}

function Armchair({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <Shadow x={4} y={0} rx={46} ry={6} />
      <rect x={-34} y={-90} width={66} height={60} rx={18} fill={u("mustard")} {...ln("#b98429", 1.6)} />
      <rect x={-42} y={-46} width={84} height={34} rx={12} fill={u("mustard")} {...ln("#b98429", 1.6)} />
      <rect x={-48} y={-64} width={20} height={52} rx={9} fill={u("mustard")} {...ln("#b98429", 1.6)} />
      <rect x={28} y={-64} width={20} height={52} rx={9} fill={u("mustard")} {...ln("#b98429", 1.6)} />
      <path d="M-26 -82 Q-10 -88 10 -84" stroke="#ffe7a6" strokeWidth={3} fill="none" strokeLinecap="round" />
      <rect x={-38} y={-12} width={6} height={12} fill="#6b432c" />
      <rect x={32} y={-12} width={6} height={12} fill="#6b432c" />
    </g>
  );
}

export function SeoulCounselBack() {
  return (
    <g>
      <SCoDefs />
      <Room w={W} floorY={FY} wall="url(#w3-sco-wall)" floor="wood" wainscot={{ y: 310, fill: "url(#w3-sco-wains)", line: "#1d3456" }} ceiling="#7a4a30" />
      {/* crown molding */}
      <rect y={34} width={W} height={8} fill="#fff7ea" />
      <path d={`M0 42 H${W}`} stroke="#d9c3a0" strokeWidth={1.4} />

      {/* whiteboard */}
      <Whiteboard x={220} y={110} w={220} h={170} title="대학원 vs 취업">
        <path d="M330 120 V262" stroke="#9fb3c4" strokeWidth={1.4} strokeDasharray="5 4" />
        <text x={275} y={160} textAnchor="middle" fontFamily={FONT} fontSize={11} fontWeight={800} fill="#3f9e6f">
          대학원
        </text>
        <text x={385} y={160} textAnchor="middle" fontFamily={FONT} fontSize={11} fontWeight={800} fill="#d85b4a">
          취업
        </text>
        <path d="M244 176 h20 M244 192 h36 M244 208 h28 M244 224 h40" stroke="#5b8fc0" strokeWidth={2.2} strokeLinecap="round" />
        <path d="M354 176 h30 M354 192 h20 M354 208 h40 M354 224 h24" stroke="#5b8fc0" strokeWidth={2.2} strokeLinecap="round" />
        <path d="M238 174 l3 3 l5 -6 M238 190 l3 3 l5 -6 M348 174 l3 3 l5 -6" stroke="#3f9e6f" strokeWidth={1.8} fill="none" />
        <path d="M300 246 q30 -16 60 0" stroke="#f4a64a" strokeWidth={2} fill="none" />
        <circle cx={420} cy={136} r={8} fill="none" stroke="#f4a64a" strokeWidth={1.8} />
      </Whiteboard>

      {/* roadmap corkboard */}
      <Corkboard x={520} y={100} w={240} h={190} kind="cork" title="나의 로드맵">
        <path d="M548 170 Q600 150 640 176 T736 170" stroke="#e2604c" strokeWidth={1.6} fill="none" strokeDasharray="4 3" />
        {[
          [560, 176, "#fff3a8", -4, "1개월"],
          [612, 168, "#bfe6ff", 3, "3개월"],
          [668, 182, "#ffd0dc", -2, "6개월"],
          [722, 170, "#d8f5c2", 4, "12개월"],
        ].map(([x, y, c, r, t]) => (
          <g key={t as string}>
            <StickyNote x={x as number} y={y as number} c={c as string} r={r as number} w={40} blank />
            <text x={x as number} y={(y as number) - 6} textAnchor="middle" fontFamily={FONT} fontSize={9.5} fontWeight={800} fill="#5a3a24" transform={`rotate(${r} ${x} ${y})`} dy={10}>
              {t as string}
            </text>
          </g>
        ))}
        <StickyNote x={570} y={244} c="#ffffff" r={3} w={34} pin="#14a3a3" />
        <StickyNote x={630} y={250} c="#fff3a8" r={-5} w={34} pin="#14a3a3" />
        <StickyNote x={694} y={244} c="#bfe6ff" r={2} w={34} pin="#14a3a3" />
        <rect x={720} y={228} width={30} height={40} rx={2} fill="#fffaf0" transform="rotate(6 735 248)" {...ln("#c4ab86", 1)} />
        <path d="M726 238 h18 M726 246 h14 M726 254 h16" stroke="#9a8a76" strokeWidth={1.2} transform="rotate(6 735 248)" />
      </Corkboard>

      {/* framed career map */}
      <Frame x={800} y={124} w={146} h={150} fill="#c9a35a" line="#8f6c2c">
        <rect x={807} y={131} width={132} height={136} fill="#f4f8fb" />
        <path d="M830 236 L856 200 L888 214 L918 166 M856 200 L870 160 M888 214 L910 238" stroke="#9fb3c4" strokeWidth={1.6} fill="none" />
        {[[830, 236, "#3f9e6f"], [856, 200, "#14a3a3"], [888, 214, "#f4a64a"], [918, 166, "#d85b4a"], [870, 160, "#5b8fc0"], [910, 238, "#b9a7f2"]].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r={i === 3 ? 8 : 6} fill={c as string} stroke="#ffffff" strokeWidth={1.6} />
        ))}
        <text x={873} y={258} textAnchor="middle" fontFamily={FONT} fontSize={10} fontWeight={800} fill="#2f5a7a">
          진로 지도
        </text>
      </Frame>
      <WallClock x={470} y={92} r={18} />

      {/* furniture against wall */}
      <Credenza x0={232} w={196} h={56} />
      <BookStack x={262} y={FY - 56} />
      <PottedPlant x={404} y={FY - 56} s={0.5} kind="succulent" pot="white" />
      <Mug x={340} y={FY - 56} s={0.8} c="#3b5a86" steam={false} />

      <Credenza x0={540} w={200} h={60} />
      <DeskLamp x={580} y={FY - 60} s={0.75} on kind="banker" />
      <BookStack x={700} y={FY - 60} colors={["#d9a441", "#3f6f8f"]} />
      <PottedPlant x={480} y={FY + 4} s={0.95} kind="tall" pot="white" />
      <Armchair x={872} y={FY + 4} flip />

      <PendantLight x={330} len={40} kind="dome" />
      <PendantLight x={640} len={40} kind="dome" />
      <LightBeam x={150} y={40} w={120} len={380} skew={170} spread={60} o={0.5} />

      <Rug x={610} y={512} rx={300} ry={58} c1="#c9715a" c2="#f3d39a" line="#9e4f3e" />

      <Mailbox x={180} y={FY + 4} kind="post" label="질문함" />
      <ExitDoor x={60} floorY={FY} tone="wood" />
      <Vignette w={W} />
    </g>
  );
}

export function SeoulCounselFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(990 606)">
        <PottedPlant x={0} y={0} s={1.0} kind="monstera" pot="white" />
      </g>
    </g>
  );
}
