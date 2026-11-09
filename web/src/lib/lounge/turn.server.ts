import "server-only";
/**
 * Campus Lounge 대화 처리 계층.
 *   UI(장소·캐릭터) ──▶ handleLoungeTurn ──▶ 기존 runChat (검색·근거·인용검증·LLM/Demo)
 *                                       └─▶ (선택) Career Intelligence Engine
 * 페르소나·장소·외형은 runChat 입력에 들어가지 않는다 → 근거와 사실 답변이 캐릭터와 무관하게 동일.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { PriorityWeights, StudentProfile } from "../types";
import { runChat, type ChatResult } from "../chat/orchestrator";
import { getProvider, type ChatMessage, type LLMUsage } from "../chat/providers";
import { CAREER_FIELDS, extractConcepts, fieldLabel } from "../taxonomy";
import { acquireLLM } from "../aiDemo.server";
import { board } from "../alumni/store.server";
import { isPublicDemo } from "../demoMode";
import { sanitizeForPrompt } from "../security/injection";
import { getFeatures } from "../features";
import { analyzeCareer, type CareerAnalysis } from "../career/engine.server";
import { detectOccupation, INTEL_SIGNAL, occupationForFields } from "../career/occupations";
import { AI_DISCLOSURE, CHARACTER_SHEET, careerIntro, careerOutro, characterReply, clarifyReply, getPersona, greeting, lightReply, smalltalkReply, type GreetingStyle, type PersonaId } from "./personas";
import type { SceneTheme } from "../world/world";
type PlaceId = SceneTheme;
import { classifyTurn, SAFETY_LINES, type LoungeStage } from "./stage";
import { COUNSEL_STYLES, defaultStyleFor, styleLabel, type CounselStyleId, type StyleSetting } from "../counsel/styles";
import { generateStyleView, type StyleView } from "../counsel/generate.server";
import { buildDecisionBrief, type DecisionBrief } from "../counsel/decision";
import { getRagQa, type QaAudience } from "../qa/store.server";
import { getAllRecords } from "../data/repository.server";

export interface LoungeInput {
  question: string;
  profile: StudentProfile;
  history: ChatMessage[];
  place: PlaceId;
  persona: PersonaId;
  greeting: GreetingStyle;
  clarified?: boolean;
  priorities?: PriorityWeights;
  /** 시연 모드 사용자별 제한 키 (익명 세션 ID 또는 IP) */
  user_key?: string;
  /** 이 대화에서 앞서 다룬 관심 분야(클라이언트 세션 누적, 서버에서 taxonomy 로 검증) */
  carry?: string[];
  /** 4.0 상담 스타일. 없으면 캐릭터 성격에서 기본값을 정한다 (3.0 클라이언트 호환) */
  style?: StyleSetting;
  /** 평가용: 관계 그래프 끄기 */
  graph_off?: boolean;
  /** 호출 시점 세션에서 결정한 접근 권한 */
  audience?: QaAudience;
}

export interface LoungeAction {
  id: "seniors" | "compare" | "graph" | "explore" | "roadmap" | "market" | "gap" | "profile" | "alumni";
  label: string;
  href: string;
}

export interface LoungeTurn {
  stage: LoungeStage;
  persona: { id: PersonaId; name: string; title: string };
  intro: string;
  outro?: string;
  core?: Omit<ChatResult, "perspectives">;
  persona_view?: { text: string; source: "llm" | "demo_template"; label?: string };
  style?: { primary: CounselStyleId; secondary: CounselStyleId | null; primaryWeight: number; label: string };
  decision?: DecisionBrief;
  timing?: { total_ms: number; style_ms: number; core_cached: boolean; llm_calls: number; prompt_tokens: number; completion_tokens: number; guard_issues: number; guard_kinds?: string[] };
  followups: { label: string; question: string }[];
  actions: LoungeAction[];
  safety?: string[];
  intel?: Pick<CareerAnalysis, "occupation" | "summary" | "notices" | "postings_live"> & { priorities: { label: string; reason: string }[]; sample: CareerAnalysis["gap"]["sample"] };
  context: { fields: string[]; options: string[]; occupation?: string; intent?: string; carried_fields?: string[] };
  notices?: string[];
  mode: { generative: boolean; label: string };
  disclosure: string;
}

