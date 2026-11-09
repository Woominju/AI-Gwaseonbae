import { WorldClient } from "./WorldClient";

/** 서버에서 쿼리를 읽어 전달 (Suspense 스트리밍 없이 렌더링). ?place= 는 2.0 호환 */
export default async function CampusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null);
  return <WorldClient sceneId={one(sp.scene) ?? one(sp.place)} senior={one(sp.senior)} ask={one(sp.ask)?.slice(0, 300) ?? null} />;
}
