"use client";
import Link from "next/link";
import * as React from "react";
import { Bot, CheckCircle2, Info, MessageCircleQuestion, Send, UserCheck, Users } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge, Button, Card, CardHeader, EmptyState, Select, Spinner, Textarea } from "@/components/ui";
import { api, type SessionInfo } from "@/lib/client/api";
import { fieldLabel, PATH_TYPE_LABEL, skillLabel } from "@/lib/taxonomy";

interface Board {
  experiences: { id: string; alumni_id: string; name: string; department: string; graduation_year: number | null; demo: boolean; approved_at: string; experience: { current_role: string; career_field: string; path_type: keyof typeof PATH_TYPE_LABEL; key_skills: string[]; preparation: string; difficulties: string; advice: string } }[];
  mentors: { id: string; name: string; department: string; demo: boolean }[];
  counts: { real_verified_experiences: number; demo_experiences: number; real_mentors: number; demo_mentors: number };
  public_demo?: boolean;
}
interface MyQ { id: string; alumni_name: string; text: string; answer: string | null; status: string; created_at: string }

const SourceBadge = ({ demo }: { demo: boolean }) => (demo ? <Badge tone="slate" title="운영 테스트용으로 발급한 계정 — 실제 동문 아님">시연용 계정</Badge> : <Badge tone="green" title="관리자가 인증 코드를 발급·확인한 선배">검증된 실제 선배</Badge>);