const DEMO_MODE = { generative: false, label: "CPU Demo · 템플릿 응답 (생성형 AI 아님)" };

function styleIntro(id: CounselStyleId, p: boolean, n: number): string {
  const rec = `관련 선배 기록 ${n}건`;
  switch (id) {
    case "strategy": return p ? `${rec}을 근거로 목표와 단계를 나눠 정리해 볼게요.` : `${rec}을 근거로 목표랑 단계를 나눠 정리해 볼게.`;
    case "challenge": return p ? `${rec}을 살펴봤어요. 막힌 길이 있다면 다른 길도 같이 찾아봐요.` : `${rec}을 살펴봤어. 막힌 길이 있다면 다른 길도 같이 찾아보자.`;
    case "empathy": return p ? `고민을 꺼내 줘서 고마워요. 저는 AI라 직접 겪은 경험은 없지만, ${rec}을 찾아봤어요. 천천히 같이 봐요.` : `얘기해 줘서 고마워. 나는 AI라 직접 겪은 건 없지만, ${rec}을 찾아봤어. 천천히 같이 보자.`;
    case "analysis": return p ? `${rec}을 근거로, 무엇이 확인된 사실이고 무엇이 해석인지 나눠서 볼게요.` : `${rec}을 근거로, 확인된 사실이랑 해석을 나눠서 볼게.`;
    case "reflection": return p ? `${rec}을 찾아봤어요. 답을 정하기 전에 함께 생각해 볼 것들을 건넬게요.` : `${rec}을 찾아봤어. 답을 정하기 전에 같이 생각해 볼 것들을 건넬게.`;
  }
}

function styleOutro(id: CounselStyleId, p: boolean): string {
  switch (id) {
    case "strategy": return p ? "아래 버튼으로 로드맵에 옮겨 두면 일정으로 이어 갈 수 있어요." : "아래 버튼으로 로드맵에 옮겨 두면 일정으로 이어 갈 수 있어.";
    case "challenge": return p ? "완벽하게 준비되지 않아도 작은 시도는 시작할 수 있어요." : "완벽하게 준비되지 않아도 작은 시도는 시작할 수 있어.";
    case "empathy": return p ? "오늘은 여기서 하나만 골라 작게 시작해 봐도 충분해요." : "오늘은 여기서 하나만 골라서 작게 시작해 봐도 충분해.";
    case "analysis": return p ? "우선순위를 바꾸면 비교 결과도 달라져요. 진로 비교 화면에서 직접 확인해 보세요." : "우선순위를 바꾸면 비교 결과도 달라져. 진로 비교 화면에서 직접 돌려 봐.";
    case "reflection": return p ? "답은 천천히 찾아도 괜찮아요. 떠오른 생각이 있으면 들려주세요." : "답은 천천히 찾아도 괜찮아. 떠오른 생각이 있으면 들려줘.";
  }
}

function styleWorryReply(id: CounselStyleId, p: boolean): string {
  switch (id) {
    case "strategy": return p ? "막막할 땐 범위를 좁히는 게 도움이 돼요. 기간이나 분야 중 하나만 먼저 정해 볼까요?" : "막막할 땐 범위를 좁히는 게 좋아. 기간이나 분야 중 하나만 먼저 정해 볼까?";
    case "challenge": return p ? "막막함은 아직 시도해 볼 길이 남았다는 뜻이기도 해요. 부담 없이 해 볼 수 있는 작은 시도가 있을까요?" : "막막한 건 아직 해 볼 길이 남았다는 뜻이기도 해. 부담 없이 해 볼 수 있는 작은 시도가 있을까?";
    case "empathy": return p ? "막막한 마음이 드는 건 자연스러운 일이에요. 지금 가장 마음에 걸리는 게 무엇인지 한 가지만 말해 줄래요?" : "막막한 건 당연해. 지금 제일 마음에 걸리는 거 하나만 말해 줄래?";
    case "analysis": return p ? "막막함을 나눠 보면, 정보가 부족한 건지 선택이 어려운 건지에 따라 다음 단계가 달라져요. 어느 쪽에 가까워요?" : "막막함을 나눠 보면, 정보가 부족한 건지 선택이 어려운 건지에 따라 다음 단계가 달라. 어느 쪽에 가까워?";
    case "reflection": return p ? "그 막막함 안에는 무엇이 들어 있을까요? 가장 먼저 떠오르는 단어 하나만 말해 줄래요?" : "그 막막함 안에는 뭐가 들어 있을까? 제일 먼저 떠오르는 단어 하나만 말해 줄래?";
  }
}

