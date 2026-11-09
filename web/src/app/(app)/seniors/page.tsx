"use client";
import Link from "next/link";
import * as React from "react";
import { Search } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { SyntheticNotice } from "@/components/Notice";
import { Badge, Card, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { useRecords } from "@/lib/client/useRecords";
import { CAREER_FIELDS, DEPARTMENTS, PATH_TYPE_LABEL, fieldLabel, normalizeText, skillLabel } from "@/lib/taxonomy";
import { recordPathSummary } from "@/lib/graph";

export default function SeniorsPage() {
  const { records } = useRecords();
  const [q, setQ] = React.useState("");
  const [dept, setDept] = React.useState("");
  const [field, setField] = React.useState("");
  const [path, setPath] = React.useState("");
  const list = (records ?? []).filter(
    (r) =>
      (!dept || r.department === dept) &&
      (!field || r.career_field.includes(field)) &&
      (!path || r.path_type === path) &&
      (!q || normalizeText(JSON.stringify(r) + r.key_skills.map(skillLabel).join(" ")).includes(normalizeText(q))),
  );
  return (
    <div>
      <PageTitle title="선배 경험 DB" description="구조화된 선배 경험 기록입니다. 각 기록은 추천·그래프·상담의 근거로 연결됩니다." />
      <SyntheticNotice className="mb-5" />
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input aria-label="검색" className="pl-9" placeholder="키워드 (예: SQL, 학부연구생)" value={q} onChange={(e) => setQ(e.target.value)} data-testid="senior-search" />
        </div>
        <Select aria-label="학과" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">전체 학과</option>
          {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
        <Select aria-label="진로 분야" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">전체 진로 분야</option>
          {CAREER_FIELDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </Select>
        <Select aria-label="경로 유형" value={path} onChange={(e) => setPath(e.target.value)}>
          <option value="">전체 경로 유형</option>
          {Object.entries(PATH_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Card>
      {!records && <Card className="p-8 text-center"><Spinner /></Card>}
      {records && <p className="mb-3 text-sm text-slate-500" data-testid="senior-count">{list.length}건</p>}
      {records && !list.length && <EmptyState title="조건에 맞는 기록이 없습니다" description="필터를 줄이거나 다른 키워드로 검색해 보세요." />}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((r) => (
          <Link key={r.record_id} href={`/seniors/${r.record_id}`}>
            <Card className="h-full p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy-900">{r.current_role}</p>
                <Badge tone={r.is_synthetic ? "amber" : "green"}>{r.is_synthetic ? `가상 ${r.record_id}` : `실제 ${r.record_id}`}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{r.department} · {PATH_TYPE_LABEL[r.path_type]} · {r.organization_type}</p>
              <p className="mt-2 text-xs text-slate-600">{recordPathSummary(r)}</p>
              <div className="mt-2 flex flex-wrap gap-1">{r.career_field.map((f) => <Badge key={f} tone="teal">{fieldLabel(f)}</Badge>)}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
