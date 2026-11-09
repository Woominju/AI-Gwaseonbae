import {
  Bridge, Bush, Clouds, Door, Duck, Flower, ForestBand, GlassWall, GrassTuft, LotusLeaf, Pavilion,
  Plaque, PottedPlant, Ridge, Rock, Shadow, Signpost, Sky, Tree, Vignette, u, ln,
} from "../kit";

const W = 1600;
const LAKE = "M440 336 Q446 306 540 302 L1110 300 Q1200 304 1204 344 Q1206 404 1120 436 Q1000 470 820 470 Q630 470 540 446 Q446 418 440 336 Z";

function GLDefs() {
  return (
    <defs>
      <clipPath id="w3-gl-lake">
        <path d={LAKE} />
      </clipPath>
      <linearGradient id="w3-gl-timber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e2b98a" />
        <stop offset="1" stopColor="#c08f5e" />
      </linearGradient>
      <linearGradient id="w3-gl-roofGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6f9f74" />
        <stop offset="1" stopColor="#4c7a55" />
      </linearGradient>
      <linearGradient id="w3-gl-roofClay" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9895f" />
        <stop offset="1" stopColor="#b5643f" />
      </linearGradient>
    </defs>
  );
}

function Far() {
  return (
    <g>
      <Ridge w={W} base={360} pts={[200, 168, 190, 150, 182, 160, 176, 150, 186]} fill="#bcd8de" o={0.95} />
      <Ridge w={W} base={360} pts={[240, 214, 232, 206, 228, 212, 236, 216, 230]} fill="#a3cdb4" />
      <ForestBand w={W} y={276} h={34} color="#8fc39a" seed={8} pointy />
      <Ridge w={W} base={360} pts={[282, 270, 286, 272, 280, 266, 284]} fill="#86bd89" />
    </g>
  );
}

function Lake() {
  return (
    <g>
      {/* sand rim */}
      <path d={LAKE} fill="none" stroke="#efe0bd" strokeWidth={14} strokeLinejoin="round" />
      <path d={LAKE} fill="none" stroke="#d9c79b" strokeWidth={4} strokeLinejoin="round" transform="translate(0 4)" opacity={0.6} />
      <path d={LAKE} fill={u("water")} />
      <g clipPath="url(#w3-gl-lake)">
        {/* forest reflection */}
        <ForestBand w={W} y={316} h={22} color="#5f9e8a" seed={8} o={0.35} pointy />
        <rect x={0} y={296} width={W} height={16} fill="#6aa58f" opacity={0.3} />
        {/* pavilion reflection */}
        <g opacity={0.2} filter={u("blur1")}>
          {[738, 778, 862, 902].map((x) => (
            <rect key={x} x={x - 4} y={366} width={8} height={56} fill="#8c3a2d" />
          ))}
          <path d="M700 420 Q820 436 940 420 L912 448 L728 448 Z" fill="#4f5d70" />
        </g>
        {/* shimmer */}
        <g stroke="#ffffff" strokeLinecap="round">
          {[[520, 360, 60], [610, 400, 40], [960, 380, 70], [1080, 352, 40], [700, 440, 50], [1000, 430, 46], [560, 330, 30], [900, 456, 40]].map(([x, y, l], i) => (
            <path key={i} className="w3-shimmer" d={`M${x} ${y} h${l}`} strokeWidth={2.4} opacity={0.6} />
          ))}
        </g>
        <path d={`M440 300 H1210`} stroke="#ffffff" strokeWidth={3} opacity={0.4} />
      </g>
      {/* lotus */}
      <LotusLeaf x={590} y={426} s={1.1} flower />
      <LotusLeaf x={632} y={440} s={0.9} />
      <LotusLeaf x={556} y={404} s={0.8} />
      <LotusLeaf x={986} y={446} s={1.1} />
      <LotusLeaf x={1030} y={438} s={0.8} flower />
      <LotusLeaf x={700} y={330} s={0.6} />
      <LotusLeaf x={740} y={322} s={0.5} flower />
      <LotusLeaf x={1110} y={360} s={0.7} />
      {/* reeds */}
      {[[1150, 418], [1170, 410], [470, 400], [486, 408]].map(([x, y], i) => (
        <g key={i} stroke="#6a9f55" strokeWidth={2} strokeLinecap="round">
          <path d={`M${x} ${y} q-2 -22 -6 -34 M${x + 4} ${y} q2 -26 6 -38`} fill="none" />
          <ellipse cx={x - 6} cy={y - 34} rx={2.6} ry={7} fill="#9c6a42" stroke="none" />
        </g>
      ))}
    </g>
  );
}

