"use client";
import * as React from "react";
import { Database, FileUp, FlaskConical, Play, ShieldCheck, Trash2 } from "lucide-react";
import { PageTitle, useStatus } from "@/components/AppShell";
import { Badge, Button, Card, CardHeader, Input, Select, Spinner, Tabs, Textarea } from "@/components/ui";
import { postJSON } from "@/lib/client/store";

interface ImportResp {
  accepted: { record_id: string; department: string; current_role: string; is_synthetic: boolean }[];
  issues: { row: number; record_id?: string; level: string; message: string }[];
  total: number;
  committed: boolean;
  stored?: number;
}

type MethodRow = { available: boolean; p3: number; r5: number; ndcg5: number; mrr: number; ms: number; per_question: { id: string; top5: string[]; p3: number; mrr: number }[] };
interface RetrievalEval {
  kind: "retrieval";
  file?: string;
  created_at?: string;
  n_questions: number;
  n_records: number;
  ml_available: boolean;
  methods: Record<string, MethodRow>;
}
interface AnswerEval {
  kind: "answers";
  file?: string;
  created_at?: string;
  generator: string;
  summary: { system: string; mean_evidence: number; mean_cited: number; faithfulness: number; personalization_rate: number; refusal_ok_rate: number; balance: number; mean_ms: number }[];
  rows: Record<string, unknown>[];
}

const METHOD_LABEL: Record<string, string> = {
  keyword_bm25: "키워드 (BM25)",
  local_semantic: "로컬 n-gram·개념 확장",
  embedding: "임베딩 (bge-m3)",
  embedding_rerank: "임베딩 + 리랭커",
  hybrid_personalized: "하이브리드 S(x,e)",
};
const SYS_LABEL: Record<string, string> = { A: "A. 비개인화 일반 답변", B: "B. 선배 경험 검색 기반", C: "C. 개인화+그래프+비교" };
const f2 = (x: number) => x.toFixed(2);

