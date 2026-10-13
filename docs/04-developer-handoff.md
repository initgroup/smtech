# 개발자 이식 지침

현재 이식 기준은 [ZIP 루트 안내 원본](delivery/00_먼저읽기_개발자이식안내.md)과 [경로·변경분 적용](delivery/02_파일경로와변경분적용.md)입니다. 실제 소스는 application.html → ZIP web/index.html이며 index.html과 demo/는 시연 전용입니다.

업무용 177개 HTML 템플릿과 별도 시연 템플릿을 컴파일합니다. handoff/fragments/에는 20개 업무 화면 참고 조각만 생성합니다. 데이터 계약은 [07-data-contract.md](07-data-contract.md)에 있습니다. 내부 서버 연결 코드는 integration 소유로 유지하고 후속 변경 ZIP으로 덮어쓰지 않습니다.

디자인 시안의 공통 HTML 구조와 업무 JS를 한 번 이식한 뒤에는 static/css/rms-selected-design.css만 교체합니다. 교체용 파일은 static/css/themes/rms-design1.css, rms-design2.css, rms-design3.css이며 기본값은 시안 1입니다. 업무용 application.html은 선택 CSS 하나만 불러오고 시연 index.html은 별도 CSS 선택 클래스로 세 시안을 비교합니다. 상세 절차는 delivery/02_파일경로와변경분적용.md를 확인하세요.
