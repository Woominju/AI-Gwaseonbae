/**
 * 사실 조회형 질문의 규칙 기반 답변. LLM 에 맡기지 않고 자료에 있는 값만 그대로 말한다.
 * 개설 학과·선수 과목·학년도 차이·취업 보장·접근 권한·없는 관계.
 */
import { normalizeText } from "../taxonomy";
import type { CatalogCourse, CatalogFile, KnowledgeGraph } from "./schema";
import { cleanCourseName } from "../graph";
import type { GraphRetrieval } from "./retrieve";

const GUARANTEE = /보장/;
const PERMISSION = /(철회|비공개).{0,20}(Q&?A|질문|답변|경험|검색)|(Q&?A|질문|답변|경험|검색).{0,20}(철회|비공개)/i;
const YEAR_DIFF = /학년도.{0,20}(다르|차이|변경|바뀌)|(20\d{2})\s*학년도.{0,20}(20\d{2})\s*학년도/;
const OFFER = /(어느|어떤|무슨)\s*학과.{0,12}개설|개설.{0,12}(학과|곳)|어디서\s*개설/;
const PREREQ = /선수\s*(과목|과정|교과)/;
const RELATION = /(관계|연결)/;
const VAGUE = /이\s*(과목|수업|강의)|그\s*(과목|수업|강의)/;
/** 'X와 Y의 관계' 에서 X */
const RELATION_SUBJECT = /([가-힣A-Za-z0-9]{2,20}?)(?:과|와|이랑|랑)\s+.{1,30}(?:관계|연결)/;

export type DirectKind = "guarantee" | "permission" | "year_diff" | "offer" | "prereq" | "not_found" | "need_course";

export interface DirectAnswer {
  kind: DirectKind;
  text: string;
  cited: string[];
}

function sourceNote(courses: CatalogCourse[], c: CatalogFile): string {
  const docs = [...new Set(courses.map((x) => x.doc_id))].map((id) => c.documents.find((d) => d.doc_id === id)!).filter(Boolean);
  if (docs.length && docs.every((d) => d.status === "official")) return `> 출처: ${docs.map((d) => `${d.title} (${d.academic_year}학년도 ${d.term})`).join(", ")}. 변경 여부는 학교 공식 안내에서 다시 확인해 주세요.\n\n`;
  return "> 아래 내용은 **가상 시연 수강편람** 기준입니다. 실제 한국외대 교과정보가 아니므로 수강 결정에 쓰지 마세요.\n\n";
}

