# 내부 개발자 소유 영역

내부 환경 설정·JSP·Java·DAO·DTO 매핑 등 서버 연결 소스는 내부 개발자 소유로 관리합니다. ZIP 초기 연결 예시는 web/integration/config.js이며 후속 변경분 ZIP에서는 web/integration/을 제외합니다. 내부 저장소의 별도 경로에 복사한 뒤 자산 include 경로를 조정하세요.

퍼블리셔 workspace의 integration/은 내부 작업 예약 영역이며 개발자 ZIP에 수집하지 않습니다. 서버 URL·인증·CSRF 예시는 handoff/integration-examples/와 handoff/jsp-examples/를 참고합니다. 실제 비밀키나 DB 접속정보는 외부 저장소에 넣지 않습니다. 상세 이식 순서는 docs/delivery/00_먼저읽기_개발자이식안내.md를 따릅니다.