export function greetingTurn(persona: PersonaId, style: GreetingStyle, place: PlaceId): string {
  return greeting(persona, style, place);
}

/**
 * 엔진 결과 단기 캐시: 같은 질문·프로필·이력·우선순위면 페르소나·장소가 달라도 같은 사실 답변을 재사용한다.
 * (LLM 샘플링 때문에 호출마다 문장이 달라지는 것을 막아, '선배를 바꾸면 사실이 바뀌는' 인상을 주지 않기 위함)
 * 키는 입력 해시이며 입력 자체가 같은 경우에만 적중하므로 사용자 간 정보가 섞이지 않는다.
 */
/**
 * 근거 저장소의 수정 시각. 캐시 키에 넣어 승인·철회가 즉시 답변에 반영되게 한다
 * (동의를 철회한 경험이 캐시 때문에 계속 인용되면 안 된다).
 */
function ragDataVersion(): string {
  return ["qa/store.json", "alumni/store.json", "imported/records.json", "catalog"]
    .map((f) => {
      try {
        return fs.statSync(path.join(process.cwd(), "data", f)).mtimeMs;
      } catch {
        return 0;
      }
    })
    .join(":");
}

function citedStillAllowed(r: ChatResult, audience: QaAudience): boolean {
  const qa = new Set(getRagQa(audience).map((i) => i.question_id));
  const rec = new Set(getAllRecords().map((x) => x.record_id));
  const graphQa = (r.graph?.facts ?? []).flatMap((f) => f.source_ids);
  return r.qa.every((q) => qa.has(q.id)) && r.evidence.every((e) => rec.has(e.record_id)) && graphQa.every((id) => (id.startsWith("Q-") ? qa.has(id) : rec.has(id)));
}

const CORE_TTL = 10 * 60 * 1000;
const coreCache = new Map<string, { at: number; r: ChatResult }>();
async function runChatCached(input: Parameters<typeof runChat>[0]): Promise<ChatResult & { cached: boolean }> {
  // 스타일은 키에 넣지 않는다: 스타일을 바꿔도 같은 사실 답변을 재사용한다
  const key = createHash("sha256").update(JSON.stringify([input.question, input.profile, input.history, input.priorities ?? null, ragDataVersion(), input.graph_off ?? false, input.audience ?? "anonymous"])).digest("hex");
  const now = Date.now();
  const hit = coreCache.get(key);
  // 캐시가 있어도 인용한 근거가 지금도 접근 가능한지 저장소에서 다시 확인한다 (수정 시각만 믿지 않음)
  if (hit && now - hit.at < CORE_TTL && citedStillAllowed(hit.r, input.audience ?? "anonymous")) return { ...structuredClone(hit.r), cached: true };
  const r = await runChat(input);
  if (coreCache.size > 500) for (const [k, v] of coreCache) if (now - v.at >= CORE_TTL) coreCache.delete(k);
  if (coreCache.size > 500) coreCache.delete(coreCache.keys().next().value!);
  coreCache.set(key, { at: now, r: structuredClone(r) });
  return { ...r, cached: false };
}

/** 가짜 경험담(졸업·합격·입사·재학 시절 등을 자기 경험처럼 말하기) 검출 */
export const FABRICATION = /(제가|내가|저도|나도|저는|나는)\s*(.{0,20})?(졸업했|입사했|합격했|취업했|다녔던|다닐\s*때|재학\s*(시절|중에|때)|학번|인턴(을|으로)?\s*(했|할\s*때)|면접(을|에서)?\s*(봤|볼\s*때)|연봉)/;

