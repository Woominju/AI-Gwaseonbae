import { notFound } from "next/navigation";
import { isPublicDemo } from "@/lib/demoMode";

// 런타임에 판정 (빌드 시점 정적화 방지)
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (isPublicDemo()) notFound(); // 미들웨어와 별개로 서버에서 한 번 더 차단
  return <>{children}</>;
}
