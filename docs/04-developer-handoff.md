# 내부 개발자 인계 가이드

## 인계 단위

`handoff/fragments/`의 **12개 HTML 조각**, 신규 `rms-enhance.css`, `core.js`, `views.js`, 시연 조립 코드 `app.js`를 제공한다. HTML 조각은 사람이 별도로 다시 작성한 디자인이 아니라 시연의 `views.js`를 실행해 생성한 동일 마크업이다.

```powershell
node tools/package_handoff.cjs
```

`handoff/manifest.json`에 파일별 SHA-256이 기록된다. 시연 수정 후 반드시 다시 생성한다.

## 파일 역할과 운영 반영

| 파일 | 역할 | 운영 이식 방법 |
|---|---|---|
| 기존 `static/css/ui.css` | 현행 전체 공통 스타일 | 현재 운영 파일 유지 |
| 기존 `static/css/uiCustom.css` | 현행 추가 규칙 | 현재 운영 파일 유지 |
| `static/css/rms-enhance.css` | 새 업무영역 스타일 | 두 기존 CSS 다음에 로드 |
| `fragments/*.html` | 화면별 퍼블리싱 결과 | 기존 JSP 본문에 선택적으로 삽입 |
| `static/js/rms-enhance/views.js` | 같은 HTML을 만드는 순수 템플릿 | JSP 렌더로 옮기거나 동적 화면 렌더에 재사용 |
| `static/js/rms-enhance/core.js` | 가상 모델·업무 규칙·저장소 | 시연 어댑터. 운영 서버 규칙의 참고/계약 기준 |
| `static/js/rms-enhance/app.js` | 메뉴/대화상자/폼 이벤트를 연결한 시연 조립 코드 | 데모 호스트 DOM 의존성을 검토해 필요한 이벤트를 업무 JS로 이식 |
| `rms-demo-shell.css` | 시연 전용 외곽·역할·JSON 도구 | 운영 배포에서 제외 |
| `data/seed.json` | 가상 데이터 | 운영 배포에서 제외 |

`app.js`는 `rms-role`, `rms-user-menu`, `rms-dialog-host`, `rms-export` 등의 시연 전용 ID를 참조한다. 기존 JSP에 파일 하나만 추가하면 즉시 운영 연동되는 형태는 아니다. 본문 마크업/신규 CSS/이벤트 처리 원리를 재사용하고, 실제 화면 진입·인증·데이터 요청은 기존 업무 JS에 연결한다.

## 추가 방식과 충돌 방지

```html
<!-- 실제 컨텍스트는 JSP c:url 또는 기존 경로 생성 방식을 사용 -->
<link rel="stylesheet" href="/region/rms/static/css/ui.css">
<link rel="stylesheet" href="/region/rms/static/css/uiCustom.css">
<link rel="stylesheet" href="/region/rms/static/css/rms-enhance.css">

<!-- 기존 header/menu/body/footer include 유지, 필요한 본문만 삽입 -->
<section class="rms-enhance" data-rms-screen="doctors">
  <!-- handoff/fragments/doctors.html 내부 본문 -->
</section>
```

- 신규 스타일의 모든 선택자는 `.rms-enhance` 범위에 한정했다.
- 기존 `.mBoard1`, `.mBtn1`, `.mGrid1`, `.it` 등 선택자를 전역 재정의하지 않는다.
- 본문에는 `rms-` 클래스/ID와 `data-action` 이벤트를 사용한다. 같은 조각을 한 페이지에 여러 번 삽입할 경우 ID와 label 연결도 인스턴스별로 바꿔야 한다.
- 전역 JS는 `RMSCore`, `RMSViews` 두 이름만 추가하며 기존 `$`, `jQuery`, `callAjax`, `fnGetAjaxData`를 바꾸지 않는다.
- 기존 업무 스크립트를 페이지 전체에 중복 로딩하거나 `.mBtn1` 같은 광역 선택자로 새 이벤트를 결합하지 않는다.
- HTML 입력값은 `RMSViews.esc()`로 이스케이프한다. 운영 JSP에서도 동등한 출력 이스케이프를 유지한다.
- 전역 CSS에 알려지지 않은 상속/우선순위 규칙이 있을 수 있으므로 승인 화면을 기존 전체 CSS와 함께 통합 검증한다. 현재는 공개 공통 CSS 두 개와의 공존만 구성했다.

## 실제 소스 경로와 대응

운영매뉴얼은 `tipa_rbms`, `WebContent`, `/region/rms`를 기재한다. 공개 사이트에서 확인한 정적 경로는 `/static/css`, `/static/js/biz/<업무>/...`다. **현재 저장소의 폴더가 정확히 WebContent인지 `src/main/webapp`인지 내부 소스에서 확정해야 한다.**

```text
<확인된 기존 웹 리소스 루트>/
├─ static/css/rms-enhance.css             추가
├─ static/js/biz/<해당업무>/<기존화면>.js   필요한 이벤트/API 연결
└─ <기존 JSP view 경로>/
   ├─ <기술닥터>/search.jsp 등             기존 명명규칙에 맞춰 선택
   └─ <접수서류>/...jsp                    기존 폼 일부를 개선
```

