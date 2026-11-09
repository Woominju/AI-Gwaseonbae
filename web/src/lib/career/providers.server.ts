import "server-only";
/**
 * 외부 직무·채용 데이터 어댑터.
 *   NCS     : 공공데이터포털 "한국산업인력공단_NCS 기준정보 조회" (https://apis.data.go.kr/B490007/hrdkapi)
 *             NCS_SERVICE_KEY 가 있을 때만 호출. 응답 필드명은 실제 키로 검증 전 → 방어적으로 파싱.
 *   사람인  : https://oapi.saramin.co.kr/job-search (승인된 access-key 필요, 1일 500회 한도)
 *             SARAMIN_ACCESS_KEY 가 있을 때만 호출. 응답에 공고 본문·요구역량 필드는 없으므로
 *             keyword·position.title·job-code 에서 역량을 추출한다. 저장하지 않고 메모리 캐시만(1시간).
 *   고용24  : 기업회원 전용 OpenAPI → 미연동
 *   LinkedIn: 경력 데이터 API 미허용(파트너 승인 필요) → 미연동, 스크래핑 금지
 * 공개 시연(PUBLIC_DEMO=1)에서는 외부 API를 절대 호출하지 않는다 (Fixture 만 사용).
 * 키는 서버 환경변수로만 읽고 응답·로그에 포함하지 않는다.
 */
import ncsFixture from "@/data/career/ncs.fixture.json";
import postingFixture from "@/data/career/postings.fixture.json";
import { isPublicDemo } from "../demoMode";
import { canonicalSkill, extractConcepts, SKILLS } from "../taxonomy";
import type { OccupationDef } from "./occupations";
import type { CareerEvidence, ProviderStatus } from "./types";

const known = new Set(SKILLS.map((s) => s.id));

/** 쉼표·슬래시로 나뉜 키워드 문자열 → 정규화 역량 ID (+ 매핑 안 된 원문) */
export function extractSkills(text: string): { skills: string[]; unmapped: string[] } {
  const skills = new Set<string>();
  const unmapped: string[] = [];
  for (const term of text.split(/[,/|·]+/).map((t) => t.trim()).filter(Boolean)) {
    const c = canonicalSkill(term);
    const found = known.has(c) ? [c] : extractConcepts(term).skills;
    if (found.length) found.forEach((s) => skills.add(s));
    else unmapped.push(term);
  }
  return { skills: [...skills], unmapped };
}

const externalAllowed = () => !isPublicDemo() && process.env.CAREER_EXTERNAL_API !== "0";

export function providerStatuses(): ProviderStatus[] {
  const ext = externalAllowed();
  return [
    {
      provider: "ncs",
      label: "국가직무능력표준(NCS)",
      mode: ext && process.env.NCS_SERVICE_KEY ? "live" : "fixture",
      detail: ext && process.env.NCS_SERVICE_KEY ? "공공데이터포털 NCS 기준정보 조회 API (인증키 설정됨 · 응답 필드 매핑 검증 필요)" : "인증키 미설정 → 테스트 Fixture(실제 NCS 명칭 아님)",
      docs_url: "https://www.data.go.kr/data/15128213/openapi.do",
    },
    {
      provider: "saramin",
      label: "사람인 채용정보",
      mode: ext && process.env.SARAMIN_ACCESS_KEY ? "live" : "fixture",
      detail: ext && process.env.SARAMIN_ACCESS_KEY ? "사람인 job-search API (승인된 access-key)" : isPublicDemo() ? "공개 시연 모드: 외부 API 호출 차단 → 가상 공고 Fixture" : "access-key 미발급(이용신청·승인 필요) → 가상 공고 Fixture",
      docs_url: "https://oapi.saramin.co.kr/guide/job-search",
    },
    { provider: "work24", label: "고용24", mode: "not_configured", detail: "OpenAPI는 고용24 기업회원 전용·담당자 심사 후 발급 → 미신청, 미연동", docs_url: "https://www.work24.go.kr/cm/e/a/0110/selectOpenApiIntro.do" },
    { provider: "hufs_alumni", label: "LinkedIn", mode: "not_implemented", detail: "경력 정보 API는 파트너 승인 필요 · 스크래핑 금지 → 연동하지 않음. 동문 자발적 등록(설문)으로 대체", docs_url: "https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access" },
  ];
}

/* ---------------- NCS ---------------- */

type NcsFixture = { _notice: string; standards: Record<string, { name: string; mapped_skills: string[] }[]> };

