# RMS 기능개선 프로토타입 내부 개발자 인계 가이드 초안

작성일: 2026-09-08. 이 문서는 분석 자료와 작성 중인 프로토타입의 구조를 연결한 **인계 설계 초안**이다. 기능 구현·브라우저 검증·운영 적용이 완료되었다는 확인서가 아니다. 최종 인계 시 파일 목록, 메서드, 테스트 결과를 구현 최종본과 다시 맞춰야 한다.

## 1. 전달 목적과 근거

목표는 현행 RMS의 업무 화면 구조와 공통 자산을 보존하면서 기술닥터, 메인/소통, 사업신청 증빙 간소화를 미리 시연하고, 승인된 HTML·CSS·JS를 내부 JSP·Controller에 연결할 수 있도록 전달하는 것이다. Python은 로컬 정적 파일을 보여주는 개발 도구로 사용할 수 있으며 운영 Java 백엔드의 대체 구성요소가 아니다.

해석 우선순위는 다음과 같다.

1. 공개 서버가 실제 반환한 HTML·CSS·JS 및 Network에서 확인한 경로·응답. 로그인 후 서버 코드나 DB까지 확인한 근거로 확대하지 않는다.
2. 지원기업 사용자매뉴얼 PDF의 화면 캡처와 해당 화면 설명. 공개 접근이 불가능한 기업 화면을 보완한다.
3. 운영매뉴얼 HWP의 개발·빌드·JSP 규칙. 문서 안에서도 환경 버전과 파일일자가 다르므로 실제 저장소와 대조한다.
4. 제안요청서 요구사항을 만족시키기 위한 신규 화면과 데이터 설계. 기존 DB/API의 현재 구조가 아닌 제안안이다.

| 자료 | 확인한 내용 | 로컬 근거 |
|---|---|---|
| 공개 소스 조사 | `/region/rms`, `/static`, `.do/.json`, 공통 DOM/CSS/JS, POST 규약 | `reference/public-site/source-audit.md`, `manifest.json`, 원본 파일 |
| 운영매뉴얼 분석 | WebContent, JSP 화면 구분, Java/Maven/배포 구조와 불일치 | `reference/documents/manual-environment-analysis.md` |
| 제안요청서 분석 | SFR-01~15와 비기능·환경 제약 | `reference/documents/requirements-analysis.md`, `requirements-catalog.json` |
| 기업용 PDF 분석 | 신청·첨부·협약·평가·결과보고·소통 화면 흐름 | `reference/user-manual/screen-audit.md` 및 원본 PDF |
| 작성 중 소스 스냅샷 | index 로드 순서, RMSCore 저장소와 검증, 가상 seed | `prototype/region/rms/index.html`, `static/js/rms-enhance/core.js`, `data/seed.json` |

## 2. 공개 URL과 내부 소스 배치의 연결

외부 URL은 서버 내부 디렉터리 경로가 아니다. 운영매뉴얼은 프로젝트 이름 `tipa_rbms`, 웹 컨테이너 `WebContent`, Maven 산출 `target/rbms-1.0.0`, 패키지 `gov.tipa.rbms`, JSP/Controller/Service/Dao/MyBatis 규칙을 설명한다. 공개 HTML만으로 JSP 원문이나 내부 파일 위치를 확인할 수 없으므로 아래 WebContent 배치는 **기존 저장소에서 웹 루트를 확인한 후 적용할 후보**다.