function ForestLibrary() {
  const x0 = 176;
  const w = 300;
  const base = 452;
  const top = 236;
  return (
    <g>
      <Shadow x={x0 + w / 2 + 12} y={base} rx={w / 2 + 20} ry={11} o={0.2} />
      {/* body */}
      <rect x={x0} y={top} width={w} height={base - top} fill={u("birch")} {...ln("#a9835a", 1.7)} />
      <rect x={x0} y={top} width={92} height={base - top} fill="url(#w3-slatPat)" />
      <rect x={x0 + w - 14} y={top} width={14} height={base - top} fill="rgba(70,40,10,0.12)" />
      {/* glass curtain walls */}
      <GlassWall x={x0 + 100} y={top + 22} w={186} h={88} cols={4} rows={1} />
      <GlassWall x={x0 + 196} y={top + 124} w={90} h={base - top - 140} cols={2} rows={2} />
      <RectWindowSlim x={x0 + 18} y={top + 40} />
      <RectWindowSlim x={x0 + 18} y={top + 130} />
      {/* entrance */}
      <rect x={x0 + 108} y={top + 116} width={80} height={10} rx={2} fill="#56645d" />
      <Plaque x={330} y={top + 104} text="숲속 도서관" w={104} fill="#fffaf2" color="#3e5d55" line="#7f9c75" />
      <Door x={330} y={base} w={66} h={110} arch={false} fill="glass" line="#56645d" glassTop={false} frame="#56645d" frameLine="#3e4a44" double />
      {/* roof slab with green roof */}
      <rect x={x0 - 16} y={top - 14} width={w + 32} height={16} rx={4} fill="#f6ead2" {...ln("#a9835a", 1.6)} />
      <rect x={x0 - 16} y={top - 2} width={w + 32} height={5} fill="rgba(60,40,10,0.18)" />
      <ForestBand w={w + 20} y={top - 12} h={12} color="#7cc96b" seed={6} />
      <g transform={`translate(${x0 - 10} 0)`}>
        <Bush x={60} y={top - 12} w={70} kind="green" />
        <Bush x={250} y={top - 12} w={60} kind="green" flowers="#ffffff" />
      </g>
      <rect x={x0 - 4} y={base - 10} width={w + 8} height={10} fill={u("stoneGrey")} {...ln("#9e9584", 1.3)} />
      <PottedPlant x={x0 + 88} y={base + 2} s={0.55} kind="round" pot="sage" />
      <PottedPlant x={x0 + 300 - 14} y={base + 2} s={0.6} kind="tall" pot="sage" />
    </g>
  );
}

function RectWindowSlim({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={58} height={70} rx={3} fill="#56645d" />
      <rect x={x + 4} y={y + 4} width={50} height={62} rx={2} fill={u("glass")} />
      <path d={`M${x + 8} ${y + 56} L${x + 30} ${y + 8} L${x + 40} ${y + 8} L${x + 14} ${y + 60} Z`} fill="#ffffff" opacity={0.35} />
      <path d={`M${x + 29} ${y + 4} V${y + 66}`} stroke="#56645d" strokeWidth={2.4} />
    </g>
  );
}

