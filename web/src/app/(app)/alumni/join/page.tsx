"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Button, Card, Input, Label } from "@/components/ui";
import { api } from "@/lib/client/api";

export default function AlumniJoin() {
  const router = useRouter();
  const [f, setF] = React.useState({ code: "", display_name: "", department: "", graduation_year: "" });
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api("/api/alumni/redeem", "POST", { ...f, graduation_year: Number(f.graduation_year) || null });
      router.push("/alumni/me");
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="선배로 참여하기" description="후배들에게 진로 경험을 나누고, 원하면 질문에 답할 수 있어요." />
      <Card className="mb-4 space-y-2 p-5 text-sm text-slate-600">
        <p className="flex items-center gap-2 font-semibold text-navy-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> 왜 인증 코드가 필요한가요?</p>
        <p>누구나 “선배”라고 주장할 수 없도록, 운영자(학과 사무실·담당 교수 등)가 동문임을 확인한 뒤 1회용 인증 코드를 발급합니다. 이 화면에서 선배 역할을 고르기만 해서는 선배 권한이 생기지 않아요.</p>
        <p>현재 학교와의 동문 인증 협의는 <b>진행 전</b>이에요. 운영자가 발급한 코드가 있을 때만 참여할 수 있습니다. 시연용으로 발급된 코드로 만든 계정은 “시연용 계정”으로 표시되고 실제 동문으로 공개되지 않아요.</p>
      </Card>
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4" data-testid="join-form">
          <div><Label htmlFor="code">인증 코드</Label><Input id="code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="운영자에게 받은 12자리 코드" autoComplete="off" /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label htmlFor="dn">표시 이름</Label><Input id="dn" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} placeholder="예: 김OO 선배" maxLength={20} /></div>
            <div><Label htmlFor="dept">학과</Label><Input id="dept" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} maxLength={30} /></div>
            <div><Label htmlFor="gy">졸업 연도</Label><Input id="gy" inputMode="numeric" value={f.graduation_year} onChange={(e) => setF({ ...f, graduation_year: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></div>
          </div>
          <p className="text-xs text-slate-500">실명·연락처·학번은 입력하지 않아요. 공개 범위는 다음 화면에서 정할 수 있어요(기본: 학생에게만 공개).</p>
          {err && <p className="text-sm text-rose-600" data-testid="join-error">{err}</p>}
          <div className="flex gap-2"><Button type="submit" variant="secondary" disabled={busy || !f.code || !f.display_name} data-testid="join-submit"><KeyRound className="h-4 w-4" /> 인증하고 참여하기</Button><Link href="/alumni"><Button type="button" variant="ghost">게시판으로</Button></Link></div>
        </form>
      </Card>
    </div>
  );
}
