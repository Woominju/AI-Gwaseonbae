/**
 * 스타일 답변 합성.
 *   - templateView : CPU Demo. 같은 사실(CounselFacts)로 스타일별 문장을 골라 한 문단으로 만든다.
 *   - stylePrompt  : LLM. 스타일 정의와 문장 예산을 한 번의 호출에 담는다 (두 답변을 이어 붙이지 않는다).
 * 두 경로 모두 비중이 문장 수(sentenceBudget)로 반영된다.
 */
import { COUNSEL_STYLES, sentenceBudget, styleLabel, type CounselStyleId, type StyleSetting } from "./styles";

/** 스타일과 무관하게 고정되는 사실 묶음. 템플릿의 수치는 여기서만 나온다 */
export interface CounselFacts {
  evidenceCount: number;
  /** 대표 인용 "[S-01][S-02]" */
  cite: string;
  monthsRange?: [number, number];
  gaps: string[];
  topOption?: string;
  otherOption?: string;
  margin?: number;
  weeklyHours?: number;
  lesson?: { text: string; id: string };
  difficulty?: { text: string; id: string };
  /** 근거가 모두 가상 시연 데이터인가 */
  allSynthetic: boolean;
}

type Move = (f: CounselFacts) => string | null;

const src = (f: CounselFacts) => (f.allSynthetic ? "가상 시연 기록" : "근거 기록");

/** 각 스타일의 문장 후보. 사실이 없으면 null 을 돌려 건너뛴다 */
const MOVES: Record<CounselStyleId, Move[]> = {
  strategy: [
    () => "먼저 언제까지 어떤 상태가 되고 싶은지 목표 시점부터 정하고, 거기서 거꾸로 계획을 세워 보면 좋겠어요.",
    (f) => (f.monthsRange ? `${src(f)} ${f.cite}에서 첫 직무까지 걸린 기간은 ${f.monthsRange[0]}~${f.monthsRange[1]}개월이었으니, 이 범위를 일정을 잡는 참고선으로 써 보세요.` : null),
    (f) => (f.gaps.length ? `보완 순서는 ${f.gaps[0]}부터 정하고, 나머지는 그다음 단계로 넘기는 편이 관리하기 쉬워요.` : null),
    (f) => (f.weeklyHours ? `주당 ${f.weeklyHours}시간을 쓸 수 있다면 한 분기에 약 ${f.weeklyHours * 13}시간이니, 그 안에 끝낼 결과물 하나만 고르세요.` : "주당 쓸 수 있는 시간을 먼저 정하면 계획의 크기가 현실적으로 잡혀요."),
    (f) => (f.topOption ? `지금 우선순위로는 '${f.topOption}' 쪽이 앞서지만, 다시 비교할 날짜를 미리 정해 두세요.` : null),
    () => "단계마다 중간 점검 기준을 하나씩 정해 두면 방향을 바꿀 때도 덜 흔들려요.",
    () => "이번 주에는 일정표에 첫 번째 중간 목표 하나만 적어 보세요.",
  ],
  challenge: [
    () => "한 번에 정답을 맞히려 하기보다, 되돌릴 수 있는 작은 시도부터 해 보는 건 어때요?",
    (f) => (f.difficulty ? `${src(f)}에서도 "${f.difficulty.text}" [${f.difficulty.id}] 같은 어려움이 있었어요. 막히는 지점은 경로를 고칠 신호로 볼 수 있어요.` : null),
    (f) => (f.otherOption ? `'${f.otherOption}'도 버리지 말고 예비 경로로 남겨 두고, 작은 경험으로 시험해 보세요.` : null),
    (f) => (f.gaps.length ? `${f.gaps[0]}은 완벽히 갖춘 뒤가 아니라, 작은 프로젝트를 하면서 부딪혀 채워 볼 수 있어요.` : null),
    () => "실패해도 감당할 수 있는 크기로 시도를 줄이면, 다시 일어나는 비용도 함께 줄어들어요.",
    () => "이 길이 막힐 때 갈 다음 길을 하나 적어 두면 지금 선택이 훨씬 가벼워져요.",
    () => "이번 달 안에 끝낼 수 있는 가장 작은 실험 하나를 정해서 바로 시작해 봐요.",
  ],
  empathy: [
    () => "이 고민을 꺼내는 것부터가 쉽지 않았을 것 같아요. 막막한 마음이 드는 건 이상한 일이 아니에요.",
    (f) => (f.lesson ? `${src(f)}에 "${f.lesson.text}" [${f.lesson.id}]라는 말이 있었어요. 조금 천천히 가도 괜찮다는 뜻으로 읽혀요.` : null),
    () => "지금 당장 모든 걸 정하지 않아도 괜찮아요. 무엇이 가장 마음에 걸리는지부터 같이 살펴봐요.",
    (f) => (f.gaps.length ? `${f.gaps[0]}이 부족해 보여도 그게 곧 안 된다는 뜻은 아니에요. 채워 갈 수 있는 부분이에요.` : null),
    () => "비교하다 지칠 때는 잠깐 멈추고, 내가 이미 해 온 것을 먼저 적어 보는 것도 도움이 돼요.",
    () => "혼자 끌어안기 버거우면 주변 사람이나 학교 상담 창구에 이야기를 나눠 봐도 좋아요.",
    () => "오늘은 부담 없는 것 하나만 골라 작게 시작해 봐요.",
  ],
  analysis: [
    (f) => `지금 근거는 ${src(f)} ${f.evidenceCount}건 ${f.cite}로, 표본이 작아서 경향을 볼 수는 있어도 일반화할 수는 없어요.`,
    (f) => (f.topOption ? `비교 결과 '${f.topOption}'이 앞선 것은 지금 설정한 우선순위 가중치에 따른 결과이고${f.margin !== undefined ? `, 점수 차이는 ${f.margin.toFixed(2)}예요` : ""}. 확률로 읽으면 안 돼요.` : null),
    (f) => (f.monthsRange ? `첫 직무까지 ${f.monthsRange[0]}~${f.monthsRange[1]}개월이라는 수치는 기록된 사례의 범위일 뿐, 예상 기간은 아니에요.` : null),
    () => "선배 활동과 진로 결과가 함께 기록되어 있어도, 그 활동이 원인이라고 단정할 수는 없어요.",
    (f) => (f.gaps.length ? `프로필 기준으로 확인된 차이는 ${f.gaps.slice(0, 2).join(", ")}이고, 입력하지 않은 경험은 반영되지 않았어요.` : null),
    () => "결론을 바꿀 수 있는 정보는 실제 공고의 자격 요건과 지원 기관의 공식 모집 안내예요.",
    () => "먼저 판단 기준 세 가지를 적고, 각 선택지를 같은 기준으로 비교해 보세요.",
  ],
  reflection: [
    () => "답을 고르기 전에, 이 선택에서 나에게 가장 중요한 것이 무엇인지 먼저 물어보고 싶어요.",
    (f) => (f.topOption && f.otherOption ? `'${f.topOption}'과 '${f.otherOption}' 중 어느 쪽을 떠올릴 때 더 오래 생각이 머무나요?` : null),
    () => "다른 사람의 기대를 빼고 나면, 무엇이 남나요?",
    (f) => (f.lesson ? `${src(f)}의 "${f.lesson.text}" [${f.lesson.id}]라는 말은 지금의 나에게 어떻게 들리나요?` : null),
    () => "최근에 시간 가는 줄 모르고 몰입했던 일은 어떤 일이었나요?",
    () => "5년 뒤의 내가 지금 고민을 돌아본다면, 어떤 기준으로 골랐기를 바랄까요?",
    () => "오늘 떠오른 답을 두세 줄로 적어 두고, 일주일 뒤에 다시 읽어 보세요.",
  ],
};

