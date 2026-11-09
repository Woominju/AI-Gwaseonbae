import { Badge } from "./ui";

/** 선배 기록 출처 배지: 가상 시연 데이터 / 검증된 실제 선배 (is_synthetic 기준, 없으면 ID 접두어로 판정) */
export function RecordBadge({ id, synthetic }: { id: string; synthetic?: boolean }) {
  const syn = synthetic ?? /^S-/.test(id);
  return syn ? <Badge tone="amber">가상 {id}</Badge> : <Badge tone="green" title="관리자가 승인한 검증된 실제 선배의 자기 보고">실제 선배 {id}</Badge>;
}
