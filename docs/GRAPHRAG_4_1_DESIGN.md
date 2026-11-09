# GRAPHRAG_4_1_DESIGN — 관계 그래프 검색 설계

> 2026-11-09 · 기능 플래그 `FEATURE_COURSE_GRAPH=1` (기본 꺼짐)

## 1. 데이터 상태
| 자료 | 상태 |
|---|---|
| 서버 내 수강편람 원본 | 없음 |
| 예시 관계 그래프(답변 67·키워드 162·연결 765) | 화면 이미지뿐이고 원본 파일이 없어 **재구성하지 않음** |
| 번들 수강편람 `web/src/data/catalog.synthetic.json` | **가상 데이터**: 문서 2건(2026-1, 2025-2), 과목 행 15건. 학교 자료에서 옮기지 않고 시연용으로 작성 |
| 선배 기록·Q&A | 19건·10건 모두 가상 |
| 직무–역량 | 테스트용 Fixture, 실제 NCS 원문 아님 |
| 공식 원문 관계 | **0건** |

### 공식 수강편람을 쓰지 않은 이유
학교 e-book 사이트에 2026학년도 수강편람이 공개되어 있지만, 재가공·재배포 허가를 확인하지 못했다. 홈페이지 약관에는 게시물 저작권이 학교에 귀속되고, 학교 정책이 허용하지 않는 복제·제공을 할 수 없다는 내용이 있으며 하단에 All Rights Reserved 표기가 있다. 그래서 원문을 내려받거나 그래프에 넣지 않았다.

### 공식 자료 등록 방법 (학교 허가 후)
`web/data/catalog/*.json`(Git 제외)에 `CatalogFileSchema` 형식으로 넣는다. 문서의 `status: "official"`, `url`, `license_confirmed: true`가 모두 있어야 인정된다. 공개 시연 모드는 이 폴더를 읽지 않는다. PDF에서 이 형식으로 변환하는 도구는 구현하지 않았다.

## 2. 재사용과 추가
| 구성요소 | 처리 |
|---|---|
| 선배 기록 그래프 `lib/graph.ts` | `buildGraph` 그대로 재사용 |
| 임베딩·리랭커·로컬 검색 | 기존 경로 유지, 그래프 결과는 별도 근거로 통합 |
| Q&A 권한 | 4.0 `ragEligible` 재사용 + 공개 범위 확인 추가 |
| 인용 검증·사실 가드 | 4.0 재사용, `G-xx` 추가 |
| 라이브러리 | 새로 도입하지 않음. Microsoft GraphRAG의 커뮤니티 요약 등은 미도입 |

## 3. 모델
노드: Department, Course, Skill, Experience, Career, Role, Topic, AlumniQA, SourceDocument. 학사 규정 자료가 없어 AcademicPolicy 노드는 만들지 않았다.

| 관계 | 근거 |
|---|---|
| DEPARTMENT_OFFERS_COURSE, COURSE_EXPLICITLY_COVERS_TOPIC, COURSE_REQUIRES_PREREQUISITE, DOCUMENT_SUPPORTS_CLAIM | 수강편람 항목 |
| ROLE_REQUIRES_SKILL, FIELD_HAS_ROLE | 직무 Fixture |
| COURSE_MAY_RELATE_TO_ROLE, 검색 시 COURSE_ROLE_BRIDGE | 규칙 추론 |
| QA_MENTIONS_COURSE, QA_MENTIONS_SKILL | 권한을 통과한 Q&A |
| STUDIED, DEVELOPED_SKILL, PARTICIPATED_IN, LED_TO, PURSUED | 기존 선배 기록 그래프 (활동–역량 관계는 PARTICIPATED_IN이 담당) |

각 관계: 출발·도착, 유형, 출처 문서 ID, 위치, 학년도·학기, 데이터 상태, 검증 상태, 생성 방식, 갱신 시각, 근거 문장.

등급: `official` · `external_verified` · `alumni_verified` · `inferred_candidate` · `synthetic_demo`. 현재 데이터의 분포는 `synthetic_demo`와 `inferred_candidate`뿐이다. `prerequisites: null`(미기재)과 `[]`(없다고 기재)를 구분하며 추론으로 채우지 않는다.

## 4. 검색 흐름
1. 질문에서 과목·역량·분야·학과·직무를 연결 (지시어는 직전 발화 참조)
2. 씨앗별 최대 2단계 탐색. 학과·문서 노드는 통과하지 않음
3. 씨앗 사이 경로 우선, 등급 가중. 진술 기록의 항목 수 제한
4. 수업을 묻고 직무가 있으면 학과–과목–역량–직무 연결을 만들어 **추론 후보**로 맨 앞에 배치
5. 학년도: 지정 시 그 해만, 없으면 과목별 최신만. 없는 해를 다른 해로 대신하지 않음
6. `<graph_evidence>`로 LLM에 전달, 기존 RAG 근거와 함께 사용. 답변의 없는 G-ID는 제거

사실 조회(개설 학과, 선수 과목, 학년도 차이, 취업 보장, 권한, 없는 관계)는 `direct.ts`의 규칙으로 답하고 LLM을 호출하지 않는다.

## 5. 권한과 철회
- 그래프는 요청마다 저장소의 최신 상태로 만든다. 저장된 그래프나 인덱스가 없다.
- 철회·비공개 Q&A는 노드가 생성되지 않는다.
- 답변 캐시 키에 저장소 수정 시각이 들어가고, 적중 시에도 인용 근거의 접근 가능 여부를 다시 확인한다.
- 익명 사용자는 `students_only` 실제 Q&A를 볼 수 없다 (4.1에서 강화).
- 임베딩 벡터 캐시는 텍스트 키이며, 검색 대상은 호출 시 권한을 통과한 문서로 한정된다.

## 6. 화면
`/graph?view=explore`: 질문 중심 국소 그래프(기본 1단계, 최대 2단계, 상한 15·25노드), 검색, 유형 필터, 상세(의미·연결·원문·출처·학년도·검증 상태), AI 선배 질문 연결(입력창에 채우기만 함), 모바일은 목록형. 노드는 아이콘과 유형 글자로도 구분한다. 진입점: 커리어 그래프 탭, 상담 근거의 "관계 그래프에서 보기", 서울캠퍼스 도서관.

Obsidian 프로그램은 쓰지 않았고 Obsidian 문서·영상의 기능을 재현한 것이 아니다. 연결형 탐색이라는 아이디어만 참고했다.

## 7. 구현하지 않은 것
공식 수강편람 수집·변환, 문서 원문 직접 조회, 커뮤니티 요약, 그래프 DB, 관계의 전문가 검증 절차, AcademicPolicy 노드, 관리자 그래프 편집 화면.
