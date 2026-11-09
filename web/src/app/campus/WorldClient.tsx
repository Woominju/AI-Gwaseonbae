"use client";
/**
 * AI 과선배 3.0 — 캠퍼스 월드 (선배 광장 · 서울캠퍼스 · 글로벌캠퍼스).
 * 기존 Campus Lounge 의 상담·이동·객체·대시보드 연결을 유지하고, 학생 아바타(옷장)와 새 일러스트를 사용한다.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Bot, Info, LayoutDashboard, LogOut, MapPinned, MessagesSquare, MoreHorizontal, Palette, Shirt, Volume2, VolumeX, Wind, X } from "lucide-react";
import { StylePicker } from "@/components/lounge/StylePicker";
import { defaultStyleFor, sanitizeStyleSetting, styleLabel, STYLE_STORAGE_KEY, type StyleSetting } from "@/lib/counsel/styles";
import { Avatar3, AvatarPreview3, type Avatar3State } from "@/components/world/Avatar3";
import { SceneArt, SceneThumb } from "@/components/world/art/SceneArt";
import { LoungeChat, type LoungeMsg } from "@/components/lounge/LoungeChat";
import { useStatusState } from "@/components/AppShell";
import { postJSON, useAppState } from "@/lib/client/store";
import { LOUNGE_KEYS, sanitizeSeniors, DEFAULT_SENIORS, type SeniorConfig } from "@/lib/lounge/avatar";
import { AmbientEngine } from "@/lib/lounge/audio";
import { AI_DISCLOSURE, GREETING_STYLES, PERSONAS, getPersona, greeting } from "@/lib/lounge/personas";
import type { LoungeAction, LoungeTurn } from "@/lib/lounge/turn.server";
import { DEFAULT_SENIOR_LOOKS, DEFAULT_STUDENT_LOOK, SENIOR_LOOKS_KEY, WARDROBE_KEY, itemsOf, sanitizeLook3, CLOTH_COLORS, type AvatarLook3 } from "@/lib/world/wardrobe";
import { cameraX, clampWalk, depth, getScene, SCENES, worldOf, WORLDS, type SceneDef, type SceneObjectDef, type WorldId } from "@/lib/world/world";
import { cn } from "@/lib/utils";

const PANEL = "rounded-[20px] border border-[#ead9bf] bg-[#fffaf2] shadow-[0_8px_28px_rgba(120,90,50,0.12)]";

function useStored<T>(key: string, init: T, clean: (x: unknown) => T): [T, (v: T) => void, boolean] {
  const [v, setV] = React.useState(init);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setV(clean(JSON.parse(raw))); } catch { /* ignore */ }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [v, (x: T) => { setV(x); localStorage.setItem(key, JSON.stringify(x)); }, ready];
}

export function WorldClient({ sceneId, senior, ask }: { sceneId: string | null; senior: string | null; ask?: string | null }) {
  const scene = getScene(sceneId);
  return scene ? <World key="world" scene={scene} initialSlot={senior} ask={ask ?? null} /> : <WorldSelect />;
}

/* ---------------- 월드 선택 ---------------- */

