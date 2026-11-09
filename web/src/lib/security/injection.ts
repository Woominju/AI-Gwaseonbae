/**
 * 프롬프트 인젝션 방어.
 * - 선배 기록·업로드 문서·검색 결과는 '데이터'로만 취급한다.
 * - 지시문처럼 보이는 패턴을 탐지해 Import 단계에서 격리(quarantine)하고,
 *   LLM 컨텍스트에 넣을 때는 해당 구간을 [제거됨] 으로 치환한다.
 */
const PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above)\s+(instructions|prompts?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+/i,
  /system\s*prompt/i,
  /developer\s+(mode|message)/i,
  /(이전|위의?|앞의?)\s*(모든\s*)?(지시|명령|지침|프롬프트)[을를]?\s*(모두\s*)?(무시|잊)/,
  /(시스템|system)\s*(프롬프트|지시)/,
  /너는\s*이제\s*/,
  /지금부터\s*(너는|당신은)/,
  /<\s*\/?\s*(script|iframe|system|assistant|instructions?)\b/i,
  /\[\s*(system|assistant)\s*\]/i,
  /(api[_\s-]?key|비밀\s*키|password|비밀번호)\s*(를|을)?\s*(알려|출력|보여|reveal|print)/i,
];

export interface InjectionFinding {
  pattern: string;
  excerpt: string;
}

export function detectInjection(text: string): InjectionFinding[] {
  const out: InjectionFinding[] = [];
  for (const p of PATTERNS) {
    const m = text.match(p);
    if (m && m.index !== undefined) {
      const s = Math.max(0, m.index - 15);
      out.push({ pattern: p.source, excerpt: text.slice(s, m.index + m[0].length + 15) });
    }
  }
  return out;
}

/** 객체 안의 모든 문자열을 재귀적으로 검사 */
export function scanObject(obj: unknown, path = ""): (InjectionFinding & { path: string })[] {
  const out: (InjectionFinding & { path: string })[] = [];
  if (typeof obj === "string") {
    for (const f of detectInjection(obj)) out.push({ ...f, path });
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...scanObject(v, `${path}[${i}]`)));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) out.push(...scanObject(v, path ? `${path}.${k}` : k));
  }
  return out;
}

/** LLM 컨텍스트에 넣기 전 정화: 지시문 패턴 치환 + 구분자 위조 방지 */
export function sanitizeForPrompt(text: string): string {
  let t = text.replace(/<\/?(evidence|record|data)[^>]*>/gi, "");
  for (const p of PATTERNS) t = t.replace(new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g"), "[제거됨]");
  return t;
}