export default function AlumniBoard() {
  const [b, setB] = React.useState<Board | null>(null);
  const [sess, setSess] = React.useState<SessionInfo | null>(null);
  const [mine, setMine] = React.useState<MyQ[]>([]);
  const [to, setTo] = React.useState("");
  const [text, setText] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    const [bb, ss] = await Promise.all([api<Board>("/api/alumni/board"), api<SessionInfo>("/api/session")]);
    setB(bb);
    setSess(ss);
    if (ss.role === "student" && ss.alumni_network) setMine((await api<{ questions: MyQ[] }>("/api/questions")).questions);
  }, []);
  React.useEffect(() => { load().catch((e) => setMsg((e as Error).message)); }, [load]);

  const ask = async () => {
    setMsg(null);
    try {
      if (sess?.role !== "student") await api("/api/session/student", "POST");
      await api("/api/questions", "POST", { alumni_id: to, text });
      setText("");
      setMsg("질문을 남겼어요. 선배가 답하면 아래 '내 질문'에 표시됩니다.");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div>
      <PageTitle title="선배 네트워크" description="AI 선배와 실제 선배를 구분합니다. 실제 선배의 경험은 관리자 검토·승인 후에만 공개되고, 질문은 수신에 동의한 검증된 선배에게만 보낼 수 있어요." action={sess?.role === "alumni" ? <Link href="/alumni/me"><Button variant="secondary">내 선배 페이지</Button></Link> : <Link href="/alumni/join"><Button variant="outline"><UserCheck className="h-4 w-4" /> 선배로 참여하기</Button></Link>} />
      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <Card className="flex gap-3 p-4 text-sm"><Bot className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" /><p><b>AI 선배</b>는 실제 사람이 아닌 상담 도우미예요. 대화를 시작하고, 선배 기록·직무정보를 찾아 정리해 줘요. 자신의 졸업·취업 경험을 지어내지 않아요.</p></Card>
        <Card className="flex gap-3 p-4 text-sm"><Users className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p><b>실제 선배</b>는 인증 코드로 확인된 동문이에요. 직접 쓴 경험만 실제 선배 경험으로 표시하고, 질문 수신에 동의한 경우에만 연결해요.</p></Card>
      </div>
      {!b && <Card className="p-8 text-center"><Spinner /></Card>}
      {b && (
        <>
          {b.public_demo && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">공개 시연 모드에서는 실제 선배 데이터와 질문 기능을 사용하지 않습니다.</p>}
          <div className="mb-5 grid gap-3 sm:grid-cols-4" data-testid="alumni-counts">
            {[["검증된 실제 선배 경험", b.counts.real_verified_experiences], ["질문 가능한 실제 선배", b.counts.real_mentors], ["시연용 계정 경험", b.counts.demo_experiences], ["시연용 계정 선배", b.counts.demo_mentors]].map(([t, v]) => (
              <Card key={t as string} className="p-4"><p className="text-xs text-slate-500">{t}</p><p className="text-2xl font-bold text-navy-900">{v}</p></Card>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="선배 경험 게시판" description="관리자가 승인한 경험만 표시 · 가상 시연 기록 19건은 '선배 경험 DB'에 따로 있어요" icon={<CheckCircle2 className="h-4 w-4" />} />
              <div className="space-y-3 p-4" data-testid="alumni-experiences">
                {!b.experiences.length && <EmptyState title="아직 승인된 실제 선배 경험이 없어요" description="실제 선배가 인증 후 경험을 등록하고 관리자가 승인하면 여기에 표시됩니다. 지금 서비스의 선배 기록은 모두 가상 시연 데이터예요." action={<Link href="/seniors" className="text-sm text-teal-700 underline">가상 시연 기록 보기</Link>} />}
                {b.experiences.map((x) => (
                  <div key={x.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2"><b className="text-navy-900">{x.experience.current_role}</b><SourceBadge demo={x.demo} /><Badge tone="navy">{fieldLabel(x.experience.career_field)}</Badge><Badge tone="slate">{PATH_TYPE_LABEL[x.experience.path_type]}</Badge></div>
                    <p className="mt-1 text-xs text-slate-500">{x.name} · {x.department}{x.graduation_year ? ` · ${x.graduation_year} 졸업` : ""} · 승인 {x.approved_at?.slice(0, 10)}</p>
                    <p className="mt-2 text-sm text-slate-700"><b>준비 과정</b> {x.experience.preparation}</p>
                    {x.experience.difficulties && <p className="mt-1 text-sm text-slate-700"><b>어려웠던 점</b> {x.experience.difficulties}</p>}
                    {x.experience.advice && <p className="mt-1 text-sm text-slate-700"><b>후배에게</b> {x.experience.advice}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">{x.experience.key_skills.map((s) => <Badge key={s} tone="teal">{skillLabel(s)}</Badge>)}</div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="space-y-5">
              <Card>
                <CardHeader title="실제 선배에게 질문하기" description="질문 수신에 동의한 검증된 선배만 표시돼요" icon={<MessageCircleQuestion className="h-4 w-4" />} />
                <div className="space-y-3 p-4" data-testid="ask-panel">
                  {!b.mentors.length ? (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600" data-testid="no-mentors"><Info className="mr-1 inline h-4 w-4" />지금은 질문을 받을 수 있는 검증된 선배가 없어요. AI 선배와 먼저 이야기하거나, 학교 진로취업지원 부서의 멘토링 프로그램을 확인해 보세요.</p>
                  ) : (
                    <>
                      <Select value={to} onChange={(e) => setTo(e.target.value)} aria-label="선배 선택" data-testid="mentor-select">
                        <option value="">선배 선택</option>
                        {b.mentors.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.department}{m.demo ? " (시연용 계정)" : ""}</option>)}
                      </Select>
                      <Textarea rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="구체적으로 물어볼수록 좋아요. 연락처 등 개인정보는 적지 마세요." data-testid="question-text" />
                      <Button variant="secondary" disabled={!to || text.trim().length < 5} onClick={ask} data-testid="question-send"><Send className="h-4 w-4" /> 질문 남기기</Button>
                    </>
                  )}
                  {msg && <p className="text-sm text-teal-800" data-testid="ask-msg">{msg}</p>}
                </div>
              </Card>
              {sess?.role === "student" && (
                <Card>
                  <CardHeader title="내 질문" description="이 브라우저의 익명 학생 세션 기준" />
                  <div className="space-y-2 p-4" data-testid="my-questions">
                    {!mine.length && <p className="text-sm text-slate-500">남긴 질문이 없어요.</p>}
                    {mine.map((q) => (
                      <div key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <p className="text-xs text-slate-500">→ {q.alumni_name} · {q.status === "answered" ? "답변 완료" : q.status === "closed" ? "종료" : "답변 대기"}</p>
                        <p className="mt-1">{q.text}</p>
                        {q.answer && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-emerald-900" data-testid="question-answer"><b>선배 답변</b> {q.answer}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
