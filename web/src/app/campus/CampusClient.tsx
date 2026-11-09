"use client";
/**
 * HUFS 선배마을 — Campus Lounge (Mode B).
 * 기존 Career Dashboard(Mode A)와 같은 상담 엔진·데이터를 쓰는 새로운 진입 인터페이스.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Coffee, Compass, DoorOpen, LayoutDashboard, Library, LogOut, MessagesSquare, Palette, Trees, Volume2, VolumeX, Wind, Info } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { SyntheticNotice } from "@/components/Notice";
import { Avatar } from "@/components/lounge/Avatar";
import { SceneBackground } from "@/components/lounge/Scenes";
import { Customizer } from "@/components/lounge/Customizer";
import { LoungeChat, type LoungeMsg } from "@/components/lounge/LoungeChat";
import { NamingSurvey } from "@/components/lounge/NamingSurvey";
import { postJSON, useAppState } from "@/lib/client/store";
import { DEFAULT_SENIORS, DEFAULT_STUDENT, LOUNGE_KEYS, sanitizeLook, sanitizeSeniors, type AvatarState, type SeniorConfig } from "@/lib/lounge/avatar";
import { AmbientEngine } from "@/lib/lounge/audio";
import { AI_DISCLOSURE, getPersona, greeting } from "@/lib/lounge/personas";
import { clampToWalk, depthScale, getPlace, PLACES, type PlaceDef, type PlaceId, type SceneObject } from "@/lib/lounge/places";
import type { LoungeAction, LoungeTurn } from "@/lib/lounge/turn.server";
import { cn } from "@/lib/utils";
import { useStatus } from "@/components/AppShell";

const PLACE_ICON: Record<PlaceId, typeof Trees> = { plaza: Trees, library: Library, cafe: Coffee };

export function CampusClient({ placeId, senior }: { placeId: string | null; senior: string | null }) {
  const place = getPlace(placeId);
  return place ? <Lounge key="lounge" place={place} initialSlot={senior} /> : <Entry />;
}

/* ---------------- 진입 화면 ---------------- */

