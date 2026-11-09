/**
 * 실제 선배 설문 데이터 Import (CSV / JSON) — 순수 함수.
 *
 * 검증 단계
 *   1) 파싱 (CSV 는 RFC4180 따옴표 규칙 지원)
 *   2) 스키마 검증 (SeniorRecordSchema)
 *   3) 개인정보·동의 확인: is_synthetic=false 인 기록은 consent_status="consented" 여야 저장 가능
 *   4) 직접 식별정보 패턴(전화번호·이메일·학번 형태) 탐지 → 거부
 *   5) 프롬프트 인젝션 패턴 탐지 → 격리(quarantine), 저장하지 않음
 *
 * CSV 열 규칙: 단순 목록은 '|' 로 구분, 구조화 필드(courses, projects, internships,
 * career_decisions, preparation_timeline, academic_background, evidence_source)는 JSON 문자열.
 */
import { SeniorRecordSchema } from "../schema";
import type { SeniorRecord } from "../types";
import { scanObject } from "../security/injection";

export interface ImportIssue {
  row: number;
  record_id?: string;
  level: "error" | "quarantine";
  message: string;
}

export interface ImportResult {
  accepted: SeniorRecord[];
  issues: ImportIssue[];
  total: number;
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const LIST_FIELDS = ["career_field", "key_skills", "certifications", "difficulties", "lessons_learned", "advice", "context_tags"];
const JSON_FIELDS = ["academic_background", "courses", "projects", "internships", "career_decisions", "preparation_timeline", "evidence_source"];

export function csvToObjects(text: string): Record<string, unknown>[] {
  const [header, ...rows] = parseCSV(text);
  if (!header) return [];
  const h = header.map((x) => x.trim());
  return rows.map((r) => {
    const o: Record<string, unknown> = {};
    h.forEach((k, i) => {
      const v = (r[i] ?? "").trim();
      if (LIST_FIELDS.includes(k)) o[k] = v ? v.split("|").map((x) => x.trim()).filter(Boolean) : [];
      else if (JSON_FIELDS.includes(k)) {
        try {
          o[k] = v ? JSON.parse(v) : k === "academic_background" || k === "evidence_source" ? undefined : [];
        } catch {
          o[k] = { __invalid_json: v };
        }
      } else if (k === "graduation_year") o[k] = v ? Number(v) : undefined;
      else if (k === "months_to_first_role") o[k] = v === "" ? null : Number(v);
      else if (k === "is_synthetic" || k === "department_is_demo_category") o[k] = /^(true|1|y|yes)$/i.test(v);
      else o[k] = v || undefined;
    });
    return o;
  });
}

const PII = [
  { re: /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/, label: "전화번호" },
  { re: /[\w.+-]+@[\w-]+\.[\w.]+/, label: "이메일" },
  { re: /\b20\d{2}\d{5,6}\b/, label: "학번 형태 숫자" },
];

export function validateImport(items: unknown[]): ImportResult {
  const accepted: SeniorRecord[] = [];
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();
  items.forEach((raw, idx) => {
    const row = idx + 1;
    const p = SeniorRecordSchema.safeParse(raw);
    if (!p.success) {
      issues.push({ row, level: "error", message: p.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") });
      return;
    }
    const r = p.data as SeniorRecord;
    if (seen.has(r.record_id)) {
      issues.push({ row, record_id: r.record_id, level: "error", message: "record_id 중복" });
      return;
    }
    if (!r.is_synthetic && r.consent_status !== "consented") {
      issues.push({ row, record_id: r.record_id, level: "error", message: `실제 데이터는 consent_status='consented' 여야 합니다 (현재 '${r.consent_status}')` });
      return;
    }
    if (r.is_synthetic && r.evidence_source.type !== "synthetic_demo") {
      issues.push({ row, record_id: r.record_id, level: "error", message: "가상 데이터의 evidence_source.type 은 synthetic_demo 여야 합니다" });
      return;
    }
    const flat = JSON.stringify(r);
    const pii = PII.filter((x) => x.re.test(flat)).map((x) => x.label);
    if (pii.length) {
      issues.push({ row, record_id: r.record_id, level: "error", message: `직접 식별 가능 정보 의심: ${pii.join(", ")} — 제거 후 다시 올려주세요` });
      return;
    }
    const inj = scanObject(r);
    if (inj.length) {
      issues.push({ row, record_id: r.record_id, level: "quarantine", message: `지시문(프롬프트 인젝션) 의심 문구 ${inj.length}건 (${inj[0].path}: "${inj[0].excerpt}") — 격리, 저장하지 않음` });
      return;
    }
    seen.add(r.record_id);
    accepted.push(r);
  });
  return { accepted, issues, total: items.length };
}

export function parseImport(format: "json" | "csv", content: string): ImportResult {
  let items: unknown[];
  try {
    if (format === "json") {
      const j = JSON.parse(content);
      items = Array.isArray(j) ? j : [j];
    } else items = csvToObjects(content);
  } catch (e) {
    return { accepted: [], issues: [{ row: 0, level: "error", message: `파싱 실패: ${(e as Error).message}` }], total: 0 };
  }
  return validateImport(items);
}
