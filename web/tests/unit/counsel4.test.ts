import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { stylePrompt, templateView, type CounselFacts } from "@/lib/counsel/compose";
import { buildDecisionBrief, gpaInQuestion } from "@/lib/counsel/decision";
import { checkStyleText, numbersIn } from "@/lib/counsel/guard";
import { BLEND_WEIGHTS, COUNSEL_STYLES, defaultStyleFor, sanitizeStyleSetting, sentenceBudget, STYLE_IDS, styleLabel, type StyleSetting } from "@/lib/counsel/styles";
import { detectPII, QaItemSchema, ragEligible, tierOf, type QaItem } from "@/lib/qa/schema";
import type { StudentProfile } from "@/lib/types";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }), headers: async () => new Headers() }));

const FACTS: CounselFacts = { evidenceCount: 3, cite: "[S-01][S-02]", monthsRange: [4, 11], gaps: ["SQL", "통계"], topOption: "취업", otherOption: "대학원", margin: 0.08, weeklyHours: 10, lesson: { text: "작게 시작했다", id: "S-01" }, difficulty: { text: "방향을 자주 바꿨다", id: "S-02" }, allSynthetic: true };
const single = (primary: StyleSetting["primary"]): StyleSetting => ({ primary, secondary: null, primaryWeight: 100 });
const blend = (primary: StyleSetting["primary"], secondary: StyleSetting["primary"], w: number): StyleSetting => ({ primary, secondary, primaryWeight: w });
const MATH: StudentProfile = { department: "수학과", interest_fields: ["ai_ml"], skills: ["python"], career_types: [], values: [] };
const Q = "저는 수학과 3학년이고 AI 분야에 관심이 있어요. 대학원에 갈지 바로 취업할지 고민됩니다.";
const BASE = { profile: MATH, history: [], place: "plaza" as const, persona: "warm" as const, greeting: "polite" as const };