| 공개 요청·리소스 | 관찰한 역할 | 내부 저장소 인계 위치 후보 |
|---|---|---|
| `/region/rms/static/css/ui.css` | 전역 reset, 헤더/본문, 표·버튼·탭·카드 공통 스타일 | 기존 `<웹 루트>/static/css/ui.css` 그대로 유지 |
| `/region/rms/static/css/uiCustom.css` | 기존 개발자 보정 규칙 | 기존 `<웹 루트>/static/css/uiCustom.css` 그대로 유지 |
| `/region/rms/static/images/...` | 로고·아이콘·배경 | 기존 경로 사용; 새 이미지에 별도 이름/폴더 사용 |
| `/region/rms/static/notosansKR/...` | Noto Sans KR CSS와 폰트 | 기존 로딩·상대 참조 보존 |
| `/region/rms/static/js/cmmn/common.js` | AJAX, form POST, 팝업 등 공통 함수 | 수정 없이 기존 공통 include 사용 |
| `/region/rms/static/js/biz/<업무>/...js` | 페이지별 DOM 이벤트와 공통 함수 호출 | 기존 파일 유지, 신규 페이지/어댑터를 별도 파일로 연결 |
| `/region/rms/biz/.../*.do` | 화면/팝업 응답. 예: 공고 상세 | 기존 Controller/View 매핑에 신규/개선 JSP 콘텐츠 연결 |
| `/region/rms/biz/.../*.json` | 업무 JS에서 사용하는 JSON 응답 문자열 | 실제 Controller 계약 확인 후 데이터 어댑터 연결 |
| 신규 `/region/rms/static/css/rms-enhance.css` | 범위가 한정된 개선 스타일 | `<웹 루트>/static/css/rms-enhance.css` 신규 추가 |
| 신규 `/region/rms/static/js/rms-enhance/*.js` | 개선 업무/렌더링/초기화/연계 어댑터 | `<웹 루트>/static/js/rms-enhance/` 신규 추가 |

매뉴얼의 화면 파일 분리 예시는 `user/search.jsp`, `list.jsp`, `insertForm.jsp`, `updateForm.jsp`, `index.jsp`, `tree.jsp`다. 실제 개선 업무 경로에 맞춰 공고신청의 검색/목록/서류 폼, 기술닥터 목록/입력/상세, FAQ 검색/목록 콘텐츠를 나눌 수 있다. 매뉴얼 예시를 그대로 신규 경로로 확정하거나 현재 운영 JSP의 실제 파일명으로 인용하지 않는다.

최종 웹 루트가 `WebContent`인지 다른 Maven 구성인지, 공통 헤더와 팝업 JSP include가 무엇인지, 프록시의 `/region/rms`와 Servlet context가 일치하는지는 내부 저장소에서 확정한다. 경로를 코드 문자열 곳곳에 반복하지 말고 기존 context URL helper를 사용한다.

## 3. 프로토타입 파일의 인계 구분

```text
prototype/region/rms/
  index.html                         시연용 전체 문서. 운영에는 개선 본문을 분리 이식
  data/seed.json                     가상 초기자료. 운영 배포 대상 아님
  static/css/ui.css                  확보 원본과 동일한 파일을 사용하는 목표
  static/css/uiCustom.css            확보 원본과 동일한 파일을 사용하는 목표
  static/css/rms-demo-shell.css       시연 전용 헤더·도구모음·바깥틀 보정
  static/css/rms-enhance.css          내부 개발자 전달용 개선 스타일
  static/js/rms-enhance/core.js       현재 RMSCore 업무 검증/가상 저장소
  static/js/rms-enhance/views.js      index에서 참조하는 화면 렌더링 파일
  static/js/rms-enhance/app.js        index에서 참조하는 초기화/이벤트 파일
  static/js/rms-enhance/adapter-*.js  추후 분리 가능한 연계 어댑터 제안명
```

읽은 시점에는 `core.js`가 존재했고 `index.html`은 `views.js`와 `app.js`도 참조했다. 해당 파일들은 다른 작업에서 계속 구현 중일 수 있으므로 이 표는 완료 목록이 아니다. 원본 CSS 복사 여부·최종 해시, 실행용 파일 목록, 참조 누락은 최종 패키지 검증 단계에서 확인한다.