function Lounge() {
  const cx = 1252;
  const base = 452;
  return (
    <g>
      <Shadow x={cx + 10} y={base} rx={92} ry={10} o={0.2} />
      {/* cabin body */}
      <path d={`M${cx - 74} ${base} V300 L${cx} 246 L${cx + 74} 300 V${base} Z`} fill="url(#w3-gl-timber)" {...ln("#8a5a3b", 1.7)} />
      {[...Array(9)].map((_, i) => (
        <path key={i} d={`M${cx - 72} ${312 + i * 16} H${cx + 72}`} stroke="#a8734a" strokeWidth={1.3} opacity={0.5} />
      ))}
      <path d={`M${cx + 60} 300 V${base}`} stroke="rgba(70,40,10,0.15)" strokeWidth={14} />
      {/* round window */}
      <circle cx={cx} cy={290} r={16} fill="#f6ead2" {...ln("#8a5a3b", 1.5)} />
      <circle cx={cx} cy={290} r={11} fill={u("glassWarm")} />
      <path d={`M${cx} 279 V301 M${cx - 11} 290 H${cx + 11}`} stroke="#f6ead2" strokeWidth={2} />
      {/* side windows w/ flower boxes */}
      {[cx - 56, cx + 28].map((x) => (
        <g key={x}>
          <rect x={x} y={352} width={30} height={38} rx={3} fill="#f6ead2" {...ln("#8a5a3b", 1.3)} />
          <rect x={x + 3} y={355} width={24} height={32} rx={2} fill={u("glassWarm")} />
          <path d={`M${x + 15} 355 V387`} stroke="#f6ead2" strokeWidth={2} />
          <rect x={x - 3} y={390} width={36} height={9} rx={2} fill={u("wood")} {...ln("#8a5a3b", 1)} />
          <Flower x={x + 6} y={390} c="#f6a3b8" s={0.8} />
          <Flower x={x + 16} y={389} c="#ffd27a" s={0.8} />
          <Flower x={x + 26} y={390} c="#ffffff" s={0.8} />
        </g>
      ))}
      <Plaque x={cx} y={328} text="휴게 라운지" w={92} fill="#fffaf2" color="#8a4a2e" line="#c4ab86" size={11.5} />
      <Door x={cx} y={base} w={50} h={100} arch fill="wood" line="#8a5a3b" frame="#f6ead2" frameLine="#a9835a" />
      {/* roof */}
      <path d={`M${cx - 96} 312 L${cx} 228 L${cx + 96} 312 L${cx + 84} 316 L${cx} 244 L${cx - 84} 316 Z`} fill="url(#w3-gl-roofGreen)" {...ln("#355a3d", 1.8)} />
      <path d={`M${cx - 88} 308 L${cx - 2} 234`} stroke="#a9d3a6" strokeWidth={2.6} opacity={0.7} />
      <rect x={cx + 34} y={236} width={16} height={34} fill={u("stoneGrey")} {...ln("#8f877b", 1.3)} />
      {/* deck */}
      <rect x={cx - 92} y={base - 6} width={184} height={10} rx={2} fill={u("wood")} {...ln("#8a5a3b", 1.3)} />
      {/* string lights */}
      <path d={`M${cx - 84} 318 Q${cx - 40} 336 ${cx - 30} 320`} stroke="#6b5a4a" strokeWidth={1} fill="none" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} className="w3-twinkle" cx={cx - 78 + i * 14} cy={325 + Math.sin(i) * 3} r={2.6} fill="#ffe7a6" />
      ))}
    </g>
  );
}

