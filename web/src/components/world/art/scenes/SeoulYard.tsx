import {
  ArchWindow, Awning, Bench, BrickBuilding, CitySkyline, Clouds, Door, FlowerBed, GinkgoLeaf, LampPost, LeafScatter,
  Plaque, PottedPlant, RectWindow, Ridge, Shadow, Signpost, Sky, Steps, Tree, Vignette, Bush, u, ln, FONT,
} from "../kit";

const W = 1600;

function Far() {
  return (
    <g>
      <Ridge w={W} base={360} pts={[250, 214, 236, 200, 228, 210, 232, 218]} fill="#c8c6dc" o={0.7} />
      <CitySkyline w={W} y={330} seed={14} color="#c4c8dd" o={0.85} />
      <CitySkyline w={W} y={350} seed={31} color="#b3b9d2" />
      {/* tower antenna (namsan-like but generic) */}
      <g fill="#aab1cb">
        <rect x={1268} y={150} width={6} height={80} />
        <ellipse cx={1271} cy={168} rx={12} ry={6} />
      </g>
    </g>
  );
}

function Ground() {
  return (
    <g>
      <rect y={340} width={W} height={90} fill={u("grassFar")} />
      {/* sidewalk */}
      <rect y={418} width={W} height={30} fill={u("stone")} />
      <rect y={418} width={W} height={30} fill="url(#w3-tilePat)" />
      <path d={`M0 418 H${W}`} stroke="#b9ab94" strokeWidth={1.6} />
      {/* ginkgo path (brick pavers) */}
      <rect y={448} width={W} height={152} fill={u("pave")} />
      <rect y={448} width={W} height={152} fill="url(#w3-paverPat)" />
      <path d={`M0 448 H${W}`} stroke="#bfa585" strokeWidth={2} />
      <path d={`M0 451 H${W}`} stroke="#fff2dd" strokeWidth={2} opacity={0.6} />
      {/* center walkway stripe */}
      <path d={`M0 520 Q${W / 2} 506 ${W} 520 L${W} 560 Q${W / 2} 546 0 560 Z`} fill="#efdcc0" opacity={0.6} />
      <rect y={448} width={W} height={152} fill={u("bloom")} opacity={0.5} />
      <LeafScatter x0={0} x1={W} y0={452} y1={596} n={55} seed={5} />
    </g>
  );
}