위 경로는 배치 원리이며 실제로 확보한 서버 파일 경로가 아니다. 매뉴얼의 search/list/insertForm/updateForm/index/tree 규칙은 기존 해당 업무 파일과 비교한 뒤 적용한다.

## 데이터/백엔드 연결 계약

현 시연은 `RMSCore.createStore(seed, localStorage)`의 동기 메서드를 사용한다. 실제 연동에서는 목록 조회·명령을 **비동기 서비스**로 분리하고 로딩·오류·중복 클릭 방지를 추가한다. `await` 없이 기존 동기 호출 자리에 Promise만 반환시키면 안 된다.

| 시연 메서드 | 운영 서비스 책임 | 검증해야 할 항목 |
|---|---|---|
| searchDoctors / getState().doctors | 기술닥터 검색·상세 | 서버 페이징, 표준분류, 개인정보 필드 |
| saveDoctor | 신규·수정/SMTECH 사용자 초기화 | 등록기관 권한, 사용자 중복, 변경이력 동시성 |
| saveCode / removeCode / mapWork | 표준분류 및 기존 소통 분류 관리 | 사용중 코드, 순환, 참조 무결성, 이행 작업 |
| requestMatch / progressMatch | 매칭 요청·상태·실적 | 요청/처리 기관, 상태전이, 중복/멱등성 |
| queryDocument / queryRequired | 동의 확인 후 외부 행정정보 조회 | 동의 식별자, 기관 규격, 시간제한/재조회 |
| resolveMismatch | 입력/조회값 비교 및 선택 적용 | 필드별 근거, 명시적 확인, 동시수정 |
| attachFile | 실제 파일 업로드·조회 | MIME/확장자/내용 검사, 용량, 저장소, 다운로드 권한 |
| submitApplication | 신청서 접수 | 필수서류·유효기간·동의·상태, 트랜잭션 |
| requestSupplement | 보완요청·통지·이력 | 기관 권한, 보완기한, 사유, 실제 알림 승인 |
| updateSettings / updateQuestion | 메인 배치·공개/노출 | 관리자 권한, 공개 전 개인정보 검수 |
| statsData (views) | 집계 조회·파일 출력 | 기간 기준, 중복 제거, 이력 통계, 공식 정의 |

공개 공통 JS에서는 `fnGetAjaxData`도 POST를 사용하며 `data`는 일반 객체/serialized form 방식이다. 요청 헤더 `AJAX:true`, 응답 `resultCode`/`resultMsg`, 컨텍스트 처리를 기존 구현과 맞춰야 한다. 운영 메서드명·URL·전송 필드는 확정하지 않았다.

예시 어댑터 골격은 [command-adapter.example.js](../handoff/command-adapter.example.js)에 있다. URL은 내부 개발자가 확인하여 주입하며 파일 자체는 네트워크 호출을 시작하지 않는다. 기존 `callAjax`를 감싸는 작업에는 실패·세션만료·타임아웃 처리도 함께 넣는다.

## 상태·동의·첨부 주의점

- `localStorage`, JSON 파일, 클라이언트 역할 전환은 운영 인증/인가/감사로그를 대체하지 않는다.
- JSON의 파일정보는 실제 증빙 보관이 아니다. 운영에서 첨부 `fileId`와 실체 확인이 필요하다.
- 동일 서류 재사용 시 사업별 동의 목적/기간/제공항목과 증빙 유효기간을 검사한다. 현재는 사업 간 자동 재사용을 하지 않는다.
- 서류별 미제출/조회완료/조회실패/보완필요/제출완료와 신청서 작성중/임시저장/제출완료를 구분한다.
- 제출 후 잠금·기관 보완 후 편집은 이번 가정이다. 기존 접수철회/수정 절차와 충돌 여부를 확인한다.
- 기관 응답 예외, 개인정보 마스킹, 로그 보존/삭제, 암호화는 실제 연계 설계에서 수행한다.

## 환경·수용 기준

HTML5, 표준 CSS, ES2015+ 및 `fetch`, `Set`, native `dialog`, 파일 API를 사용하는 현대 브라우저용이다. IE 호환을 구현했다고 주장하지 않는다. 원문에 오래된 브라우저 예시가 있어 실제 지원 브라우저를 합의해야 한다. 원본 Noto Sans KR을 로컬에서 로드하므로 외부 폰트/CDN 요청은 없다.

기존 CSS·JS와 나란히 붙인 통합 화면에서 실제 사용자 계정별 권한, 키보드/확대/스크린리더, 표 스크롤, 폼 오류, 팝업 포커스, 세션 만료, 네트워크 실패를 인수 기준으로 검증한다. 이 프로토타입의 자체 검증을 운영 인증시험으로 사용하지 않는다.

자세한 근거와 배치 후보는 [자료분석 단계의 인계 초안](../reference/user-manual/handoff-draft.md)에도 보존되어 있다. 현재 최종 인계 기준은 이 문서와 실제 소스다.
