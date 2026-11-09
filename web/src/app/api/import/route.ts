import { NextResponse } from "next/server";
import { isPublicDemo } from "@/lib/demoMode";

const DEMO_404 = () => new NextResponse("Not Found", { status: 404 });
import fs from "node:fs";
import { parseImport } from "@/lib/data/import";
import { getImportedRecords, IMPORT_DIR, IMPORT_FILE } from "@/lib/data/repository.server";
import { bad } from "../_util";

/**
 * 관리자 Import. ADMIN_TOKEN 이 설정되어 있으면 x-admin-token 헤더가 일치해야 저장(commit)할 수 있다.
 * ADMIN_TOKEN 미설정 시 개발 모드에서만 저장을 허용한다 (운영에서는 반드시 설정).
 */
export async function POST(req: Request) {
  if (isPublicDemo()) return DEMO_404();
  const body = await req.json().catch(() => null);
  const format = body?.format === "csv" ? "csv" : "json";
  if (typeof body?.content !== "string" || body.content.length > 2_000_000) return bad("content(문자열, 2MB 이하)가 필요합니다.");
  const result = parseImport(format, body.content);
  if (!body?.commit) return NextResponse.json({ ...result, committed: false });
  const token = process.env.ADMIN_TOKEN;
  if (token ? req.headers.get("x-admin-token") !== token : process.env.NODE_ENV === "production") return bad("관리자 인증이 필요합니다.", 401);
  const existing = getImportedRecords().filter((r) => !result.accepted.some((a) => a.record_id === r.record_id));
  fs.mkdirSync(IMPORT_DIR, { recursive: true });
  fs.writeFileSync(IMPORT_FILE, JSON.stringify([...existing, ...result.accepted], null, 2));
  return NextResponse.json({ ...result, committed: true, stored: existing.length + result.accepted.length });
}

export async function DELETE(req: Request) {
  if (isPublicDemo()) return DEMO_404();
  const token = process.env.ADMIN_TOKEN;
  if (token ? req.headers.get("x-admin-token") !== token : process.env.NODE_ENV === "production") return bad("관리자 인증이 필요합니다.", 401);
  try {
    fs.unlinkSync(IMPORT_FILE);
  } catch {
    /* none */
  }
  return NextResponse.json({ cleared: true });
}
