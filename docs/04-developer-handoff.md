# 개발자 이식 지침

현재 이식 기준은 [ZIP 루트 안내 원본](delivery/00_먼저읽기_개발자이식안내.md)과 [경로·변경분 적용](delivery/02_파일경로와변경분적용.md)입니다. 실제 소스는 application.html → ZIP web/index.html이며 index.html과 demo/는 시연 전용입니다.

업무용 176개 HTML 템플릿과 별도 시연 템플릿을 컴파일합니다. handoff/fragments/에는 19개 업무 화면 참고 조각만 생성합니다. 데이터 계약은 [07-data-contract.md](07-data-contract.md)에 있습니다. 내부 서버 연결 코드는 integration 소유로 유지하고 후속 변경 ZIP으로 덮어쓰지 않습니다.
