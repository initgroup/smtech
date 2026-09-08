# RMS 공개 화면·소스 조사

조사일: 2026-09-08 (한국시간). 기준 사이트: [기업지원사업 관리시스템](https://www.smtech.go.kr/region/rms).

공개 서버가 실제 반환한 HTML·CSS·JS를 기준으로 정리했다. 운영매뉴얼의 설명과 다를 때 이 보고서의 **관찰 사실은 확인한 공개 화면에 한해서 우선**한다. 로그인 이후 메뉴, 서버 코드, DB, 서버 설치 버전까지 확인했다는 의미는 아니다.

## 1. 확보한 원본과 조사 범위

- 고유 URL 150개를 확인했고 HTTP 200 원본 **91개, 40,203,296바이트**를 보관했다. HTTP 404 URL 59개는 실패 상태를 기록했다. 초기 재실행 과정의 중복 404 재시도를 포함한 실제 GET 횟수는 162회다. 최종 수집기는 실패 재시도를 하지 않으며 최대 동시 요청은 1개다.
- 원본 위치: [original 폴더](D:/work/smtech/reference/public-site/original). URL의 호스트와 디렉터리 구조를 유지했다. HTML 확장자가 없는 화면 응답은 `.html`을 붙였고, 화면 쿼리는 파일명에 해시로 구분했다.
- [manifest.json](D:/work/smtech/reference/public-site/manifest.json)에 URL, 최종 URL, HTTP 상태, Content-Type, 바이트 수, SHA-256, UTC 수집시각, 출처 URL, 로컬 경로를 기록했다. 404 응답 본문은 보관하지 않았으므로 `bytes: 0`, `sha256: null`이다.
- 익명 세션 경로 매개변수 `;JSESSIONID_rbms=…`와 정적 자산의 시각형 `?v=…`는 manifest URL·파일명에서 제외했다. 서버가 반환한 원본 파일 바이트는 수정하지 않았다. 원본 HTML에 포함된 익명 세션 문자열은 조사 보관물에만 남고, 프로토타입 배포물로 복사하지 않는다.
- [source-audit.json](D:/work/smtech/reference/public-site/source-audit.json)은 HTML별 DOM class/id, form, 링크, 인라인 스크립트와 이벤트, CSS 의존 경로, JS에서 발견한 endpoint 문자열을 제공한다. `source_endpoints`에는 문서 예제나 문자열 연결의 미완성 경로도 포함될 수 있으므로, 실제 호출을 확인한 API 목록으로 간주하면 안 된다.
- [source-findings.json](D:/work/smtech/reference/public-site/source-findings.json)은 사람이 판독한 구조·라이브러리·통신 규약을 별도로 정리한다.

| 확인한 화면 | 실제 결과 | 보관 파일 |
| --- | --- | --- |
| `/region/rms` | 비로그인 공고 목록, HTTP 200 | `original/www.smtech.go.kr/region/rms.html` |
| `/region/rms/biz/login/loadingLogin.do` | 아이디·비밀번호와 SMS 인증 레이어를 포함한 로그인 HTML, HTTP 200 | `…/biz/login/loadingLogin.do.html` |
| `/region/rms/biz/main/main.do` | 비로그인 요청에 로그인 HTML 반환, HTTP 200 | `…/biz/main/main.do.html` |
| `/region/rms/biz/pblancManage/pblancManage/pblancDetailPop.do?sbjtId=…&pblancId=…` | 공개 목록 첫 공고에 표시된 ID를 그대로 사용한 공고 상세 HTML, HTTP 200 | `…/biz/pblancManage/pblancManage/pblancDetailPop.do__q_1f28b49199.html` |

로그인, SMS 발송·검증, 신청, 저장, 파일 업로드, 실제 업무 JSON API는 호출하지 않았다. 상세 팝업에 노출된 첨부파일 다운로드 경로만 기록하고 해당 공고의 첨부파일은 내려받지 않았다. 로그인 화면의 소통창구 링크는 소스에서 식별했지만 150개 URL 한도에 도달하여 추가 GET하지 않았다.

## 2. 실제 경로와 파일 분리 방식

```text
/region/rms                              # CONST_CONTEXT_PATH
  /biz/<업무영역>/<화면>.do               # 페이지/팝업 응답
  /biz/<업무영역>/<처리>.json             # 공통 AJAX 함수에서 호출되는 JSON 응답 경로
  /combiz/file/downloadFile.do           # 개별 파일 다운로드
  /combiz/file/downloadZipFile.do        # 일괄 다운로드
  /static/css/ui.css                    # 기본 공통 스타일
  /static/css/uiCustom.css              # 개발자 보정 스타일
  /static/css/login.css                 # 별도 로그인 화면 스타일
  /static/css/AXJ.min.css                # AXJ 구성요소 스타일
  /static/images/...                    # 로고, 메뉴·달력 아이콘, 배경
  /static/notosansKR/css/notosanskr.css
  /static/notosansKR/font/*.ttf          # Noto Sans KR 6종
  /static/js/jquery/...                 # jQuery와 플러그인
  /static/js/ui/ui.js                   # 공통 UI 이벤트
  /static/js/cmmn/constants.js
  /static/js/cmmn/common.js              # 공통 함수와 AJAX, 팝업, form 처리
  /static/js/cmmn/callAjax.js            # 객체형 AJAX 래퍼
  /static/js/biz/index/index.js         # 공개 공고 목록 이벤트
  /static/js/biz/login/login.js         # 로그인 이벤트
  /static/js/biz/pblancManage/pblancManage/pblancDetailPop.js
  /static/js/paramquery/...             # 그리드, 지역화, touch, zip, 저장 도구
  /static/js/AX/AXJ.js
  /static/js/AX/AXTree.js
```

HTML이 업무 데이터와 표·목록 마크업을 이미 포함하고, 페이지별 JS가 클릭 이벤트와 공통 함수 호출을 연결한다. 공개 화면에서 React/Vue 라우터나 프런트엔드 번들 중심 구조는 관찰되지 않았다. 이는 확인한 화면에 한정한 사실이며 서버 템플릿 종류는 단정할 수 없다. `.do/.json` 경로만으로 Spring/JSP 및 서버 버전을 확정할 수 없다. 공통 JS에는 Thymeleaf 인라인 메시지와 유사한 주석 구문 `/*[[#{ess.noLoginInfo}]]*/`도 남아 있지만 실제 서버 템플릿 엔진을 증명하지는 않는다.

실제 소스맵 파일 링크는 확인되지 않았다. 일부 번들에 있는 `sourceMappingURL=data:` 문자열은 스타일 로더가 실행 시 문자열을 조립하는 코드로, 내려받을 별도 `.map` URL이 아니다.

## 3. DOM과 CSS에서 확인한 호환성 기준

공개 첫 화면의 골격은 다음과 같다.

```html
<div id="wrap">
  <div id="header">… <div class="gRt">…</div></div>
  <div id="body">
    <div class="mKeysub1">…</div>
    <form id="searchForm" name="searchForm">… hidden 필드 4개 …</form>
    <div class="gTitle2"><h3 class="mTitle2">과제공고</h3></div>
    <div class="mList1"><ul><li>…</li></ul></div>
  </div>
  <div id="footer">…</div>
</div>
```

공고 상세는 `.mPopup1.w100per` 아래 `.modalBg`, `.popupBg`, `.title`, `.cont.scrollY`를 사용한다. 본문은 `.mTitle2`, `.mBoard1 > table`, `.mButton1`, `.mBtn1`로 구성된다. 공고 기본정보, 지원프로그램, 공고내용, 담당자정보, 첨부파일 표가 서버 HTML에 포함되어 있다. 표에는 `caption`, `scope`, `colgroup`, `tal`/`tar` 보조 클래스가 사용된다.

| 원본 규칙 | 관찰값·의미 | 원본 근거 |
| --- | --- | --- |
| 본문·reset | Noto Sans KR, 14px, line-height 150%, letter-spacing -1px. body/table/a/input 등을 전역 지정 | `ui.css:2` |
| 전체 폭 | `#wrap { min-width:1300px; }` | `ui.css:49` |
| 상단·본문·하단 | header 72px, body padding 26px 30px 40px, footer 41px | `ui.css:54`, `:92`, `:87` |
| 표 | `.mBoard1` 테두리·모서리 10px, th 연회색, td 흰색, 14.7px | `ui.css:97` |
| 버튼 | `.mBtn1` 파랑 `#005ead`, 기본 38px. `s`, `m`, `gray`, `red`, `line` 변형 | `ui.css:334` |
| 탭 | `.mTab1 > a` 및 `.active`로 선택 표시 | `ui.css:188` |
| 공고 카드 | CSS 기본 3열 폭이나 실제 HTML inline style에서 4열 폭 `calc(25% - 22px)` 적용 | `ui.css:491`, `rms.html` |
| 좌우 그리드 | 기본 44%/56%를 uiCustom이 35%/65%로 다시 지정 | `ui.css:400`, `uiCustom.css:3` |
| 입력 | `.it` 폭이 uiCustom에서 `calc(100%)`로 변경됨 | `uiCustom.css:2` |

따라서 **스타일시트만 읽는 것보다 실제 HTML inline style과 최종 로딩 순서까지 함께 확인해야 한다.** 현재 순서는 jQuery UI CSS → Noto Sans KR → ui.css → uiCustom.css → 화면에서 필요한 플러그인 CSS다. 로그인은 ui.css 대신 login.css를 사용한다.

원본 [ui.css](D:/work/smtech/reference/public-site/original/www.smtech.go.kr/region/rms/static/css/ui.css)는 34,117바이트, [uiCustom.css](D:/work/smtech/reference/public-site/original/www.smtech.go.kr/region/rms/static/css/uiCustom.css)는 656바이트다. `uiCustom.css`는 원본부터 “개발자 수정” 주석을 가진 별도 보정 파일이다. 새 작업에서 이 파일을 직접 고치면 기존 운영계의 보정과 섞이므로 신규 CSS를 추가하는 방식이 적합하다.

## 4. 실제 JS 라이브러리와 로딩 차이

| 구성요소 | 확인값 | 확인 근거·공개 화면 |
| --- | --- | --- |
| jQuery | **3.6.0** | `jquery-3.6.0.min.js` 파일 헤더. 공고·로그인·상세 공통 |
| jQuery UI | **1.12.1** | `jquery-ui.js` 파일 헤더. 상위 폴더명 `3.6.0`과 구분해야 함 |
| jQuery Form | **3.51.0-2014.06.20** | `jquery.form.js` 헤더. 공고·상세 |
| bPopup | **0.10.0** | `jquery.bpopup.min.js` 헤더. 공고·상세 |
| blockUI | **2.7** | `jquery.blockUI.min.js` 내부 `$.blockUI.version=2.7` |
| SweetAlert2 | **11.6.11** | `sweetalert2.min.js` 헤더. 공고·상세 |
| SweetAlert | 별도 라이브러리, 버전 미확정 | 로그인은 `sweetalert/sweetalert.min.js` 로딩 |
| ParamQuery Pro | **8.6.0** | 상세에서 로딩한 `pqgrid.min.js` 헤더 |
| ParamQuery Touch | **1.0.1** | 상세에서 로딩한 `pqtouch.min.js` 헤더 |
| JSZip | 경로에 **2.5.0** 표기, 내부 버전은 미확정 | `paramquery/jsZip-2.5.0/jszip.min.js` |
| FileSaver, AXJ, AXTree | 파일 존재·로드 확인, 버전 미확정 | 공개 상세 HTML의 script src |
| simple-tree-table, monthpicker | 파일 존재·로드 확인, 버전 미확정 | 공고·상세 HTML의 script src |

공고 목록은 ParamQuery **CSS만** 로딩하지만 공개 상세 팝업은 ParamQuery JS와 JSZip/저장/AX 라이브러리도 함께 로딩한다. 따라서 메인 한 화면의 Network 목록만으로 전체 현행 프런트엔드 의존성을 확정하면 누락이 생긴다. 원본 ParamQuery Pro 헤더에는 상용 라이선스 경로가 있으므로 내부 적용 시 기존 사용권·버전 범위와 맞추어야 한다. 프로토타입에서는 실제 그리드 동작을 별도 HTML·JS로 구현해도 된다.

## 5. 이벤트·데이터 전달 규약

관찰한 실제 동작 연결은 다음과 같다. 아래 endpoint는 소스에서 확인했으며 저장·인증 요청을 실행해서 확인한 것이 아니다.

| 사용자 동작 | 실제 소스의 처리 | 데이터/경로 |
| --- | --- | --- |
| 공고 상세보기 | `a[name=btn_detail]` 클릭 → `sbjtId`, `pblancId` attr 읽기 → `fn_bpopup(url,1500,920)` | `/biz/pblancManage/pblancManage/pblancDetailPop.do?sbjtId=…&pblancId=…` |
| 신청하기 | `a[name=btn_regist]` → hidden 값 설정 → `gfnSetFormAction()` → form submit | `/biz/pblancManage/pblancReqstManage/pblancReqst.do`, **POST** |
| 초기 서비스 공지 | `fnNoticePopup()` → `fnGetAjaxData()` → 결과에 따라 popup | `/biz/main/searchData.json`, `/biz/main/noticeMatterPop.do` |
| 지원기업 매뉴얼 | `#btn_down_rcvfvr_manual` 클릭 → 임시 a 다운로드 | `/static/file/manual/rcvfvr_manual.pdf` |
| 소통창구 | `#btn_mlrd_manage` → `gfn_locationHref()` | `/biz/mlrdManage/mlrdManage/mlrdManage.do` |
| 첨부파일 다운로드 | HTML a href | `/combiz/file/downloadFile.do?fileKey=…`, `/combiz/file/downloadZipFile.do?fileId=…` |

`searchForm`의 이름은 `sbjt_id`, `pblanc_id`, `pblanc_rcept_id`, `rcvfvr_entrprs_instt_id`다. 상세 링크의 query/attr는 `sbjtId`, `pblancId`인 반면 신청 form은 snake_case를 사용한다. 임의로 한 가지 표기법으로 바꾸면 기존 매핑과 어긋날 수 있다.

[common.js](D:/work/smtech/reference/public-site/original/www.smtech.go.kr/region/rms/static/js/cmmn/common.js:187)의 `fnGetAjaxData`는 이름과 달리 **HTTP POST**, `dataType:'json'`, `data:sData`, `async:true`를 사용한다. 객체 또는 form을 `serialize()`한 데이터를 전송한다. JSON 응답을 받는다는 뜻이며 요청 본문을 `application/json`으로 보낸다는 뜻은 아니다.

[callAjax.js](D:/work/smtech/reference/public-site/original/www.smtech.go.kr/region/rms/static/js/cmmn/callAjax.js:7)의 객체형 함수도 POST이며 `pAsync` 인자로 동기·비동기 여부를 받는다. `CONST_CONTEXT_PATH + pUrl`로 경로를 만들고 요청 헤더 `AJAX: true`를 설정한다. 응답에서 `resultCode`, `resultMsg`를 사용하며 `noAuth`, `loginDuplicated`, HTTP 403을 로그인 이동 흐름과 연결한다. `success` 값은 개별 업무 JS에서 확인된다. 실제 업무별 응답 DTO와 서버 검증 조건은 내부 개발자가 확인해야 한다.

[common.js:1363](D:/work/smtech/reference/public-site/original/www.smtech.go.kr/region/rms/static/js/cmmn/common.js:1363)의 `gfnSetFormAction()`은 `method='POST'`와 context path가 붙은 action을 설정한다. `fn_bpopup()`은 `loadUrl: CONST_CONTEXT_PATH + url`로 팝업 HTML을 로드한다. 공통 함수명·업무별 파일 분리 방식은 유지하고 신규 기능 호출을 별도 어댑터로 연결하는 것이 현행 구조와 잘 맞는다.

## 6. 프로토타입과 내부 개발자 전달에 적용할 기준

1. 원본 `static/css/ui.css`, `uiCustom.css`, Noto Sans KR CSS 및 필요한 이미지·폰트는 동일한 상대 폴더 구조와 바이트로 보관한다. 원본 보관 경로와 실제 프로토타입 자산 경로를 구분한다.
2. 새 CSS는 원본 뒤에 추가한다. 신규 최상위 영역과 클래스 접두어(예: `.rms-upgrade`, `.rms-upgrade-card`)를 사용하고 `body`, `table`, `.it`, `.mBtn1` 같은 기존 선택자를 전역 재정의하지 않는다. 필요한 보정도 `.rms-upgrade .mBoard1`처럼 개선 영역에 한정한다.
3. 화면 골격·기존 공통 클래스·표 중심 업무 배치를 유지하면서 개선 영역을 추가한다. 반응형 대응이 필요한 경우 원본 `#wrap` 폭 규칙을 바꾸는 대신 프로토타입 전용 식별자가 붙은 컨테이너 안에서 처리한다.
4. 업무 JS는 새 파일과 단일 네임스페이스를 사용한다. jQuery 이벤트 방식이 필요한 내부 적용판은 새 root에서 위임하고 고유 이벤트 namespace로 중복 바인딩을 방지한다. 기존 `common.js`, `ui.js` 함수나 전역 변수를 덮어쓰지 않는다.
5. JSON 저장소와 화면 렌더링을 분리한다. 목록/상세/저장 인터페이스를 정의하고, 추후 같은 메서드 내부를 기존 AJAX 함수에 연결한다. 실제 endpoint·DTO가 확인되지 않은 부분에는 신규 계약 예시임을 표시한다.
6. 프로토타입에서 원본 업무 JS를 그대로 실행하면 초기 AJAX와 로그인/신청 동작이 실서비스를 향할 수 있다. 따라서 원본 JS는 조사용으로 보관하고, 시연은 독립 JS 및 가상 JSON만으로 동작시킨다. 코드 전달 목록에는 실행용 신규 파일과 참고용 원본 파일을 구분한다.

## 7. 아직 확인할 수 없는 항목과 원본의 404

인증 이후 메뉴 구성·권한별 화면, 컨트롤러/서비스/Mapper, DB 스키마, 서버 트랜잭션, JDK/Spring/eGovFrame/DBMS의 실제 설치 버전은 공개 소스로 확정되지 않았다. 운영매뉴얼에 기록된 환경은 우선 참고하되 실제 적용 전 내부 build 설정, 템플릿 파일, WAR/배포 설정과 대조해야 한다.

404 중 6개는 ui.css가 참조하는 `ico_gnb1_on.png`, `ico_pag_first.png`, `ico_pag_prev.png`, `ico_pag_next.png`, `ico_pag_last.png`, `ico_checkbox1_d.png`다. 나머지 53개는 AXJ.min.css의 `images/dx-*`, `images/mx-*`, `img/dx-*` 등 상대 이미지 경로에서 발생했다. 일부는 현재 화면에서 사용하지 않는 규칙일 수 있다. 조사 시 실제 서버가 해당 URL에 404를 반환했다는 뜻이며 폴더를 추측해서 추가 탐색하거나 원본 CSS의 경로를 수정하지 않았다.

전체 원본 91개는 manifest의 SHA-256과 재검증했다. 수집·구조 분석 재현 명령은 [capture_public_site.py](D:/work/smtech/tools/capture_public_site.py)에 있다. `--offline` 옵션은 HTTP 없이 보관된 파일을 다시 분석한다.
