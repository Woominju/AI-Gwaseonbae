import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/lib/client/store";

// 외부 폰트 서버 없이도 시연 가능하도록 시스템 한글 폰트 스택 사용 (globals.css --font-sans)
export const metadata: Metadata = {
  title: "AI 과선배 · HUFS Career Atlas",
  description: "선배들의 경험을 연결하고, 나만의 진로 경로를 설계하다. — 근거 기반 진로 의사결정 지원 프로토타입",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

/**
 * 화면 스크립트(/_next/static)를 받지 못하면 React 가 시작되지 않아 안내를 띄울 수 없다.
 * 서버 재배포 중 예전 HTML 을 받았을 때 끝없는 '확인 중' 대신 안내를 보이도록 React 밖에서 감지한다.
 */
const ASSET_WATCH = `addEventListener("error",function(e){var t=e.target,u=t&&(t.src||t.href);if(!u||!(t.tagName==="SCRIPT"||t.tagName==="LINK")||u.indexOf("/_next/static/")<0||document.getElementById("asset-error"))return;var d=document.createElement("div");d.id="asset-error";d.setAttribute("role","alert");d.setAttribute("data-testid","asset-error");d.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;padding:12px 16px;border-radius:14px;background:#fffaf2;border:1px solid #ead9bf;color:#334155;font-size:14px;box-shadow:0 8px 28px rgba(120,90,50,.18)";d.textContent="화면 파일을 불러오지 못했어요. 새로고침해 주세요. 계속되면 서비스 업데이트 중일 수 있어요.";(document.body||document.documentElement).appendChild(d)},true);`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: ASSET_WATCH }} />
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
