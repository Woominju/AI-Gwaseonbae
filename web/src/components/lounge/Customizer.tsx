"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Button, Chip } from "@/components/ui";
import { ACCESSORY, ACCESSORY_LABEL, EXPRESSION, EXPRESSION_LABEL, HAIR, HAIR_COLOR, HAIR_LABEL, OUTFIT, SKIN, type SeniorConfig } from "@/lib/lounge/avatar";
import { GREETING_STYLES, PERSONAS, getPersona } from "@/lib/lounge/personas";
import { cn } from "@/lib/utils";
import { AvatarPreview } from "./Avatar";

function Swatches({ values, value, onChange, label }: { values: readonly string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {values.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={`${label} ${c}`} onClick={() => onChange(c)} className={cn("h-7 w-7 cursor-pointer rounded-full border-2", value === c ? "border-navy-900 ring-2 ring-teal-500" : "border-white shadow")} style={{ background: c }} />
      ))}
    </div>
  );
}

export function Customizer({ config, onSave, onClose }: { config: SeniorConfig; onSave: (c: SeniorConfig) => void; onClose: () => void }) {
  const [c, setC] = React.useState(config);
  const set = (patch: Partial<SeniorConfig["look"]>) => setC((x) => ({ ...x, look: { ...x.look, ...patch } }));
  const p = getPersona(c.persona);
  const row = "space-y-1.5";
  const h = "text-xs font-semibold text-slate-500";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-3" role="dialog" aria-modal="true" aria-label="AI 선배 꾸미기" data-testid="customizer">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="font-bold text-navy-900">AI 선배 꾸미기</p>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer rounded p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <AvatarPreview look={c.look} state="greeting" className="h-48 w-40 rounded-xl bg-teal-50" title={`${p.name} 미리보기`} />
            <p className="text-sm font-bold text-navy-900">AI 선배 {p.name}</p>
            <p className="text-center text-xs text-slate-500">{p.title} · {p.tagline}</p>
          </div>
          <div className="space-y-4">
            <div className={row}>
              <p className={h}>선배 성격 (상담 진행 방식)</p>
              <div className="flex flex-wrap gap-2">{PERSONAS.map((x) => <Chip key={x.id} active={c.persona === x.id} onClick={() => setC({ ...c, persona: x.id })} data-testid={`persona-${x.id}`}>{x.title}</Chip>)}</div>
              <p className="text-[11px] text-slate-500">{p.traits.join(" · ")} — 성격은 말투와 진행 방식만 바꾸며, 근거 자료와 사실 답변은 모든 선배가 같습니다.</p>
            </div>
            <div className={row}>
              <p className={h}>기본 인사 방식</p>
              <div className="flex flex-wrap gap-2">{GREETING_STYLES.map((g) => <Chip key={g.id} active={c.greeting === g.id} onClick={() => setC({ ...c, greeting: g.id })}>{g.label}</Chip>)}</div>
            </div>
            <div className={row}>
              <p className={h}>헤어스타일</p>
              <div className="flex flex-wrap gap-2">{HAIR.map((x) => <Chip key={x} active={c.look.hair === x} onClick={() => set({ hair: x })}>{HAIR_LABEL[x]}</Chip>)}</div>
              <Swatches label="머리 색" values={HAIR_COLOR} value={c.look.hairColor} onChange={(v) => set({ hairColor: v })} />
            </div>
            <div className={row}>
              <p className={h}>의상 색상</p>
              <Swatches label="의상 색" values={OUTFIT} value={c.look.outfit} onChange={(v) => set({ outfit: v })} />
            </div>
            <div className={row}>
              <p className={h}>피부 톤</p>
              <Swatches label="피부 톤" values={SKIN} value={c.look.skin} onChange={(v) => set({ skin: v })} />
            </div>
            <div className={row}>
              <p className={h}>액세서리</p>
              <div className="flex flex-wrap gap-2">{ACCESSORY.map((x) => <Chip key={x} active={c.look.accessory === x} onClick={() => set({ accessory: x })}>{ACCESSORY_LABEL[x]}</Chip>)}</div>
            </div>
            <div className={row}>
              <p className={h}>표정</p>
              <div className="flex flex-wrap gap-2">{EXPRESSION.map((x) => <Chip key={x} active={c.look.expression === x} onClick={() => set({ expression: x })}>{EXPRESSION_LABEL[x]}</Chip>)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-500">설정은 이 브라우저에만 저장됩니다.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>취소</Button>
            <Button variant="secondary" onClick={() => onSave(c)} data-testid="customizer-save">저장하고 대화하기</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
