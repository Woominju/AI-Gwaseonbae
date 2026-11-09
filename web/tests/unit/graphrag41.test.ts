import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import catalogJson from "@/data/catalog.synthetic.json";
import ncs from "@/data/career/ncs.fixture.json";
import { getSyntheticRecords } from "@/lib/data/records";
import { buildKnowledgeGraph, type NcsStandards } from "@/lib/graphrag/build";
import { directGraphAnswer } from "@/lib/graphrag/direct";
import { localGraph, nodeDetail, searchNodes } from "@/lib/graphrag/explore";
import { linkEntities, retrieveGraph } from "@/lib/graphrag/retrieve";
import { CatalogFileSchema, officialDocUsable, type CatalogFile } from "@/lib/graphrag/schema";
import type { QaItem } from "@/lib/qa/schema";
import type { StudentProfile } from "@/lib/types";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }), headers: async () => new Headers() }));

const catalog = CatalogFileSchema.parse(catalogJson);
const synQa = (): QaItem[] => [];
const g = (qa: QaItem[] = synQa(), c: CatalogFile = catalog) => buildKnowledgeGraph({ records: getSyntheticRecords(), catalog: c, qa, ncs: ncs as NcsStandards });
const ask = (q: string, gr = g(), c: CatalogFile = catalog, history: string[] = []) => { const r = retrieveGraph(q, gr, { history }); return { r, d: directGraphAnswer(q, gr, r, c) }; };
const realQa: QaItem = { question_id: "Q-201", question_text: "확률론 수업은 데이터 분석에 도움이 되었나요?", answer_text: "확률론과 SQL 경험이 도움이 되었습니다", source_type: "alumni_answer", source_reference: "ref", verified_status: "verified", is_synthetic: false, consent_status: "consented", visibility: "public", department: "수학과", career_category: "data_science", created_at: "2026-11-09", updated_at: "2026-11-09", pii_checked: true, reviewed_by: "admin", review_note: "" };

describe("그래프 데이터", () => {
  it("모든 수강편람 관계가 출처·위치·학년도·상태를 가진다", () => {
    const edges = g().edges.filter((e) => ["DEPARTMENT_OFFERS_COURSE", "COURSE_EXPLICITLY_COVERS_TOPIC", "COURSE_REQUIRES_PREREQUISITE", "DOCUMENT_SUPPORTS_CLAIM"].includes(e.type));
    expect(edges.length).toBeGreaterThan(20);
    for (const e of edges) { expect(e.doc_id).toBeTruthy(); expect(e.locator).toBeTruthy(); expect(e.academic_year).toBeTruthy(); expect(e.data_status).toBe("synthetic_demo"); expect(e.updated_at).toBeTruthy(); }
  });
  it("번들 수강편람은 전부 가상이고 공식 등급 관계가 없다", () => {
    expect(catalog.documents.every((d) => d.status === "synthetic_demo")).toBe(true);
    expect(g().edges.some((e) => e.data_status === "official")).toBe(false);
  });
  it("추론 후보는 검증되지 않음으로 표시되고 문서 출처를 가장하지 않는다", () => {
    const inf = g().edges.filter((e) => e.data_status === "inferred_candidate");
    expect(inf.length).toBeGreaterThan(0);
    for (const e of inf) { expect(e.verification).toBe("unverified"); expect(e.doc_id).toBeNull(); expect(e.evidence).toContain("검증 없음"); }
  });
  it("미기재 선수 과목은 관계를 만들지 않는다", () => {
    expect(g().edges.some((e) => e.type === "COURSE_REQUIRES_PREREQUISITE" && e.source === "Course:선형대수학")).toBe(false);
  });
  it("공식 자료는 사용 허가와 URL 이 모두 있어야 인정한다", () => {
    const d = { ...catalog.documents[0], status: "official" as const, url: "https://example.org/x", license_confirmed: true };
    expect(officialDocUsable(d)).toBe(true);
    expect(officialDocUsable({ ...d, license_confirmed: false })).toBe(false);
    expect(officialDocUsable({ ...d, url: null })).toBe(false);
  });
});

