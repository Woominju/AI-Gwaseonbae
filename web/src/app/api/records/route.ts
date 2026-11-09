import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/data/repository.server";

export async function GET() {
  return NextResponse.json({ records: getAllRecords() });
}
