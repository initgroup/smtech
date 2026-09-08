# 실제 공개 소스·운영매뉴얼·PDF 대조

## 증거의 우선순위

1. 실제 공개 사이트의 렌더링 DOM·참조 경로·응답 파일
2. 공개 범위에서 확인되지 않는 로그인 이후 화면은 사용자매뉴얼 PDF 캡처
3. 서버/개발 환경과 명명 규칙은 운영매뉴얼 HWP
4. 새 기능과 업무 조건은 제안요청서
5. 그 밖의 화면·코드·상태는 **개선 설계안/확인 필요**로 구분

브라우저 DOM 조사와 동일 URL에 대한 GET 수집을 병행했다. 개발자도구의 Elements/Sources에서 확인할 수 있는 참조 관계에 해당한다. 인증 뒤 DOM, HAR 전체 기록, 서버 Java/JSP 원본, 저장소/DB 구조까지 확보했다는 의미는 아니다.

## 직접 확인한 경로와 구조

공개 시작점: [RMS](https://www.smtech.go.kr/region/rms)

```text
/region/rms
├─ biz/login/loadingLogin.do       로그인 화면 전환
├─ biz/main/main.do                비로그인 요청에서는 로그인 화면 반환
├─ biz/pblancManage/pblancManage/
│  ├─ pblancDetailPop.do           공개 공고 상세 팝업
│  └─ pblancReqst.do               JS에서 확인한 신청 이동 경로
└─ static/
   ├─ css/ui.css                  전역 스타일·공통 화면
   ├─ css/uiCustom.css            기존 개발자 추가 스타일
   ├─ images/                     로고·아이콘·배경
   ├─ notosansKR/css/              폰트 정의
   ├─ notosansKR/font/             TTF 폰트
   └─ js/
      ├─ jquery/3.6.0/
      ├─ ui/ui.js
      ├─ cmmn/constants.js
      ├─ cmmn/common.js
      ├─ cmmn/callAjax.js
      ├─ biz/index/index.js
      ├─ paramquery/
      └─ sweetalert2/
```

정확한 전체 URL은 [manifest](../reference/public-site/manifest.json), 호출문·의존경로는 [공개 소스 보고서](../reference/public-site/source-audit.md)에 있다. 파라미터가 있는 실제 URL은 해당 수집 기록을 기준으로 한다.

| 항목 | 확인 내용 | 구현에 반영한 점 |
|---|---|---|
| 메인 DOM | `#wrap > #header, #body, #footer`, 본문 `.mKeysub1`, `form#searchForm`, `.gTitle2`, `.mList1` | 시연 외곽의 header/body/footer 흐름 유지 |
| 표/폼 | `.mBoard1`, `.mTitle2`, `.mBtn1`, `.mTab1`, `.mGrid1` | 검색폼·표·탭·하단 버튼의 익숙한 배치 유지, 새 클래스는 `rms-` |
| 팝업 | `.mPopup1.w100per`, `.modalBg`, `.popupBg`, `.title`, `.cont.scrollY`, `.mButton1` | 별도 범위의 대화상자 헤더/본문/하단 처리 흐름 |
| CSS 순서 | `ui.css` 이후 `uiCustom.css` | 두 원본을 바이트 그대로 복사, 신규 스타일을 마지막에 추가 |
| 고정폭 | `#wrap{min-width:1300px}` | 로컬 외곽만 `.rms-demo`에서 폭 완화. 운영에서 원본 규칙 변경하지 않음 |
| 기존 덮어쓰기 | `.mGrid1` 44/56% → `uiCustom.css` 35/65% 등 | 기존 선택자 재정의를 신규 파일에 복제하지 않음 |
| 전송 | `fnGetAjaxData`는 이름과 달리 POST, form 전송도 POST | 실제 어댑터는 메서드 이름으로 GET 여부를 추측하지 않음 |
| 통신 공통 | `AJAX:true`, 응답 `resultCode`/`resultMsg` 처리 등 | 기존 공통 오류/세션 처리 사용 여부를 내부에서 확인 |
| 신청 파라미터 | 상세 camelCase, 신청 hidden snake_case 혼재 | 임의 통일하지 않고 화면별 실소스에서 맞춤 |
| 캐시/세션 | `;JSESSIONID_rbms=…`, `?v=…` | 목록/로컬 경로에서 제거. 원본 HTML은 reference에만 보존 |

## 라이브러리 버전

| 구성요소 | 실제 확인 근거 |
|---|---|
| jQuery | 파일·헤더 3.6.0 |
| jQuery UI | 경로는 `jquery/3.6.0/`, 실제 헤더는 **1.12.1** |
| jQuery Form | 헤더 3.51.0-2014.06.20 |
| bPopup | 헤더 0.10.0 |
| SweetAlert2 | 메인 로드 파일 헤더 11.6.11 |
| ParamQuery Pro | 공개 상세 팝업 로드 파일 헤더 8.6.0 |
| pqTouch | 헤더 1.0.1 |

새 화면은 추가 프레임워크·jQuery 중복 로딩 없이 순수 JavaScript로 구현했다. 내려받은 기존 업무 JS는 로컬 시연에서 로드하지 않으며, 기존 ParamQuery 등 상용 구성요소도 시연 의존성으로 추가하지 않았다. 이 자료의 공개 접근 가능 여부가 제3자 라이브러리의 재배포 허가를 뜻하지는 않으므로 운영의 기존 사용 계약 범위에서 인계한다.

## 수집 결과

- URL 150개, HTTP 200 원본 91개, 합계 40,203,296바이트.
- HTTP 404 59개: AXJ CSS 의존 이미지 53개, 원본 ui.css 의존 이미지 6개. 원본 URL에서 없는 자산을 새로 만들어 원본으로 표시하지 않았다.
- 성공 파일 91개의 SHA-256 검증을 수행했다.
- `reference/public-site/original/`은 수정 없는 수집본이다. 운영 실행물과 분리했다.
- 프로토타입에는 원본 공통 CSS 2개, 기존 이미지, Noto Sans KR 폰트만 복사했다. 자체 JS만 실행한다.

## 매뉴얼 개발환경과 실제 확인 수준

| 항목 | HWP 기재 | 공개 소스 확인 수준 |
|---|---|---|
| 프로젝트 | `tipa_rbms`, `WebContent`, `/region/rms` | URL 컨텍스트만 직접 일치 확인 |
| 개발 Java | JDK 1.8.0_144, compiler 1.8 | Java 버전 확인 불가 |
| 운영 Java | OpenJDK 18.0.2 | 확인 불가 |
| 개발 WAS | Tomcat 9.0.105 | 확인 불가 |
| 운영 WAS | Tomcat 9.0.80 | 확인 불가 |
| 개발 DB | PostgreSQL 14.18-1 | 확인 불가 |
| 운영 DB | PostgreSQL 14.9 | 확인 불가 |
| IDE | egovFramework 4.3.1 IDE | 실행 프레임워크 버전까지 뜻하지 않음 |
| 개발 구성 | JSP·Spring·MyBatis·Maven·SVN | `.do`/`.json` 경로 및 JS 통신은 관찰. 서버 구현은 미확인 |
| 인코딩 | UTF-8 | 공개 HTML 및 시연 파일 UTF-8 |

파일명은 20260907이나 HWP 본문 작성일/버전은 2025-06-09/1.0이다. 개발·운영·IDE 버전을 하나로 합쳐 단정하지 않는다. 실제 내부 소스를 받을 때 `pom.xml`, Java compile target, WAS 설정, JSP include/layout, MyBatis mapper 및 공통 JS 사용부를 먼저 대조한다. 현 시연을 위해 Java/DB를 설치하지 않았다.

## 로그인 이후 화면의 PDF 근거

| PDF 페이지 | 관찰 내용 | 적용 |
|---|---|---|
| 20 | 흰 헤더, RMS 로고, 상단 공고/협약/평가관리/소통관리, 사용자 메뉴 | 수평 메뉴 유지. 기술닥터는 개선 요구에 따른 추가 메뉴 |
| 23–26 | 신청기업 정보와 밀집된 라벨/값 표, 접수서류 표, 임시저장/제출/목록 | 서류 화면 기본 골격, 필수 구분, 단일 파일첨부 |
| 33, 43, 69, 75 | 제목·breadcrumb → 회색 검색폼 → 데이터그리드 | 신규 목록/검색 화면에 공통 적용 |
| 53 | 협약변경 모달 형태 | 개선 팝업의 헤더/본문 구획 참고 |
| 71 | 결과보고 그룹별 다중 첨부 | 접수서류 단일첨부와 다른 업무임을 구분 |
| 76–77 | 소통관리 목록, 비밀글 여부·편집/첨부 폼 | 공개·비공개/메인노출 제어 설계 |

PDF에서 기술닥터 화면은 확인되지 않는다. 기술닥터 화면은 제안요청서 요구와 현행 공통 스타일을 연결한 개선안이다. 확인한 기업용 화면에는 좌측 사이드바가 없어 신규 화면에도 추가하지 않았다.

PDF의 원/천원 단위, 약 60분 타이머와 20분 미사용 설명, 일부 캡처/설명은 불일치한다. 현행값으로 확정하지 않았다. 캡처 위 빨간 번호·테두리는 설명 주석이므로 UI에 옮기지 않았다.

전체 대조와 근거는 [운영 환경 분석](../reference/documents/manual-environment-analysis.md), [PDF 화면 분석](../reference/user-manual/screen-audit.md)을 참조한다.
