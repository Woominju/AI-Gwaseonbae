"use client";
/**
 * HUFS 선배마을 캐릭터 (독자 디자인 · SVG).
 * 둥근 사각 '콩' 머리 + 떨어진 점 눈·눈썹 + 짧은 후드티 몸통 + 두꺼운 외곽선의 단순한 B급 카툰 스타일.
 * 좌표: 발끝이 (0,0), 위로 음수. 상태(state)에 따라 CSS 애니메이션 클래스가 바뀐다.
 */
import * as React from "react";
import type { AvatarLook, AvatarState } from "@/lib/lounge/avatar";

const INK = "#1d2333";

function Hair({ look, back }: { look: AvatarLook; back?: boolean }) {
  const c = look.hairColor;
  const p = { fill: c, stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const };
  if (back) {
    if (look.hair === "bob") return <path d="M-42,-118 Q-46,-74 -30,-70 L30,-70 Q46,-74 42,-118 Z" {...p} />;
    if (look.hair === "ponytail") return <path d="M30,-118 Q62,-110 54,-78 Q50,-66 44,-80 Q48,-100 30,-104 Z" {...p} />;
    return null;
  }
  switch (look.hair) {
    case "short":
      return <path d="M-39,-112 Q-40,-146 0,-146 Q40,-146 39,-112 Q24,-128 6,-124 Q-12,-134 -39,-112 Z" {...p} />;
    case "bob":
      return <path d="M-41,-104 Q-44,-148 0,-148 Q44,-148 41,-104 Q34,-126 14,-128 Q-4,-120 -20,-130 Q-34,-124 -41,-104 Z" {...p} />;
    case "curly":
      return (
        <g {...p}>
          {[-30, -15, 0, 15, 30].map((x, i) => <circle key={i} cx={x} cy={-138 + (i % 2) * 4} r={12} />)}
          <circle cx={-38} cy={-120} r={9} />
          <circle cx={38} cy={-120} r={9} />
        </g>
      );
    case "ponytail":
      return <path d="M-39,-110 Q-38,-147 2,-147 Q40,-146 39,-110 Q20,-132 -2,-128 Q-22,-124 -39,-110 Z" {...p} />;
    case "buzz":
      return <path d="M-37,-118 Q-34,-142 0,-142 Q34,-142 37,-118 Q0,-132 -37,-118 Z" fill={c} opacity={0.85} stroke={INK} strokeWidth={2} />;
    case "bun":
      return (
        <g {...p}>
          <circle cx={0} cy={-156} r={13} />
          <path d="M-39,-112 Q-40,-146 0,-146 Q40,-146 39,-112 Q16,-130 -39,-112 Z" />
        </g>
      );
  }
}

function Accessory({ look }: { look: AvatarLook }) {
  const s = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const };
  switch (look.accessory) {
    case "glasses":
      return (
        <g {...s} fill="rgba(255,255,255,0.35)">
          <rect x={-29} y={-112} width={22} height={16} rx={6} />
          <rect x={7} y={-112} width={22} height={16} rx={6} />
          <path d="M-7,-104 L7,-104" fill="none" />
        </g>
      );
    case "beanie":
      return (
        <g {...s}>
          <path d="M-40,-118 Q-40,-156 0,-156 Q40,-156 40,-118 Z" fill="#e2725b" />
          <rect x={-42} y={-124} width={84} height={12} rx={6} fill="#f2f2f2" />
          <circle cx={0} cy={-160} r={7} fill="#f2f2f2" />
        </g>
      );
    case "headphones":
      return (
        <g {...s}>
          <path d="M-40,-108 Q-40,-156 0,-156 Q40,-156 40,-108" fill="none" strokeWidth={5} />
          <rect x={-48} y={-116} width={12} height={22} rx={5} fill="#2b3a55" />
          <rect x={36} y={-116} width={12} height={22} rx={5} fill="#2b3a55" />
        </g>
      );
    case "cap":
      return (
        <g {...s}>
          <path d="M-38,-120 Q-38,-150 0,-150 Q38,-150 38,-120 Z" fill={look.outfit} />
          <path d="M-4,-122 L52,-122 Q56,-114 46,-114 L-4,-114 Z" fill={look.outfit} />
        </g>
      );
    case "scarf":
      return (
        <g {...s} fill="#e9b949">
          <rect x={-26} y={-74} width={52} height={12} rx={6} />
          <rect x={10} y={-66} width={12} height={22} rx={4} />
        </g>
      );
    default:
      return null;
  }
}

