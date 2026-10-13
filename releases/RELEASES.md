# 개발자 소스 배포내역

최신 배포부터 기록합니다. 이 목록은 이후 버전에도 누적됩니다.

## v1.1.9 · 2026-10-13 · 기존 소스 다운로드 영역을 시안별 ZIP 버튼 3개로 교체

- JSON 불러오기와 배포내역 사이의 기존 소스 다운로드 버튼을 시안 1·2·3 ZIP 버튼으로 교체
- 시연 도구 하단에 별도로 추가했던 다운로드 줄 제거
- 각 버튼은 현재 표시된 시안과 관계없이 해당 시안의 소스 ZIP 다운로드
- 시안별 기본 CSS와 공통 HTML·JS 구조 및 CSS 파일 하나를 통한 디자인 변경 유지

이식 안내: 시연 화면의 다운로드 위치만 정리했습니다. 기존 소스 다운로드 영역에서 원하는 시안 ZIP을 선택합니다. 업무 소스 ZIP은 상단 시연·시안 선택 도구를 포함하지 않으며 기존 업무 소스 이식 방법을 유지합니다.

보관 파일: rms-developer-v1.1.9.zip

## v1.1.8 · 2026-10-13 · 시안 1·2·3별 기본 디자인을 적용한 소스 ZIP 다운로드

- 시연 도구를 접어도 보이는 시안별 소스 ZIP 다운로드 버튼 3개 추가
- 각 ZIP의 rms-selected-design.css에 해당 시안을 미리 적용하고 공통 HTML·JS·업무 템플릿 유지
- 현재 시안의 소스 다운로드도 선택한 디자인을 따라가도록 연결
- 시안별 버전 ZIP·최신 별칭·SHA-256 생성 및 배포 무결성 검증
- 소스 ZIP에는 상단 시안 선택·시연 도구를 제외하고 이후 CSS 파일 하나로 디자인 변경 가능

이식 안내: 원하는 시안의 smtech-source-design1.zip, smtech-source-design2.zip, smtech-source-design3.zip을 받아 web/ 업무 소스를 이식하세요. 각 ZIP의 기본 CSS에 해당 시안이 적용되어 있습니다. 이후 디자인 변경은 web/static/css/themes/rms-designN.css로 web/static/css/rms-selected-design.css만 교체합니다. 기존 integration/ 인증·API 연결과 데이터 계약은 유지합니다.

보관 파일: rms-developer-v1.1.8.zip

## v1.1.7 · 2026-10-13 · 공통 HTML·JS와 CSS 파일 하나로 선택하는 디자인 시안 3종

- 세 시안의 메인 HTML·업무 JS를 동일 구조로 통합하고 배치·표시·버튼·팝업 스타일을 CSS로 분리
- 업무용 HTML은 rms-selected-design.css 하나만 로드하며 기본값은 시안 1
- ZIP에 themes/rms-design1.css, rms-design2.css, rms-design3.css와 파일 교체 안내 포함
- 시안 선택에 body 클래스·JSP/HTML·JavaScript·서버 코드 수정 불필요
- 실제 업무용 화면에서 CSS 파일만 교체하여 세 시안·세 화면 폭의 동일 HTML 및 스타일 전환 검증

이식 안내: 처음에는 이번 공통 HTML·templates/·static/를 함께 이식하세요. 이후 web/static/css/themes/rms-designN.css로 web/static/css/rms-selected-design.css만 교체하면 됩니다. 기본값은 시안 1입니다. 내부 integration/ 연결과 데이터 계약은 유지합니다. 상세 절차는 02_파일경로와변경분적용.md에 있습니다.

보관 파일: rms-developer-v1.1.7.zip

## v1.1.6 · 2026-10-13 · 배너·홍보 문구를 줄인 업무 중심 디자인 시안 3종

- 시안 1: 청색 업무 목록형 — 행 중심 공고, 우측 계정·업무 패널, 사각 버튼·블릿과 밝은 팝업
- 시안 2: 청록 업무 작업공간형 — 좌측 업무 레일, 둥근 공고 카드·아이콘·버튼과 청록 팝업
- 시안 3: 남색 업무 대시보드형 — 실제 업무 지표, 번호형 업무 타일, 공고·게시판 분할과 남색 팝업
- 세 시안의 통합검색·공고·신청·게시판 기능과 모바일 배치 유지, 로그인 전 대메뉴 숨김
- 서브페이지·팝업에 선택한 디자인 유지, 시안 3과 목록 설정의 JSON 복원 지원

이식 안내: application.html, asset-manifest.json, templates/, static/css/, presenters/views.js, app.js를 함께 적용하세요. 각 시안은 #home, #home/2, #home/3에서 확인할 수 있습니다. 데이터 계약·서버 연결 설정은 동일합니다.

보관 파일: rms-developer-v1.1.6.zip

## v1.1.5 · 2026-10-13 · 메인 시안 1·2 로그인 전 대메뉴 숨김

- 공통 헤더의 대메뉴를 로그인 전에는 숨기고 로그인 후에 표시
- 초기 화면 로딩 및 로그아웃 시에도 대메뉴 숨김 적용

이식 안내: application.html, static/css/rms-shell.css, static/js/rms-enhance/app.js를 함께 적용하세요. 데이터 계약과 서버 연결 설정은 동일합니다.

