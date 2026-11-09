"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowRight, GraduationCap, HeartHandshake, BrainCircuit, CheckCircle2, Compass, GitBranch, Map, MessagesSquare, Scale, Search, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { SyntheticNotice } from "@/components/Notice";
import { useAppState } from "@/lib/client/store";
import { DEMO_PROFILE } from "@/lib/eval/questions";
import { useStatus } from "@/components/AppShell";

const PROBLEMS = [
  { t: "학과 맞춤 정보의 부재", d: "내 학과·복수전공 조합에 맞는 진로 준비 경험을 찾기 어렵습니다." },
  { t: "흩어지는 선배의 경험", d: "선배들의 시행착오와 준비 과정이 체계적으로 쌓이지 않고 사라집니다." },
  { t: "특정 시기에 몰리는 상담", d: "멘토링·상담 기회가 행사 시기에 집중되어 필요할 때 묻기 어렵습니다." },
  { t: "선택지 비교의 어려움", d: "대학원·취업 등 여러 경로를 내 제약조건 기준으로 비교하기 어렵습니다." },
  { t: "맥락 없는 범용 AI 답변", d: "일반 챗봇은 우리 대학·학과의 맥락과 근거를 반영하지 못합니다." },
];

const FEATURES = [
  { icon: GitBranch, t: "Career Knowledge Graph", d: "학과 → 과목 → 역량 → 경험 → 진로 → 직무를 근거 기록과 함께 구조화", href: "/graph" },
  { icon: Search, t: "Explainable Matching", d: "5개 세부 점수로 선배 경험의 관련성을 계산하고 추천 이유와 부족한 요소를 설명", href: "/dashboard" },
  { icon: MessagesSquare, t: "근거 기반 AI 상담", d: "검색된 선배 기록만 근거로 답하고, 인용을 검증하며, 근거가 없으면 인정", href: "/chat" },
  { icon: Scale, t: "Career Scenario Explorer", d: "우선순위가 바뀌면 진로 선택지의 평가와 결정 요인이 실제로 다시 계산", href: "/compare" },
  { icon: Map, t: "실행 로드맵", d: "1·3·6·12개월 행동 계획을 근거와 함께 만들고 진행 상황을 저장", href: "/roadmap" },
];

