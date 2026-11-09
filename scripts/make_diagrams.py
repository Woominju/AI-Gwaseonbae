#!/usr/bin/env python3
"""발표용 구조도 SVG 생성. 사용: python3 scripts/make_diagrams.py <출력 폴더>
실제 구현된 연결만 그린다. 모든 그림에 '개념도' 표시를 넣어 실제 화면 캡처와 구분한다."""
import os
import sys
from html import escape

OUT = sys.argv[1] if len(sys.argv) > 1 else "results/presentation_assets_final/09_architecture_diagrams"
CREAM, TEAL, NAVY, AMBER, VIOLET, INK, LINE = "#fffaf2", "#1f7a78", "#0b1f3a", "#b26a00", "#7a4fa3", "#334155", "#ead9bf"
FONT = "Pretendard, 'Noto Sans KR', 'Malgun Gothic', sans-serif"


class D:
    def __init__(self, title, w=1600, h=900, sub=""):
        self.w, self.h = w, h
        self.p = [f'<rect width="{w}" height="{h}" fill="{CREAM}"/>',
                  f'<text x="60" y="78" font-size="42" font-weight="800" fill="{NAVY}">{escape(title)}</text>',
                  f'<rect x="{w-190}" y="44" width="130" height="44" rx="22" fill="{NAVY}"/><text x="{w-125}" y="74" font-size="22" fill="#fff" text-anchor="middle" font-weight="700">개념도</text>']
        if sub:
            self.p.append(f'<text x="60" y="120" font-size="24" fill="{INK}">{escape(sub)}</text>')
        self.p.insert(0, f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="{TEAL}"/></marker></defs>')

    def box(self, x, y, w, h, title, lines=(), color=TEAL, fill="#fff", tsize=26):
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="20" fill="{fill}" stroke="{color}" stroke-width="3"/>')
        ty = y + 42 if lines else y + h / 2 + tsize * 0.36
        self.p.append(f'<text x="{x+w/2}" y="{ty}" font-size="{tsize}" font-weight="800" fill="{NAVY}" text-anchor="middle">{escape(title)}</text>')
        for i, l in enumerate(lines):
            self.p.append(f'<text x="{x+w/2}" y="{y+78+i*30}" font-size="20" fill="{INK}" text-anchor="middle">{escape(l)}</text>')

    def arrow(self, x1, y1, x2, y2, label="", dash=False, color=TEAL):
        d = ' stroke-dasharray="9 7"' if dash else ""
        self.p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="4" marker-end="url(#a)"{d}/>')
        if label:
            self.p.append(f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2-12}" font-size="19" fill="{INK}" text-anchor="middle">{escape(label)}</text>')

    def note(self, y, text, color=AMBER):
        self.p.append(f'<text x="60" y="{y}" font-size="22" fill="{color}" font-weight="600">{escape(text)}</text>')

    def save(self, name):
        s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" font-family="{FONT}">' + "".join(self.p) + "</svg>"
        with open(os.path.join(OUT, name), "w", encoding="utf8") as f:
            f.write(s)


def flow():
    d = D("AI 과선배 서비스 이용 흐름", h=620, sub="학생이 캠퍼스에서 AI 선배를 만나 근거 기반 진로 계획까지 이어 가는 과정")
    items = [("학생 프로필", ["학과·관심 분야", "모두 선택 입력"]), ("가상 캠퍼스", ["선배 광장", "서울·글로벌"]), ("AI 선배", ["상담 스타일", "선택·혼합"]), ("근거 기반 상담", ["출처 표시", "인용 검증"]), ("진로 분석", ["선택지 비교", "역량 차이"]), ("개인별 로드맵", ["1·3·6·12개월", "행동 계획"])]
    w, g, x = 205, 42, 60
    for i, (t, ls) in enumerate(items):
        d.box(x + i * (w + g), 220, w, 190, t, ls, tsize=25)
        if i < 5:
            d.arrow(x + i * (w + g) + w, 315, x + (i + 1) * (w + g) - 2, 315)
    d.note(510, "선배 기록과 Q&A는 현재 모두 가상 시연 데이터이며, 실제 동문 데이터는 0건입니다.")
    d.save("fig1_service_flow.svg")


def arch():
    d = D("전체 시스템 아키텍처", h=960, sub="실제 구현·검증된 연결만 표시 (점선은 선택 구성)")
    d.box(60, 170, 300, 300, "웹 화면", ["Next.js · React", "2D 캠퍼스 · 상담창", "관계 탐색 · 대시보드", "프로필은 브라우저 저장"])
    d.box(430, 170, 320, 300, "상담 API", ["/api/lounge/chat", "/api/graph/explore", "/api/admin/qa", "질문 분류 · 위기 분기", "역할·권한 확인"])
    d.arrow(360, 320, 428, 320)
    d.box(820, 170, 340, 130, "검색 계층", ["로컬 n-gram 검색"], color=NAVY)
    d.box(820, 340, 340, 170, "근거 저장소", ["선배 기록 · Q&A (JSON)", "수강편람 (현재 가상)", "요청마다 권한 재확인"], color=AMBER)
    d.box(1230, 170, 310, 130, "BGE-M3 · Reranker", ["FastAPI 사이드카 (GPU)"], color=VIOLET, tsize=23)
    d.arrow(1160, 235, 1228, 235, dash=True, color=VIOLET)
    d.arrow(750, 245, 818, 235)
    d.arrow(750, 390, 818, 420)
    d.box(820, 550, 340, 120, "관계 그래프", ["요청 시 메모리에서 구성"], color=TEAL)
    d.arrow(990, 510, 990, 548)
    d.box(430, 550, 320, 200, "응답 생성", ["사실 답변 · 스타일 답변", "질문당 LLM 2회, 스타일", "변경 시 1회"])
    d.arrow(818, 610, 752, 640, "근거·관계")
    d.box(60, 550, 300, 200, "결과 출력", ["인용 검증 · 사실 가드", "출처 등급 표시", "선택지 비교 정리"])
    d.arrow(428, 650, 362, 650)
    d.box(430, 800, 320, 110, "vLLM · Qwen3-14B", ["GPU 서버 (선택)"], color=VIOLET, tsize=24)
    d.arrow(590, 798, 590, 752, dash=True, color=VIOLET)
    d.box(820, 800, 340, 110, "CPU Demo 템플릿", ["GPU·API 키 없이 동작"], color=NAVY, tsize=24)
    d.arrow(818, 830, 752, 730, dash=True, color=NAVY)
    d.save("fig2_system_architecture.svg")


def persona():
    d = D("다중 페르소나와 블렌딩 구조", h=800, sub="관점은 달라져도 근거와 사실은 공유한다")
    for i, n in enumerate(["전략형", "도전형", "공감형", "분석형", "성찰형"]):
        d.box(60, 170 + i * 100, 230, 80, n, tsize=26)
        d.arrow(290, 210 + i * 100, 378, 370)
    d.box(380, 280, 280, 180, "선택·혼합 설정", ["기본 + 보조 스타일", "비중 50~80%", "8문장 예산으로 환산"])
    d.box(740, 170, 330, 160, "공유된 사실 근거", ["검색 결과 · 계산값", "관계 근거 (같은 질문이면 동일)"], color=AMBER)
    d.box(740, 390, 330, 180, "스타일 답변 생성", ["LLM 1회, 한 편의 글", "문장별 배치 계획"])
    d.arrow(660, 400, 738, 470)
    d.arrow(905, 330, 905, 388)
    d.box(1160, 280, 380, 180, "일관된 답변", ["사실 답변 + 스타일 설명", "인용 검증 · 사실 가드", "위반 시 템플릿 대체"], color=TEAL)
    d.arrow(1070, 460, 1158, 400)
    d.note(690, "측정: 스타일 간 답변 유사도 0.12~0.20 (실제 Qwen3-14B). 혼합 비중의 크기 차이가 LLM 출력에 반영되는지는 미검증.")
    d.save("fig3_persona_blending.svg")


def graphrag():
    d = D("GraphRAG 처리 흐름", h=800, sub="관계를 찾은 뒤 출처와 권한을 확인해 답변 근거로 사용")
    items = [("학교 자료", ["현재: 가상 수강편람", "공식 자료는 허가 후"], AMBER), ("문서 검증", ["출처 URL·학년도", "사용 허가 확인"], NAVY), ("개체·관계 구축", ["학과·과목·역량·직무", "관계별 출처 등급"], TEAL), ("질문 그래프 검색", ["개체 연결", "1~2단계 탐색"], TEAL), ("원문 근거", ["위치·학년도", "동의·공개 범위 확인"], AMBER), ("AI 선배 답변", ["[G-xx] 인용", "없는 ID 제거"], TEAL)]
    w, g, x = 212, 34, 60
    for i, (t, ls, c) in enumerate(items):
        d.box(x + i * (w + g), 200, w, 190, t, ls, color=c, tsize=24)
        if i < 5:
            d.arrow(x + i * (w + g) + w, 295, x + (i + 1) * (w + g) - 2, 295)
    d.box(60, 470, 700, 190, "관계 등급", ["공식 원문 명시 · 검증된 외부 자료 · 검증된 선배 자기 보고", "규칙 추론 후보 (확정 사실로 쓰지 않음) · 가상 시연 데이터", "현재 등록된 공식 원문 관계: 0건"], color=NAVY, tsize=25)
    d.box(840, 470, 700, 190, "사실 조회는 규칙으로 답변", ["개설 학과 · 선수 과목 · 학년도 차이", "취업 보장 질문 · 권한 질문 · 없는 관계는 지어내지 않음"], color=TEAL, tsize=25)
    d.save("fig4_graphrag_flow.svg")


def kg():
    d = D("Career Knowledge Graph 예시", h=800, sub="가상 시연 데이터로 그린 예시 관계")
    d.box(60, 330, 220, 110, "수학과", ["학과"], color=NAVY)
    d.box(380, 200, 250, 110, "수리통계학", ["과목"])
    d.box(380, 460, 250, 110, "확률론", ["과목"])
    d.box(740, 330, 220, 110, "통계", ["역량"], color=AMBER)
    d.box(1070, 200, 250, 110, "데이터 분석가", ["직무"], color=VIOLET)
    d.box(1070, 460, 250, 110, "공모전 프로젝트", ["활동·경험"], color=VIOLET)
    d.arrow(280, 365, 378, 265, "개설")
    d.arrow(280, 405, 378, 505, "개설")
    d.arrow(505, 460, 505, 312, "선수 과목")
    d.arrow(630, 265, 738, 365, "주제 명시")
    d.arrow(630, 505, 738, 405, "주제 명시")
    d.arrow(1068, 265, 962, 365, "직무 예시 역량")
    d.arrow(962, 405, 1068, 505, "활동에서 사용")
    d.p.append(f'<path d="M630 225 Q 850 130 1068 225" fill="none" stroke="{VIOLET}" stroke-width="3" stroke-dasharray="3 8" marker-end="url(#a)"/><text x="850" y="150" font-size="20" fill="{VIOLET}" text-anchor="middle">규칙 추론 후보: 관련 가능성 (검증 안 됨)</text>')
    d.note(680, "과목 수강과 취업의 인과 관계를 뜻하지 않습니다. 실제 한국외대 교과정보가 아닙니다.")
    d.save("fig5_career_knowledge_graph.svg")


def compare():
    d = D("기존 RAG와 GraphRAG 비교", h=860, sub="같은 질문: 수학과 학생이 데이터 분석 직무를 준비하려면 어떤 수업을 검토하면 좋을까요?")
    d.box(60, 170, 720, 340, "A. 기존 RAG", ["선배 기록 유사도 검색", "", "답변 예: '데이터 분석, 통계, 프로그래밍 관련 수업을", "중심으로 검토하는 것이 좋다' [S-02]", "", "구체적인 과목명과 개설 정보가 드러나지 않음"], color=NAVY)
    d.box(820, 170, 720, 340, "B. GraphRAG 결합", ["선배 기록 + 학과–과목–역량–직무 경로", "", "답변 예: 수학과 개설 수리통계학, 수치해석, 확률론, 회귀분석을", "검토 [G-01][G-02][G-03]", "", "관계마다 출처 등급, 추론은 '후보'로 표시"], color=TEAL)
    d.box(60, 560, 480, 170, "그래프가 유리한 질문", ["과목–역량–직무 연결", "개설·선수 과목 같은 사실 조회"], color=TEAL, tsize=25)
    d.box(590, 560, 420, 170, "기존 RAG로 충분한 질문", ["선배 경험담 질문", "(관계 근거 0건, 답변 유사)"], color=NAVY, tsize=25)
    d.box(1060, 560, 480, 170, "측정 (관계 질문 5개, 첫 답변)", ["응답 중앙값 14.6초 → 18.1초", "관계 검색 성공 5/5 · 없는 과목명 0건"], color=AMBER, tsize=24)
    d.note(790, "실제 Qwen3-14B, 가상 시연 데이터 기준 소규모 비교입니다. 공식 교과정보로 검증한 결과가 아닙니다.")
    d.save("fig6_rag_vs_graphrag.svg")


os.makedirs(OUT, exist_ok=True)
for f in (flow, arch, persona, graphrag, kg, compare):
    f()
print("ok")
