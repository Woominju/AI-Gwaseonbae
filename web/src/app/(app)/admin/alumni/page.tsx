"use client";
import * as React from "react";
import { Bot, KeyRound, ShieldAlert, Timer } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge, Button, Card, CardHeader, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/client/api";

interface Overview {
  pending: { id: string; alumni_id: string; demo: boolean; created_at: string; experience: { current_role: string; preparation: string; advice: string }; consent: { use_for_ai: boolean } }[];
  alumni: { id: string; display_name: string; department: string; verified: boolean; demo: boolean; mentoring_opt_in: boolean; withdrawal_requested_at: string | null }[];
  invites: { alumni_id: string; created_at: string; expires_at: string; used_at: string | null; demo: boolean; note: string }[];
  reports: { id: string; target_type: string; target_id: string; reason: string; status: string }[];
  questions: { total: number; open: number };
  audit: { at: string; actor: string; action: string; target: string }[];
}
interface Demo { gate: boolean; active: boolean; remaining_sec: number; usage: { requests: number; prompt_tokens: number; completion_tokens: number; blocked: number; inflight: number }; limits: Record<string, number> }

export default function AdminAlumni() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [token, setToken] = React.useState("");
  const [ov, setOv] = React.useState<Overview | null>(null);
  const [demo, setDemo] = React.useState<Demo | null>(null);
  const [code, setCode] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    try {
      setOv(await api("/api/admin/overview"));
      setDemo(await api("/api/admin/ai-demo"));
      setAuthed(true);
    } catch {
      setAuthed(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  const run = async (fn: () => Promise<unknown>) => { setErr(null); try { await fn(); await load(); } catch (e) { setErr((e as Error).message); } };

  if (authed === null) return <Card className="p-8 text-center"><Spinner /></Card>;
  if (!authed)
    return (
      <div className="mx-auto max-w-md">
        <PageTitle title="관리자 로그인" description="서버의 ADMIN_TOKEN 으로만 로그인할 수 있어요 (서버 측 검증, 4시간 세션)." />
        <Card className="space-y-3 p-5">
          <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN" data-testid="admin-token" />
          <Button variant="secondary" onClick={() => run(async () => { await api("/api/admin/login", "POST", { token }); })} data-testid="admin-login">로그인</Button>
          {err && <p className="text-sm text-rose-600">{err}</p>}
        </Card>
      </div>
    );
  return (
    <div>
      <PageTitle title="선배 인증·데이터 검토" description="선배 인증 코드 발급, 경험 승인, 신고·철회 처리, 실제 AI 시연 모드 제어" />
      {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="선배 인증 코드 발급" description="코드는 지금 한 번만 표시되고 서버에는 해시만 저장돼요" icon={<KeyRound className="h-4 w-4" />} />
          <div className="space-y-3 p-4">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="메모 (예: 수학과 2020 졸업 — 학과 확인)" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => run(async () => setCode((await api<{ code: string }>("/api/admin/invites", "POST", { note, demo: true })).code))} data-testid="invite-demo">시연용 코드</Button>
              <Button size="sm" variant="secondary" onClick={() => { if (confirm("동문 신원을 학과·운영 절차로 확인했나요? 실제 선배 코드는 확인된 경우에만 발급하세요.")) run(async () => setCode((await api<{ code: string }>("/api/admin/invites", "POST", { note, demo: false })).code)); }}>실제 선배 코드</Button>
            </div>
            {code && <p className="rounded-lg bg-teal-50 p-3 font-mono text-lg tracking-widest text-teal-900" data-testid="invite-code">{code}</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="실제 AI 시연 모드" description="AI_DEMO_GATE=1 인스턴스 전용 · 만료 시 자동으로 CPU Demo" icon={<Bot className="h-4 w-4" />} />
          <div className="space-y-3 p-4 text-sm" data-testid="ai-demo-panel">
            {!demo?.gate ? <p className="text-slate-500">이 인스턴스는 시연 게이트 없이 실행 중이에요.</p> : (
              <>
                <p className="flex items-center gap-2">{demo.active ? <Badge tone="violet">활성 · 남은 시간 {Math.ceil(demo.remaining_sec / 60)}분</Badge> : <Badge tone="slate">비활성 (CPU Demo)</Badge>}</p>
                <p className="text-xs text-slate-500">요청 {demo.usage.requests} · 차단 {demo.usage.blocked} · 토큰 입력 {demo.usage.prompt_tokens} / 출력 {demo.usage.completion_tokens} · 한도 동시 {demo.limits.concurrency}, 사용자 10분 {demo.limits.per_user_10m}, 총 {demo.limits.session_total}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => run(() => api("/api/admin/ai-demo", "POST", { minutes: 60 }))}><Timer className="h-4 w-4" /> 60분 시작</Button>
                  <Button size="sm" variant="outline" onClick={() => run(() => api("/api/admin/ai-demo", "POST", { minutes: 120 }))}>120분 시작</Button>
                  <Button size="sm" variant="danger" onClick={() => run(() => api("/api/admin/ai-demo", "DELETE"))}>지금 종료</Button>
                </div>
                <p className="text-[11px] text-slate-500">GPU 모델 서버(vLLM)의 시작·종료는 scripts/ai_demo.sh 로 합니다 (docs/AI_DEMO_OPERATIONS.md).</p>
              </>
            )}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={`검토 대기 경험 ${ov?.pending.length ?? 0}건`} />
          <div className="space-y-3 p-4" data-testid="pending-list">
            {!ov?.pending.length && <p className="text-sm text-slate-500">대기 중인 경험이 없어요.</p>}
            {ov?.pending.map((p) => {
              const al = ov.alumni.find((a) => a.id === p.alumni_id);
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><b>{p.experience.current_role}</b><span className="text-xs text-slate-500">{al?.display_name} · {al?.department}</span>{p.demo ? <Badge tone="slate">시연용 계정</Badge> : <Badge tone="green">실제 선배</Badge>}{p.consent.use_for_ai && <Badge tone="teal">AI 인용 동의</Badge>}</div>
                  <p className="mt-1 text-slate-600">{p.experience.preparation}</p>
                  <div className="mt-2 flex gap-2"><Button size="sm" variant="secondary" onClick={() => run(() => api(`/api/admin/submissions/${p.id}`, "POST", { action: "approve" }))} data-testid="approve">승인</Button><Button size="sm" variant="outline" onClick={() => run(() => api(`/api/admin/submissions/${p.id}`, "POST", { action: "reject", note: "보완 필요" }))}>반려</Button></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="선배 계정" />
          <div className="space-y-2 p-4 text-sm">
            {ov?.alumni.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{a.display_name} · {a.department} {a.demo && <Badge tone="slate">시연</Badge>} {a.mentoring_opt_in && <Badge tone="teal">질문 수신</Badge>} {a.withdrawal_requested_at && <Badge tone="amber">철회 요청</Badge>}</span>
                {a.verified && <Button size="sm" variant="danger" onClick={() => { if (confirm("이 선배의 정보를 비공개 처리하고 경험을 철회할까요?")) run(() => api(`/api/admin/alumni/${a.id}`, "POST", { action: "withdraw" })); }}>철회 처리</Button>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title={`신고 ${ov?.reports.filter((r) => r.status === "open").length ?? 0}건`} icon={<ShieldAlert className="h-4 w-4" />} />
          <div className="space-y-2 p-4 text-sm">
            {ov?.reports.map((r) => <div key={r.id} className="flex items-center justify-between gap-2"><span>{r.target_type} · {r.reason}</span>{r.status === "open" && <Button size="sm" variant="outline" onClick={() => run(() => api(`/api/admin/reports/${r.id}`, "POST", {}))}>처리 완료</Button>}</div>)}
            <p className="pt-2 text-xs text-slate-500">질문 {ov?.questions.total} (미답변 {ov?.questions.open}) · 최근 감사 로그 {ov?.audit.length}건</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
