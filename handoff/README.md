# 화면 퍼블리싱 인계본

`fragments`에는 프로토타입과 동일한 템플릿에서 생성한 12개 HTML 조각이 있습니다. 모두 가상 데이터이며 HTML/CSS 디자인 검토와 기존 JSP 이식의 출발점입니다.

- 기존 `ui.css → uiCustom.css` 다음에 `static/css/rms-enhance.css`를 추가합니다.
- 기존 본문 안에 필요한 `.rms-enhance` 조각을 넣습니다.
- 실제 데이터는 서버 DTO/JSP 출력 또는 별도 비동기 어댑터로 바꿉니다.
- `data-action`, 폼의 `name`은 연결 지점입니다. 기존 전체 문서를 대상으로 이벤트를 덮어쓰지 않습니다.
- `core.js`는 가상 저장소/업무 규칙, `views.js`는 템플릿, `app.js`는 시연 호스트 조립 코드입니다. `app.js`의 역할/JSON 도구 DOM 의존성은 운영에서 제거/교체해야 합니다.
- `command-adapter.example.js`는 비동기 연결 패턴 예시이며 실서비스 URL이 들어 있지 않습니다.
- `rms-demo-shell.css`, `data/seed.json`, 원본 수집 HTML·업무 JS는 운영 신규 배포에 포함하지 않습니다.
- 원본 운영 스타일과 라이브러리는 기존 사용 환경을 유지합니다.

자세한 대응표: `docs/04-developer-handoff.md`. 재생성: `node tools/package_handoff.cjs`.
