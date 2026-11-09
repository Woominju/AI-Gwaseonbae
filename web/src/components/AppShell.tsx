"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { BarChart3, BookUser, BriefcaseBusiness, Compass, DoorOpen, School, Shirt, Users, FlaskConical, GitBranch, LayoutDashboard, Map, Menu, MessagesSquare, Scale, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/client/store";
import { Badge } from "./ui";

const NAV = [
  { href: "/dashboard", label: "진로 대시보드", icon: LayoutDashboard },
  { href: "/profile", label: "내 프로필", icon: UserRound },
  { href: "/graph", label: "커리어 그래프", icon: GitBranch },
  { href: "/chat", label: "AI 과선배 상담", icon: MessagesSquare },
  { href: "/compare", label: "진로 비교", icon: Scale },
  { href: "/roadmap", label: "나의 로드맵", icon: Map },
  { href: "/seniors", label: "선배 경험 DB", icon: BookUser },
  { href: "/admin", label: "데이터·평가", icon: FlaskConical },
];
// '/admin/alumni' 는 '/admin' 메뉴 하위 링크로 접근
/** Feature Flag 로만 노출되는 신규 메뉴 */
const NAV_FLAGGED = [
  { href: "/market", label: "Career Market", icon: BriefcaseBusiness, flag: "career_intel" as const, after: "/roadmap" },
  { href: "/campus", label: "HUFS 선배마을", icon: School, flag: "campus_lounge" as const, after: "/chat" },
  { href: "/wardrobe", label: "나의 옷장", icon: Shirt, flag: "campus_lounge" as const, after: "/campus" },
  { href: "/alumni", label: "선배 네트워크", icon: Users, flag: "alumni_network" as const, after: "/seniors" },
];

interface Status {
  public_demo?: boolean;
  features?: { campus_lounge: boolean; career_intel: boolean; course_graph?: boolean; alumni_network?: boolean };
  ai_demo?: { gate: boolean; active: boolean; remaining_sec: number; configured_llm: boolean };
  records: { total: number; synthetic: number; real: number };
  ml: { ok: boolean; embed_model: string | null; gpu: string | null };
  llm: { id: string; label: string; is_llm: boolean; reachable: boolean | null };
}

function isStatus(x: unknown): x is Status {
  const o = x as Partial<Status> | null;
  return !!o && typeof o === "object" && !!o.llm && !!o.records && !!o.ml;
}

/**
 * 서버 상태 조회. 실패·무응답·형식 오류(429 JSON, 프록시 HTML)는 failed 로 알려 준다.
 * (3.0 에서는 실패 시 영원히 '확인 중'이거나, 형식이 다른 JSON 에서 화면 전체가 중단됐다)
 */
export function useStatusState(): { status: Status | null; failed: boolean } {
  const [st, setSt] = React.useState<{ status: Status | null; failed: boolean }>({ status: null, failed: false });
  React.useEffect(() => {
    let live = true;
    fetch("/api/status", { signal: AbortSignal.timeout(10_000) })
      .then((r) => r.json())
      .then((j: unknown) => { if (live) setSt(isStatus(j) ? { status: j, failed: false } : { status: null, failed: true }); })
      .catch(() => { if (live) setSt({ status: null, failed: true }); });
    return () => { live = false; };
  }, []);
  return st;
}

export function useStatus() {
  return useStatusState().status;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  const { status, failed: statusFailed } = useStatusState();
  const checking = statusFailed ? "확인 실패" : "확인 중";
  const { profile, hasProfile } = useAppState();
  React.useEffect(() => setOpen(false), [path]);
  const [ret, setRet] = React.useState<{ place: string } | null>(null);
  React.useEffect(() => {
    try {
      const r = JSON.parse(sessionStorage.getItem("hufs-atlas:lounge:return:v1") ?? "null");
      setRet(r && typeof r.place === "string" && /^[a-z_]{3,20}$/.test(r.place) ? r : null);
    } catch {
      setRet(null);
    }
  }, [path]);
  const llmOk = status?.llm.is_llm && status.llm.reachable !== false;

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.flatMap((n) => { const extra = NAV_FLAGGED.filter((f) => f.after === n.href && status?.features?.[f.flag]); return [n, ...extra.flatMap((e) => [e, ...NAV_FLAGGED.filter((g) => g.after === e.href && status?.features?.[g.flag])])]; }).filter((n) => !(status?.public_demo && n.href === "/admin")).map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== "/dashboard" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-white/10 text-white" : "text-navy-100/80 hover:bg-white/5 hover:text-white")}
          >
            <Icon className={cn("h-4 w-4", active ? "text-teal-500" : "")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {/* sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 bg-navy-900 px-4 py-5 transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-navy-600 text-white">
            <Compass className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-bold text-white">AI 과선배</span>
            <span className="block text-[11px] tracking-wide text-navy-100/60">HUFS Career Atlas</span>
          </span>
        </Link>
        {nav}
        <div className="absolute inset-x-4 bottom-5 space-y-2 rounded-xl bg-white/5 p-3 text-xs text-navy-100/80">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> 선배 기록 {status?.records.total ?? "-"}건 (가상 {status?.records.synthetic ?? "-"})
          </div>
          <div>검색: {status ? (status.ml.ok ? "임베딩+리랭커 (GPU)" : "로컬 검색 (API 불필요)") : checking}</div>
          <div>응답: {status ? (llmOk ? status.llm.label : "Demo Mode (LLM 미사용)") : checking}</div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* topbar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="메뉴 열기">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="hidden text-sm text-slate-500 sm:inline">선배들의 경험을 연결하고, 나만의 진로 경로를 설계하다.</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="amber" title="모든 선배 기록은 가상 시연 데이터입니다">가상 시연 데이터</Badge>
          {status && (llmOk ? <Badge tone="violet">{status.llm.id === "local" ? "로컬 LLM" : "클라우드 LLM"}</Badge> : <Badge tone="slate">Demo Mode</Badge>)}
          <Link href="/profile" className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-teal-500 sm:flex">
            <UserRound className="h-3.5 w-3.5" />
            {hasProfile ? [profile.department, profile.grade ? `${profile.grade}학년` : ""].filter(Boolean).join(" ") || "프로필" : "프로필 미입력"}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      {ret && status?.features?.campus_lounge && (
        <Link href={`/campus?scene=${ret.place}`} className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-teal-700" data-testid="return-lounge">
          <DoorOpen className="h-4 w-4" /> 선배마을로 돌아가기
        </Link>
      )}
    </div>
  );
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
