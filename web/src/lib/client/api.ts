"use client";
/** JSON API 호출 (쿠키 세션 포함). 실패 시 서버 오류 메시지로 throw */
export async function api<T>(url: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, { method, credentials: "same-origin", headers: body !== undefined ? { "content-type": "application/json" } : undefined, body: body !== undefined ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
  return j as T;
}

export interface SessionInfo {
  role: "student" | "alumni" | "admin" | null;
  alumni: { id: string; name: string; verified: boolean; demo: boolean } | null;
  alumni_network: boolean;
}