function ImportPanel() {
  const [format, setFormat] = React.useState<"json" | "csv">("json");
  const [content, setContent] = React.useState("");
  const [token, setToken] = React.useState("");
  const [res, setRes] = React.useState<ImportResp | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const submit = async (commit: boolean) => {
    setBusy(true);
    setErr(null);
    try {
      setRes(await postJSON<ImportResp>("/api/import", { format, content, commit }, { headers: token ? { "x-admin-token": token } : {} }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="선배 설문 데이터 가져오기" description="CSV 또는 JSON. 먼저 검증(미리보기) 후 저장합니다." icon={<FileUp className="h-4 w-4" />} />
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="형식" value={format} onChange={(e) => setFormat(e.target.value as "json" | "csv")} className="w-32">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </Select>
            <input
              type="file"
              accept=".json,.csv"
              aria-label="파일 선택"
              className="text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFormat(f.name.endsWith(".csv") ? "csv" : "json");
                setContent(await f.text());
              }}
            />
            <a className="text-xs text-teal-700 hover:underline" href="/templates/senior_import_template.json" download>JSON 템플릿</a>
            <a className="text-xs text-teal-700 hover:underline" href="/templates/senior_import_template.csv" download>CSV 템플릿</a>
          </div>
          <Textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} placeholder="여기에 붙여넣거나 파일을 선택하세요" className="font-mono text-xs" data-testid="import-content" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => submit(false)} disabled={busy || !content} data-testid="import-validate">검증 (미리보기)</Button>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="관리자 토큰 (ADMIN_TOKEN 설정 시)" className="w-60" aria-label="관리자 토큰" />
            <Button onClick={() => submit(true)} disabled={busy || !content || !res || res.accepted.length === 0}>저장</Button>
            {busy && <Spinner />}
          </div>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          {res && (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm" data-testid="import-result">
              <p>
                전체 {res.total}건 · <b className="text-emerald-700">통과 {res.accepted.length}</b> · <b className="text-rose-700">거부/격리 {res.issues.length}</b>
                {res.committed && <Badge tone="green" className="ml-2">저장됨 (총 {res.stored}건)</Badge>}
              </p>
              {res.accepted.map((a) => <p key={a.record_id} className="text-xs">✓ {a.record_id} · {a.department} · {a.current_role} · {a.is_synthetic ? "가상" : "실제(동의 완료)"}</p>)}
              {res.issues.map((i, k) => (
                <p key={k} className="text-xs"><Badge tone={i.level === "quarantine" ? "violet" : "rose"}>{i.level === "quarantine" ? "격리" : "오류"}</Badge> {i.row}행 {i.record_id ?? ""} — {i.message}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-4 text-sm text-slate-600">
          <p className="mb-2 flex items-center gap-1.5 font-semibold text-navy-900"><ShieldCheck className="h-4 w-4 text-teal-600" /> 가져오기 검증 규칙</p>
          <ul className="space-y-1 text-xs">
            <li>· 스키마 검증 (DATA_SCHEMA.md)</li>
            <li>· 실제 데이터(is_synthetic=false)는 consent_status=&quot;consented&quot; 필수</li>
            <li>· 전화번호·이메일·학번 형태 정보가 있으면 거부</li>
            <li>· &ldquo;이전 지시 무시&rdquo; 등 지시문(프롬프트 인젝션) 의심 문구는 격리</li>
            <li>· 운영 환경에서는 ADMIN_TOKEN 설정과 접근 통제가 필요합니다</li>
          </ul>
        </Card>
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (!window.confirm("가져온 데이터를 모두 삭제할까요? (가상 시연 데이터는 유지)")) return;
            await fetch("/api/import", { method: "DELETE", headers: token ? { "x-admin-token": token } : {} });
            setRes(null);
          }}
        >
          <Trash2 className="h-4 w-4" /> 가져온 데이터 삭제
        </Button>
      </div>
    </div>
  );
}

function EvalPanel() {
  const status = useStatus();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [ret, setRet] = React.useState<RetrievalEval | null>(null);
  const [ans, setAns] = React.useState<AnswerEval | null>(null);
  const [runs, setRuns] = React.useState<{ file: string; kind: string; created_at: string }[]>([]);
  const loadRuns = () => fetch("/api/eval").then((r) => r.json()).then((j) => setRuns(j.runs ?? []));
  React.useEffect(() => {
    loadRuns();
  }, []);
  const run = async (kind: "retrieval" | "answers", use_llm = false) => {
    setBusy(kind + (use_llm ? "-llm" : ""));
    try {
      const r = await postJSON<RetrievalEval | AnswerEval>("/api/eval", { kind, use_llm });
      if (r.kind === "retrieval") setRet(r);
      else setAns(r);
      loadRuns();
    } finally {
      setBusy(null);
    }
  };
  const open = async (file: string) => {
    const r = await fetch(`/api/eval?file=${file}`).then((x) => x.json());
    if (r.kind === "retrieval") setRet({ ...r, file });
    else setAns({ ...r, file });
  };
  const llmOk = status?.llm.is_llm && status.llm.reachable !== false;
  return (
    <div className="space-y-5">
      <Card className="p-4 text-xs leading-relaxed text-slate-600">
        <b className="text-slate-800">해석 주의</b> — 평가 질문(검색 16문항·응답 8문항)과 정답 레이블은 개발자가 가상 시연 데이터를 보고 직접 정한 것입니다. 표본이 작고 레이블 편향이 있으므로 결과는 <b>기능 점검용 실제 계산값</b>이며 일반화된 성능 주장이 아닙니다. 응답 지표는 자동 계산된 대리 지표이고 사람 평가가 아닙니다.
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run("retrieval")} disabled={!!busy} data-testid="run-retrieval-eval">{busy === "retrieval" ? <Spinner /> : <Play className="h-4 w-4" />} 검색 방식 비교 실행</Button>
        <Button variant="outline" onClick={() => run("answers")} disabled={!!busy}>{busy === "answers" ? <Spinner /> : <Play className="h-4 w-4" />} 응답 시스템 A/B/C 비교 (Demo 템플릿)</Button>
        <Button variant="outline" onClick={() => run("answers", true)} disabled={!!busy || !llmOk} title={llmOk ? "" : "LLM 미연결"}>{busy === "answers-llm" ? <Spinner /> : <Play className="h-4 w-4" />} 응답 비교 (LLM)</Button>
      </div>

      {ret && (
        <Card className="overflow-x-auto" data-testid="retrieval-eval">
          <CardHeader title="검색 방식 비교" description={`질문 ${ret.n_questions}개 · 기록 ${ret.n_records}건 · ${ret.created_at ? new Date(ret.created_at).toLocaleString("ko-KR") : "방금"}${ret.ml_available ? "" : " · ML 사이드카 미연결(임베딩 방식 제외)"}`} />
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr><th className="px-4 py-2">방식</th><th className="px-4 py-2">P@3</th><th className="px-4 py-2">Recall@5</th><th className="px-4 py-2">nDCG@5</th><th className="px-4 py-2">MRR</th><th className="px-4 py-2">평균 지연</th></tr>
            </thead>
            <tbody>
              {Object.entries(ret.methods).map(([k, m]) => (
                <tr key={k} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{METHOD_LABEL[k] ?? k}</td>
                  {m.available ? (
                    <>
                      <td className="px-4 py-2 tabular-nums">{f2(m.p3)}</td>
                      <td className="px-4 py-2 tabular-nums">{f2(m.r5)}</td>
                      <td className="px-4 py-2 tabular-nums">{f2(m.ndcg5)}</td>
                      <td className="px-4 py-2 tabular-nums">{f2(m.mrr)}</td>
                      <td className="px-4 py-2 tabular-nums">{m.ms.toFixed(1)}ms</td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-4 py-2 text-xs text-slate-400">사용 불가 (ML 사이드카 미연결)</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {ans && (
        <Card className="overflow-x-auto" data-testid="answer-eval">
          <CardHeader title="응답 시스템 비교 (자동 대리 지표)" description={`생성 방식: ${ans.generator === "llm" ? "LLM" : "Demo 템플릿"} · ${ans.created_at ? new Date(ans.created_at).toLocaleString("ko-KR") : "방금"}`} />
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">시스템</th>
                <th className="px-4 py-2" title="질문당 평균 근거 기록 수">근거 수</th>
                <th className="px-4 py-2" title="질문당 평균 유효 인용 수">인용 수</th>
                <th className="px-4 py-2" title="인용 중 정답 근거 비율">근거 충실도</th>
                <th className="px-4 py-2" title="답변이 학생 프로필 요소를 언급한 비율">개인화</th>
                <th className="px-4 py-2" title="공식정보·범위밖·인젝션 질문에서 지어내지 않고 거절/안내한 비율">근거부족 처리</th>
                <th className="px-4 py-2" title="비교 질문에서 두 선택지 모두 근거를 갖춘 정도">비교 균형</th>
                <th className="px-4 py-2">평균 지연</th>
              </tr>
            </thead>
            <tbody>
              {ans.summary.map((s) => (
                <tr key={s.system} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{SYS_LABEL[s.system]}</td>
                  <td className="px-4 py-2 tabular-nums">{f2(s.mean_evidence)}</td>
                  <td className="px-4 py-2 tabular-nums">{f2(s.mean_cited)}</td>
                  <td className="px-4 py-2 tabular-nums">{f2(s.faithfulness)}</td>
                  <td className="px-4 py-2 tabular-nums">{f2(s.personalization_rate)}</td>
                  <td className="px-4 py-2 tabular-nums">{f2(s.refusal_ok_rate)}</td>
                  <td className="px-4 py-2 tabular-nums">{f2(s.balance)}</td>
                  <td className="px-4 py-2 tabular-nums">{Math.round(s.mean_ms)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <CardHeader title="저장된 평가 기록" description="web/data/runtime/eval_runs/" icon={<Database className="h-4 w-4" />} />
        <ul className="divide-y divide-slate-100 text-sm">
          {runs.map((r) => (
            <li key={r.file} className="flex items-center justify-between px-4 py-2">
              <span>{new Date(r.created_at).toLocaleString("ko-KR")} · <Badge>{r.kind === "retrieval" ? "검색" : "응답"}</Badge></span>
              <button className="text-xs text-teal-700 hover:underline cursor-pointer" onClick={() => open(r.file)}>보기</button>
            </li>
          ))}
          {!runs.length && <li className="px-4 py-3 text-slate-400">아직 기록이 없습니다.</li>}
        </ul>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = React.useState<"import" | "eval">("eval");
  return (
    <div>
      <PageTitle title="데이터·평가" description="실제 선배 데이터 가져오기와 검색·응답 방식 비교 평가 (개발자·운영자용)" action={<Tabs value={tab} onChange={setTab} items={[{ value: "eval", label: <span className="flex items-center gap-1"><FlaskConical className="h-4 w-4" /> 평가</span> }, { value: "import", label: <span className="flex items-center gap-1"><FileUp className="h-4 w-4" /> 데이터 가져오기</span> }]} />} />
      <p className="-mt-3 mb-4 text-sm"><a href="/admin/alumni" className="text-teal-700 underline" data-testid="admin-alumni-link">선배 인증·경험 검토·AI 시연 모드 →</a></p>
      {tab === "import" ? <ImportPanel /> : <EvalPanel />}
    </div>
  );
}