`reference/public-site/original`은 조사 증거이고 운영에 통째로 복사하는 패키지가 아니다. 원본 HTML에는 서버가 응답한 익명 세션 문자열이 남을 수 있으므로 배포 대상으로 사용하지 않는다. 원본 업무 JS를 시연 문서에 전부 로드하면 공지 조회·로그인·신청 등 실제 서버 요청을 실행할 수 있다. 시연은 가상 데이터와 신규 스크립트만 실행한다.

## 4. 기존 CSS와 JS를 보존하는 적용 방법

### CSS 범위와 로딩

관찰한 기존 로드 순서는 jQuery UI CSS, Noto Sans KR, `ui.css`, `uiCustom.css`, 해당 화면에 필요한 플러그인 CSS다. 개선 CSS는 기존 화면이 최종적으로 적용한 공통·플러그인 CSS 뒤에 추가한다. 로그인은 `ui.css` 대신 별도 `login.css`를 사용하므로 무조건 같은 파일 집합을 넣지 않는다.

작성 중 프로토타입은 `ui.css → uiCustom.css → rms-demo-shell.css → rms-enhance.css` 순서다. 운영에서는 `rms-demo-shell.css`와 시연 역할전환·JSON 도구모음을 제거하고 기존 헤더·메뉴·인증 영역을 사용한다. `rms-enhance.css`의 개선 본문·다이얼로그만 이식하는 구조를 권장한다.

현재 신규 CSS는 `.rms-enhance` 범위 아래에서 `.rms-*` 클래스와 `--rms-*` 변수를 사용한다. 본문 root는 `#rms-enhance-app.rms-enhance`, 팝업 host는 `#rms-dialog-host.rms-enhance`다. `body`, `table`, `.it`, `.mBtn1`, `#wrap` 같은 기존 선택자를 전역 재정의하지 않는다. 기존 클래스를 사용하는 새 블록을 보정해야 한다면 `.rms-enhance .mBoard1`처럼 개선 범위를 명시한다.

공개 `ui.css`의 `#wrap` 최소폭은 1300px이고 폰트는 Noto Sans KR다. 운영 전체에 반응형 CSS를 덮어쓰는 것은 이번 독립 개선 범위를 넘어갈 수 있다. 시연 바깥틀의 최소폭 보정은 `.rms-demo` 등 시연 식별자로 한정하고 운영 공통 shell의 변경 여부를 별도로 합의한다.

공개 자산은 일부 CSS 참조 이미지가 404다. 이것을 신규 개발 파일의 경로 오류와 구분하여 기록한다. 원본 CSS를 임의로 고쳐 보관본과 달라지게 하지 않는다.

### JavaScript 충돌과 수명주기

`core.js`는 즉시실행함수와 strict mode를 사용하며 브라우저에 `window.RMSCore`만 내보낸다. 모듈 환경에서는 `module.exports`를 제공한다. DOM 호출·외부 라이브러리 의존·운영 endpoint를 포함하지 않는 업무 계층이다. 기존 `$`, `fn*`, `gfn*`, `CONST_CONTEXT_PATH` 등을 덮어쓰지 않는다.

렌더링/이벤트/연계 계층도 각각 고유 namespace 안에 두며 일반적인 `save`, `search`, `init` 같은 전역 함수를 만들지 않는다. 기존 jQuery 이벤트와 연결해야 한다면 신규 root에 이벤트를 위임하고 `.rmsEnhance`와 같은 고유 이벤트 namespace로 등록·해제한다. JSP 팝업을 재개방할 때 핸들러가 중복되지 않도록 `mount`/`destroy` 수명주기를 명시하는 것이 좋다.

기존 팝업 `fn_bpopup`을 재사용하는 운영판에서는 HTML을 반환하는 기존 흐름에 개선 콘텐츠를 넣을 수 있다. 시연 다이얼로그와 기존 팝업을 동시에 중첩 초기화하지 않도록 하나의 host만 소유하게 한다. ESC/닫기/포커스 복귀/키보드 이동을 최종 화면에서 확인한다.

## 5. 데이터 모델과 어댑터 연결

### 현재 읽은 가상 저장 구조

