"use client";
/**
 * My Wardrobe — 나의 옷장 (학생 아바타 생성·꾸미기). 설정은 브라우저 localStorage 에만 저장.
 * 결제·재화·확률형 아이템 없음. AI 선배 외형과 별도 키로 저장한다.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Check, Footprints, Glasses, Hand, RotateCcw, Save, Shirt, Smile, Sparkles, Trash2, Undo2, Wand2 } from "lucide-react";
import { Avatar3, AvatarPreview3, type Avatar3State } from "@/components/world/Avatar3";
import {
  CLOTH_COLORS, DEFAULT_STUDENT_LOOK, EXPRESSIONS, EYES, FACE_SHAPES, HAIR_COLORS, SKIN_TONES, SLOT_LABEL, WARDROBE_KEY,
  itemsOf, sanitizeLook3, type AvatarLook3, type Slot,
} from "@/lib/world/wardrobe";
import { cn } from "@/lib/utils";

const OUTFITS_KEY = "hufs-atlas:wardrobe:outfits:v1";
const SLOTS: Slot[] = ["hair", "face", "top", "bottom", "set", "shoes", "hat", "glasses", "accessory"];
const NULLABLE: Partial<Record<Slot, true>> = { set: true, hat: true, glasses: true, accessory: true };

function slotValue(l: AvatarLook3, s: Slot): string | null {
  if (s === "face") return null;
  return (l as unknown as Record<string, string | null>)[s];
}

function withItem(l: AvatarLook3, s: Slot, id: string | null): AvatarLook3 {
  const next = { ...l, [s]: id } as AvatarLook3;
  if ((s === "top" || s === "bottom") && id) next.set = null; // 상·하의를 고르면 세트 해제
  return next;
}

function Swatches({ colors, value, onPick, label }: { colors: string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {colors.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={`${label} ${c}`} onClick={() => onPick(c)} className={cn("h-7 w-7 cursor-pointer rounded-full border-2 transition", value === c ? "scale-110 border-[#2c5a6e] ring-2 ring-teal-300" : "border-white shadow")} style={{ background: c }} />
      ))}
    </div>
  );
}

function Panel({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[20px] border border-[#ead9bf] bg-[#fffaf2] shadow-[0_6px_24px_rgba(120,90,50,0.10)]", className)}>
      <div className="bg-gradient-to-r from-teal-600 to-navy-700 px-4 py-2 text-sm font-semibold text-white">{title}</div>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function WardrobeClient({ onboarding }: { onboarding: boolean }) {
  const router = useRouter();
  const [look, setLook] = React.useState<AvatarLook3>(DEFAULT_STUDENT_LOOK);
  const [saved, setSaved] = React.useState<AvatarLook3 | null>(null);
  const [ready, setReady] = React.useState(false);
  const [slot, setSlot] = React.useState<Slot>("hair");
  const [pose, setPose] = React.useState<Avatar3State>("idle");
  const [facing, setFacing] = React.useState<1 | -1>(1);
  const [outfits, setOutfits] = React.useState<AvatarLook3[]>([]);
  const [create, setCreate] = React.useState(onboarding);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(WARDROBE_KEY);
      if (raw) {
        const l = sanitizeLook3(JSON.parse(raw), DEFAULT_STUDENT_LOOK);
        setLook(l);
        setSaved(l);
      } else setCreate(true); // 처음 접속: 캐릭터 만들기부터
      const o = JSON.parse(localStorage.getItem(OUTFITS_KEY) ?? "[]");
      if (Array.isArray(o)) setOutfits(o.slice(0, 3).map((x) => sanitizeLook3(x, DEFAULT_STUDENT_LOOK)));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };
  const dirty = ready && JSON.stringify(look) !== JSON.stringify(saved);
  const save = () => { localStorage.setItem(WARDROBE_KEY, JSON.stringify(look)); setSaved(look); flash("저장했어요! 캠퍼스 캐릭터에 바로 반영돼요."); };

  const items = slot === "face" ? [] : itemsOf(slot);
  const current = slotValue(look, slot);
  const colorKey = slot === "top" ? "topColor" : slot === "bottom" ? "bottomColor" : null;

  /* ---------- 캐릭터 만들기 (온보딩) ---------- */
  if (create)
    return (
      <div className="min-h-dvh bg-[radial-gradient(circle_at_30%_10%,#fff3dc,transparent_50%),linear-gradient(180deg,#dff1ff,#fdf6ec)] px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-lg font-bold text-navy-900"><Wand2 className="h-5 w-5 text-teal-600" /> 나만의 캐릭터 만들기</p>
            {saved && <button onClick={() => setCreate(false)} className="text-sm text-teal-700 underline">옷장으로 건너뛰기</button>}
          </div>
          <div className="grid gap-5 md:grid-cols-[320px_1fr]" data-testid="avatar-create">
            <Panel title="미리보기">
              <div className="grid place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_70%,#e7f6ef,#fffaf2)]">
                <AvatarPreview3 look={look} state="greeting" className="h-72 w-60" title="내 캐릭터 미리보기" />
              </div>
            </Panel>
            <div className="space-y-4">
              <Panel title="얼굴">
                <div className="space-y-3 text-sm">
                  <Row label="얼굴 형태">{FACE_SHAPES.map((f) => <Pill key={f.id} active={look.faceShape === f.id} onClick={() => setLook({ ...look, faceShape: f.id })}>{f.name}</Pill>)}</Row>
                  <Row label="눈 모양">{EYES.map((f) => <Pill key={f.id} active={look.eyes === f.id} onClick={() => setLook({ ...look, eyes: f.id })}>{f.name}</Pill>)}</Row>
                  <Row label="표정">{EXPRESSIONS.map((f) => <Pill key={f.id} active={look.expression === f.id} onClick={() => setLook({ ...look, expression: f.id })}>{f.name}</Pill>)}</Row>
                  <Row label="피부색"><Swatches colors={SKIN_TONES} value={look.skin} onPick={(c) => setLook({ ...look, skin: c })} label="피부색" /></Row>
                </div>
              </Panel>
              <Panel title="헤어">
                <div className="space-y-3 text-sm">
                  <Row label="스타일">{itemsOf("hair").map((h) => <Pill key={h.id} active={look.hair === h.id} onClick={() => setLook({ ...look, hair: h.id })}>{h.name}</Pill>)}</Row>
                  <Row label="색상"><Swatches colors={HAIR_COLORS} value={look.hairColor} onPick={(c) => setLook({ ...look, hairColor: c })} label="헤어 색상" /></Row>
                </div>
              </Panel>
              <Panel title="기본 의상">
                <div className="space-y-3 text-sm">
                  <Row label="상의">{itemsOf("top").map((h) => <Pill key={h.id} active={look.top === h.id && !look.set} onClick={() => setLook(withItem(look, "top", h.id))}>{h.name}</Pill>)}</Row>
                  <Row label="하의">{itemsOf("bottom").map((h) => <Pill key={h.id} active={look.bottom === h.id && !look.set} onClick={() => setLook(withItem(look, "bottom", h.id))}>{h.name}</Pill>)}</Row>
                  <Row label="신발">{itemsOf("shoes").map((h) => <Pill key={h.id} active={look.shoes === h.id} onClick={() => setLook({ ...look, shoes: h.id })}>{h.name}</Pill>)}</Row>
                  <Row label="액세서리"><Pill active={!look.accessory} onClick={() => setLook({ ...look, accessory: null })}>없음</Pill>{itemsOf("accessory").map((h) => <Pill key={h.id} active={look.accessory === h.id} onClick={() => setLook({ ...look, accessory: h.id })}>{h.name}</Pill>)}</Row>
                </div>
              </Panel>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { save(); setCreate(false); router.replace("/wardrobe"); }} className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-teal-700" data-testid="create-done"><Check className="h-4 w-4" /> 이 캐릭터로 시작하기</button>
                <button onClick={() => setLook(DEFAULT_STUDENT_LOOK)} className="inline-flex items-center gap-2 rounded-full border border-[#ead9bf] bg-white px-4 py-2.5 text-slate-700"><RotateCcw className="h-4 w-4" /> 기본값</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  /* ---------- 옷장 ---------- */
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(circle_at_50%_0%,#fff3dc,transparent_55%),linear-gradient(180deg,#e9f5ff,#fdf6ec)]">
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/campus?scene=hub" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-900"><ArrowLeft className="h-4 w-4" /> 선배 광장</Link>
        <p className="flex items-center gap-2 font-bold text-navy-900"><Shirt className="h-5 w-5 text-teal-600" /> 나의 옷장 <span className="text-xs font-normal text-slate-500">My Wardrobe</span></p>
        <button onClick={() => setCreate(true)} className="text-sm text-teal-700 underline" data-testid="recreate">캐릭터 다시 만들기</button>
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 pb-28 md:grid-cols-[180px_1fr_340px]" data-testid="wardrobe">
        {/* 좌: 카테고리 */}
        <Panel title="카테고리" className="md:self-start">
          <nav className="flex gap-1.5 overflow-x-auto md:flex-col" aria-label="아이템 카테고리">
            {SLOTS.map((s) => (
              <button key={s} onClick={() => setSlot(s)} aria-current={slot === s ? "true" : undefined} className={cn("whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium transition", slot === s ? "bg-teal-600 text-white shadow" : "text-slate-700 hover:bg-[#f3e7d3]")} data-testid={`slot-${s}`}>
                {SLOT_LABEL[s]}
              </button>
            ))}
          </nav>
        </Panel>
        {/* 중앙: 미리보기 */}
        <Panel title="미리보기" className="md:self-start">
          <div className="relative grid place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_85%,#d8efd9_0,#eef8f1_35%,#fffaf2_70%)]" data-testid="wardrobe-preview">
            <svg viewBox="-110 -200 220 230" className="h-[360px] w-full max-w-[340px]" role="img" aria-label="내 캐릭터 미리보기">
              <ellipse cx={0} cy={6} rx={90} ry={16} fill="rgba(90,140,100,0.18)" />
              <Avatar3 look={look} state={pose} facing={facing} size={1.15} />
            </svg>
            {dirty && <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">저장 안 됨</span>}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {([["idle", "서 있기", Smile], ["walking", "걷기", Footprints], ["greeting", "인사", Hand], ["encouraging", "응원", Sparkles]] as const).map(([v, l, I]) => (
              <Pill key={v} active={pose === v} onClick={() => setPose(v)}><I className="mr-1 inline h-3.5 w-3.5" />{l}</Pill>
            ))}
            <Pill active={facing === -1} onClick={() => setFacing(facing === 1 ? -1 : 1)}>방향 바꾸기</Pill>
          </div>
          {outfits.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold text-slate-500">저장한 착장</p>
              <div className="flex gap-2" data-testid="outfits">
                {outfits.map((o, i) => (
                  <div key={i} className="relative">
                    <button onClick={() => setLook(o)} className="rounded-xl border border-[#ead9bf] bg-white p-1 hover:border-teal-400" aria-label={`착장 ${i + 1} 불러오기`}><AvatarPreview3 look={o} className="h-20 w-16" title={`착장 ${i + 1}`} /></button>
                    <button onClick={() => { const n = outfits.filter((_, k) => k !== i); setOutfits(n); localStorage.setItem(OUTFITS_KEY, JSON.stringify(n)); }} className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow" aria-label="착장 삭제"><Trash2 className="h-3 w-3 text-rose-500" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
        {/* 우: 아이템 */}
        <Panel title={`${SLOT_LABEL[slot]} 아이템`} className="md:self-start">
          {slot === "face" ? (
            <div className="space-y-3 text-sm">
              <Row label="얼굴 형태">{FACE_SHAPES.map((f) => <Pill key={f.id} active={look.faceShape === f.id} onClick={() => setLook({ ...look, faceShape: f.id })}>{f.name}</Pill>)}</Row>
              <Row label="눈 모양">{EYES.map((f) => <Pill key={f.id} active={look.eyes === f.id} onClick={() => setLook({ ...look, eyes: f.id })}>{f.name}</Pill>)}</Row>
              <Row label="표정">{EXPRESSIONS.map((f) => <Pill key={f.id} active={look.expression === f.id} onClick={() => setLook({ ...look, expression: f.id })}>{f.name}</Pill>)}</Row>
              <Row label="피부색"><Swatches colors={SKIN_TONES} value={look.skin} onPick={(c) => setLook({ ...look, skin: c })} label="피부색" /></Row>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2" data-testid="item-grid">
                {NULLABLE[slot] && (
                  <button onClick={() => setLook(withItem(look, slot, null))} className={cn("flex h-28 flex-col items-center justify-center rounded-xl border bg-white text-xs text-slate-500", current === null ? "border-teal-500 ring-2 ring-teal-200" : "border-[#ead9bf] hover:border-teal-300")} data-testid="item-none"><Undo2 className="mb-1 h-5 w-5" />없음</button>
                )}
                {items.map((it) => {
                  const preview = withItem(look, slot, it.id);
                  return (
                    <button key={it.id} onClick={() => setLook(preview)} className={cn("flex flex-col items-center rounded-xl border bg-white p-1 text-[11px] text-slate-700 transition", current === it.id ? "border-teal-500 ring-2 ring-teal-200" : "border-[#ead9bf] hover:-translate-y-0.5 hover:border-teal-300")} aria-pressed={current === it.id} data-testid={`item-${it.id}`}>
                      <AvatarPreview3 look={preview} className="h-24 w-20" title={it.name} />
                      <span className="mt-0.5 line-clamp-1">{it.name}</span>
                    </button>
                  );
                })}
              </div>
              {slot === "hair" && <div className="mt-3"><p className="mb-1 text-xs font-semibold text-slate-500">헤어 색상</p><Swatches colors={HAIR_COLORS} value={look.hairColor} onPick={(c) => setLook({ ...look, hairColor: c })} label="헤어 색상" /></div>}
              {colorKey && !look.set && <div className="mt-3"><p className="mb-1 text-xs font-semibold text-slate-500">{SLOT_LABEL[slot]} 색상</p><Swatches colors={CLOTH_COLORS} value={look[colorKey]} onPick={(c) => setLook({ ...look, [colorKey]: c })} label={`${SLOT_LABEL[slot]} 색상`} /></div>}
              {slot === "glasses" && <p className="mt-3 text-[11px] text-slate-500"><Glasses className="mr-1 inline h-3 w-3" />안경은 모자와 함께 써도 돼요.</p>}
              {(slot === "top" || slot === "bottom") && look.set && <p className="mt-3 text-[11px] text-amber-700">세트 의상을 입고 있어요. 상·하의를 고르면 세트가 해제돼요.</p>}
            </>
          )}
        </Panel>
      </main>
      {/* 하단 고정 바 */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ead9bf] bg-[#fffaf2]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button onClick={save} disabled={!dirty} className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-5 py-2 font-semibold text-white shadow disabled:opacity-50" data-testid="wardrobe-save"><Save className="h-4 w-4" /> 저장</button>
            <button onClick={() => { const n = [look, ...outfits].slice(0, 3); setOutfits(n); localStorage.setItem(OUTFITS_KEY, JSON.stringify(n)); flash("착장을 보관했어요 (최대 3벌)"); }} className="rounded-full border border-[#ead9bf] bg-white px-4 py-2 text-sm text-slate-700" data-testid="outfit-keep">착장 보관</button>
            <button onClick={() => setLook(DEFAULT_STUDENT_LOOK)} className="inline-flex items-center gap-1 rounded-full border border-[#ead9bf] bg-white px-4 py-2 text-sm text-slate-700" data-testid="wardrobe-reset"><RotateCcw className="h-4 w-4" /> 기본 의상으로</button>
          </div>
          <button onClick={() => { if (dirty && !confirm("저장하지 않은 변경이 있어요. 그래도 나갈까요?")) return; router.push("/campus?scene=hub"); }} className="inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-5 py-2 font-semibold text-white" data-testid="wardrobe-to-plaza">광장으로 돌아가기</button>
        </div>
        {toast && <p className="mx-auto mt-1 max-w-6xl text-sm text-teal-800" role="status" data-testid="wardrobe-toast">{toast}</p>}
      </footer>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("cursor-pointer rounded-full border px-3 py-1 text-sm transition", active ? "border-teal-600 bg-teal-600 text-white shadow" : "border-[#ead9bf] bg-white text-slate-700 hover:border-teal-400")}>
      {children}
    </button>
  );
}
