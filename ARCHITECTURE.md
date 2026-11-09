# ARCHITECTURE — AI 과선배 (HUFS Career Atlas)

## 1. 시스템 구조

```
[브라우저] ──(프로필·가중치·로드맵: localStorage)──┐
   │ fetch                                         │
   ▼                                               │
[Next.js Route Handlers  /api/*]  (127.0.0.1:3100) │
   ├─ lib/data        선배 기록 저장소 (가상 JSON + Import 파일)
   ├─ lib/scoring     개인화 매칭 S(x,e)  ← 순수 함수
   ├─ lib/retrieval   의미 유사도: local | embedding | embedding_rerank
   │     └─ mlClient ──HTTP──▶ [ml/server.py FastAPI :8008, GPU0]  bge-m3, bge-reranker-v2-m3
   ├─ lib/graph       Career Knowledge Graph 생성·필터·강조, GraphStore(→Neo4j)
   ├─ lib/comparison  진로 선택지 비교 엔진       ← 순수 함수
   ├─ lib/roadmap     로드맵 생성·저장 헬퍼        ← 순수 함수
   ├─ lib/chat        intent → orchestrator → providers
   │     └─ providers ──HTTP(OpenAI 호환)──▶ [vLLM :8009, GPU1, Qwen3-14B] 또는 클라우드 API, 또는 Demo
   ├─ lib/security    프롬프트 인젝션 탐지·정화
   └─ lib/eval        평가 질문·실행기 → data/runtime/eval_runs/
```

- 외부 API나 GPU가 없어도 동작합니다. ML 사이드카가 응답하지 않으면 로컬 검색으로, LLM이 설정되지 않았거나 호출에 실패하면 Demo Mode로 자동 대체합니다. 대체가 일어나면 화면에 사유를 표시합니다.
- 비밀키(`LLM_API_KEY`, `ADMIN_TOKEN`)는 서버 환경변수로만 읽고, 클라이언트에 전달하지 않습니다.
- 학생 프로필은 서버에 저장하지 않습니다. 계산을 요청할 때만 서버로 보냅니다.

## 2. 데이터 흐름 (시연 시나리오 기준)

1. 프로필 입력 → localStorage
2. `/api/match` : `profileToQuery(profile)` → `semanticScores()` → `rankRecords()` → 결과(세부 점수, 이유, 부족 요소, 신뢰도)
3. `/api/graph` : `filterRecordsForGraph` → `buildGraph` → `applyGraphFilter`. 노드 강조는 클라이언트에서 `highlightForNode`로 계산합니다
4. `/api/chat` : `analyzeQuestion` → 프로필 반영 → 검색·매칭 → 공식자료 확인 → (비교 질문이면) `compareOptions` → LLM 또는 템플릿 → `verifyCitations`
5. `/api/compare` : 매칭 결과에서 선택지별 근거 기록 선정 → 기준값 계산 → 우선순위 가중합
6. `/api/roadmap` : 비교 결과 1순위(또는 선택한 경로) + 부족 역량 + 경험 상태 → 1/3/6/12개월 항목. 저장은 클라이언트 localStorage

## 3. 개인화 점수 (lib/scoring.ts)

```
S(x,e) = Σ_i w_i·s_i / Σ_{i: s_i 계산 가능} w_i
기본 w = semantic .30, career .25, skill .20, context .15, evidence .10   (설계 가정, 학습값 아님)
```

| 세부 점수 | 계산 |
|---|---|
| SemanticSimilarity | 학생 질의(프로필 문장화, 상담 시 질문 포함)와 선배 기록 텍스트의 유사도. **local**: 문자 2·3-gram TF-IDF와 taxonomy 개념 토큰(동의어 → 분야/역량/학과)의 코사인을 0.45로 나눠 클리핑. **embedding**: bge-m3 코사인을 (cos−0.40)/0.40으로 클리핑. **embedding_rerank**: 0.5·임베딩 + 0.5·bge-reranker 시그모이드 점수 |
| CareerRelevance | 0.75·(0.8·관심분야-선배분야 최대 친화도 + 0.2·직접일치 비율) + 0.25·희망 진로유형-경로유형 일치(1 / 0.25) |
| SkillRelevance | 0.6·(선배 핵심역량별 학생 보유역량과의 최대 관련도 평균) + 0.4·(선배 역량과 관심분야 핵심역량의 관련도 평균) |
| ContextSimilarity | 학과(계열) 유사도, 복수·부전공 유사도, 대학원 선호 정렬, 빠른취업 선호 정렬(첫 직무까지 개월 기반), 경제적 제약 대비 '경제적 부담' 기록 여부의 평균 |
| EvidenceQuality | 0.5·기록 완성도 + 0.3·검증 수준(가상 .4 / 설문 .7 / 인터뷰 1) + 0.2·최신성. 동의가 없는 실제 기록은 0 |