`RMSCore.createStore(seed, storage)`는 가상 JSON을 검증한 후 복제하여 사용한다. `storage`가 있으면 key `rms.prototype.v1`으로 읽고 저장하며, 브라우저 연동 시 일반적으로 localStorage를 전달할 수 있다. 실제 app 초기화에서 어떤 storage를 전달하는지는 최종 소스로 확인한다. localStorage를 사용한다면 같은 origin·브라우저 프로필에 한정되고 서버 파일을 직접 수정하지 않는다.

`exportJson()`/`importJson(text)`는 데이터 문자열을 내보내고 다시 읽는다. JSON은 schemaVersion 1, 필수 배열, ID 중복, 참조, 분류 순환, 주요 타입/상태 등을 검증한다. 가져오기 텍스트는 현재 5MB 제한이다. 업무 동작은 복제본을 변경·검증·저장한 후 state로 반영한다. 이 방식은 가상 데이터 보존을 돕지만 서버 트랜잭션·다중 사용자 동시수정을 구현한 것은 아니다.

| 가상 데이터 | 현재 주요 필드 | 실연계 시 확정할 매핑 |
|---|---|---|
| `classifications` | id, kind, parentId, name, active, visible | SMTECH/RMS 기존 표준코드 및 다대다 연결 |
| `users`, `doctors` | userId, owner, institution, industry, technologies, supportRegions, updatedAt, history | 실제 사용자 식별자·등록기관 ID·개인정보 공개 범위 |
| `matches` | doctorId, companyId, request, date, status, result | 실제 매칭/지원 사업·접수기관·처리결과·통계 식별자 |
| `programs` | id, region, start, end, requiredDocs | 과제/공고/사업/프로그램 ID 관계와 요구서류 |
| `documentTypes` | id, name, provider, active | 기관별 증빙 종류 코드·발급조건·기준연도 |
| `applications` | programId, companyId, inputAddress, address, consent, consentAt, submission, docs | 현행 신청접수 ID·기업 ID·입력정보·동의기록 |
| `applications[].docs` | specId, status, queriedAt, reason, file, history | 조회요청/응답/증빙 파일키/보완요청/감사이력 |
| `faqs`, `questions` | work, title, answer, keywords, published/public, mainVisible | 기존 소통분류·게시물/답변 ID·공개/검토 정책 |
| `settings`, `audit` | 메인 순서/노출, 갱신기준, 변경행위 | 운영 설정 권한·감사로그·보관 기준 |

가상 파일 제출은 `name`과 `size` 메타정보만 저장한다. 바이너리나 다운로드 가능한 원본 파일을 JSON에 보관하지 않는다. JSON 가져오기 후에도 실제 첨부파일이 복원되는 것처럼 안내하면 안 된다.

### 실제 POST/common.js 연결 시 지켜야 할 규약

공개 소스에서 `fnGetAjaxData`는 이름과 달리 HTTP **POST**, `dataType: 'json'`, `data: sData`, `async: true`를 사용한다. `dataType`은 응답 형식이며 요청을 JSON 문자열로 보내야 한다는 뜻이 아니다. 기존 `.serialize()` 또는 파라미터 객체 형식을 실제 Controller와 맞춘다.

`callAjax.js`는 `CONST_CONTEXT_PATH + pUrl`, `AJAX: true` 헤더, `resultCode`/`resultMsg`, `noAuth`/`loginDuplicated`/HTTP 403에 따른 인증 처리를 가진다. `gfnSetFormAction`도 POST 방식이다. 로그인 예외·중복로그인·세션 만료는 기존 공통 처리와 연결한다.

현행 공고 상세는 query/attribute `sbjtId`, `pblancId`, 신청 form은 `sbjt_id`, `pblanc_id`, `pblanc_rcept_id`, `rcvfvr_entrprs_instt_id`를 사용한다. 가상 `programId`/`companyId`를 그대로 요청 이름으로 사용하거나 모두 camelCase로 통일하지 않는다.