const cwd0 = process.cwd();
let tmp = "";
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hufs4-"));
  process.chdir(tmp);
  process.env.FEATURE_CAMPUS_LOUNGE = "1";
});
afterAll(() => {
  process.chdir(cwd0);
  fs.rmSync(tmp, { recursive: true, force: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("스타일 정의", () => {
  it("다섯 스타일이 필수 항목을 모두 가진다", () => {
    expect(STYLE_IDS).toHaveLength(5);
    for (const id of STYLE_IDS) {
      const s = COUNSEL_STYLES[id];
      expect(s.id).toBe(id);
      for (const v of [s.name, s.goal, s.tone, s.decision]) expect(v.length).toBeGreaterThan(1);
      expect(s.questions.length).toBeGreaterThan(0);
      expect(s.avoid.length).toBeGreaterThan(0);
    }
  });
  it("공개 문구와 프롬프트에 참고 인물 이름이 없다", () => {
    const text = JSON.stringify(COUNSEL_STYLES) + STYLE_IDS.map((id) => templateView(single(id), FACTS) + stylePrompt(single(id), true, "", "질문").system).join("");
    expect(text).not.toMatch(/제갈|공명|오디세우스|샘와이즈|셜록|홈즈|소크라테스/);
  });
  it("3.0 캐릭터 성격에서 기본 스타일을 얻는다", () => {
    expect(defaultStyleFor("warm").primary).toBe("empathy");
    expect(defaultStyleFor("realistic").primary).toBe("strategy");
    expect(defaultStyleFor("analytical").primary).toBe("analysis");
  });
  it("신뢰할 수 없는 입력을 정규화한다", () => {
    expect(sanitizeStyleSetting({ primary: "evil" })).toBeNull();
    expect(sanitizeStyleSetting(null)).toBeNull();
    expect(sanitizeStyleSetting({ primary: "empathy", secondary: "empathy", primaryWeight: 60 })).toEqual(single("empathy"));
    expect(sanitizeStyleSetting({ primary: "empathy", secondary: "analysis", primaryWeight: 33 })).toEqual(blend("empathy", "analysis", 60));
  });
  it("비중별 문장 예산이 서로 다르고 총량은 같다", () => {
    const b = BLEND_WEIGHTS.map((w) => sentenceBudget(blend("strategy", "empathy", w)));
    expect(new Set(b.map((x) => x.primary)).size).toBe(BLEND_WEIGHTS.length);
    for (const x of b) expect(x.total).toBe(8);
    expect(styleLabel(blend("strategy", "empathy", 60))).toBe("전략형 60 · 공감형 40");
  });
});

describe("템플릿 합성 (CPU Demo)", () => {
  it("다섯 스타일의 문장이 서로 다르다", () => {
    expect(new Set(STYLE_IDS.map((id) => templateView(single(id), FACTS))).size).toBe(5);
  });
  it("모든 스타일·비중의 수치가 같은 사실에서만 나온다", () => {
    const allowed = new Set(["3", "4", "11", "0.08", "10", "130", "5"]);
    for (const a of STYLE_IDS) for (const b of STYLE_IDS) for (const w of BLEND_WEIGHTS) {
      if (a === b) continue;
      for (const n of numbersIn(templateView(blend(a, b, w), FACTS))) expect(allowed.has(n), `${a}+${b}@${w}: ${n}`).toBe(true);
    }
  });
  it("비중을 바꾸면 결과가 달라지고, 두 답변을 이어 붙이지 않는다", () => {
    const views = BLEND_WEIGHTS.map((w) => templateView(blend("strategy", "empathy", w), FACTS));
    expect(new Set(views).size).toBe(BLEND_WEIGHTS.length);
    const text = templateView(blend("strategy", "empathy", 50), FACTS);
    const emp = templateView(single("empathy"), FACTS).split(/(?<=[.?!])\s/)[0];
    // 보조 스타일 문장이 맨 앞이나 맨 끝에 묶이지 않고 기본 스타일 문장 사이에 놓인다
    expect(text.startsWith(templateView(single("strategy"), FACTS).split(/(?<=[.?!])\s/)[0])).toBe(true);
    expect(text.indexOf(emp)).toBeGreaterThan(0);
    expect(text.includes("\n")).toBe(false);
    expect(text.endsWith(emp)).toBe(false);
  });
});

describe("LLM 프롬프트에 비중이 반영된다", () => {
  it("비중별로 문장 수 지시가 달라지고 하나의 글을 요구한다", async () => {
    const u60 = stylePrompt(blend("analysis", "challenge", 60), true, "CTX", "질문").user;
    const u80 = stylePrompt(blend("analysis", "challenge", 80), true, "CTX", "질문").user;
    expect(u60).toContain("비중 60% (전체 중 약 5문장)");
    expect(u60).toContain("비중 40% (전체 중 약 3문장)");
    expect(u80).toContain("비중 80% (전체 중 약 7문장)");
    expect(u60).toContain("하나의 글로");
    expect(u60).toContain("문장 계획: 1.분석형");
    const { blendPlan } = await import("@/lib/counsel/compose");
    const plan = blendPlan(5, 3);
    expect(plan.filter((x) => x === "s")).toHaveLength(3);
    expect(plan[0]).toBe("p");
    expect(plan[7]).toBe("p");
    expect(u60).toContain("CTX");
  });
});

describe("사실 가드", () => {
  const ctx = "첫 직무까지 중앙값 8개월; 적합도 0.62; 근거 5건";
  it("근거에 없는 수치·확률·학점 단정·가짜 경험·채용 조건을 잡는다", () => {
    expect(checkStyleText("선배 90%가 이 길을 갔어요.", ctx).map((i) => i.kind)).toContain("unknown_number");
    expect(checkStyleText("기록을 보면 평균 14개월 걸렸어요.", ctx).map((i) => i.kind)).toContain("unknown_number");
    expect(checkStyleText("학점 2.8은 진학에 부담이 될 수 있어요.", ctx).map((i) => i.kind)).toContain("gpa_verdict");
    expect(checkStyleText("학점은 선택지에 큰 영향을 주지 않아요.", ctx).map((i) => i.kind)).toContain("gpa_verdict");
    expect(checkStyleText("취업은 8개월 안에 진입할 수 있어요.", ctx).map((i) => i.kind)).toContain("forecast");
    expect(checkStyleText("합격률이 높은 편이에요.", ctx).map((i) => i.kind)).toContain("probability");
    expect(checkStyleText("학점이 2.8이면 대학원은 어렵습니다.", ctx).map((i) => i.kind)).toContain("gpa_verdict");
    expect(checkStyleText("저는 입사했을 때 그랬어요. 제가 합격했던 해에요.", ctx).map((i) => i.kind)).toContain("fabricated_experience");
    expect(checkStyleText("지원 자격은 토익 900 이상이어야 합니다.", ctx).map((i) => i.kind)).toContain("invented_requirement");
  });
  it("근거에 있는 수치와 계획 제안 기간은 허용한다", () => {
    expect(checkStyleText("근거 5건에서 중앙값은 8개월이었어요 [S-01].", ctx)).toEqual([]);
    expect(checkStyleText("3개월 뒤에 다시 점검해 보세요.", ctx)).toEqual([]);
    expect(checkStyleText("학점만으로 가능성을 판단하기는 어렵습니다.", ctx)).toEqual([]);
    expect(numbersIn("[S-01] 기록")).toEqual(new Set());
  });
});

describe("상담 턴 통합 (CPU Demo)", () => {
  it("같은 질문이면 스타일과 무관하게 사실 답변·근거·비교가 동일하고, 스타일 설명은 다르다", async () => {
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const outs = [];
    for (const style of [single("strategy"), single("analysis"), single("empathy"), blend("strategy", "empathy", 60), blend("analysis", "challenge", 70)]) outs.push(await handleLoungeTurn({ ...BASE, question: Q, style }));
    expect(new Set(outs.map((o) => JSON.stringify({ a: o.core?.answer, e: o.core?.evidence.map((x) => x.record_id), c: o.core?.comparison?.ranking, q: o.core?.qa.map((x) => x.id) }))).size).toBe(1);
    expect(new Set(outs.map((o) => o.persona_view?.text)).size).toBe(5);
    expect(outs[3].style?.label).toBe("전략형 60 · 공감형 40");
    expect(outs[0].mode.generative).toBe(false);
    expect(outs[0].persona_view?.source).toBe("demo_template");
    expect(outs[0].decision?.options.length).toBeGreaterThan(1);
    const allowed = new Set([...outs[0].core!.evidence.map((x) => x.record_id), ...outs[0].core!.qa.map((x) => x.id)]);
    for (const o of outs) for (const m of (o.persona_view?.text ?? "").matchAll(/\[([A-Z]-\d+)\]/g)) expect(allowed.has(m[1])).toBe(true);
  });
  it("스타일이 없는 3.0 요청은 캐릭터 성격의 기본 스타일로 처리한다", async () => {
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, persona: "analytical", question: Q });
    expect(t.style?.primary).toBe("analysis");
  });
  it("위기 신호에는 스타일을 적용하지 않고 고정 안내를 준다", async () => {
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: "자해하고 싶은 생각이 들어요", style: single("challenge") });
    expect(t.stage).toBe("safety");
    expect(t.persona_view).toBeUndefined();
    expect(t.style).toBeUndefined();
    expect(t.safety?.length).toBeGreaterThan(0);
  });
  it("공식 정보 질문(가드레일)에는 스타일 설명을 붙이지 않는다", async () => {
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: "졸업 요건이 몇 학점인가요?", style: single("strategy") });
    expect(t.core?.answer_source).toBe("guardrail");
    expect(t.persona_view).toBeUndefined();
  });
});