/** 학생 도서관 (박공 현관 + 아치창) */
function Library() {
  const wins = [
    [210, 214], [262, 214], [470, 214], [522, 214],
  ];
  return (
    <g>
      <BrickBuilding x0={190} top={160} w={380} roof="slate" roofH={36}>
        {wins.map(([x]) => (
          <g key={x}>
            <ArchWindow x={x} y={182} w={38} h={70} />
            <ArchWindow x={x} y={276} w={38} h={70} warm={x === 262 || x === 470} />
          </g>
        ))}
        <RectWindow x={208} y={362} w={86} h={34} cols={3} rows={1} />
        <RectWindow x={466} y={362} w={86} h={34} cols={3} rows={1} />
        {/* ivy */}
        <g fill={u("leaf")} {...ln("#3f7a45", 1.1)}>
          {[[196, 300, 9], [204, 320, 11], [198, 342, 10], [210, 360, 8], [200, 380, 12], [214, 396, 9], [222, 318, 7]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      </BrickBuilding>
      {/* portico */}
      <path d="M316 166 L380 110 L444 166 Z" fill={u("stone")} {...ln("#b2a48d", 1.7)} />
      <path d="M332 160 L380 120 L428 160 Z" fill="#efe6d6" {...ln("#c9bca6", 1.2)} />
      <circle cx={380} cy={145} r={9} fill={u("ginkgo")} {...ln("#b98429", 1.2)} />
      <rect x={322} y={166} width={116} height={234} fill={u("brickDeep")} {...ln("#8f4636", 1.6)} />
      <rect x={322} y={166} width={116} height={234} fill="url(#w3-brickPat)" />
      <rect x={316} y={162} width={128} height={12} rx={2} fill={u("stone")} {...ln("#b2a48d", 1.3)} />
      {[330, 418].map((cx) => (
        <g key={cx}>
          <rect x={cx} y={176} width={12} height={226} fill={u("stone")} {...ln("#b2a48d", 1.3)} />
          <rect x={cx - 3} y={176} width={18} height={8} fill="#efe6d6" {...ln("#b2a48d", 1)} />
        </g>
      ))}
      <ArchWindow x={360} y={186} w={40} h={52} />
      <Plaque x={380} y={260} text="도서관" w={74} color="#6b3a2a" />
      <Door x={380} y={402} w={62} h={118} fill="woodDark" double />
      <Steps x={380} y={420} w={110} n={3} sh={6} depth={8} />
      <PottedPlant x={330} y={420} s={0.6} kind="round" />
      <PottedPlant x={430} y={420} s={0.6} kind="round" />
    </g>
  );
}

function ClockHall() {
  return (
    <g>
      {/* hall */}
      <BrickBuilding x0={580} top={214} w={290} roof="slate" roofH={30}>
        {[700, 750, 800].map((x) => (
          <g key={x}>
            <ArchWindow x={x} y={234} w={36} h={62} />
            <ArchWindow x={x} y={316} w={36} h={62} warm={x === 750} />
          </g>
        ))}
      </BrickBuilding>
      {/* clock tower */}
      <g>
        <Shadow x={650} y={420} rx={50} ry={8} />
        <path d="M596 102 L640 20 L684 102 Z" fill={u("slate")} {...ln("#2f4a43", 1.7)} />
        <path d="M604 100 L640 30" stroke="#a9c9bd" strokeWidth={2.4} opacity={0.7} />
        <path d="M640 20 V4" stroke="#c9a35a" strokeWidth={2.6} />
        <circle cx={640} cy={8} r={4} fill={u("mustard")} />
        <rect x={604} y={100} width={72} height={320} fill={u("brick")} {...ln("#8f4636", 1.7)} />
        <rect x={604} y={100} width={72} height={320} fill="url(#w3-brickPat)" />
        <rect x={664} y={100} width={12} height={320} fill="rgba(70,20,10,0.13)" />
        <rect x={598} y={96} width={84} height={12} rx={2} fill={u("stone")} {...ln("#b2a48d", 1.3)} />
        <rect x={600} y={196} width={80} height={9} rx={2} fill={u("stone")} {...ln("#b2a48d", 1.2)} />
        {/* clock face */}
        <circle cx={640} cy={150} r={32} fill={u("stone")} {...ln("#b2a48d", 1.6)} />
        <circle cx={640} cy={150} r={26} fill="#fffaf0" {...ln("#c9a35a", 2)} />
        {[...Array(12)].map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={640 + Math.sin(a) * 21} cy={150 - Math.cos(a) * 21} r={i % 3 ? 1.2 : 2} fill="#5a4a3e" />;
        })}
        <path d="M640 150 L640 133 M640 150 L652 156" stroke="#3e3226" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={640} cy={150} r={2.4} fill="#d85b4a" />
        <path d="M624 136 Q630 128 640 127" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.7} />
        <ArchWindow x={626} y={220} w={28} h={60} />
        <ArchWindow x={626} y={296} w={28} h={50} />
        <path d="M618 420 V372 A22 22 0 0 1 662 372 V420 Z" fill="#6b3a2a" {...ln("#4a2618", 1.4)} />
        <path d="M624 420 V374 A16 16 0 0 1 656 374 V420 Z" fill={u("glassWarm")} opacity={0.75} />
        <rect x={601} y={402} width={78} height={18} fill={u("stoneGrey")} {...ln("#9e9584", 1.3)} />
      </g>
    </g>
  );
}