/** 자유 대화(인사·캐릭터·가벼운 대화): LLM 이 허용되면 페르소나로 짧게 생성, 아니면 템플릿 */
async function freeTalk(input: LoungeInput, kind: "smalltalk" | "character" | "light" | "closing", fallback: string): Promise<{ text: string; generative: boolean; notice?: string }> {
  const provider = getProvider();
  if (!provider) return { text: fallback, generative: false };
  const slot = acquireLLM(input.user_key ?? "anon", `free:${kind}`);
  if (!slot.ok) return { text: fallback, generative: false, notice: `생성형 AI 대신 템플릿으로 답했습니다: ${slot.reason}.` };
  const p = getPersona(input.persona);
  const c = CHARACTER_SHEET[p.id];
  const styleTone = COUNSEL_STYLES[(input.style ?? defaultStyleFor(p.id)).primary];
  const sys = `너는 한국외국어대학교 진로 도우미 서비스 'AI 과선배'의 가상 캐릭터 '${p.name}'다. 너는 실제 사람이 아닌 AI다.
캐릭터 설정(가상): 좋아하는 것 = ${c.likes}; 꿈 = ${c.dream}; 인사 방식 = ${input.greeting === "polite" ? "존댓말" : "친근한 반말"}.
상담 스타일: ${styleTone.name} — ${styleTone.tone}.
규칙:
1. 실제 대학 생활·졸업·취업·합격·면접·인턴 경험을 너 자신의 경험처럼 절대 말하지 않는다. 물어보면 AI라서 그런 경험이 없다고 밝힌다.
2. 캐릭터 설정(좋아하는 것, 꿈)은 가상 설정임을 유지하며 가볍게 이야기할 수 있다.
3. 통계·채용 일정·연봉·학사 규정 같은 사실 정보는 말하지 않는다. 진로 질문이 나오면 '선배 기록을 찾아볼까?'처럼 근거 검색을 제안한다.
4. 2~4문장, 한국어, 이모지·목록 없이. 사용자의 마음을 먼저 받아 준다.
5. 자해·위기 신호가 보이면 109(자살예방상담전화) 등 전문 상담을 권한다.`;
  const msgs: ChatMessage[] = [{ role: "system", content: sys }, ...input.history.slice(-4).map((h) => ({ role: h.role === "assistant" ? ("assistant" as const) : ("user" as const), content: h.content.slice(0, 600) })), { role: "user", content: sanitizeForPrompt(input.question) }];
  const used: LLMUsage = { prompt_tokens: 0, completion_tokens: 0 };
  try {
    const out = (await provider.complete(msgs, { maxTokens: 220, temperature: 0.6, onUsage: (u) => Object.assign(used, u) })).trim();
    if (!out || FABRICATION.test(out)) return { text: fallback, generative: false, notice: out ? "AI가 실제 경험처럼 들리는 표현을 생성해 템플릿 답변으로 대체했습니다." : undefined };
    return { text: out, generative: true };
  } catch (e) {
    return { text: fallback, generative: false, notice: `LLM 호출 실패로 템플릿을 사용했습니다: ${(e as Error).message.slice(0, 80)}` };
  } finally {
    slot.release(used);
  }
}

/** 이전 사용자 발화에서 관심 분야를 이어받기 (현재 요청에만 사용, 저장하지 않음) */
export function carriedFields(question: string, history: ChatMessage[], carry: string[] = []): string[] {
  // '대학원·연구'는 진로 경로를 뜻하는 경우가 많아 도메인 전환으로 보지 않고, 이어받지도 않는다
  const PATH_LIKE = new Set(["research_academia"]);
  const cur = extractConcepts(question).fields;
  if (cur.some((f) => !PATH_LIKE.has(f))) return [];
  const prev = history.filter((h) => h.role === "user").map((h) => h.content).join("\n");
  const valid = new Set(CAREER_FIELDS.map((f) => f.id));
  const all = [...carry.filter((f) => valid.has(f)), ...extractConcepts(prev).fields];
  return [...new Set(all)].filter((f) => !cur.includes(f) && !PATH_LIKE.has(f)).slice(0, 3);
}

