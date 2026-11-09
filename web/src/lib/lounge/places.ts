/**
 * Campus Lounge 장소 정의.
 * 세 공간은 배경만 다른 것이 아니라 '시작 인사 · 추천 질문 · 공간 객체 · 연결 기능'이 다르다.
 * 실제 한국외대 건물·사진을 복제하지 않은, 대학 캠퍼스 분위기를 연상시키는 독창적 일러스트 기준.
 */
export type PlaceId = "plaza" | "library" | "cafe";

export type ObjectAction =
  | { kind: "info"; text: string }
  | { kind: "ask"; question: string; text: string }
  | { kind: "link"; href: string; label: string; text: string; feature?: "career_intel" }
  | { kind: "sfx"; sfx: "clink" | "page" | "chirp"; text: string }
  | { kind: "toggle_lamp"; text: string };

export interface SceneObject {
  id: string;
  label: string;
  /** 1000×600 장면 좌표에서 클릭 영역 중심 (말풍선 위치) */
  x: number;
  y: number;
  action: ObjectAction;
}

export interface PlaceDef {
  id: PlaceId;
  name: string;
  en: string;
  tagline: string;
  /** 이 공간에서 주로 다루는 상담 주제 */
  focus: string[];
  /** 입장 시 공간 안내 (선배 인사와 별개) */
  arrival: string;
  starters: { label: string; question: string }[];
  /** 세 선배가 서 있는 위치 (warm, realistic, analytical 순) */
  seniorSpots: { x: number; y: number }[];
  studentStart: { x: number; y: number };
  objects: SceneObject[];
}

export const STARTERS_COMMON = [
  { label: "진로가 아직 정해지지 않았어요.", question: "진로가 아직 정해지지 않았어요." },
  { label: "대학원과 취업 중 고민이에요.", question: "대학원 진학과 취업 중에 고민이에요." },
  { label: "우리 학과 선배들의 진로가 궁금해요.", question: "우리 학과 선배들은 어떤 분야로 진출했나요?" },
  { label: "인턴십을 어떻게 준비할지 모르겠어요.", question: "선배들은 인턴십을 어떻게 준비했나요?" },
  { label: "일단 가볍게 이야기하고 싶어요.", question: "일단 가볍게 이야기하고 싶어요." },
];