읽은 시점의 `core.js` 동작은 **동기 호출**이다. 서버 어댑터는 비동기이므로 단순히 내부 함수를 AJAX로 치환하는 것만으로는 충분하지 않다. UI 호출부를 Promise/완료 콜백 계약으로 맞추고 로딩·저장중 중복클릭·실패 시 입력 보존·인증 만료·목록 새로고침을 처리한다.

권장 연결 단계:

1. 내부 개발자가 기존 Controller·JSP·업무별 DTO·서버 검증 및 공통 AJAX 함수의 정확한 인자를 확인한다.
2. `listDoctors`, `getDoctor`, `saveDoctor`, `listApplications`, `queryDocument`, `submitApplication` 등의 읽기/쓰기 계약과 성공·오류 응답을 확정한다. 이름은 신규 어댑터 제안이며 실제 운영 API 목록이 아니다.
3. 시연 storage를 감싸는 mock adapter와 실제 common.js를 호출하는 server adapter가 같은 비동기 인터페이스를 제공하도록 분리한다.
4. server adapter에서 현행 ID/필드/상태 코드와 시연용 view model을 양방향 매핑한다. 화면이 서버의 DB 컬럼명에 직접 의존하지 않게 한다.
5. 서버 성공 이후 상태를 반영하고, 실패하면 기존 입력과 재시도 경로를 보존한다. 파일/동의/매칭 같은 반복 요청에는 서버 중복처리 기준을 둔다.
6. 확인된 endpoint만 운영 설정으로 전달한다. 새 `.json` 주소를 추정해 운영 서버에 호출하지 않는다.

## 6. 운영 인증·권한·외부연계의 경계

| 시연에서 확인할 동작 | 운영에서 연결해야 할 책임 |
|---|---|
| `visitor/company/tp/admin` 역할 전환, 기업/소관지역 필터 | 실제 세션과 서버 권한. 클라이언트 role/region/companyId는 접근권한 증거로 신뢰하지 않음 |
| 등록기관 담당자만 전문가 수정, SMTECH 가상 사용자 중복 확인 | 실제 계정/기관 관계, 동일인 판정, 기관 이관/겸직, 서버 참조 무결성 |
| 공개 글/메인노출 조건 필터 | API 단계 비공개 제외, 개인정보 검토와 권한별 응답 필드 제한 |
| 동의 후 조회, 동의 철회, 조회일시 기록 | 승인된 공공마이데이터 연계·동의 문구/범위/유효기간/철회·보관/삭제·기관 인증 |
| 조회완료/실패/불일치/미제공의 고정 예시 | 실제 비동기 응답/오류코드·시간초과·중복요청·재시도·기준일 매핑 |
| 주소 전후 비교 후 사용자 반영 | 실제 신청정보 필드별 정정권한·출처·검증·서버 저장·감사로그 |
| 파일명/크기 선택 및 한 서류당 파일 대체 | 실제 업로드·저장·검사·파일키·다운로드 권한·보존·분할/용량 정책 |
| JSON 저장/가져오기, 최근 300개 가상 audit | 실제 DB·트랜잭션·동시수정·감사로그·백업. 고객 개인정보를 시연 storage에 넣지 않음 |
| 가상 로그인 버튼/역할 변화 | 기존 ID/PW·휴대폰 인증·세션/SSO. PDF pp.18-19와 공개 로그인 흐름 연결 |
| 협약·전자서명 화면 참고 | 기존 법인 인증서·서명 서비스. 이번 목업이 실제 전자서명으로 보이면 안 됨 |

현재 가상 파일 형식/10MB 제한과 255자 파일명 검증은 시연 설정이다. PDF p.31은 20자 파일명을 안내하므로 현행 서버 기준을 확인해 표시·검증 규칙을 맞춘다. MIME·확장자·악성파일·파일 내용·권한 검증은 서버 책임이다.

