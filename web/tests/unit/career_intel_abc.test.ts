/**
 * Career Intelligence A/B/C 비교 (지시서 §8) — 사전 정의된 평가 사례 5개.
 *   A: 선배 경험만   B: + 공식 직무정보(NCS)   C: + 채용공고
 * 정답(ground truth) 데이터가 없으므로 '정확도'는 측정하지 않는다. 구조 지표·불변식만 계산한다.
 * WRITE_EVAL=1 이면 ../results/eval/career_intel_abc.md 로 저장.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getOccupation } from "@/lib/career/occupations";
import { getNcsStandard, getPostings } from "@/lib/career/providers.server";
import { computeSkillGap } from "@/lib/career/skillGap";
import { getSyntheticRecords } from "@/lib/data/records";

const CASES = [
  { id: "C1", desc: "수학과 3학년 · Python·통계 보유 · 데이터 분석가", occ: "data_analyst", skills: ["Python", "통계"] },
  { id: "C2", desc: "컴퓨터공학 계열 · Java·알고리즘 · 소프트웨어 개발자", occ: "software_engineer", skills: ["Java", "알고리즘"] },
  { id: "C3", desc: "언어 계열 · 영어·커뮤니케이션 · 해외영업 (NCS 미연결 직무)", occ: "global_sales", skills: ["영어", "커뮤니케이션"] },
  { id: "C4", desc: "경영 계열 · 엑셀 · 경영기획", occ: "business_planning", skills: ["엑셀"] },
  { id: "C5", desc: "역량 미입력 · AI·머신러닝 엔지니어", occ: "ml_engineer", skills: [] as string[] },
];

const jac = (a: string[], b: string[]) => { const A = new Set(a), B = new Set(b); const u = new Set([...A, ...B]); return u.size ? [...A].filter((x) => B.has(x)).length / u.size : 1; };

describe("Career Intelligence A/B/C", () => {
  it("사전 정의 사례에서 지표 계산 + 불변식", async () => {
    const rows: string[] = [];
    const summary: string[] = [];
    for (const c of CASES) {
      const o = getOccupation(c.occ)!;
      const alumni = getSyntheticRecords().filter((r) => r.career_field.some((f) => o.fields.includes(f)));
      const ncs = (await getNcsStandard(o)).ev;
      const posts = await getPostings(o);
      const sys = {
        A: computeSkillGap({ occupation: o, studentSkills: c.skills, ncs: null, postings: [], postingsQuery: posts.query, alumni }),
        B: computeSkillGap({ occupation: o, studentSkills: c.skills, ncs, postings: [], postingsQuery: posts.query, alumni }),
        C: computeSkillGap({ occupation: o, studentSkills: c.skills, ncs, postings: posts.list, postingsQuery: posts.query, alumni }),
      };
      for (const [k, g] of Object.entries(sys)) {
        const held = new Set(g.held.map((h) => h.skill));
        // 불변식 1: 보유 역량은 우선 학습 후보에 오르지 않는다
        expect(g.priorities.every((p) => !held.has(p.skill))).toBe(true);
        // 불변식 2: 모든 후보는 최소 1개 출처로 추적 가능
        const traceable = g.priorities.every((p) => p.ncs_units.length + p.posting_required + p.posting_preferred + p.alumni_count > 0);
        expect(traceable).toBe(true);
        // 불변식 3: 우선순위 0~1
        expect(g.demanded.every((d) => d.priority >= 0 && d.priority <= 1)).toBe(true);
        const roles = [g.sample.alumni ? "선배" : "", g.sample.ncs_units ? "NCS" : "", g.sample.postings ? "공고" : ""].filter(Boolean).join("+") || "없음";
        rows.push(`| ${c.id} | ${k} | ${roles} | ${g.demanded.length} | ${g.held.length} | ${g.unconfirmed.length} | ${g.priorities.map((p) => `${p.label}(${p.priority.toFixed(2)})`).join(", ") || "-"} | ${traceable ? "예" : "아니오"} | ${g.caveats.length} |`);
      }
      const top = (k: "A" | "B" | "C") => sys[k].priorities.map((p) => p.skill);
      summary.push(`| ${c.id} | ${c.desc} | ${jac(top("A"), top("B")).toFixed(2)} | ${jac(top("A"), top("C")).toFixed(2)} | ${ncs ? "있음(Fixture)" : "없음 → B=A"} | ${posts.list.length}(가상) |`);
      if (!ncs) expect(JSON.stringify(sys.A.priorities)).toBe(JSON.stringify(sys.B.priorities)); // NCS 없으면 B는 A와 동일 (지어내지 않음)
    }
    const md = [
      "# Career Intelligence A/B/C 비교 (자동 생성)",
      "",
      `생성: ${new Date().toISOString()} · 실행: \`WRITE_EVAL=1 npx vitest run tests/unit/career_intel_abc.test.ts\``,
      "",
      "> 모든 입력은 가상 데이터입니다(선배 기록 19건, NCS 예시 Fixture, 가상 공고 Fixture 22건). 정답 데이터가 없어 **정확도·품질 향상은 측정하지 않았습니다.** 아래는 구조 지표와 불변식 점검 결과입니다.",
      "",
      "## 사례별 지표",
      "",
      "| 사례 | 시스템 | 사용 출처 | 요구 역량 수 | 보유 겹침 | 미확인 | 우선 후보(우선순위) | 후보 추적 가능 | 한계 고지 수 |",
      "|---|---|---|---|---|---|---|---|---|",
      ...rows,
      "",
      "## 출처 추가에 따른 우선 후보 변화 (Top-3 Jaccard)",
      "",
      "| 사례 | 설명 | A↔B | A↔C | NCS | 공고 |",
      "|---|---|---|---|---|---|",
      ...summary,
      "",
      "불변식(모든 사례·시스템 통과): ① 보유 입력 역량은 우선 후보에 오르지 않음 ② 모든 후보가 1개 이상 출처로 추적됨 ③ 우선순위 ∈ [0,1] ④ NCS가 없는 직무는 B가 A와 동일(자료를 만들어내지 않음).",
    ].join("\n");
    if (process.env.WRITE_EVAL === "1") {
      const out = path.resolve(__dirname, "../../../results/eval/career_intel_abc.md");
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, md + "\n");
    }
    expect(rows.length).toBe(15);
  });
});
