"use client";
import { RecordBadge } from "@/components/RecordBadge";
import Link from "next/link";
import * as React from "react";
import { AlertTriangle, Bot, ChevronDown, Eraser, FileSearch, HeartHandshake, Scale, Send, ShieldAlert, Telescope, UserRound, Wrench } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Badge, Button, Card, CardHeader, Spinner, Textarea } from "@/components/ui";
import { postJSON, useAppState } from "@/lib/client/store";
import { CRITERION_LABEL } from "@/lib/comparison";
import { profileSummary } from "@/lib/roadmap";
import type { ComparisonResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatResult {
  answer: string;
  answer_source: "demo_template" | "llm" | "guardrail";
  provider: { id: string; label: string; is_llm: boolean };
  analysis: { intent: string; intent_label: string; official_topics: string[] };
  evidence: { record_id: string; score: number; department: string; current_role: string; path_label: string; snippet: string; is_synthetic?: boolean }[];
  insufficient_evidence: boolean;
  official: { required: boolean; topics: string[]; found: number };
  comparison?: ComparisonResult;
  perspectives?: { warm: string; realistic: string; critical: string; summary: string; source: string };
  citation_check: { cited: string[]; invalid_removed: string[]; uncited: boolean };
  retrieval: { method: string; ms: number; fallback?: string };
  steps: { name: string; detail: string; ms: number }[];
  notices: string[];
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  result?: ChatResult;
}

const EXAMPLES = [
  "저는 수학과 3학년이고 AI 분야에 관심이 있어요. 대학원에 갈지 바로 취업할지 고민됩니다.",
  "우리 학과 선배들은 어떤 분야로 진출했나요?",
  "데이터 분석 직무를 준비하려면 무엇이 필요한가요?",
  "제 현재 스펙에서 부족한 부분은 무엇인가요?",
  "선배들은 인턴십을 어떻게 준비했나요?",
  "졸업 요건 학점이 몇 학점인가요?",
];

const CHAT_KEY = "hufs-atlas:chat:v1";

function Perspectives({ p }: { p: NonNullable<ChatResult["perspectives"]> }) {
  const items = [
    { k: "warm", t: "따뜻한 선배", icon: HeartHandshake, tone: "bg-rose-50 text-rose-800 ring-rose-100", text: p.warm },
    { k: "realistic", t: "현실적인 선배", icon: Wrench, tone: "bg-sky-50 text-sky-900 ring-sky-100", text: p.realistic },
    { k: "critical", t: "비판적인 선배", icon: Telescope, tone: "bg-violet-50 text-violet-900 ring-violet-100", text: p.critical },
  ];
  return (
    <div className="mt-3" data-testid="perspectives">
      <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
        <ShieldAlert className="h-3.5 w-3.5" /> 아래 세 관점은 같은 근거로 만든 <b>AI 관점 페르소나</b>이며 실제 선배가 아닙니다 · {p.source === "llm" ? "LLM 생성" : "Demo 템플릿"}
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        {items.map(({ k, t, icon: Icon, tone, text }) => (
          <div key={k} className={cn("rounded-xl p-3 ring-1", tone)}>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4" /> {t} <span className="text-[10px] font-normal opacity-70">(AI 관점)</span></p>
            <div className="text-[13px]"><Markdown text={text} /></div>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700"><b>세 관점 비교 요약</b> — <Markdown text={p.summary} /></div>
    </div>
  );
}

function MiniComparison({ c }: { c: ComparisonResult }) {
  const ranked = c.ranking.map((id) => c.options.find((o) => o.id === id)!);
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200" data-testid="chat-comparison">
      <table className="w-full min-w-[420px] text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr><th className="px-3 py-1.5 text-left font-medium">기준 <span className="font-normal">(1에 가까울수록 유리)</span></th>{ranked.map((o) => <th key={o.id} className="px-3 py-1.5 text-left font-medium">{o.title}</th>)}</tr>
        </thead>
        <tbody>
          {ranked[0].criteria.map((cr) => (
            <tr key={cr.key} className="border-t border-slate-100">
              <td className="px-3 py-1.5">{CRITERION_LABEL[cr.key]} <span className="text-slate-400">({(c.priorities[cr.key] * 100).toFixed(0)}%)</span></td>
              {ranked.map((o) => <td key={o.id} className="px-3 py-1.5 tabular-nums">{o.criteria.find((x) => x.key === cr.key)!.value.toFixed(2)}</td>)}
            </tr>
          ))}
          <tr className="border-t border-slate-200 bg-teal-50/50 font-semibold"><td className="px-3 py-1.5">우선순위 적합도</td>{ranked.map((o) => <td key={o.id} className="px-3 py-1.5 tabular-nums">{o.weighted_score.toFixed(2)}</td>)}</tr>
        </tbody>
      </table>
      <Link href="/compare" className="flex items-center justify-center gap-1 border-t border-slate-100 py-1.5 text-xs font-medium text-teal-700 hover:bg-slate-50"><Scale className="h-3.5 w-3.5" /> 우선순위를 바꿔 다시 계산하기</Link>
    </div>
  );
}

function AssistantMsg({ m }: { m: Msg }) {
  const r = m.result!;
  const [showSteps, setShowSteps] = React.useState(false);
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-navy-700 text-white"><Bot className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <b className="text-sm text-navy-900">AI 과선배</b>
          <Badge tone={r.answer_source === "llm" ? "violet" : "slate"} data-testid="answer-source">{r.answer_source === "llm" ? r.provider.label : r.answer_source === "guardrail" ? "규칙 기반 안내 · LLM 미사용" : "Demo Mode · 템플릿 응답"}</Badge>
          <Badge tone="navy">{r.analysis.intent_label}</Badge>
          {r.insufficient_evidence && <Badge tone="rose">근거 부족</Badge>}
          {r.official.required && <Badge tone="amber">공식 자료 필요 · 미등록</Badge>}
        </div>
        <Card className="p-4" data-testid="assistant-answer">
          <Markdown text={r.answer} />
          {r.comparison && <MiniComparison c={r.comparison} />}
          {r.perspectives && <Perspectives p={r.perspectives} />}
          {r.notices.length > 0 && (
            <div className="mt-3 space-y-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              {r.notices.map((n) => <p key={n} className="flex gap-1"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{n}</p>)}
            </div>
          )}
        </Card>
        <button onClick={() => setShowSteps((s) => !s)} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer">
          처리 과정 {showSteps ? "접기" : "보기"} <ChevronDown className={cn("h-3 w-3", showSteps && "rotate-180")} />
        </button>
        {showSteps && (
          <ol className="mt-1 space-y-0.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600" data-testid="chat-steps">
            {r.steps.map((s, i) => <li key={i}>{i + 1}. <b>{s.name}</b> — {s.detail} <span className="text-slate-400">({s.ms}ms)</span></li>)}
            <li>인용 검증: 유효 {r.citation_check.cited.join(", ") || "없음"}{r.citation_check.invalid_removed.length ? ` · 제거 ${r.citation_check.invalid_removed.join(", ")}` : ""}</li>
          </ol>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { profile, priorities } = useAppState();
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [multi, setMulti] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const s = sessionStorage.getItem(CHAT_KEY);
      if (s) setMsgs(JSON.parse(s));
    } catch {
      /* ignore */
    }
  }, []);
  React.useEffect(() => {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-20)));
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const last = [...msgs].reverse().find((m) => m.result)?.result;

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setErr(null);
    setQ("");
    const history = msgs.map((m) => ({ role: m.role, content: m.role === "assistant" ? m.content.slice(0, 1200) : m.content }));
    setMsgs((x) => [...x, { role: "user", content: question }]);
    setBusy(true);
    try {
      const r = await postJSON<ChatResult>("/api/chat", { question, profile, history, multi_perspective: multi, priorities: priorities.weights });
      setMsgs((x) => [...x, { role: "assistant", content: r.answer, result: r }]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageTitle
        title="AI 과선배 상담"
        description="질문을 분석하고, 내 프로필을 참고해 관련 선배 경험을 검색한 뒤, 검색된 근거만으로 답합니다. 근거가 없으면 없다고 말합니다."
        action={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4 accent-teal-600" checked={multi} onChange={(e) => setMulti(e.target.checked)} data-testid="multi-toggle" /> 3가지 관점 보기</label>
            <Button variant="ghost" size="sm" onClick={() => setMsgs([])}><Eraser className="h-4 w-4" /> 대화 지우기</Button>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="flex min-h-[640px] min-w-0 flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            <UserRound className="h-3.5 w-3.5" /> 참고 중인 프로필: <b className="text-slate-700">{profileSummary(profile)}</b>
            <Link href="/profile" className="ml-auto text-teal-700 hover:underline">수정</Link>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-4" data-testid="chat-log">
            {!msgs.length && (
              <div className="py-6">
                <p className="mb-3 text-center text-sm text-slate-500">예시 질문을 눌러 시작해 보세요</p>
                <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                  {EXAMPLES.map((e) => (
                    <button key={e} onClick={() => send(e)} className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-700 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer" data-testid="example-question">{e}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-navy-800 px-4 py-2.5 text-sm text-white">{m.content}</div>
                </div>
              ) : (
                <AssistantMsg key={i} m={m} />
              ),
            )}
            {busy && <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner className="text-teal-600" /> 질문 분석 → 선배 경험 검색 → 근거 기반 응답 생성 중…</div>}
            {err && <p className="text-sm text-rose-600">오류: {err}</p>}
            <div ref={endRef} />
          </div>
          <form
            className="flex items-end gap-2 border-t border-slate-100 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(q);
            }}
          >
            <Textarea
              rows={2}
              value={q}
              maxLength={1000}
              placeholder="진로 고민을 자유롭게 물어보세요 (Enter 전송, Shift+Enter 줄바꿈)"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(q);
                }
              }}
              data-testid="chat-input"
            />
            <Button type="submit" disabled={busy || !q.trim()} aria-label="보내기" data-testid="chat-send"><Send className="h-4 w-4" /></Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="답변에 사용한 근거" description="검색(관련도 ≥ 0.35)·비교 엔진이 사용한 선배 기록" icon={<FileSearch className="h-4 w-4" />} />
            <div className="space-y-2 p-4" data-testid="evidence-panel">
              {!last && <p className="text-sm text-slate-400">질문하면 근거가 여기에 표시됩니다.</p>}
              {last && !last.evidence.length && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">관련 근거를 찾지 못했습니다. 답변은 근거 부족을 인정하도록 제한되었습니다.</p>}
              {last?.evidence.map((e) => (
                <Link key={e.record_id} href={`/seniors/${e.record_id}`} className={cn("block rounded-xl border p-3 hover:border-teal-400", last.citation_check.cited.includes(e.record_id) ? "border-teal-300 bg-teal-50/30" : "border-slate-200")}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm text-navy-900">{e.current_role}</b>
                    <RecordBadge id={e.record_id} synthetic={e.is_synthetic} />
                  </div>
                  <p className="text-xs text-slate-500">{e.department} · {e.path_label} · 관련도 {e.score.toFixed(2)}{last.citation_check.cited.includes(e.record_id) ? " · 답변에서 인용됨" : ""}</p>
                  <p className="mt-1 text-xs text-slate-600">{e.snippet}</p>
                </Link>
              ))}
              {last && (
                <p className="pt-1 text-[11px] text-slate-400">
                  검색: {last.retrieval.method === "embedding_rerank" ? "bge-m3 + reranker (GPU)" : last.retrieval.method === "embedding" ? "bge-m3 (GPU)" : "로컬 n-gram·개념"} · {last.retrieval.ms}ms{last.retrieval.fallback ? ` · ${last.retrieval.fallback}` : ""}
                </p>
              )}
            </div>
          </Card>
          <Card className="p-4 text-xs leading-relaxed text-slate-500">
            <b className="text-slate-700">상담 원칙</b>
            <ul className="mt-1 space-y-0.5">
              <li>· 선배 기록은 모두 가상 시연 데이터입니다.</li>
              <li>· 졸업 요건·채용 일정·연봉·합격률은 공식 자료 없이 답하지 않습니다.</li>
              <li>· 진로를 대신 결정하지 않고 선택지와 근거를 설명합니다.</li>
              <li>· 검색되지 않은 기록을 인용하면 자동으로 제거합니다.</li>
              <li>· 학교의 진로 상담·동문 멘토링을 대체하지 않습니다.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
