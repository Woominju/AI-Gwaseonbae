import { NextResponse } from "next/server";
import { isPublicDemo } from "@/lib/demoMode";

const DEMO_404 = () => new NextResponse("Not Found", { status: 404 });
import fs from "node:fs";
import path from "node:path";
import { EVAL_DIR, listEvalRuns, runAnswerEval, runRetrievalEval, saveEvalRun } from "@/lib/eval/runner";

export const maxDuration = 300; // Vercel Hobby 상한(300초)

export async function GET(req: Request) {
  if (isPublicDemo()) return DEMO_404();
  const f = new URL(req.url).searchParams.get("file");
  if (f) {
    if (!/^[\w.-]+\.json$/.test(f)) return NextResponse.json({ error: "bad file" }, { status: 400 });
    try {
      return NextResponse.json(JSON.parse(fs.readFileSync(path.join(EVAL_DIR, f), "utf8")));
    } catch {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }
  return NextResponse.json({ runs: listEvalRuns() });
}

export async function POST(req: Request) {
  if (isPublicDemo()) return DEMO_404();
  const body = await req.json().catch(() => ({}));
  const result = body?.kind === "answers" ? await runAnswerEval({ useLLM: !!body?.use_llm }) : await runRetrievalEval();
  const file = saveEvalRun(result);
  return NextResponse.json({ file, ...result });
}
