"use client";
/**
 * 질문 중심 관계 탐색기. 전체 그래프 대신 선택한 항목의 주변 관계만 보여 준다.
 * 데스크톱: 방사형 그래프 + 상세 / 모바일: 주변 관계 목록 + 상세 (캔버스를 쓰지 않음).
 */
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import * as React from "react";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { BookOpen, Briefcase, Compass, GraduationCap, Hash, MessageCircleQuestion, MessagesSquare, Search, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ExploreEdge, ExploreNode, ExploreResult, Relation } from "@/lib/graphrag/explore";
import type { DataStatus, KNodeType } from "@/lib/graphrag/schema";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof Hash> = { Department: GraduationCap, Course: BookOpen, Skill: Sparkles, Experience: Trophy, Career: Compass, Role: Briefcase, Topic: Hash, AlumniQA: MessageCircleQuestion };
const TONE: Record<string, string> = { Department: "#0b1f3a", Course: "#1f7a78", Skill: "#b26a00", Experience: "#7a4fa3", Career: "#2a5591", Role: "#a33f5f", Topic: "#5f6b7a", AlumniQA: "#3f7f4f" };
const FILTERS: { label: string; types: KNodeType[] }[] = [
  { label: "학과", types: ["Department"] },
  { label: "과목", types: ["Course", "Topic"] },
  { label: "역량", types: ["Skill"] },
  { label: "직무·진로", types: ["Role", "Career"] },
  { label: "활동·경험", types: ["Experience"] },
  { label: "선배 Q&A", types: ["AlumniQA"] },
];
const STATUS_TONE: Record<DataStatus, "green" | "teal" | "amber" | "slate" | "violet"> = { official: "green", external_verified: "teal", alumni_verified: "green", synthetic_demo: "amber", inferred_candidate: "violet" };
const STARTS = [{ id: "Role:occ:data_analyst", label: "데이터 분석가" }, { id: "Course:확률론", label: "확률론" }, { id: "Skill:statistics", label: "통계" }, { id: "Skill:python", label: "Python" }, { id: "Career:ai_ml", label: "AI" }, { id: "Career:research_academia", label: "대학원·연구" }];
const panel = "rounded-[20px] border border-[#ead9bf] bg-[#fffaf2]";

type Data = ExploreResult & { data_notice: string | null; counts: { nodes: number; edges: number } };
type NData = { n: ExploreNode; center: boolean };

function PillNode({ data }: NodeProps<Node<NData>>) {
  const I = ICON[data.n.type] ?? Hash;
  const c = TONE[data.n.type];
  return (
    <div className={cn("flex max-w-[170px] cursor-pointer items-center gap-1.5 rounded-full border-2 bg-white px-2.5 py-1 shadow-sm", data.center && "ring-4 ring-teal-200")} style={{ borderColor: c }} title={`${data.n.type_label}: ${data.n.label}`}>
      <Handle type="target" position={Position.Top} className="!h-0 !min-h-0 !w-0 !min-w-0 !border-0 !bg-transparent" />
      <I className="h-3.5 w-3.5 shrink-0" style={{ color: c }} aria-hidden />
      <span className="min-w-0"><span className="block text-[10px] leading-none" style={{ color: c }}>{data.n.type_label}</span><span className={cn("block truncate text-[13px] leading-tight text-navy-900", data.center && "font-bold")}>{data.n.label}</span></span>
      <Handle type="source" position={Position.Bottom} className="!h-0 !min-h-0 !w-0 !min-w-0 !border-0 !bg-transparent" />
    </div>
  );
}
const nodeTypes = { pill: PillNode };

/** 결정적 방사형 배치: 같은 결과면 항상 같은 위치. 라벨이 겹치지 않도록 타원에 배치한다 */
function radial(nodes: ExploreNode[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const ring = (hop: number, rx: number, ry: number) => {
    const list = nodes.filter((n) => n.hop === hop).sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label));
    list.forEach((n, i) => { const t = (2 * Math.PI * i) / list.length - Math.PI / 2 + (hop === 2 ? 0.2 : 0); const stagger = i % 2 ? 1.16 : 0.92; pos.set(n.id, { x: rx * stagger * Math.cos(t), y: ry * stagger * Math.sin(t) }); });
  };
  nodes.filter((n) => n.hop === 0).forEach((n) => pos.set(n.id, { x: 0, y: 0 }));
  ring(1, 250, 165);
  ring(2, 400, 285);
  return pos;
}