function Counsel() {
  const cx = 1470;
  const base = 452;
  return (
    <g>
      <Shadow x={cx + 10} y={base} rx={110} ry={11} o={0.2} />
      {/* stone base */}
      <rect x={cx - 98} y={360} width={196} height={base - 360} fill={u("stoneGrey")} {...ln("#8f877b", 1.6)} />
      {[...Array(14)].map((_, i) => (
        <rect key={i} x={cx - 94 + (i % 7) * 28 + (Math.floor(i / 7) % 2) * 12} y={366 + Math.floor(i / 7) * 34} width={24} height={28} rx={8} fill="#ffffff" opacity={0.18} />
      ))}
      {/* timber upper */}
      <rect x={cx - 98} y={268} width={196} height={94} fill="url(#w3-gl-timber)" {...ln("#8a5a3b", 1.7)} />
      {[...Array(6)].map((_, i) => (
        <path key={i} d={`M${cx - 98 + 16 + i * 34} 270 V360`} stroke="#a8734a" strokeWidth={1.3} opacity={0.5} />
      ))}
      <rect x={cx + 84} y={268} width={14} height={184} fill="rgba(70,40,10,0.13)" />
      {/* big window */}
      <GlassWall x={cx - 84} y={282} w={70} h={60} cols={2} rows={1} />
      <GlassWall x={cx + 16} y={282} w={70} h={60} cols={2} rows={1} />
      <Plaque x={cx} y={310} text="진로 상담실" w={98} fill="#3e5d55" color="#ffffff" line="#2a4540" size={11.5} />
      <Door x={cx} y={base} w={56} h={108} arch={false} fill="sage" line="#6f8f66" frame="#f6ead2" frameLine="#a9835a" glassTop />
      {/* roof */}
      <path d={`M${cx - 118} 272 L${cx - 20} 196 L${cx + 118} 272 L${cx + 104} 276 L${cx - 20} 212 L${cx - 104} 276 Z`} fill="url(#w3-gl-roofClay)" {...ln("#8a4a2e", 1.8)} />
      <path d={`M${cx - 104} 270 L${cx - 22} 204 L${cx + 104} 270 Z`} fill="url(#w3-gl-timber)" opacity={0.9} />
      <path d={`M${cx - 110} 268 L${cx - 22} 200`} stroke="#f6c3a6" strokeWidth={2.6} opacity={0.7} />
      <circle cx={cx - 20} cy={240} r={12} fill="#f6ead2" {...ln("#8a5a3b", 1.4)} />
      <circle cx={cx - 20} cy={240} r={8} fill={u("glass")} />
      <PottedPlant x={cx - 50} y={base + 2} s={0.55} kind="round" pot="terracotta" />
      <PottedPlant x={cx + 52} y={base + 2} s={0.55} kind="succulent" pot="white" />
    </g>
  );
}

function Shore() {
  return (
    <g>
      {/* grass ground */}
      <rect y={286} width={W} height={314} fill={u("grass")} />
      {/* forest path (walkable band) */}
      <path d={`M0 472 Q300 460 620 474 Q900 486 1200 470 Q1420 460 ${W} 474 L${W} 600 L0 600 Z`} fill={u("dirt")} />
      <path d={`M0 472 Q300 460 620 474 Q900 486 1200 470 Q1420 460 ${W} 474`} stroke="#c9a978" strokeWidth={2} fill="none" />
      <path d={`M0 476 Q300 464 620 478 Q900 490 1200 474 Q1420 464 ${W} 478`} stroke="#f7ead2" strokeWidth={2.4} fill="none" opacity={0.6} />
      {/* stepping paths to doors */}
      {[330, 1252, 1470].map((x) => (
        <path key={x} d={`M${x - 28} 452 L${x + 28} 452 L${x + 40} 474 L${x - 40} 474 Z`} fill={u("dirt")} opacity={0.9} />
      ))}
      {/* pebbles on path */}
      {[[120, 540], [260, 580], [460, 520], [700, 560], [940, 590], [1120, 530], [1340, 570], [1500, 520], [380, 560], [860, 528], [1240, 590]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={7} ry={3.5} fill="#cdb48a" opacity={0.7} />
      ))}
      {/* soft grass patches on path */}
      {[[200, 510, 60], [560, 548, 44], [1010, 520, 70], [1420, 548, 50], [760, 586, 60]].map(([x, y, r], i) => (
        <ellipse key={`g${i}`} cx={x} cy={y} rx={r} ry={r * 0.16} fill="#b9d98a" opacity={0.45} />
      ))}
      {[40, 150, 290, 420, 600, 1000, 1130, 1300, 1420, 1560].map((x, i) => (
        <GrassTuft key={`t${x}`} x={x} y={474 + (i % 3) * 2} s={0.8} c="#8cc874" />
      ))}
      {[[180, 476, "#ffffff"], [470, 478, "#f6a3b8"], [1080, 474, "#ffd27a"], [1360, 476, "#b9a7f2"]].map(([x, y, c]) => (
        <Flower key={`f${x}`} x={x as number} y={y as number} c={c as string} s={0.9} />
      ))}
      <rect y={472} width={W} height={128} fill={u("bloom")} opacity={0.4} />
    </g>
  );
}

