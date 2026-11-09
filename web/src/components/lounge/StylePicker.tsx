"use client";
/** 상담창 안의 스타일 선택기. 평소에는 한 줄로 접혀 있고, 펼치면 상담 패널 안에서만 열린다 (캠퍼스 화면을 가리지 않음) */
import * as React from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { templateView, type CounselFacts } from "@/lib/counsel/compose";
import { BLEND_WEIGHTS, COUNSEL_STYLES, STYLE_LIST, styleLabel, type CounselStyleId, type StyleSetting } from "@/lib/counsel/styles";
import { cn } from "@/lib/utils";

/** 미리보기 전용 예시 사실 (실제 근거가 아니며 화면에도 예시로 표시) */
const SAMPLE: CounselFacts = { evidenceCount: 3, cite: "", gaps: ["SQL"], topOption: "취업", otherOption: "대학원", allSynthetic: true };

const chip = (on: boolean) => cn("cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium", on ? "border-teal-600 bg-teal-600 text-white" : "border-[#ead9bf] bg-white text-slate-700 hover:border-teal-300");

export function StylePicker({ value, disabled, onApply }: { value: StyleSetting; disabled?: boolean; onApply: (s: StyleSetting) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const toggle = () => {
    setDraft(value);
    setOpen((o) => !o);
  };
  const setPrimary = (id: CounselStyleId) => setDraft((d) => ({ ...d, primary: id, secondary: d.secondary === id ? null : d.secondary, primaryWeight: d.secondary === id ? 100 : d.primaryWeight }));
  const setBlend = (on: boolean) =>
    setDraft((d) => {
      if (!on) return { ...d, secondary: null, primaryWeight: 100 };
      const other = STYLE_LIST.find((x) => x.id !== d.primary)!.id;
      return { ...d, secondary: other, primaryWeight: 60 };
    });
  const blending = draft.secondary !== null;
  return (
    <div className="border-b border-[#ead9bf] bg-[#fffaf2]" data-testid="style-picker">
      <button type="button" onClick={toggle} disabled={disabled} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 disabled:cursor-default" data-testid="style-toggle">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-teal-700" />
        <span className="shrink-0">상담 스타일</span>
        <b className="min-w-0 flex-1 truncate text-teal-800" data-testid="style-current">{styleLabel(value)}</b>
        <span className="shrink-0 text-teal-700">{open ? "접기" : "바꾸기"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-teal-700", open && "rotate-180")} />
      </button>
      {open && (
        <div className="max-h-[60dvh] space-y-3 overflow-y-auto border-t border-[#ead9bf] p-3" data-testid="style-panel">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {STYLE_LIST.map((s) => {
              const on = draft.primary === s.id;
              return (
                <button key={s.id} type="button" onClick={() => setPrimary(s.id)} aria-pressed={on} className={cn("cursor-pointer rounded-xl border p-2.5 text-left", on ? "border-teal-600 bg-teal-50" : "border-[#ead9bf] bg-white hover:border-teal-300")} data-testid={`style-${s.id}`}>
                  <span className="flex items-center gap-1 text-sm font-bold text-navy-900">{s.name}{on && <Check className="h-3.5 w-3.5 text-teal-700" />}</span>
                  <span className="block text-xs text-slate-600">{s.tagline}</span>
                </button>
              );
            })}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-teal-600" checked={blending} onChange={(e) => setBlend(e.target.checked)} data-testid="style-blend" /> 다른 스타일 섞기
          </label>
          {blending && (
            <div className="space-y-2 rounded-xl bg-white p-2.5 ring-1 ring-[#ead9bf]">
              <p className="text-xs font-semibold text-slate-500">함께 섞을 스타일</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_LIST.filter((s) => s.id !== draft.primary).map((s) => (
                  <button key={s.id} type="button" aria-pressed={draft.secondary === s.id} onClick={() => setDraft({ ...draft, secondary: s.id })} className={chip(draft.secondary === s.id)} data-testid={`style-second-${s.id}`}>{s.name}</button>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500">{COUNSEL_STYLES[draft.primary].name}의 비중</p>
              <div className="flex gap-1.5">
                {BLEND_WEIGHTS.map((w) => <button key={w} type="button" aria-pressed={draft.primaryWeight === w} onClick={() => setDraft({ ...draft, primaryWeight: w })} className={cn(chip(draft.primaryWeight === w), "flex-1 text-center")} data-testid={`style-weight-${w}`}>{w}%</button>)}
              </div>
              <p className="text-[11px] leading-snug text-slate-500">비중은 설명 방식의 상대적인 비율이에요. 추천의 정확도나 성공 확률을 뜻하지 않아요.</p>
            </div>
          )}
          <div className="rounded-xl bg-[#f7efe2] p-2.5" data-testid="style-preview">
            <p className="mb-1 text-[11px] font-semibold text-slate-500">말투 미리보기 · 예시 문장이며 실제 답변이 아니에요</p>
            <p className="text-xs leading-relaxed text-slate-700">{templateView(draft, SAMPLE)}</p>
          </div>
          <p className="text-[11px] text-slate-500">스타일을 바꿔도 찾아본 근거와 사실은 같고, 설명하는 관점만 달라져요.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-full px-3 py-1.5 text-sm text-slate-600">취소</button>
            <button type="button" onClick={() => { onApply(draft); setOpen(false); }} className="cursor-pointer rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white" data-testid="style-apply">적용하기</button>
          </div>
        </div>
      )}
    </div>
  );
}
