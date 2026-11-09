# DATA_SCHEMA — 선배 경험 데이터

정의 위치: TypeScript 타입 `web/src/lib/types.ts` (`SeniorRecord`), 런타임 검증 `web/src/lib/schema.ts` (`SeniorRecordSchema`, zod).
가상 데이터 원본: `web/src/data/seniors.synthetic.json` (생성기: `scripts/build_synthetic_data.py`).

## 필드

| 필드 | 타입 | 설명 |
|---|---|---|
| record_id | string | 영문·숫자·`-`·`_` 1~40자. 가상은 `S-01`… |
| department | string | 학과 (시연에서는 시연용 분류) |
| department_is_demo_category | boolean | 실제 학과명으로 확인되지 않은 분류인지 여부 |
| graduation_year | int | 졸업 연도 |
| career_field | string[] | 진로 분야 ID (`taxonomy.ts CAREER_FIELDS`) |
| path_type | enum | graduate_school / industry_job / finance / foreign_company / public_sector / career_switch |
| current_role | string | 현재 직무 (직무명만 기재) |
| organization_type | string | 기관 **유형**만 기재. 실제 기관명은 저장하지 않음 |
| academic_background | {major, double_major?, minor?, graduate_degree?} | 학업 배경 |
| key_skills | string[] | 핵심 역량. Import 시 `canonicalSkill`로 표준 ID로 정규화 |
| courses | {name, skills_developed[]}[] | 수강 과목과, 그 과목으로 길렀다고 진술한 역량 |
| projects / internships | Experience[] | {title, kind, description, skills[], duration_months?, when?, org_type?, self_reported_link?} |
| certifications | string[] | 자격증 |
| career_decisions | {decision, alternatives[], reason, when?}[] | 진로 결정과 이유 (**선배 진술**) |
| preparation_timeline | {month_offset, label, activity, category}[] | 졸업 시점을 0으로 둔 상대 개월 |
| months_to_first_role | number \| null | 졸업 후 첫 정규 직무까지 개월. 학위 과정 중이면 null |
| difficulties / lessons_learned / advice | string[] | **선배 진술** |
| context_tags | string[] | 요약 태그 (예: 연구 지향, 경제적 부담, 선택지 유지) — 비교 엔진에서 사용 |
| evidence_source | {type, description} | type: synthetic_demo / survey_self_report / interview_verified |
| source_date | YYYY-MM-DD | 기록 작성일 (최신성 계산) |
| consent_status | enum | synthetic_not_applicable / consented / consent_withdrawn / pending |
| is_synthetic | boolean | 가상 데이터 여부. **시연 데이터는 모두 true** |

`self_reported_link: true`는 "이 경험이 진로로 이어졌다"고 선배가 직접 진술한 경우에만 씁니다. 이 값이 있을 때만 그래프에 LED_TO 엣지가 생깁니다.

## 선배 진술과 AI 추론의 구분

- 저장 데이터는 선배의 기록(진술)만 담습니다. AI가 만든 해석은 저장하지 않습니다.
- 화면에서는 진술 필드에 "선배 진술(가상)" 배지를 붙이고, 계산·생성 결과에는 "AI 분석 / 설계 가정 / Demo 템플릿 / AI 관점 페르소나" 같은 라벨을 붙여 구분합니다.

## 가상 데이터 원칙

- 19건, 학과 7개 시연용 분류, 경로 유형 6종
- 실명이 없고, 기관은 "(가상)" 유형으로만 표기하며, 연봉·합격률·취업 확률은 넣지 않았습니다
- `is_synthetic: true`, `evidence_source.type: synthetic_demo`, `consent_status: synthetic_not_applicable`
- 모든 화면에 "본 사례는 서비스 기능 시연을 위한 가상 데이터입니다"를 표시합니다

## 실제 데이터 수집과 Import

1. 설문 항목을 이 스키마에 맞춰 설계합니다 (템플릿: `web/public/templates/senior_import_template.{json,csv}`)
2. 동의서에 수집 목적, 공개 범위(학내 재학생), 보관 기간, 철회 방법을 명시합니다. 동의한 응답만 `consent_status: consented`로 표시합니다
3. 실명, 학번, 연락처, 기관명 등 식별 정보는 수집 단계에서 받지 않거나 제거합니다
4. `/admin` → 데이터 가져오기 → 검증(미리보기) → 저장. 저장 위치는 `web/data/imported/records.json`입니다
   - CSV: 목록은 `|`로 구분하고, 구조화 필드는 JSON 문자열로 넣습니다
   - 검증 내용: 스키마, 실제 데이터의 동의 여부, 전화번호·이메일·학번 형태 정보(있으면 거부), 프롬프트 인젝션 문구(있으면 격리)
5. 동의를 철회하면 `consent_status`를 `consent_withdrawn`으로 바꾸거나 삭제합니다. 동의 상태가 아닌 기록은 서비스 로딩 단계에서 자동으로 제외합니다

> 실제 동문 데이터를 운영하려면 별도의 동의 절차, 접근 통제(관리자 인증 `ADMIN_TOKEN`·학내 SSO), 개인정보 영향평가가 필요합니다. 자세한 내용은 NEXT_STEPS.md를 참고하세요.
