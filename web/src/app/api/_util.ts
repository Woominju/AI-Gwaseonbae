import { NextResponse } from "next/server";
import { StudentProfileSchema } from "@/lib/schema";
import type { StudentProfile } from "@/lib/types";

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parseProfile(x: unknown): StudentProfile | null {
  const p = StudentProfileSchema.safeParse(x ?? {});
  return p.success ? (p.data as StudentProfile) : null;
}
