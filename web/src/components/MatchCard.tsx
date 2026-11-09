"use client";
import { RecordBadge } from "@/components/RecordBadge";
import Link from "next/link";
import * as React from "react";
import { AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import type { MatchResult, SeniorRecord } from "@/lib/types";
import { SUBSCORE_LABEL } from "@/lib/scoring";
import { PATH_TYPE_LABEL, fieldLabel, skillLabel } from "@/lib/taxonomy";
import { Badge, Card, Progress } from "./ui";
import { cn } from "@/lib/utils";

export const CONF_LABEL = { high: "신뢰도 높음", medium: "신뢰도 보통", low: "신뢰도 낮음" } as const;
const CONF_TONE = { high: "green", medium: "navy", low: "rose" } as const;

export function ScoreBreakdown({ m }: { m: MatchResult }) {
  return (
    <div className="space-y-2.5">
      {m.subscores.map((s) => (
        <div key={s.key}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              {SUBSCORE_LABEL[s.key]} <span className="text-slate-400">× {s.weight.toFixed(2)}</span>
            </span>
            <span className="tabular-nums text-slate-600">{s.value === null ? <Badge tone="amber">계산 불가(입력 없음)</Badge> : s.value.toFixed(2)}</span>
          </div>
          <Progress value={s.value ?? 0} tone={s.value === null ? "slate" : "teal"} className="mt-1 h-1.5" />
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.reason}</p>
        </div>
      ))}
      <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
        종합 = 계산 가능한 항목의 가중 평균 · 입력 반영률(coverage) {(m.coverage * 100).toFixed(0)}% · 의미 유사도 방식: {m.semantic_method === "embedding_rerank" ? "bge-m3 임베딩 + bge-reranker (GPU)" : m.semantic_method === "embedding" ? "bge-m3 임베딩 (GPU)" : "로컬 n-gram·개념 확장"}
      </p>
    </div>
  );
}

export function MatchCard({ m, r, rank, defaultOpen }: { m: MatchResult; r: SeniorRecord; rank: number; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <Card className="overflow-hidden animate-fade-up" data-testid="match-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3 sm:w-[58%]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-800 text-sm font-bold text-white">{rank}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={`/seniors/${r.record_id}`} className="font-semibold text-navy-900 hover:underline">{r.current_role}</Link>
              <RecordBadge id={r.record_id} synthetic={r.is_synthetic} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {r.department}{r.academic_background.double_major ? ` + ${r.academic_background.double_major}` : ""} · {r.graduation_year}년 졸업(가상) · {PATH_TYPE_LABEL[r.path_type]}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {r.career_field.map((f) => <Badge key={f} tone="teal">{fieldLabel(f)}</Badge>)}
              {r.key_skills.slice(0, 4).map((s) => (
                <Badge key={s} tone={m.matched_skills.includes(s) ? "green" : "slate"}>{skillLabel(s)}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">관련도 <span className="text-[11px]">(참고용, 확률 아님)</span></span>
            <span className="text-lg font-bold tabular-nums text-navy-900" data-testid="match-score">{m.score.toFixed(2)}</span>
          </div>
          <Progress value={m.score} className="mt-1" />
          <div className="mt-2 flex items-center justify-between">
            <Badge tone={CONF_TONE[m.confidence]}>{CONF_LABEL[m.confidence]}</Badge>
            <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline cursor-pointer" aria-expanded={open}>
              추천 이유 {open ? "접기" : "보기"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="grid gap-4 border-t border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-navy-900">이 선배 경로가 추천된 이유</p>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {m.reasons.map((x, i) => <li key={i} className="flex gap-1.5"><span className="text-teal-600">•</span>{x}</li>)}
            </ul>
            {m.gaps.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
                <p className="flex items-center gap-1 font-medium"><AlertTriangle className="h-3.5 w-3.5" /> 현재 학생에게 부족할 수 있는 준비 요소</p>
                <p className="mt-1">{m.gaps.join(", ")}</p>
              </div>
            )}
            <Link href={`/seniors/${r.record_id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
              준비 과정·근거 기록 보기 <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ScoreBreakdown m={m} />
        </div>
      )}
    </Card>
  );
}
