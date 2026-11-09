"use client";
import Link from "next/link";
import * as React from "react";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, CircleHelp, ExternalLink, FileBadge, ListChecks, Map, Plug, Target, Users } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge, Button, Card, CardHeader, Select, Spinner, Tabs } from "@/components/ui";
import { postJSON, useAppState } from "@/lib/client/store";
import type { CareerAnalysis } from "@/lib/career/engine.server";
import { OCCUPATIONS, occupationForFields } from "@/lib/career/occupations";
import { addSkillGapItems } from "@/lib/career/roadmapLink";
import { loadRoadmap, profileSummary, saveRoadmap } from "@/lib/roadmap";
import { skillLabel } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

type Tab = "market" | "gap";

const MODE_LABEL: Record<string, { t: string; tone: "green" | "amber" | "slate" | "rose" }> = {
  live: { t: "실시간 연동", tone: "green" },
  fixture: { t: "테스트 Fixture", tone: "amber" },
  transcribed: { t: "수기 전사", tone: "amber" },
  not_configured: { t: "미연동", tone: "slate" },
  disabled: { t: "비활성", tone: "slate" },
  not_implemented: { t: "구현 안 함", tone: "rose" },
};

export function MarketClient({ initialTab, initialOccupation }: { initialTab: string | null; initialOccupation: string | null }) {
  const { profile, ready } = useAppState();
  const [tab, setTab] = React.useState<Tab>(initialTab === "gap" ? "gap" : "market");
  const [occ, setOcc] = React.useState<string>(initialOccupation ?? "");
  const [data, setData] = React.useState<CareerAnalysis | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [added, setAdded] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (ready && !occ) setOcc(occupationForFields(profile.interest_fields)?.id ?? "data_analyst");
  }, [ready, occ, profile.interest_fields]);

  React.useEffect(() => {
    if (!ready || !occ) return;
    setBusy(true);
    setErr(null);
    setAdded(null);
    postJSON<CareerAnalysis>("/api/career/analyze", { profile, occupation: occ })
      .then(setData)
      .catch((e) => setErr((e as Error).message))
      .finally(() => setBusy(false));
  }, [ready, occ, profile]);

  const addToRoadmap = () => {
    if (!data) return;
    const items = data.gap.priorities.map((p) => ({ skill: p.skill, label: p.label, reason: p.reason, alumni_ids: p.alumni_ids, synthetic_sources: data.gap.sample.postings_synthetic || data.ncs?.is_synthetic === true }));
    const { roadmap, added: n } = addSkillGapItems(loadRoadmap(localStorage), data.occupation.label, items, profileSummary(profile));
    saveRoadmap(localStorage, roadmap);
    setAdded(n);
  };

  const g = data?.gap;
  return (
    <div>
      <PageTitle
        title={tab === "market" ? "Career Market · 채용시장과 공식 역량" : "My Skill Gap · 내 역량 비교"}
        description="선배 경험, 공식 직무 역량(NCS), 채용공고를 출처별로 나눠 보여 줍니다. 서로 다른 출처를 같은 의미로 섞지 않습니다."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="관심 직무" value={occ} onChange={(e) => setOcc(e.target.value)} className="h-9 w-56 text-sm" data-testid="occupation-select">
              {OCCUPATIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
            <Tabs value={tab} onChange={setTab} items={[{ value: "market", label: "Career Market" }, { value: "gap", label: "My Skill Gap" }]} />
          </div>
        }
      />
      {busy && <Card className="p-8 text-center"><Spinner /></Card>}
      {err && <p className="text-sm text-rose-600">오류: {err}</p>}
      {data && g && !busy && (
        <div className="space-y-5">
          <Card className="p-4" data-testid="source-status">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Plug className="h-4 w-4 text-teal-600" /> 데이터 소스 연동 상태</p>
            <div className="grid gap-2 md:grid-cols-4">
              {data.sources.map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-1"><b className="text-slate-800">{s.label}</b><Badge tone={MODE_LABEL[s.mode].tone} data-testid={`source-${s.provider}`}>{MODE_LABEL[s.mode].t}</Badge></div>
                  <p className="mt-1 text-slate-500">{s.detail}</p>
                  <a href={s.docs_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-0.5 text-teal-700 hover:underline">공식 문서 <ExternalLink className="h-3 w-3" /></a>
                </div>
              ))}
            </div>
            {data.notices.map((n) => <p key={n} className="mt-2 flex gap-1 text-xs text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />{n}</p>)}
          </Card>

          {tab === "market" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader title="공식 직무정보 (NCS)" description={data.ncs ? data.ncs.title : "연결된 NCS 세분류 없음"} icon={<FileBadge className="h-4 w-4" />} />
                <div className="space-y-2 p-4 text-sm" data-testid="ncs-panel">
                  {!data.ncs && <p className="text-slate-500">이 직무에 연결된 NCS 자료가 없습니다. 추정해서 표시하지 않습니다.</p>}
                  {data.ncs?.is_synthetic && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">⚠ 테스트용 Fixture입니다. 아래 능력단위 명칭은 <b>실제 NCS 원문이 아닌 예시</b>이며, 공식 API 인증키로 조회한 결과로 교체해야 합니다.</p>}
                  {data.occupation.ncs && <p className="text-xs text-slate-500">분류 경로: {data.occupation.ncs.path} {data.occupation.ncs.code && `· 코드 ${data.occupation.ncs.code}`} {!data.occupation.ncs.code_verified && "(코드 공식 확인 전)"}</p>}
                  <ul className="space-y-1.5">
                    {data.ncs?.units?.map((u) => (
                      <li key={u.name} className="rounded-lg border border-slate-100 p-2">
                        <b className="text-navy-900">{u.name}</b>
                        <div className="mt-1 flex flex-wrap gap-1">{u.mapped_skills.map((s) => <Badge key={s} tone="navy">{skillLabel(s)}</Badge>)}</div>
                      </li>
                    ))}
                  </ul>
                  {data.ncs && <p className="text-[11px] text-slate-400">능력단위 → 역량 매핑은 서비스 설계 가정입니다 · 출처: <a href="https://www.ncs.go.kr" target="_blank" rel="noreferrer" className="underline">ncs.go.kr</a></p>}
                </div>
              </Card>
              <Card>
                <CardHeader title="채용시장 정보" description={`검색 조건 “${g.sample.postings_query}” · ${g.sample.postings}건 · ${data.postings_live ? `조회 ${new Date(g.sample.postings_fetched_at ?? data.generated_at).toLocaleString("ko-KR")}` : "실시간 조회 아님"}`} icon={<BriefcaseBusiness className="h-4 w-4" />} />
                <div className="space-y-2 p-4 text-sm" data-testid="postings-panel">
                  {!data.postings_live && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">⚠ 실제 채용공고가 아닌 <b>테스트용 가상 공고</b>입니다. 사람인 API는 이용신청·승인 후 발급되는 access-key가 있어야 호출할 수 있어, 현재 실시간 연동되지 않았습니다.</p>}
                  {data.postings.length === 0 && <p className="text-slate-500">분석할 채용공고가 없습니다.</p>}
                  <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                    {data.postings.map((p) => (
                      <li key={p.id} className="rounded-lg border border-slate-100 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <b className="text-navy-900">{p.title}</b>
                          {p.is_synthetic ? <Badge tone="amber">가상 공고</Badge> : p.source_url && <a href={p.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-xs text-teal-700">원문(사람인) <ExternalLink className="h-3 w-3" /></a>}
                        </div>
                        <p className="text-xs text-slate-500">{p.description} · {p.experience_requirements ?? "경력 미기재"}{p.expires_at ? ` · 마감 ${new Date(p.expires_at).toLocaleDateString("ko-KR")}` : ""}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.required_skills.map((s) => <Badge key={s} tone="teal">필수 {skillLabel(s)}</Badge>)}
                          {p.preferred_skills.map((s) => <Badge key={s} tone="slate">우대 {skillLabel(s)}</Badge>)}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {data.postings_live && <p className="text-[11px] text-slate-400">출처: 사람인 채용정보 API. 공고 원문과 지원 조건은 반드시 원문 링크에서 확인하세요.</p>}
                </div>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader title="요구·우대 역량 빈도" description="공고 빈도는 위 검색 결과 표본 기준이며 전체 채용시장의 비율이 아닙니다" icon={<ListChecks className="h-4 w-4" />} />
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[560px] text-sm" data-testid="demand-table">
                    <thead className="text-xs text-slate-500"><tr><th className="py-1 text-left">역량</th><th className="text-left">NCS 능력단위</th><th className="text-left">공고 필수/우대 (N={g.sample.postings})</th><th className="text-left">선배 기록 (M={g.sample.alumni})</th></tr></thead>
                    <tbody>
                      {g.demanded.slice(0, 12).map((d) => (
                        <tr key={d.skill} className="border-t border-slate-100">
                          <td className="py-1.5 font-medium text-navy-900">{d.label}</td>
                          <td>{d.ncs_units.length || "-"}</td>
                          <td className="tabular-nums">{d.posting_required} / {d.posting_preferred}</td>
                          <td className="tabular-nums">{d.alumni_count || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button className="mt-3" size="sm" variant="secondary" onClick={() => setTab("gap")} data-testid="go-gap"><Target className="h-4 w-4" /> 내 역량과 비교하기</Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-5" data-testid="gap-panel">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> 현재 보유했다고 입력한 역량</p>
                  {!profile.skills.length && <p className="text-sm text-slate-500">프로필에 역량이 없습니다. <Link href="/profile" className="text-teal-700 underline">역량 입력</Link></p>}
                  <div className="flex flex-wrap gap-1" data-testid="gap-held">
                    {g.held.map((h) => <Badge key={h.skill} tone="green">{h.label}</Badge>)}
                    {g.held_other.map((h) => <Badge key={h.skill} tone="slate" title="이 직무 근거에는 나타나지 않음">{h.label}</Badge>)}
                  </div>
                  {g.held_other.length > 0 && <p className="mt-2 text-[11px] text-slate-400">회색: 입력했지만 이 직무 근거에는 나타나지 않은 역량</p>}
                </Card>
                <Card className="p-4">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-navy-900"><BriefcaseBusiness className="h-4 w-4" /> 이 직무에서 요구·우대하는 역량</p>
                  <div className="flex flex-wrap gap-1" data-testid="gap-demanded">{g.demanded.slice(0, 14).map((d) => <Badge key={d.skill} tone="navy">{d.label}</Badge>)}</div>
                  <p className="mt-2 text-[11px] text-slate-400">NCS {g.sample.ncs_units}개 단위 · 공고 {g.sample.postings}건{g.sample.postings_synthetic ? "(가상)" : ""} · 선배 기록 {g.sample.alumni}건(가상)</p>
                </Card>
                <Card className="p-4">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-amber-800"><CircleHelp className="h-4 w-4" /> 아직 보유 여부가 확인되지 않은 역량</p>
                  <div className="flex flex-wrap gap-1" data-testid="gap-unconfirmed">{g.unconfirmed.slice(0, 14).map((d) => <Badge key={d.skill} tone="amber">{d.label}</Badge>)}</div>
                  <p className="mt-2 text-[11px] text-slate-500">확인되지 않은 역량 = 부족한 역량이 <b>아닙니다</b>. 프로필에 입력하지 않았을 뿐일 수 있어요.</p>
                </Card>
              </div>
              <Card>
                <CardHeader title="우선 점검·학습 후보" description="세 출처의 빈도를 합산한 우선순위 (계산식: docs/SKILL_GAP_METHODOLOGY.md)" icon={<Target className="h-4 w-4" />} action={<Button size="sm" variant="secondary" onClick={addToRoadmap} disabled={!g.priorities.length} data-testid="add-roadmap"><Map className="h-4 w-4" /> 로드맵에 추가</Button>} />
                <div className="space-y-2 p-4" data-testid="gap-priorities">
                  {!g.priorities.length && <p className="text-sm text-slate-500">우선순위 기준(0.2)을 넘는 미확인 역량이 없습니다.</p>}
                  {g.priorities.map((p, i) => (
                    <div key={p.skill} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2"><b className="text-navy-900">{i + 1}. {p.label}</b><span className="text-xs tabular-nums text-slate-500">우선순위 {p.priority.toFixed(2)}</span></div>
                      <p className="mt-0.5 text-xs text-slate-600">{p.reason}</p>
                      {p.alumni_ids.length > 0 && (
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500"><Users className="h-3.5 w-3.5" /> 관련 선배 경험:{p.alumni_ids.slice(0, 4).map((id) => <Link key={id} href={`/seniors/${id}`} className="text-teal-700 hover:underline">{/^S-/.test(id) ? "가상" : "실제 선배"} {id}</Link>)}</p>
                      )}
                    </div>
                  ))}
                  {added !== null && <p className="flex items-center gap-1 text-sm text-emerald-700" data-testid="roadmap-added"><CheckCircle2 className="h-4 w-4" /> 로드맵에 {added}개 항목을 추가했습니다{added === 0 ? " (이미 추가된 항목)" : ""}. <Link href="/roadmap" className="underline">로드맵 보기</Link></p>}
                </div>
              </Card>
              <Card className="p-4">
                <p className="mb-2 text-sm font-semibold text-navy-900">근거의 역할 구분</p>
                <div className="grid gap-2 text-[13px] md:grid-cols-2">
                  {([
                    ["선배 경험", data.summary.alumni_experience, "bg-amber-50"],
                    ["공식 직무정보", data.summary.official_standard, "bg-sky-50"],
                    ["채용시장 정보", data.summary.job_market, "bg-emerald-50"],
                    ["AI 분석", data.summary.ai_analysis, "bg-violet-50"],
                  ] as const).map(([t, d, c]) => <div key={t} className={cn("rounded-lg p-2.5", c)}><b>{t}</b> — {d}</div>)}
                </div>
                <ul className="mt-3 space-y-0.5 text-[11px] text-slate-500">{g.caveats.map((c) => <li key={c}>· {c}</li>)}</ul>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