function edgeStyle(e: ExploreEdge): React.CSSProperties {
  if (e.status === "inferred_candidate") return { stroke: "#7a4fa3", strokeDasharray: "2 5", strokeWidth: 1.5 };
  if (e.status === "synthetic_demo") return { stroke: "#c9a56a", strokeDasharray: "7 4", strokeWidth: 1.5 };
  return { stroke: "#1f7a78", strokeWidth: 2.2 };
}

function RelationCard({ r, onGo }: { r: Relation; onGo: (id: string) => void }) {
  return (
    <li className="rounded-xl border border-[#ead9bf] bg-white p-2.5" data-testid="relation">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <button type="button" onClick={() => onGo(r.other.id)} className="cursor-pointer text-left text-sm font-semibold text-teal-800 underline-offset-2 hover:underline">{r.other.label} <span className="font-normal text-slate-500">{r.other.type_label}</span></button>
        <Badge tone={STATUS_TONE[r.status]} data-testid="relation-status">{r.status_label}</Badge>
      </div>
      <p className="mt-0.5 text-xs font-medium text-slate-600">{r.type_label}{r.academic_year ? ` · ${r.academic_year}학년도 ${r.term ?? ""}` : ""}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-slate-700">{r.evidence}</p>
      {r.doc_title && <p className="mt-0.5 text-[11px] text-slate-500">출처: {r.doc_title}{r.locator ? ` · ${r.locator}` : ""}</p>}
    </li>
  );
}