`index.html`의 Content-Security-Policy는 시연에서 self 연결만 허용하고 `form-action 'none'` 등을 선언한다. 이 정책을 운영 JSP에 그대로 복사하면 기존 form POST와 필요한 인증/파일 기능이 차단될 수 있다. 운영의 기존 CSP·외부연계 도메인·인라인 스크립트 정책에 맞춰 내부 보안 설정으로 재검토한다.

## 7. SFR-01~15 연결표 초안

아래는 요구사항과 읽은 소스의 연결 지점 및 고객 확인 기준이다. UI 파일 구현과 시연 검증을 확인한 완료표가 아니다. 최종 추적표에는 화면 ID·해당 소스·검증 결과·남은 항목 열을 추가한다.

| 요구사항 | 화면·자료 후보 | 읽은 core/seed 연결점 | 고객 시연 및 실연계 확인 |
|---|---|---|---|
| SFR-01 기술닥터 등록정보 현행화 | 기술닥터 등록·상세·이력 | `saveDoctor`, `isStale`, users/doctors/history | 가상 사용자 초기값, 중복, 소관기관 수정, 갱신기준. 실제 사용자/기관코드 확인 |
| SFR-02 표준 분류체계 | 표준분류 관리·전문가 입력 | `saveCode`, `removeCode`, classifications | 계층/다중선택, 참조 중 삭제방지. 기존 SMTECH 분류 변환 합의 |
| SFR-03 초광역 통합검색 | 기술닥터 검색·매칭 | `searchDoctors`, `requestMatch`, `progressMatch` | 타지역 지원가능 전문가 요청, 완료 실적. 수신·승인절차 합의 |
| SFR-04 검색 고도화 | 필터/정렬/상세/비교 | `searchDoctors`, 기술·지역·기관·연도 데이터 | 다중 검색과 비교 정보량. 비교 UI와 실제 서버 페이징은 최종 확인 |
| SFR-05 통계 관리 | 통계·내려받기 | doctors/matches/state 데이터 | 요청·진행·완료의 집계 차이. 읽은 core에는 독립 통계 API가 없어 최종 UI 집계 검증 필요 |
| SFR-06 로그인 영역 | 메인 사용자 영역 | `setRole`, `getSession`, index 역할 선택 | 로그인 전후 변화는 가상. 기존 인증·로그아웃·회원정보 연결, PDF pp.18-20 |
| SFR-07 FAQ 검색 | 메인 FAQ·전체 FAQ | `searchFaqs`, faqs/keywords | 정확 일치와 관련 답변. 현재 연관검색은 문자열/토큰 점수 예시이며 AI 검색 아님 |
| SFR-08 업무 분류 검색 | 업무유형·분류 설정 | `saveCode`, `mapWork`, FAQ work | 유형 사용/노출과 기존 질문 매핑. 현재 코드 종류를 운영 코드로 매핑 |
| SFR-09 최근 질문 | 메인 최근 글·소통 상세 | `visibleQuestions`, `updateQuestion` | 공개+노출만 표시, 비공개 차단. PDF pp.76-77 |
| SFR-10 메인 배치·접근성 | 메인·설정·바로가기 | `updateSettings`, homeOrder/homeVisible | 배치/순서, 키보드·레이블·포커스 검증. 정식 접근성 인증 완료로 표현하지 않음 |
| SFR-11 증빙 간소화 | 신청서류·동의/파일 대체 | `consent`, `attachFile` | 미동의·미제공에서도 파일 경로. PDF pp.23-26의 기존 신청 흐름에 삽입 |
| SFR-12 9종 증빙 조회 | 사업별 요구서류·조회 | `queryDocument`, documentTypes/programs.requiredDocs | 전체 9종과 사업 필수목록 구분. 실제 기관·발급요건/응답 매핑 |
| SFR-13 신청정보 반영 | 불일치 비교 | `resolveMismatch`, inputAddress/address | 기존값 유지/조회값 선택. 현재 주소 예시를 전체 확정 필드로 확대 |
| SFR-14 제출현황 | 기업/기관별 신청·서류 목록 | `getApplications`, `submitApplication`, `requestSupplement` | 기업/소관기관 필터와 5개 서류상태. PDF pp.33-42 접수 흐름 연결 |
| SFR-15 결과·보완관리 | 실패 안내·재조회·처리이력 | `queryDocument(retry)`, `requestSupplement`, doc.history | 재조회/파일 보완/사유·시각. 실제 오류코드·알림·감사이력 연결 |

