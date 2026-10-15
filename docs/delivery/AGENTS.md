# RMS 내부 이식용 소스 지침

- 배포 대상은 `web/`, 공식 지침·오픈소스 패키지·설치자료는 `reference/`, 서버 통합 예제는 `examples/` 및 `reference/privacy/examples/`에 구분되어 있습니다.
- 먼저 `00_먼저읽기_개발자이식안내.md`와 `docs/09-privacy-protection.md`를 읽습니다.
- `web/integration/`는 내부 개발자가 소유합니다. 후속 퍼블리싱 ZIP으로 덮어쓰지 마세요.
- 개인정보 검사·HTML 정화는 저장 전과 공개 출력 전에 서버에서도 적용합니다. 요청의 작성자·관리자 플래그를 신뢰하지 않습니다.
- `web/index.html`은 서버 bootstrap API가 필요한 업무 진입점입니다. 시연 저장소·역할 선택기·SFR 레이어는 이 업무 배포본에 포함되지 않습니다. 세부 요구사항 매핑은 `docs/requirements-implementation.json`에서 확인합니다.
- README.md와 AGENTS.md를 유지하고, 실제 운영 서비스의 시작·종료·재시작은 이식 대상 프로젝트의 서비스 관리체계와 연결합니다. 스크립트는 자신의 위치에서 프로젝트 루트를 계산해야 합니다.
- `reference/` 전체를 웹 공개 경로에 복사하지 않습니다. 공식 지침·기술 설명의 공개용 사본만 `web/downloads/privacy/`에 포함되어 있습니다.
- 시안 1·2·3은 같은 HTML·JS를 사용하며 `web/static/css/rms-selected-design.css`로 기본 디자인을 선택합니다.
- 실제 업무 폼·목록·상세 팝업·마스킹 기술 툴팁에는 SFR 번호·요구사항 설명·구현상태를 추가하지 않습니다. 요구사항 자료는 별도 참고 문서와 관리 화면에서만 제공합니다.