export function GraphExplorer({ initialCenter, campus }: { initialCenter: string | null; campus: boolean }) {
  const [center, setCenter] = React.useState(initialCenter ?? STARTS[0].id);
  const [depth, setDepth] = React.useState<1 | 2>(1);
  const [off, setOff] = React.useState<Set<string>>(new Set());
  const [data, setData] = React.useState<Data | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [sug, setSug] = React.useState<ExploreNode[]>([]);

  const typesParam = React.useMemo(() => (off.size ? FILTERS.filter((f) => !off.has(f.label)).flatMap((f) => f.types).join(",") : ""), [off]);
  React.useEffect(() => {
    const ctl = new AbortController();
    setErr(null);
    fetch(`/api/graph/explore?center=${encodeURIComponent(center)}&depth=${depth}${off.size ? `&types=${typesParam}` : ""}`, { signal: AbortSignal.any([ctl.signal, AbortSignal.timeout(15000)]) })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((j: Data) => setData(j))
      .catch((e) => { if (!ctl.signal.aborted) setErr(`관계를 불러오지 못했어요. (${(e as Error).message.slice(0, 40)})`); });
    return () => ctl.abort();
  }, [center, depth, typesParam, off.size]);

  React.useEffect(() => {
    if (!q.trim()) { setSug([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/graph/explore?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => r.json()).then((j: { suggestions?: ExploreNode[] }) => setSug(j.suggestions ?? [])).catch(() => {});
    }, 180);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const go = (id: string) => { setCenter(id); setQ(""); setSug([]); };
  const pos = React.useMemo(() => radial(data?.nodes ?? []), [data]);
  const nodes: Node<NData>[] = React.useMemo(() => (data?.nodes ?? []).map((n) => ({ id: n.id, type: "pill", position: pos.get(n.id) ?? { x: 0, y: 0 }, data: { n, center: n.hop === 0 }, ariaLabel: `${n.type_label} ${n.label}` })), [data, pos]);
  const edges: Edge[] = React.useMemo(() => (data?.edges ?? []).map((e) => ({ id: e.id, source: e.source, target: e.target, type: "straight", style: edgeStyle(e) })), [data]);
  const d = data?.detail;
  const groups = React.useMemo(() => { const m = new Map<string, Relation[]>(); for (const r of d?.relations ?? []) m.set(r.other.type_label, [...(m.get(r.other.type_label) ?? []), r]); return [...m]; }, [d]);
  const askHref = d ? `/campus?scene=seoul_library&senior=2&ask=${encodeURIComponent(d.ask)}` : "#";

  return (
    <div data-testid="graph-explorer">
      {data?.data_notice && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200" data-testid="graph-notice">{data.data_notice}</p>}
      <div className={cn(panel, "mb-3 space-y-2 p-3")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="데이터 분석, 통계, Python, AI, 대학원, 과목 이름" aria-label="관계 그래프 항목 검색" className="w-full rounded-full border border-[#ead9bf] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500" data-testid="graph-search" />
          {sug.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-[#ead9bf] bg-white p-1 shadow-lg" data-testid="graph-suggestions">
              {sug.map((s) => <li key={s.id}><button type="button" onClick={() => go(s.id)} className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-teal-50" data-testid="graph-suggestion"><span>{s.label}</span><span className="shrink-0 text-xs text-slate-500">{s.type_label}</span></button></li>)}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">바로 보기</span>
          {STARTS.map((s) => <button key={s.id} type="button" onClick={() => go(s.id)} className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs", center === s.id ? "border-teal-600 bg-teal-600 text-white" : "border-[#ead9bf] bg-white text-slate-700 hover:border-teal-400")}>{s.label}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" data-testid="graph-filters">
          <span className="text-xs text-slate-500">표시</span>
          {FILTERS.map((f) => { const on = !off.has(f.label); return <button key={f.label} type="button" aria-pressed={on} onClick={() => setOff((s) => { const n = new Set(s); if (on) n.add(f.label); else n.delete(f.label); return n; })} className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs", on ? "border-navy-800 bg-navy-50 text-navy-900" : "border-slate-200 bg-white text-slate-400 line-through")} data-testid={`filter-${f.label}`}>{f.label}</button>; })}
          <span className="ml-auto flex items-center gap-1"><span className="text-xs text-slate-500">깊이</span>{([1, 2] as const).map((v) => <button key={v} type="button" aria-pressed={depth === v} onClick={() => setDepth(v)} className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs", depth === v ? "border-teal-600 bg-teal-600 text-white" : "border-[#ead9bf] bg-white text-slate-700")} data-testid={`depth-${v}`}>{v}단계</button>)}</span>
        </div>
      </div>
      {err && <p className="mb-3 text-sm text-rose-600" role="alert">{err}</p>}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cn(panel, "relative hidden h-[620px] overflow-hidden lg:block")} data-testid="graph-canvas">
          {data && <ReactFlow key={`${data.center?.id}-${data.nodes.length}-${data.edges.length}`} nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.06, maxZoom: 1.25 }} minZoom={0.3} maxZoom={1.8} nodesConnectable={false} nodesFocusable edgesFocusable={false} proOptions={{ hideAttribution: false }} onNodeClick={(_, n) => go(n.id)}><Background color="#ead9bf" gap={26} /><Controls showInteractive={false} /></ReactFlow>}
          <div className="pointer-events-none absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-[11px] text-slate-600 ring-1 ring-[#ead9bf]">
            <p>━ 공식·검증 &nbsp; ╍ 가상 시연 &nbsp; ┈ 추론 후보</p>
            {data?.truncated && <p className="text-amber-700">연결이 많아 일부만 표시했어요</p>}
          </div>
        </div>
        <aside className={cn(panel, "max-h-[620px] overflow-y-auto p-3")} data-testid="graph-detail">
          {d ? (
            <>
              <p className="text-xs text-slate-500">{d.type_label}</p>
              <h2 className="text-lg font-bold text-navy-900" data-testid="graph-detail-title">{d.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700" data-testid="graph-detail-meaning">{d.meaning}</p>
              {campus && <Link href={askHref} className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white" data-testid="graph-ask"><MessagesSquare className="h-4 w-4" /> AI 선배에게 물어보기</Link>}
              <p className="mt-3 text-xs font-semibold text-slate-500">연결 {d.relations.length}건 · 출처와 검증 상태를 함께 확인하세요</p>
              {groups.map(([g, rs]) => (
                <div key={g} className="mt-2">
                  <p className="mb-1 text-xs font-bold text-navy-900">{g} ({rs.length})</p>
                  <ul className="space-y-1.5">{rs.slice(0, 8).map((r, i) => <RelationCard key={`${r.other.id}-${i}`} r={r} onGo={go} />)}</ul>
                  {rs.length > 8 && <p className="mt-1 text-[11px] text-slate-500">외 {rs.length - 8}건</p>}
                </div>
              ))}
              {!d.relations.length && <p className="mt-2 text-sm text-slate-500">등록된 연결이 없어요.</p>}
            </>
          ) : !err && <p className="p-6 text-center text-sm text-slate-500">관계를 불러오는 중…</p>}
        </aside>
      </div>
    </div>
  );
}