SFR-01~05의 기술닥터 화면은 기업용 PDF에서 확인되지 않는다. 제안요청서에는 현행 서비스 영역으로 기술닥터가 명시되어 있으므로 기존 메뉴가 없다고 단정하지 말고 내부 기술닥터 JSP와 권한별 화면을 전달받아 대조한다.

## 8. PDF 화면과 개선 콘텐츠의 접점

| 기존 기업 화면 | 보존할 흐름 | 개선 콘텐츠 접점 |
|---|---|---|
| p.20 내부 홈 | 헤더·상단 메뉴·접수 공고·상세/신청 | 로그인 접근, FAQ/최근 글, 바로가기와 정보 우선순위 |
| pp.21-22 공고 상세 | 과제/공고/프로그램·담당자·첨부 팝업 | 사업별 필수서류 안내와 신청 진입 연결 |
| pp.23-26 신청 폼 | 기업정보→산업/대상/프로그램→담당자→접수서류 | 서류 표에 동의·조회·불일치·파일 대체·상태/이력 추가 |
| pp.31-42 접수관리 | 임시저장→필수 검사→제출→보기/회수 | 기업/기관별 증빙 현황과 보완요청. 마감·회수 규칙 확인 |
| pp.45-68 협약·변경 | 상단 협약 드롭다운, 표·모달·전후 비교 | 신규 화면의 공통 표현 참고. 기존 전자서명/변경업무를 전체 재구현하지 않음 |
| pp.69-74 결과보고 | 프로그램→보고서 그룹→복수 파일 | 신청서류 단일 파일 정책과 결과보고 다중파일 정책 구분 |
| pp.76-77 소통관리 | 검색/목록/비밀글/등록/첨부·답변 상태 | 메인 FAQ·최근 공개 질문 및 업무유형 필터와 연결 |

매뉴얼의 큰 파란 단계 헤더·붉은 주석·하단 설명은 사이트 UI가 아니다. 기존 기업용 화면은 상단 메뉴 방식이며 좌측 메뉴는 이 PDF에서 확인되지 않았다. 기술닥터 신규 화면에서도 기존 메뉴/팝업 흐름을 우선 참조한다.

## 9. 고객 시연 시나리오 초안

각 시나리오의 예시 이름·금액·기관·파일은 가상이다. 시연 전에 seed를 초기화해 같은 시작 상태를 만들고, 고객 결정사항과 실제 연계 후 재검증 사항을 따로 기록한다.

