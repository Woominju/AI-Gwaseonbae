import type { JSX } from "react";
import { getScene, type SceneId } from "@/lib/world/world";
import { KitDefs } from "./kit";
import { HubBack, HubFront } from "./scenes/Hub";
import { SeoulYardBack, SeoulYardFront } from "./scenes/SeoulYard";
import { SeoulLibraryBack, SeoulLibraryFront } from "./scenes/SeoulLibrary";
import { SeoulCafeBack, SeoulCafeFront } from "./scenes/SeoulCafe";
import { SeoulCounselBack, SeoulCounselFront } from "./scenes/SeoulCounsel";
import { GlobalLakeBack, GlobalLakeFront } from "./scenes/GlobalLake";
import { GlobalLibraryBack, GlobalLibraryFront } from "./scenes/GlobalLibrary";
import { GlobalLoungeBack, GlobalLoungeFront } from "./scenes/GlobalLounge";
import { GlobalCounselBack, GlobalCounselFront } from "./scenes/GlobalCounsel";

type Renderer = { back: (p: { lampOn: boolean }) => JSX.Element; front?: () => JSX.Element };

const REGISTRY: Record<SceneId, Renderer> = {
  hub: { back: () => <HubBack />, front: () => <HubFront /> },
  seoul_yard: { back: () => <SeoulYardBack />, front: () => <SeoulYardFront /> },
  seoul_library: { back: ({ lampOn }) => <SeoulLibraryBack lampOn={lampOn} />, front: () => <SeoulLibraryFront /> },
  seoul_cafe: { back: () => <SeoulCafeBack />, front: () => <SeoulCafeFront /> },
  seoul_counsel: { back: () => <SeoulCounselBack />, front: () => <SeoulCounselFront /> },
  global_lake: { back: () => <GlobalLakeBack />, front: () => <GlobalLakeFront /> },
  global_library: { back: ({ lampOn }) => <GlobalLibraryBack lampOn={lampOn} />, front: () => <GlobalLibraryFront /> },
  global_lounge: { back: () => <GlobalLoungeBack />, front: () => <GlobalLoungeFront /> },
  global_counsel: { back: () => <GlobalCounselBack />, front: () => <GlobalCounselFront /> },
};

/** 장면 일러스트. 장면 좌표(0..width × 0..600)의 <g> 를 돌려준다(<svg> 래퍼는 호출 측이 제공). */
export function SceneArt({ scene, lampOn = true, layer = "back" }: { scene: SceneId; lampOn?: boolean; layer?: "back" | "front" }): JSX.Element {
  const r = REGISTRY[scene] ?? REGISTRY.hub;
  if (layer === "front") {
    return <g className="w3-scene-front" pointerEvents="none">{r.front ? r.front() : null}</g>;
  }
  return (
    <g className={`w3-scene w3-scene-${scene}`}>
      <KitDefs />
      {r.back({ lampOn })}
    </g>
  );
}

/** 메뉴 카드용 썸네일(완성된 <svg>) */
export function SceneThumb({ scene }: { scene: SceneId }) {
  const w = getScene(scene)?.width ?? 1000;
  return (
    <svg viewBox={`0 0 ${w} 600`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label={getScene(scene)?.name ?? scene}>
      <SceneArt scene={scene} />
      <SceneArt scene={scene} layer="front" />
    </svg>
  );
}