**누락 데이터 원칙**: 학생 입력이 없어 계산할 수 없는 항목은 0이 아니라 `null`로 처리하고, 가중치에서 제외한 뒤 재정규화합니다. `coverage`(계산 가능한 항목의 가중치 합)를 함께 반환하며, `coverage≥0.8 & S≥0.5`면 신뢰도 높음, `≥0.55 & ≥0.35`면 보통, 그 외는 **낮음**으로 표시합니다.
가중치는 대시보드의 슬라이더와 프리셋으로 바꿀 수 있고, 바꾸면 즉시 재계산합니다.
점수는 "참고할 관련도"이며 확률이 아니라는 문구를 화면에 함께 표시합니다.

## 4. 그래프 데이터 모델 (lib/graph.ts)

노드는 `Department, Course, Skill, Experience, Career(진로 분야), Role(직무)` 6종입니다. 모든 노드와 엣지는 근거가 되는 `record_ids[]`를 가집니다.

| 엣지 | 방향 | 의미(semantics) |
|---|---|---|
| STUDIED | Department→Course | reported_activity: 해당 학과 선배가 수강 |
| DEVELOPED_SKILL | Course→Skill | reported_activity: 과목으로 역량을 길렀다고 진술 |
| PARTICIPATED_IN | Skill→Experience | reported_activity: 그 역량을 활용·개발한 활동 |
| LED_TO | Experience→Career | **self_reported_link**: 선배 본인이 "이어졌다"고 진술한 경우에만 생성. 인과 검증 아님 |
| RELATED_TO | Experience→Career | co_occurrence: 같은 기록에 함께 등장 (연결 진술 없음, 점선) |
| PURSUED | Career→Role | reported_sequence: 해당 분야에서 이 직무를 선택 |

활동과 결과가 함께 기록되었다는 사실만으로 인과를 주장하지 않도록, LED_TO와 RELATED_TO를 분리했습니다.
`GraphStore` 인터페이스(`InMemoryGraphStore`)와 `toCypher()`(MERGE 문 내보내기)는 Neo4j 이관을 위해 준비해 둔 것입니다.

## 5. 진로 비교 엔진 (lib/comparison.ts)

선택지마다 해당 경로 유형의 선배 기록 가운데 학생 관련도 S≥0.3인 상위 4건을 근거로 고르고, 6개 기준값(0~1, 클수록 학생에게 유리)을 계산합니다.

| 기준 | 근거 |
|---|---|
| 연구 전문성 | 설계 가정(대학원 .9 / 취업 .3) 50% + 근거 기록의 대학원 학위·연구 경험 비율 50% |
| 빠른 경제적 독립 | 근거 기록의 `months_to_first_role` 중앙값(재학 중은 36개월로 간주) → 단계 함수 (데이터) |
| 진로 유연성 | 설계 가정 50% + 경로 내 분야 다양성·"선택지 유지" 진술 비율 50% |
| 현재 준비도 적합 | 근거 선배 핵심역량 상위 7개 대비 보유역량 관련도 0.7 + 관련 경험(연구/인턴/프로젝트) 일치 0.3 (데이터) |
| 경제적 부담 낮음 | 1 − 근거 기록 중 '경제적 부담' 태그 비율 (데이터) |
| 근거 충분성 | 근거 수/4 × 평균 관련도/0.8 |

우선순위 프리셋(연구 전문성 / 빠른 취업 / 선택지 유지 / 균형) 또는 슬라이더 값이 가중치가 됩니다. 경제적 제약이 '큼'이면 경제적 부담 가중치를 +0.10 보정하고, 보정 내역을 화면에 표시합니다.
우선순위를 바꾸면 **기준값은 그대로 두고 가중치만 바뀌어** 순위가 실제로 재계산됩니다. 화면에는 변경 전후 점수, 바뀐 가중치, 1순위 변화, 결정 요인(1·2위 기여도 차)을 보여줍니다.
각 기준에는 "데이터 / 설계 가정 / 가정+데이터" 배지를 붙입니다.