function Cafe() {
  return (
    <g>
      <BrickBuilding x0={890} top={196} w={226} tone="brickDeep" roof="flat">
        <RectWindow x={910} y={212} w={54} h={46} />
        <RectWindow x={1042} y={212} w={54} h={46} warm />
        {/* sign board */}
        <g filter={u("drop")}>
          <rect x={940} y={250} width={120} height={28} rx={6} fill={u("chalk")} {...ln("#1f3029", 1.5)} />
          <text x={1000} y={269} textAnchor="middle" fontFamily={FONT} fontSize={13.5} fontWeight={800} fill="#fff1d6">
            선배 카페
          </text>
          <path d="M950 258 q3 -6 6 0" stroke="#f4c94a" strokeWidth={1.5} fill="none" />
        </g>
        {/* shop windows */}
        <g>
          <rect x={902} y={312} width={64} height={90} rx={4} fill="#fff7ea" {...ln("#c4ab86", 1.4)} />
          <rect x={907} y={317} width={54} height={80} rx={2} fill={u("glassWarm")} />
          <path d="M912 326 L940 318 L948 318 L912 360 Z" fill="#ffffff" opacity={0.35} />
          <rect x={1034} y={312} width={64} height={90} rx={4} fill="#fff7ea" {...ln("#c4ab86", 1.4)} />
          <rect x={1039} y={317} width={54} height={80} rx={2} fill={u("glassWarm")} />
          <path d="M1044 326 L1072 318 L1080 318 L1044 360 Z" fill="#ffffff" opacity={0.35} />
          {/* tiny cups silhouettes inside */}
          <g fill="#c98a55" opacity={0.7}>
            <rect x={915} y={380} width={8} height={10} rx={2} />
            <rect x={930} y={382} width={8} height={8} rx={2} />
            <rect x={1050} y={380} width={8} height={10} rx={2} />
            <circle cx={1074} cy={384} r={6} />
          </g>
        </g>
      </BrickBuilding>
      <Awning x={896} y={284} w={210} depth={22} />
      <Door x={1000} y={420} w={58} h={104} arch={false} fill="woodDark" glassTop />
      {/* pendant lamp by door */}
      <circle cx={1000} cy={316} r={30} fill={u("glowSoft")} />
      {/* A-frame chalk sign */}
      <g transform="translate(1074 422)">
        <Shadow x={2} y={0} rx={18} ry={3} />
        <path d="M-14 0 L-8 -40 L8 -40 L14 0" fill={u("chalk")} {...ln("#8a5a3b", 2)} />
        <path d="M-6 -30 H6 M-7 -22 H5 M-8 -14 H7" stroke="#fff1d6" strokeWidth={1.3} opacity={0.8} />
      </g>
      <PottedPlant x={938} y={422} s={0.55} kind="tall" />
    </g>
  );
}

function Counsel() {
  return (
    <g>
      <BrickBuilding x0={1236} top={176} w={210} roof="gable" roofH={60}>
        {[1256, 1384].map((x) => (
          <g key={x}>
            <RectWindow x={x} y={196} w={40} h={58} cols={2} rows={2} />
            <RectWindow x={x} y={290} w={40} h={58} cols={2} rows={2} warm={x === 1384} />
            <rect x={x - 6} y={290 + 64} width={52} height={12} rx={3} fill={u("wood")} {...ln("#8a5a3b", 1.2)} />
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={x + 6 + k * 14} cy={290 + 60} r={5} fill={["#f6a3b8", "#ffd27a", "#ffffff"][k]} {...ln("#c97a8f", 0.8)} />
            ))}
          </g>
        ))}
        <ArchWindow x={1318} y={196} w={24} h={44} />
      </BrickBuilding>
      {/* entrance canopy */}
      <rect x={1288} y={256} width={84} height={10} rx={3} fill={u("stone")} {...ln("#b2a48d", 1.3)} />
      <Plaque x={1330} y={280} text="진로 상담실" w={96} fill="navy" color="#ffffff" line="#163257" />
      <Door x={1330} y={408} w={58} h={108} arch fill="navy" line="#163257" glassTop />
      <Steps x={1330} y={420} w={96} n={2} sh={6} depth={8} />
      <LampPost x={1290} y={420} s={0.5} glow={false} />
      <LampPost x={1370} y={420} s={0.5} glow={false} />
    </g>
  );
}

