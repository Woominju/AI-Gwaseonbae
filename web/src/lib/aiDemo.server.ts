import "server-only";
/**
 * 실제 생성형 AI 시연 모드 (60/120분 한정) — docs/AI_DEMO_OPERATIONS.md
 *
 * AI_DEMO_GATE=1 인 인스턴스에서만 동작한다. (기존 3100처럼 게이트가 없으면 기존 동작 유지)
 *  - 기본 비활성. 운영자가 명시적으로 시작(관리자 API 또는 scripts/ai_demo.sh → 상태 파일).
 *  - 서버 측 만료 시각(expires_at) 이후에는 LLM 요청을 차단하고 CPU Demo 로 전환.
 *  - 재시작 후 무단 재활성화 방지: 상태 파일의 started_at 이 이 서버 프로세스 시작 시각보다 이전이면 무효.
 *  - 동시 요청 · 사용자별 · 세션 총량 제한, 사용량(요청 수·토큰) 기록.
 * 서버 측 한도는 외부 제공자의 결제 한도를 대체하지 않는다(외부 API 사용 시 제공자 콘솔의 한도도 설정할 것).
 */
import fs from "node:fs";
import path from "node:path";

export const BOOT_AT = Date.now();
const DIR = path.join(process.cwd(), "data", "runtime");
const STATE = path.join(DIR, "ai_demo.json");
const USAGE = path.join(DIR, "ai_demo_usage.jsonl");

export interface AiDemoState {
  active: boolean;
  started_at: number;
  expires_at: number;
  minutes: number;
  started_by: string;
  ended_at?: number;
  end_reason?: string;
}

const num = (k: string, d: number) => {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v > 0 ? v : d;
};
export const LIMITS = {
  concurrency: () => num("AI_DEMO_MAX_CONCURRENCY", 2),
  perUserPer10m: () => num("AI_DEMO_MAX_PER_USER_10M", 20),
  sessionTotal: () => num("AI_DEMO_MAX_REQUESTS", 400),
};

export function gateEnabled(): boolean {
  return process.env.AI_DEMO_GATE === "1";
}

function readState(): AiDemoState | null {
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf8")) as AiDemoState;
  } catch {
    return null;
  }
}

function writeState(s: AiDemoState) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${STATE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, STATE);
}

/** 현재 유효한 시연 세션 (없으면 null). 만료되면 상태 파일을 비활성으로 정리한다. */
export function currentDemo(now = Date.now()): AiDemoState | null {
  const s = readState();
  if (!s || !s.active) return null;
  if (s.started_at < BOOT_AT) return null; // 이전 서버 프로세스에서 시작된 세션 → 재시작 후 무효
  if (now >= s.expires_at) {
    writeState({ ...s, active: false, ended_at: s.expires_at, end_reason: "expired" });
    return null;
  }
  return s;
}

/** LLM 사용 허용 여부: 게이트가 없으면 항상 true(기존 동작), 있으면 유효 세션이 있어야 true */
export function llmAllowed(): boolean {
  return !gateEnabled() || currentDemo() !== null;
}

export function startDemo(minutes: number, by: string): AiDemoState {
  if (minutes !== 60 && minutes !== 120) throw new Error("시연 시간은 60분 또는 120분만 가능합니다.");
  const now = Date.now();
  const s: AiDemoState = { active: true, started_at: now, expires_at: now + minutes * 60_000, minutes, started_by: by.slice(0, 40) };
  writeState(s);
  usage.session = { requests: 0, prompt_tokens: 0, completion_tokens: 0, blocked: 0 };
  return s;
}

export function stopDemo(reason = "manual"): AiDemoState | null {
  const s = readState();
  if (!s) return null;
  const ended = { ...s, active: false, ended_at: Date.now(), end_reason: reason };
  writeState(ended);
  return ended;
}

/* ---------------- 사용량·제한 ---------------- */

const usage = {
  inflight: 0,
  session: { requests: 0, prompt_tokens: 0, completion_tokens: 0, blocked: 0 },
  perUser: new Map<string, number[]>(),
};

export type AcquireResult = { ok: true; release: (u?: { prompt_tokens?: number; completion_tokens?: number }) => void } | { ok: false; reason: string };

/** LLM 호출 전 슬롯 확보. 실패 시 호출자는 CPU Demo 템플릿으로 대체해야 한다. */
export function acquireLLM(userKey: string, kind: string): AcquireResult {
  if (!gateEnabled()) return { ok: true, release: () => {} };
  const now = Date.now();
  const deny = (reason: string): AcquireResult => {
    usage.session.blocked++;
    log({ ts: now, kind, user: hashKey(userKey), result: "blocked", reason });
    return { ok: false, reason };
  };
  if (!currentDemo(now)) return deny("시연 시간이 아니거나 만료되었습니다");
  if (usage.session.requests >= LIMITS.sessionTotal()) return deny("이번 시연의 총 요청 한도에 도달했습니다");
  if (usage.inflight >= LIMITS.concurrency()) return deny("동시 요청이 많아 잠시 템플릿 응답으로 대체합니다");
  const arr = (usage.perUser.get(userKey) ?? []).filter((t) => now - t < 600_000);
  if (arr.length >= LIMITS.perUserPer10m()) return deny("사용자별 호출 한도(10분)에 도달했습니다");
  arr.push(now);
  usage.perUser.set(userKey, arr);
  usage.inflight++;
  usage.session.requests++;
  let done = false;
  return {
    ok: true,
    release: (u) => {
      if (done) return;
      done = true;
      usage.inflight = Math.max(0, usage.inflight - 1);
      usage.session.prompt_tokens += u?.prompt_tokens ?? 0;
      usage.session.completion_tokens += u?.completion_tokens ?? 0;
      log({ ts: Date.now(), kind, user: hashKey(userKey), result: "ok", prompt_tokens: u?.prompt_tokens ?? null, completion_tokens: u?.completion_tokens ?? null });
    },
  };
}

function hashKey(k: string): string {
  let h = 0;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}

function log(x: Record<string, unknown>) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.appendFileSync(USAGE, JSON.stringify(x) + "\n");
  } catch {
    /* 기록 실패는 서비스에 영향 주지 않음 */
  }
}

export function demoStatus() {
  const s = currentDemo();
  return {
    gate: gateEnabled(),
    active: !!s,
    expires_at: s ? new Date(s.expires_at).toISOString() : null,
    remaining_sec: s ? Math.max(0, Math.round((s.expires_at - Date.now()) / 1000)) : 0,
    minutes: s?.minutes ?? null,
    usage: { ...usage.session, inflight: usage.inflight },
    limits: { concurrency: LIMITS.concurrency(), per_user_10m: LIMITS.perUserPer10m(), session_total: LIMITS.sessionTotal() },
  };
}