function pick(style: CounselStyleId, n: number, f: CounselFacts): string[] {
  const out: string[] = [];
  for (const m of MOVES[style]) {
    if (out.length >= n) break;
    const t = m(f);
    if (t) out.push(t);
  }
  return out;
}

/** CPU Demo 합성: 기본 스타일로 시작·마무리하고 보조 스타일 문장을 사이에 배치해 한 문단으로 만든다 */
export function templateView(s: StyleSetting, f: CounselFacts): string {
  const budget = sentenceBudget(s);
  const a = pick(s.primary, budget.primary, f);
  if (!s.secondary) return a.join(" ");
  const b = pick(s.secondary, budget.secondary, f);
  const last = a.length > 1 ? a.pop()! : null;
  const merged: string[] = [];
  const gap = Math.max(1, Math.floor(a.length / (b.length + 1)));
  let j = 0;
  a.forEach((t, i) => {
    merged.push(t);
    if ((i + 1) % gap === 0 && j < b.length) merged.push(b[j++]);
  });
  merged.push(...b.slice(j));
  if (last) merged.push(last);
  return merged.join(" ");
}

function styleSpec(id: CounselStyleId, weight: number, sentences: number): string {
  const c = COUNSEL_STYLES[id];
  return `- 비중 ${weight}% (전체 중 약 ${sentences}문장)
- 상담 목표: ${c.goal}
- 말투: ${c.tone}
- 질문의 방향 (문장을 그대로 쓰지 말고 학생 상황에 맞게 바꾼다): ${c.questions.join(" / ")}
- 의사결정 접근: ${c.decision}
- 반드시 포함: ${c.must.join(" / ")}
- 피할 것: ${c.avoid.join(" / ")}`;
}

