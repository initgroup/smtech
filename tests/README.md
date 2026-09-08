# 검증 실행

별도 설치 없이 실행 가능한 업무규칙/파일 검증:

```powershell
node tools/package_handoff.cjs
node --test tests/core.test.cjs tests/static.test.cjs
```

화면 이벤트 검증은 실제 브라우저가 아닌 Node + linkedom DOM 시뮬레이터를 사용합니다. 시연 실행에는 필요하지 않습니다. 다음처럼 QA용 임시 폴더에만 설치합니다.

```powershell
npm.cmd install --prefix tmp/qa --cache tmp/npm-cache --no-package-lock --ignore-scripts --no-audit --no-fund linkedom@0.18.12
node --test tests/dom.test.cjs
```

`dom.test.cjs`는 실제 index.html/core.js/views.js/app.js를 로드하고 사용자 역할, 라우트, 검색, 비교, 등록, 동의/조회, 첨부/제출/보완, 관리자 설정, 통계를 이벤트로 검사합니다. linkedom이 제공하지 않는 select/checkbox/FormData/dialog 등은 최소 표준 동작으로 보완했습니다. 따라서 실제 브라우저 렌더링·레이아웃·포커스·스크린리더·다운로드 창 검증을 대체하지 않습니다.

`review-core-behavior.cjs` 및 `review-core-findings.json`은 구현 중 발견사항의 최초 재현 기록입니다. 현재 회귀검증 기준은 `core.test.cjs`, `dom.test.cjs`, `static.test.cjs`입니다.
