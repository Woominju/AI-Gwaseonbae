import { notFound } from "next/navigation";
import { alumniFeature } from "@/lib/auth/guard.server";

export const dynamic = "force-dynamic";

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  if (!alumniFeature()) notFound();
  return children;
}
