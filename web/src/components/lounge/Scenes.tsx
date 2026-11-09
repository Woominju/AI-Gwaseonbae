"use client";
/**
 * 세 공간의 배경 일러스트 (독창적 SVG · 1000×600).
 * 특정 건물·사진을 복제하지 않고 '대학 캠퍼스' 분위기만 단순한 도형으로 표현한다.
 */
import type { PlaceId } from "@/lib/lounge/places";

const INK = "#1d2333";
const st = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const };

function Tree({ x, y, s = 1, c = "#5fae6e" }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-9} y={-60} width={18} height={62} rx={4} fill="#8a5a3b" {...st} />
      <g className="lg-sway">
        <circle cx={0} cy={-100} r={46} fill={c} {...st} />
        <circle cx={-34} cy={-74} r={28} fill={c} {...st} />
        <circle cx={34} cy={-74} r={28} fill={c} {...st} />
        <circle cx={-14} cy={-112} r={8} fill="rgba(255,255,255,0.25)" />
      </g>
    </g>
  );
}

function Plaza() {
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor="#eaf7ff" /></linearGradient>
      </defs>
      <rect width={1000} height={600} fill="url(#sky)" />
      <g className="lg-cloud" fill="#fff" {...st} strokeWidth={2.5}>
        <path d="M120,90 q10,-30 40,-20 q20,-26 50,-4 q34,-6 30,24 q-6,18 -30,14 l-80,0 q-26,-2 -10,-14 Z" />
      </g>
      <g className="lg-cloud lg-cloud-2" fill="#fff" {...st} strokeWidth={2.5}>
        <path d="M640,70 q8,-24 34,-16 q18,-22 44,-2 q28,-4 24,20 q-4,14 -24,12 l-68,0 q-22,-2 -10,-14 Z" />
      </g>
      {/* 멀리 보이는 캠퍼스 건물 (가상) */}
      <g {...st}>
        <rect x={60} y={170} width={260} height={170} fill="#e9dcc8" />
        <path d="M50,172 L190,110 L330,172 Z" fill="#b65c4a" />
        {[0, 1, 2, 3].map((i) => [0, 1].map((j) => <rect key={`${i}${j}`} x={86 + i * 58} y={200 + j * 62} width={34} height={40} rx={4} fill="#8fc4e8" />))}
        <rect x={360} y={140} width={300} height={200} fill="#d8e3ef" />
        <rect x={360} y={128} width={300} height={18} fill="#9fb3c8" />
        {[0, 1, 2, 3, 4].map((i) => [0, 1, 2].map((j) => <rect key={`b${i}${j}`} x={378 + i * 56} y={162 + j * 56} width={36} height={36} rx={3} fill="#a9d4f0" />))}
        <rect x={486} y={290} width={48} height={50} fill="#7d8ea3" />
        <rect x={700} y={190} width={200} height={150} fill="#efe3cf" />
        {[0, 1, 2].map((i) => <rect key={`c${i}`} x={724 + i * 60} y={220} width={36} height={80} rx={18} fill="#8fc4e8" />)}
      </g>
      {/* 잔디와 산책로 */}
      <rect y={330} width={1000} height={270} fill="#a8d88a" />
      <path d="M0,600 Q300,420 520,400 Q760,380 1000,440 L1000,600 Z" fill="#e8d9b5" stroke={INK} strokeWidth={3} />
      <path d="M0,345 L1000,345" stroke="#7fb866" strokeWidth={6} />
      <Tree x={70} y={370} s={0.9} />
      <Tree x={900} y={340} s={1.1} c="#6bbf78" />
      {/* 벤치 */}
      <g transform="translate(210,430)" {...st}>
        <rect x={-62} y={-30} width={124} height={14} rx={4} fill="#c98a4b" />
        <rect x={-62} y={-52} width={124} height={12} rx={4} fill="#c98a4b" />
        <rect x={-54} y={-16} width={8} height={22} fill="#5a5a66" />
        <rect x={46} y={-16} width={8} height={22} fill="#5a5a66" />
      </g>
      {/* 게시판 */}
      <g transform="translate(680,360)" {...st}>
        <rect x={-6} y={-40} width={12} height={46} fill="#7a5a3a" />
        <rect x={-60} y={-110} width={120} height={74} rx={6} fill="#c8a06a" />
        <rect x={-50} y={-100} width={30} height={24} fill="#fff7c2" strokeWidth={2} transform="rotate(-6 -35 -88)" />
        <rect x={-12} y={-102} width={28} height={30} fill="#d5f2f1" strokeWidth={2} />
        <rect x={22} y={-96} width={28} height={22} fill="#ffd9d0" strokeWidth={2} transform="rotate(5 36 -85)" />
        <rect x={-36} y={-68} width={60} height={20} fill="#fff" strokeWidth={2} />
      </g>
      {/* 안내판 */}
      <g transform="translate(450,380)" {...st}>
        <rect x={-5} y={-50} width={10} height={54} fill="#5a5a66" />
        <rect x={-52} y={-86} width={104} height={40} rx={6} fill="#0b6f70" />
        <text x={0} y={-60} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={700} stroke="none">진로 지도</text>
      </g>
      {/* 가로등 */}
      <g {...st}>
        <rect x={596} y={250} width={8} height={120} fill="#3d4357" />
        <circle cx={600} cy={246} r={14} fill="#fff3b0" />
      </g>
      <g className="lg-bird" fill={INK}><path d="M300,60 q8,-8 16,0 q8,-8 16,0" fill="none" stroke={INK} strokeWidth={3} /></g>
    </g>
  );
}

