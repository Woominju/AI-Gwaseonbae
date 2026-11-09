"use client";
import { RecordBadge } from "@/components/RecordBadge";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Background, Controls, Position, ReactFlow, type Edge, type Node, type ReactFlowInstance } from "@xyflow/react";
import { Eraser, GitBranch, Info, UserRound } from "lucide-react";
import { PageTitle, useStatus } from "@/components/AppShell";
import { GraphExplorer } from "@/components/graph/GraphExplorer";
import { SyntheticNotice } from "@/components/Notice";
import { Badge, Button, Card, CardHeader, Label, Select, Slider, Spinner } from "@/components/ui";
import { useAppState } from "@/lib/client/store";
import { useRecords } from "@/lib/client/useRecords";
import { CAREER_FIELDS, DEPARTMENTS, PATH_TYPE_LABEL } from "@/lib/taxonomy";
import { EDGE_MEANING, NODE_LABEL, NODE_ORDER, highlightForNode, recordPathSummary } from "@/lib/graph";
import type { CareerGraph, GraphEdgeType, GraphNodeType } from "@/lib/types";

const NODE_COLOR: Record<GraphNodeType, string> = {
  Department: "#0b1f3a",
  Course: "#2a5591",
  Skill: "#0e8a8a",
  Experience: "#7c5cc4",
  Career: "#c2761b",
  Role: "#b4385b",
};
const EDGE_COLOR: Record<GraphEdgeType, string> = {
  STUDIED: "#94a3b8",
  DEVELOPED_SKILL: "#5aa9a9",
  PARTICIPATED_IN: "#a596d6",
  LED_TO: "#7c3aed",
  RELATED_TO: "#cbd5e1",
  PURSUED: "#e0a35a",
};
const COL_W = 230;
const ROW_H = 40;

function layout(g: CareerGraph): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const neighbors = new Map<string, string[]>();
  for (const e of g.edges) {
    neighbors.set(e.source, [...(neighbors.get(e.source) ?? []), e.target]);
    neighbors.set(e.target, [...(neighbors.get(e.target) ?? []), e.source]);
  }
  const order = new Map<string, number>();
  NODE_ORDER.forEach((type, col) => {
    const ns = g.nodes.filter((n) => n.type === type);
    // 바리센터 휴리스틱: 이전 열 이웃들의 평균 순서로 정렬해 교차를 줄임
    const bary = (id: string) => {
      const idx = (neighbors.get(id) ?? []).map((x) => order.get(x)).filter((x): x is number => x !== undefined);
      return idx.length ? idx.reduce((a, b) => a + b, 0) / idx.length : Number.MAX_SAFE_INTEGER;
    };
    ns.sort((a, b) => (col === 0 ? b.record_ids.length - a.record_ids.length : bary(a.id) - bary(b.id) || b.record_ids.length - a.record_ids.length));
    const h = ns.length * ROW_H;
    ns.forEach((n, i) => {
      order.set(n.id, i);
      pos.set(n.id, { x: col * COL_W, y: i * ROW_H - h / 2 });
    });
  });
  return pos;
}

export default function GraphPage() {
  return (
    <React.Suspense fallback={<Card className="p-8 text-center"><Spinner /></Card>}>
      <GraphRoute />
    </React.Suspense>
  );
}

function GraphRoute() {
  const sp = useSearchParams();
  const status = useStatus();
  const explore = sp.get("view") === "explore";
  const enabled = !!status?.features?.course_graph;
  const tab = (on: boolean) => `rounded-full px-4 py-1.5 text-sm font-semibold ${on ? "bg-teal-600 text-white" : "border border-[#ead9bf] bg-white text-slate-700"}`;
  return (
    <>
      {enabled && (
        <div className="mb-3 flex gap-2" data-testid="graph-tabs">
          <Link href="/graph" className={tab(!explore)}>선배 경로 그래프</Link>
          <Link href="/graph?view=explore" className={tab(explore)} data-testid="tab-explore">관계 탐색</Link>
        </div>
      )}
      {explore && enabled ? (
        <div>
          <PageTitle title="관계 탐색" description="과목·역량·직무의 연결을 골라 보고, 각 연결의 출처와 검증 상태를 확인하세요." />
          <GraphExplorer initialCenter={sp.get("center")} campus={!!status?.features?.campus_lounge} />
        </div>
      ) : (
        <GraphInner />
      )}
    </>
  );
}

