/**
 * AI 과선배 3.0 — 캠퍼스 월드 구조.
 *   선배 광장(hub) ─┬─ 서울캠퍼스: 캠퍼스 야외 → 도서관 / 선배 카페 / 진로 상담실
 *                   └─ 글로벌캠퍼스: 호숫가(명수당 참고) → 도서관 / 휴게 라운지 / 진로 상담실
 * 장면 좌표: 높이 600 고정, 너비는 장면별(1000 또는 1600). 넓은 장면은 카메라가 학생을 따라간다.
 * 실제 건물·사진을 복제하지 않은 독창적 일러스트 (docs/ART_DIRECTION_3_0.md).
 */
export type WorldId = "hub" | "seoul" | "global";
export type SceneId =
  | "hub"
  | "seoul_yard"
  | "seoul_library"
  | "seoul_cafe"
  | "seoul_counsel"
  | "global_lake"
  | "global_library"
  | "global_lounge"
  | "global_counsel";

/** 상담 맥락(인사 훅·추천 질문)을 결정하는 장소 성격 */
export type SceneTheme = "plaza" | "library" | "cafe" | "counsel";

export type SceneAction =
  | { kind: "info"; text: string }
  | { kind: "ask"; question: string; text: string }
  | { kind: "link"; href: string; label: string; text: string; feature?: "career_intel" | "course_graph" }
  | { kind: "go"; to: SceneId; text: string }
  | { kind: "sfx"; sfx: "clink" | "page" | "chirp" | "splash"; text: string }
  | { kind: "toggle_lamp"; text: string };

export interface SceneObjectDef {
  id: string;
  label: string;
  /** 핫스팟(클릭 표시) 좌표 — 아트에서 해당 오브젝트가 그려지는 위치와 맞아야 한다 */
  x: number;
  y: number;
  action: SceneAction;
}

export interface SceneDef {
  id: SceneId;
  world: WorldId;
  name: string;
  en: string;
  theme: SceneTheme;
  width: number;
  tagline: string;
  arrival: string;
  /** 걷기 가능 영역(사각형) */
  walk: { minX: number; maxX: number; minY: number; maxY: number };
  studentStart: { x: number; y: number };
  /** 이 장면에 서 있는 AI 선배(슬롯 0=따뜻한, 1=현실적, 2=분석적)와 위치 */
  seniors: { slot: 0 | 1 | 2; x: number; y: number }[];
  objects: SceneObjectDef[];
  starters: { label: string; question: string }[];
}

export interface WorldDef {
  id: WorldId;
  name: string;
  en: string;
  tagline: string;
  entry: SceneId;
  scenes: SceneId[];
}

const S = {
  light: { label: "일단 가볍게 이야기하고 싶어요.", question: "일단 가볍게 이야기하고 싶어요." },
  undecided: { label: "진로가 아직 정해지지 않았어요.", question: "진로가 아직 정해지지 않았어요." },
  gradjob: { label: "대학원과 취업 중 고민이에요.", question: "대학원 진학과 취업 중에 고민이에요." },
  dept: { label: "우리 학과 선배들의 진로가 궁금해요.", question: "우리 학과 선배들은 어떤 분야로 진출했나요?" },
  intern: { label: "인턴십을 어떻게 준비할지 모르겠어요.", question: "선배들은 인턴십을 어떻게 준비했나요?" },
  market: { label: "데이터 분석가 채용에서는 어떤 역량을 요구하나요?", question: "요즘 데이터 분석가 채용에서는 어떤 역량을 요구하나요?" },
  gap: { label: "제 스펙에서 부족한 부분은 무엇인가요?", question: "제 현재 스펙에서 부족한 부분은 무엇인가요?" },
  research: { label: "연구가 나에게 맞는지 모르겠어요.", question: "연구가 나에게 맞는지 확인하려면 선배들은 무엇을 해 봤나요?" },
  future: { label: "선배는 나중에 뭐 하고 싶어요?", question: "선배는 나중에 뭐 하고 싶어요?" },
  real: { label: "실제 선배와 대화할 수 있나요?", question: "실제 선배와 대화할 수 있나요?" },
};

const exitTo = (to: SceneId, x: number, text: string): SceneObjectDef => ({ id: `exit_${to}`, label: "나가기", x, y: 420, action: { kind: "go", to, text } });

