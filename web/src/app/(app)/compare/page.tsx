"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, CircleHelp, History, Map as MapIcon, Scale, TriangleAlert } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { SyntheticNotice } from "@/components/Notice";
import { Badge, Button, Card, CardHeader, Chip, Progress, Slider, Spinner } from "@/components/ui";
import { postJSON, useAppState } from "@/lib/client/store";
import { CRITERIA, CRITERION_LABEL, OPTION_DEFS, PRIORITY_PRESETS, normalizePriorities } from "@/lib/comparison";
import { profileSummary } from "@/lib/roadmap";
import type { ComparisonResult, CriterionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

type Resp = ComparisonResult & { adjustments: string[] };

const BASIS = { data: { label: "데이터", tone: "teal" }, assumption: { label: "설계 가정", tone: "amber" }, mixed: { label: "가정+데이터", tone: "navy" } } as const;

export default function ComparePage() {
  const router = useRouter();
  const { profile, priorities, setPriorities, ready } = useAppState();
  const [opts, setOpts] = React.useState<string[]>(["graduate", "employment"]);
  const [res, setRes] = React.useState<Resp | null>(null);
  const [prev, setPrev] = React.useState<{ res: Resp; label: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const lastLabel = React.useRef<string>("");
  const resRef = React.useRef<Resp | null>(null);

  const presetLabel = (id: string) => PRIORITY_PRESETS.find((p) => p.id === id)?.label ?? "직접 조정";

  const run = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await postJSON<Resp>("/api/compare", { profile, priorities: priorities.weights, options: opts });
      const old = resRef.current;
      if (old && JSON.stringify(old.priorities) !== JSON.stringify(r.priorities)) setPrev({ res: old, label: lastLabel.current });
      resRef.current = r;
      setRes(r);
      lastLabel.current = presetLabel(priorities.preset);
    } finally {
      setLoading(false);
    }
  }, [profile, priorities, opts]);

  React.useEffect(() => {
    if (!ready) return;
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [ready, run]);

  const applyPreset = (id: string) => {
    const w = PRIORITY_PRESETS.find((p) => p.id === id)!.weights;
    // 경제적 제약 입력 시 가중치 보정은 서버 derivePriorities 와 동일 규칙
    const adj = { ...w, financial_burden: w.financial_burden + (profile.financial_constraint === "strong" ? 0.1 : profile.financial_constraint === "some" ? 0.05 : 0) };
    setPriorities({ preset: id, weights: normalizePriorities(adj) });
  };
  const setWeight = (k: CriterionKey, v: number) => setPriorities({ preset: "custom", weights: { ...priorities.weights, [k]: v } });
  const nw = normalizePriorities(priorities.weights);

  const ranked = res ? res.ranking.map((id) => res.options.find((o) => o.id === id)!) : [];
  const prevRank = prev ? prev.res.ranking : null;
  const flipped = prevRank && res && prevRank[0] !== res.ranking[0];

  return (
    <div>
      <PageTitle
        title="진로 선택지 비교"
        description="하나의 정답 대신, 내가 중요하게 여기는 기준에 따라 선택지가 어떻게 평가되는지 보여줍니다. 우선순위를 바꾸면 결과와 근거가 다시 계산됩니다."
        action={<Badge tone="navy">{profileSummary(profile)}</Badge>}
      />
      <SyntheticNotice compact className="mb-4" />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="min-w-0 space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader title="비교할 선택지" icon={<Scale className="h-4 w-4" />} />
            <div className="flex flex-wrap gap-2 p-4">
              {OPTION_DEFS.map((o) => (
                <Chip
                  key={o.id}
                  active={opts.includes(o.id)}
                  onClick={() => setOpts((x) => (x.includes(o.id) ? (x.length > 2 ? x.filter((y) => y !== o.id) : x) : [...x, o.id]))}
                >
                  {o.title.replace(/^경로 [A-Z] · /, "")}
                </Chip>
              ))}
              <p className="w-full text-[11px] text-slate-400">최소 2개를 선택합니다.</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="나의 우선순위" description="가치 기준의 가중치" />
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    data-testid={`preset-${p.id}`}
                    onClick={() => applyPreset(p.id)}
                    className={cn("rounded-lg border px-2 py-2 text-xs font-medium transition-colors cursor-pointer", priorities.preset === p.id ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 hover:border-teal-500")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {CRITERIA.map((c) => (
                <div key={c.key} title={c.description}>
                  <Slider id={`p-${c.key}`} label={c.label} value={priorities.weights[c.key]} display={`${(nw[c.key] * 100).toFixed(0)}%`} onChange={(v) => setWeight(c.key, v)} />
                </div>
              ))}
              {profile.financial_constraint && profile.financial_constraint !== "none" && <p className="text-[11px] text-amber-700">프로필의 경제적 제약이 프리셋 적용 시 &lsquo;경제적 부담 낮음&rsquo; 가중치에 반영됩니다.</p>}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          {!res && <Card className="p-10 text-center"><Spinner /></Card>}
          {res && (
            <>
              <Card className={cn("p-5 transition-colors", flipped ? "border-teal-300 bg-teal-50/40" : "")} data-testid="compare-summary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">현재 우선순위: <b>{presetLabel(priorities.preset)}</b> {loading && <Spinner className="ml-1 h-3 w-3 text-teal-600" />}</p>
                    <p className="mt-1 text-lg font-bold text-navy-900">
                      현재 기준에서는 <span className="text-teal-700" data-testid="top-option">{ranked[0].title}</span>이(가) 더 잘 맞습니다
                    </p>
                    <p className="text-sm text-slate-500">
                      차이 {(ranked[0].weighted_score - ranked[1].weighted_score).toFixed(2)} · 결정 요인: {res.decisive_criteria.slice(0, 2).map((d) => `${CRITERION_LABEL[d.key]}(${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(2)})`).join(", ")}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => router.push(`/roadmap?option=${ranked[0].id}`)} data-testid="to-roadmap">
                    <MapIcon className="h-4 w-4" /> 이 경로로 로드맵 만들기
                  </Button>
                </div>
                {prev && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm" data-testid="change-panel">
                    <p className="mb-2 flex items-center gap-1.5 font-semibold text-navy-900"><History className="h-4 w-4 text-teal-600" /> 우선순위 변경 전후 비교 ({prev.label || "이전"} → {presetLabel(priorities.preset)})</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {res.options.map((o) => {
                        const before = prev.res.options.find((x) => x.id === o.id);
                        const d = before ? o.weighted_score - before.weighted_score : 0;
                        return (
                          <div key={o.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <span className="text-xs">{o.title}</span>
                            <span className="tabular-nums text-xs">
                              {before?.weighted_score.toFixed(2)} → <b>{o.weighted_score.toFixed(2)}</b>{" "}
                              <span className={d >= 0 ? "text-emerald-600" : "text-rose-600"}>{d >= 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}{Math.abs(d).toFixed(2)}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      {flipped ? <b className="text-teal-700">1순위가 바뀌었습니다. </b> : "1순위는 유지되었습니다. "}
                      가중치가 바뀐 기준:{" "}
                      {(Object.keys(res.priorities) as CriterionKey[])
                        .map((k) => ({ k, d: res.priorities[k] - prev.res.priorities[k] }))
                        .filter((x) => Math.abs(x.d) > 0.01)
                        .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
                        .map((x) => `${CRITERION_LABEL[x.k]} ${x.d > 0 ? "+" : ""}${(x.d * 100).toFixed(0)}%p`)
                        .join(", ") || "없음"}
                      . 각 선택지의 기준별 값(근거 기반)은 그대로이고, 기준의 중요도만 달라졌습니다.
                    </p>
                  </div>
                )}
              </Card>

              <Card className="overflow-x-auto">
                <CardHeader title="기준별 평가" description="값이 높을수록 학생에게 유리 · 기여도 = 가중치 × 값" />
                <table className="w-full min-w-[640px] text-sm" data-testid="criteria-table">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-2 font-medium">기준 (가중치)</th>
                      {ranked.map((o) => <th key={o.id} className="px-4 py-2 font-medium">{o.title}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERIA.map((c) => (
                      <tr key={c.key} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-800">{c.label}</p>
                          <p className="text-[11px] text-slate-400">{(res.priorities[c.key] * 100).toFixed(0)}%</p>
                        </td>
                        {ranked.map((o) => {
                          const cs = o.criteria.find((x) => x.key === c.key)!;
                          return (
                            <td key={o.id} className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-9 tabular-nums font-semibold text-navy-900">{cs.value.toFixed(2)}</span>
                                <Progress value={cs.value} className="h-1.5 max-w-24" />
                                <Badge tone={BASIS[cs.basis].tone}>{BASIS[cs.basis].label}</Badge>
                              </div>
                              <p className="mt-1 text-[11px] leading-snug text-slate-500">{cs.explanation}</p>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-navy-900">우선순위 적합도</td>
                      {ranked.map((o) => (
                        <td key={o.id} className="px-4 py-3">
                          <span className="text-lg font-bold tabular-nums text-teal-700" data-testid={`score-${o.id}`}>{o.weighted_score.toFixed(2)}</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                {ranked.map((o, i) => (
                  <Card key={o.id} className={cn(i === 0 && "ring-2 ring-teal-200")}>
                    <CardHeader title={o.title} description={o.summary} action={i === 0 ? <Badge tone="teal">현재 1순위</Badge> : undefined} />
                    <div className="space-y-3 p-4 text-sm">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2">졸업 후 첫 직무까지<br /><b className="text-base text-navy-900">{o.typical_months ?? "-"}개월</b><span className="text-slate-400"> (근거 중앙값)</span></div>
                        <div className="rounded-lg bg-slate-50 p-2">관련 선배 경험<br /><b className="text-base text-navy-900">{o.evidence_record_ids.length}건</b></div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-slate-500">필요한 준비 과정 (선배 기록)</p>
                        <ul className="space-y-0.5 text-slate-700">{o.preparation.map((p) => <li key={p}>· {p}</li>)}</ul>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-slate-500">관련 역량</p>
                        <div className="flex flex-wrap gap-1">{o.required_skills.map((s) => <Badge key={s} tone={o.missing_skills.includes(s) ? "amber" : "green"}>{s}</Badge>)}</div>
                        {o.missing_skills.length > 0 && <p className="mt-1 text-[11px] text-amber-700">주황색: 현재 프로필에 없는 역량</p>}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> 기대할 수 있는 장점</p>
                          <ul className="space-y-1 text-xs text-slate-700">{o.pros.map((p) => <li key={p}>{p.startsWith("[") ? <span><Badge tone="amber">선배 진술</Badge> {p}</span> : <span><Badge>일반적 고려</Badge> {p}</span>}</li>)}</ul>
                        </div>
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-rose-700"><TriangleAlert className="h-3.5 w-3.5" /> 위험 요소</p>
                          <ul className="space-y-1 text-xs text-slate-700">{o.risks.map((p) => <li key={p}>{p.startsWith("[") ? <span><Badge tone="amber">선배 진술</Badge> {p}</span> : <span><Badge>일반적 고려</Badge> {p}</span>}</li>)}</ul>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-slate-500">관련 선배 경험 (근거)</p>
                        <div className="flex flex-wrap gap-1.5">{o.evidence_record_ids.map((id) => <Link key={id} href={`/seniors/${id}`} className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100">{id}</Link>)}</div>
                      </div>
                      <div className="rounded-lg border border-dashed border-slate-300 p-2.5">
                        <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><CircleHelp className="h-3.5 w-3.5" /> 추가 확인이 필요한 정보</p>
                        <ul className="space-y-0.5 text-xs text-slate-600">{o.to_verify.map((t) => <li key={t}>· {t}</li>)}</ul>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/roadmap?option=${o.id}`)}>
                        이 경로 기준 로드맵 <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-4 text-xs text-slate-500">
                {res.adjustments.map((a) => <p key={a}>· {a}</p>)}
                {res.notes.map((n) => <p key={n}>· {n}</p>)}
                <p>· &lsquo;설계 가정&rsquo; 표시는 근거 데이터가 아닌 서비스 설계자가 정한 기본값이 섞인 항목입니다.</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