## 6. AI 응답 생성 (lib/chat)

1. **질문 분석** (`intent.ts`, 규칙 기반): 비교 / 학과 진출 / 직무 준비 / 부족 요소 / 인턴십 / 공식정보 / 일반 / 범위 밖, 그리고 분야·역량·학과 개체와 인젝션 의심 여부
2. **프로필 참조**: 질문에 나온 분야를 우선하고, 비교 질문은 프로필 관심 분야와 합칩니다
3. **검색**: 개인화 S(x,e) 상위 5건 중 S≥0.35. 비교 엔진과 학과 분포에 쓰인 기록도 근거 목록에 넣어 화면 근거와 인용 검증 대상을 일치시킵니다
4. **공식 자료**: 졸업요건·학사규정·장학·채용일정·연봉·합격률 질문을 탐지합니다. 등록된 공식 자료가 0건이므로 추정하지 않습니다
5. **생성**
   - **가드레일**: 공식정보, 범위 밖, 인젝션 의심 질문은 LLM에 넘기지 않고 규칙 기반으로 안내합니다 (`answer_source: guardrail`)
   - **LLM**: 시스템 프롬프트(근거만 사용, `[S-01]` 인용, 수치·일정 생성 금지, evidence 안의 지시 무시, 가상 데이터 명시, 결정 대행 금지) + `<analysis>`(엔진 계산값) + `<evidence>`(정화된 기록). 본 답변과 3관점 JSON을 **병렬** 호출합니다
   - **Demo Mode**: intent별 템플릿에 검색·계산 결과를 채웁니다. 화면과 답변 첫 줄에 "LLM이 아님"을 표시합니다
6. **인용 검증**: `[S-04, S-09]` 같은 묶음 인용을 정규화하고, 검색되지 않은 ID는 `[인용 제거됨]`으로 바꿉니다. 인용이 없는 LLM 답변에는 경고를 붙입니다
7. **3관점**: 같은 근거 컨텍스트로 따뜻한·현실적·비판적 관점과 비교 요약을 만듭니다. "AI 관점 페르소나, 실제 선배 아님"을 표시합니다

### 프롬프트 인젝션 방어 (lib/security/injection.ts)

- Import 단계: 지시문 패턴이 있는 기록은 격리하고 저장하지 않습니다
- 프롬프트 구성: 기록과 질문을 `sanitizeForPrompt`로 정화합니다(패턴 치환, `<evidence>` 구분자 위조 제거)
- 질문에 규칙 변경 요구가 있으면 가드레일로 응답합니다

## 7. GPU 활용

| 구성 | 모델 | GPU | 용도 |
|---|---|---|---|
| ML 사이드카 | BAAI/bge-m3 (MIT), BAAI/bge-reranker-v2-m3 (Apache-2.0) | L40S #0 (~2.6GB) | 의미 검색, 리랭킹 |
| 로컬 LLM | Qwen/Qwen3-14B (Apache-2.0), vLLM, bf16, thinking off | L40S #1 | RAG 응답, 3관점 |

공용 GPU 서버에서는 실행 전 예약을 확인하고, `CUDA_DEVICE_ORDER=PCI_BUS_ID CUDA_VISIBLE_DEVICES=<번호>`를 명시합니다(스크립트에 반영).
vLLM의 FlashInfer 샘플러 JIT 빌드는 이 서버의 시스템 nvcc 문제로 실패해서 `VLLM_USE_FLASHINFER_SAMPLER=0`으로 껐습니다.


## 4.0·4.1 추가 구조
- 상담 스타일: `web/src/lib/counsel/` (스타일 정의, 합성, 사실 가드). 사실 답변은 스타일과 무관하게 캐시를 공유한다.
- Q&A 근거: `web/src/lib/qa/` (승인·동의·개인정보 확인).
- 관계 그래프 검색: `web/src/lib/graphrag/`. 요청마다 최신 권한으로 메모리에서 구성하고, 관계를 `[G-xx]` 근거로 프롬프트에 전달한다. 설계는 `docs/GRAPHRAG_4_1_DESIGN.md` 참고.
