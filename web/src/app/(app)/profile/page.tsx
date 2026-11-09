"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CheckCircle2, RotateCcw, Sparkles, X } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge, Button, Card, CardHeader, Chip, Input, Label, Select, Slider, Textarea } from "@/components/ui";
import { EMPTY_PROFILE, useAppState } from "@/lib/client/store";
import { CAREER_FIELDS, DEPARTMENTS, SKILLS, VALUES, canonicalSkill, skillLabel } from "@/lib/taxonomy";
import { DEMO_PROFILE } from "@/lib/eval/questions";
import type { CareerTypePref, StudentProfile } from "@/lib/types";

const CAREER_TYPES: { id: CareerTypePref; label: string }[] = [
  { id: "employment", label: "기업 취업" },
  { id: "graduate", label: "대학원 진학" },
  { id: "public", label: "공공기관" },
  { id: "global", label: "외국계·해외" },
  { id: "undecided", label: "아직 모르겠어요" },
];

const TIMING = [
  { id: "within_1y", label: "1년 이내" },
  { id: "1_2y", label: "1~2년 후" },
  { id: "2y_plus", label: "2년 이후" },
  { id: "undecided", label: "미정" },
];

function TriState({ value, onChange, label }: { value: boolean | undefined; onChange: (v: boolean | undefined) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-1">
        {[
          [true, "있음"],
          [false, "없음"],
          [undefined, "미입력"],
        ].map(([v, l]) => (
          <Chip key={String(l)} active={value === v} onClick={() => onChange(v as boolean | undefined)} className="px-2.5 py-1 text-xs">
            {l as string}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile, ready } = useAppState();
  const [p, setP] = React.useState<StudentProfile>(profile);
  const [skillText, setSkillText] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    if (ready) setP(profile);
  }, [ready, profile]);

  const up = (patch: Partial<StudentProfile>) => {
    setSaved(false);
    setP((x) => ({ ...x, ...patch }));
  };
  const toggle = <T extends string>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const addSkill = (raw: string) => {
    const items = raw.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    if (items.length) up({ skills: [...new Set([...p.skills, ...items])] });
    setSkillText("");
  };
  const filled = [p.department, p.grade, p.interest_fields.length, p.skills.length, p.career_types.length, p.has_project !== undefined, p.target_timing].filter(Boolean).length;

  const save = (go?: string) => {
    setProfile(p);
    setSaved(true);
    if (go) router.push(go);
  };

  return (
    <div>
      <PageTitle
        title="내 프로필"
        description="모든 항목은 선택입니다. 입력할수록 추천과 비교가 정교해집니다. 실명·학번·연락처는 묻지 않으며, 프로필은 이 브라우저에만 저장됩니다."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setP(DEMO_PROFILE); setSaved(false); }} data-testid="load-demo-profile">
              <Sparkles className="h-4 w-4" /> 시연 프로필 불러오기
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setP(EMPTY_PROFILE); setSaved(false); }}>
              <RotateCcw className="h-4 w-4" /> 초기화
            </Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="기본 정보" description="소속과 학년" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="dept">소속 학과 <Badge tone="amber" className="ml-1">시연용 분류</Badge></Label>
                <Select id="dept" value={p.department ?? ""} onChange={(e) => up({ department: e.target.value || undefined })}>
                  <option value="">선택 안 함</option>
                  {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="grade">학년</Label>
                <Select id="grade" value={p.grade ?? ""} onChange={(e) => up({ grade: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">선택 안 함</option>
                  {[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g}학년</option>)}
                  <option value={5}>초과학기</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="dm">복수전공</Label>
                <Select id="dm" value={p.double_major ?? ""} onChange={(e) => up({ double_major: e.target.value || undefined })}>
                  <option value="">없음/미정</option>
                  {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="minor">부전공</Label>
                <Select id="minor" value={p.minor ?? ""} onChange={(e) => up({ minor: e.target.value || undefined })}>
                  <option value="">없음/미정</option>
                  {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="관심 진로" description="관심 분야와 희망하는 진로 유형 (여러 개 선택 가능)" />
            <div className="space-y-5 p-5">
              <div>
                <Label>관심 진로 분야</Label>
                <div className="flex flex-wrap gap-2" data-testid="interest-fields">
                  {CAREER_FIELDS.map((f) => (
                    <Chip key={f.id} active={p.interest_fields.includes(f.id)} onClick={() => up({ interest_fields: toggle(p.interest_fields, f.id) })}>{f.label}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>희망 진로 유형</Label>
                <div className="flex flex-wrap gap-2">
                  {CAREER_TYPES.map((t) => (
                    <Chip key={t.id} active={p.career_types.includes(t.id)} onClick={() => up({ career_types: toggle(p.career_types, t.id) })}>{t.label}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>목표 진출 시점</Label>
                <div className="flex flex-wrap gap-2">
                  {TIMING.map((t) => (
                    <Chip key={t.id} active={p.target_timing === t.id} onClick={() => up({ target_timing: p.target_timing === t.id ? undefined : (t.id as StudentProfile["target_timing"]) })}>{t.label}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="현재 역량과 경험" description="역량은 자유롭게 입력하면 표준 역량으로 자동 정리됩니다 (예: 파이썬 → Python)" />
            <div className="space-y-4 p-5">
              <div>
                <Label htmlFor="skill">보유 역량</Label>
                <div className="flex gap-2">
                  <Input id="skill" value={skillText} placeholder="예: 파이썬, SQL, 통계, 영어" onChange={(e) => setSkillText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillText); } }} list="skill-suggest" />
                  <Button type="button" variant="outline" onClick={() => addSkill(skillText)}>추가</Button>
                  <datalist id="skill-suggest">{SKILLS.map((s) => <option key={s.id} value={s.label} />)}</datalist>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5" data-testid="skills">
                  {p.skills.map((s) => {
                    const c = canonicalSkill(s);
                    const known = SKILLS.some((k) => k.id === c);
                    return (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs text-navy-800 ring-1 ring-navy-100">
                        {s}
                        {known && skillLabel(c) !== s && <span className="text-slate-400">→ {skillLabel(c)}</span>}
                        {!known && <span className="text-amber-600" title="표준 역량 사전에 없어 자유 텍스트로 사용됩니다">*</span>}
                        <button aria-label={`${s} 삭제`} onClick={() => up({ skills: p.skills.filter((x) => x !== s) })} className="cursor-pointer"><X className="h-3 w-3" /></button>
                      </span>
                    );
                  })}
                  {!p.skills.length && <span className="text-xs text-slate-400">아직 입력한 역량이 없습니다.</span>}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <TriState label="프로젝트 경험" value={p.has_project} onChange={(v) => up({ has_project: v })} />
                <TriState label="인턴십 경험" value={p.has_internship} onChange={(v) => up({ has_internship: v })} />
                <TriState label="연구 경험" value={p.has_research} onChange={(v) => up({ has_research: v })} />
              </div>
              <div>
                <Label htmlFor="exp">경험 메모 (선택)</Label>
                <Textarea id="exp" rows={2} maxLength={1000} value={p.experience_notes ?? ""} placeholder="예: 수업에서 회귀분석 팀 프로젝트를 했어요" onChange={(e) => up({ experience_notes: e.target.value || undefined })} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="선호와 제약조건 (선택)" description="비교·추천에 반영됩니다. 입력하지 않으면 해당 항목은 계산에서 제외됩니다." />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <Slider id="gp" label="대학원 진학 선호도" value={p.grad_school_pref ?? 0.5} display={p.grad_school_pref === undefined ? "미입력" : p.grad_school_pref.toFixed(2)} onChange={(v) => up({ grad_school_pref: v })} />
                {p.grad_school_pref !== undefined && <button className="mt-1 text-xs text-slate-400 hover:text-slate-600" onClick={() => up({ grad_school_pref: undefined })}>입력 취소</button>}
              </div>
              <div>
                <Slider id="fe" label="빠른 취업 선호도" value={p.fast_employment_pref ?? 0.5} display={p.fast_employment_pref === undefined ? "미입력" : p.fast_employment_pref.toFixed(2)} onChange={(v) => up({ fast_employment_pref: v })} />
                {p.fast_employment_pref !== undefined && <button className="mt-1 text-xs text-slate-400 hover:text-slate-600" onClick={() => up({ fast_employment_pref: undefined })}>입력 취소</button>}
              </div>
              <div>
                <Label htmlFor="fin">경제적 제약</Label>
                <Select id="fin" value={p.financial_constraint ?? ""} onChange={(e) => up({ financial_constraint: (e.target.value || undefined) as StudentProfile["financial_constraint"] })}>
                  <option value="">미입력</option>
                  <option value="none">크게 없음</option>
                  <option value="some">어느 정도 있음</option>
                  <option value="strong">큼 (빠른 경제적 독립 필요)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="hours">준비에 투자 가능한 시간 (주당)</Label>
                <Input id="hours" type="number" min={0} max={80} value={p.weekly_hours ?? ""} placeholder="예: 10" onChange={(e) => up({ weekly_hours: e.target.value === "" ? undefined : Math.max(0, Math.min(80, Number(e.target.value))) })} />
              </div>
              <div className="sm:col-span-2">
                <Label>중요하게 생각하는 가치</Label>
                <div className="flex flex-wrap gap-2">
                  {VALUES.map((v) => (
                    <Chip key={v.id} active={p.values.includes(v.id)} onClick={() => up({ values: toggle(p.values, v.id) })}>{v.label}</Chip>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="concern">지금의 고민 (선택)</Label>
                <Textarea id="concern" rows={2} maxLength={1000} value={p.concern ?? ""} placeholder="예: 대학원 진학과 학부 졸업 후 취업 사이에서 고민하고 있어요." onChange={(e) => up({ concern: e.target.value || undefined })} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <p className="text-sm font-semibold text-navy-900">입력 현황</p>
            <p className="mt-1 text-3xl font-bold text-teal-600">{filled}<span className="text-base text-slate-400"> / 7</span></p>
            <p className="mt-1 text-xs text-slate-500">핵심 항목 기준. 비어 있는 항목은 추천 신뢰도에 반영되어 &lsquo;낮음&rsquo;으로 표시될 수 있습니다.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={() => save("/dashboard")} data-testid="save-profile">
                저장하고 추천 보기
              </Button>
              <Button variant="outline" onClick={() => save()}>저장만 하기</Button>
              {saved && <p className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> 저장되었습니다</p>}
            </div>
          </Card>
          <Card className="p-4 text-xs leading-relaxed text-slate-500">
            <b className="text-slate-700">개인정보 안내</b>
            <br />이 프로토타입은 실명·학번·전화번호를 요구하지 않습니다. 프로필은 서버에 저장되지 않고 이 브라우저의 로컬 저장소에만 보관되며, 추천 계산 요청 시에만 서버로 전송됩니다.
          </Card>
        </div>
      </div>
    </div>
  );
}