function Entry() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy-900"><Compass className="h-5 w-5 text-teal-600" /> AI 과선배 <span className="text-sm font-medium text-slate-400">× HUFS 선배마을</span></Link>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}><LayoutDashboard className="h-4 w-4" /> Career Dashboard</Button>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="py-8 text-center">
          <Badge tone="teal">Campus Lounge · 프로토타입</Badge>
          <h1 className="mt-3 text-3xl font-bold text-navy-900 md:text-4xl">캠퍼스에서 만나는 나만의 AI 선배</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">편한 장소를 골라 들어가서, 마음에 드는 AI 선배에게 고민을 가볍게 꺼내 보세요. 답변은 기존 AI 과선배와 <b>같은 선배 기록·같은 검색 엔진</b>을 근거로 합니다.</p>
        </section>
        <div className="grid gap-4 md:grid-cols-3" data-testid="place-cards">
          {PLACES.map((p) => {
            const I = PLACE_ICON[p.id];
            return (
              <button key={p.id} onClick={() => router.push(`/campus?place=${p.id}`)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-testid={`place-${p.id}`}>
                <svg viewBox="0 0 1000 600" className="aspect-[5/3] w-full" aria-hidden><SceneBackground place={p.id} lampOn /></svg>
                <div className="p-4">
                  <p className="flex items-center gap-2 font-bold text-navy-900"><I className="h-4 w-4 text-teal-600" /> {p.name} <span className="text-xs font-normal text-slate-400">{p.en}</span></p>
                  <p className="mt-1 text-sm text-slate-600">{p.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{p.focus.map((f) => <Badge key={f} tone="navy">{f}</Badge>)}</div>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700">입장하기 <DoorOpen className="h-4 w-4" /></p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-5 text-sm text-slate-600">
            <p className="mb-2 font-semibold text-navy-900">이용 안내</p>
            <ul className="space-y-1">
              <li>· {AI_DISCLOSURE}</li>
              <li>· 선배의 성격·외형은 말투만 바꿉니다. 근거 자료와 사실 답변은 모든 선배가 같습니다.</li>
              <li>· 소리는 기본으로 꺼져 있어요. 원할 때 하단에서 켜 주세요.</li>
              <li>· 대화는 이 탭에만 임시 저장되고 서버에 저장하지 않습니다.</li>
              <li>· 분석 화면이 더 편하다면 언제든 <Link href="/dashboard" className="text-teal-700 underline">Career Dashboard</Link>를 이용하세요.</li>
            </ul>
          </Card>
          <Card className="p-5">
            <p className="mb-2 font-semibold text-navy-900">서비스 이름, 어떤 게 좋을까요? <span className="text-xs font-normal text-slate-400">(선택 · 간이 조사)</span></p>
            <NamingSurvey />
          </Card>
        </div>
        <SyntheticNotice className="mt-6" />
      </main>
    </div>
  );
}

/* ---------------- 라운지 ---------------- */

interface Prefs { volume: number; reduceMotion: boolean }

function useLocal<T>(key: string, init: T, sanitize: (x: unknown) => T): [T, (v: T) => void, boolean] {
  const [v, setV] = React.useState(init);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setV(sanitize(JSON.parse(raw))); } catch { /* ignore */ }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [v, (x: T) => { setV(x); localStorage.setItem(key, JSON.stringify(x)); }, ready];
}

function Lounge({ place, initialSlot }: { place: PlaceDef; initialSlot: string | null }) {
  const router = useRouter();
  const status = useStatus();
  const { profile, setProfile, priorities } = useAppState();
  const [seniors, setSeniors] = useLocal<SeniorConfig[]>(LOUNGE_KEYS.seniors, DEFAULT_SENIORS, sanitizeSeniors);
  const [studentLook] = useLocal(LOUNGE_KEYS.student, DEFAULT_STUDENT, (x) => sanitizeLook(x, DEFAULT_STUDENT));
  const [prefs, setPrefs] = useLocal<Prefs>(LOUNGE_KEYS.prefs, { volume: 0.5, reduceMotion: false }, (x) => {
    const o = (x ?? {}) as Partial<Prefs>;
    return { volume: typeof o.volume === "number" ? Math.max(0, Math.min(1, o.volume)) : 0.5, reduceMotion: !!o.reduceMotion };
  });

  const [pos, setPos] = React.useState(place.studentStart);
  const [walkMs, setWalkMs] = React.useState(0);
  const [facing, setFacing] = React.useState<1 | -1>(1);
  const [slot, setSlot] = React.useState<number | null>(null);
  const [seniorState, setSeniorState] = React.useState<AvatarState>("idle");
  const [msgs, setMsgs] = React.useState<LoungeMsg[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [clarified, setClarified] = React.useState(false);
  const [popup, setPopup] = React.useState<SceneObject | null>(null);
  const [lampOn, setLampOn] = React.useState(false);
  const [customize, setCustomize] = React.useState<number | null>(null);
  const [mobileView, setMobileView] = React.useState<"scene" | "chat">("scene");
  const [consent, setConsent] = React.useState<{ fields: string[]; go: (add: boolean) => void } | null>(null);
  const [ending, setEnding] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const engine = React.useRef<AmbientEngine | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const greeted = React.useRef<Set<number>>(new Set());
  const restored = React.useRef(false);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  React.useEffect(() => () => { timers.current.forEach(clearTimeout); engine.current?.disable(); }, []);

  // 대화 복원 (sessionStorage — 탭 종료 시 사라짐)
  React.useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(LOUNGE_KEYS.chat) ?? "null");
      if (s?.msgs) { setMsgs(s.msgs); setClarified(!!s.clarified); if (typeof s.slot === "number") { setSlot(s.slot); greeted.current.add(s.slot); } }
    } catch { /* ignore */ }
    restored.current = true;
    sessionStorage.removeItem(LOUNGE_KEYS.ret);
  }, []);
  React.useEffect(() => {
    if (!restored.current) return;
    sessionStorage.setItem(LOUNGE_KEYS.chat, JSON.stringify({ msgs: msgs.slice(-30), clarified, slot }));
  }, [msgs, clarified, slot]);

  // 장소 변경: 위치 초기화 + 시스템 메시지 + 소리 전환
  const prevPlace = React.useRef(place.id);
  React.useEffect(() => {
    setPos(place.studentStart);
    setWalkMs(0);
    setPopup(null);
    if (prevPlace.current !== place.id) setMsgs((m) => (m.length ? [...m, { role: "system", text: `${place.name}(으)로 이동했어요` }] : m));
    prevPlace.current = place.id;
    if (engine.current?.enabled) engine.current.switchTo(place.id);
  }, [place]);

  React.useEffect(() => { engine.current?.setVolume(prefs.volume); }, [prefs.volume]);
  React.useEffect(() => { engine.current?.setMuted(muted); }, [muted]);

  const senior = slot !== null ? seniors[slot] : null;
  const persona = senior ? getPersona(senior.persona) : null;

  const walkTo = (x: number, y: number, then?: () => void) => {
    const t = clampToWalk(x, y);
    const d = Math.hypot(t.x - pos.x, t.y - pos.y);
    const ms = prefs.reduceMotion ? 0 : Math.min(2200, Math.max(250, d * 3.2));
    if (Math.abs(t.x - pos.x) > 4) setFacing(t.x >= pos.x ? 1 : -1);
    setWalkMs(ms);
    setPos(t);
    if (then) later(then, ms + 30);
  };

  const startTalk = (i: number) => {
    setSlot(i);
    setMobileView("chat");
    const c = seniors[i];
    if (!greeted.current.has(i)) {
      greeted.current.add(i);
      const p = getPersona(c.persona);
      setMsgs((m) => [...m, { role: "senior", slot: i, name: p.name, text: greeting(c.persona, c.greeting, place.id) }]);
      engine.current?.sfx("pop");
    }
    setSeniorState("greeting");
    later(() => setSeniorState("idle"), 2000);
  };

  const approach = (i: number) => {
    const s = place.seniorSpots[i];
    const side = pos.x < s.x ? -1 : 1;
    walkTo(s.x + side * 78, s.y + 6, () => { setFacing(side === -1 ? 1 : -1); startTalk(i); });
  };

  // 첫 진입 시 ?senior= 로 바로 선택
  React.useEffect(() => {
    const n = Number(initialSlot);
    if (initialSlot !== null && [0, 1, 2].includes(n) && !greeted.current.has(n)) approach(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearest = React.useMemo(() => {
    let best: { i: number; d: number } | null = null;
    place.seniorSpots.forEach((s, i) => { const d = Math.hypot(s.x - pos.x, s.y - pos.y); if (!best || d < best.d) best = { i, d }; });
    return best as { i: number; d: number } | null;
  }, [pos, place]);
  const near = nearest && nearest.d < 120 ? nearest.i : null;

  const toScene = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : null;
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = 40;
    const k = e.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].includes(k)) {
      e.preventDefault();
      const dx = k === "ArrowLeft" || k === "a" ? -step : k === "ArrowRight" || k === "d" ? step : 0;
      const dy = k === "ArrowUp" || k === "w" ? -step : k === "ArrowDown" || k === "s" ? step : 0;
      walkTo(pos.x + dx, pos.y + dy);
    } else if (k === "Enter" && near !== null) {
      e.preventDefault();
      startTalk(near);
    }
  };

  const objectClick = (o: SceneObject) => {
    setPopup(o);
    const a = o.action;
    if (a.kind === "sfx") engine.current?.sfx(a.sfx);
    if (a.kind === "toggle_lamp") { setLampOn((v) => !v); engine.current?.sfx("pop"); }
  };

  const send = async (question: string) => {
    if (slot === null || !senior || busy) return;
    setErr(null);
    const history = msgs
      .filter((m) => m.role !== "system")
      .slice(-6)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: (m.turn?.core?.answer ?? m.text).slice(0, 1200) }));
    setMsgs((x) => [...x, { role: "user", text: question }]);
    setBusy(true);
    setSeniorState("thinking");
    try {
      const t = await postJSON<LoungeTurn>("/api/lounge/chat", { question, profile, history, place: place.id, persona: senior.persona, greeting: senior.greeting, clarified, priorities: priorities.weights });
      if (t.stage === "clarify") setClarified(true);
      setMsgs((x) => [...x, { role: "senior", slot, name: getPersona(senior.persona).name, text: t.intro, turn: t }]);
      const talk = Math.min(5000, 1200 + t.intro.length * 35);
      setSeniorState("speaking");
      later(() => setSeniorState(t.stage === "career" || t.stage === "closing" ? "encouraging" : "idle"), talk);
      later(() => setSeniorState("idle"), talk + 1500);
    } catch (e) {
      setErr((e as Error).message);
      setSeniorState("idle");
    } finally {
      setBusy(false);
    }
  };

  const leaveTo = (href: string) => {
    sessionStorage.setItem(LOUNGE_KEYS.ret, JSON.stringify({ place: place.id, slot }));
    router.push(href);
  };

  const onAction = (a: LoungeAction, t: LoungeTurn) => {
    const newFields = t.context.fields.filter((f) => !profile.interest_fields.includes(f));
    if ((a.id === "compare" || a.id === "roadmap" || a.id === "gap") && newFields.length) {
      setConsent({ fields: newFields, go: (add) => { if (add) setProfile({ ...profile, interest_fields: [...profile.interest_fields, ...newFields] }); leaveTo(a.href); } });
      return;
    }
    leaveTo(a.href);
  };

  const toggleSound = async () => {
    if (soundOn) { engine.current?.disable(); setSoundOn(false); return; }
    engine.current ??= new AmbientEngine();
    engine.current.setVolume(prefs.volume);
    engine.current.setMuted(muted);
    await engine.current.enable(place.id);
    setSoundOn(true);
  };

  const careerIntel = !!status?.features?.career_intel;
  const llmOn = status?.llm.is_llm && status.llm.reachable !== false;

  // 장면 요소 (y 기준 정렬로 원근)
  const actors = [
    ...place.seniorSpots.map((s, i) => ({ kind: "senior" as const, i, x: s.x, y: s.y })),
    { kind: "student" as const, i: -1, x: pos.x, y: pos.y },
  ].sort((a, b) => a.y - b.y);

  return (
    <div className={cn("flex h-dvh flex-col bg-slate-100", prefs.reduceMotion && "lg-reduce")}>
      {/* 상단: 장소 선택·탐색 */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <Link href="/campus" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="장소 선택으로"><ArrowLeft className="h-4 w-4" /></Link>
          <p className="font-bold text-navy-900">HUFS 선배마을 <span className="hidden text-xs font-normal text-slate-400 sm:inline">· AI 과선배 Campus Lounge</span></p>
        </div>
        <nav className="flex gap-1" aria-label="장소 이동" data-testid="place-tabs">
          {PLACES.map((p) => {
            const I = PLACE_ICON[p.id];
            return (
              <button key={p.id} onClick={() => router.replace(`/campus?place=${p.id}`)} aria-current={p.id === place.id ? "page" : undefined} className={cn("inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", p.id === place.id ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")} data-testid={`tab-${p.id}`}>
                <I className="h-3.5 w-3.5" /> {p.name}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <Badge tone="amber">가상 시연 데이터</Badge>
          <Badge tone={llmOn ? "violet" : "slate"} data-testid="engine-badge">{status ? (llmOn ? "생성형 AI 활성" : "CPU Demo · LLM 미사용") : "확인 중"}</Badge>
        </div>
      </header>

      {/* 모바일 전환 */}
      <div className="flex gap-1 border-b border-slate-200 bg-white p-1 lg:hidden" role="tablist">
        {(["scene", "chat"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={mobileView === v} onClick={() => setMobileView(v)} className={cn("flex-1 cursor-pointer rounded-md py-1.5 text-sm font-medium", mobileView === v ? "bg-navy-800 text-white" : "text-slate-600")} data-testid={`mobile-${v}`}>
            {v === "scene" ? "캠퍼스" : `대화${msgs.filter((m) => m.role === "senior").length ? ` (${msgs.filter((m) => m.role === "senior").length})` : ""}`}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 중앙: 캠퍼스 공간 */}
        <section className={cn("relative min-w-0 flex-1 flex-col", mobileView === "scene" ? "flex" : "hidden lg:flex")}>
          <div className="relative flex min-h-0 flex-1 items-start justify-center p-2 pt-14 lg:items-center lg:pt-2">
            <svg
              key={place.id}
              ref={svgRef}
              viewBox="0 0 1000 600"
              className="lg-scene-enter max-h-full w-full rounded-2xl bg-white shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40"
              role="application"
              aria-label={`${place.name}. 방향키로 이동, 선배 근처에서 Enter로 말 걸기`}
              tabIndex={0}
              onKeyDown={onKey}
              data-testid="campus-scene"
            >
              <SceneBackground place={place.id} lampOn={lampOn} />
              {/* 바닥 클릭 → 이동 */}
              <rect x={0} y={370} width={1000} height={230} fill="transparent" onClick={(e) => { const p = toScene(e); if (p) walkTo(p.x, p.y); }} data-testid="floor" style={{ cursor: "pointer" }} />
              {/* 객체 핫스팟 */}
              {place.objects
                .filter((o) => !(o.action.kind === "link" && o.action.feature === "career_intel" && !careerIntel))
                .map((o) => (
                  <g key={o.id} className="lg-hotspot" transform={`translate(${o.x},${o.y})`} onClick={() => objectClick(o)} role="button" aria-label={o.label} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); objectClick(o); } }} data-testid={`obj-${o.id}`}>
                    <circle r={34} fill="transparent" />
                    <g className="lg-hint"><circle r={11} fill="#14a3a3" stroke="#fff" strokeWidth={2.5} /><text y={4.5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">!</text></g>
                  </g>
                ))}
              {actors.map((a) => {
                if (a.kind === "student")
                  return (
                    <g key="student" className="lg-walker" style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transitionDuration: `${walkMs}ms` }} onTransitionEnd={() => setWalkMs(0)} data-testid="student-avatar" pointerEvents="none">
                      <Avatar look={studentLook} state={walkMs > 0 ? "walking" : "idle"} facing={facing} size={depthScale(pos.y) * 0.95} label="나" />
                    </g>
                  );
                const c = seniors[a.i];
                const p = getPersona(c.persona);
                const active = slot === a.i;
                return (
                  <g key={`s${a.i}`} transform={`translate(${a.x},${a.y})`} className="cursor-pointer" onClick={() => approach(a.i)} role="button" tabIndex={0} aria-label={`AI 선배 ${p.name} (${p.title})에게 다가가기`} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); approach(a.i); } }} data-testid={`senior-${a.i}`}>
                    <rect x={-50} y={-190} width={100} height={200} fill="transparent" />
                    <Avatar look={c.look} state={active ? seniorState : "idle"} size={depthScale(a.y)} label={p.name} badge="AI" highlight={active || near === a.i} facing={pos.x < a.x ? -1 : 1} />
                    {near === a.i && !active && (
                      <g transform="translate(0,-218)"><rect x={-58} y={-14} width={116} height={24} rx={12} fill="#14a3a3" /><text y={3} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">클릭·Enter: 말 걸기</text></g>
                    )}
                  </g>
                );
              })}
            </svg>
            {/* 안내·객체 말풍선 */}
            <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-center">
              {popup ? (
                <div className="pointer-events-auto max-w-md rounded-xl bg-white/95 p-3 text-sm shadow-lg ring-1 ring-slate-200" data-testid="object-popup">
                  <p className="font-semibold text-navy-900">{popup.label}</p>
                  <p className="mt-0.5 text-slate-600">{popup.action.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {popup.action.kind === "link" && <Button size="sm" variant="secondary" onClick={() => leaveTo((popup.action as { href: string }).href)} data-testid="object-link">{(popup.action as { label: string }).label}</Button>}
                    {popup.action.kind === "ask" && (
                      <Button size="sm" variant="secondary" onClick={() => { const q = (popup.action as { question: string }).question; setPopup(null); const target = slot ?? 0; if (slot === null) startTalk(target); setTimeout(() => send(q), slot === null ? 50 : 0); }}>앉아서 이야기하기</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setPopup(null)}>닫기</Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-full bg-white/85 px-3 py-1 text-xs text-slate-600 shadow-sm">{place.arrival}</p>
              )}
            </div>
          </div>
          {/* 하단: 대화 시작·소리·이동 */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
            <Button size="sm" variant="secondary" onClick={() => approach(near ?? slot ?? 0)} data-testid="talk-button"><MessagesSquare className="h-4 w-4" /> {slot === null ? "선배에게 말 걸기" : `${persona?.name} 선배와 대화`}</Button>
            <Button size="sm" variant="outline" onClick={() => setCustomize(slot ?? near ?? 0)} data-testid="customize-button"><Palette className="h-4 w-4" /> 선배 꾸미기</Button>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1" data-testid="sound-controls">
              <button onClick={toggleSound} className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-700" aria-pressed={soundOn} data-testid="sound-toggle"><Wind className="h-3.5 w-3.5" /> {soundOn ? "소리 끄기" : "소리 켜기"}</button>
              {soundOn && (
                <>
                  <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "음소거 해제" : "음소거"} className="cursor-pointer p-0.5">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                  <input type="range" min={0} max={1} step={0.05} value={prefs.volume} onChange={(e) => setPrefs({ ...prefs, volume: Number(e.target.value) })} aria-label="음량" className="w-20 accent-teal-600" />
                </>
              )}
            </div>
            <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" className="accent-teal-600" checked={prefs.reduceMotion} onChange={(e) => setPrefs({ ...prefs, reduceMotion: e.target.checked })} data-testid="reduce-motion" /> 움직임 줄이기</label>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => leaveTo("/dashboard")}><LayoutDashboard className="h-4 w-4" /> 진로 분석으로</Button>
              <Button size="sm" variant="outline" onClick={() => setEnding(true)} data-testid="end-button"><LogOut className="h-4 w-4" /> 상담 종료</Button>
            </div>
          </div>
        </section>

        {/* 우측: 대화 패널 */}
        <aside className={cn("min-h-0 w-full border-l border-slate-200 bg-white lg:flex lg:w-[440px] lg:flex-col", mobileView === "chat" ? "flex flex-col" : "hidden")}>
          <LoungeChat
            msgs={msgs}
            busy={busy}
            error={err}
            starters={place.starters}
            seniorName={persona?.name ?? null}
            onSend={send}
            onAction={onAction}
            pendingConsent={consent}
            onConsent={() => setConsent(null)}
            headerExtra={
              <div className="flex gap-1">
                {seniors.map((c, i) => (
                  <button key={i} onClick={() => approach(i)} className={cn("cursor-pointer rounded-full px-2 py-0.5 text-[11px]", slot === i ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")} title={getPersona(c.persona).title} data-testid={`pick-senior-${i}`}>
                    {getPersona(c.persona).name}
                  </button>
                ))}
              </div>
            }
          />
        </aside>
      </div>

      {customize !== null && (
        <Customizer
          config={seniors[customize]}
          onClose={() => setCustomize(null)}
          onSave={(c) => {
            const i = customize;
            const changed = seniors[i].persona !== c.persona;
            setSeniors(seniors.map((s, k) => (k === i ? c : s)));
            setCustomize(null);
            setSlot(i);
            setMobileView("chat");
            greeted.current.add(i);
            const p = getPersona(c.persona);
            setMsgs((m) => [...m, ...(changed && m.length ? [{ role: "system" as const, text: `선배 성격이 '${p.title}'(으)로 바뀌었어요` }] : []), { role: "senior" as const, slot: i, name: p.name, text: greeting(c.persona, c.greeting, place.id) }]);
            setSeniorState("greeting");
            later(() => setSeniorState("idle"), 2000);
          }}
        />
      )}

      {ending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-3" role="dialog" aria-modal="true" aria-label="상담 종료" data-testid="end-dialog">
          <Card className="w-full max-w-md p-5">
            <p className="font-bold text-navy-900">오늘 상담을 마칠까요?</p>
            <p className="mt-1 text-sm text-slate-600">이야기 나눠 줘서 고마워요. AI 선배는 실제 선배나 학교 상담을 대신하지 않아요. 더 깊은 고민은 학교 진로·상담 창구나 실제 선배와도 나눠 보세요.</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              <li className="flex gap-1"><Info className="h-3.5 w-3.5 shrink-0" /> 대화는 서버에 저장되지 않았고, 이 탭을 닫으면 사라집니다.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => { sessionStorage.removeItem(LOUNGE_KEYS.chat); sessionStorage.removeItem(LOUNGE_KEYS.ret); router.push("/roadmap"); }} data-testid="end-roadmap">로드맵 보러 가기</Button>
              <Button variant="outline" onClick={() => { sessionStorage.removeItem(LOUNGE_KEYS.chat); sessionStorage.removeItem(LOUNGE_KEYS.ret); router.push("/dashboard"); }} data-testid="end-dashboard">대화 지우고 대시보드로</Button>
              <Button variant="ghost" onClick={() => { sessionStorage.removeItem(LOUNGE_KEYS.chat); setMsgs([]); setSlot(null); greeted.current.clear(); setEnding(false); }} data-testid="end-clear">대화만 지우기</Button>
              <Button variant="ghost" onClick={() => setEnding(false)}>계속하기</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