1. **메인과 소통**: 로그인 전 홈에서 공고·주요 FAQ·최근 글 위치를 확인한다. 업무유형을 고르고 FAQ를 검색한다. 정확 일치가 없는 단어에서는 관련 항목을 확인한다. 관리자 역할로 공개 글의 메인 노출/배치를 바꿔 고객이 우선순위를 결정한다. 비공개 예시는 노출되지 않아야 한다.
2. **기술닥터 탐색**: 지원기업 역할에서 충남 기업에 지원 가능한 타지역 전문가를 검색한다. 기관유형·기술·지역·연도 조건과 정렬을 바꾸고 후보를 비교한다. 활동불가/지원지역 미충족은 매칭 제한으로 확인한다.
3. **전문가 현행화와 실적**: 관리기관 역할에서 가상 SMTECH 사용자를 선택하고 등록한다. 중복등록, 타기관 수정 제한, 변경이력·갱신기준을 확인한다. 매칭을 요청접수→지원진행→지원완료로 처리하고 집계의 변화 및 통계 정의를 논의한다.
4. **증빙 정상/예외 흐름**: 사업신청에서 필요한 서류를 확인하고 동의 후 조회한다. F01 주소 불일치는 기존값/조회값을 비교한다. F06 지방세는 최초 가상 실패 후 재조회 성공, F09 4대보험은 미제공으로 파일 대체 흐름을 확인한다. 9종 전체를 필수로 요구하지 않는다.
5. **기관 보완 요청**: 관리기관이 사유를 입력하여 보완필요로 변경한다. 지원기업으로 돌아가 사유·이력을 읽고 재조회 또는 파일을 선택한다. 필수 미충족일 때 제출이 막히는지 확인하고, 완료 후 상태와 제출 가능 여부를 논의한다.
6. **JSON 인계 재현**: 가상 데이터를 수정한 뒤 JSON 저장, 초기화, JSON 불러오기로 화면 상태를 복원한다. 첨부는 메타정보만 복원된다는 한계를 설명한다. 다른 origin/브라우저에서는 로컬 저장소가 공유되지 않는 점을 안내한다.

최종 시연 체크에는 빈 목록, 잘못된 JSON, 중복 ID/분류순환, 소관기관 범위, 동의 전 조회, 동의 철회 후 제출, 파일 대체, 비공개 메인노출 차단, 제출 후 수정·회수/보완 상태를 포함한다. 이 문서만으로 해당 검증이 통과한 것으로 표시하지 않는다.

## 10. 내부 적용 전 확정할 항목

- **실제 환경**: pom.xml의 앱 의존성과 JDK 컴파일 레벨, 운영 JDK/Tomcat/PostgreSQL 버전, 실제 웹 루트/JSP 템플릿/배포 context. 운영매뉴얼의 JDK 18.0.2/1.8.0_144, Tomcat 9.0.80/9.0.105, PostgreSQL 14.9/14.18 표기는 현행 확인 필요다.
- **자산·라이브러리**: 실제 jQuery 3.6.0, jQuery UI 1.12.1, SweetAlert와 SweetAlert2의 화면별 차이, ParamQuery Pro 8.6.0 사용 범위와 기존 사용권. 신규 모듈 때문에 라이브러리를 중복 로드하거나 기존 버전을 일괄 교체하지 않는다.
- **소스 위치**: 공개 `.do/.json`과 JSP/Controller 매핑, WebContent와 Maven 배포 산출의 관계, 공통 include와 화면 init/destroy 방식.
- **데이터**: 기존 코드체계·전문가/기관/사용자 식별자·권한·사업/공고/프로그램/신청접수 관계·실제 상태 코드·보고서 및 파일키.
- **업무규칙**: 전문가 갱신 기간/매칭 승인·집계 단위, 제출/회수·마감 후 수정·동의 철회·보완 통지, 서류별 기준연도·유효기간/필수여부.
- **문서 불일치**: PDF p.24/25의 천원/원, p.31 20분 설명과 화면의 약 60분 타이머, 파일명 20자와 실제 파일 검증, p.56 지원금사용계획 캡처와 지원기간 설명의 오기.
- **운영 연계**: 마이데이터 승인·인증·응답 규격·동의·보관정책, 실제 업로드/다운로드, 인증/SSO/세션·CSRF·권한 오류 처리.
- **품질·배포**: 지원 브라우저와 접근성 검수, 기존/개선 동시 로딩 회귀확인, 데이터와 파일 마이그레이션, 최종 산출물 해시/변경목록과 기존 파일로 되돌리는 방법.

최종 적용 순서는 실제 구조 확인→개선 영역 JSP 분리→신규 정적 파일 추가→기존 공통 include 연결→어댑터/서버 DTO 연결→업무·권한·회귀 검증→내부 배포 절차다. 이 초안은 운영 배포를 수행하거나 승인된 운영 변경을 의미하지 않는다.