function WorldSelect() {
  const router = useRouter();
  const [look, , ready] = useStored<AvatarLook3 | null>(WARDROBE_KEY, null, (x) => sanitizeLook3(x, DEFAULT_STUDENT_LOOK));
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_20%_0%,#fff1d6,transparent_45%),linear-gradient(180deg,#dcefff,#fdf6ec)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy-900"><MapPinned className="h-5 w-5 text-teal-600" /> AI 과선배 <span className="text-sm font-medium text-slate-500">× HUFS 캠퍼스</span></Link>
        <div className="flex gap-2 text-sm">
          <Link href="/wardrobe" className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-slate-700"><Shirt className="h-4 w-4" /> 나의 옷장</Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-slate-700"><LayoutDashboard className="h-4 w-4" /> 진로 대시보드</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-14">
        <div className="mb-6 flex flex-col items-center gap-4 md:flex-row">
          <div className={cn(PANEL, "grid h-44 w-36 place-items-center")}>{ready && <AvatarPreview3 look={look ?? DEFAULT_STUDENT_LOOK} state="greeting" className="h-40 w-32" title="내 캐릭터" />}</div>
          <div>
            <h1 className="text-3xl font-bold text-navy-900">어디로 가 볼까요?</h1>
            <p className="mt-1 text-slate-600">선배 광장에서 모두를 만나고, 두 캠퍼스를 오가며 AI 선배와 진로 이야기를 나눠 보세요.</p>
            {ready && !look && <Link href="/wardrobe?step=create" className="mt-2 inline-block rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white" data-testid="make-avatar">먼저 내 캐릭터 만들기</Link>}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3" data-testid="world-cards">
          {WORLDS.map((w) => (
            <button key={w.id} onClick={() => router.push(`/campus?scene=${w.entry}`)} className={cn(PANEL, "group cursor-pointer overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-xl")} data-testid={`world-${w.id}`}>
              <div className="aspect-[16/9] w-full overflow-hidden"><SceneThumb scene={w.entry} /></div>
              <div className="p-4">
                <p className="font-bold text-navy-900">{w.name} <span className="text-xs font-normal text-slate-400">{w.en}</span></p>
                <p className="mt-1 text-sm text-slate-600">{w.tagline}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-6 rounded-2xl bg-white/70 p-4 text-sm text-slate-600"><Info className="mr-1 inline h-4 w-4 text-teal-600" />{AI_DISCLOSURE} 캠퍼스 일러스트는 학교 분위기를 참고한 독창적 그림이에요.</p>
      </main>
    </div>
  );
}

/* ---------------- 월드 ---------------- */

interface Prefs { volume: number; reduceMotion: boolean }

function World({ scene, initialSlot, ask }: { scene: SceneDef; initialSlot: string | null; ask: string | null }) {
  const router = useRouter();
  const { status, failed: statusFailed } = useStatusState();
  const { profile, setProfile, priorities } = useAppState();
  const [seniors, setSeniors] = useStored<SeniorConfig[]>(LOUNGE_KEYS.seniors, DEFAULT_SENIORS, sanitizeSeniors);
  const [seniorLooks, setSeniorLooks] = useStored<AvatarLook3[]>(SENIOR_LOOKS_KEY, [...DEFAULT_SENIOR_LOOKS], (x) => (Array.isArray(x) ? DEFAULT_SENIOR_LOOKS.map((d, i) => sanitizeLook3(x[i], d)) : [...DEFAULT_SENIOR_LOOKS]));
  const [studentLook, , lookReady] = useStored<AvatarLook3 | null>(WARDROBE_KEY, null, (x) => sanitizeLook3(x, DEFAULT_STUDENT_LOOK));
  const [prefs, setPrefs] = useStored<Prefs>(LOUNGE_KEYS.prefs, { volume: 0.5, reduceMotion: false }, (x) => {
    const o = (x ?? {}) as Partial<Prefs>;
    return { volume: typeof o.volume === "number" ? Math.max(0, Math.min(1, o.volume)) : 0.5, reduceMotion: !!o.reduceMotion };
  });

  // 상담 스타일: 저장값이 없으면 캐릭터 성격의 기본값 (3.0 사용자 설정 유지)
  const [savedStyle, setSavedStyle] = useStored<StyleSetting | null>(STYLE_STORAGE_KEY, null, sanitizeStyleSetting);
  const [more, setMore] = React.useState(false);
  const [lowEnd, setLowEnd] = React.useState(false);
  React.useEffect(() => {
    const n = navigator as Navigator & { deviceMemory?: number };
    setLowEnd(matchMedia("(prefers-reduced-motion: reduce)").matches || (n.hardwareConcurrency ?? 8) <= 2 || (n.deviceMemory ?? 8) <= 2);
  }, []);

  const [pos, setPos] = React.useState(scene.studentStart);
  const [walkMs, setWalkMs] = React.useState(0);
  const [facing, setFacing] = React.useState<1 | -1>(1);
  const [slot, setSlot] = React.useState<number | null>(null);
  const [seniorState, setSeniorState] = React.useState<Avatar3State>("idle");
  const [msgs, setMsgs] = React.useState<LoungeMsg[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [clarified, setClarified] = React.useState(false);
  const [popup, setPopup] = React.useState<SceneObjectDef | null>(null);
  const [lampOn, setLampOn] = React.useState(true);
  const [customize, setCustomize] = React.useState<number | null>(null);
  const [mobileView, setMobileView] = React.useState<"scene" | "chat">("scene");
  const [consent, setConsent] = React.useState<{ fields: string[]; go: (add: boolean) => void } | null>(null);
  const [ending, setEnding] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [fade, setFade] = React.useState(false);
  const [rawVw, setVw] = React.useState(1000);
  const engine = React.useRef<AmbientEngine | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const greeted = React.useRef<Set<number>>(new Set());
  const restored = React.useRef(false);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  React.useEffect(() => () => { timers.current.forEach(clearTimeout); engine.current?.disable(); }, []);

  // 반응형 뷰 너비 (세로 화면에서는 확대해서 보여 주고 카메라가 따라감)
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      // 데스크톱은 장면 폭 1000 이상을 유지해 시작 위치의 선배가 모두 보이게 하고, 더 넓은 화면은 넓은 장면을 더 보여 준다
      if (width && height) setVw(width >= 700 ? Math.round((600 * width) / height) : 480);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 대화 복원 (sessionStorage)
  React.useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(LOUNGE_KEYS.chat) ?? "null");
      if (s?.msgs) { setMsgs(s.msgs); setClarified(!!s.clarified); if (typeof s.slot === "number") { setSlot(s.slot); greeted.current.add(s.slot); } }
    } catch { /* ignore */ }
    restored.current = true;
    sessionStorage.removeItem(LOUNGE_KEYS.ret);
  }, []);
  React.useEffect(() => {
    if (restored.current) sessionStorage.setItem(LOUNGE_KEYS.chat, JSON.stringify({ msgs: msgs.slice(-30), clarified, slot }));
  }, [msgs, clarified, slot]);

  // 장면 전환
  const prev = React.useRef(scene.id);
  React.useEffect(() => {
    setPos(scene.studentStart);
    setWalkMs(0);
    setPopup(null);
    setFacing(1);
    if (prev.current !== scene.id) {
      setMsgs((m) => (m.length ? [...m, { role: "system", text: `${scene.name}(으)로 이동했어요` }] : m));
      if (slot !== null && !scene.seniors.some((s) => s.slot === slot)) setSlot(null);
    }
    prev.current = scene.id;
    setFade(false);
    if (engine.current?.enabled) engine.current.switchTo(scene.theme === "counsel" ? "library" : scene.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  React.useEffect(() => { engine.current?.setVolume(prefs.volume); }, [prefs.volume]);
  React.useEffect(() => { engine.current?.setMuted(muted); }, [muted]);

  const vw = rawVw === 480 ? 480 : Math.max(1000, Math.min(scene.width, rawVw));
  const senior = slot !== null ? seniors[slot] : null;
  const persona = senior ? getPersona(senior.persona) : null;
  const camX = cameraX(scene, pos.x, vw);
  const world = worldOf(scene.id);

  const walkTo = (x: number, y: number, then?: () => void) => {
    const t = clampWalk(scene, x, y);
    const d = Math.hypot(t.x - pos.x, t.y - pos.y);
    const ms = prefs.reduceMotion ? 0 : Math.min(2600, Math.max(260, d * 2.8));
    if (Math.abs(t.x - pos.x) > 4) setFacing(t.x >= pos.x ? 1 : -1);
    setWalkMs(ms);
    setPos(t);
    later(() => setWalkMs(0), ms + 20);
    if (then) later(then, ms + 40);
  };

  const startTalk = (i: number) => {
    setSlot(i);
    setMobileView("chat");
    const c = seniors[i];
    if (!greeted.current.has(i)) {
      greeted.current.add(i);
      setMsgs((m) => [...m, { role: "senior", slot: i, name: getPersona(c.persona).name, text: greeting(c.persona, c.greeting, scene.theme) }]);
      engine.current?.sfx("pop");
    }
    setSeniorState("greeting");
    later(() => setSeniorState("idle"), 2000);
  };

  const approach = (i: number) => {
    const s = scene.seniors.find((x) => x.slot === i);
    if (!s) return startTalk(i);
    const side = pos.x < s.x ? -1 : 1;
    walkTo(s.x + side * 70, s.y + 8, () => { setFacing(side === -1 ? 1 : -1); startTalk(i); });
  };

  React.useEffect(() => {
    const n = Number(initialSlot);
    if (initialSlot !== null && scene.seniors.some((s) => s.slot === n)) approach(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const near = React.useMemo(() => {
    let best: { i: number; d: number } | null = null;
    for (const s of scene.seniors) { const d = Math.hypot(s.x - pos.x, s.y - pos.y); if (!best || d < best.d) best = { i: s.slot, d }; }
    return best && best.d < 130 ? best.i : null;
  }, [pos, scene]);

  const toScene = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x + camX, y: p.y };
  };

  const goScene = (to: string) => {
    setFade(true);
    later(() => router.replace(`/campus?scene=${to}`), prefs.reduceMotion ? 0 : 280);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    const map: Record<string, [number, number]> = { ArrowLeft: [-45, 0], a: [-45, 0], ArrowRight: [45, 0], d: [45, 0], ArrowUp: [0, -35], w: [0, -35], ArrowDown: [0, 35], s: [0, 35] };
    if (map[k]) { e.preventDefault(); walkTo(pos.x + map[k][0], pos.y + map[k][1]); }
    else if (k === "Enter" && near !== null) { e.preventDefault(); startTalk(near); }
  };

  const objectClick = (o: SceneObjectDef) => {
    const a = o.action;
    if (a.kind === "sfx") engine.current?.sfx(a.sfx);
    if (a.kind === "toggle_lamp") { setLampOn((v) => !v); engine.current?.sfx("pop"); }
    walkTo(o.x, Math.max(scene.walk.minY, o.y + 60));
    setPopup(o);
  };

  const lastUserIdx = msgs.map((m) => m.role).lastIndexOf("user");
  const lastQuestion = lastUserIdx >= 0 ? msgs[lastUserIdx].text : null;
  const lastCareerStyle = [...msgs].reverse().find((m) => m.turn?.style)?.turn?.style?.label ?? null;

  const send = async (question: string, opts: { replay?: boolean; slot?: number } = {}) => {
    // 선배를 고르면서 바로 보내는 경우 아직 렌더되지 않은 slot 을 직접 넘겨받는다
    const slot_ = opts.slot ?? slot;
    const senior = slot_ !== null ? seniors[slot_] : null;
    if (slot_ === null || !senior || busy) return;
    setErr(null);
    // 다시 듣기는 원래 질문 시점의 대화 문맥을 쓴다 → 사실 답변 캐시가 적중해 스타일 답변만 새로 만든다
    const base = opts.replay && lastUserIdx >= 0 ? msgs.slice(0, lastUserIdx) : msgs;
    const history = base.filter((m) => m.role !== "system").slice(-6).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: (m.turn?.core?.answer ?? m.text).slice(0, 1200) }));
    if (!opts.replay) setMsgs((x) => [...x, { role: "user", text: question }]);
    setBusy(true);
    setSeniorState("thinking");
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const carry = [...new Set(base.flatMap((m) => m.turn?.context.fields ?? []))].slice(-6);
      const t = await postJSON<LoungeTurn>("/api/lounge/chat", { question, profile, history, carry, place: scene.id, persona: senior.persona, greeting: senior.greeting, clarified, priorities: priorities.weights, style: savedStyle ?? defaultStyleFor(senior.persona) }, { signal: ctl.signal });
      if (t.stage === "clarify") setClarified(true);
      setMsgs((x) => [...x, { role: "senior", slot: slot_, name: getPersona(senior.persona).name, text: t.intro, turn: t }]);
      const talk = Math.min(5000, 1200 + t.intro.length * 30);
      setSeniorState("speaking");
      later(() => setSeniorState(t.stage === "career" ? "encouraging" : "idle"), talk);
      later(() => setSeniorState("idle"), talk + 1500);
    } catch (e) {
      if ((e as Error).name === "AbortError") setMsgs((x) => [...x, { role: "system", text: "답변 기다리기를 멈췄어요. 같은 질문을 다시 보내도 괜찮아요" }]);
      else setErr((e as Error).message);
      setSeniorState("idle");
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const leaveTo = (href: string) => {
    sessionStorage.setItem(LOUNGE_KEYS.ret, JSON.stringify({ place: scene.id, slot }));
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
    await engine.current.enable(scene.theme === "counsel" ? "library" : scene.theme);
    setSoundOn(true);
  };

  const aiActive = !!status?.llm?.is_llm && status.llm.reachable !== false;
  const actors = [...scene.seniors.map((s) => ({ kind: "senior" as const, ...s })), { kind: "student" as const, slot: -1, x: pos.x, y: pos.y }].sort((a, b) => a.y - b.y);
  const look = studentLook ?? DEFAULT_STUDENT_LOOK;

  return (
    <div className={cn("flex h-dvh flex-col bg-[#f4ecdf]", (prefs.reduceMotion || lowEnd) && "w3-reduce lg-reduce")}>
      {/* 상단: 월드·장소 탐색 */}
      <header className="z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#ead9bf] bg-[#fffaf2]/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/campus" className="rounded-full p-1.5 hover:bg-[#f3e7d3]" aria-label="월드 선택으로"><ArrowLeft className="h-4 w-4" /></Link>
          <nav className="flex gap-1" aria-label="월드 이동" data-testid="world-tabs">
            {WORLDS.map((w) => (
              <button key={w.id} onClick={() => w.id !== world.id && goScene(w.entry)} aria-current={w.id === world.id ? "page" : undefined} className={cn("cursor-pointer rounded-full px-3 py-1 text-xs font-semibold", w.id === world.id ? "bg-gradient-to-r from-teal-600 to-navy-700 text-white shadow" : "bg-white text-slate-700 hover:bg-[#f3e7d3]")} data-testid={`tab-world-${w.id as WorldId}`}>
                {w.name}
              </button>
            ))}
          </nav>
        </div>
        {world.scenes.length > 1 && (
          <nav className="flex flex-wrap gap-1" aria-label="장소 이동" data-testid="area-tabs">
            {world.scenes.map((id) => {
              const sd = SCENES.find((x) => x.id === id)!;
              return (
                <button key={id} onClick={() => id !== scene.id && goScene(id)} aria-current={id === scene.id ? "page" : undefined} className={cn("cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px]", id === scene.id ? "border-teal-600 bg-teal-50 font-semibold text-teal-800" : "border-[#ead9bf] bg-white text-slate-600 hover:border-teal-300")} data-testid={`tab-${id}`}>
                  {sd.name.replace(/^(서울|글로벌)(캠퍼스)? ?/, "") || sd.name}
                </button>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800 ring-1 ring-amber-200">가상 시연 데이터</span>
          <span className={cn("rounded-full px-2 py-0.5 font-medium ring-1", aiActive ? "bg-violet-50 text-violet-700 ring-violet-200" : "bg-slate-100 text-slate-600 ring-slate-200")} data-testid="engine-badge">
            {status ? (aiActive ? `생성형 AI 상담${status.ai_demo?.active ? ` · ${Math.ceil(status.ai_demo.remaining_sec / 60)}분 남음` : ""}` : "CPU Demo · 템플릿 상담") : statusFailed ? "상태 확인 실패 · 상담은 가능" : "확인 중"}
          </span>
        </div>
      </header>

      <div className="flex lg:hidden" role="tablist">
        {(["scene", "chat"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={mobileView === v} onClick={() => setMobileView(v)} className={cn("flex-1 py-2 text-sm font-semibold", mobileView === v ? "border-b-2 border-teal-600 text-teal-800" : "text-slate-500")} data-testid={`mobile-${v}`}>
            {v === "scene" ? "캠퍼스" : `대화${msgs.filter((m) => m.role === "senior").length ? ` (${msgs.filter((m) => m.role === "senior").length})` : ""}`}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <section className={cn("relative min-w-0 flex-1 flex-col", mobileView === "scene" ? "flex" : "hidden lg:flex")}>
          <div ref={boxRef} className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#dfeefa] lg:aspect-[5/3] lg:min-h-0 lg:shrink">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${vw} 600`}
              preserveAspectRatio="xMidYMax meet"
              className={cn("h-full w-full outline-none transition-opacity duration-300 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-teal-400/50", fade ? "opacity-0" : "opacity-100")}
              role="application"
              aria-label={`${scene.name}. 방향키로 이동, 선배 근처에서 Enter로 말 걸기`}
              tabIndex={0}
              onKeyDown={onKey}
              data-testid="campus-scene"
            >
              <g className="w3-camera" style={{ transform: `translateX(${-camX}px)`, transition: prefs.reduceMotion ? "none" : `transform ${Math.max(300, walkMs)}ms linear` }}>
                <SceneArt scene={scene.id} lampOn={lampOn} layer="back" />
                <rect x={scene.walk.minX - 40} y={scene.walk.minY - 30} width={scene.walk.maxX - scene.walk.minX + 80} height={600 - scene.walk.minY + 30} fill="transparent" style={{ cursor: "pointer" }} onClick={(e) => { const p = toScene(e); if (p) walkTo(p.x, p.y); }} data-testid="floor" />
                {scene.objects
                  .filter((o) => !(o.action.kind === "link" && o.action.feature && !status?.features?.[o.action.feature]))
                  .map((o) => (
                    <g key={o.id} transform={`translate(${o.x},${o.y})`} className="cursor-pointer" onClick={() => objectClick(o)} role="button" aria-label={o.label} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); objectClick(o); } }} data-testid={`obj-${o.id}`}>
                      <circle r={36} fill="transparent" />
                      <g className="w3-hint">
                        <circle r={13} fill="#ffffff" opacity={0.85} />
                        <circle r={10} fill={o.action.kind === "go" ? "#f0a64b" : "#22a6a0"} />
                        <text y={4} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">{o.action.kind === "go" ? "→" : "!"}</text>
                      </g>
                    </g>
                  ))}
                {actors.map((a) => {
                  if (a.kind === "student")
                    return (
                      <g key="student" style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: `transform ${walkMs}ms linear` }} pointerEvents="none" data-testid="student-avatar">
                        {lookReady && <Avatar3 look={look} state={walkMs > 0 ? "walking" : "idle"} facing={facing} size={depth(scene, pos.y)} label="나" />}
                      </g>
                    );
                  const c = seniors[a.slot];
                  const p = getPersona(c.persona);
                  const active = slot === a.slot;
                  return (
                    <g key={`s${a.slot}`} transform={`translate(${a.x},${a.y})`} className="cursor-pointer" onClick={() => approach(a.slot)} role="button" tabIndex={0} aria-label={`AI 선배 ${p.name} (${p.title})에게 다가가기`} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); approach(a.slot); } }} data-testid={`senior-${a.slot}`}>
                      <rect x={-45} y={-175} width={90} height={185} fill="transparent" />
                      <Avatar3 look={seniorLooks[a.slot]} state={active ? seniorState : "idle"} size={depth(scene, a.y)} label={p.name} badge="AI" highlight={active || near === a.slot} facing={pos.x < a.x ? -1 : 1} />
                      {near === a.slot && !active && (
                        <g transform="translate(0,-205)"><rect x={-62} y={-13} width={124} height={24} rx={12} fill="#22a6a0" /><text y={4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">클릭·Enter: 말 걸기</text></g>
                      )}
                    </g>
                  );
                })}
                <SceneArt scene={scene.id} lampOn={lampOn} layer="front" />
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-center">
              {popup ? (
                <div className={cn(PANEL, "pointer-events-auto max-w-md p-3 text-sm")} data-testid="object-popup">
                  <div className="flex items-start justify-between gap-2"><p className="font-semibold text-navy-900">{popup.label}</p><button onClick={() => setPopup(null)} aria-label="닫기" className="rounded p-0.5 hover:bg-[#f3e7d3]"><X className="h-4 w-4" /></button></div>
                  <p className="mt-0.5 text-slate-600">{popup.action.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {popup.action.kind === "link" && <button className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white" onClick={() => leaveTo((popup.action as { href: string }).href)} data-testid="object-link">{(popup.action as { label: string }).label}</button>}
                    {popup.action.kind === "go" && <button className="rounded-full bg-[#f0a64b] px-3 py-1 text-xs font-semibold text-white" onClick={() => goScene((popup.action as { to: string }).to)} data-testid="object-go">이동하기</button>}
                    {popup.action.kind === "ask" && <button className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white" onClick={() => { const q = (popup.action as { question: string }).question; setPopup(null); const target = slot ?? scene.seniors[0]?.slot ?? 0; if (slot === null) startTalk(target); later(() => send(q, { slot: target }), 60); }}>앉아서 이야기하기</button>}
                  </div>
                </div>
              ) : (
                <p className="rounded-full bg-white/85 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur">{scene.arrival}</p>
              )}
            </div>
            {lookReady && !studentLook && (
              <Link href="/wardrobe?step=create" className="absolute bottom-3 left-3 rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow" data-testid="avatar-cta">내 캐릭터 만들기 →</Link>
            )}
          </div>
          {/* 데스크톱: 장면 아래 남는 공간에 이 장소에서 바로 할 수 있는 질문을 보여 준다 */}
          <div className="hidden min-h-0 flex-1 overflow-y-auto border-t border-[#ead9bf] bg-[#fbf3e6] px-4 py-3 lg:block" data-testid="scene-starters">
            <p className="text-sm font-bold text-navy-900">{scene.name}에서 이렇게 물어볼 수 있어요</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {scene.starters.map((s) => (
                <button key={s.label} type="button" disabled={busy} onClick={() => { const target = slot ?? scene.seniors[0]?.slot ?? 0; if (slot === null) startTalk(target); later(() => send(s.question, { slot: target }), 60); }} className="cursor-pointer rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-teal-400 hover:bg-teal-50 disabled:cursor-default disabled:opacity-60">{s.label}</button>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#ead9bf] bg-[#fffaf2] px-3 py-2">
            <button onClick={() => (near ?? slot ?? scene.seniors[0]?.slot) !== undefined && approach((near ?? slot ?? scene.seniors[0].slot) as number)} className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white shadow" data-testid="talk-button"><MessagesSquare className="h-4 w-4" /> {slot === null ? "선배에게 말 걸기" : `${persona?.name} 선배와 대화`}</button>
            <Link href="/wardrobe" onClick={() => sessionStorage.setItem(LOUNGE_KEYS.ret, JSON.stringify({ place: scene.id, slot }))} className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-sm text-slate-700" data-testid="wardrobe-button"><Shirt className="h-4 w-4" /> 옷장</Link>
            <button onClick={() => setCustomize(slot ?? near ?? scene.seniors[0]?.slot ?? 0)} className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-sm text-slate-700" data-testid="customize-button"><Palette className="h-4 w-4" /> 선배 꾸미기</button>
            <button onClick={() => setMore((m) => !m)} aria-expanded={more} className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-sm text-slate-700 lg:hidden" data-testid="more-toggle"><MoreHorizontal className="h-4 w-4" /> 더보기</button>
            <div className={cn("items-center gap-2 max-lg:w-full max-lg:flex-wrap lg:contents", more ? "flex" : "hidden lg:contents")} data-testid="more-controls">
            <div className="flex items-center gap-1.5 rounded-full border border-[#ead9bf] bg-white px-2.5 py-1" data-testid="sound-controls">
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
              <button onClick={() => leaveTo("/dashboard")} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-slate-700 hover:bg-[#f3e7d3]"><LayoutDashboard className="h-4 w-4" /> 진로 대시보드</button>
              <button onClick={() => setEnding(true)} className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-sm text-slate-700" data-testid="end-button"><LogOut className="h-4 w-4" /> 상담 종료</button>
            </div>
            </div>
          </div>
        </section>

        <aside className={cn("min-h-0 w-full border-l border-[#ead9bf] bg-[#fffaf2] lg:flex lg:w-[440px] lg:flex-col", mobileView === "chat" ? "flex flex-col" : "hidden")}>
          <LoungeChat
            msgs={msgs}
            busy={busy}
            error={err}
            starters={scene.starters}
            seniorName={persona?.name ?? null}
            onSend={send}
            onCancel={() => abortRef.current?.abort()}
            onAction={onAction}
            pendingConsent={consent}
            onConsent={() => setConsent(null)}
            initialQuestion={ask}
            avatar={slot !== null ? <AvatarPreview3 look={seniorLooks[slot]} state={seniorState === "thinking" ? "thinking" : "idle"} className="h-full w-full" title={`AI 선배 ${persona?.name}`} /> : undefined}
            styleBar={senior ? <StylePicker value={savedStyle ?? defaultStyleFor(senior.persona)} disabled={busy} onApply={(s) => { setSavedStyle(s); setMsgs((m) => (m.length ? [...m, { role: "system", text: `상담 스타일이 '${styleLabel(s)}'(으)로 바뀌었어요` }] : m)); }} /> : undefined}
            replay={senior && lastQuestion && lastCareerStyle && lastCareerStyle !== styleLabel(savedStyle ?? defaultStyleFor(senior.persona)) ? { label: `같은 질문을 '${styleLabel(savedStyle ?? defaultStyleFor(senior.persona))}'로 다시 듣기`, onClick: () => send(lastQuestion, { replay: true }) } : null}
            emptyState={
              <div className="space-y-2 py-2" data-testid="senior-empty">
                <p className="text-sm font-semibold text-navy-900">어떤 선배와 이야기해 볼까요?</p>
                {scene.seniors.map(({ slot: i }) => {
                  const p = getPersona(seniors[i].persona);
                  return (
                    <button key={i} type="button" onClick={() => approach(i)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#ead9bf] bg-white p-2 text-left hover:border-teal-400" data-testid={`empty-senior-${i}`}>
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#f3e7d3]"><AvatarPreview3 look={seniorLooks[i]} state="idle" className="h-full w-full" title={p.name} /></span>
                      <span className="min-w-0"><b className="block text-sm text-navy-900">{p.name} <span className="font-normal text-slate-500">{p.title}</span></b><span className="block text-xs text-slate-600">{p.tagline}</span></span>
                    </button>
                  );
                })}
                <p className="text-xs leading-relaxed text-slate-500">선배에게 다가가면 대화가 시작돼요. 전략형·도전형·공감형·분석형·성찰형 중에서 상담 스타일을 고르고, 두 가지를 섞을 수도 있어요. 키보드: 방향키로 이동, Enter로 말 걸기</p>
              </div>
            }
            headerExtra={
              <div className="flex gap-1">
                {scene.seniors.map(({ slot: i }) => (
                  <button key={i} onClick={() => approach(i)} className={cn("cursor-pointer rounded-full px-2 py-0.5 text-[11px]", slot === i ? "bg-teal-600 text-white" : "bg-[#f3e7d3] text-slate-700")} title={getPersona(seniors[i].persona).title} data-testid={`pick-senior-${i}`}>
                    <Bot className="mr-0.5 inline h-3 w-3" />{getPersona(seniors[i].persona).name}
                  </button>
                ))}
              </div>
            }
          />
        </aside>
      </div>

      {customize !== null && (
        <SeniorCustomizer
          config={seniors[customize]}
          look={seniorLooks[customize]}
          onClose={() => setCustomize(null)}
          onSave={(c, l) => {
            const i = customize;
            const changed = seniors[i].persona !== c.persona;
            setSeniors(seniors.map((s, k) => (k === i ? c : s)));
            setSeniorLooks(seniorLooks.map((s, k) => (k === i ? l : s)));
            setCustomize(null);
            if (!scene.seniors.some((s) => s.slot === i)) return;
            setSlot(i);
            setMobileView("chat");
            greeted.current.add(i);
            const p = getPersona(c.persona);
            setMsgs((m) => [...m, ...(changed && m.length ? [{ role: "system" as const, text: `선배 성격이 '${p.title}'(으)로 바뀌었어요` }] : []), { role: "senior" as const, slot: i, name: p.name, text: greeting(c.persona, c.greeting, scene.theme) }]);
            setSeniorState("greeting");
            later(() => setSeniorState("idle"), 2000);
          }}
        />
      )}

      {ending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/40 p-3" role="dialog" aria-modal="true" aria-label="상담 종료" data-testid="end-dialog">
          <div className={cn(PANEL, "w-full max-w-md p-5")}>
            <p className="font-bold text-navy-900">오늘 상담을 마칠까요?</p>
            <p className="mt-1 text-sm text-slate-600">AI 선배는 실제 선배나 학교 상담을 대신하지 않아요. 더 깊은 고민은 학교 진로·상담 창구나 선배 네트워크의 실제 선배와도 나눠 보세요. 대화는 서버에 저장되지 않았어요.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white" onClick={() => { sessionStorage.removeItem(LOUNGE_KEYS.chat); router.push("/roadmap"); }} data-testid="end-roadmap">로드맵 보러 가기</button>
              <button className="rounded-full border border-[#ead9bf] bg-white px-4 py-1.5 text-sm" onClick={() => { sessionStorage.removeItem(LOUNGE_KEYS.chat); setMsgs([]); setSlot(null); greeted.current.clear(); setEnding(false); }} data-testid="end-clear">대화만 지우기</button>
              <button className="rounded-full px-4 py-1.5 text-sm text-slate-600" onClick={() => setEnding(false)}>계속하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- AI 선배 꾸미기 (학생 아바타와 별도 저장) ---------------- */

function SeniorCustomizer({ config, look, onSave, onClose }: { config: SeniorConfig; look: AvatarLook3; onSave: (c: SeniorConfig, l: AvatarLook3) => void; onClose: () => void }) {
  const [c, setC] = React.useState(config);
  const [l, setL] = React.useState(look);
  const p = getPersona(c.persona);
  const Pill = ({ on, onClick, children, testid }: { on: boolean; onClick: () => void; children: React.ReactNode; testid?: string }) => (
    <button type="button" onClick={onClick} aria-pressed={on} data-testid={testid} className={cn("rounded-full border px-3 py-1 text-sm", on ? "border-teal-600 bg-teal-600 text-white" : "border-[#ead9bf] bg-white text-slate-700")}>{children}</button>
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/40 p-3" role="dialog" aria-modal="true" aria-label="AI 선배 꾸미기" data-testid="customizer">
      <div className={cn(PANEL, "max-h-[92vh] w-full max-w-2xl overflow-y-auto")}>
        <div className="flex items-center justify-between rounded-t-[20px] bg-gradient-to-r from-teal-600 to-navy-700 px-5 py-2.5 text-white"><p className="font-semibold">AI 선배 꾸미기</p><button onClick={onClose} aria-label="닫기"><X className="h-5 w-5" /></button></div>
        <div className="grid gap-5 p-5 sm:grid-cols-[170px_1fr]">
          <div className="flex flex-col items-center gap-1">
            <AvatarPreview3 look={l} state="greeting" className="h-48 w-40 rounded-2xl bg-[radial-gradient(circle_at_50%_80%,#dff3ea,#fffaf2)]" title={`${p.name} 미리보기`} />
            <p className="text-sm font-bold text-navy-900">AI 선배 {p.name}</p>
            <p className="text-center text-xs text-slate-500">{p.title}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="mb-1 text-xs font-semibold text-slate-500">성격 (말투·진행 방식만 바뀌고 근거·사실 답변은 같아요)</p><div className="flex flex-wrap gap-1.5">{PERSONAS.map((x) => <Pill key={x.id} on={c.persona === x.id} onClick={() => setC({ ...c, persona: x.id })} testid={`persona-${x.id}`}>{x.title}</Pill>)}</div></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-500">인사 방식</p><div className="flex flex-wrap gap-1.5">{GREETING_STYLES.map((g) => <Pill key={g.id} on={c.greeting === g.id} onClick={() => setC({ ...c, greeting: g.id })}>{g.label}</Pill>)}</div></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-500">헤어</p><div className="flex flex-wrap gap-1.5">{itemsOf("hair").map((h) => <Pill key={h.id} on={l.hair === h.id} onClick={() => setL({ ...l, hair: h.id })}>{h.name}</Pill>)}</div></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-500">상의</p><div className="flex flex-wrap gap-1.5">{itemsOf("top").map((h) => <Pill key={h.id} on={l.top === h.id && !l.set} onClick={() => setL({ ...l, top: h.id, set: null })}>{h.name}</Pill>)}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">{CLOTH_COLORS.slice(0, 10).map((col) => <button key={col} aria-label={`상의 색 ${col}`} onClick={() => setL({ ...l, topColor: col })} className={cn("h-6 w-6 rounded-full border-2", l.topColor === col ? "border-navy-800" : "border-white shadow")} style={{ background: col }} />)}</div>
            </div>
            <div><p className="mb-1 text-xs font-semibold text-slate-500">모자 · 안경 · 액세서리</p><div className="flex flex-wrap gap-1.5">
              <Pill on={!l.hat} onClick={() => setL({ ...l, hat: null })}>모자 없음</Pill>{itemsOf("hat").map((h) => <Pill key={h.id} on={l.hat === h.id} onClick={() => setL({ ...l, hat: h.id })}>{h.name}</Pill>)}
              <Pill on={!l.glasses} onClick={() => setL({ ...l, glasses: null })}>안경 없음</Pill>{itemsOf("glasses").map((h) => <Pill key={h.id} on={l.glasses === h.id} onClick={() => setL({ ...l, glasses: h.id })}>{h.name}</Pill>)}
              <Pill on={!l.accessory} onClick={() => setL({ ...l, accessory: null })}>액세서리 없음</Pill>{itemsOf("accessory").map((h) => <Pill key={h.id} on={l.accessory === h.id} onClick={() => setL({ ...l, accessory: h.id })}>{h.name}</Pill>)}
            </div></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#ead9bf] px-5 py-3">
          <button onClick={onClose} className="rounded-full px-4 py-1.5 text-sm">취소</button>
          <button onClick={() => onSave(c, l)} className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white" data-testid="customizer-save">저장하고 대화하기</button>
        </div>
      </div>
    </div>
  );
}