export async function handleLoungeTurn(input: LoungeInput): Promise<LoungeTurn> {
  const p = getPersona(input.persona);
  const base = { persona: { id: p.id, name: p.name, title: p.title }, disclosure: AI_DISCLOSURE };
  const st = classifyTurn(input.question, input.profile, { clarified: input.clarified });

  if (st.stage === "safety")
    return { ...base, stage: "safety", intro: SAFETY_LINES[0], safety: SAFETY_LINES.slice(1), followups: [], actions: [], context: { fields: [], options: [] }, mode: { generative: false, label: "안전 안내 · 고정 문구 (AI 생성 아님)" } };

  if (st.stage === "real_alumni") {
    const b = isPublicDemo() || process.env.FEATURE_ALUMNI_NETWORK !== "1" ? null : board();
    const c = b?.counts ?? { real_verified_experiences: 0, real_mentors: 0, demo_experiences: 0, demo_mentors: 0 };
    const pol = input.greeting === "polite";
    const text =
      c.real_verified_experiences || c.real_mentors
        ? `${pol ? "지금" : "지금"} 관리자 검증을 거친 실제 선배 경험은 ${c.real_verified_experiences}건, 질문을 받을 수 있는 실제 선배는 ${c.real_mentors}명이에요. 선배 경험 게시판에서 출처를 확인하고, 질문 수신에 동의한 선배에게만 질문을 남길 수 있어요. 저는 AI라서 그분들을 대신해 말하지는 않을게요.`
        : `솔직하게 말하면, 지금은 검증된 실제 선배 경험이 아직 없고 질문을 받을 수 있는 실제 선배도 ${pol ? "없어요" : "없어"}. 제가 보여 주는 선배 기록 19건은 모두 서비스 시연용 가상 데이터${pol ? "예요" : "야"}. 실제 선배가 인증하고 질문 수신에 동의하면 게시판에서 연결할 수 있게 ${pol ? "돼요" : "돼"}.`;
    return {
      ...base,
      stage: "real_alumni",
      intro: text,
      followups: [{ label: "가상 선배 기록이라도 볼래요", question: "우리 학과 선배들은 어떤 분야로 진출했나요?" }],
      actions: [{ id: "alumni", label: "선배 경험 게시판·질문함", href: "/alumni" }],
      context: { fields: [], options: [] },
      mode: { generative: false, label: "실제 선배 현황 · 저장소 집계 (AI 생성 아님)" },
    };
  }

  if (st.stage === "closing" || st.stage === "light" || st.stage === "smalltalk" || st.stage === "character") {
    const followups =
      st.stage === "closing"
        ? []
        : [
            { label: "뭘 좋아하는지 모르겠어요", question: "진로가 아직 정해지지 않았어요." },
            { label: "선배들은 어떤 길로 갔어요?", question: "우리 학과 선배들은 어떤 분야로 진출했나요?" },
            { label: "대학원이냐 취업이냐…", question: "대학원 진학과 취업 중에 고민이에요." },
          ];
    const worryStyle = input.style ?? defaultStyleFor(p.id);
    const fallback = st.stage === "light" && st.lightKind === "worry" ? styleWorryReply(worryStyle.primary, input.greeting === "polite") : st.stage === "smalltalk" ? smalltalkReply(p.id, input.greeting) : st.stage === "character" ? characterReply(p.id, input.greeting) : lightReply(p.id, input.greeting, st.lightKind ?? "chat");
    const ft = await freeTalk(input, st.stage, fallback);
    return {
      ...base,
      stage: st.stage,
      intro: ft.text,
      followups,
      actions: [],
      context: { fields: [], options: [] },
      notices: ft.notice ? [ft.notice] : undefined,
      mode: ft.generative ? { generative: true, label: "생성형 AI 자유 대화 · 근거 검색 없음" } : { generative: false, label: "대화 진행 안내 · 템플릿 (사실 정보 없음)" },
    };
  }

  if (st.stage === "clarify") {
    const followups = [
      ...CAREER_FIELDS.slice(0, 8).map((f) => ({ label: f.label, question: `저는 ${f.label} 분야에 관심이 있어요. 어떤 준비가 필요할까요?` })),
      { label: "아직 모르겠어요", question: "아직 관심 분야를 모르겠어요. 선배들은 어떤 분야로 진출했나요?" },
    ];
    return { ...base, stage: "clarify", intro: clarifyReply(p.id, input.greeting), followups, actions: [{ id: "profile", label: "프로필 입력하기 (선택)", href: "/profile" }], context: { fields: [], options: [] }, mode: { generative: false, label: "추가 질문 · 템플릿" } };
  }

  // career: 기존 엔진 그대로 (multi_perspective 로 페르소나 대응 관점까지 같은 근거로 생성)
  // 다중 턴: 이번 질문에 분야가 없으면 앞선 발화의 관심 분야를 이어받는다 (이 요청에만 사용)
  const carried = carriedFields(input.question, input.history, input.carry).filter((f) => !input.profile.interest_fields.includes(f));
  const profile = carried.length ? { ...input.profile, interest_fields: [...input.profile.interest_fields, ...carried] } : input.profile;
  const turnStart = performance.now();
  const setting = input.style ?? defaultStyleFor(p.id);
  const polite = input.greeting === "polite";
  const genStyle = (g: NonNullable<ChatResult["gen"]>, slotHeld: boolean) => generateStyleView({ setting, polite, question: input.question, ctx: g.ctx, facts: g.facts, allowedIds: g.allowed, userKey: input.user_key ?? "anon", slotHeld });
  // 캐시 미스: 사실 답변과 병렬 생성 / 캐시 적중(스타일만 바꾼 경우): 스타일 답변만 1회 생성
  let viewP: Promise<StyleView> | undefined;
  const r = await runChatCached({ question: input.question, profile, history: input.history, priorities: input.priorities, user_key: input.user_key, with_gen: true, graph_off: input.graph_off, audience: input.audience, on_generate: (g) => (viewP = genStyle(g, true)) });
  const { perspectives: _p, cached: coreCached, gen, ...core } = r;
  void _p;
  // 가드레일 답변이나 근거가 없는 답변에는 스타일 설명을 붙이지 않는다 (지어낼 근거가 없음)
  const canStyle = !!gen && r.answer_source !== "guardrail" && !r.insufficient_evidence;
  const view = canStyle ? await (viewP ?? genStyle(gen!, false)) : undefined;
  let pv: LoungeTurn["persona_view"] = view ? { text: view.text, source: view.source, label: styleLabel(setting) } : undefined;
  const turnNotices: string[] = [];
  if (view?.notice) turnNotices.push(view.notice);
  if (pv && FABRICATION.test(pv.text)) {
    pv = undefined;
    turnNotices.push("선배 한마디에 실제 경험처럼 들리는 표현이 있어 표시하지 않았습니다.");
  }
  if (carried.length) turnNotices.push(`앞에서 말한 관심 분야(${carried.map(fieldLabel).join(", ")})를 이어서 반영했어요.`);

  // Career Intelligence (선택 호출)
  let intel: LoungeTurn["intel"];
  const feats = getFeatures();
  const occ = detectOccupation(input.question) ?? (INTEL_SIGNAL.test(input.question) ? occupationForFields([...r.analysis.fields, ...profile.interest_fields]) : undefined);
  if (feats.career_intel && occ && (INTEL_SIGNAL.test(input.question) || r.analysis.intent === "skill_requirements" || r.analysis.intent === "gap_analysis")) {
    const ca = await analyzeCareer(profile, occ.id);
    if (ca) intel = { occupation: ca.occupation, summary: ca.summary, notices: ca.notices, postings_live: ca.postings_live, priorities: ca.gap.priorities.map((x) => ({ label: x.label, reason: x.reason })), sample: ca.gap.sample };
  }

  const fields = [...new Set([...r.analysis.fields, ...carried])];
  const options = r.comparison ? r.comparison.ranking : r.analysis.options;
  const firstId = r.evidence[0]?.record_id;
  const actions: LoungeAction[] = [];
  if (r.evidence.length) actions.push({ id: "seniors", label: "관련 선배 경험 보기", href: `/seniors/${firstId}` });
  actions.push({ id: "compare", label: "진로 선택지 비교하기", href: "/compare" });
  if (firstId) actions.push({ id: "graph", label: "관련 경험 그래프 보기", href: `/graph?record=${firstId}` });
  if (r.graph?.seeds.length) actions.push({ id: "explore", label: "관계 그래프에서 보기", href: `/graph?view=explore&center=${encodeURIComponent(r.graph.seeds[0].id)}` });
  actions.push({ id: "roadmap", label: "나의 로드맵 만들기", href: options[0] ? `/roadmap?option=${options[0]}` : "/roadmap" });
  if (feats.career_intel) {
    const oq = occ ?? occupationForFields([...fields, ...input.profile.interest_fields]);
    actions.push({ id: "market", label: "채용시장 보기", href: `/market${oq ? `?occupation=${oq.id}` : ""}` });
    actions.push({ id: "gap", label: "내 역량 비교하기", href: `/market?tab=gap${oq ? `&occupation=${oq.id}` : ""}` });
  }
  if (process.env.FEATURE_ALUMNI_NETWORK === "1" && !isPublicDemo()) actions.push({ id: "alumni", label: "실제 선배에게 질문하기", href: "/alumni" });

  const followups =
    r.analysis.intent === "compare_paths"
      ? [{ label: "제 스펙에서 부족한 부분은?", question: "제 현재 스펙에서 부족한 부분은 무엇인가요?" }, { label: "선배들의 인턴십 준비는?", question: "선배들은 인턴십을 어떻게 준비했나요?" }]
      : [{ label: "대학원과 취업 비교해 줘", question: `${fields.length ? fieldLabel(fields[0]) + " 분야에서 " : ""}대학원 진학과 취업 중에 고민이에요.` }, { label: "부족한 부분은?", question: "제 현재 스펙에서 부족한 부분은 무엇인가요?" }];

  const generative = r.answer_source === "llm";
  return {
    ...base,
    stage: "career",
    intro: r.direct_kind ? (polite ? "등록된 자료에서 확인해 볼게요." : "등록된 자료에서 확인해 볼게.") : r.insufficient_evidence ? careerIntro(p.id, input.greeting, 0) : styleIntro(setting.primary, polite, r.evidence.length),
    outro: r.direct_kind ? undefined : r.insufficient_evidence ? careerOutro(p.id, input.greeting) : styleOutro(setting.primary, polite),
    core,
    persona_view: pv,
    style: { ...setting, label: styleLabel(setting) },
    decision: r.comparison ? buildDecisionBrief(r.comparison, profile, input.question) : undefined,
    timing: { total_ms: Math.round(performance.now() - turnStart), style_ms: view?.metrics.ms ?? 0, core_cached: coreCached, llm_calls: (generative && !coreCached ? 1 : 0) + (view?.source === "llm" || (view?.metrics.completion_tokens ?? 0) > 0 ? 1 : 0), prompt_tokens: (coreCached ? 0 : r.usage.prompt_tokens) + (view?.metrics.prompt_tokens ?? 0), completion_tokens: (coreCached ? 0 : r.usage.completion_tokens) + (view?.metrics.completion_tokens ?? 0), guard_issues: view?.metrics.guard_issues.length ?? 0, guard_kinds: view?.metrics.guard_issues.map((i) => `${i.kind}:${i.text}`) },
    followups,
    actions,
    intel,
    context: { fields, options, occupation: occ?.id, intent: r.analysis.intent, carried_fields: carried },
    notices: turnNotices.length ? turnNotices : undefined,
    mode: generative ? { generative: true, label: `생성형 AI 상담 · ${r.provider.label}` } : r.answer_source === "guardrail" ? { generative: false, label: "규칙 기반 안내 · LLM 미사용" } : DEMO_MODE,
  };
}
