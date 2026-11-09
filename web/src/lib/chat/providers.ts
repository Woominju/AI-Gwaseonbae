import "server-only";
import { llmAllowed } from "../aiDemo.server";
/**
 * LLM Provider Adapter.
 *   LLM_PROVIDER=demo               : LLM 미사용. 검색 결과 + 사전 정의 템플릿 (기본값)
 *   LLM_PROVIDER=local              : 로컬 vLLM (OpenAI 호환, scripts/start_llm.sh)
 *   LLM_PROVIDER=openai_compatible  : OpenAI 호환 Chat Completions API (예: 공식 문서로 확인한
 *                                     HyperCLOVA X / CLOVA Studio 호환 엔드포인트). 엔드포인트·모델명은
 *                                     환경변수로만 지정하며 코드에 하드코딩하지 않는다.
 * 비밀키는 서버 환경변수로만 읽고 클라이언트에 전달하지 않는다.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderInfo {
  id: "demo" | "local" | "openai_compatible";
  label: string;
  model: string | null;
  is_llm: boolean;
}

export interface LLMUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

export interface CompleteOpts {
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  /** 재현성을 위한 샘플링 시드 (OpenAI 호환 서버가 지원할 때) */
  seed?: number;
  /** 사용량 기록 콜백 (제공자 응답의 usage 필드) */
  onUsage?: (u: LLMUsage) => void;
}

export interface LLMProvider {
  info: ProviderInfo;
  complete(messages: ChatMessage[], opts?: CompleteOpts): Promise<string>;
}

class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    public info: ProviderInfo,
    private baseUrl: string,
    private apiKey: string | undefined,
    private extraBody: Record<string, unknown> = {},
  ) {}
  async complete(messages: ChatMessage[], opts: CompleteOpts = {}) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), Number(process.env.LLM_TIMEOUT_MS ?? 90000));
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
        body: JSON.stringify({
          model: this.info.model,
          messages,
          max_tokens: opts.maxTokens ?? 900,
          temperature: opts.temperature ?? 0.3,
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
          ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
          ...this.extraBody,
        }),
        signal: ctl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: LLMUsage };
      if (j.usage) opts.onUsage?.({ prompt_tokens: j.usage.prompt_tokens, completion_tokens: j.usage.completion_tokens });
      const text = j.choices?.[0]?.message?.content ?? "";
      return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    } finally {
      clearTimeout(t);
    }
  }
}

export const DEMO_INFO: ProviderInfo = { id: "demo", label: "Demo Mode (템플릿 응답 · LLM 미사용)", model: null, is_llm: false };

/**
 * AI_DEMO_GATE=1 인 인스턴스에서는 시연 세션이 유효할 때만 LLM 을 반환한다 (만료 후 자동 CPU Demo).
 * 게이트가 없으면 기존 동작 그대로.
 */
export function getProvider(): LLMProvider | null {
  if (!llmAllowed()) return null;
  return getConfiguredProvider();
}

/** 설정상의 제공자 (게이트 무시) — 상태 표시용 */
export function getConfiguredProvider(): LLMProvider | null {
  const kind = (process.env.LLM_PROVIDER ?? "demo").toLowerCase();
  if (kind === "local") {
    const base = process.env.LOCAL_LLM_BASE_URL ?? "http://127.0.0.1:8009/v1";
    const model = process.env.LOCAL_LLM_SERVED_NAME ?? "local-llm";
    const display = process.env.LOCAL_LLM_MODEL ?? "Qwen/Qwen3-14B";
    // Qwen3 계열: 추론(thinking) 블록 비활성화
    return new OpenAICompatibleProvider({ id: "local", label: `로컬 LLM (${display}, vLLM)`, model, is_llm: true }, base, undefined, {
      chat_template_kwargs: { enable_thinking: false },
    });
  }
  if (kind === "openai_compatible") {
    const base = process.env.LLM_BASE_URL;
    const model = process.env.LLM_MODEL;
    if (!base || !model) return null; // 설정 불완전 → Demo Mode
    return new OpenAICompatibleProvider({ id: "openai_compatible", label: `클라우드 LLM (${model})`, model, is_llm: true }, base, process.env.LLM_API_KEY);
  }
  return null;
}
