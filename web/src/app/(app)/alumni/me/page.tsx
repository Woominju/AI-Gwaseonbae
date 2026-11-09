"use client";
import Link from "next/link";
import * as React from "react";
import { CheckCircle2, Clock, LogOut, Send, XCircle } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge, Button, Card, CardHeader, Chip, Input, Label, Select, Spinner, Textarea } from "@/components/ui";
import { api } from "@/lib/client/api";
import { CAREER_FIELDS, PATH_TYPE_LABEL } from "@/lib/taxonomy";

interface Alumni { id: string; display_name: string; department: string; verified: boolean; demo: boolean; mentoring_opt_in: boolean; visibility: "public" | "students_only" | "anonymous"; withdrawal_requested_at: string | null }
interface Sub { id: string; status: string; created_at: string; review_note: string; experience: { current_role: string } }
interface Q { id: string; text: string; answer: string | null; status: string; created_at: string }

const STATUS: Record<string, [string, "amber" | "green" | "rose" | "slate"]> = { pending: ["검토 대기", "amber"], approved: ["승인·공개", "green"], rejected: ["반려", "rose"], withdrawn: ["철회", "slate"] };

export default function AlumniMe() {
  const [me, setMe] = React.useState<{ alumni: Alumni; submissions: Sub[] } | null>(null);
  const [qs, setQs] = React.useState<Q[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ current_role: "", career_field: "data_science", path_type: "industry_job", key_skills: "", preparation: "", difficulties: "", advice: "", consent_publish: false, consent_ai: false });
  const [ans, setAns] = React.useState<Record<string, string>>({});
  const load = React.useCallback(async () => {
    try {
      setMe(await api("/api/alumni/me"));
      setQs((await api<{ questions: Q[] }>("/api/alumni/questions")).questions);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  const patch = async (p: Partial<Alumni> & { withdrawal?: boolean }) => {
    // 낙관적 반영 후 서버 결과로 동기화
    setMe((m) => (m ? { ...m, alumni: { ...m.alumni, ...(p.withdrawal ? { withdrawal_requested_at: new Date().toISOString(), mentoring_opt_in: false } : p) } } : m));
    try { await api("/api/alumni/me", "PATCH", p); } finally { await load(); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/api/alumni/submissions", "POST", { ...f, key_skills: f.key_skills.split(/[,，]/).map((s) => s.trim()).filter(Boolean) });
      setMsg("등록했어요. 관리자 검토 후 공개됩니다.");
      setF({ ...f, current_role: "", preparation: "", difficulties: "", advice: "" });
      await load();
    } catch (x) {
      setMsg((x as Error).message);
    }
  };
  if (err) return <Card className="p-6 text-sm"><p className="text-rose-600">{err}</p><Link href="/alumni/join" className="text-teal-700 underline">선배 인증하러 가기</Link></Card>;
  if (!me) return <Card className="p-8 text-center"><Spinner /></Card>;
  const a = me.alumni;
  return (
    <div>
      <PageTitle title={`${a.display_name} 선배 페이지`} description="경험 등록, 질문 답변, 공개 범위와 멘토링 참여를 관리해요." action={<Button variant="ghost" onClick={async () => { await api("/api/session", "DELETE"); location.href = "/alumni"; }}><LogOut className="h-4 w-4" /> 로그아웃</Button>} />
      <div className="mb-5 flex flex-wrap gap-2" data-testid="alumni-status">{a.verified ? <Badge tone="green">인증됨</Badge> : <Badge tone="rose">미인증</Badge>}{a.demo && <Badge tone="slate">시연용 계정 · 실제 동문으로 공개되지 않음</Badge>}{a.withdrawal_requested_at && <Badge tone="amber">철회 요청됨 · 관리자 처리 대기</Badge>}</div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="참여 설정" />
          <div className="space-y-4 p-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-teal-600" checked={a.mentoring_opt_in} onChange={(e) => patch({ mentoring_opt_in: e.target.checked })} data-testid="optin" /> 후배 질문 받기 (멘토링 참여)</label>
            <div>
              <p className="mb-1 font-medium text-slate-700">공개 범위</p>
              <div className="flex flex-wrap gap-2">{([["students_only", "학생에게만(이름 표시)"], ["public", "공개"], ["anonymous", "익명(학과만)"]] as const).map(([v, l]) => <Chip key={v} active={a.visibility === v} onClick={() => patch({ visibility: v })}>{l}</Chip>)}</div>
            </div>
            <Button variant="danger" size="sm" disabled={!!a.withdrawal_requested_at} onClick={() => { if (confirm("내 정보와 경험의 공개 철회를 요청할까요? 관리자 처리 후 비공개·삭제됩니다.")) patch({ withdrawal: true }); }} data-testid="withdraw">정보 수정·철회 요청</Button>
          </div>
        </Card>
        <Card>
          <CardHeader title="받은 질문" description="답변은 질문한 학생에게만 보여요" />
          <div className="space-y-3 p-4" data-testid="alumni-questions">
            {!qs.length && <p className="text-sm text-slate-500">{a.mentoring_opt_in ? "아직 받은 질문이 없어요." : "질문 받기를 켜면 후배가 질문할 수 있어요."}</p>}
            {qs.map((q) => (
              <div key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p>{q.text}</p>
                {q.answer ? <p className="mt-2 rounded bg-emerald-50 p-2 text-emerald-900">내 답변: {q.answer}</p> : q.status === "open" && (
                  <div className="mt-2 flex gap-2"><Input value={ans[q.id] ?? ""} onChange={(e) => setAns({ ...ans, [q.id]: e.target.value })} placeholder="답변 작성" data-testid="answer-input" /><Button size="sm" variant="secondary" onClick={async () => { await api(`/api/alumni/questions/${q.id}`, "POST", { answer: ans[q.id] }); await load(); }} data-testid="answer-send"><Send className="h-4 w-4" /></Button></div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="진로 경험 등록" description="관리자 검토·승인 후 게시판에 공개돼요. 실명·회사명·연락처는 적지 마세요." />
          <form onSubmit={submit} className="grid gap-4 p-4 md:grid-cols-2" data-testid="exp-form">
            <div><Label htmlFor="role">현재(또는 첫) 직무</Label><Input id="role" value={f.current_role} onChange={(e) => setF({ ...f, current_role: e.target.value })} placeholder="예: 데이터 분석가" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="cf">분야</Label><Select id="cf" value={f.career_field} onChange={(e) => setF({ ...f, career_field: e.target.value })}>{CAREER_FIELDS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select></div>
              <div><Label htmlFor="pt">경로</Label><Select id="pt" value={f.path_type} onChange={(e) => setF({ ...f, path_type: e.target.value })}>{Object.entries(PATH_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></div>
            </div>
            <div className="md:col-span-2"><Label htmlFor="sk">핵심 역량 (쉼표로 구분)</Label><Input id="sk" value={f.key_skills} onChange={(e) => setF({ ...f, key_skills: e.target.value })} placeholder="예: SQL, 파이썬, 통계" /></div>
            <div className="md:col-span-2"><Label htmlFor="prep">학업·준비 과정</Label><Textarea id="prep" rows={3} value={f.preparation} onChange={(e) => setF({ ...f, preparation: e.target.value })} /></div>
            <div><Label htmlFor="dif">어려웠던 점</Label><Textarea id="dif" rows={2} value={f.difficulties} onChange={(e) => setF({ ...f, difficulties: e.target.value })} /></div>
            <div><Label htmlFor="adv">후배에게 조언</Label><Textarea id="adv" rows={2} value={f.advice} onChange={(e) => setF({ ...f, advice: e.target.value })} /></div>
            <div className="space-y-1 text-sm md:col-span-2">
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-teal-600" checked={f.consent_publish} onChange={(e) => setF({ ...f, consent_publish: e.target.checked })} data-testid="consent-publish" /> (필수) 승인 후 선배 경험 게시판에 공개하는 데 동의합니다.</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-teal-600" checked={f.consent_ai} onChange={(e) => setF({ ...f, consent_ai: e.target.checked })} /> (선택) AI 선배가 상담 근거로 인용하는 데 동의합니다.</label>
            </div>
            <div className="md:col-span-2 flex items-center gap-3"><Button type="submit" variant="secondary" disabled={!f.consent_publish} data-testid="exp-submit">검토 요청</Button>{msg && <span className="text-sm text-teal-800" data-testid="exp-msg">{msg}</span>}</div>
          </form>
          <div className="space-y-2 border-t border-slate-100 p-4" data-testid="my-submissions">
            {me.submissions.map((s) => <div key={s.id} className="flex items-center justify-between gap-2 text-sm"><span>{s.experience.current_role}</span><span className="flex items-center gap-1">{s.status === "approved" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : s.status === "pending" ? <Clock className="h-4 w-4 text-amber-600" /> : <XCircle className="h-4 w-4 text-slate-400" />}<Badge tone={STATUS[s.status][1]}>{STATUS[s.status][0]}</Badge></span></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