export function directGraphAnswer(question: string, g: KnowledgeGraph, r: GraphRetrieval, catalog: CatalogFile): DirectAnswer | null {
  const seedCourses = r.seeds.filter((s) => s.type === "Course").map((s) => s.label);
  const coursesOf = (name: string) => catalog.courses.filter((c) => cleanCourseName(c.name) === name).sort((a, b) => b.academic_year - a.academic_year);
  const latestYear = (cs: CatalogCourse[]) => cs.filter((c) => c.academic_year === cs[0].academic_year);
  const citeFor = (type: string, name: string) => r.facts.filter((f) => f.type === type && f.text.includes(name)).map((f) => `[${f.id}]`).slice(0, 2).join("");

  if (PERMISSION.test(question))
    return { kind: "permission", cited: [], text: "아니요. 비공개로 전환되거나 동의가 철회된 Q&A는 검색, 관계 그래프, 답변 근거, 인용에서 모두 제외됩니다. 근거를 만들 때마다 최신 승인·동의·공개 범위를 다시 확인하고, 변경되면 저장해 둔 답변도 다시 쓰지 않습니다. 현재 등록된 실제 선배 Q&A는 없고, 화면의 Q&A는 모두 가상 시연 데이터입니다." };

  if (GUARANTEE.test(question) && /취업|합격|입사|진학/.test(question))
    return { kind: "guarantee", cited: [], text: `아니요, 어떤 과목도 취업이나 합격을 보장하지 않습니다. ${seedCourses.length ? `수강편람에서 알 수 있는 것은 '${seedCourses[0]}'의 개설 여부와 개요 같은 교과 정보뿐이고, ` : "수강편람에서 알 수 있는 것은 개설 여부와 개요 같은 교과 정보뿐이고, "}채용 결과와의 관계는 그 자료로 확인할 수 없습니다. 관심 직무의 실제 공고에 적힌 자격 요건과 비교해 보는 것이 더 확실합니다.` };

  if (VAGUE.test(question) && !seedCourses.length && (OFFER.test(question) || PREREQ.test(question)))
    return { kind: "need_course", cited: [], text: "어떤 과목을 말하는지 확인하지 못했어요. 과목 이름을 함께 적어 주시면 자료에서 찾아볼게요." };

  if (YEAR_DIFF.test(question)) {
    const name = seedCourses[0];
    const policy = "학년도별 자료는 섞지 않고 따로 표시합니다. 다른 학년도 값으로 빈칸을 채우지 않고, 자료가 없는 미래 학년도의 교과정보를 확정해서 말하지 않습니다.";
    if (!name) return { kind: "year_diff", cited: [], text: `${policy} 과목 이름을 알려 주시면 학년도별 내용을 비교해 드릴게요.` };
    const cs = coursesOf(name);
    if (!cs.length) return { kind: "year_diff", cited: [], text: `${policy} '${name}'은 등록된 자료에서 찾지 못했어요.` };
    const rows = cs.map((c) => `- **${c.academic_year}학년도 ${c.term}**: ${c.department}, ${c.credits ?? "학점 미기재"}${c.credits ? "학점" : ""}, 선수 과목 ${c.prerequisites === null ? "미기재" : c.prerequisites.length ? c.prerequisites.join(", ") : "자료에 없음"} (${c.locator})`).join("\n");
    return { kind: "year_diff", cited: [], text: `${sourceNote(cs, catalog)}**${name}**의 학년도별 자료입니다.\n\n${rows}\n\n${policy}` };
  }

  if (OFFER.test(question)) {
    if (!seedCourses.length) return { kind: "not_found", cited: [], text: "자료에서 해당 과목을 찾지 못했어요. 없는 정보를 추측하지 않을게요. 과목 이름을 확인하거나 학교 공식 수강편람에서 찾아보세요." };
    const name = seedCourses[0];
    const cs = coursesOf(name);
    if (!cs.length) return { kind: "not_found", cited: [], text: `'${name}'의 개설 정보는 등록된 수강편람 자료에 없어요. 학교 공식 수강편람에서 확인해 주세요.` };
    const latest = latestYear(cs);
    return { kind: "offer", cited: [], text: `${sourceNote(latest, catalog)}**${name}**은 ${[...new Set(latest.map((c) => c.department))].join(", ")}에서 개설합니다. (${latest[0].academic_year}학년도 ${latest[0].term}, ${latest[0].locator}) ${citeFor("DEPARTMENT_OFFERS_COURSE", name)}` };
  }

  if (PREREQ.test(question)) {
    if (!seedCourses.length) return { kind: "not_found", cited: [], text: "자료에서 해당 과목을 찾지 못했어요. 과목 이름을 확인하거나 학교 공식 수강편람에서 찾아보세요." };
    const name = seedCourses[0];
    const cs = coursesOf(name);
    if (!cs.length) return { kind: "not_found", cited: [], text: `'${name}'의 선수 과목 정보는 등록된 수강편람 자료에 없어요. 학교 공식 수강편람에서 확인해 주세요.` };
    const c = cs[0];
    const body = c.prerequisites === null ? "자료에 선수 과목이 **기재되어 있지 않아요.** 선수 과목이 없다는 뜻은 아니에요." : c.prerequisites.length ? `자료에 명시된 선수 과목은 **${c.prerequisites.join(", ")}**입니다. ${citeFor("COURSE_REQUIRES_PREREQUISITE", name)}` : "이 자료에는 선수 과목이 없는 것으로 적혀 있어요.";
    return { kind: "prereq", cited: [], text: `${sourceNote([c], catalog)}**${name}** (${c.academic_year}학년도 ${c.term}, ${c.locator}): ${body}` };
  }

  if (RELATION.test(question)) {
    const subj = question.match(RELATION_SUBJECT)?.[1];
    const known = (s: string) => g.nodes.some((n) => normalizeText(n.label).includes(normalizeText(s)) || normalizeText(s).includes(normalizeText(n.label)));
    const unknownSubject = !!subj && !/^(분야|직무|진로|과목|수업)$/.test(subj) && !known(subj);
    const noBridge = r.seeds.length >= 2 && !r.paths.some((p) => p.connects_seeds);
    if (!r.seeds.length || unknownSubject || noBridge)
      return { kind: "not_found", cited: [], text: `등록된 자료에서 ${unknownSubject ? `'${subj}'와(과)의 ` : ""}연결을 찾지 못했어요. 없는 관계를 지어내지 않을게요. 공식 교과 안내나 직무 공고에서 확인할 수 있는 내용을 알려 주시면 함께 살펴볼게요.` };
  }
  return null;
}