function Face({ look, state }: { look: AvatarLook; state: AvatarState }) {
  const e = look.expression;
  const brow = e === "cheeky" ? ["M-26,-120 L-10,-122", "M10,-126 L26,-120"] : e === "calm" ? ["M-26,-119 L-10,-119", "M10,-119 L26,-119"] : ["M-26,-118 Q-18,-124 -10,-120", "M10,-120 Q18,-124 26,-118"];
  const thinking = state === "thinking";
  const eyeY = thinking ? -106 : -104;
  const mouthClosed = e === "grin" ? "M-12,-88 Q0,-76 12,-88 Z" : e === "calm" ? "M-8,-86 L8,-86" : e === "cheeky" ? "M-8,-86 Q4,-80 12,-90" : "M-10,-88 Q0,-80 10,-88";
  return (
    <g>
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d={brow[0]} />
        <path d={brow[1]} />
      </g>
      <g className={state === "idle" ? "lg-blink" : undefined}>
        <ellipse cx={-17} cy={eyeY} rx={4.5} ry={6} fill={INK} />
        <ellipse cx={17} cy={eyeY} rx={4.5} ry={6} fill={INK} />
        <circle cx={-15.5} cy={eyeY - 2} r={1.6} fill="#fff" />
        <circle cx={18.5} cy={eyeY - 2} r={1.6} fill="#fff" />
      </g>
      <circle cx={-27} cy={-92} r={5} fill="#f08a8a" opacity={0.45} />
      <circle cx={27} cy={-92} r={5} fill="#f08a8a" opacity={0.45} />
      {state === "speaking" ? (
        <g>
          <path className="lg-mouth-a" d={mouthClosed} stroke={INK} strokeWidth={3} strokeLinecap="round" fill={e === "grin" ? "#7a2e2e" : "none"} />
          <ellipse className="lg-mouth-b" cx={0} cy={-86} rx={7} ry={6} fill="#7a2e2e" stroke={INK} strokeWidth={2.5} />
        </g>
      ) : thinking ? (
        <path d="M-6,-86 Q2,-90 8,-86" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
      ) : state === "encouraging" || state === "greeting" ? (
        <path d="M-13,-90 Q0,-74 13,-90 Z" stroke={INK} strokeWidth={3} strokeLinejoin="round" fill="#7a2e2e" />
      ) : (
        <path d={mouthClosed} stroke={INK} strokeWidth={3} strokeLinecap="round" fill={e === "grin" ? "#7a2e2e" : "none"} />
      )}
    </g>
  );
}

export function Avatar({ look, state = "idle", label, badge, facing = 1, size = 1, highlight }: { look: AvatarLook; state?: AvatarState; label?: string; badge?: string; facing?: 1 | -1; size?: number; highlight?: boolean }) {
  const s = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const };
  return (
    <g className={`lg-avatar lg-state-${state}`} transform={`scale(${size})`}>
      <ellipse cx={0} cy={2} rx={30} ry={7} fill="rgba(0,0,0,0.18)" className="lg-shadow" />
      {highlight && <ellipse cx={0} cy={2} rx={40} ry={11} fill="none" stroke="#14a3a3" strokeWidth={3} strokeDasharray="6 5" className="lg-ring" />}
      <g className="lg-body">
        <g transform={`scale(${facing},1)`}>
          {/* legs */}
          <g className="lg-legs">
            <rect className="lg-leg-l" x={-16} y={-26} width={13} height={24} rx={5} fill="#2b3245" {...s} />
            <rect className="lg-leg-r" x={3} y={-26} width={13} height={24} rx={5} fill="#2b3245" {...s} />
            <ellipse cx={-10} cy={-2} rx={10} ry={5} fill="#f4f4f4" {...s} />
            <ellipse cx={10} cy={-2} rx={10} ry={5} fill="#f4f4f4" {...s} />
          </g>
          {/* arms */}
          <g className="lg-arm-l"><path d="M-24,-62 Q-38,-48 -34,-34" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" /><path d="M-24,-62 Q-38,-48 -34,-34" fill="none" stroke={look.outfit} strokeWidth={6} strokeLinecap="round" /><circle cx={-34} cy={-32} r={6} fill={look.skin} {...s} /></g>
          <g className="lg-arm-r"><path d="M24,-62 Q38,-48 34,-34" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" /><path d="M24,-62 Q38,-48 34,-34" fill="none" stroke={look.outfit} strokeWidth={6} strokeLinecap="round" /><circle cx={34} cy={-32} r={6} fill={look.skin} {...s} /></g>
          {/* torso (hoodie) */}
          <path d="M-26,-70 Q0,-78 26,-70 L30,-26 Q0,-20 -30,-26 Z" fill={look.outfit} {...s} />
          <path d="M-12,-46 L12,-46 L10,-34 L-10,-34 Z" fill="rgba(0,0,0,0.12)" />
          <path d="M-6,-70 L-4,-56 M6,-70 L4,-56" stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
          {/* head */}
          <g className="lg-head">
            <Hair look={look} back />
            <rect x={-38} y={-142} width={76} height={74} rx={30} fill={look.skin} {...s} />
            <Hair look={look} />
            <Face look={look} state={state} />
            <Accessory look={look} />
          </g>
        </g>
        {state === "thinking" && (
          <g transform="translate(34,-150)" className="lg-think">
            <rect x={0} y={-16} width={44} height={24} rx={12} fill="#fff" {...s} />
            {[12, 22, 32].map((x, i) => <circle key={x} cx={x} cy={-4} r={3} fill={INK} className={`lg-dot lg-dot-${i}`} />)}
          </g>
        )}
        {state === "encouraging" && (
          <g className="lg-sparkle" fill="#e9b949" stroke={INK} strokeWidth={2}>
            <path d="M-50,-140 l4,-10 l4,10 l10,4 l-10,4 l-4,10 l-4,-10 l-10,-4 Z" />
            <path d="M46,-120 l3,-7 l3,7 l7,3 l-7,3 l-3,7 l-3,-7 l-7,-3 Z" />
          </g>
        )}
      </g>
      {label && (
        <g transform="translate(0,-176)">
          <rect x={-((label.length + (badge ? badge.length + 1 : 0)) * 7 + 14)} y={-14} width={((label.length + (badge ? badge.length + 1 : 0)) * 7 + 14) * 2} height={24} rx={12} fill="rgba(11,31,58,0.88)" />
          <text x={0} y={3} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">
            {badge && <tspan fill="#5ee0d6">{badge} </tspan>}
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/** 독립 미리보기용 (꾸미기 화면) */
export function AvatarPreview({ look, state = "idle", className, title }: { look: AvatarLook; state?: AvatarState; className?: string; title?: string }) {
  return (
    <svg viewBox="-70 -190 140 200" className={className} role="img" aria-label={title ?? "캐릭터 미리보기"}>
      <Avatar look={look} state={state} />
    </svg>
  );
}