export default function Landing() {
  const router = useRouter();
  const { setProfile, hasProfile } = useAppState();
  const status = useStatus();
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-navy-700 text-white">
              <Compass className="h-5 w-5" />
            </span>
            <span className="font-bold text-navy-900">AI 과선배 <span className="ml-1 text-xs font-medium text-slate-400">HUFS Career Atlas</span></span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="hidden sm:inline-flex">대시보드</Button>
            <Button size="sm" onClick={() => router.push(hasProfile ? "/dashboard" : "/profile")}>시작하기</Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-teal-100">
              <Sparkles className="h-3.5 w-3.5" /> 근거 기반 진로 의사결정 지원 플랫폼 · 프로토타입
            </p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              선배들의 경험을 연결하고,
              <br />
              <span className="text-teal-500">나만의 진로 경로</span>를 설계하다.
            </h1>
            <p className="mt-5 max-w-xl text-navy-100/90">
              AI 과선배는 선배들의 진로 경험을 지식 그래프로 구조화하고, 학생의 전공·역량·목표·제약조건에 맞는 경험을 찾아 여러 진로 선택지를 근거와 함께 비교합니다. 정답을 정해주는 챗봇이 아니라, 스스로 결정할 수 있도록 돕는 도구입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" onClick={() => router.push("/profile")} data-testid="cta-start">
                내 프로필로 시작하기 <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  setProfile(DEMO_PROFILE);
                  router.push("/dashboard");
                }}
                data-testid="cta-demo"
              >
                시연 프로필(수학과 3학년)로 둘러보기
              </Button>
              {status?.features?.campus_lounge && (
                <Button size="lg" variant="outline" className="border-teal-300/60 bg-teal-500/20 text-white hover:bg-teal-500/30" onClick={() => router.push("/campus")} data-testid="cta-campus">
                  캠퍼스에서 선배 만나기
                </Button>
              )}
            </div>
          </div>
          <Card className="animate-fade-up self-center border-white/10 bg-white/95 p-5 text-slate-800 [animation-delay:120ms]">
            <p className="mb-3 text-xs font-semibold text-teal-700">이렇게 동작합니다</p>
            <ol className="space-y-3 text-sm">
              {[
                [UserRound, "프로필 입력", "학과·학년·관심 분야·역량·제약조건"],
                [Users, "선배 경험 매칭", "재현 가능한 점수 + 추천 이유"],
                [GitBranch, "경로 탐색", "역량·활동·진로의 연결을 그래프로"],
                [Scale, "선택지 비교", "우선순위에 따라 다시 계산"],
                [Map, "로드맵 저장", "체크하며 실행"],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof UserRound;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><I className="h-4 w-4" /></span>
                    <span>
                      <b className="text-navy-900">{t as string}</b>
                      <span className="block text-slate-500">{d as string}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </section>

      {status?.features?.campus_lounge && <RoleSelect alumni={!!status?.features?.alumni_network} />}

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-xl font-bold text-navy-900">학생들이 겪는 문제</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PROBLEMS.map((p) => (
            <Card key={p.t} className="p-4">
              <p className="font-semibold text-navy-900">{p.t}</p>
              <p className="mt-1.5 text-sm text-slate-500">{p.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-navy-50/60">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-xl font-bold text-navy-900">주요 기능</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, t, d, href }) => (
              <Link key={t} href={href} className="group">
                <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
                  <Icon className="h-6 w-6 text-teal-600" />
                  <p className="mt-3 font-semibold text-navy-900">{t}</p>
                  <p className="mt-1 text-sm text-slate-500">{d}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700">열어보기 <ArrowRight className="h-3.5 w-3.5" /></p>
                </Card>
              </Link>
            ))}
            <Card className="p-5">
              <BrainCircuit className="h-6 w-6 text-navy-700" />
              <p className="mt-3 font-semibold text-navy-900">일반 AI 챗봇과 무엇이 다른가요?</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {["선배 경험을 관계로 구조화해 검색 (Structured Experience Retrieval)", "추천 점수를 항목별로 공개 (Explainable Personalization)", "대안과 제약조건을 비교 (Decision Support)"].map((x) => (
                  <li key={x} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{x}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy-900"><ShieldCheck className="h-5 w-5 text-teal-600" /> 신뢰성 원칙</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>· 기존 진로 상담과 동문 멘토링을 대체하지 않고 보완합니다.</li>
              <li>· 선배의 진술과 AI의 분석을 구분해 표시합니다.</li>
              <li>· 취업 확률·연봉·합격률을 만들어내지 않습니다.</li>
              <li>· 공식 학사·채용 정보가 없으면 추정하지 않고 확인을 안내합니다.</li>
              <li>· 실명·학번·연락처를 요구하지 않으며, 프로필은 내 브라우저에만 저장됩니다.</li>
            </ul>
          </div>
          <SyntheticNotice className="self-start" />
        </div>
      </section>
      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        AI 과선배 (HUFS Career Atlas) · AI 캠퍼스 바이브코딩 경진대회 출품용 프로토타입 · 학교 공식 서비스가 아닙니다
      </footer>
    </div>
  );
}

function RoleSelect({ alumni }: { alumni: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const startStudent = async () => {
    setBusy(true);
    try {
      await fetch("/api/session/student", { method: "POST" });
    } finally {
      setBusy(false);
    }
    router.push(localStorage.getItem("hufs-atlas:wardrobe:v1") ? "/campus?scene=hub" : "/wardrobe?step=create");
  };
  return (
    <section className="relative -mt-8 px-5" data-testid="role-select">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
        <button onClick={startStudent} disabled={busy} className="group flex cursor-pointer items-center gap-4 rounded-[22px] border border-[#ead9bf] bg-[#fffaf2] p-5 text-left shadow-[0_10px_30px_rgba(120,90,50,0.15)] transition hover:-translate-y-0.5" data-testid="role-student">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 text-white shadow"><GraduationCap className="h-7 w-7" /></span>
          <span>
            <b className="block text-lg text-navy-900">학생으로 시작</b>
            <span className="text-sm text-slate-600">내 캐릭터를 만들고 캠퍼스를 돌아다니며 AI 선배와 진로 이야기를 나눠요. 로그인·개인정보 없이 시작해요.</span>
          </span>
          <ArrowRight className="ml-auto h-5 w-5 text-teal-700 transition group-hover:translate-x-1" />
        </button>
        <button onClick={() => router.push(alumni ? "/alumni/join" : "/alumni")} disabled={!alumni} className="group flex cursor-pointer items-center gap-4 rounded-[22px] border border-[#ead9bf] bg-[#fffaf2] p-5 text-left shadow-[0_10px_30px_rgba(120,90,50,0.15)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" data-testid="role-alumni">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow"><HeartHandshake className="h-7 w-7" /></span>
          <span>
            <b className="block text-lg text-navy-900">선배로 참여</b>
            <span className="text-sm text-slate-600">{alumni ? "운영자가 발급한 인증 코드로 확인된 선배만 경험을 등록하고 후배 질문에 답할 수 있어요." : "선배 참여 기능은 이 환경에서 꺼져 있어요."}</span>
          </span>
          <ArrowRight className="ml-auto h-5 w-5 text-amber-700 transition group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
