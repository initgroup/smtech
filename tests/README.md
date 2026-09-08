# 검증 실행

별도 설치 없이 실행 가능한 업무규칙/파일 검증:

```powershell
node tools/package_handoff.cjs
python tools/package_source.py
node --test tests/core.test.cjs tests/backup.test.cjs tests/announcement.test.cjs tests/static.test.cjs
python tests/source_package_test.py
```

화면 이벤트 검증은 실제 브라우저가 아닌 Node + linkedom DOM 시뮬레이터를 사용합니다. 시연 실행에는 필요하지 않습니다. 다음처럼 QA용 임시 폴더에만 설치합니다.

```powershell
npm.cmd install --prefix tmp/qa --cache tmp/npm-cache --no-package-lock --ignore-scripts --no-audit --no-fund linkedom@0.18.12
node --test tests/dom.test.cjs
```

`announcement.test.cjs`는 공고 상세 데이터, 구버전 보완, 저장 권한·검증·실패 보존, 텍스트 첨부의 JSON 왕복 복원을 검사합니다.

SFR 검증은 `dom.test.cjs`에 포함됩니다. 15개 상세 설명과 메뉴 링크를 대조하고 모든 링크를 4개 역할로 실행해 접근 전 로그인, 역할 선택 후 목적지 이동, 취소·잘못된 역할·기존 입력값 보존을 검사합니다. 가져온 자료의 식별자 변경·빈 목록과 900px 레이어의 좁은 화면 범위 제한도 포함합니다. 상세 설명과 메뉴 원본은 `docs/sfr-implementation.json`입니다.

`dom.test.cjs`는 실제 index.html/core.js/views.js/app.js를 로드하고 사용자 역할, 라우트, 검색, 비교, 등록, 공고 상세·이동·관리자 편집·첨부 다운로드·백업 복원, 동의/조회, 첨부/제출/보완, 관리자 설정, 통계를 이벤트로 검사합니다. linkedom이 제공하지 않는 select/checkbox/FormData/dialog 등은 최소 표준 동작으로 보완했습니다. 따라서 실제 브라우저 렌더링·레이아웃·포커스·스크린리더·다운로드 창 검증을 대체하지 않습니다.

시연 백업 검증은 `smtech` 전용 키 이관과 다른 앱 데이터 보존, 독립 저장소 간 JSON 복원 및 기존 PC의 추가자료 제거, 파일 선택 창의 저장·취소·실패 동작을 포함합니다. 파일 선택 API는 테스트에서 모의 실행합니다. 16개 화면·단계 × 4개 역할로 렌더링 및 공통 안내 동작을 검사하며, SFR 레이어의 이동·크기 조절·배경 조작과 기존 업무 이벤트 테스트도 함께 실행하세요. `source_package_test.py`는 소스 ZIP의 최신 파일 일치·제외 대상·재현성과 실제 HTTP 다운로드, 임시 Git 저장소에서 업로드 스크립트가 커밋한 바이트와 ZIP의 일치 여부를 확인합니다. 후자는 Windows PowerShell과 Git이 필요하며 실제 GitHub에는 업로드하지 않습니다.

`review-core-behavior.cjs` 및 `review-core-findings.json`은 구현 중 발견사항의 최초 재현 기록입니다. 현재 회귀검증 기준은 `core.test.cjs`, `dom.test.cjs`, `static.test.cjs`입니다.