describe("그래프 검색이 실제 경로를 찾는다", () => {
  it("학과–과목–역량–직무를 잇는다", () => {
    const { r } = ask("수학과 학생이 데이터 분석가 직무를 준비하려면 어떤 수업을 검토하면 좋을까요?");
    expect(r.seeds.map((s) => s.id)).toEqual(expect.arrayContaining(["Department:수학과", "Role:occ:data_analyst"]));
    expect(r.paths.some((p) => p.connects_seeds)).toBe(true);
    const text = r.facts.map((f) => f.text).join(" ");
    expect(text).toMatch(/수리통계학|확률론|회귀분석|수학과에서/);
    for (const f of r.facts) expect(f.status_label).toBeTruthy();
  });
  it("학과–과목–역량–직무 연결은 추론 후보로 표시되고 맨 앞에 온다", () => {
    const { r } = ask("수학과 학생이 데이터 분석가 직무를 준비하려면 어떤 수업을 검토하면 좋을까요?");
    const b = r.facts.filter((f) => f.type === "COURSE_ROLE_BRIDGE");
    expect(b.length).toBeGreaterThan(0);
    expect(r.facts[0].type).toBe("COURSE_ROLE_BRIDGE");
    for (const f of b) { expect(f.status).toBe("inferred_candidate"); expect(f.text).toContain("인과 관계가 아님"); expect(f.text).toMatch(/^수학과 개설/); expect(f.doc_title).toContain("가상 수강편람"); }
    expect(b.map((f) => f.text).join(" ")).toContain("수리통계학");
  });
  it("수업을 묻지 않으면 과목–직무 연결을 만들지 않는다", () => {
    expect(ask("데이터 분석가는 어떤 일을 하나요?").r.facts.some((f) => f.type === "COURSE_ROLE_BRIDGE")).toBe(false);
  });
  it("두 진로의 차이를 묻는 질문에 양쪽 직무를 찾는다", () => {
    const { r } = ask("데이터 분석과 소프트웨어 개발 진로의 준비 과정은 어떻게 다른가요?");
    expect(r.seeds.map((s) => s.id)).toEqual(expect.arrayContaining(["Role:occ:data_analyst", "Role:occ:software_engineer"]));
  });
  it("'이 과목'은 직전 발화에서 찾는다", () => {
    expect(linkEntities("이 과목의 선수 과목은?", g(), ["확률론 수업이 궁금해요"]).map((n) => n.id)).toContain("Course:확률론");
  });
  it("같은 입력이면 결과가 동일하다", () => {
    const q = "확률론이나 통계학 관련 수업이 어떤 분야와 연결되는지 알려주세요.";
    expect(JSON.stringify(ask(q).r)).toBe(JSON.stringify(ask(q).r));
  });
  it("기본은 최신 학년도만 쓰고, 지정 학년도 자료가 없으면 다른 해로 대신하지 않는다", () => {
    const facts = ask("확률론의 주제는?").r.facts.filter((f) => f.academic_year);
    expect(facts.every((f) => f.academic_year === 2026)).toBe(true);
    const { r } = ask("2027학년도 확률론 개설 정보 알려줘");
    expect(r.notices.join(" ")).toContain("2027");
    expect(r.facts.some((f) => f.academic_year !== null)).toBe(false);
  });
});

describe("필수 검증 사례 (규칙 답변)", () => {
  it("사례 2 개설 학과", () => { const { d } = ask("수리통계학은 어느 학과에서 개설하나요?"); expect(d?.kind).toBe("offer"); expect(d?.text).toContain("수학과"); expect(d?.text).toContain("가상 시연"); });
  it("사례 2 지시어만 있고 문맥이 없으면 되묻는다", () => { expect(ask("이 과목은 어느 학과에서 개설하나요?").d?.kind).toBe("need_course"); });
  it("사례 3 선수 과목: 명시·미기재를 구분한다", () => {
    expect(ask("수강편람에 수리통계학의 선수 과목이 명시되어 있나요?").d?.text).toContain("확률론");
    const none = ask("선형대수학의 선수 과목이 있나요?").d!;
    expect(none.text).toContain("기재되어 있지 않아요");
    expect(none.text).toContain("없다는 뜻은 아니에요");
  });
  it("사례 4 취업 보장을 부정한다", () => { const { d } = ask("확률론을 들으면 취업이 보장되나요?"); expect(d?.kind).toBe("guarantee"); expect(d?.text).toMatch(/^아니요/); });
  it("사례 5 학년도를 섞지 않고 차이를 보여 준다", () => { const d = ask("2025학년도와 2026학년도 확률론 교과정보가 다르면 어떻게 답하나요?").d!; expect(d.kind).toBe("year_diff"); expect(d.text).toContain("2025학년도"); expect(d.text).toContain("2026학년도"); expect(d.text).toContain("2학점"); expect(d.text).toContain("3학점"); });
  it("사례 7 권한 질문", () => { expect(ask("비공개로 전환되거나 동의가 철회된 Q&A를 검색할 수 있나요?").d?.kind).toBe("permission"); });
  it("사례 8 없는 관계를 지어내지 않는다", () => { const d = ask("양자역학과 마케팅 직무의 관계를 알려줘").d!; expect(d.kind).toBe("not_found"); expect(d.text).toContain("지어내지"); });
});

