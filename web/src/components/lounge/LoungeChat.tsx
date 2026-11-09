"use client";
import { RecordBadge } from "@/components/RecordBadge";
import Link from "next/link";
import * as React from "react";
import { AlertTriangle, Network, BookUser, Users, BriefcaseBusiness, ChevronDown, GitBranch, LifeBuoy, Map, MessageCircleQuestion, RotateCcw, Scale, Send, ShieldAlert, Sparkles, Target, UserRound } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { Badge, Button, Spinner, Textarea } from "@/components/ui";
import type { LoungeAction, LoungeTurn } from "@/lib/lounge/turn.server";
import { fieldLabel } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export interface LoungeMsg {
  role: "user" | "senior" | "system";
  text: string;
  slot?: number;
  name?: string;
  turn?: LoungeTurn;
}

const ACTION_ICON: Record<LoungeAction["id"], typeof Map> = { seniors: BookUser, compare: Scale, graph: GitBranch, explore: Network, roadmap: Map, market: BriefcaseBusiness, gap: Target, profile: UserRound, alumni: Users };

/** 응답 대기 표시: 경과 시간과 취소 수단을 항상 함께 보여 준다 (끝나지 않는 스피너 방지) */
function Waiting({ name, onCancel }: { name: string | null; onCancel?: () => void }) {
  const [sec, setSec] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-[#ead9bf]" role="status" data-testid="lounge-waiting">
      <div className="flex items-center gap-2">
        <Spinner className="text-teal-600" />
        <span className="min-w-0 flex-1">{name} 선배가 근거를 살펴보며 답을 준비하고 있어요 · <span className="tabular-nums">{sec}초</span></span>
        {onCancel && <button type="button" onClick={onCancel} className="shrink-0 cursor-pointer rounded-full border border-[#ead9bf] px-2.5 py-0.5 text-xs text-slate-600 hover:bg-[#f3e7d3]" data-testid="lounge-cancel">그만 기다리기</button>}
      </div>
      {sec >= 20 && <p className="mt-1 text-xs text-slate-500">생성형 AI 답변은 30초 안팎 걸릴 수 있어요. 오래 걸리면 취소하고 다시 물어봐도 괜찮아요.</p>}
    </div>
  );
}

/** 진로 선택 비교 정리: 계산값 기반이며 선택 스타일과 무관하다 */
function DecisionCard({ t }: { t: NonNullable<LoungeTurn["decision"]> }) {
  const Section = ({ title, items }: { title: string; items: string[] }) => (items.length ? <div><p className="font-semibold text-navy-900">{title}</p><ul className="mt-0.5 space-y-0.5 text-slate-700">{items.map((x) => <li key={x}>· {x}</li>)}</ul></div> : null);
  return (
    <details className="mt-2 rounded-xl bg-[#f7efe2] p-3 text-[13px]" data-testid="decision-brief">
      <summary className="cursor-pointer font-semibold text-navy-900">선택지 비교 정리 보기</summary>
      <div className="mt-2 space-y-2.5">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {t.options.map((o) => (
            <div key={o.title} className="rounded-lg bg-white p-2 ring-1 ring-[#ead9bf]">
              <p className="font-bold text-navy-900">{o.title} <span className="font-normal text-slate-500">적합도 {o.score.toFixed(2)}</span></p>
              <p className="text-xs text-slate-600">장점: {o.pro}</p>
              <p className="text-xs text-slate-600">위험: {o.risk}</p>
            </div>
          ))}
        </div>
        <Section title="현실적인 조건" items={t.conditions} />
        <Section title="장기 준비" items={t.long_term} />
        <Section title="다른 길" items={t.alternatives} />
        <Section title="내 기준 확인하기" items={t.values} />
        <Section title="다음 행동" items={t.next_actions} />
        <Section title="아직 불확실한 것" items={t.uncertainty} />
      </div>
    </details>
  );
}

function RoleRow({ tone, title, children }: { tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg px-2.5 py-1.5 text-[12px] ring-1", tone)}>
      <b className="mr-1">{title}</b>
      {children}
    </div>
  );
}

