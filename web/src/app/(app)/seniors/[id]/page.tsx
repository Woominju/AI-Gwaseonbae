"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Briefcase, FlaskConical, GitBranch, Lightbulb, MessageSquareQuote, ShieldCheck, Trophy } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { SyntheticNotice } from "@/components/Notice";
import { Badge, Card, CardHeader, EmptyState, Spinner } from "@/components/ui";
import { useRecords } from "@/lib/client/useRecords";
import { PATH_TYPE_LABEL, fieldLabel, skillLabel } from "@/lib/taxonomy";
import { recordPathSummary } from "@/lib/graph";
import type { Experience } from "@/lib/types";

const KIND = { project: "프로젝트", internship: "인턴십", research: "연구", competition: "공모전·대회", extracurricular: "대외활동" } as const;
const KIND_ICON = { project: Trophy, internship: Briefcase, research: FlaskConical, competition: Trophy, extracurricular: Trophy } as const;

function Statement({ children }: { children: React.ReactNode }) {
  return <Badge tone="amber" className="ml-1 align-middle">{children}</Badge>;
}

function ExpItem({ e }: { e: Experience }) {
  const Icon = KIND_ICON[e.kind];
  return (
    <li className="rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Icon className="h-4 w-4 text-teal-600" />
        <b className="text-sm text-navy-900">{e.title}</b>
        <Badge>{KIND[e.kind]}</Badge>
        {e.when && <Badge tone="navy">{e.when}</Badge>}
        {e.duration_months !== undefined && <Badge>{e.duration_months}개월</Badge>}
        {e.self_reported_link && <Badge tone="violet" title="선배 본인의 진술이며 인과관계가 검증된 것은 아닙니다">선배 진술: 진로로 이어짐</Badge>}
      </div>
      <p className="mt-1 text-sm text-slate-600">{e.description}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">{e.skills.map((s) => <Badge key={s} tone="teal">{skillLabel(s)}</Badge>)}{e.org_type && <Badge>{e.org_type}</Badge>}</div>
    </li>
  );
}