describe("인용 보정", () => {
  it("묶음 인용을 정규화하고 허용되지 않은 ID 만 지운다", async () => {
    const { cleanCitations } = await import("@/lib/counsel/generate.server");
    expect(cleanCitations("문장 [S-01, S-99].", new Set(["S-01"])).text).toBe("문장 [S-01].");
    expect(cleanCitations("문장 [기록ID: S-01].", new Set(["S-01"])).text).toBe("문장 [S-01].");
  });
  it("인용이나 가상 표기가 빠지면 출처 줄을 붙인다", async () => {
    const { withSourceLine } = await import("@/lib/counsel/generate.server");
    expect(withSourceLine("조언입니다.", FACTS)).toContain("[S-01][S-02]");
    expect(withSourceLine("조언입니다.", FACTS)).toContain("가상 시연");
    expect(withSourceLine("가상 사례를 보면 [S-01] 그렇습니다.", FACTS)).toBe("가상 사례를 보면 [S-01] 그렇습니다.");
  });
});

describe("실제 LLM 경로 (fetch 목)", () => {
  type Body = { messages: { role: string; content: string }[]; seed?: number };
  function mockLLM(styleText: string) {
    const bodies: Body[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      if (!String(url).includes("/chat/completions")) throw new Error("ml off");
      const b = JSON.parse(String(init.body)) as Body;
      bodies.push(b);
      const isStyle = b.messages[1]?.content.includes("[스타일") || b.messages[1]?.content.includes("[기본 스타일");
      return new Response(JSON.stringify({ choices: [{ message: { content: isStyle ? styleText : "공통 답변입니다 [S-01]" } }], usage: { prompt_tokens: 100, completion_tokens: 50 } }), { status: 200 });
    }));
    return bodies;
  }
  const u = (n: string) => `저는 수학과 학생이고 AI 분야에 관심이 있어요. 대학원과 취업 중 고민됩니다 ${n}`;

  it("첫 질문 2회, 같은 질문의 스타일 변경은 1회만 호출하고 사실 답변은 재사용한다", async () => {
    vi.stubEnv("LLM_PROVIDER", "local");
    const bodies = mockLLM("먼저 목표 시점을 정해 보세요 [S-01].");
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const q = u("A");
    const a = await handleLoungeTurn({ ...BASE, question: q, style: single("strategy") });
    expect(bodies).toHaveLength(2);
    expect(a.timing).toMatchObject({ core_cached: false, llm_calls: 2 });
    const b = await handleLoungeTurn({ ...BASE, question: q, style: blend("analysis", "challenge", 70) });
    expect(bodies).toHaveLength(3);
    expect(b.timing).toMatchObject({ core_cached: true, llm_calls: 1 });
    expect(b.core?.answer).toBe(a.core?.answer);
    expect(b.persona_view?.source).toBe("llm");
    const last = bodies[2].messages[1].content;
    expect(last).toContain("비중 70%");
    expect(last).toContain("분석형");
    expect(last).toContain("도전형");
    expect(bodies[2].seed).toBe(4040);
  });
  it("근거에 없는 수치를 만들면 템플릿으로 대체하고 알린다", async () => {
    vi.stubEnv("LLM_PROVIDER", "local");
    mockLLM("이 길을 택한 선배의 97%가 만족했어요 [S-01].");
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: u("B"), style: single("analysis") });
    expect(t.persona_view?.source).toBe("demo_template");
    expect(t.notices?.join(" ")).toContain("템플릿으로 대체");
    expect(t.timing?.guard_issues).toBeGreaterThan(0);
  });
  it("없는 기록 인용은 제거한다", async () => {
    vi.stubEnv("LLM_PROVIDER", "local");
    mockLLM("목표를 먼저 정해 보세요 [S-99].");
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: u("C"), style: single("strategy") });
    expect(t.persona_view?.text).not.toContain("S-99");
  });
  it("LLM 장애 시 템플릿으로 대체한다", async () => {
    vi.stubEnv("LLM_PROVIDER", "local");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: u("D"), style: single("empathy") });
    expect(t.core?.answer_source).toBe("demo_template");
    expect(t.persona_view?.source).toBe("demo_template");
  });
});