function Library({ lampOn }: { lampOn: boolean }) {
  return (
    <g>
      <rect width={1000} height={600} fill="#f1e4cc" />
      <rect y={0} width={1000} height={20} fill="#d9c3a0" />
      {/* 창문 */}
      {[620, 780].map((x) => (
        <g key={x} {...st}>
          <rect x={x} y={70} width={130} height={200} rx={60} fill="#cfe8ff" />
          <path d={`M${x + 65},70 L${x + 65},270 M${x},170 L${x + 130},170`} stroke={INK} strokeWidth={3} />
          <path d={`M${x + 10},270 L${x - 60},600 L${x + 200},600 L${x + 120},270 Z`} fill="rgba(255,250,210,0.35)" stroke="none" />
        </g>
      ))}
      {/* 책장 */}
      <g {...st}>
        <rect x={40} y={60} width={250} height={290} fill="#8a5a3b" />
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            <rect x={52} y={74 + r * 68} width={226} height={56} fill="#6b4329" />
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} x={58 + i * 24} y={82 + r * 68 + (i % 3) * 4} width={18} height={48 - (i % 3) * 4} fill={["#e2725b", "#14a3a3", "#e9b949", "#7c5cbf", "#3f8f5a", "#2a5591"][(i + r) % 6]} strokeWidth={2} />
            ))}
          </g>
        ))}
      </g>
      <rect x={300} y={90} width={90} height={110} rx={6} fill="#fff" {...st} />
      <circle cx={345} cy={145} r={34} fill="#fff" {...st} />
      <path d="M345,145 L345,122 M345,145 L362,152" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* 포스터 */}
      <g transform="translate(860,230) rotate(3)" {...st}>
        <rect x={-50} y={-40} width={100} height={70} fill="#ffefb0" />
        <text x={0} y={-12} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK} stroke="none">대학원 vs 취업</text>
        <text x={0} y={8} textAnchor="middle" fontSize={11} fill={INK} stroke="none">비교해 보기 →</text>
      </g>
      {/* 바닥·러그 */}
      <rect y={360} width={1000} height={240} fill="#c9a77c" />
      <path d="M0,360 L1000,360" stroke={INK} strokeWidth={3} />
      <ellipse cx={520} cy={500} rx={360} ry={70} fill="#b5543f" opacity={0.35} />
      {/* 긴 책상 */}
      <g {...st}>
        <rect x={400} y={340} width={300} height={22} rx={6} fill="#a26b3f" />
        <rect x={414} y={362} width={10} height={44} fill="#6b4329" />
        <rect x={676} y={362} width={10} height={44} fill="#6b4329" />
        <path d="M496,340 L520,326 L544,340 Z" fill="#fff" />
        <path d="M520,326 L520,340" stroke={INK} strokeWidth={2} />
        <rect x={628} y={300} width={6} height={40} fill="#3d4357" />
        <path d="M612,300 L650,300 L640,280 L622,280 Z" fill={lampOn ? "#ffd84d" : "#8f8f8f"} />
      </g>
      {lampOn && <ellipse cx={631} cy={346} rx={70} ry={16} fill="rgba(255,230,120,0.45)" />}
      <g transform="translate(950,380)" {...st}>
        <rect x={-18} y={-30} width={36} height={32} rx={4} fill="#c98a4b" />
        <path d="M0,-30 q-24,-40 -6,-70 q8,30 6,70 q10,-50 28,-60 q-6,40 -28,60" fill="#5fae6e" />
      </g>
      {!lampOn && <rect width={1000} height={600} fill="rgba(20,20,50,0.12)" pointerEvents="none" />}
    </g>
  );
}

