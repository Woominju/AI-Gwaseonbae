"use client";
/**
 * 클라이언트 상태: 학생 프로필 · 매칭 가중치 · 비교 우선순위.
 * 브라우저 localStorage 에만 저장한다 (서버에 개인 프로필을 저장하지 않음).
 */
import * as React from "react";
import type { MatchWeights, PriorityWeights, StudentProfile } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/scoring";
import { PRIORITY_PRESETS } from "@/lib/comparison";

export const EMPTY_PROFILE: StudentProfile = { interest_fields: [], skills: [], career_types: [], values: [] };

const KEY = { profile: "hufs-atlas:profile:v1", weights: "hufs-atlas:weights:v1", priorities: "hufs-atlas:priorities:v1" };

interface Ctx {
  ready: boolean;
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  hasProfile: boolean;
  weights: MatchWeights;
  setWeights: (w: MatchWeights) => void;
  priorities: { preset: string; weights: PriorityWeights };
  setPriorities: (p: { preset: string; weights: PriorityWeights }) => void;
  resetAll: () => void;
}

const AppCtx = React.createContext<Ctx | null>(null);

function read<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [profile, setProfileS] = React.useState<StudentProfile>(EMPTY_PROFILE);
  const [weights, setWeightsS] = React.useState<MatchWeights>(DEFAULT_WEIGHTS);
  const [priorities, setPrioritiesS] = React.useState({ preset: "balanced", weights: PRIORITY_PRESETS[3].weights });

  React.useEffect(() => {
    setProfileS({ ...EMPTY_PROFILE, ...read(KEY.profile, EMPTY_PROFILE) });
    setWeightsS(read(KEY.weights, DEFAULT_WEIGHTS));
    setPrioritiesS(read(KEY.priorities, { preset: "balanced", weights: PRIORITY_PRESETS[3].weights }));
    setReady(true);
  }, []);

  const value: Ctx = {
    ready,
    profile,
    hasProfile: !!(profile.department || profile.interest_fields.length || profile.skills.length),
    setProfile: (p) => {
      setProfileS(p);
      localStorage.setItem(KEY.profile, JSON.stringify(p));
    },
    weights,
    setWeights: (w) => {
      setWeightsS(w);
      localStorage.setItem(KEY.weights, JSON.stringify(w));
    },
    priorities,
    setPriorities: (p) => {
      setPrioritiesS(p);
      localStorage.setItem(KEY.priorities, JSON.stringify(p));
    },
    resetAll: () => {
      Object.values(KEY).forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem("hufs-atlas:roadmap:v1");
      localStorage.removeItem("hufs-atlas:chat:v1");
      localStorage.removeItem("hufs-atlas:counsel:style:v1");
      // Campus Lounge 설정·대화 (기능이 꺼져 있어도 남은 값이 있으면 함께 삭제)
      ["hufs-atlas:lounge:seniors:v1", "hufs-atlas:lounge:student:v1", "hufs-atlas:lounge:prefs:v1", "hufs-atlas:lounge:naming:v1"].forEach((k) => localStorage.removeItem(k));
      ["hufs-atlas:lounge:chat:v1", "hufs-atlas:lounge:return:v1"].forEach((k) => sessionStorage.removeItem(k));
      setProfileS(EMPTY_PROFILE);
      setWeightsS(DEFAULT_WEIGHTS);
      setPrioritiesS({ preset: "balanced", weights: PRIORITY_PRESETS[3].weights });
    },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppState() {
  const c = React.useContext(AppCtx);
  if (!c) throw new Error("AppStateProvider missing");
  return c;
}

/** 서버 maxDuration(120초)보다 약간 길게: 서버가 답하지 못하면 화면이 영원히 기다리지 않도록 끊는다 */
export const POST_TIMEOUT_MS = 130_000;

export async function postJSON<T>(url: string, body: unknown, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = POST_TIMEOUT_MS, signal, headers, ...rest } = init ?? {};
  const timeout = AbortSignal.timeout(timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(headers ?? {}) }, body: JSON.stringify(body), ...rest, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (e) {
    if (signal?.aborted) throw new DOMException("요청을 취소했어요.", "AbortError");
    if (timeout.aborted) throw new Error(`응답이 ${Math.round(timeoutMs / 1000)}초 안에 오지 않아 기다리기를 멈췄어요. 잠시 후 다시 시도해 주세요.`);
    throw new Error(`서버에 연결하지 못했어요. 네트워크를 확인해 주세요. (${(e as Error).message.slice(0, 60)})`);
  }
  // 프록시·터널 오류(502·524 등)는 JSON 이 아닌 HTML 로 돌아온다 → 파서 오류를 그대로 보여 주지 않는다
  const j = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(j?.error ?? `서버가 요청을 처리하지 못했어요. (HTTP ${res.status})`);
  if (j === null) throw new Error("서버 응답 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.");
  return j;
}
