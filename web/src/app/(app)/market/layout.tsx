import { notFound } from "next/navigation";
import { getFeatures } from "@/lib/features";

export const dynamic = "force-dynamic";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  if (!getFeatures().career_intel) notFound();
  return children;
}
