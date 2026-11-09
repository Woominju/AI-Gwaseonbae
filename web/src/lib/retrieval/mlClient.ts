import "server-only";
/** GPU ML 사이드카(ml/server.py) 클라이언트. 실패 시 null → 호출 측이 로컬 방식으로 폴백 */
const BASE = process.env.ML_SERVICE_URL?.replace(/\/$/, "");
let health: { at: number; ok: boolean; info?: Record<string, unknown> } | null = null;

async function call<T>(p: string, body?: unknown, timeoutMs = 15000): Promise<T | null> {
  if (!BASE) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + p, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function mlHealth(force = false): Promise<{ ok: boolean; info?: Record<string, unknown> }> {
  if (!BASE) return { ok: false };
  if (!force && health && Date.now() - health.at < 30000) return health;
  const info = await call<Record<string, unknown>>("/health", undefined, 2000);
  health = { at: Date.now(), ok: !!info?.ok, info: info ?? undefined };
  return health;
}

export async function embed(texts: string[]): Promise<number[][] | null> {
  const r = await call<{ vectors: number[][] }>("/embed", { texts });
  return r?.vectors ?? null;
}

export async function rerank(query: string, docs: string[]): Promise<number[] | null> {
  const r = await call<{ scores: number[] }>("/rerank", { query, docs });
  return r?.scores ?? null;
}

export function mlConfigured() {
  return !!BASE;
}