export const SCENES: SceneDef[] = [
  {
    id: "hub",
    world: "hub",
    name: "선배 광장",
    en: "Senior Square",
    theme: "plaza",
    width: 1600,
    tagline: "모두가 만나는 중앙 광장",
    arrival: "선배 광장에 오신 걸 환영해요! 분수대 주변을 산책하거나, 정자 아래 AI 선배에게 말을 걸어 보세요.",
    walk: { minX: 60, maxX: 1540, minY: 420, maxY: 575 },
    studentStart: { x: 800, y: 545 },
    seniors: [
      { slot: 0, x: 1090, y: 455 },
      { slot: 1, x: 1215, y: 440 },
      { slot: 2, x: 1340, y: 462 },
    ],
    objects: [
      { id: "sign_seoul", label: "서울캠퍼스 가는 길", x: 90, y: 300, action: { kind: "go", to: "seoul_yard", text: "도심 속 캠퍼스, 서울캠퍼스로 이동할까요?" } },
      { id: "wardrobe", label: "나의 옷장", x: 285, y: 300, action: { kind: "link", href: "/wardrobe", label: "옷장 열기", text: "오늘은 어떤 캠퍼스룩으로 다녀 볼까요?" } },
      { id: "board", label: "선배 경험 게시판", x: 520, y: 300, action: { kind: "link", href: "/alumni", label: "게시판 보기", text: "선배들이 남긴 경험과 질문 게시판이에요. 검증된 실제 선배와 시연 데이터를 구분해 보여 줘요." } },
      { id: "fountain", label: "중앙 분수대", x: 800, y: 330, action: { kind: "sfx", sfx: "splash", text: "졸업 전에 동전을 던지면 원하는 곳에 간다는 소문… 은 아직 검증되지 않았대요." } },
      { id: "bench", label: "정원 벤치", x: 625, y: 392, action: { kind: "ask", question: "일단 가볍게 이야기하고 싶어요.", text: "꽃향기가 나는 벤치예요. 앉아서 가볍게 이야기해 볼까요?" } },
      { id: "gazebo", label: "AI 선배 상담 정자", x: 1215, y: 250, action: { kind: "info", text: "AI 선배들이 기다리는 정자예요. AI 선배는 실제 사람이 아니에요. 선배 기록과 직무정보를 찾아서 함께 고민해 줘요." } },
      { id: "kiosk", label: "진로 정보 안내소", x: 1420, y: 330, action: { kind: "link", href: "/market", label: "Career Market 열기", text: "직무별 공식 역량 기준과 채용 정보(현재 시연용 Fixture)를 볼 수 있어요.", feature: "career_intel" } },
      { id: "sign_global", label: "글로벌캠퍼스 가는 길", x: 1525, y: 300, action: { kind: "go", to: "global_lake", text: "호수와 숲이 있는 글로벌캠퍼스로 이동할까요?" } },
    ],
    starters: [S.light, S.undecided, S.future, S.real],
  },
  {
    id: "seoul_yard",
    world: "seoul",
    name: "서울캠퍼스",
    en: "Seoul Campus",
    theme: "plaza",
    width: 1600,
    tagline: "붉은 벽돌 건물과 은행나무 길, 도심 속 캠퍼스",
    arrival: "서울캠퍼스예요. 은행나무 길을 따라 도서관·선배 카페·진로 상담실에 들어갈 수 있어요.",
    walk: { minX: 60, maxX: 1540, minY: 430, maxY: 575 },
    studentStart: { x: 150, y: 540 },
    seniors: [{ slot: 0, x: 760, y: 470 }],
    objects: [
      { id: "to_hub", label: "선배 광장으로", x: 55, y: 320, action: { kind: "go", to: "hub", text: "선배 광장으로 돌아갈까요?" } },
      { id: "door_library", label: "도서관", x: 380, y: 300, action: { kind: "go", to: "seoul_library", text: "조용한 도서관에 들어갈까요?" } },
      { id: "door_cafe", label: "선배 카페", x: 1000, y: 330, action: { kind: "go", to: "seoul_cafe", text: "커피 향이 나는 선배 카페예요." } },
      { id: "door_counsel", label: "진로 상담실", x: 1330, y: 300, action: { kind: "go", to: "seoul_counsel", text: "진로 상담실에서 차분하게 이야기해 볼까요?" } },
      { id: "clock", label: "시계탑", x: 640, y: 150, action: { kind: "info", text: "시계탑이 '지금도 늦지 않았어'라고 말하는 것 같아요." } },
      { id: "ginkgo", label: "은행나무", x: 1180, y: 290, action: { kind: "sfx", sfx: "chirp", text: "가을이면 이 길이 노랗게 물든대요." } },
    ],
    starters: [S.dept, S.undecided, S.gradjob, S.light],
  },
  {
    id: "seoul_library",
    world: "seoul",
    name: "서울캠퍼스 도서관",
    en: "Seoul Library",
    theme: "library",
    width: 1000,
    tagline: "공부·연구·대학원 고민",
    arrival: "조용한 도서관이에요. 책장과 스탠드, 창가 포스터를 눌러 볼 수 있어요.",
    walk: { minX: 60, maxX: 940, minY: 430, maxY: 575 },
    studentStart: { x: 140, y: 540 },
    seniors: [{ slot: 2, x: 650, y: 470 }],
    objects: [
      exitTo("seoul_yard", 60, "캠퍼스로 나갈까요?"),
      { id: "shelf", label: "책장", x: 220, y: 230, action: { kind: "link", href: "/seniors", label: "선배 경험 DB 열기", text: "선배 기록이 꽂힌 책장이에요. (현재 기록은 모두 가상 시연 데이터)" } },
      { id: "graph_map", label: "지식 관계 지도", x: 220, y: 345, action: { kind: "link", href: "/graph?view=explore", label: "관계 그래프 열기", text: "과목·역량·직무의 연결을 출처와 함께 볼 수 있어요. (현재 수강편람 관계는 가상 시연 데이터예요)", feature: "course_graph" } },
      { id: "lamp", label: "스탠드", x: 520, y: 345, action: { kind: "toggle_lamp", text: "딸깍. 따뜻한 불빛이 켜졌어요." } },
      { id: "book", label: "펼친 책", x: 430, y: 375, action: { kind: "sfx", sfx: "page", text: "사락. 『대학원 vs 취업: 정답은 없다』" } },
      { id: "poster", label: "창가 포스터", x: 840, y: 210, action: { kind: "link", href: "/compare", label: "진로 비교 열기", text: "'우선순위를 바꾸면 결과도 바뀝니다.'" } },
    ],
    starters: [S.gradjob, S.research, { label: "AI 대학원 준비에 무엇이 필요할까요?", question: "AI 분야 대학원 진학을 준비하려면 무엇이 필요한가요?" }, S.undecided],
  },
  {
    id: "seoul_cafe",
    world: "seoul",
    name: "선배 카페",
    en: "Senior Café",
    theme: "cafe",
    width: 1000,
    tagline: "커피 한 잔과 인턴십·취업·직무 이야기",
    arrival: "선배 카페예요. 메뉴판, 노트북, 커피머신을 눌러 보세요.",
    walk: { minX: 60, maxX: 940, minY: 430, maxY: 575 },
    studentStart: { x: 140, y: 540 },
    seniors: [{ slot: 1, x: 600, y: 465 }],
    objects: [
      exitTo("seoul_yard", 60, "캠퍼스로 나갈까요?"),
      { id: "menu", label: "메뉴판", x: 448, y: 178, action: { kind: "link", href: "/market", label: "채용시장 보기", text: "오늘의 메뉴: 직무 역량 라떼, 채용공고 아메리카노.", feature: "career_intel" } },
      { id: "machine", label: "커피머신", x: 180, y: 262, action: { kind: "sfx", sfx: "clink", text: "치익— 커피 한 잔 완성!" } },
      { id: "laptop", label: "노트북", x: 780, y: 370, action: { kind: "link", href: "/market?tab=gap", label: "내 역량 비교하기", text: "노트북에 '내 역량 vs 직무 요구 역량' 표가 떠 있어요.", feature: "career_intel" } },
    ],
    starters: [S.intern, S.market, S.gap, S.light],
  },
  {
    id: "seoul_counsel",
    world: "seoul",
    name: "서울 진로 상담실",
    en: "Career Room",
    theme: "counsel",
    width: 1000,
    tagline: "세 선배와 함께 선택지를 비교하는 곳",
    arrival: "진로 상담실이에요. 화이트보드와 로드맵 보드, 질문함을 눌러 보세요.",
    walk: { minX: 60, maxX: 940, minY: 440, maxY: 575 },
    studentStart: { x: 140, y: 545 },
    seniors: [
      { slot: 0, x: 430, y: 470 },
      { slot: 1, x: 620, y: 455 },
      { slot: 2, x: 800, y: 475 },
    ],
    objects: [
      exitTo("seoul_yard", 60, "캠퍼스로 나갈까요?"),
      { id: "whiteboard", label: "화이트보드", x: 330, y: 200, action: { kind: "link", href: "/compare", label: "진로 비교 열기", text: "대학원 vs 취업, 우선순위에 따라 비교해 볼 수 있어요." } },
      { id: "roadmap_board", label: "로드맵 보드", x: 640, y: 200, action: { kind: "link", href: "/roadmap", label: "나의 로드맵 열기", text: "1·3·6·12개월 계획을 붙여 두는 보드예요." } },
      { id: "graph_frame", label: "진로 지도 액자", x: 870, y: 200, action: { kind: "link", href: "/graph", label: "커리어 그래프 보기", text: "학과→역량→경험→진로가 이어진 지도예요." } },
      { id: "mailbox", label: "실제 선배 질문함", x: 180, y: 340, action: { kind: "link", href: "/alumni", label: "질문함 열기", text: "질문 수신에 동의한 검증된 실제 선배에게만 질문을 남길 수 있어요." } },
    ],
    starters: [S.gradjob, S.gap, S.real, S.undecided],
  },
  {
    id: "global_lake",
    world: "global",
    name: "글로벌캠퍼스",
    en: "Global Campus",
    theme: "plaza",
    width: 1600,
    tagline: "호수 위 정자와 숲길, 자연 속 캠퍼스",
    arrival: "글로벌캠퍼스예요. 호숫가 정자와 숲길을 따라 도서관·휴게 라운지·진로 상담실에 갈 수 있어요.",
    walk: { minX: 60, maxX: 1540, minY: 470, maxY: 578 },
    studentStart: { x: 150, y: 545 },
    seniors: [{ slot: 0, x: 560, y: 505 }],
    objects: [
      { id: "to_hub", label: "선배 광장으로", x: 55, y: 360, action: { kind: "go", to: "hub", text: "선배 광장으로 돌아갈까요?" } },
      { id: "pavilion", label: "호수 정자", x: 820, y: 230, action: { kind: "info", text: "호수 위 정자에서 잠시 쉬어 가요. 물결 소리가 마음을 차분하게 해 줘요." } },
      { id: "ducks", label: "오리 가족", x: 1060, y: 400, action: { kind: "sfx", sfx: "splash", text: "꽥! 오리 가족이 인사해요." } },
      { id: "door_library", label: "숲속 도서관", x: 330, y: 330, action: { kind: "go", to: "global_library", text: "숲을 바라보는 도서관에 들어갈까요?" } },
      { id: "door_lounge", label: "휴게 라운지", x: 1250, y: 340, action: { kind: "go", to: "global_lounge", text: "편하게 쉬어 가는 라운지예요." } },
      { id: "door_counsel", label: "진로 상담실", x: 1470, y: 320, action: { kind: "go", to: "global_counsel", text: "진로 상담실에서 이야기해 볼까요?" } },
    ],
    starters: [S.light, S.undecided, S.dept, S.future],
  },
  {
    id: "global_library",
    world: "global",
    name: "글로벌캠퍼스 도서관",
    en: "Forest Library",
    theme: "library",
    width: 1000,
    tagline: "통창 너머 숲을 보며 공부·연구 고민",
    arrival: "숲이 보이는 도서관이에요. 책장과 열람 테이블을 눌러 보세요.",
    walk: { minX: 60, maxX: 940, minY: 430, maxY: 575 },
    studentStart: { x: 140, y: 540 },
    seniors: [{ slot: 2, x: 680, y: 470 }],
    objects: [
      exitTo("global_lake", 60, "호숫가로 나갈까요?"),
      { id: "shelf", label: "책장", x: 870, y: 240, action: { kind: "link", href: "/seniors", label: "선배 경험 DB 열기", text: "선배 기록이 꽂힌 책장이에요. (현재 기록은 모두 가상 시연 데이터)" } },
      { id: "lamp", label: "열람 테이블 조명", x: 470, y: 350, action: { kind: "toggle_lamp", text: "딸깍. 테이블 조명이 켜졌어요." } },
      { id: "globe", label: "지구본", x: 250, y: 330, action: { kind: "link", href: "/graph", label: "커리어 그래프 보기", text: "지구본 대신 진로 지도를 돌려 볼까요?" } },
    ],
    starters: [S.gradjob, S.research, S.dept, S.undecided],
  },
  {
    id: "global_lounge",
    world: "global",
    name: "휴게 라운지",
    en: "Rest Lounge",
    theme: "cafe",
    width: 1000,
    tagline: "소파와 자판기, 편안한 휴식 공간",
    arrival: "휴게 라운지예요. 소파에 앉거나 자판기, 노트북을 눌러 보세요.",
    walk: { minX: 60, maxX: 940, minY: 430, maxY: 575 },
    studentStart: { x: 140, y: 540 },
    seniors: [{ slot: 1, x: 640, y: 470 }],
    objects: [
      exitTo("global_lake", 60, "호숫가로 나갈까요?"),
      { id: "sofa", label: "소파", x: 380, y: 390, action: { kind: "ask", question: "일단 가볍게 이야기하고 싶어요.", text: "푹신한 소파예요. 앉아서 가볍게 이야기할까요?" } },
      { id: "vending", label: "자판기", x: 860, y: 280, action: { kind: "sfx", sfx: "clink", text: "덜컹! 음료가 나왔어요." } },
      { id: "laptop", label: "노트북", x: 560, y: 360, action: { kind: "link", href: "/market?tab=gap", label: "내 역량 비교하기", text: "직무 요구 역량과 내 역량을 비교해 볼까요?", feature: "career_intel" } },
    ],
    starters: [S.intern, S.market, S.light, S.future],
  },
  {
    id: "global_counsel",
    world: "global",
    name: "글로벌 진로 상담실",
    en: "Career Room",
    theme: "counsel",
    width: 1000,
    tagline: "숲이 보이는 상담실에서 선택지를 비교",
    arrival: "숲이 보이는 진로 상담실이에요.",
    walk: { minX: 60, maxX: 940, minY: 440, maxY: 575 },
    studentStart: { x: 140, y: 545 },
    seniors: [
      { slot: 0, x: 430, y: 470 },
      { slot: 1, x: 620, y: 455 },
      { slot: 2, x: 800, y: 475 },
    ],
    objects: [
      exitTo("global_lake", 60, "호숫가로 나갈까요?"),
      { id: "whiteboard", label: "화이트보드", x: 330, y: 200, action: { kind: "link", href: "/compare", label: "진로 비교 열기", text: "대학원 vs 취업, 우선순위에 따라 비교해 볼 수 있어요." } },
      { id: "roadmap_board", label: "로드맵 보드", x: 640, y: 200, action: { kind: "link", href: "/roadmap", label: "나의 로드맵 열기", text: "1·3·6·12개월 계획을 붙여 두는 보드예요." } },
      { id: "mailbox", label: "실제 선배 질문함", x: 180, y: 335, action: { kind: "link", href: "/alumni", label: "질문함 열기", text: "질문 수신에 동의한 검증된 실제 선배에게만 질문을 남길 수 있어요." } },
    ],
    starters: [S.gradjob, S.gap, S.real, S.undecided],
  },
];