export function GlobalLakeBack() {
  return (
    <g>
      <GLDefs />
      <Sky w={W} tone="skyFresh" />
      <Clouds items={[[260, 76, 1.0], [700, 110, 0.75], [1060, 64, 1.05], [1440, 100, 0.8]]} />
      <g className="w3-parallax">
        <Far />
      </g>
      <Shore />
      {/* far-shore trees */}
      <Tree x={620} y={300} s={0.55} kind="willow" />
      <Tree x={1000} y={298} s={0.5} kind="pine" sway={false} />
      <Tree x={1050} y={300} s={0.42} kind="pine" sway={false} />
      <Tree x={540} y={302} s={0.46} kind="round" sway={false} />
      <Lake />
      {/* pavilion on water + bridge */}
      <Pavilion x={820} y={362} s={0.78} w={220} onWater tone="classic" />
      <Bridge x={820} yTop={364} yBot={474} wTop={52} wBot={104} />
      {/* ducks */}
      <g className="w3-bob">
        <Duck x={1046} y={404} s={1.15} />
      </g>
      <g className="w3-bob">
        <Duck x={1076} y={410} s={0.7} baby />
      </g>
      <g className="w3-bob">
        <Duck x={1098} y={414} s={0.66} baby />
      </g>
      <g className="w3-bob">
        <Duck x={1118} y={410} s={0.62} baby />
      </g>
      <path d="M1010 410 q-14 4 -30 2 M1012 416 q-12 6 -26 6" stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.6} />

      {/* back trees around buildings */}
      <Tree x={110} y={400} s={1.0} kind="pine" sway={false} />
      <Tree x={40} y={420} s={1.15} kind="round" />
      <Tree x={500} y={440} s={1.05} kind="willow" />
      <Tree x={1360} y={296} s={0.8} kind="pine" sway={false} />
      <Tree x={1590} y={420} s={1.0} kind="pine" sway={false} />
      <Tree x={1160} y={452} s={0.9} kind="round" flip />

      <ForestLibrary />
      <Lounge />
      <Counsel />

      {/* shore details */}
      <Rock x={460} y={460} s={1.1} />
      <Rock x={1196} y={456} s={0.9} />
      <Bush x={700} y={472} w={60} kind="green" flowers="#ffffff" />
      <Bush x={960} y={472} w={80} kind="green" flowers="#f6a3b8" />
      <Signpost x={70} y={466} s={0.95} tone="birch" labels={[{ text: "선배 광장", dir: "l", color: "#d9f2ef" }, { text: "숲길 산책", dir: "l" }]} />
      <Vignette w={W} />
    </g>
  );
}

export function GlobalLakeFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(0 600)">
        <path d="M-10 0 Q30 -48 90 -28 Q120 -18 140 0 Z" fill={u("leafDeep")} {...ln("#3f7a45", 1.6)} />
        <GrassTuft x={40} y={-18} s={1.4} />
        <GrassTuft x={100} y={-6} s={1.1} />
        <Flower x={70} y={-30} c="#ffffff" s={1.2} />
      </g>
      <g transform="translate(1600 600) scale(-1 1)">
        <path d="M-10 0 Q24 -40 80 -26 Q110 -18 130 0 Z" fill={u("leafDeep")} {...ln("#3f7a45", 1.6)} />
        <GrassTuft x={50} y={-14} s={1.3} />
        <Flower x={30} y={-26} c="#ffd27a" s={1.1} />
      </g>
    </g>
  );
}
