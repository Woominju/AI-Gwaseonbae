"use client";
import Link from "next/link";
import * as React from "react";
import { ArrowRight, GitBranch, Map as MapIcon, MessagesSquare, RefreshCw, Scale, SlidersHorizontal, UserRound } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";
import { SyntheticNotice } from "@/components/Notice";
import { Badge, Button, Card, CardHeader, EmptyState, Select, Slider, Spinner } from "@/components/ui";
import { postJSON, useAppState } from "@/lib/client/store";
import { useRecords } from "@/lib/client/useRecords";
import { DEFAULT_WEIGHTS, normalizeWeights, SUBSCORE_LABEL, WEIGHT_PRESETS } from "@/lib/scoring";
import { fieldLabel, skillLabel } from "@/lib/taxonomy";
import { profileSummary } from "@/lib/roadmap";
import type { MatchResult, MatchWeights } from "@/lib/types";

interface MatchResp {
  results: MatchResult[];
  query: string;
  retrieval: { method: string; ms: number; fallback?: string };
}

export default function Dashboard() {
  const { profile, hasProfile, weights, setWeights, ready } = useAppState();
  const { byId } = useRecords();
  const [data, setData] = React.useState<MatchResp | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState("auto");
  const [showN, setShowN] = React.useState(6);

  const run = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setData(await postJSON<MatchResp>("/api/match", { profile, weights, mode }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profile, weights, mode]);

  React.useEffect(() => {
    if (!ready) return;
    const t = setTimeout(run, 250); // 슬라이더 조작 시 디바운스
    return () => clearTimeout(t);
  }, [ready, run]);

  const top = data?.results.slice(0, showN) ?? [];
  const nw = normalizeWeights(weights);
  const fieldsCount = new Map<string, number>();
  for (const m of data?.results.slice(0, 6) ?? []) for (const f of byId.get(m.record_id)?.career_field ?? []) fieldsCount.set(f, (fieldsCount.get(f) ?? 0) + 1);
  const gapCount = new Map<string, number>();
  for (const m of data?.results.slice(0, 5) ?? []) for (const g of m.gaps) gapCount.set(g, (gapCount.get(g) ?? 0) + 1);
  const topGaps = [...gapCount].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div>
      <PageTitle title="진로 대시보드" description="내 프로필과 관련성이 높은 선배 경험, 관심 진로, 다음 행동을 한눈에 봅니다." />
      <SyntheticNotice className="mb-5" />
      {ready && !hasProfile && (
        <Card className="mb-5 flex flex-col items-start justify-between gap-3 border-teal-200 bg-teal-50/60 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-teal-900"><b>프로필이 비어 있습니다.</b> 지금은 근거 품질만으로 정렬되어 신뢰도가 낮게 표시됩니다.</p>
          <Link href="/profile"><Button size="sm" variant="secondary"><UserRound className="h-4 w-4" /> 프로필 입력하기</Button></Link>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-navy-900">나와 관련성이 높은 선배 경험</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {loading && <Spinner className="text-teal-600" />}
              {data && (
                <span data-testid="retrieval-method">
                  검색: {data.retrieval.method === "embedding_rerank" ? "임베딩+리랭커(GPU)" : data.retrieval.method === "embedding" ? "임베딩(GPU)" : "로컬 n-gram·개념"} · {data.retrieval.ms}ms
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={run} aria-label="다시 계산"><RefreshCw className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {data?.retrieval.fallback && <p className="text-xs text-amber-700">{data.retrieval.fallback}</p>}
          {err && <Card className="p-4 text-sm text-rose-700">오류: {err}</Card>}
          {!data && loading && <Card className="p-8 text-center text-sm text-slate-500"><Spinner className="mr-2" />선배 경험을 검색하는 중…</Card>}
          {data && top.length === 0 && <EmptyState title="표시할 선배 기록이 없습니다" />}
          <div className="space-y-3" data-testid="match-list">
            {top.map((m, i) => {
              const r = byId.get(m.record_id);
              return r ? <MatchCard key={m.record_id} m={m} r={r} rank={i + 1} defaultOpen={i === 0} /> : null;
            })}
          </div>
          {data && showN < data.results.length && (
            <Button variant="outline" className="w-full" onClick={() => setShowN((n) => n + 6)}>더 보기 ({data.results.length - showN}건)</Button>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="내 상황" icon={<UserRound className="h-4 w-4" />} action={<Link href="/profile" className="text-xs text-teal-700 hover:underline">수정</Link>} />
            <div className="space-y-2 p-4 text-sm">
              <p className="font-medium text-navy-900">{profileSummary(profile)}</p>
              <div className="flex flex-wrap gap-1">{profile.skills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              {profile.concern && <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">“{profile.concern}”</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="개인화 가중치" description="바꾸면 순위가 즉시 다시 계산됩니다" icon={<SlidersHorizontal className="h-4 w-4" />} />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap gap-1.5">
                {WEIGHT_PRESETS.map((p) => (
                  <button key={p.id} title={p.description} onClick={() => setWeights(p.weights)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs hover:border-teal-500 cursor-pointer" data-testid={`weight-preset-${p.id}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {(Object.keys(DEFAULT_WEIGHTS) as (keyof MatchWeights)[]).map((k) => (
                <Slider key={k} id={`w-${k}`} label={SUBSCORE_LABEL[k]} value={weights[k]} display={`${(nw[k] * 100).toFixed(0)}%`} onChange={(v) => setWeights({ ...weights, [k]: v })} />
              ))}
              <p className="text-[11px] text-slate-400">기본값(30/25/20/15/10)은 설계 가정이며 학습·검증된 최적값이 아닙니다.</p>
              <div>
                <label className="mb-1 block text-xs text-slate-500" htmlFor="mode">의미 유사도 계산 방식</label>
                <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="h-9 text-xs">
                  <option value="auto">자동 (GPU 가능 시 임베딩+리랭커)</option>
                  <option value="local">로컬 n-gram·개념 확장 (API 불필요)</option>
                  <option value="embedding">bge-m3 임베딩</option>
                  <option value="embedding_rerank">bge-m3 + bge-reranker</option>
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="관심 직무 요약" description="상위 6개 추천 기록의 진로 분야" />
            <div className="space-y-2 p-4">
              {[...fieldsCount].sort((a, b) => b[1] - a[1]).map(([f, c]) => (
                <div key={f} className="flex items-center justify-between text-sm">
                  <span>{fieldLabel(f)}</span>
                  <Badge tone="teal">{c}건</Badge>
                </div>
              ))}
              {topGaps.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                  <p className="mb-1 font-medium text-slate-700">자주 보이는 준비 요소 (내 프로필에 없음)</p>
                  <div className="flex flex-wrap gap-1">{topGaps.map(([g, c]) => <Badge key={g} tone="amber">{g} · {c}</Badge>)}</div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="다음 행동" />
            <div className="divide-y divide-slate-100">
              {[
                { href: "/graph", icon: GitBranch, t: "역량·활동·진로 연결 탐색", d: "커리어 그래프" },
                { href: "/chat", icon: MessagesSquare, t: "AI 과선배에게 질문하기", d: "근거 기반 상담" },
                { href: "/compare", icon: Scale, t: "대학원 vs 취업 비교", d: "우선순위별 재계산" },
                { href: "/roadmap", icon: MapIcon, t: "내 로드맵 만들기", d: "1·3·6·12개월 계획" },
              ].map(({ href, icon: Icon, t, d }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <Icon className="h-4 w-4 text-teal-600" />
                  <span className="flex-1 text-sm"><b className="text-navy-900">{t}</b><span className="block text-xs text-slate-500">{d}</span></span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
              ))}
            </div>
          </Card>
          <p className="px-1 text-[11px] text-slate-400">상위 기록 핵심 역량: {[...new Set(top.flatMap((m) => byId.get(m.record_id)?.key_skills ?? []))].slice(0, 8).map(skillLabel).join(", ")}</p>
        </div>
      </div>
    </div>
  );
}