function Cafe() {
  return (
    <g>
      <rect width={1000} height={600} fill="#f6e7d7" />
      <rect y={0} width={1000} height={130} fill="#e9d2b8" />
      {/* 펜던트 조명 */}
      {[380, 560, 760].map((x) => (
        <g key={x} {...st}>
          <path d={`M${x},0 L${x},60`} stroke={INK} strokeWidth={2} />
          <path d={`M${x - 24},84 L${x + 24},84 L${x + 12},60 L${x - 12},60 Z`} fill="#2b3a55" />
          <circle cx={x} cy={88} r={6} fill="#ffe98a" />
        </g>
      ))}
      {/* 메뉴판 */}
      <g {...st}>
        <rect x={140} y={110} width={180} height={130} rx={8} fill="#2f3b37" />
        <text x={230} y={140} textAnchor="middle" fill="#fff" fontSize={15} fontWeight={700} stroke="none">오늘의 메뉴</text>
        <text x={230} y={168} textAnchor="middle" fill="#ffe98a" fontSize={12} stroke="none">직무 역량 라떼</text>
        <text x={230} y={190} textAnchor="middle" fill="#ffe98a" fontSize={12} stroke="none">채용공고 아메리카노</text>
        <text x={230} y={212} textAnchor="middle" fill="#9fe3d9" fontSize={11} stroke="none">(샷 추가: 근거 확인)</text>
      </g>
      {/* 카운터 + 커피머신 */}
      <g {...st}>
        <rect x={30} y={250} width={300} height={110} fill="#a26b3f" />
        <rect x={30} y={240} width={300} height={16} fill="#6b4329" />
        <rect x={80} y={196} width={80} height={46} rx={6} fill="#c0c7d1" />
        <rect x={96} y={210} width={18} height={18} rx={3} fill="#2b3245" />
        <rect x={124} y={210} width={18} height={18} rx={3} fill="#e2725b" />
        <path d="M200,244 L200,224 Q214,216 228,224 L228,244 Z" fill="#fff" />
      </g>
      <g className="lg-steam" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round">
        <path d="M208,212 q-6,-10 0,-18 q6,-8 0,-16" />
        <path d="M220,212 q-6,-10 0,-18 q6,-8 0,-16" />
      </g>
      {/* 창 */}
      <g {...st}>
        <rect x={470} y={140} width={420} height={150} rx={10} fill="#cfe8ff" />
        <path d="M610,140 L610,290 M750,140 L750,290" stroke={INK} strokeWidth={3} />
        <circle cx={540} cy={250} r={26} fill="#6bbf78" />
        <circle cx={820} cy={240} r={30} fill="#5fae6e" />
      </g>
      <rect y={360} width={1000} height={240} fill="#d8b48a" />
      {Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M${i * 110},360 L${i * 110 - 60},600`} stroke="rgba(0,0,0,0.08)" strokeWidth={3} />)}
      <path d="M0,360 L1000,360" stroke={INK} strokeWidth={3} />
      {/* 테이블 + 노트북 */}
      {[{ x: 470, y: 400 }, { x: 700, y: 400 }].map((t, i) => (
        <g key={i} {...st}>
          <ellipse cx={t.x} cy={t.y} rx={62} ry={16} fill="#fff7ee" />
          <rect x={t.x - 5} y={t.y + 10} width={10} height={44} fill="#3d4357" />
          {i === 1 ? (
            <g>
              <path d={`M${t.x - 26},${t.y - 4} L${t.x + 26},${t.y - 4} L${t.x + 32},${t.y + 2} L${t.x - 32},${t.y + 2} Z`} fill="#9aa4b2" />
              <rect x={t.x - 24} y={t.y - 40} width={48} height={34} rx={3} fill="#2b3245" />
              <rect x={t.x - 18} y={t.y - 34} width={14} height={20} fill="#14a3a3" strokeWidth={1.5} />
              <rect x={t.x + 2} y={t.y - 28} width={14} height={14} fill="#e9b949" strokeWidth={1.5} />
            </g>
          ) : (
            <path d={`M${t.x - 10},${t.y - 2} L${t.x - 10},${t.y - 20} L${t.x + 10},${t.y - 20} L${t.x + 10},${t.y - 2} Z`} fill="#fff" />
          )}
        </g>
      ))}
      <g transform="translate(940,380)" {...st}>
        <rect x={-20} y={-36} width={40} height={38} rx={4} fill="#e2725b" />
        <circle cx={0} cy={-62} r={30} fill="#5fae6e" />
        <circle cx={-18} cy={-78} r={16} fill="#6bbf78" />
      </g>
    </g>
  );
}

export function SceneBackground({ place, lampOn }: { place: PlaceId; lampOn: boolean }) {
  if (place === "plaza") return <Plaza />;
  if (place === "library") return <Library lampOn={lampOn} />;
  return <Cafe />;
}
