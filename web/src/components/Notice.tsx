import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const SYNTHETIC_NOTICE = "본 사례는 서비스 기능 시연을 위한 가상 데이터입니다";

export function SyntheticNotice({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div data-testid="synthetic-notice" className={cn("flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900", compact ? "text-xs" : "text-sm", className)}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <b>{SYNTHETIC_NOTICE}.</b> 실제 한국외대 동문의 기록이 아니며, 학과명은 시연용 분류입니다. 추천 점수는 참고용 관련도이며 합격·취업 가능성을 뜻하지 않습니다.
      </p>
    </div>
  );
}
