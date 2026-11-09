/**
 * 스타일 답변의 사실 가드 (생성 후 검사).
 * 스타일 답변에 근거에 없는 수치·단정이 있으면 재생성 대신 템플릿으로 대체한다 (호출 수를 늘리지 않기 위함).
 */

export interface GuardIssue {
  kind: "unknown_number" | "probability" | "forecast" | "gpa_verdict" | "invented_requirement" | "fabricated_experience";
  text: string;
}

const CITATION = /\[[A-Za-z]-\d{2,3}\]/g;
/** 단위가 붙으면 항상 사실 주장으로 보는 수치 */
const FACT_NUMBER = /(\d+(?:\.\d+)?)\s*(%|퍼센트|명|건|만\s*원|억|배|학점|위\b)/g;
/** 기간은 계획 제안(3개월 뒤 점검)일 수 있어, 기록·통계 표현과 같은 문장에 있을 때만 사실 주장으로 본다 */
const DURATION = /(\d+(?:\.\d+)?)\s*(?:~\s*(\d+(?:\.\d+)?)\s*)?(개월|년)/g;
const DURATION_FACT_CUE = /걸렸|걸린|소요|평균|중앙값|기록|사례|선배들|통계/;
const PROBABILITY = /(합격률|취업률|합격\s*확률|성공\s*확률|\d+\s*%\s*(확률|가능성))/;
const GPA_VERDICT = /(학점|GPA)(?:\d\.\d|[^.?!\n]){0,24}(어렵|불가능|힘들|안\s*돼|안\s*됩|떨어|불합격|합격할|취업할\s*수\s*없|붙기|부담|불리|유리|낮|영향|걸림돌|약점)/i;
/** '학점만으로 판단하기 어렵다'는 단정을 경계하는 바람직한 문장이다 */
const GPA_HEDGE = /(학점|GPA)\s*(만으로|하나로|만\s*가지고|만\s*보고)/i;
const REQUIREMENT = /(채용\s*조건|자격\s*요건|지원\s*자격)[^.?!\n]{0,24}(필수|이상이어야|반드시|요구합니다|요구해요)/;
/** 사례의 기간을 예측처럼 말하는 표현 */
const FORECAST = /\d+(?:\.\d+)?\s*개월[^.?!\n]{0,16}(안에|만에|이내에?)\s*[^.?!\n]{0,10}(진입|취업|합격|입사)(할\s*수|합니다|해요|하게)/;
const FABRICATED = /(제가|내가|저도|나도|저는|나는)\s*(.{0,20})?(졸업했|입사했|합격했|취업했|다녔던|다닐\s*때|재학\s*(시절|중에|때)|학번|인턴(을|으로)?\s*(했|할\s*때)|면접(을|에서)?\s*(봤|볼\s*때))/;

export function numbersIn(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.replace(CITATION, " ").matchAll(/\d+(?:\.\d+)?/g)) out.add(String(Number(m[0])));
  return out;
}

function sentences(t: string): string[] {
  return t.split(/(?<=[.?!])\s+|\n+/).filter(Boolean);
}

/** context: 프롬프트에 제공한 근거·계산 블록 전체 (허용 수치의 기준) */
export function checkStyleText(text: string, context: string): GuardIssue[] {
  const allowed = numbersIn(context);
  const issues: GuardIssue[] = [];
  const body = text.replace(CITATION, " ");
  for (const s of sentences(body)) {
    for (const m of s.matchAll(FACT_NUMBER)) if (!allowed.has(String(Number(m[1])))) issues.push({ kind: "unknown_number", text: m[0] });
    if (DURATION_FACT_CUE.test(s))
      for (const m of s.matchAll(DURATION)) for (const n of [m[1], m[2]]) if (n && !allowed.has(String(Number(n)))) issues.push({ kind: "unknown_number", text: m[0] });
    if (PROBABILITY.test(s)) issues.push({ kind: "probability", text: s.slice(0, 60) });
    if (FORECAST.test(s)) issues.push({ kind: "forecast", text: s.slice(0, 60) });
    if (GPA_VERDICT.test(s) && !GPA_HEDGE.test(s)) issues.push({ kind: "gpa_verdict", text: s.slice(0, 60) });
    if (REQUIREMENT.test(s)) issues.push({ kind: "invented_requirement", text: s.slice(0, 60) });
    if (FABRICATED.test(s)) issues.push({ kind: "fabricated_experience", text: s.slice(0, 60) });
  }
  return issues;
}
