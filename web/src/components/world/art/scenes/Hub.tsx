import {
  Bench, Bush, Clouds, FlowerBed, Fountain, ForestBand, GrassTuft, Kiosk, LampPost, NoticeBoard, Pavilion,
  LeafScatter, Ridge, Rock, Signpost, Sky, Tree, Vignette, WardrobeBooth, Flower, u, ln,
} from "../kit";

const W = 1600;

/** 원경: 왼쪽엔 서울(벽돌 시계탑), 오른쪽엔 글로벌(언덕 위 정자) 실루엣이 보인다 */
function Far() {
  return (
    <g>
      <Ridge w={W} base={420} pts={[270, 240, 262, 228, 250, 236, 258, 230, 248]} fill="#bcd9e6" o={0.9} />
      {/* 서울 쪽 실루엣 */}
      <g fill="#c9b7c4" opacity={0.75}>
        <rect x={60} y={196} width={60} height={90} rx={2} />
        <rect x={128} y={170} width={26} height={116} />
        <path d="M124 172 L141 140 L158 172 Z" />
        <rect x={160} y={214} width={70} height={72} rx={2} />
        <rect x={236} y={226} width={40} height={60} />
        <circle cx={141} cy={190} r={7} fill="#efe5ea" />
      </g>
      {/* 글로벌 쪽 언덕 위 정자 */}
      <g opacity={0.7}>
        <path d="M1300 270 Q1420 200 1560 250 L1600 260 L1600 300 L1300 300 Z" fill="#a9cfb6" />
        <path d="M1402 214 Q1430 200 1458 214 L1450 208 Q1430 196 1410 208 Z" fill="#8aa4ad" />
        <rect x={1414} y={214} width={3} height={14} fill="#8aa4ad" />
        <rect x={1443} y={214} width={3} height={14} fill="#8aa4ad" />
      </g>
      <Ridge w={W} base={420} pts={[318, 296, 310, 290, 304, 298, 312, 292, 306]} fill="#a5d0a6" />
      <ForestBand w={W} y={352} h={46} color="#86bf7e" seed={21} />
    </g>
  );
}

function PlazaFloor() {
  return (
    <g>
      {/* lawn behind */}
      <rect y={340} width={W} height={80} fill={u("grass")} />
      {/* plaza */}
      <path d={`M0 404 Q${W / 2} 392 ${W} 404 L${W} 600 L0 600 Z`} fill={u("plaza")} />
      <path d={`M0 404 Q${W / 2} 392 ${W} 404 L${W} 600 L0 600 Z`} fill="url(#w3-tilePat)" />
      <path d={`M0 404 Q${W / 2} 392 ${W} 404`} stroke="#c8ab7f" strokeWidth={2} fill="none" />
      <path d={`M0 408 Q${W / 2} 396 ${W} 408`} stroke="#fff5e1" strokeWidth={3} fill="none" opacity={0.7} />
      {/* circular inlay around fountain */}
      <ellipse cx={800} cy={470} rx={360} ry={84} fill="#ead2ab" opacity={0.7} />
      <ellipse cx={800} cy={470} rx={360} ry={84} fill="none" stroke="#d1b289" strokeWidth={2} />
      <ellipse cx={800} cy={470} rx={330} ry={72} fill="none" stroke="#fff4dd" strokeWidth={2.5} opacity={0.8} />
      <ellipse cx={800} cy={470} rx={240} ry={50} fill="none" stroke="#d1b289" strokeWidth={1.5} strokeDasharray="10 8" opacity={0.7} />
      {[...Array(16)].map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <circle key={i} cx={800 + Math.cos(a) * 345} cy={470 + Math.sin(a) * 78} r={4} fill="#c6a878" opacity={0.6} />;
      })}
      {/* paths toward campuses */}
      <path d="M0 520 Q200 500 440 480" stroke="#f7ead2" strokeWidth={26} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d="M1160 480 Q1400 500 1600 520" stroke="#f7ead2" strokeWidth={26} fill="none" opacity={0.55} strokeLinecap="round" />
      {/* drifted petals */}
      <LeafScatter x0={40} x1={1560} y0={430} y1={596} n={46} seed={17} colors={["#f8c9d4", "#fbd9e1", "#ffffff"]} />
      {/* floor light */}
      <rect y={404} width={W} height={196} fill={u("bloom")} opacity={0.5} />
    </g>
  );
}