보관 파일: rms-developer-v1.1.5.zip

## v1.1.4 · 2026-10-08 · Git 속성 변경 후 staged ZIP 검증 오류 수정

- 원본 CSS·폰트 스타일에 -text -eol 보존 규칙을 명시하여 원본 바이트 유지
- git-upload.ps1에서 기존 추적 파일의 Git 속성 규칙을 다시 반영한 후 전체 stage
- ZIP fingerprint 불일치 시 차이가 나는 파일 경로 출력
- 이전 LF index와 원본 CRLF 파일이 공존하는 상황을 재현하여 commit·ZIP 검증 회귀 검사

이식 안내: 업무 기능·데이터 계약은 동일합니다. 프로젝트 루트의 수정된 git-upload.ps1을 기존 옵션으로 다시 실행하세요. 원본 CSS 파일은 편집하거나 줄바꿈을 바꿀 필요가 없습니다.

보관 파일: rms-developer-v1.1.4.zip

## v1.1.3 · 2026-10-08 · 실행·Git 배포 자동화와 소스 구조 변경 대응

- 공용 경로·Python/Node 탐색 설정과 최신 화면 빌드를 지원하는 start.ps1 제공
- git-upload.ps1에 읽기 전용 점검·배포본 생성 전용 모드, 기존 remote 사용, 동시 실행·Git 작업 상태 점검 추가
- 현재 .gitignore 규칙으로 기존 추적 파일도 index에서만 제외하고 실제 파일 보존
- Git 텍스트 정규화·제외 규칙을 ZIP 생성에 반영하고 staged/commit의 최신·과거 버전 ZIP·해시 파일 검증
- 임시 저장소·로컬 원격에서 실제 commit/push 및 반복 실행·새 파일·CRLF·누락 해시 차단 검증

이식 안내: 업무 화면·데이터 계약은 동일합니다. 퍼블리셔 작업 폴더의 스크립트 사용법은 docs/08-git-automation.md를 확인하세요. 내부 개발자 ZIP에는 시연·Git 배포 도구를 추가하지 않으며 적용 기준은 계속 web/입니다.

보관 파일: rms-developer-v1.1.3.zip

## v1.1.2 · 2026-10-08 · 후속 변경분의 버전·해시 목록 전달 보완

- 변경분 ZIP에 새 release-manifest.json을 함께 제공하여 후속 이식의 기준 버전과 파일 해시 유지
- 내부 integration 파일 보호와 수동 병합·삭제 지시 방식 유지
- 최종 전체 ZIP·변경분 ZIP 및 다운로드 경로 검증

이식 안내: v1.1.0 이후 업무용 ZIP을 기준으로 변경분을 비교하세요. 변경분 적용 시 새 release-manifest.json도 배포 기준 자료로 보관하며 내부 파일이 수정되었으면 수동 병합합니다. web/integration/은 변경분에서 제외됩니다.

보관 파일: rms-developer-v1.1.2.zip

## v1.1.1 · 2026-10-08 · 최종 개발자 인계본 정리

- 최종 검사에서 발견한 업무 CSS 파일 끝 공백 정리
- 업무 자산 미러와 개발자 ZIP 재생성 및 다운로드 바이트 일치 확인

이식 안내: v1.1.0과 업무 기능·파일 경로·데이터 계약은 같습니다. 이번 CSS 형식 변경을 비교하고 내부 수정 파일은 수동 병합하세요. 적용 기준은 ZIP의 web/입니다.

보관 파일: rms-developer-v1.1.1.zip

## v1.1.0 · 2026-10-08 · 업무 소스와 시연 도구 완전 분리

- 업무용 application.html과 demo/ 시연 도구의 HTML·CSS·JS를 파일 단위로 분리
- 개발자 ZIP에서 시연 도구·SFR·역할 시뮬레이션·JSON 백업·XML 샘플 원본 제외
- ZIP 루트 이식 안내, 파일 소유권, 누적 배포내역과 SHA-256 목록 제공
- 시연 도구에 배포내역 버튼과 이동 가능한 상세 레이어 추가
- 동일 소스 재빌드 시 버전 유지, 변경된 소스 배포 시 버전 자동 증가 및 과거 ZIP 보존

이식 안내: 이번 버전은 경로 분리 변경입니다. 기존 index.html 전체를 이식하지 말고 새 ZIP의 web/index.html과 업무 자산을 기준으로 JSP에 병합하세요. web/integration/ 및 내부 수정 파일은 덮어쓰지 않습니다.

보관 파일: rms-developer-v1.1.0.zip

## v1.0.0 · 2026-10-08 · HTML·CSS·JS 구조화 최초 전달

**구형 전체 소스 — 시연 도구 포함. 내부 이식 기준으로 사용하지 마세요.**

- HTML 템플릿, 공용 함수, 데이터 어댑터와 JSP 이식 예시 분리
- 시연 도구와 업무 화면이 함께 들어 있던 전체 소스 ZIP

이식 안내: 시연 코드가 포함된 구형 전체 소스입니다. 내부 이식 기준으로 사용하지 말고 v1.1.0 이후 개발자 ZIP의 web/ 경로를 기준으로 적용하세요.

