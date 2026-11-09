import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFeatures } from "@/lib/features";
import "@/styles/world-avatar.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "나의 옷장 · AI 과선배" };

export default function WardrobeLayout({ children }: { children: React.ReactNode }) {
  if (!getFeatures().campus_lounge) notFound();
  return children;
}
