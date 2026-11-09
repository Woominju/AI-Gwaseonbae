import "server-only";
/**
 * Q&A 저장소 (JSON 파일, 단일 프로세스 전제 — alumni 저장소와 같은 방식).
 *   위치: web/data/qa/store.json (Git 제외, 권한 600). 운영 시 DB·백업으로 교체 필요.
 *   공개 시연 모드에서는 저장소를 읽지 않고 가상 시연 Q&A 만 사용한다.
 */
import fs from "node:fs";
import path from "node:path";
import seed from "@/data/qa.synthetic.json";
import { isPublicDemo } from "../demoMode";
import { detectPII, QaItemSchema, ragEligible, type QaCreate, type QaItem } from "./schema";

const DIR = path.join(process.cwd(), "data", "qa");
const FILE = path.join(DIR, "store.json");

const syntheticItems: QaItem[] = (seed as unknown[]).map((x) => QaItemSchema.parse(x));

export function getSyntheticQa(): QaItem[] {
  return syntheticItems;
}

function load(): QaItem[] {
  try {
    const arr = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return (Array.isArray(arr) ? arr : []).flatMap((x) => {
      const p = QaItemSchema.safeParse(x);
      return p.success ? [p.data] : [];
    });
  } catch {
    return [];
  }
}

function save(items: QaItem[]) {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(items, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, FILE);
}

export function listQa(): QaItem[] {
  return load();
}

export function createQa(input: QaCreate): QaItem {
  const items = load();
  const n = items.reduce((m, i) => Math.max(m, Number(i.question_id.slice(2))), 100) + 1;
  if (n > 999) throw new Error("Q&A 저장 한도(899건)에 도달했습니다. DB 전환이 필요합니다.");
  const now = new Date().toISOString();
  const item: QaItem = { ...input, question_id: `Q-${n}`, verified_status: "pending", is_synthetic: false, created_at: now, updated_at: now, pii_checked: false, reviewed_by: null, review_note: "" };
  save([...items, item]);
  return item;
}

export type ReviewResult = { ok: true; item: QaItem } | { ok: false; error: string; status: number };

/** 관리자 검토: 승인에는 개인정보 확인이 필수이며, 자동 점검에 걸리면 승인할 수 없다 */
export function reviewQa(id: string, action: "verify" | "reject" | "withdraw", by: string, note: string, piiChecked: boolean): ReviewResult {
  const items = load();
  const item = items.find((i) => i.question_id === id);
  if (!item) return { ok: false, error: "해당 Q&A 를 찾을 수 없습니다.", status: 404 };
  if (action === "verify") {
    if (item.verified_status !== "pending") return { ok: false, error: "대기 상태만 승인할 수 있습니다.", status: 409 };
    if (!piiChecked) return { ok: false, error: "개인정보 확인 후에만 승인할 수 있습니다.", status: 400 };
    const found = detectPII(`${item.question_text}\n${item.answer_text}\n${item.source_reference}`);
    if (found.length) return { ok: false, error: `개인정보로 보이는 내용이 있습니다: ${found.join(", ")}. 삭제 후 다시 등록해 주세요.`, status: 422 };
    item.verified_status = "verified";
    item.pii_checked = true;
  } else if (action === "reject") {
    item.verified_status = "rejected";
  } else {
    item.verified_status = "withdrawn";
    item.consent_status = "withdrawn";
  }
  item.reviewed_by = by.slice(0, 40);
  item.review_note = note.slice(0, 300);
  item.updated_at = new Date().toISOString();
  save(items);
  return { ok: true, item };
}

/** 익명 사용자는 students_only 실제 Q&A 를 볼 수 없다 */
export type QaAudience = "anonymous" | "student";

/** 검색 대상: 공개 시연은 가상 데이터만, 그 외에는 승인·동의·공개 범위를 호출 시점의 저장소에서 확인한다 */
export function getRagQa(audience: QaAudience = "anonymous"): QaItem[] {
  if (isPublicDemo()) return syntheticItems.filter(ragEligible);
  return [...syntheticItems, ...load()].filter((i) => ragEligible(i) && (audience === "student" || i.is_synthetic || i.visibility === "public"));
}