export default function SeniorDetail() {
  const { id } = useParams<{ id: string }>();
  const { records, byId } = useRecords();
  const r = byId.get(id);
  if (!records) return <Card className="p-8 text-center"><Spinner /></Card>;
  if (!r) return <EmptyState title="기록을 찾을 수 없습니다" description={`${id} 기록이 없습니다.`} action={<Link href="/seniors" className="text-teal-700">목록으로</Link>} />;
  const minM = Math.min(...r.preparation_timeline.map((t) => t.month_offset));
  const maxM = Math.max(...r.preparation_timeline.map((t) => t.month_offset), 0);
  return (
    <div>
      <Link href="/seniors" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-800"><ArrowLeft className="h-4 w-4" /> 선배 경험 DB</Link>
      <PageTitle title={`${r.current_role}`} description={`${r.record_id} · ${r.department} · ${r.graduation_year}년 졸업 · ${PATH_TYPE_LABEL[r.path_type]} · ${r.organization_type}`} />
      {r.is_synthetic && <SyntheticNotice className="mb-5" />}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="경험 경로" icon={<GitBranch className="h-4 w-4" />} description="그래프에서 이 기록에 근거한 연결을 강조해 볼 수 있습니다" action={<Link className="text-xs text-teal-700 hover:underline" href={`/graph?record=${r.record_id}`}>그래프에서 보기</Link>} />
            <p className="p-5 text-sm leading-relaxed text-slate-700">{recordPathSummary(r)}</p>
          </Card>
          <Card>
            <CardHeader title="준비 타임라인" description="졸업 시점(0)을 기준으로 한 상대 개월" />
            <div className="overflow-x-auto p-5">
              <ol className="relative min-w-[520px] border-l-2 border-teal-100 pl-5">
                {r.preparation_timeline.map((t, i) => (
                  <li key={i} className="mb-4 last:mb-0">
                    <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
                    <p className="text-xs text-slate-400">{t.month_offset === 0 ? "졸업" : t.month_offset < 0 ? `졸업 ${-t.month_offset}개월 전` : `졸업 ${t.month_offset}개월 후`} · {t.label}</p>
                    <p className="text-sm font-medium text-navy-900">{t.activity}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-navy-600/60" style={{ width: `${((t.month_offset - minM) / Math.max(1, maxM - minM)) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">졸업 후 첫 직무까지: {r.months_to_first_role === null ? "학위 과정 중 또는 미기재" : `${r.months_to_first_role}개월`}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="경험·활동" />
            <ul className="space-y-2 p-5">{[...r.projects, ...r.internships].map((e, i) => <ExpItem key={i} e={e} />)}</ul>
          </Card>
          <Card>
            <CardHeader title="진로 결정" icon={<Lightbulb className="h-4 w-4" />} description="선배가 기록한 결정과 이유" />
            <ul className="space-y-3 p-5 text-sm">
              {r.career_decisions.map((d, i) => (
                <li key={i} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-navy-900">{d.decision} {d.when && <Badge tone="navy">{d.when}</Badge>}</p>
                  <p className="mt-1 text-slate-600">고려한 대안: {d.alternatives.join(", ") || "-"}</p>
                  <p className="mt-1 text-slate-700">이유<Statement>선배 진술(가상)</Statement>: {d.reason}</p>
                </li>
              ))}
            </ul>
          </Card>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["어려움", r.difficulties],
              ["교훈", r.lessons_learned],
              ["조언", r.advice],
            ].map(([t, xs]) => (
              <Card key={t as string}>
                <CardHeader title={<>{t as string}<Statement>선배 진술(가상)</Statement></>} icon={<MessageSquareQuote className="h-4 w-4" />} />
                <ul className="space-y-1.5 p-4 text-sm text-slate-700">{(xs as string[]).map((x, i) => <li key={i}>“{x}”</li>)}</ul>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="학업 배경" icon={<BookOpen className="h-4 w-4" />} />
            <div className="space-y-2 p-4 text-sm">
              <p>전공: {r.academic_background.major}</p>
              {r.academic_background.double_major && <p>복수전공: {r.academic_background.double_major}</p>}
              {r.academic_background.minor && <p>부전공: {r.academic_background.minor}</p>}
              {r.academic_background.graduate_degree && <p>대학원: {r.academic_background.graduate_degree}</p>}
              <div className="pt-2">
                <p className="mb-1 text-xs text-slate-500">수강 과목 → 개발한 역량</p>
                <ul className="space-y-1">{r.courses.map((c) => <li key={c.name} className="text-xs">{c.name} → {c.skills_developed.map(skillLabel).join(", ")}</li>)}</ul>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="역량·자격" />
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap gap-1">{r.key_skills.map((s) => <Badge key={s} tone="teal">{skillLabel(s)}</Badge>)}</div>
              <div className="flex flex-wrap gap-1">{r.certifications.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              <div className="flex flex-wrap gap-1">{r.career_field.map((f) => <Badge key={f} tone="navy">{fieldLabel(f)}</Badge>)}</div>
              <div className="flex flex-wrap gap-1">{r.context_tags.map((f) => <Badge key={f} tone="slate">#{f}</Badge>)}</div>
            </div>
          </Card>
          <Card>
            <CardHeader title="출처·동의" icon={<ShieldCheck className="h-4 w-4" />} />
            <dl className="space-y-1.5 p-4 text-xs">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">출처 유형</dt><dd>{r.evidence_source.type}</dd></div>
              <div><dt className="text-slate-500">출처 설명</dt><dd>{r.evidence_source.description}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">작성일</dt><dd>{r.source_date}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">동의 상태</dt><dd>{r.consent_status}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">is_synthetic</dt><dd data-testid="is-synthetic">{String(r.is_synthetic)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">학과명</dt><dd>{r.department_is_demo_category ? "시연용 분류" : "확인된 학과"}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