function SeniorBubble({ m, onFollow, onAction }: { m: LoungeMsg; onFollow: (q: string) => void; onAction: (a: LoungeAction, t: LoungeTurn) => void }) {
  const t = m.turn;
  const [showEv, setShowEv] = React.useState(false);
  const [showQa, setShowQa] = React.useState(false);
  const [showGraph, setShowGraph] = React.useState(false);
  const [showCore, setShowCore] = React.useState(true);
  return (
    <div className="lg-fade-in space-y-2" data-testid="senior-msg">
      <div className="flex flex-wrap items-center gap-1.5">
        <b className="text-sm text-navy-900">{m.name}</b>
        <Badge tone="teal" title="실제 사람이 아닙니다">AI 선배</Badge>
        {t && <Badge tone={t.mode.generative ? "violet" : "slate"} data-testid="lounge-mode">{t.mode.label}</Badge>}
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200">
        <p>{m.text}</p>
        {t?.safety && (
          <div className="mt-2 rounded-xl bg-rose-50 p-3 text-rose-900 ring-1 ring-rose-200" data-testid="safety-box">
            <p className="mb-1 flex items-center gap-1 font-semibold"><LifeBuoy className="h-4 w-4" /> 지금 바로 연락할 수 있는 곳</p>
            <ul className="space-y-0.5 text-[13px]">{t.safety.map((s) => <li key={s}>· {s}</li>)}</ul>
          </div>
        )}
        {t?.persona_view && t.persona_view.text && t.persona_view.text !== "-" && (
          <div className="mt-2 rounded-xl bg-teal-50/70 p-3 text-[13px] ring-1 ring-teal-100" data-testid="persona-view">
            <p className="mb-1 flex items-center gap-1 text-[11px] text-teal-800"><ShieldAlert className="h-3 w-3 shrink-0" /> {m.name}의 조언{t.persona_view.label ? ` · ${t.persona_view.label}` : ""} · 같은 근거로 만든 AI 설명 · {t.persona_view.source === "llm" ? "LLM 생성" : "템플릿"}</p>
            <Markdown text={t.persona_view.text} />
          </div>
        )}
        {t?.core && (
          <div className="mt-2">
            <button onClick={() => setShowCore((s) => !s)} className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700">
              근거 기반 답변 (모든 스타일 공통) <ChevronDown className={cn("h-3 w-3", showCore && "rotate-180")} />
            </button>
            {showCore && (
              <div className="mt-1 rounded-xl bg-slate-50 p-3 text-[13px]" data-testid="lounge-core-answer">
                <Markdown text={t.core.answer} />
                {t.core.notices.length > 0 && <div className="mt-2 space-y-0.5 text-[11px] text-amber-800">{t.core.notices.map((n) => <p key={n} className="flex gap-1"><AlertTriangle className="h-3 w-3 shrink-0" />{n}</p>)}</div>}
              </div>
            )}
          </div>
        )}
        {t?.decision && <DecisionCard t={t.decision} />}
        {t?.intel && (
          <div className="mt-2 space-y-1.5" data-testid="intel-roles">
            <p className="text-[11px] font-semibold text-slate-500">근거의 역할 구분 · {t.intel.occupation.label}</p>
            <RoleRow tone="bg-amber-50 ring-amber-100 text-amber-950" title="선배 경험">{t.intel.summary.alumni_experience}</RoleRow>
            <RoleRow tone="bg-sky-50 ring-sky-100 text-sky-950" title="공식 직무정보">{t.intel.summary.official_standard}</RoleRow>
            <RoleRow tone="bg-emerald-50 ring-emerald-100 text-emerald-950" title="채용시장 정보">{t.intel.summary.job_market}</RoleRow>
            <RoleRow tone="bg-violet-50 ring-violet-100 text-violet-950" title="AI 분석">{t.intel.summary.ai_analysis}</RoleRow>
            {t.intel.notices.map((n) => <p key={n} className="text-[11px] text-amber-800">· {n}</p>)}
          </div>
        )}
        {t?.core && t.core.evidence.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowEv((s) => !s)} className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-teal-700 hover:underline" data-testid="toggle-evidence">
              관련 선배 경험 {t.core.evidence.length}건 {showEv ? "접기" : "보기"} <ChevronDown className={cn("h-3 w-3", showEv && "rotate-180")} />
            </button>
            {showEv && (
              <div className="mt-1 space-y-1.5" data-testid="lounge-evidence">
                {t.core.evidence.map((e) => (
                  <Link key={e.record_id} href={`/seniors/${e.record_id}`} onClick={() => onAction({ id: "seniors", label: "", href: `/seniors/${e.record_id}` }, t)} className="block rounded-lg border border-slate-200 p-2 hover:border-teal-400">
                    <div className="flex items-center justify-between gap-2"><b className="text-[12px] text-navy-900">{e.current_role}</b><RecordBadge id={e.record_id} synthetic={e.is_synthetic} /></div>
                    <p className="text-[11px] text-slate-500">{e.department} · {e.path_label} · 관련도 {e.score.toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {t?.core?.graph && t.core.graph.facts.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowGraph((s) => !s)} className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-teal-700 hover:underline" data-testid="toggle-graph">
              <Network className="h-3.5 w-3.5" /> 관계 근거 {t.core.graph.facts.length}건 {showGraph ? "접기" : "보기"}
            </button>
            {showGraph && (
              <ul className="mt-1 space-y-1.5" data-testid="lounge-graph">
                {t.core.graph.facts.map((f) => (
                  <li key={f.id} className="rounded-lg border border-slate-200 p-2">
                    <div className="flex items-start justify-between gap-2"><span className="text-[12px] text-slate-700"><b className="text-teal-800">{f.id}</b> {f.text}</span><Badge tone={f.status === "synthetic_demo" ? "amber" : f.status === "inferred_candidate" ? "violet" : "green"} data-testid="graph-fact-status">{f.status_label}</Badge></div>
                    {f.doc_title && <p className="mt-0.5 text-[11px] text-slate-500">출처: {f.doc_title} {f.locator ?? ""}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {t?.core && t.core.qa.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowQa((s) => !s)} className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-teal-700 hover:underline" data-testid="toggle-qa">
              <MessageCircleQuestion className="h-3.5 w-3.5" /> 관련 Q&amp;A {t.core.qa.length}건 {showQa ? "접기" : "보기"}
            </button>
            {showQa && (
              <div className="mt-1 space-y-1.5" data-testid="lounge-qa">
                {t.core.qa.map((q) => (
                  <div key={q.id} className="rounded-lg border border-slate-200 p-2">
                    <div className="flex items-center justify-between gap-2"><b className="text-[12px] text-navy-900">{q.question}</b><Badge tone={q.is_synthetic ? "amber" : "green"} data-testid="qa-tier">{q.is_synthetic ? "가상" : q.tier === "official_doc" ? "공식" : "실제 선배"} {q.id}</Badge></div>
                    <p className="mt-0.5 text-[12px] text-slate-600">{q.answer}</p>
                    <p className="text-[11px] text-slate-400">{q.tier_label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {t?.notices?.map((n) => <p key={n} className="mt-2 flex gap-1 text-[11px] text-amber-800" data-testid="turn-notice"><AlertTriangle className="h-3 w-3 shrink-0" />{n}</p>)}
        {t?.outro && <p className="mt-2 text-slate-700">{t.outro}</p>}
      </div>
      {t && t.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="lounge-actions">
          {t.actions.map((a) => {
            const I = ACTION_ICON[a.id];
            return (
              <button key={a.id} onClick={() => onAction(a, t)} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-navy-100 bg-navy-50 px-2.5 py-1 text-[12px] font-medium text-navy-800 hover:border-teal-500 hover:text-teal-700" data-testid={`action-${a.id}`}>
                <I className="h-3.5 w-3.5" /> {a.label}
              </button>
            );
          })}
        </div>
      )}
      {t && t.followups.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="lounge-followups">
          {t.followups.map((f) => (
            <button key={f.label} onClick={() => onFollow(f.question)} className="cursor-pointer rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[12px] text-teal-800 hover:bg-teal-50">{f.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LoungeChat({
  msgs,
  busy,
  error,
  starters,
  seniorName,
  onSend,
  onCancel,
  onAction,
  pendingConsent,
  onConsent,
  headerExtra,
  styleBar,
  avatar,
  emptyState,
  replay,
  initialQuestion,
}: {
  msgs: LoungeMsg[];
  busy: boolean;
  error: string | null;
  starters: { label: string; question: string }[];
  seniorName: string | null;
  onSend: (q: string) => void;
  onCancel?: () => void;
  onAction: (a: LoungeAction, t: LoungeTurn) => void;
  pendingConsent: { fields: string[]; go: (add: boolean) => void } | null;
  onConsent: () => void;
  headerExtra?: React.ReactNode;
  /** 상담 스타일 선택 영역 */
  styleBar?: React.ReactNode;
  /** 대화 중인 선배 얼굴 (캐릭터와 패널 연결) */
  avatar?: React.ReactNode;
  /** 선배를 고르기 전에 보여 줄 안내 */
  emptyState?: React.ReactNode;
  /** 스타일을 바꾼 뒤 같은 질문을 다시 듣기 */
  replay?: { label: string; onClick: () => void } | null;
  /** 관계 그래프 등에서 넘어온 질문 (입력창에 미리 채우기만 하고 자동 전송하지 않는다) */
  initialQuestion?: string | null;
}) {
  const [q, setQ] = React.useState(initialQuestion ?? "");
  const endRef = React.useRef<HTMLDivElement>(null);
  const logRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // 긴 답변이 도착하면 끝이 아니라 답변의 시작(선배의 조언)이 보이게 한다
    const last = msgs[msgs.length - 1];
    if (last?.role === "senior" && last.turn?.core && !busy && !pendingConsent) {
      const bubbles = logRef.current?.querySelectorAll('[data-testid="senior-msg"]');
      bubbles?.[bubbles.length - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy, pendingConsent]);
  const send = (text: string) => {
    if (!text.trim() || busy || !seniorName) return;
    onSend(text.trim());
    setQ("");
  };
  const started = msgs.some((m) => m.role === "user");
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="lounge-chat">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        {avatar && <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f3e7d3] ring-2 ring-teal-200" data-testid="chat-avatar">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy-900">{seniorName ? `AI 선배 ${seniorName}와 대화 중` : "선배를 선택해 주세요"}</p>
          <p className="text-[11px] text-slate-500">AI 상담 도우미 · 실제 사람이 아닙니다 · 대화는 이 탭에만 임시 저장</p>
        </div>
        {headerExtra}
      </div>
      {styleBar}
      <div ref={logRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-3" data-testid="lounge-log" aria-live="polite">
        {!seniorName && (emptyState ?? <p className="py-8 text-center text-sm text-slate-500">캠퍼스에서 선배 캐릭터를 눌러 다가가면 대화가 시작돼요.<br />키보드: 방향키로 이동, Enter로 말 걸기</p>)}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-sm bg-navy-800 px-3.5 py-2 text-sm text-white" data-testid="user-msg">{m.text}</div></div>
          ) : m.role === "system" ? (
            <p key={i} className="text-center text-[11px] text-slate-400">— {m.text} —</p>
          ) : (
            <SeniorBubble key={i} m={m} onFollow={send} onAction={onAction} />
          ),
        )}
        {busy && <Waiting name={seniorName} onCancel={onCancel} />}
        {error && <p className="text-sm text-rose-600">오류: {error} (잠시 후 다시 시도해 주세요. 기존 <Link className="underline" href="/chat">AI 상담 화면</Link>도 이용할 수 있어요)</p>}
        {pendingConsent && (
          <div className="rounded-xl bg-white p-3 text-sm ring-1 ring-teal-200" data-testid="consent-box">
            <p>대화에서 찾은 관심 분야 <b>{pendingConsent.fields.map(fieldLabel).join(", ")}</b>를 내 프로필에 추가하고 이동할까요? (프로필은 이 브라우저에만 저장)</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { pendingConsent.go(true); onConsent(); }} data-testid="consent-add">추가하고 이동</Button>
              <Button size="sm" variant="outline" onClick={() => { pendingConsent.go(false); onConsent(); }} data-testid="consent-skip">그냥 이동</Button>
              <Button size="sm" variant="ghost" onClick={onConsent}>취소</Button>
            </div>
          </div>
        )}
        {seniorName && !started && !busy && (
          <div className="space-y-1.5" data-testid="lounge-starters">
            <p className="flex items-center gap-1 text-[11px] text-slate-500"><Sparkles className="h-3 w-3" /> 이렇게 시작해 보세요 (개인정보 입력 없이도 괜찮아요)</p>
            <div className="flex flex-col gap-1.5">
              {starters.map((s) => <button key={s.label} onClick={() => send(s.question)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-teal-400 hover:bg-teal-50/50" data-testid="lounge-starter">{s.label}</button>)}
            </div>
          </div>
        )}
        {replay && !busy && (
          <button type="button" onClick={replay.onClick} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-50" data-testid="style-replay"><RotateCcw className="h-3.5 w-3.5" /> {replay.label}</button>
        )}
        <div ref={endRef} />
      </div>
      <form className="flex items-end gap-2 border-t border-slate-200 bg-white p-2.5" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <Textarea
          rows={2}
          value={q}
          maxLength={1000}
          disabled={!seniorName}
          placeholder={seniorName ? "고민을 편하게 적어 보세요 (Enter 전송)" : "먼저 선배를 선택해 주세요"}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(q); } }}
          data-testid="lounge-input"
          aria-label="선배에게 보낼 메시지"
        />
        <Button type="submit" disabled={busy || !q.trim() || !seniorName} aria-label="보내기" data-testid="lounge-send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
