#!/usr/bin/env python3
"""
가상 시연용 선배 경험 데이터 생성기.

- 출력: web/src/data/seniors.synthetic.json
- 모든 기록은 서비스 기능 시연을 위해 작성한 '가상 데이터'이며 실제 한국외대 동문 정보가 아니다.
- 실명·실제 기업명·연봉·합격률은 포함하지 않는다. 기관은 '유형(가상)'으로만 표기한다.
- 실행: python3 scripts/build_synthetic_data.py
"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "src" / "data" / "seniors.synthetic.json"

COMMON = {
    "department_is_demo_category": True,
    "evidence_source": {
        "type": "synthetic_demo",
        "description": "서비스 기능 시연을 위해 작성한 가상 데이터 (실제 선배 진술 아님)",
    },
    "source_date": "2026-11-04",
    "consent_status": "synthetic_not_applicable",
    "is_synthetic": True,
}


def c(name, *skills):
    return {"name": name, "skills_developed": list(skills)}


def x(kind, title, desc, skills, months=None, when=None, org=None, link=False):
    d = {"title": title, "kind": kind, "description": desc, "skills": skills}
    if months is not None:
        d["duration_months"] = months
    if when:
        d["when"] = when
    if org:
        d["org_type"] = org
    if link:
        d["self_reported_link"] = True
    return d


def t(m, label, activity, cat):
    return {"month_offset": m, "label": label, "activity": activity, "category": cat}


def dec(decision, alts, reason, when=None):
    d = {"decision": decision, "alternatives": alts, "reason": reason}
    if when:
        d["when"] = when
    return d


R = []

R.append(dict(
    record_id="S-01", department="수학과", graduation_year=2021,
    career_field=["ai_ml", "research_academia"], path_type="graduate_school",
    current_role="AI 연구원 (석사 졸업)", organization_type="국내 대기업 AI 연구조직(가상)",
    academic_background={"major": "수학과", "graduate_degree": "인공지능 석사(가상)"},
    key_skills=["python", "linear_algebra", "statistics", "machine_learning", "deep_learning", "research_writing"],
    courses=[c("선형대수학", "linear_algebra"), c("수리통계학", "statistics"), c("수치해석", "python", "optimization"), c("해석학", "mathematical_proof")],
    projects=[
        x("research", "학부연구생: 최적화 기반 학습 알고리즘 논문 리딩", "지도교수 연구실에서 1년간 논문 리딩과 간단한 재현 실험을 수행", ["research_writing", "optimization", "python"], 12, "3학년 1학기~4학년 1학기", link=True),
        x("project", "캡스톤: 이미지 분류 모델 비교 실험", "공개 데이터셋으로 여러 모델의 성능을 비교하고 보고서를 작성", ["deep_learning", "python"], 4, "4학년 1학기"),
    ],
    internships=[],
    certifications=[],
    career_decisions=[dec("석사 진학을 선택", ["학부 졸업 후 데이터 분석 직무 취업"], "모델이 왜 작동하는지 수학적으로 깊게 이해하고 싶었고, 학부연구생 경험이 잘 맞았다고 느꼈다.", "4학년 1학기")],
    preparation_timeline=[
        t(-18, "3학년 1학기", "학부연구생 시작, 선형대수·확률 복습", "research"),
        t(-10, "3학년 2학기", "관심 연구실 3곳 탐색 및 교수 면담", "research"),
        t(-6, "4학년 1학기", "대학원 지원서·연구계획서 작성", "application"),
        t(0, "졸업", "석사 과정 입학", "research"),
        t(24, "석사 졸업", "AI 연구원으로 첫 직무 시작", "application"),
    ],
    months_to_first_role=24,
    difficulties=["석사 2년간 수입이 적어 생활비 부담이 있었다", "처음에는 코딩 실력이 연구실 동료보다 부족했다"],
    lessons_learned=["수학 기초가 논문 이해 속도를 크게 좌우했다", "연구실 선택이 대학원 생활의 만족도를 결정한다"],
    advice=["대학원을 고민한다면 학부연구생으로 먼저 연구를 경험해 보세요", "연구실 선배와 직접 대화해 분위기를 확인하세요"],
    context_tags=["연구 지향", "학위 기간 수입 감소", "연구비 지원"],
))

R.append(dict(
    record_id="S-02", department="수학과", graduation_year=2022,
    career_field=["data_science"], path_type="industry_job",
    current_role="데이터 분석가", organization_type="국내 IT 플랫폼 기업(가상)",
    academic_background={"major": "수학과"},
    key_skills=["python", "sql", "statistics", "data_visualization", "communication", "certification_data"],
    courses=[c("확률론", "statistics"), c("회귀분석(타과 수강)", "statistics", "r"), c("데이터베이스(타과 수강)", "sql", "database")],
    projects=[
        x("competition", "공공데이터 분석 공모전", "지역 상권 데이터를 분석해 대시보드를 만들고 장려상 수준의 평가를 받음", ["python", "data_visualization", "communication"], 2, "3학년 여름방학"),
        x("project", "동아리 추천 시스템 프로젝트", "학내 동아리 데이터를 모아 간단한 추천 로직을 구현", ["python", "sql"], 3, "3학년 2학기"),
    ],
    internships=[x("internship", "체험형 데이터 분석 인턴", "서비스 로그를 SQL로 집계하고 주간 리포트를 작성", ["sql", "data_visualization", "communication"], 6, "4학년 1학기", "IT 스타트업(가상)", link=True)],
    certifications=["ADsP", "SQLD"],
    career_decisions=[dec("대학원 대신 학부 졸업 후 취업", ["통계 석사 진학"], "실무 데이터를 빨리 경험하고 싶었고, 경제적으로 독립하는 것이 중요했다.", "4학년 1학기")],
    preparation_timeline=[
        t(-15, "3학년 1학기", "Python·SQL 독학, 회귀분석 수강", "study"),
        t(-11, "3학년 여름", "공공데이터 공모전 참가", "project"),
        t(-8, "4학년 1학기", "체험형 인턴 6개월", "internship"),
        t(-3, "4학년 2학기", "포트폴리오 정리 후 공채 지원", "application"),
        t(2, "졸업 후", "데이터 분석가로 입사", "application"),
    ],
    months_to_first_role=2,
    difficulties=["수학과라 SQL·실무 도구 경험이 처음엔 부족했다", "분석 결과를 비전공자에게 설명하는 것이 어려웠다"],
    lessons_learned=["수학적 사고는 강점이지만 SQL과 시각화는 따로 연습해야 한다", "인턴 경험이 면접에서 가장 많이 질문받았다"],
    advice=["공모전 하나라도 끝까지 완성해서 결과물을 남기세요", "분석보다 '설명'을 연습하세요"],
    context_tags=["빠른 취업", "경제적 독립", "실무 경험 중시"],
))

R.append(dict(
    record_id="S-03", department="수학과", graduation_year=2020,
    career_field=["finance", "data_science"], path_type="finance",
    current_role="신용리스크 모델링 담당", organization_type="시중은행(가상)",
    academic_background={"major": "수학과", "minor": "경영 계열"},
    key_skills=["statistics", "sql", "financial_analysis", "python", "certification_finance", "excel"],
    courses=[c("확률론", "statistics"), c("금융수학(시연용 과목명)", "financial_analysis", "statistics"), c("재무관리(부전공)", "financial_analysis", "excel")],
    projects=[x("project", "신용점수 모형 스터디", "공개 대출 데이터로 로지스틱 회귀 모형을 만들어 보는 스터디", ["statistics", "python"], 3, "3학년 2학기")],
    internships=[x("internship", "금융권 체험형 인턴", "리스크 관리 부서 보조 업무와 엑셀 기반 보고서 작성", ["excel", "report_writing"], 2, "4학년 여름방학", "금융회사(가상)")],
    certifications=["투자자산운용사", "ADsP"],
    career_decisions=[dec("금융권 리스크 직무 선택", ["IT 기업 데이터 분석", "통계 대학원"], "수학·통계를 쓰면서도 고용 안정성이 높은 직무를 원했다.")],
    preparation_timeline=[
        t(-18, "3학년 1학기", "경영 부전공 시작, 재무관리 수강", "study"),
        t(-12, "3학년 2학기", "투자자산운용사 준비", "certification"),
        t(-6, "4학년 여름", "금융권 체험형 인턴", "internship"),
        t(-3, "4학년 2학기", "금융권 필기·면접 준비", "application"),
        t(6, "졸업 후", "은행 입행", "application"),
    ],
    months_to_first_role=6,
    difficulties=["필기·자격증·인턴을 동시에 준비해야 해 시간이 부족했다"],
    lessons_learned=["금융권은 자격증보다 직무 이해도를 묻는 질문이 많았다"],
    advice=["금융권을 원한다면 부전공이나 관련 과목으로 도메인 지식을 쌓으세요"],
    context_tags=["고용 안정성", "자격증 준비", "필기 준비 기간"],
))

R.append(dict(
    record_id="S-04", department="수학과", graduation_year=2019,
    career_field=["research_academia", "ai_ml"], path_type="graduate_school",
    current_role="박사과정 연구자 (최적화 이론)", organization_type="국내 대학원(가상)",
    academic_background={"major": "수학과", "graduate_degree": "응용수학 석사, 박사과정 재학(가상)"},
    key_skills=["optimization", "linear_algebra", "mathematical_proof", "python", "research_writing", "foreign_language"],
    courses=[c("해석학", "mathematical_proof"), c("현대대수학", "mathematical_proof"), c("수치해석", "optimization", "python"), c("선형대수학", "linear_algebra")],
    projects=[x("research", "학부 졸업논문: 볼록 최적화 수렴성 정리", "지도교수와 함께 수렴 증명을 정리한 졸업논문", ["mathematical_proof", "optimization", "research_writing"], 8, "4학년", link=True)],
    internships=[],
    certifications=[],
    career_decisions=[
        dec("석박사 통합 과정 대신 석사 후 박사 진학", ["석사 후 취업"], "석사 과정에서 연구가 맞는지 확인한 뒤 결정하고 싶었다."),
        dec("박사 진학", ["기업 연구소 취업"], "이론 연구를 계속하고 싶었다. 다만 장기간의 경제적 불확실성은 감수해야 했다."),
    ],
    preparation_timeline=[
        t(-20, "3학년 1학기", "해석학·대수학 심화 수강", "study"),
        t(-12, "4학년 1학기", "졸업논문 주제 선정", "research"),
        t(-5, "4학년 2학기", "대학원 지원", "application"),
        t(0, "졸업", "석사 입학", "research"),
        t(30, "석사 졸업", "박사과정 진학", "research"),
    ],
    months_to_first_role=None,
    difficulties=["장기간 연구 조교 수입에 의존해 경제적 부담이 컸다", "연구 성과가 나지 않는 시기에 진로 불안을 느꼈다"],
    lessons_learned=["박사는 '공부를 더 하는 것'이 아니라 직업으로서의 연구를 선택하는 것이다"],
    advice=["박사 진학 전 최소 1년은 연구를 직접 해 보고 결정하세요", "경제적 계획을 반드시 세우세요"],
    context_tags=["연구 지향", "경제적 부담", "장기 학위", "진로 불확실성"],
))

R.append(dict(
    record_id="S-05", department="수학과", graduation_year=2021,
    career_field=["public_policy", "data_science"], path_type="public_sector",
    current_role="공공기관 통계·데이터 담당", organization_type="공공기관(가상)",
    academic_background={"major": "수학과"},
    key_skills=["statistics", "ncs", "report_writing", "sql", "certification_data"],
    courses=[c("수리통계학", "statistics"), c("표본조사론(타과 수강)", "statistics", "report_writing")],
    projects=[x("project", "지역 인구 통계 분석 보고서", "공공 통계 자료를 활용해 지역별 인구 변화를 분석한 수업 보고서", ["statistics", "report_writing"], 3, "3학년 2학기")],
    internships=[x("internship", "공공기관 청년 체험형 인턴", "통계 자료 정리와 보도자료 초안 작성 보조", ["report_writing", "excel"], 4, "4학년 2학기", "공공기관(가상)")],
    certifications=["사회조사분석사 2급"],
    career_decisions=[dec("공공기관 통계 직무 선택", ["민간 데이터 분석"], "고용 안정성과 사회적 기여를 중요하게 생각했다.")],
    preparation_timeline=[
        t(-14, "3학년 2학기", "사회조사분석사 준비", "certification"),
        t(-8, "4학년 1학기", "NCS 필기 스터디", "study"),
        t(-4, "4학년 2학기", "공공기관 체험형 인턴", "internship"),
        t(10, "졸업 후", "필기·면접 재도전 후 입사", "application"),
    ],
    months_to_first_role=10,
    difficulties=["필기시험 준비가 길어져 졸업 후 공백이 생겼다"],
    lessons_learned=["공공기관은 직무기술서를 꼼꼼히 읽고 준비 방향을 정하는 것이 중요했다"],
    advice=["NCS는 일찍부터 조금씩 준비하는 편이 부담이 적어요"],
    context_tags=["고용 안정성", "사회적 기여", "필기 준비 기간"],
))

R.append(dict(
    record_id="S-06", department="수학과", graduation_year=2023,
    career_field=["ai_ml", "software"], path_type="industry_job",
    current_role="머신러닝 엔지니어", organization_type="국내 IT 기업(가상)",
    academic_background={"major": "수학과", "double_major": "컴퓨터공학 계열"},
    key_skills=["python", "machine_learning", "deep_learning", "programming", "cloud", "git", "algorithms"],
    courses=[c("선형대수학", "linear_algebra"), c("자료구조(복수전공)", "algorithms", "programming"), c("머신러닝(복수전공)", "machine_learning", "python"), c("확률론", "statistics")],
    projects=[
        x("project", "LLM 기반 학사 Q&A 챗봇 팀 프로젝트", "공개 문서로 검색 기반 챗봇을 만들고 클라우드에 배포", ["deep_learning", "python", "cloud", "git"], 4, "4학년 1학기"),
        x("competition", "데이터 분석 경진대회 참가", "정형 데이터 예측 대회에서 상위권 진입", ["machine_learning", "python"], 2, "3학년 겨울방학"),
    ],
    internships=[x("internship", "AI 스타트업 인턴", "모델 서빙 파이프라인 개선과 실험 자동화", ["python", "cloud", "machine_learning"], 4, "4학년 여름방학", "AI 스타트업(가상)", link=True)],
    certifications=["정보처리기사"],
    career_decisions=[
        dec("컴퓨터공학 계열 복수전공", ["통계 부전공"], "수학만으로는 구현 역량을 보여주기 어렵다고 느꼈다.", "2학년 2학기"),
        dec("대학원 대신 학부 졸업 후 취업, 필요 시 대학원 재검토", ["AI 석사 진학"], "실무에서 어떤 문제가 중요한지 먼저 경험한 뒤 대학원을 다시 판단하고 싶었다.", "4학년 1학기"),
    ],
    preparation_timeline=[
        t(-24, "2학년 2학기", "컴퓨터공학 계열 복수전공 시작", "study"),
        t(-14, "3학년 겨울", "데이터 분석 경진대회 참가", "project"),
        t(-10, "4학년 1학기", "LLM 챗봇 팀 프로젝트", "project"),
        t(-6, "4학년 여름", "AI 스타트업 인턴", "internship"),
        t(1, "졸업 직후", "머신러닝 엔지니어로 입사", "application"),
    ],
    months_to_first_role=1,
    difficulties=["수학과·컴공 복수전공을 병행하느라 학점 관리가 힘들었다", "대학원 진학 여부를 끝까지 고민했다"],
    lessons_learned=["수학 배경은 모델 이해에 강점이었지만 구현·배포 경험이 채용에서 더 직접적으로 평가되었다", "대학원은 나중에도 선택할 수 있는 옵션으로 남겨둘 수 있었다"],
    advice=["AI 직무를 원한다면 작은 서비스라도 끝까지 배포해 보세요", "대학원과 취업을 둘 중 하나로만 보지 말고 순서의 문제로도 생각해 보세요"],
    context_tags=["빠른 취업", "선택지 유지", "실무 경험 중시"],
))

R.append(dict(
    record_id="S-07", department="통계 계열", graduation_year=2022,
    career_field=["data_science", "research_academia"], path_type="graduate_school",
    current_role="데이터 사이언티스트 (통계 석사)", organization_type="헬스케어 기업(가상)",
    academic_background={"major": "통계 계열", "graduate_degree": "통계학 석사(가상)"},
    key_skills=["statistics", "r", "python", "machine_learning", "research_writing", "data_visualization"],
    courses=[c("회귀분석", "statistics", "r"), c("다변량분석", "statistics"), c("통계적 학습", "machine_learning")],
    projects=[x("research", "학부연구생: 임상 데이터 생존분석", "교수 연구 프로젝트에서 생존분석 코드 작성", ["statistics", "r", "research_writing"], 8, "4학년", link=True)],
    internships=[],
    certifications=["ADsP"],
    career_decisions=[dec("통계 석사 진학", ["학부 졸업 후 분석 직무"], "헬스케어처럼 방법론 전문성이 중요한 분야로 가고 싶었다.")],
    preparation_timeline=[
        t(-12, "4학년 1학기", "학부연구생", "research"),
        t(-5, "4학년 2학기", "대학원 지원", "application"),
        t(0, "졸업", "석사 입학", "research"),
        t(26, "석사 졸업", "데이터 사이언티스트 입사", "application"),
    ],
    months_to_first_role=26,
    difficulties=["석사 기간 동안 동기들의 취업 소식에 조급함을 느꼈다"],
    lessons_learned=["도메인(의료) 지식과 통계 방법론을 함께 갖추니 지원할 수 있는 자리가 분명해졌다"],
    advice=["대학원을 간다면 '어떤 문제를 풀고 싶은지'를 먼저 정하세요"],
    context_tags=["연구 지향", "전문성", "학위 기간 수입 감소"],
))

R.append(dict(
    record_id="S-08", department="컴퓨터공학 계열", graduation_year=2021,
    career_field=["software"], path_type="industry_job",
    current_role="백엔드 개발자", organization_type="핀테크 스타트업(가상)",
    academic_background={"major": "컴퓨터공학 계열"},
    key_skills=["programming", "algorithms", "database", "cloud", "git", "sql"],
    courses=[c("자료구조", "algorithms"), c("데이터베이스", "database", "sql"), c("운영체제", "programming"), c("소프트웨어공학", "git")],
    projects=[x("project", "교내 중고거래 웹서비스", "팀으로 웹서비스를 만들어 실제 사용자 200명 수준까지 운영", ["programming", "database", "cloud"], 6, "3학년", link=True)],
    internships=[x("internship", "개발 인턴", "API 개발과 테스트 코드 작성", ["programming", "git"], 3, "4학년 여름방학", "IT 서비스 기업(가상)")],
    certifications=["정보처리기사"],
    career_decisions=[dec("스타트업 백엔드 개발자로 입사", ["대기업 공채 대기"], "빠르게 많은 것을 경험할 수 있는 환경을 원했다.")],
    preparation_timeline=[
        t(-18, "3학년", "웹서비스 프로젝트 운영", "project"),
        t(-10, "4학년 1학기", "코딩테스트 준비", "study"),
        t(-6, "4학년 여름", "개발 인턴", "internship"),
        t(3, "졸업 후", "백엔드 개발자 입사", "application"),
    ],
    months_to_first_role=3,
    difficulties=["코딩테스트와 학업 병행"],
    lessons_learned=["실제 사용자가 있는 서비스를 운영해 본 경험이 가장 큰 차별점이었다"],
    advice=["작더라도 실제로 운영되는 서비스를 만들어 보세요"],
    context_tags=["빠른 취업", "실무 경험 중시"],
))

R.append(dict(
    record_id="S-09", department="컴퓨터공학 계열", graduation_year=2020,
    career_field=["ai_ml", "research_academia"], path_type="graduate_school",
    current_role="NLP 연구 엔지니어 (석사 졸업)", organization_type="AI 연구소(가상)",
    academic_background={"major": "컴퓨터공학 계열", "graduate_degree": "인공지능 석사(가상)"},
    key_skills=["python", "deep_learning", "machine_learning", "research_writing", "linear_algebra", "foreign_language"],
    courses=[c("인공지능", "machine_learning"), c("딥러닝", "deep_learning", "python"), c("선형대수", "linear_algebra")],
    projects=[x("research", "학부연구생: 한국어 문장 분류 실험", "한국어 데이터셋으로 분류 모델을 학습하고 학회 포스터 발표", ["deep_learning", "research_writing", "python"], 10, "3학년 2학기~4학년", link=True)],
    internships=[],
    certifications=[],
    career_decisions=[dec("AI 석사 진학", ["개발자 취업"], "연구 경력이 있어야 지원 가능한 연구 직무를 원했다.")],
    preparation_timeline=[
        t(-16, "3학년 2학기", "학부연구생 시작", "research"),
        t(-8, "4학년 1학기", "학회 포스터 발표", "research"),
        t(-5, "4학년 2학기", "대학원 지원", "application"),
        t(24, "석사 졸업", "연구 엔지니어 입사", "application"),
    ],
    months_to_first_role=24,
    difficulties=["영어 논문 작성이 가장 큰 벽이었다"],
    lessons_learned=["학부 때 발표 경험 하나가 대학원 지원에서 큰 신뢰를 줬다"],
    advice=["관심 연구실의 최근 논문 3편을 읽고 컨택하세요"],
    context_tags=["연구 지향", "학위 기간 수입 감소", "연구비 지원"],
))

R.append(dict(
    record_id="S-10", department="컴퓨터공학 계열", graduation_year=2022,
    career_field=["data_engineering", "software"], path_type="industry_job",
    current_role="데이터 엔지니어", organization_type="이커머스 기업(가상)",
    academic_background={"major": "컴퓨터공학 계열"},
    key_skills=["sql", "python", "cloud", "database", "programming"],
    courses=[c("데이터베이스", "database", "sql"), c("분산시스템", "cloud")],
    projects=[x("project", "공공 API 수집 파이프라인", "공공 API 데이터를 매일 수집·적재하는 파이프라인 구축", ["python", "cloud", "database"], 3, "4학년 1학기", link=True)],
    internships=[x("internship", "데이터 플랫폼 인턴", "로그 적재 배치 작업 모니터링", ["sql", "cloud"], 2, "4학년 여름방학", "이커머스 기업(가상)", link=True)],
    certifications=["SQLD"],
    career_decisions=[dec("데이터 엔지니어 직무 선택", ["백엔드 개발"], "데이터가 흐르는 구조를 설계하는 일이 재미있었다.")],
    preparation_timeline=[
        t(-10, "4학년 1학기", "수집 파이프라인 프로젝트", "project"),
        t(-6, "4학년 여름", "데이터 플랫폼 인턴", "internship"),
        t(2, "졸업 후", "전환형 채용으로 입사", "application"),
    ],
    months_to_first_role=2,
    difficulties=["클라우드 비용 때문에 개인 프로젝트 규모를 줄여야 했다"],
    lessons_learned=["SQL은 모든 데이터 직무의 공통 언어였다"],
    advice=["작은 파이프라인이라도 매일 돌아가게 만들어 보세요"],
    context_tags=["빠른 취업", "실무 경험 중시"],
))

R.append(dict(
    record_id="S-11", department="경영 계열", graduation_year=2021,
    career_field=["marketing", "data_science"], path_type="industry_job",
    current_role="마케팅 데이터 분석 담당", organization_type="커머스 기업(가상)",
    academic_background={"major": "경영 계열"},
    key_skills=["sql", "data_visualization", "business_analysis", "excel", "communication"],
    courses=[c("마케팅원론", "business_analysis"), c("경영통계", "statistics", "excel"), c("소비자행동론", "user_research")],
    projects=[x("project", "학내 카페 고객 데이터 분석", "설문과 매출 데이터를 결합해 프로모션 효과를 분석", ["excel", "data_visualization", "statistics"], 2, "3학년 2학기")],
    internships=[x("internship", "그로스 마케팅 인턴", "광고 성과 대시보드 관리", ["sql", "data_visualization"], 4, "4학년 1학기", "커머스 기업(가상)", link=True)],
    certifications=["SQLD", "구글 애널리틱스 관련 교육 수료"],
    career_decisions=[dec("마케팅 중에서도 데이터 분석 역할 선택", ["브랜드 마케팅"], "숫자로 성과를 설명할 수 있는 일이 나와 맞았다.")],
    preparation_timeline=[
        t(-12, "3학년 2학기", "고객 데이터 분석 프로젝트", "project"),
        t(-8, "4학년 1학기", "그로스 마케팅 인턴", "internship"),
        t(1, "졸업 후", "입사", "application"),
    ],
    months_to_first_role=1,
    difficulties=["경영 전공이라 SQL을 처음부터 독학해야 했다"],
    lessons_learned=["비즈니스 질문을 데이터 질문으로 바꾸는 능력이 핵심이었다"],
    advice=["경영 전공도 SQL 하나만 확실히 하면 데이터 역할에 도전할 수 있어요"],
    context_tags=["빠른 취업", "실무 경험 중시"],
))

R.append(dict(
    record_id="S-12", department="경영 계열", graduation_year=2020,
    career_field=["finance", "business_strategy"], path_type="finance",
    current_role="디지털 전략 기획 담당", organization_type="시중은행(가상)",
    academic_background={"major": "경영 계열"},
    key_skills=["business_analysis", "financial_analysis", "presentation", "excel", "certification_finance"],
    courses=[c("재무관리", "financial_analysis"), c("경영전략", "business_analysis"), c("투자론", "financial_analysis")],
    projects=[x("competition", "금융 아이디어 공모전", "청년 대상 금융 서비스 기획안 제출", ["business_analysis", "presentation"], 2, "3학년 2학기")],
    internships=[x("internship", "금융권 체험형 인턴", "디지털 채널 고객 의견 분석 보조", ["business_analysis", "excel"], 2, "4학년 여름방학", "금융회사(가상)")],
    certifications=["신용분석사"],
    career_decisions=[dec("금융권 디지털 직무 지원", ["컨설팅"], "안정성과 디지털 전환 업무를 함께 경험할 수 있다고 봤다.")],
    preparation_timeline=[
        t(-12, "3학년 2학기", "금융 공모전", "project"),
        t(-9, "4학년 1학기", "신용분석사 준비", "certification"),
        t(-5, "4학년 여름", "체험형 인턴", "internship"),
        t(5, "졸업 후", "입행", "application"),
    ],
    months_to_first_role=5,
    difficulties=["자격증과 공모전 준비가 겹쳐 학점이 떨어졌다"],
    lessons_learned=["금융권도 데이터 이해를 요구하는 직무가 늘어나고 있었다"],
    advice=["금융 지식과 함께 기본적인 데이터 활용 능력을 갖추세요"],
    context_tags=["고용 안정성", "자격증 준비"],
))

R.append(dict(
    record_id="S-13", department="경영 계열", graduation_year=2022,
    career_field=["business_strategy", "global_business"], path_type="foreign_company",
    current_role="컨설팅 애널리스트", organization_type="외국계 컨설팅사(가상)",
    academic_background={"major": "경영 계열", "double_major": "통계 계열"},
    key_skills=["business_analysis", "excel", "presentation", "foreign_language", "data_visualization", "statistics"],
    courses=[c("경영전략", "business_analysis"), c("회귀분석(복수전공)", "statistics"), c("비즈니스 영어", "foreign_language", "presentation")],
    projects=[x("competition", "케이스 컴피티션 참가", "기업 문제 해결 케이스를 팀으로 분석·발표", ["business_analysis", "presentation", "communication"], 2, "3학년")],
    internships=[x("internship", "외국계 기업 리서치 인턴", "산업 리서치와 영문 보고서 작성", ["business_analysis", "foreign_language", "report_writing"], 3, "4학년 1학기", "외국계 기업(가상)", link=True)],
    certifications=["영어 공인시험 고득점"],
    career_decisions=[dec("외국계 컨설팅 지원", ["국내 대기업 기획"], "다양한 산업을 빠르게 경험하며 진로 선택지를 넓히고 싶었다.")],
    preparation_timeline=[
        t(-14, "3학년", "케이스 컴피티션", "project"),
        t(-8, "4학년 1학기", "리서치 인턴", "internship"),
        t(-3, "4학년 2학기", "케이스 면접 준비", "application"),
        t(2, "졸업 후", "입사", "application"),
    ],
    months_to_first_role=2,
    difficulties=["영어 케이스 면접 준비가 어려웠다", "업무 강도가 높았다"],
    lessons_learned=["외국계는 수시 채용이 많아 정보 수집 채널이 중요했다"],
    advice=["관심 기업 출신 선배에게 직무를 직접 물어보세요"],
    context_tags=["선택지 유지", "글로벌 환경", "높은 업무 강도"],
))

R.append(dict(
    record_id="S-14", department="언어 계열", graduation_year=2021,
    career_field=["localization_language_tech", "global_business"], path_type="foreign_company",
    current_role="현지화(로컬라이제이션) PM", organization_type="외국계 IT 기업(가상)",
    academic_background={"major": "언어 계열(외국어 전공)"},
    key_skills=["foreign_language", "communication", "linguistics", "presentation", "excel"],
    courses=[c("번역학 입문", "foreign_language"), c("언어학개론", "linguistics"), c("비즈니스 커뮤니케이션", "communication", "presentation")],
    projects=[x("project", "게임 현지화 번역 프로젝트", "인디 게임 텍스트의 현지화 품질 기준을 정리", ["foreign_language", "linguistics"], 3, "3학년 2학기", link=True)],
    internships=[x("internship", "현지화 QA 인턴", "다국어 UI 문자열 검수", ["foreign_language", "communication"], 3, "4학년 1학기", "외국계 IT 기업(가상)", link=True)],
    certifications=["외국어 공인 시험", "영어 공인시험"],
    career_decisions=[dec("번역가 대신 현지화 PM 직무 선택", ["프리랜서 번역"], "언어 역량을 살리면서 IT 제품에 참여하고 싶었다.")],
    preparation_timeline=[
        t(-12, "3학년 2학기", "현지화 번역 프로젝트", "project"),
        t(-8, "4학년 1학기", "현지화 QA 인턴", "internship"),
        t(3, "졸업 후", "PM으로 입사", "application"),
    ],
    months_to_first_role=3,
    difficulties=["IT 용어와 개발 프로세스를 따로 공부해야 했다"],
    lessons_learned=["외국어 실력만이 아니라 프로젝트 관리 경험이 함께 평가되었다"],
    advice=["언어 전공자는 '언어 + 하나의 도메인' 조합을 만들어 보세요"],
    context_tags=["글로벌 환경", "전공 활용"],
))

R.append(dict(
    record_id="S-15", department="국제지역 계열", graduation_year=2020,
    career_field=["public_policy", "global_business"], path_type="public_sector",
    current_role="국제협력 사업 담당", organization_type="공공기관(가상)",
    academic_background={"major": "국제지역 계열"},
    key_skills=["foreign_language", "report_writing", "ncs", "communication"],
    courses=[c("지역연구방법론", "report_writing"), c("국제개발협력론", "report_writing"), c("지역 언어 심화", "foreign_language")],
    projects=[x("extracurricular", "국제개발 NGO 대학생 서포터즈", "해외 사업 홍보 콘텐츠 제작", ["communication", "foreign_language"], 6, "3학년")],
    internships=[x("internship", "공공기관 체험형 인턴", "해외 협력 사업 자료 번역과 정리", ["foreign_language", "report_writing"], 5, "4학년 2학기", "공공기관(가상)", link=True)],
    certifications=["외국어 공인 시험", "한국사능력검정"],
    career_decisions=[dec("공공기관 국제협력 직무 선택", ["해외 대학원 진학"], "지역 전문성을 공공 영역에서 활용하고 싶었다.")],
    preparation_timeline=[
        t(-16, "3학년", "NGO 서포터즈", "project"),
        t(-8, "4학년 1학기", "NCS 준비", "study"),
        t(-4, "4학년 2학기", "공공기관 인턴", "internship"),
        t(8, "졸업 후", "입사", "application"),
    ],
    months_to_first_role=8,
    difficulties=["채용 인원이 적어 여러 기관에 지원해야 했다"],
    lessons_learned=["지역 전문성을 보여줄 구체적 결과물이 필요했다"],
    advice=["관심 지역 관련 보고서를 직접 써 보세요"],
    context_tags=["사회적 기여", "고용 안정성", "필기 준비 기간"],
))

R.append(dict(
    record_id="S-16", department="언어 계열", graduation_year=2023,
    career_field=["localization_language_tech", "ai_ml"], path_type="career_switch",
    current_role="AI 학습데이터 기획 담당", organization_type="AI 데이터 기업(가상)",
    academic_background={"major": "언어 계열(외국어 전공)", "minor": "컴퓨터공학 계열"},
    key_skills=["linguistics", "data_annotation", "foreign_language", "python", "communication"],
    courses=[c("말뭉치언어학", "linguistics", "data_annotation"), c("파이썬 프로그래밍(부전공)", "python"), c("언어학개론", "linguistics")],
    projects=[x("project", "다국어 감성 말뭉치 구축 프로젝트", "라벨링 가이드라인 작성과 품질 검수", ["data_annotation", "linguistics", "python"], 4, "4학년 1학기", link=True)],
    internships=[x("internship", "데이터 라벨링 운영 인턴", "라벨러 교육 자료 작성과 품질 지표 관리", ["data_annotation", "communication"], 3, "4학년 여름방학", "AI 데이터 기업(가상)", link=True)],
    certifications=["외국어 공인 시험"],
    career_decisions=[dec("언어 전공을 살려 AI 데이터 분야로 전환", ["통번역 대학원"], "AI 시대에 언어 전문성이 데이터 품질로 연결된다고 봤다.")],
    preparation_timeline=[
        t(-15, "3학년 1학기", "컴퓨터공학 부전공 시작", "study"),
        t(-10, "4학년 1학기", "말뭉치 구축 프로젝트", "project"),
        t(-6, "4학년 여름", "라벨링 운영 인턴", "internship"),
        t(2, "졸업 후", "입사", "application"),
    ],
    months_to_first_role=2,
    difficulties=["개발자와 소통하기 위해 기본 프로그래밍을 따로 익혀야 했다"],
    lessons_learned=["전공이 달라도 '언어 데이터'라는 연결고리를 만들면 AI 분야에 기여할 수 있었다"],
    advice=["파이썬 기초만 익혀도 협업의 폭이 넓어져요"],
    context_tags=["전공 전환", "선택지 유지"],
))

R.append(dict(
    record_id="S-17", department="국제지역 계열", graduation_year=2022,
    career_field=["global_business"], path_type="industry_job",
    current_role="해외영업 담당", organization_type="국내 제조 기업(가상)",
    academic_background={"major": "국제지역 계열", "double_major": "경영 계열"},
    key_skills=["foreign_language", "negotiation", "communication", "business_analysis", "excel"],
    courses=[c("국제통상론(복수전공)", "business_analysis"), c("지역 언어 회화", "foreign_language"), c("마케팅원론(복수전공)", "business_analysis")],
    projects=[x("extracurricular", "해외 박람회 통역 봉사", "바이어 미팅 통역 지원", ["foreign_language", "negotiation"], 1, "3학년 여름방학", link=True)],
    internships=[x("internship", "무역 실무 인턴", "수출 서류와 바이어 커뮤니케이션 보조", ["foreign_language", "excel", "communication"], 3, "4학년 1학기", "중견 무역 기업(가상)")],
    certifications=["무역 관련 자격증", "외국어 공인 시험"],
    career_decisions=[dec("해외영업 직무 선택", ["외국계 기업 지원"], "현지 언어를 직접 쓰는 현장 업무를 원했다.")],
    preparation_timeline=[
        t(-12, "3학년 여름", "박람회 통역 봉사", "project"),
        t(-8, "4학년 1학기", "무역 실무 인턴", "internship"),
        t(3, "졸업 후", "입사", "application"),
    ],
    months_to_first_role=3,
    difficulties=["출장이 잦아 일과 삶의 균형을 맞추기 어려웠다"],
    lessons_learned=["언어 실력 이상으로 제품 이해도가 중요했다"],
    advice=["관심 산업의 제품을 하나 정해 깊게 공부해 보세요"],
    context_tags=["글로벌 환경", "빠른 취업"],
))

R.append(dict(
    record_id="S-18", department="언어 계열", graduation_year=2020,
    career_field=["ux_research"], path_type="career_switch",
    current_role="UX 리서처", organization_type="IT 서비스 기업(가상)",
    academic_background={"major": "언어 계열(외국어 전공)", "minor": "통계 계열"},
    key_skills=["user_research", "communication", "statistics", "presentation", "report_writing"],
    courses=[c("사회조사방법론(타과 수강)", "user_research", "statistics"), c("담화분석", "linguistics", "communication")],
    projects=[x("project", "학내 앱 사용성 인터뷰 프로젝트", "학생 12명 인터뷰 후 개선안 보고서 작성", ["user_research", "report_writing"], 3, "4학년 1학기", link=True)],
    internships=[x("internship", "UX 리서치 인턴", "사용자 인터뷰 진행 보조와 녹취 분석", ["user_research", "communication"], 4, "4학년 2학기", "IT 서비스 기업(가상)")],
    certifications=[],
    career_decisions=[dec("전공과 다른 UX 리서치 분야로 진출", ["외국어 강사"], "사람의 말과 행동을 해석하는 일이 전공과 연결된다고 느꼈다.")],
    preparation_timeline=[
        t(-14, "3학년 2학기", "통계 부전공 시작", "study"),
        t(-10, "4학년 1학기", "사용성 인터뷰 프로젝트", "project"),
        t(-4, "4학년 2학기", "UX 리서치 인턴", "internship"),
        t(4, "졸업 후", "입사", "application"),
    ],
    months_to_first_role=4,
    difficulties=["포트폴리오를 처음부터 만들어야 했다"],
    lessons_learned=["정성 조사와 기본 통계를 함께 다룰 수 있다는 점이 강점이 되었다"],
    advice=["작은 사용자 조사라도 과정과 결과를 문서로 남기세요"],
    context_tags=["전공 전환", "선택지 유지"],
))

R.append(dict(
    record_id="S-19", department="경제 계열", graduation_year=2023,
    career_field=["finance", "data_science"], path_type="finance",
    current_role="핀테크 데이터 분석 담당", organization_type="핀테크 기업(가상)",
    academic_background={"major": "경제 계열"},
    key_skills=["python", "sql", "statistics", "financial_analysis", "data_visualization"],
    courses=[c("계량경제학", "statistics", "r"), c("화폐금융론", "financial_analysis"), c("파이썬 데이터분석(교양)", "python")],
    projects=[x("project", "금리 변화와 소비 데이터 분석", "공개 통계 자료로 시계열 분석 보고서 작성", ["python", "statistics", "data_visualization"], 3, "4학년 1학기", link=True)],
    internships=[x("internship", "핀테크 데이터 인턴", "이상거래 탐지 지표 대시보드 보조", ["sql", "data_visualization"], 3, "4학년 여름방학", "핀테크 기업(가상)", link=True)],
    certifications=["ADsP"],
    career_decisions=[dec("전통 금융권 대신 핀테크 데이터 직무 선택", ["은행 공채"], "데이터를 직접 다루는 일을 하고 싶었다.")],
    preparation_timeline=[
        t(-12, "4학년 1학기", "시계열 분석 프로젝트", "project"),
        t(-6, "4학년 여름", "핀테크 데이터 인턴", "internship"),
        t(1, "졸업 후", "전환형 채용으로 입사", "application"),
    ],
    months_to_first_role=1,
    difficulties=["SQL을 실무 수준으로 다루기까지 시간이 걸렸다"],
    lessons_learned=["경제학적 해석 능력이 데이터 분석의 차별점이 되었다"],
    advice=["전공 지식으로 데이터를 '해석'하는 연습을 하세요"],
    context_tags=["빠른 취업", "실무 경험 중시"],
))

records = [{**r, **COMMON} for r in R]
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(records)} synthetic records -> {OUT}")