describe("다중 관점 진로 비교", () => {
  const cmp = {
    ranking: ["employment", "graduate"],
    options: [
      { id: "graduate", title: "대학원 진학", weighted_score: 0.5, evidence_record_ids: ["S-01"], typical_months: null, pros: ["연구 역량"], risks: ["기간"], missing_skills: ["논문 읽기"], required_skills: [], to_verify: [] },
      { id: "employment", title: "취업", weighted_score: 0.52, evidence_record_ids: ["S-02"], typical_months: 6, pros: ["빠른 실무"], risks: ["경쟁"], missing_skills: ["SQL"], required_skills: [], to_verify: [] },
    ],
  } as unknown as Parameters<typeof buildDecisionBrief>[0];
  it("학점만으로 판단하지 않고 불확실성을 밝힌다", () => {
    const q = "학점이 2.8인 수학과 학생인데 대학원과 취업 중 어떤 선택이 좋을까요?";
    expect(gpaInQuestion(q)).toBe(2.8);
    const b = buildDecisionBrief(cmp, MATH, q);
    expect(b.conditions[0]).toContain("학점 2.8만으로");
    expect(b.options.map((o) => o.title)).toEqual(["취업", "대학원 진학"]);
    expect(b.uncertainty.join(" ")).toContain("확률이 아니에요");
    expect(b.uncertainty[1]).toContain("0.02");
    expect(b.next_actions.length).toBeGreaterThan(1);
    expect(JSON.stringify(b)).not.toMatch(/\d+\s*%/);
  });
});

