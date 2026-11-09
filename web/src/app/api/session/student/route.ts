import { NextResponse } from "next/server";
import { getSession, newSession, randomId, setSession } from "@/lib/auth/session.server";

/** 학생으로 시작: 익명 학생 세션 (개인정보 없음). 기존 학생 세션이면 유지. 선배·관리자 세션은 학생으로 바꾼다(로그아웃 효과). */
export async function POST() {
  const s = await getSession();
  if (s?.role === "student") return NextResponse.json({ role: "student" });
  await setSession(newSession("student", randomId("st")));
  return NextResponse.json({ role: "student" });
}