function ncsFromFixture(o: OccupationDef): CareerEvidence | null {
  const units = (ncsFixture as NcsFixture).standards[o.id];
  if (!units || !o.ncs) return null;
  return {
    id: `NCS-FX-${o.id}`,
    source_provider: "ncs",
    source_type: "official_occupation_standard",
    source_url: "https://www.ncs.go.kr",
    title: `${o.ncs.name} (NCS 세분류${o.ncs.code ? ` ${o.ncs.code}` : ""}${o.ncs.code_verified ? "" : " · 코드 미검증"})`,
    occupation: o.id,
    required_skills: [...new Set(units.flatMap((u) => u.mapped_skills))],
    preferred_skills: [],
    qualifications: [],
    experience_requirements: null,
    description: `${o.ncs.path}. ${(ncsFixture as NcsFixture)._notice}`,
    published_at: null,
    fetched_at: "2026-11-05T00:00:00.000Z",
    expires_at: null,
    license_information: "공공데이터포털 이용허락범위 제한 없음(API 기준). 본 Fixture는 예시 데이터",
    verification_status: "synthetic_fixture",
    is_synthetic: true,
    units: units.map((u) => ({ name: u.name, mapped_skills: u.mapped_skills })),
  };
}

const cache = new Map<string, { at: number; v: unknown }>();
const TTL = 60 * 60 * 1000;
async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.v as T;
  const v = await fn();
  cache.set(key, { at: Date.now(), v });
  return v;
}

async function ncsLive(o: OccupationDef): Promise<CareerEvidence | null> {
  const key = process.env.NCS_SERVICE_KEY;
  if (!key || !o.ncs) return null;
  const url = new URL("https://apis.data.go.kr/B490007/hrdkapi/getCompeUnitKeywordSearch");
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("SWRD", o.ncs.name);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "30");
  const r = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!r.ok) throw new Error(`NCS HTTP ${r.status}`);
  const j = (await r.json()) as { response?: { body?: { items?: { item?: unknown } } }; body?: { items?: unknown } };
  const raw = j.response?.body?.items?.item ?? j.body?.items ?? [];
  const arr = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[];
  // 필드명 후보 (실제 응답으로 검증 필요)
  const nameOf = (x: Record<string, unknown>) => String(x.compeUnitName ?? x.COMPE_UNIT_NM ?? x.ncsCompeUnitNm ?? x.compe_unit_nm ?? "").trim();
  const codeOf = (x: Record<string, unknown>) => String(x.compeUnitCd ?? x.NCS_CL_CD ?? x.ncsClCd ?? "").trim() || undefined;
  const units = arr.map((x) => ({ code: codeOf(x), name: nameOf(x) })).filter((u) => u.name).map((u) => ({ ...u, mapped_skills: extractConcepts(u.name).skills }));
  if (!units.length) return null;
  const now = new Date().toISOString();
  return {
    id: `NCS-LIVE-${o.id}`,
    source_provider: "ncs",
    source_type: "official_occupation_standard",
    source_url: "https://www.ncs.go.kr",
    title: `${o.ncs.name} (NCS 능력단위 키워드 검색)`,
    occupation: o.id,
    required_skills: [...new Set(units.flatMap((u) => u.mapped_skills))],
    preferred_skills: [],
    qualifications: [],
    experience_requirements: null,
    description: `${o.ncs.path}. 능력단위명 → 역량 매핑은 사전 기반 자동 매핑(설계 가정)`,
    published_at: null,
    fetched_at: now,
    expires_at: new Date(Date.now() + TTL).toISOString(),
    license_information: "공공데이터포털 · 한국산업인력공단 (이용허락범위 제한 없음)",
    verification_status: "live_api",
    is_synthetic: false,
    units,
  };
}

export async function getNcsStandard(o: OccupationDef): Promise<{ ev: CareerEvidence | null; notice?: string }> {
  if (externalAllowed() && process.env.NCS_SERVICE_KEY) {
    try {
      const live = await cached(`ncs:${o.id}`, () => ncsLive(o));
      if (live) return { ev: live };
      return { ev: ncsFromFixture(o), notice: "NCS API 응답에서 능력단위를 찾지 못해 테스트 Fixture를 사용했습니다." };
    } catch (e) {
      return { ev: ncsFromFixture(o), notice: `NCS API 호출 실패(${(e as Error).message.slice(0, 60)}) → 테스트 Fixture 사용` };
    }
  }
  return { ev: ncsFromFixture(o) };
}

/* ---------------- 사람인 ---------------- */

type FxPosting = { id: string; occupation: string; company: string; title: string; keyword_required: string; keyword_preferred: string; experience: string; location: string };