describe("Q&A 데이터", () => {
  const real: QaItem = { question_id: "Q-101", question_text: "질문 내용입니다", answer_text: "답변 내용입니다", source_type: "alumni_answer", source_reference: "q_abc", verified_status: "verified", is_synthetic: false, consent_status: "consented", visibility: "students_only", department: "수학과", career_category: "ai_ml", created_at: "2026-11-09", updated_at: "2026-11-09", pii_checked: true, reviewed_by: "admin", review_note: "" };
  it("실제 데이터는 승인·동의·개인정보 확인·출처가 모두 있어야 검색된다", () => {
    expect(ragEligible(real)).toBe(true);
    for (const patch of [{ verified_status: "pending" }, { verified_status: "rejected" }, { verified_status: "withdrawn" }, { consent_status: "not_requested" }, { consent_status: "withdrawn" }, { pii_checked: false }, { source_reference: " " }, { visibility: "internal" }, { source_type: "synthetic_demo" }] as Partial<QaItem>[])
      expect(ragEligible({ ...real, ...patch }), JSON.stringify(patch)).toBe(false);
  });
  it("개인정보를 탐지한다", () => {
    expect(detectPII("연락처 010-1234-5678")).toContain("전화번호");
    expect(detectPII("a.b@example.com 로 메일")).toContain("이메일");
    expect(detectPII("데이터 직무 준비는 SQL 부터")).toEqual([]);
    expect(detectPII("검증 표지 1794186010123456")).toEqual([]); // 긴 숫자의 일부를 전화번호로 오인하지 않음
    expect(detectPII("학번 202012345 입니다")).toContain("학번");
    expect(detectPII("주민번호 990101-1234567")).toContain("주민등록번호");
    expect(detectPII("타임스탬프 1794192345678")).toEqual([]); // 생년월일로 불가능한 13자리 숫자
  });
  it("저장소: 등록은 pending 이고, 승인 전에는 검색되지 않으며, 철회하면 제외된다", async () => {
    const { createQa, reviewQa, getRagQa, getSyntheticQa } = await import("@/lib/qa/store.server");
    const it1 = createQa({ question_text: "실제 질문 예시입니다", answer_text: "실제 답변 예시입니다", source_type: "alumni_answer", source_reference: "ref-1", consent_status: "consented", visibility: "students_only", department: "수학과", career_category: "ai_ml" });
    expect(it1.verified_status).toBe("pending");
    expect(it1.is_synthetic).toBe(false);
    expect(getRagQa("student").some((x) => x.question_id === it1.question_id)).toBe(false);
    expect(reviewQa(it1.question_id, "verify", "admin", "", false).ok).toBe(false);
    expect(reviewQa(it1.question_id, "verify", "admin", "", true).ok).toBe(true);
    expect(getRagQa("student").some((x) => x.question_id === it1.question_id)).toBe(true);
    expect(getRagQa("anonymous").some((x) => x.question_id === it1.question_id)).toBe(false); // students_only 는 익명에게 보이지 않음
    expect(tierOf(getRagQa("student").find((x) => x.question_id === it1.question_id)!)).toBe("verified_alumni");
    expect(reviewQa(it1.question_id, "withdraw", "admin", "", false).ok).toBe(true);
    expect(getRagQa("student").some((x) => x.question_id === it1.question_id)).toBe(false);
    expect(getSyntheticQa().every((x) => x.is_synthetic && QaItemSchema.safeParse(x).success)).toBe(true);
  });
  it("개인정보가 있으면 승인을 막는다", async () => {
    const { createQa, reviewQa } = await import("@/lib/qa/store.server");
    const i = createQa({ question_text: "연락 방법이 궁금합니다", answer_text: "제 번호 010-2222-3333 으로 연락 주세요", source_type: "alumni_answer", source_reference: "ref-2", consent_status: "consented", visibility: "public", department: "", career_category: "" });
    const r = reviewQa(i.question_id, "verify", "admin", "", true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(422);
  });
  it("공개 시연에서는 실제 Q&A 를 검색하지 않는다", async () => {
    const { createQa, reviewQa, getRagQa } = await import("@/lib/qa/store.server");
    const i = createQa({ question_text: "공개 시연 제외 확인", answer_text: "실제 답변 내용입니다", source_type: "interview", source_reference: "ref-3", consent_status: "consented", visibility: "public", department: "", career_category: "" });
    reviewQa(i.question_id, "verify", "admin", "", true);
    vi.stubEnv("PUBLIC_DEMO", "1");
    expect(getRagQa().every((x) => x.is_synthetic)).toBe(true);
  });
  it("프롬프트 근거에 실제·가상 출처 유형이 구분되어 들어간다", async () => {
    const dir = path.join(process.cwd(), "data", "imported");
    fs.mkdirSync(dir, { recursive: true });
    const { getSyntheticRecords } = await import("@/lib/data/records");
    const realRec = { ...getSyntheticRecords()[0], record_id: "A-900", is_synthetic: false, consent_status: "consented", evidence_source: { type: "survey_self_report", description: "테스트" } };
    fs.writeFileSync(path.join(dir, "records.json"), JSON.stringify([realRec]));
    const { runChat } = await import("@/lib/chat/orchestrator");
    const r = await runChat({ question: "수학과 AI 연구원이 되려면 대학원에 가야 하나요?", profile: MATH, with_gen: true, retrieval_mode: "local", force_demo: true });
    fs.rmSync(dir, { recursive: true, force: true });
    expect(r.gen?.ctx).toContain("A-900 (관리자가 검증한 실제 선배의 자기 보고");
    expect(r.gen?.ctx).toMatch(/S-\d+ \(가상 시연 데이터/);
  });
});
