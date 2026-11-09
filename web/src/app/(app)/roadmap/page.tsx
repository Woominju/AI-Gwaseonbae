"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { CheckCircle2, Download, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge, Button, Card, EmptyState, Input, Progress, Select, Spinner, Textarea } from "@/components/ui";
import { postJSON, useAppState } from "@/lib/client/store";
import { addCustomItem, loadRoadmap, removeItem, roadmapProgress, saveRoadmap, updateItem } from "@/lib/roadmap";
import { OPTION_DEFS } from "@/lib/comparison";
import type { Roadmap, RoadmapItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const HORIZONS: { h: RoadmapItem["horizon"]; label: string; hint: string }[] = [
  { h: 1, label: "1개월", hint: "조사·탐색" },
  { h: 3, label: "3개월", hint: "역량·프로젝트" },
  { h: 6, label: "6개월", hint: "경험 확보" },
  { h: 12, label: "12개월", hint: "재평가·지원" },
];

function ItemCard({ it, onChange, onRemove }: { it: RoadmapItem; onChange: (p: Partial<RoadmapItem>) => void; onRemove?: () => void }) {
  const [memo, setMemo] = React.useState(it.memo);
  React.useEffect(() => setMemo(it.memo), [it.memo]);
  return (
    <Card className={cn("p-3.5 transition-colors", it.done && "border-emerald-200 bg-emerald-50/40")} data-testid="roadmap-item">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" checked={it.done} onChange={(e) => onChange({ done: e.target.checked })} className="mt-1 h-4 w-4 accent-teal-600" aria-label={`${it.title} 완료`} />
        <span className={cn("text-sm font-semibold text-navy-900", it.done && "text-slate-500 line-through")}>{it.title}</span>
      </label>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{it.purpose}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge tone="navy">{it.timing}</Badge>
        <Badge>{it.related_option}</Badge>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">
        근거: {it.evidence.record_ids.length ? it.evidence.record_ids.map((id) => <Link key={id} href={`/seniors/${id}`} className="mr-1 font-semibold text-teal-700 hover:underline">{id}</Link>) : null}
        <span>{it.evidence.note}</span>
      </div>
      <Textarea
        rows={2}
        value={memo}
        placeholder="메모 (예: 관심 공고 링크, 진행 상황)"
        className="mt-2 text-xs"
        onChange={(e) => setMemo(e.target.value)}
        onBlur={() => memo !== it.memo && onChange({ memo })}
        aria-label="메모"
      />
      {onRemove && (
        <button onClick={onRemove} className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-600 hover:underline cursor-pointer"><Trash2 className="h-3 w-3" /> 삭제</button>
      )}
    </Card>
  );
}

export default function RoadmapPage() {
  return (
    <React.Suspense fallback={<Card className="p-8 text-center"><Spinner /></Card>}>
      <RoadmapInner />
    </React.Suspense>
  );
}

function RoadmapInner() {
  const sp = useSearchParams();
  const { profile, priorities, hasProfile } = useAppState();
  const [rm, setRm] = React.useState<Roadmap | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [option, setOption] = React.useState(sp.get("option") ?? "auto");
  const [busy, setBusy] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    setRm(loadRoadmap(localStorage));
    setLoaded(true);
  }, []);

  const commit = (r: Roadmap) => {
    setRm(r);
    saveRoadmap(localStorage, r);
  };

  const generate = async () => {
    if (rm && !window.confirm("기존 로드맵을 새로 만든 로드맵으로 바꿀까요? 체크·메모가 초기화됩니다.")) return;
    setBusy(true);
    try {
      const j = await postJSON<{ roadmap: Roadmap }>("/api/roadmap", { profile, priorities: priorities.weights, optionId: option === "auto" ? undefined : option, options: option === "public" ? ["public", "employment"] : undefined });
      commit(j.roadmap);
    } finally {
      setBusy(false);
    }
  };

  const exportJSON = () => {
    if (!rm) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(rm, null, 2)], { type: "application/json" }));
    a.download = "hufs-career-roadmap.json";
    a.click();
  };

  const progress = rm ? roadmapProgress(rm) : 0;

  return (
    <div>
      <PageTitle
        title="나의 로드맵"
        description="상담·비교 결과를 실제 행동 계획으로 바꿉니다. 체크와 메모는 이 브라우저에 자동 저장되어 새로고침해도 유지됩니다."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="기준 경로" value={option} onChange={(e) => setOption(e.target.value)} className="h-9 w-48 text-xs">
              <option value="auto">비교 1순위 경로 (현재 우선순위)</option>
              {OPTION_DEFS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </Select>
            <Button onClick={generate} disabled={busy} data-testid="generate-roadmap">
              {busy ? <Spinner /> : rm ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />} {rm ? "다시 생성" : "로드맵 생성"}
            </Button>
          </div>
        }
      />
      {!hasProfile && <p className="mb-4 text-sm text-amber-700">프로필이 비어 있으면 일반적인 계획만 만들어집니다. <Link href="/profile" className="underline">프로필 입력</Link></p>}
      {!loaded && <Card className="p-8 text-center"><Spinner /></Card>}
      {loaded && !rm && (
        <Card>
          <EmptyState title="아직 로드맵이 없습니다" description="‘로드맵 생성’을 누르면 내 프로필과 비교 결과의 근거 선배 기록을 바탕으로 1·3·6·12개월 계획을 만듭니다." action={<Button onClick={generate} disabled={busy}><Sparkles className="h-4 w-4" /> 로드맵 생성</Button>} />
        </Card>
      )}
      {rm && (
        <>
          <Card className="mb-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">기준 경로</p>
                <p className="font-bold text-navy-900" data-testid="roadmap-basis">{rm.basis.option_title}</p>
                <p className="text-xs text-slate-500">{rm.basis.profile_summary} · 마지막 저장 {new Date(rm.updated_at).toLocaleString("ko-KR")}</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">진행률</span><b className="tabular-nums text-teal-700" data-testid="roadmap-progress">{Math.round(progress * 100)}%</b></div>
                <Progress value={progress} />
                <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700"><CheckCircle2 className="h-3 w-3" /> 자동 저장됨 (브라우저)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportJSON}><Download className="h-4 w-4" /> JSON 내보내기</Button>
                <Button variant="danger" size="sm" onClick={() => { if (window.confirm("로드맵을 삭제할까요?")) { localStorage.removeItem("hufs-atlas:roadmap:v1"); setRm(null); } }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HORIZONS.map(({ h, label, hint }) => {
              const items = rm.items.filter((i) => i.horizon === h);
              const done = items.filter((i) => i.done).length;
              return (
                <div key={h} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-12 place-items-center rounded-lg bg-navy-800 text-xs font-bold text-white">{label}</span>
                      <span className="text-sm text-slate-500">{hint}</span>
                    </div>
                    <span className="text-xs tabular-nums text-slate-500">{done}/{items.length}</span>
                  </div>
                  <Progress value={items.length ? done / items.length : 0} className="h-1" tone="navy" />
                  {items.map((it) => (
                    <ItemCard key={it.id} it={it} onChange={(p) => commit(updateItem(rm, it.id, p))} onRemove={it.custom ? () => commit(removeItem(rm, it.id)) : undefined} />
                  ))}
                  <form
                    className="flex gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const t = (newTitle[h] ?? "").trim();
                      if (!t) return;
                      commit(addCustomItem(rm, h, t));
                      setNewTitle((x) => ({ ...x, [h]: "" }));
                    }}
                  >
                    <Input value={newTitle[h] ?? ""} onChange={(e) => setNewTitle((x) => ({ ...x, [h]: e.target.value }))} placeholder="할 일 직접 추가" className="h-8 text-xs" aria-label={`${label} 할 일 추가`} />
                    <Button size="sm" variant="outline" type="submit" aria-label="추가"><Plus className="h-3.5 w-3.5" /></Button>
                  </form>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-slate-400">로드맵의 활동은 선배 기록(가상)과 프로필에서 규칙 기반으로 생성한 제안이며, 구체적인 모집 일정·자격 요건은 각 기관의 공식 안내를 확인해야 합니다.</p>
        </>
      )}
    </div>
  );
}