describe("권한: 그래프에 철회 데이터가 남지 않는다", () => {
  it("권한을 통과한 Q&A 만 노드가 되고, 목록에서 빠지면 노드·관계·검색 결과가 모두 사라진다", () => {
    const on = g([realQa]);
    expect(on.nodes.some((n) => n.id === "AlumniQA:Q-201")).toBe(true);
    expect(on.edges.some((e) => e.qa_ids.includes("Q-201") && e.data_status === "alumni_verified")).toBe(true);
    expect(retrieveGraph("확률론 경험이 궁금해요", on).facts.some((f) => f.source_ids.includes("Q-201"))).toBe(true);
    const off = g([]);
    expect(off.nodes.some((n) => n.id === "AlumniQA:Q-201")).toBe(false);
    expect(off.edges.some((e) => e.qa_ids.includes("Q-201"))).toBe(false);
    expect(searchNodes(off, "확률론 수업은 데이터").length).toBe(0);
    expect(JSON.stringify(retrieveGraph("확률론 경험이 궁금해요", off))).not.toContain("Q-201");
  });
});

describe("탐색 화면 데이터", () => {
  it("기본 깊이는 주변 관계만, 항목 수 상한을 지킨다", () => {
    const one = localGraph(g(), "Role:occ:data_analyst", 1, null);
    expect(one.nodes.filter((n) => n.hop === 0)).toHaveLength(1);
    expect(one.nodes.every((n) => n.hop <= 1)).toBe(true);
    expect(one.nodes.length).toBeLessThanOrEqual(15);
    const two = localGraph(g(), "Role:occ:data_analyst", 2, null);
    expect(two.nodes.length).toBeGreaterThan(one.nodes.length);
    expect(two.nodes.length).toBeLessThanOrEqual(25);
  });
  it("유형 필터가 적용된다", () => { expect(localGraph(g(), "Course:확률론", 1, ["Skill"]).nodes.filter((n) => n.hop > 0).every((n) => n.type === "Skill")).toBe(true); });
  it("상세에 출처·학년도·검증 상태가 있다", () => {
    const d = nodeDetail(g(), "Course:확률론")!;
    const offer = d.relations.find((r) => r.type_label === "개설 과목")!;
    expect(offer.doc_title).toContain("가상 수강편람");
    expect(offer.locator).toBeTruthy();
    expect(offer.academic_year).toBe(2026);
    expect(offer.status_label).toBe("가상 시연 데이터");
  });
  it("검색: 별칭·과목명", () => { expect(searchNodes(g(), "데이터 분석").map((n) => n.id)).toContain("Role:occ:data_analyst"); expect(searchNodes(g(), "확률론")[0].id).toBe("Course:확률론"); });
});

