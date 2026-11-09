"use client";
/**
 * 서비스 이름 후보 선호도 간이 조사 (파일럿용 UI).
 * 응답은 이 브라우저에만 저장되며 서버로 보내지 않는다 → 현재 집계 결과는 없다.
 * 실제 조사 시에는 동의 절차·서버 집계를 별도로 구성한다 (docs/BRANDING_REVIEW.md).
 */
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Chip, Textarea } from "@/components/ui";
import { LOUNGE_KEYS } from "@/lib/lounge/avatar";

export const NAME_CANDIDATES = ["AI 과선배", "HUFS 선배마을", "선배랑", "선배에게 물어봐", "미래선배", "HUFS Career Lounge", "미래를 고민해 주는 AI 선배"];

export function NamingSurvey() {
  const [pick, setPick] = React.useState<string[]>([]);
  const [why, setWhy] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(LOUNGE_KEYS.naming) ?? "null");
      if (v?.pick) { setPick(v.pick); setWhy(v.why ?? ""); setSaved(true); }
    } catch { /* ignore */ }
  }, []);
  const toggle = (n: string) => { setSaved(false); setPick((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= 2 ? [p[1], n] : [...p, n])); };
  return (
    <div className="space-y-3" data-testid="naming-survey">
      <p className="text-sm text-slate-600">마음에 드는 이름을 <b>최대 2개</b> 골라 주세요. (현재 서비스 이름은 바뀌지 않습니다)</p>
      <div className="flex flex-wrap gap-2">{NAME_CANDIDATES.map((n) => <Chip key={n} active={pick.includes(n)} onClick={() => toggle(n)}>{n}</Chip>)}</div>
      <Textarea rows={2} maxLength={200} value={why} onChange={(e) => { setSaved(false); setWhy(e.target.value); }} placeholder="고른 이유 (선택, 개인정보는 적지 마세요)" />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" disabled={!pick.length} onClick={() => { localStorage.setItem(LOUNGE_KEYS.naming, JSON.stringify({ pick, why: why.slice(0, 200), at: new Date().toISOString() })); setSaved(true); }}>응답 저장</Button>
        {saved && <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> 이 브라우저에 저장됨 (서버 전송·집계 없음)</span>}
      </div>
      <p className="text-[11px] text-slate-400">아직 실제 이용자 조사를 하지 않았으므로 어떤 이름이 선호되는지에 대한 결과는 없습니다.</p>
    </div>
  );
}