function FallingLeaves() {
  const leaves = [[1150, 230], [1220, 260], [880, 250], [170, 240], [1530, 250], [210, 270], [1180, 300]];
  return (
    <g>
      {leaves.map(([x, y], i) => (
        <g key={i} className="w3-fall">
          <GinkgoLeaf x={x} y={y} r={i * 40} s={1.2} />
        </g>
      ))}
    </g>
  );
}

export function SeoulYardBack() {
  return (
    <g>
      <Sky w={W} tone="skyWarm" />
      <Clouds items={[[300, 80, 1.0], [760, 50, 0.7], [1100, 96, 0.95], [1450, 60, 0.8]]} />
      <g className="w3-parallax">
        <Far />
      </g>
      <Ground />
      {/* trees behind buildings */}

      {/* left: back to hub */}
      <g>
        <rect x={0} y={360} width={150} height={60} fill={u("brick")} {...ln("#8f4636", 1.4)} />
        <rect x={0} y={360} width={150} height={60} fill="url(#w3-brickPat)" />
        <rect x={-4} y={352} width={158} height={12} rx={2} fill={u("stone")} {...ln("#b2a48d", 1.3)} />
        <Bush x={60} y={354} w={110} kind="deep" />
        <rect x={130} y={330} width={30} height={92} fill={u("stone")} {...ln("#b2a48d", 1.4)} />
        <rect x={126} y={322} width={38} height={12} rx={2} fill={u("stoneGrey")} {...ln("#9e9584", 1.2)} />
        <circle cx={145} cy={314} r={9} fill={u("stone")} {...ln("#b2a48d", 1.2)} />
      </g>
      <Signpost x={70} y={424} s={0.95} labels={[{ text: "선배 광장", dir: "l", color: "#d9f2ef" }, { text: "정문", dir: "l" }]} />

      <Library />
      <ClockHall />
      <Cafe />
      <Counsel />

      {/* far right */}
      <BrickBuilding x0={1480} top={250} w={140} roof="flat">
        <RectWindow x={1500} y={272} w={44} h={50} />
        <RectWindow x={1560} y={272} w={44} h={50} warm />
        <RectWindow x={1500} y={340} w={44} h={50} />
      </BrickBuilding>

      {/* ginkgo-lined path */}
      <Tree x={180} y={428} s={1.05} kind="ginkgo" />
      <Tree x={588} y={428} s={0.9} kind="ginkgo" />
      <Tree x={868} y={428} s={1.0} kind="ginkgo" flip />
      <Tree x={1180} y={428} s={1.3} kind="ginkgo" />
      <Tree x={1540} y={428} s={1.1} kind="ginkgo" flip />
      {[180, 588, 868, 1180, 1540].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={429} rx={34} ry={6} fill="none" stroke="#8f8a80" strokeWidth={1.6} opacity={0.6} />
          <LeafScatter x0={x - 40} x1={x + 50} y0={428} y1={446} n={6} seed={x} />
        </g>
      ))}
      <LampPost x={720} y={430} />
      <LampPost x={1460} y={430} />
      <Bench x={470} y={432} s={0.85} />
      <FlowerBed x={1040} y={434} w={90} seed={12} colors={["#ffd27a", "#f6a3b8", "#ffffff"]} />
      <FallingLeaves />
      <Vignette w={W} />
    </g>
  );
}

export function SeoulYardFront() {
  return (
    <g pointerEvents="none">
      <LeafScatter x0={0} x1={120} y0={584} y1={598} n={10} seed={77} />
      <LeafScatter x0={1480} x1={1600} y0={584} y1={598} n={10} seed={78} />
      <g transform="translate(1600 600) scale(-1 1)">
        <path d="M-10 0 Q16 -34 60 -24 Q92 -16 110 0 Z" fill={u("ginkgo")} {...ln("#b98429", 1.6)} />
        <GinkgoLeaf x={40} y={-30} r={20} s={1.6} />
      </g>
    </g>
  );
}