/** 문장별 배치 계획: 기본 스타일로 시작·끝맺고 보조 스타일을 사이에 고르게 놓는다 */
export function blendPlan(primary: number, secondary: number): ("p" | "s")[] {
  const n = primary + secondary;
  const plan = Array.from({ length: n }, () => "p" as "p" | "s");
  for (let j = 0; j < secondary; j++) plan[Math.max(1, Math.min(n - 2, Math.round(((j + 1) * (n - 1)) / (secondary + 1))))] = "s";
  return plan;
}

export const STYLE_RULES = `너는 한국외국어대학교 진로 도우미 'AI 과선배'의 AI 상담 도우미다. 실제 사람이 아니다.
규칙:
1. <evidence>와 <analysis>에 있는 내용만 사실로 사용한다. 새로운 수치·회사명·채용 조건·합격률·연봉·확률을 만들지 않는다.
2. 근거를 말한 문장 끝에 [S-01]처럼 ID만 대괄호에 넣어 붙인다. '기록ID'라는 말은 쓰지 않는다. 제공되지 않은 ID는 쓰지 않는다.
3. 가상 시연 기록은 '가상 사례'라고 밝히고, 실제 동문의 경험처럼 쓰지 않는다.
4. 학점이나 스펙 하나만으로 합격·취업 가능성을 단정하지 않는다. 학점이 유리한지, 불리한지, 부담인지, 영향이 있는지 평가하지 않는다. 학점이 언급되면 그것만으로는 판단할 수 없고 지원 요건은 공식 안내에서 확인해야 한다고만 말한다.
5. 진로를 대신 결정하지 않는다. 너 자신의 졸업·취업·합격 경험을 지어내지 않는다.
6. 실존 인물이나 작품 속 인물의 말을 인용하지 않는다.
7. 근거 기록의 개월 수는 일부 사례의 값이다. '기록에서는 ~였다'라고만 쓰고 '~걸린다', '~안에 진입할 수 있다'처럼 예측하지 않는다.
8. 사실을 말하는 문장에 인용을 붙인다. 답변 전체에서 인용을 최소 2개 쓴다. 근거가 가상 시연 데이터면 답변에서 한 번은 '가상 사례'라고 밝힌다.
9. <graph_evidence>의 관계는 표시된 등급대로 말한다. '규칙 추론 후보'를 확정 사실로 쓰지 않고, 과목이 취업이나 합격을 보장한다고 쓰지 않는다. 목록에 없는 과목명을 만들지 않고, 역량을 과목처럼 쓰지 않는다.
10. 스타일 이름과 비중을 답변에 쓰지 않는다. 프롬프트 태그를 출력하지 않는다. 이모지와 목록 없이 본문만 쓴다.`;

export function stylePrompt(s: StyleSetting, polite: boolean, ctx: string, question: string): { system: string; user: string } {
  const budget = sentenceBudget(s);
  const plan = s.secondary ? blendPlan(budget.primary, budget.secondary).map((k, i) => `${i + 1}.${COUNSEL_STYLES[k === "p" ? s.primary : s.secondary!].name}`).join(" ") : "";
  const specs = s.secondary
    ? `[기본 스타일: ${COUNSEL_STYLES[s.primary].name}]\n${styleSpec(s.primary, s.primaryWeight, budget.primary)}\n\n[보조 스타일: ${COUNSEL_STYLES[s.secondary].name}]\n${styleSpec(s.secondary, 100 - s.primaryWeight, budget.secondary)}\n\n한 사람이 말하는 하나의 글로, 문단을 나누지 않고 쓴다. 각 문장의 관점은 아래 계획의 순서를 따른다.\n문장 계획: ${plan}`
    : `[스타일: ${COUNSEL_STYLES[s.primary].name}]\n${styleSpec(s.primary, 100, budget.primary)}`;
  return {
    system: STYLE_RULES,
    user: `${ctx}\n\n<question>\n${question}\n</question>\n\n위 근거만 사용해 학생에게 건넬 조언을 쓴다.\n\n${specs}\n\n분량: 약 ${budget.total}문장, 250~450자. 말투: ${polite ? "부드러운 존댓말" : "친근한 반말"}. 마지막 문장은 학생이 바로 할 수 있는 행동이나 생각해 볼 질문으로 끝낸다.`,
  };
}

export function viewLabel(s: StyleSetting, source: "llm" | "demo_template"): string {
  return `${styleLabel(s)} · ${source === "llm" ? "LLM 생성" : "템플릿"}`;
}