function postingsFromFixture(o: OccupationDef): CareerEvidence[] {
  const fx = postingFixture as { fetched_at: string; postings: FxPosting[] };
  return fx.postings
    .filter((p) => p.occupation === o.id)
    .map((p) => {
      const req = extractSkills(p.keyword_required);
      const pref = extractSkills(p.keyword_preferred);
      return {
        id: p.id,
        source_provider: "saramin" as const,
        source_type: "recruitment_posting" as const,
        source_url: null,
        title: p.title,
        occupation: o.id,
        required_skills: req.skills,
        preferred_skills: pref.skills.filter((s) => !req.skills.includes(s)),
        qualifications: [],
        experience_requirements: p.experience,
        description: `가상 공고 · ${p.company} · ${p.location}`,
        published_at: null,
        fetched_at: fx.fetched_at,
        expires_at: null,
        license_information: "테스트용 가상 데이터 (실제 공고 아님)",
        verification_status: "synthetic_fixture" as const,
        is_synthetic: true,
        raw_terms: [...req.unmapped, ...pref.unmapped],
        meta: { company: p.company, location: p.location },
      };
    });
}

type SaraminJob = {
  id?: string;
  url?: string;
  "expiration-timestamp"?: string;
  "posting-timestamp"?: string;
  keyword?: string;
  company?: { detail?: { name?: string; href?: string } };
  position?: { title?: string; location?: { name?: string }; "job-code"?: { name?: string }; "experience-level"?: { name?: string }; "required-education-level"?: { name?: string } };
};

async function saraminLive(o: OccupationDef): Promise<CareerEvidence[]> {
  const key = process.env.SARAMIN_ACCESS_KEY!;
  const url = new URL("https://oapi.saramin.co.kr/job-search");
  url.searchParams.set("access-key", key);
  url.searchParams.set("keywords", o.saramin_keywords);
  url.searchParams.set("count", "30");
  url.searchParams.set("sort", "pd");
  const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!r.ok) throw new Error(`사람인 HTTP ${r.status}`);
  const j = (await r.json()) as { jobs?: { job?: SaraminJob[] } };
  const now = new Date().toISOString();
  const ts = (x?: string) => (x && /^\d+$/.test(x) ? new Date(Number(x) * 1000).toISOString() : null);
  return (j.jobs?.job ?? []).map((x) => {
    // 응답에 '필수/우대' 구분이 없다 → keyword·직무코드·제목에서 추출한 역량을 모두 '공고 언급 역량(필수 취급)'으로 기록
    const ext = extractSkills([x.keyword, x.position?.["job-code"]?.name, x.position?.title].filter(Boolean).join(","));
    return {
      id: `SR-${x.id ?? Math.random().toString(36).slice(2)}`,
      source_provider: "saramin" as const,
      source_type: "recruitment_posting" as const,
      source_url: x.url ?? null,
      title: x.position?.title ?? "(제목 없음)",
      occupation: o.id,
      required_skills: ext.skills,
      preferred_skills: [],
      qualifications: [x.position?.["required-education-level"]?.name].filter((v): v is string => !!v),
      experience_requirements: x.position?.["experience-level"]?.name ?? null,
      description: [x.company?.detail?.name, x.position?.location?.name].filter(Boolean).join(" · "),
      published_at: ts(x["posting-timestamp"]),
      fetched_at: now,
      expires_at: ts(x["expiration-timestamp"]),
      license_information: "사람인 채용정보 API — 출처: 사람인. 재판매·유료화 금지, 원문은 사람인 링크에서 확인",
      verification_status: "live_api" as const,
      is_synthetic: false,
      raw_terms: ext.unmapped,
      meta: { company: x.company?.detail?.name ?? "", location: x.position?.location?.name ?? "" },
    };
  });
}

export async function getPostings(o: OccupationDef): Promise<{ list: CareerEvidence[]; query: string; notice?: string; live: boolean }> {
  const query = o.saramin_keywords;
  if (externalAllowed() && process.env.SARAMIN_ACCESS_KEY) {
    try {
      const list = await cached(`sr:${o.id}`, () => saraminLive(o));
      const now = Date.now();
      const valid = list.filter((p) => !p.expires_at || Date.parse(p.expires_at) > now);
      const expired = list.length - valid.length;
      return { list: valid, query, live: true, notice: expired ? `마감된 공고 ${expired}건은 분석에서 제외했습니다.` : undefined };
    } catch (e) {
      return { list: postingsFromFixture(o), query, live: false, notice: `사람인 API 호출 실패(${(e as Error).message.slice(0, 60)}) → 가상 공고 Fixture 사용` };
    }
  }
  return { list: postingsFromFixture(o), query, live: false };
}