function BackGarden() {
  return (
    <g>
      <Tree x={40} y={392} s={1.05} kind="round" />
      <Tree x={210} y={380} s={0.85} kind="pine" />
      <Tree x={420} y={384} s={1.0} kind="cherry" />
      <Tree x={650} y={378} s={0.9} kind="round" />
      <Tree x={960} y={378} s={0.88} kind="round" flip />
      <Tree x={1040} y={386} s={0.8} kind="pine" />
      <Tree x={1390} y={384} s={1.0} kind="cherry" flip />
      <Tree x={1570} y={392} s={1.05} kind="round" flip />
      {/* hedges */}
      <Bush x={150} y={404} w={150} kind="deep" />
      <Bush x={400} y={404} w={110} kind="green" flowers="#ffd27a" />
      <Bush x={660} y={402} w={130} kind="green" flowers="#f6a3b8" />
      <Bush x={940} y={402} w={130} kind="green" flowers="#f6a3b8" />
      <Bush x={1520} y={404} w={150} kind="deep" />
      <LampPost x={400} y={416} />
      <LampPost x={1010} y={414} />
      {/* string lights between lamps */}
      <path d="M400 214 Q560 262 700 232" stroke="#8a7a6a" strokeWidth={1.2} fill="none" opacity={0.7} />
      <path d="M1010 212 Q900 254 860 236" stroke="#8a7a6a" strokeWidth={1.2} fill="none" opacity={0.7} />
      {[...Array(9)].map((_, i) => {
        const t = (i + 1) / 10;
        const x = 400 + 300 * t;
        const y = (1 - t) * (1 - t) * 214 + 2 * (1 - t) * t * 262 + t * t * 232 + 6;
        return <path key={i} d={`M${x - 6} ${y - 4} L${x + 6} ${y - 4} L${x} ${y + 8} Z`} fill={["#f6a3b8", "#ffd27a", "#7fd3cc", "#b9a7f2"][i % 4]} {...ln("rgba(120,80,60,0.35)", 0.8)} />;
      })}
    </g>
  );
}

export function HubBack() {
  return (
    <g>
      <Sky w={W} />
      <Clouds items={[[260, 90, 1.1], [620, 60, 0.8], [980, 110, 1.0], [1340, 70, 0.9], [1520, 140, 0.6]]} />
      <g className="w3-parallax">
        <Far />
      </g>
      <PlazaFloor />
      <BackGarden />

      {/* 서울 방향 표지판 */}
      <Signpost x={95} y={418} labels={[{ text: "서울캠퍼스", dir: "l", color: "#f7d9cf" }, { text: "도서관·카페", dir: "l" }]} />
      <FlowerBed x={160} y={428} w={70} seed={2} colors={["#f6a3b8", "#ffffff"]} />

      <WardrobeBooth x={285} y={418} />
      <NoticeBoard x={520} y={418} />

      {/* 분수대와 화단 */}
      <FlowerBed x={636} y={410} w={110} seed={8} />
      <FlowerBed x={966} y={410} w={110} seed={9} colors={["#b9a7f2", "#ffd27a", "#ffffff", "#f6a3b8"]} />
      <Fountain x={800} y={420} />
      <Bench x={625} y={424} s={0.92} />

      {/* AI 선배 상담 정자 */}
      <Pavilion x={1215} y={420} w={250} tone="teal" sign="AI 선배 상담 정자" />
      <Bush x={1062} y={424} w={70} kind="green" flowers="#ffffff" />
      <Bush x={1352} y={426} w={56} kind="green" flowers="#ffd27a" />

      <Kiosk x={1420} y={420} />
      {/* 글로벌 방향 표지판 */}
      <Signpost x={1548} y={420} labels={[{ text: "글로벌캠퍼스", dir: "r", color: "#d4efd8", shift: -62 }, { text: "호수·숲길", dir: "r", shift: -40 }]} s={0.95} />

      {/* small details on plaza */}
      <Rock x={1110} y={590} s={0.9} />
      <Vignette w={W} />
    </g>
  );
}

export function HubFront() {
  return (
    <g pointerEvents="none">
      <g transform="translate(0 600)">
        <path d="M-10 0 Q20 -40 70 -26 Q100 -20 120 0 Z" fill={u("leaf")} {...ln("#3f7a45", 1.6)} />
        <GrassTuft x={30} y={-14} s={1.1} />
        <Flower x={40} y={-30} c="#f6a3b8" s={1.3} />
        <Flower x={78} y={-20} c="#ffd27a" s={1.1} />
      </g>
      <g transform="translate(1600 600) scale(-1 1)">
        <path d="M-10 0 Q20 -44 76 -28 Q108 -20 130 0 Z" fill={u("leaf")} {...ln("#3f7a45", 1.6)} />
        <Flower x={36} y={-32} c="#ffffff" s={1.3} />
        <Flower x={80} y={-20} c="#b9a7f2" s={1.1} />
        <GrassTuft x={60} y={-12} s={1.2} />
      </g>
    </g>
  );
}
