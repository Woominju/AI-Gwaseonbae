import { NextResponse } from "next/server";
import { getRecord } from "@/lib/data/repository.server";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = getRecord(id);
  return r ? NextResponse.json({ record: r }) : NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
}