describe("상담 통합", () => {
  const MATH: StudentProfile = { department: "수학과", interest_fields: [], skills: [], career_types: [], values: [] };
  const BASE = { profile: MATH, history: [], place: "plaza" as const, persona: "analytical" as const, greeting: "polite" as const };
  const cwd0 = process.cwd();
  let tmp = "";
  beforeAll(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hufs41-")); process.chdir(tmp); vi.stubEnv("FEATURE_CAMPUS_LOUNGE", "1"); });
  afterAll(() => { process.chdir(cwd0); fs.rmSync(tmp, { recursive: true, force: true }); });
  afterEach(() => { vi.unstubAllGlobals(); vi.stubEnv("FEATURE_COURSE_GRAPH", ""); });

  it("플래그가 꺼지면 그래프를 쓰지 않는다", async () => {
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: "수학과 학생이 데이터 분석가가 되려면 어떤 수업을 들어야 하나요?" });
    expect(t.core?.graph).toBeUndefined();
  });
  it("관계가 프롬프트 문맥에 실제로 들어간다", async () => {
    vi.stubEnv("FEATURE_COURSE_GRAPH", "1");
    const { runChat } = await import("@/lib/chat/orchestrator");
    const r = await runChat({ question: "수학과 학생이 데이터 분석가가 되려면 어떤 수업을 들어야 하나요?", profile: MATH, with_gen: true, force_demo: true, retrieval_mode: "local" });
    expect(r.graph!.facts.length).toBeGreaterThan(0);
    expect(r.gen!.ctx).toContain("<graph_evidence>");
    expect(r.gen!.ctx).toContain(r.graph!.facts[0].text);
    expect(r.gen!.allowed).toContain("G-01");
    expect(r.answer).toContain("관계 근거");
    const off = await runChat({ question: "수학과 학생이 데이터 분석가가 되려면 어떤 수업을 들어야 하나요?", profile: MATH, with_gen: true, force_demo: true, retrieval_mode: "local", graph_off: true });
    expect(off.gen!.ctx).not.toContain("<graph_evidence>");
  });
  it("실제 LLM 경로: 프롬프트에 관계가 전달되고 없는 G-ID 는 제거된다", async () => {
    vi.stubEnv("FEATURE_COURSE_GRAPH", "1");
    vi.stubEnv("LLM_PROVIDER", "local");
    const bodies: { messages: { content: string }[] }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      if (!String(url).includes("/chat/completions")) throw new Error("ml off");
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ choices: [{ message: { content: "관계를 보면 [G-01] 이고 [G-77] 입니다" } }], usage: {} }), { status: 200 });
    }));
    const { runChat } = await import("@/lib/chat/orchestrator");
    const r = await runChat({ question: "수학과 학생이 데이터 분석가가 되려면 어떤 수업을 들어야 하나요? 그래프", profile: MATH, retrieval_mode: "local" });
    expect(bodies[0].messages.at(-1)!.content).toContain("<graph_evidence>");
    expect(r.answer).not.toContain("G-77");
    expect(r.citation_check.invalid_removed).toContain("G-77");
    vi.unstubAllEnvs();
  });
  it("사실 조회는 규칙 답변이고 스타일 설명을 붙이지 않는다", async () => {
    vi.stubEnv("FEATURE_COURSE_GRAPH", "1");
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const t = await handleLoungeTurn({ ...BASE, question: "수리통계학은 어느 학과에서 개설하나요?" });
    expect(t.stage).toBe("career");
    expect(t.core?.direct_kind).toBe("offer");
    expect(t.persona_view).toBeUndefined();
    expect(t.mode.generative).toBe(false);
  });
  it("철회 회귀: 그래프·근거·캐시에서 즉시 사라진다", async () => {
    vi.stubEnv("FEATURE_COURSE_GRAPH", "1");
    const { createQa, reviewQa } = await import("@/lib/qa/store.server");
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    const { currentGraph } = await import("@/lib/graphrag/data.server");
    const item = createQa({ question_text: "수리통계학 수업이 진로에 어떤 도움을 주었나요", answer_text: "수리통계학으로 분석 기초를 배웠습니다", source_type: "interview", source_reference: "r1", consent_status: "consented", visibility: "public", department: "수학과", career_category: "data_science" });
    reviewQa(item.question_id, "verify", "admin", "", true);
    const q = "수리통계학 수업이 진로에 어떤 도움을 주었나요";
    const before = await handleLoungeTurn({ ...BASE, question: q });
    const has = (t: typeof before) => JSON.stringify(t).includes(item.question_id);
    expect(has(before)).toBe(true);
    expect(currentGraph("anonymous").graph.nodes.some((n) => n.id === `AlumniQA:${item.question_id}`)).toBe(true);
    reviewQa(item.question_id, "withdraw", "admin", "", false);
    const after = await handleLoungeTurn({ ...BASE, question: q });
    expect(has(after)).toBe(false);
    expect(currentGraph("anonymous").graph.nodes.some((n) => n.id === `AlumniQA:${item.question_id}`)).toBe(false);
  });
  it("students_only 실제 Q&A 는 익명 그래프에 없고 학생 세션에만 있다", async () => {
    const { createQa, reviewQa } = await import("@/lib/qa/store.server");
    const { currentGraph } = await import("@/lib/graphrag/data.server");
    const item = createQa({ question_text: "학생 전용 답변 시험입니다", answer_text: "학생 전용 답변 내용입니다", source_type: "interview", source_reference: "r2", consent_status: "consented", visibility: "students_only", department: "", career_category: "" });
    reviewQa(item.question_id, "verify", "admin", "", true);
    expect(currentGraph("anonymous").graph.nodes.some((n) => n.id === `AlumniQA:${item.question_id}`)).toBe(false);
    expect(currentGraph("student").graph.nodes.some((n) => n.id === `AlumniQA:${item.question_id}`)).toBe(true);
  });
  it("위기 신호는 그래프보다 먼저 분기한다", async () => {
    vi.stubEnv("FEATURE_COURSE_GRAPH", "1");
    const { handleLoungeTurn } = await import("@/lib/lounge/turn.server");
    expect((await handleLoungeTurn({ ...BASE, question: "수강편람 보다가 죽고 싶어요" })).stage).toBe("safety");
  });
});