export const PLACES: PlaceDef[] = [
  {
    id: "plaza",
    name: "캠퍼스 광장",
    en: "Campus Plaza",
    tagline: "벤치에 앉아 가볍게 시작하는 이야기",
    focus: ["전공 선택", "대학생활", "진로 탐색 시작"],
    arrival: "바람이 선선한 캠퍼스 광장이에요. 벤치·게시판·나무를 눌러 보거나, 선배에게 다가가 말을 걸어 보세요.",
    starters: [STARTERS_COMMON[4], STARTERS_COMMON[0], STARTERS_COMMON[2], { label: "복수전공을 할지 고민돼요.", question: "복수전공을 하면 진로 선택에 어떤 도움이 되었는지 선배 경험이 궁금해요." }],
    seniorSpots: [{ x: 300, y: 455 }, { x: 560, y: 420 }, { x: 800, y: 490 }],
    studentStart: { x: 110, y: 520 },
    objects: [
      { id: "bench", label: "벤치", x: 210, y: 430, action: { kind: "ask", question: "일단 가볍게 이야기하고 싶어요.", text: "앉으면 3분 안에 졸음이 온다는 전설의 벤치. 일단 앉아서 가볍게 이야기해 볼까요?" } },
      { id: "board", label: "게시판", x: 738, y: 252, action: { kind: "link", href: "/seniors", label: "선배 경험 DB 열기", text: "게시판에 선배 경험 카드가 잔뜩 붙어 있어요. (모두 가상 시연 데이터)" } },
      { id: "tree", label: "큰 나무", x: 900, y: 250, action: { kind: "sfx", sfx: "chirp", text: "나무가 \"진로는 광합성처럼 천천히…\"라고 말한 것 같다. (아님. 새소리였다)" } },
      { id: "sign", label: "안내판", x: 503, y: 292, action: { kind: "link", href: "/graph", label: "커리어 그래프 보기", text: "캠퍼스 지도 대신 '학과→역량→경험→진로' 지도가 그려져 있네요." } },
    ],
  },
  {
    id: "library",
    name: "도서관 라운지",
    en: "Library Lounge",
    tagline: "조용히 공부·연구·대학원을 고민하는 자리",
    focus: ["공부·연구", "대학원 진학", "복수전공"],
    arrival: "조용한 도서관 라운지예요. 책장과 스탠드, 창가 포스터를 눌러 볼 수 있어요. 여기서는 작은 목소리로!",
    starters: [STARTERS_COMMON[1], { label: "연구가 나에게 맞는지 모르겠어요.", question: "연구가 나에게 맞는지 확인하려면 선배들은 무엇을 해 봤나요?" }, { label: "대학원 준비에 무엇이 필요할까요?", question: "AI 분야 대학원 진학을 준비하려면 무엇이 필요한가요?" }, STARTERS_COMMON[0]],
    seniorSpots: [{ x: 250, y: 470 }, { x: 520, y: 430 }, { x: 790, y: 470 }],
    studentStart: { x: 120, y: 530 },
    objects: [
      { id: "shelf", label: "책장", x: 150, y: 250, action: { kind: "link", href: "/seniors", label: "선배 경험 DB 열기", text: "책 제목이 전부 '선배 기록 S-01', 'S-02'… (가상 시연 데이터)" } },
      { id: "lamp", label: "스탠드", x: 640, y: 330, action: { kind: "toggle_lamp", text: "딸깍. 스탠드를 켜면 조금 더 집중되는 기분." } },
      { id: "book", label: "펼친 책", x: 520, y: 360, action: { kind: "sfx", sfx: "page", text: "사락. 『대학원 vs 취업: 정답은 없다』 — 맞는 말이네요." } },
      { id: "poster", label: "창가 포스터", x: 912, y: 196, action: { kind: "link", href: "/compare", label: "진로 비교 열기", text: "포스터: '우선순위를 바꾸면 결과도 바뀝니다.' 진로 비교 화면으로 가 볼까요?" } },
    ],
  },
  {
    id: "cafe",
    name: "캠퍼스 카페",
    en: "Campus Café",
    tagline: "커피 한 잔 하며 인턴십·취업·직무 이야기",
    focus: ["인턴십", "취업·기업", "직무 역량"],
    arrival: "잔잔한 음악이 흐르는 캠퍼스 카페예요. 메뉴판, 노트북, 커피머신을 눌러 보세요.",
    starters: [STARTERS_COMMON[3], { label: "데이터 분석가 채용에서는 어떤 역량을 요구하나요?", question: "요즘 데이터 분석가 채용에서는 어떤 역량을 요구하나요?" }, { label: "제 역량과 채용공고를 비교해 주세요.", question: "제 역량과 데이터 분석가 채용공고를 비교해 주세요." }, { label: "제 스펙에서 부족한 부분은 무엇인가요?", question: "제 현재 스펙에서 부족한 부분은 무엇인가요?" }],
    seniorSpots: [{ x: 330, y: 470 }, { x: 600, y: 440 }, { x: 840, y: 495 }],
    studentStart: { x: 120, y: 520 },
    objects: [
      { id: "menu", label: "메뉴판", x: 318, y: 112, action: { kind: "link", href: "/market", label: "채용시장 보기", text: "오늘의 메뉴: '직무 역량 라떼', '채용공고 아메리카노'. 채용시장 화면으로 가 볼까요?", feature: "career_intel" } },
      { id: "laptop", label: "노트북", x: 700, y: 370, action: { kind: "link", href: "/market?tab=gap", label: "내 역량 비교하기", text: "노트북 화면에 '내 역량 vs 직무 요구 역량' 표가 떠 있어요.", feature: "career_intel" } },
      { id: "machine", label: "커피머신", x: 120, y: 290, action: { kind: "sfx", sfx: "clink", text: "치익— 달그락. 커피 한 잔 완성! (카페인은 진로 고민을 해결해 주지 않습니다)" } },
      { id: "plant", label: "화분", x: 940, y: 330, action: { kind: "info", text: "물을 너무 자주 주면 시든대요. 진로 고민도 가끔은 쉬어 가며!" } },
    ],
  },
];

export function getPlace(id: string | null | undefined): PlaceDef | undefined {
  return PLACES.find((p) => p.id === id);
}

export function isPlaceId(x: unknown): x is PlaceId {
  return x === "plaza" || x === "library" || x === "cafe";
}

/** 걸어 다닐 수 있는 바닥 영역 (장면 좌표) */
export const WALK = { minX: 50, maxX: 950, minY: 380, maxY: 565 };

export function clampToWalk(x: number, y: number) {
  return { x: Math.min(WALK.maxX, Math.max(WALK.minX, x)), y: Math.min(WALK.maxY, Math.max(WALK.minY, y)) };
}

/** 2.5D 원근: 아래쪽(가까운 쪽)일수록 크게 */
export function depthScale(y: number): number {
  return 0.78 + ((Math.min(WALK.maxY, Math.max(WALK.minY, y)) - WALK.minY) / (WALK.maxY - WALK.minY)) * 0.32;
}
