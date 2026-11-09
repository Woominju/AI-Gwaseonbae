import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFeatures } from "@/lib/features";
import "@/styles/world-scenes.css";
import "@/styles/world-avatar.css";

// Feature Flag 는 런타임 환경변수 → 정적 렌더링하지 않는다
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "HUFS 캠퍼스 · AI 과선배" };

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  if (!getFeatures().campus_lounge) notFound();
  return children;
}