function GraphInner() {
  const sp = useSearchParams();
  const { profile, ready } = useAppState();
  const { byId } = useRecords();
  const [dept, setDept] = React.useState("");
  const [field, setField] = React.useState("");
  const [min, setMin] = React.useState(1);
  const [exp, setExp] = React.useState(true);
  const [g, setG] = React.useState<CareerGraph | null>(null);
  const [sel, setSel] = React.useState<string | null>(null);
  const recordParam = sp.get("record");
  const inited = React.useRef(false);

  React.useEffect(() => {
    if (!ready || inited.current) return;
    inited.current = true;
    if (!recordParam && profile.department) setDept(profile.department);
  }, [ready, profile.department, recordParam]);

  React.useEffect(() => {
    const q = new URLSearchParams({ department: dept, field, min: String(min), exp: exp ? "1" : "0" });
    fetch(`/api/graph?${q}`).then((r) => r.json()).then(setG);
  }, [dept, field, min, exp]);

  // ?record=S-01 → 해당 기록의 Role 노드를 선택해 경로 강조
  React.useEffect(() => {
    if (!g || !recordParam || sel) return;
    const n = g.nodes.find((x) => x.type === "Role" && x.record_ids.includes(recordParam));
    if (n) setSel(n.id);
  }, [g, recordParam, sel]);

  const hl = React.useMemo(() => (g && sel ? highlightForNode(g, sel) : null), [g, sel]);
  const rf = React.useRef<ReactFlowInstance | null>(null);
  const [rfReady, setRfReady] = React.useState(0);
  // 노드 선택 시 강조된 경로로 확대, 해제 시 전체 보기
  React.useEffect(() => {
    const inst = rf.current;
    if (!inst) return;
    const t = setTimeout(() => {
      if (hl) inst.fitView({ nodes: [...hl.nodeIds].map((id) => ({ id })), padding: 0.12, duration: 450 });
      else inst.fitView({ padding: 0.05, duration: 300 });
    }, 120);
    return () => clearTimeout(t);
  }, [hl, rfReady]);
  const pos = React.useMemo(() => (g ? layout(g) : new Map()), [g]);

  const nodes: Node[] = React.useMemo(
    () =>
      (g?.nodes ?? []).map((n) => {
        const dim = hl && !hl.nodeIds.has(n.id);
        const isSel = n.id === sel;
        return {
          id: n.id,
          position: pos.get(n.id) ?? { x: 0, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            label: (
              <div className="flex items-center justify-between gap-1.5" title={`${NODE_LABEL[n.type]} · 근거 기록 ${n.record_ids.join(", ")}`}>
                <span className="truncate">{n.label}</span>
                <span className="shrink-0 rounded bg-white/20 px-1 text-[10px]">{n.record_ids.length}</span>
              </div>
            ),
          },
          style: {
            width: 190,
            fontSize: 12,
            padding: "6px 9px",
            borderRadius: 10,
            border: isSel ? "2px solid #14a3a3" : "1px solid rgba(0,0,0,0.08)",
            background: NODE_COLOR[n.type],
            color: "white",
            opacity: dim ? 0.15 : 1,
            boxShadow: isSel ? "0 0 0 4px rgba(20,163,163,0.25)" : undefined,
            transition: "opacity .2s",
          },
        };
      }),
    [g, pos, hl, sel],
  );

  const edges: Edge[] = React.useMemo(
    () =>
      (g?.edges ?? []).map((e) => {
        const on = hl?.edgeIds.has(e.id);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: !!on && e.type === "LED_TO",
          style: {
            stroke: EDGE_COLOR[e.type],
            strokeWidth: on ? 2.2 : Math.min(1 + e.record_ids.length * 0.4, 3),
            strokeDasharray: e.type === "RELATED_TO" ? "4 4" : undefined,
            opacity: hl ? (on ? 1 : 0.06) : 0.55,
          },
        };
      }),
    [g, hl],
  );

  const selNode = g?.nodes.find((n) => n.id === sel);
  const selEdges = hl && g ? g.edges.filter((e) => hl.edgeIds.has(e.id)) : [];
  const edgeTypeCount = new Map<GraphEdgeType, number>();
  for (const e of selEdges) edgeTypeCount.set(e.type, (edgeTypeCount.get(e.type) ?? 0) + 1);

  return (
    <div>
      <PageTitle title="커리어 그래프" description="선배 기록에서 학과 → 과목 → 역량 → 경험 → 진로 분야 → 직무의 연결을 생성했습니다. 노드를 클릭하면 그 노드에 근거한 선배들의 경로가 강조됩니다." />
      <SyntheticNotice compact className="mb-4" />
      <Card className="mb-4 grid items-end gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
        <div>
          <Label htmlFor="g-dept">학과</Label>
          <Select id="g-dept" value={dept} onChange={(e) => { setDept(e.target.value); setSel(null); }} data-testid="graph-dept">
            <option value="">전체 학과</option>
            {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="g-field">진로 분야</Label>
          <Select id="g-field" value={field} onChange={(e) => { setField(e.target.value); setSel(null); }} data-testid="graph-field">
            <option value="">전체 진로 분야</option>
            {CAREER_FIELDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </Select>
        </div>
        <Slider id="g-min" label="엣지 최소 근거 수" value={min} min={1} max={4} step={1} display={`${min}건 이상`} onChange={setMin} />
        <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={exp} onChange={(e) => setExp(e.target.checked)} className="h-4 w-4 accent-teal-600" /> 경험 노드
        </label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setDept(profile.department ?? ""); setField(profile.interest_fields[0] ?? ""); setSel(null); }} title="내 프로필의 학과·첫 관심 분야로 필터">
            <UserRound className="h-4 w-4" /> 내 기준
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setDept(""); setField(""); setMin(1); setExp(true); setSel(null); }}>
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="relative h-[560px] min-w-0 overflow-hidden md:h-[620px]" data-testid="graph-canvas">
          {!g && <div className="grid h-full place-items-center"><Spinner /></div>}
          {g && (
            <ReactFlow
              key={`${dept}|${field}|${min}|${exp}`}
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.05 }}
              onInit={(i) => {
                rf.current = i;
                setRfReady((x) => x + 1);
              }}
              minZoom={0.1}
              nodesDraggable
              nodesConnectable={false}
              onNodeClick={(_, n) => setSel((s) => (s === n.id ? null : n.id))}
              onPaneClick={() => setSel(null)}
            >
              <Background gap={24} color="#e2e8f0" />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
            {NODE_ORDER.map((t) => (
              <span key={t} className="rounded-md px-2 py-0.5 text-[11px] text-white" style={{ background: NODE_COLOR[t] }}>{NODE_LABEL[t]}</span>
            ))}
          </div>
          {g && <div className="absolute bottom-3 left-14 rounded-md bg-white/90 px-2 py-1 text-[11px] text-slate-500" data-testid="graph-stats">노드 {g.nodes.length} · 엣지 {g.edges.length}</div>}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={selNode ? selNode.label : "노드를 선택하세요"} description={selNode ? `${NODE_LABEL[selNode.type]} · 근거 기록 ${hl?.recordIds.length ?? 0}건` : "진로·직무·역량 노드를 클릭하면 관련 경로와 근거 기록이 표시됩니다"} icon={<GitBranch className="h-4 w-4" />} />
            <div className="max-h-[360px] space-y-2 overflow-y-auto p-4" data-testid="graph-evidence">
              {hl?.recordIds.map((rid) => {
                const r = byId.get(rid);
                if (!r) return null;
                return (
                  <Link key={rid} href={`/seniors/${rid}`} className="block rounded-xl border border-slate-200 p-3 hover:border-teal-400">
                    <div className="flex items-center justify-between">
                      <b className="text-sm text-navy-900">{r.current_role}</b>
                      <RecordBadge id={rid} synthetic={r?.is_synthetic} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{PATH_TYPE_LABEL[r.path_type]}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{recordPathSummary(r)}</p>
                  </Link>
                );
              })}
              {!hl && <p className="text-sm text-slate-400">예: &lsquo;AI·머신러닝&rsquo; 진로 노드를 클릭해 보세요.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="관계의 의미" icon={<Info className="h-4 w-4" />} description="연결은 선배 기록상의 동시 등장·진술이며, 인과관계를 증명하지 않습니다" />
            <ul className="space-y-1.5 p-4 text-xs">
              {(Object.keys(EDGE_MEANING) as GraphEdgeType[]).map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1.5 h-0.5 w-5 shrink-0" style={{ background: EDGE_COLOR[t], borderTop: t === "RELATED_TO" ? "2px dashed #94a3b8" : undefined }} />
                  <span><b className="text-slate-700">{t}</b>{edgeTypeCount.get(t) ? <Badge className="ml-1">{edgeTypeCount.get(t)}</Badge> : null}<br /><span className="text-slate-500">{EDGE_MEANING[t]}</span></span>
                </li>
              ))}
            </ul>
          </Card>
          <a href={`/api/graph?format=cypher&department=${encodeURIComponent(dept)}&field=${field}&min=${min}`} target="_blank" className="block text-center text-xs text-slate-400 hover:text-teal-700" rel="noreferrer">
            Neo4j용 Cypher로 내보내기
          </a>
        </div>
      </div>
    </div>
  );
}