export const WORLDS: WorldDef[] = [
  { id: "hub", name: "선배 광장", en: "Senior Square", tagline: "모든 학생이 만나는 공통 허브 · 분수대·정원·AI 선배 정자", entry: "hub", scenes: ["hub"] },
  { id: "seoul", name: "서울캠퍼스", en: "Seoul Campus", tagline: "붉은 벽돌과 은행나무 길 · 도서관·선배 카페·진로 상담실", entry: "seoul_yard", scenes: ["seoul_yard", "seoul_library", "seoul_cafe", "seoul_counsel"] },
  { id: "global", name: "글로벌캠퍼스", en: "Global Campus", tagline: "호수 정자와 숲길 · 숲속 도서관·휴게 라운지·진로 상담실", entry: "global_lake", scenes: ["global_lake", "global_library", "global_lounge", "global_counsel"] },
];

/** 2.0 장소 ID 호환 */
export const LEGACY_PLACE: Record<string, SceneId> = { plaza: "hub", library: "seoul_library", cafe: "seoul_cafe" };

export function getScene(id: string | null | undefined): SceneDef | undefined {
  if (!id) return undefined;
  return SCENES.find((s) => s.id === id) ?? SCENES.find((s) => s.id === LEGACY_PLACE[id]);
}

export function isSceneId(x: unknown): x is SceneId {
  return typeof x === "string" && SCENES.some((s) => s.id === x);
}

export function worldOf(id: SceneId): WorldDef {
  return WORLDS.find((w) => w.scenes.includes(id))!;
}

export const VIEW_W = 1000;
export const VIEW_H = 600;

export function clampWalk(s: SceneDef, x: number, y: number) {
  return { x: Math.min(s.walk.maxX, Math.max(s.walk.minX, x)), y: Math.min(s.walk.maxY, Math.max(s.walk.minY, y)) };
}

/** 2.5D 원근: 아래(가까운 쪽)일수록 크게 */
export function depth(s: SceneDef, y: number): number {
  const t = (Math.min(s.walk.maxY, Math.max(s.walk.minY, y)) - s.walk.minY) / Math.max(1, s.walk.maxY - s.walk.minY);
  return 0.82 + t * 0.26;
}

/** 카메라 x (뷰 너비 vw 기준, 학생 중심, 장면 경계에서 멈춤) */
export function cameraX(s: SceneDef, x: number, vw = VIEW_W): number {
  if (s.width <= vw) return 0;
  return Math.min(s.width - vw, Math.max(0, x - vw / 2));
}
