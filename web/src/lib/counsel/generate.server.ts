import "server-only";
/**
 * 스타일 답변 생성: 질문당 LLM 1회 (5개 스타일을 미리 만들지 않는다).
 * 실패·가드 위반·슬롯 부족 시 같은 사실로 만든 템플릿으로 대체하고 그 사실을 표시한다.
 */
import { acquireLLM } from "../aiDemo.server";
import { getProvider, type LLMUsage } from "../chat/providers";
import { sanitizeForPrompt } from "../security/injection";
import { stylePrompt, templateView, type CounselFacts } from "./compose";
import { checkStyleText, type GuardIssue } from "./guard";
import type { StyleSetting } from "./styles";

export interface StyleView {
  text: string;
  source: "llm" | "demo_template";
  notice?: string;
  metrics: { ms: number; prompt_tokens: number; completion_tokens: number; guard_issues: GuardIssue[] };
}

export interface StyleGenInput {
  setting: StyleSetting;
  polite: boolean;
  question: string;
  /** 사실 답변과 동일한 근거·계산 블록 */
  ctx: string;
  facts: CounselFacts;
  allowedIds: string[];
  userKey: string;
  /** 사실 답변과 같은 LLM 슬롯 안에서 호출될 때 true */
  slotHeld?: boolean;
}

/** 스타일 답변의 인용 정리: 허용되지 않은 ID 는 제거 */
export function cleanCitations(text: string, allowed: Set<string>): { text: string; removed: string[] } {
  const removed: string[] = [];
  // [S-01, S-04] 묶음을 개별 인용으로 정규화
  const norm = text.replace(/\[\s*기록\s*ID\s*[:：]\s*/gi, "[").replace(/\[((?:[A-Za-z]-\d{2,3})(?:\s*[,，、]\s*[A-Za-z]-\d{2,3})+)\]/g, (_, inner: string) => inner.split(/\s*[,，、]\s*/).map((x) => `[${x}]`).join(""));
  const out = norm.replace(/\[([A-Za-z]-\d{2,3})\]/g, (all, id: string) => {
    if (allowed.has(id)) return all;
    removed.push(id);
    return "";
  });
  return { text: out.replace(/[ \t]{2,}/g, " ").trim(), removed };
}

/** 모델이 인용을 빠뜨려도 어떤 근거에서 나온 조언인지 항상 보이게 한다 */
export function withSourceLine(text: string, facts: CounselFacts): string {
  const cited = /\[[A-Za-z]-\d{2,3}\]/.test(text);
  const namesSynthetic = /가상/.test(text);
  if (cited && (namesSynthetic || !facts.allSynthetic)) return text;
  const parts = [cited ? "" : facts.cite, facts.allSynthetic ? "가상 시연 사례를 바탕으로 한 조언이에요" : ""].filter(Boolean);
  return parts.length ? `${text}\n\n(참고 근거: ${parts.join(" · ")})` : text;
}

export async function generateStyleView(input: StyleGenInput): Promise<StyleView> {
  const t0 = performance.now();
  const used: LLMUsage = { prompt_tokens: 0, completion_tokens: 0 };
  const done = (text: string, source: StyleView["source"], guard: GuardIssue[], notice?: string): StyleView => ({
    text,
    source,
    notice,
    metrics: { ms: Math.round(performance.now() - t0), prompt_tokens: used.prompt_tokens ?? 0, completion_tokens: used.completion_tokens ?? 0, guard_issues: guard },
  });
  const fallback = templateView(input.setting, input.facts);
  const provider = getProvider();
  if (!provider) return done(fallback, "demo_template", []);

  const slot = input.slotHeld ? null : acquireLLM(input.userKey, "style");
  if (slot && !slot.ok) return done(fallback, "demo_template", [], `선배 스타일 답변을 템플릿으로 대체했습니다: ${slot.reason}.`);
  const { system, user } = stylePrompt(input.setting, input.polite, input.ctx, sanitizeForPrompt(input.question));
  try {
    const raw = await provider.complete(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { maxTokens: 480, temperature: 0.5, seed: 4040, onUsage: (u) => Object.assign(used, u) },
    );
    const stripped = raw.replace(/<\/?(evidence|analysis|question|graph_evidence)\b[^>]*>/gi, "").trim();
    if (!stripped) return done(fallback, "demo_template", [], "AI 스타일 답변이 비어 있어 템플릿으로 대체했습니다.");
    const { text } = cleanCitations(stripped, new Set(input.allowedIds));
    const issues = checkStyleText(text, input.ctx);
    if (issues.length) return done(fallback, "demo_template", issues, "AI 스타일 답변에 근거에서 확인되지 않는 표현이 있어 템플릿으로 대체했습니다.");
    return done(withSourceLine(text, input.facts), "llm", []);
  } catch (e) {
    return done(fallback, "demo_template", [], `AI 스타일 답변 생성에 실패해 템플릿으로 대체했습니다: ${(e as Error).message.slice(0, 80)}`);
  } finally {
    if (slot?.ok) slot.release(used);
  }
}
