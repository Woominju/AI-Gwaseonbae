import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/data/repository.server";
import { mlConfigured, mlHealth } from "@/lib/retrieval/mlClient";
import { DEMO_INFO, getConfiguredProvider, getProvider } from "@/lib/chat/providers";
import { isPublicDemo } from "@/lib/demoMode";
import { getFeatures } from "@/lib/features";
import { demoStatus } from "@/lib/aiDemo.server";
import { alumniFeature } from "@/lib/auth/guard.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const recs = getAllRecords();
  const ml = await mlHealth(true);
  const p = getProvider();
  let llm_reachable: boolean | null = null;
  if (p?.info.id === "local") {
    try {
      const base = process.env.LOCAL_LLM_BASE_URL ?? "http://127.0.0.1:8009/v1";
      const r = await fetch(`${base}/models`, { signal: AbortSignal.timeout(2000), cache: "no-store" });
      llm_reachable = r.ok;
    } catch {
      llm_reachable = false;
    }
  }
  const pub = isPublicDemo();
  return NextResponse.json({
    public_demo: pub,
    features: { ...getFeatures(), alumni_network: alumniFeature() && !pub },
    ai_demo: (() => { const d = demoStatus(); return { gate: d.gate, active: d.active, remaining_sec: d.remaining_sec, configured_llm: !!getConfiguredProvider() }; })(),
    records: { total: recs.length, synthetic: recs.filter((r) => r.is_synthetic).length, real: recs.filter((r) => !r.is_synthetic).length },
    ml: { configured: mlConfigured(), ok: ml.ok, embed_model: ml.info?.embed_model ?? null, rerank_model: ml.info?.rerank_model ?? null, gpu: pub ? null : (ml.info?.gpu ?? null) },
    llm: p ? { ...p.info, reachable: llm_reachable } : { ...DEMO_INFO, reachable: null },
  });
}
