# Q&A 작성·권한·웹에디터 이식 안내

2026-10-15 적용. 시안 1·2·3은 동일한 업무 JS와 템플릿을 사용합니다. 로그인 전후 모두 Q&A 글쓰기·수정·삭제, 댓글·답변 등록·수정·삭제를 이용할 수 있습니다. 실제 운영 인증은 서버 연결이 필요한 구조이며, 현재 시연의 역할 전환·localStorage는 운영 인증이 아닙니다.

## 구현 위치

| 기능 | 소스 |
|---|---|
| 작성·수정·삭제·비공개 확인 화면과 명령 연결 | `prototype/region/rms/static/js/rms-enhance/app.js` — qnaForm, qnaReplyForm, qnaDelete, eventSubmit |
| 무료 웹에디터 및 검사 미리보기 | `static/js/rms-enhance/ui/board-editor.js` — mount, read, preview |
| HTML 정제 → 개인정보 검사 → 안전한 공개 DTO | `static/js/rms-enhance/common/board-security.js` — prepare, publicQuestion, publicReply |
| 국내 개인정보 패턴 정규화·탐지·전체 마스킹 | `static/js/rms-enhance/common/privacy.js` — normalize, inspect, mask |
| 공개·메인·본인 접근 목록 | `static/js/rms-enhance/data/selectors.js` — publicQuestions, visibleQuestions, accessibleQuestions |
| 게시판 목록·상세 DTO | `static/js/rms-enhance/data/board-repository.js` |
| 시연 소유 확인·비회원 비밀번호·저장 | `demo/js/demo-store.js` — saveQuestion, removeQuestion, saveQuestionReply, removeQuestionReply, unlockQuestion |
| Q&A 서식 | `templates/dialogs/qna-*.html`, `templates/screens/qna-*.html`, `templates/screens/board-detail.html` |
| 개인정보 색상 강조·에디터 스타일 | `static/css/rms-qna.css` |
| 운영 API 명령 목록 | `contracts/commands.json` |
| 회귀 시험 | `tests/qna.test.cjs`, `tests/privacy.test.cjs`, `tests/dom.test.cjs` |

표의 상대 경로는 첫 번째 행과 동일한 `prototype/region/rms/` 아래입니다. 개발자 ZIP에서는 `web/` 아래로 이식합니다. tests는 프로젝트 루트입니다.

## 이용 흐름

1. Q&A 목록의 ‘글쓰기’에서 제목·업무유형·내용·공개여부를 지정합니다. 굵게·기울임·밑줄·취소선·제목·목록·인용·코드 서식을 사용할 수 있습니다.
2. ‘개인정보 검사·미리보기’는 실제 저장될 마스킹 결과를 표시합니다. 바로 저장해도 같은 검사를 수행합니다.
3. 비회원은 10~128자 비밀번호를 지정합니다. 글·댓글·답변마다 비밀번호를 확인하여 수정·삭제합니다. 회원 글은 본인 계정, 관리자는 관리 권한으로 처리합니다.
4. 비공개 글은 메인·공개 검색에서 제외합니다. 회원은 본인 목록에서, 비회원은 ‘비공개 글 찾기’에서 글 번호와 비밀번호를 확인한 후 조회·수정·삭제합니다. 역할 전환·새로고침 시 비회원 확인 상태는 해제됩니다.
5. 일반 답변과 담당자 답변을 구분합니다. 답변이 있으면 ‘답변완료’로 표시합니다. 메인 Q&A의 ‘최근 질문’·‘최근 답변완료’에서 공개·메인허용·개인정보 미검출 게시물만 최신순으로 표시합니다.
6. 개인정보가 한 번 검출된 글은 마스킹된 형태로 저장하면서 메인 노출을 제한합니다. 관리자 노출 체크도 비활성화합니다. 제목뿐 아니라 본문·기존 답변·댓글·새 답변의 검출 여부를 함께 반영합니다.

비회원 비공개 글 번호는 저장 직후 상세화면에 표시됩니다. 비밀번호 재설정·본인 확인을 통한 복구는 운영기관의 정책에 따라 서버에서 추가해야 합니다.

## 사용하는 JavaScript의 역할

| 구성요소 | 버전·라이선스 | 담당 범위 |
|---|---|---|
| Quill | 2.0.3, BSD-3-Clause | 무료 편집 UI. 개인정보 탐지나 서버 권한 검증을 제공하는 도구는 아닙니다. |
| DOMPurify | 3.4.16, Apache-2.0 또는 MPL-2.0 | HTML의 실행 가능한 태그·속성을 제거하는 XSS 방어. 개인정보를 찾는 도구는 아닙니다. |
| RMSPrivacy | 프로젝트 정책 모듈 1.2.0 | 국내 개인정보 의심 패턴을 정규화하고 이름·전화번호는 식별 부분을, 나머지 민감번호·주소는 전체값을 가립니다. 정부가 인증한 라이브러리라는 의미는 아닙니다. |
| Web Crypto API | 브라우저 표준 API | 시연용 비회원 비밀번호의 무작위 salt, PBKDF2/SHA-256 파생값을 생성합니다. |

공식 배포·라이선스는 [Quill 문서](https://quilljs.com/docs/), [Quill v2.0.3 소스](https://github.com/slab/quill/tree/v2.0.3), [DOMPurify v3.4.16](https://github.com/cure53/DOMPurify/tree/3.4.16)에서 확인했습니다. 2026-10-15 기준으로 Quill 공식 문서의 2.0.3과 DOMPurify 공식 최신 릴리스 3.4.16을 고정했습니다. CDN을 런타임에서 호출하지 않고 `static/vendor/`의 실제 파일을 사용합니다. 설치 패키지·SHA-256 목록은 `reference/vendor/`에 보관합니다.

## 마스킹·XSS 처리 예시

`연락처 010-1234-5678, 회신 qa@example.test`는 `연락처 010-****-****, 회신 ***@***.***`으로 변환됩니다. 테스트 번호와 이메일은 검증용 가상 값입니다.

HTML 입력은 DOMPurify로 p/br/strong/em/u/s/blockquote/ol/ul/li/h2/h3/pre/code 태그만 허용하고 모든 속성을 제거합니다. 링크·이미지·동영상·iframe·style·script·이벤트 속성은 저장하지 않습니다. 외부 URL이나 이미지에 실린 개인정보를 자동 검사한 것처럼 처리하지 않기 위한 구성입니다.

정제한 DOM의 텍스트를 태그 연결형과 문단 구분형으로 각각 검사합니다. 문단 구분형에서 마스킹한 뒤 줄바꿈을 합쳐 다시 검사하여 두 방식의 검출을 함께 보존합니다. 예를 들어 `<p>010</p><p>1234</p><p>5678</p>`과 별도 이메일 또는 이름 필드를 섞어도 검출된 내용이 복구되지 않습니다. 개인정보가 있으면 원문 서식 HTML을 버리고 마스킹된 텍스트를 HTML 이스케이프하여 저장합니다. 검출되지 않은 안전한 서식은 유지합니다.

목록·상세·검색·메인·댓글·답변 출력에서도 다시 검사합니다. 공개 DTO에는 id/title/body/bodyHtml/date/work/status/public/mainVisible/answeredAt/replies/ownerKind/canManage/검출여부 등 허용한 필드만 포함합니다. 작성자 성명·회사명·계정 ID·비밀번호 파생값·salt를 포함하지 않습니다. 작성자는 ‘회원’·‘비회원’·‘담당자’로만 표시합니다.

이름·주소를 문맥으로 유추해야 하는 자유서술, 이미지/OCR, 암호화 파일 등을 규칙식 검사만으로 완전히 분류할 수는 없습니다. 운영에서는 개인정보 입력 제한, 공개 승인, 신고·삭제, 기관의 접근권한·보존 정책을 함께 적용해야 합니다. 행안부·개인정보보호위원회 원문과 세부 범위는 [개인정보 보호 근거](09-privacy-protection.md)를 참고하세요.

## 운영 API 계약

| 명령 | payload | 성공 result |
|---|---|---|
| saveQuestion | {input:{id?, title, body, bodyHtml, work, public, password?, privacyDetected}} | 글 ID |
| removeQuestion | {id, password?} | null |
| saveQuestionReply | {questionId, input:{id?, kind:'comment' 또는 'answer', body, bodyHtml, password?, privacyDetected}} | 부모 글 ID |
| removeQuestionReply | {questionId, replyId, password?} | 부모 글 ID |
| unlockQuestion | {id, password?} | 확인한 글 ID |
| updateQuestion | {id, mainVisible} | null |

모든 성공 응답은 기존 계약의 권한에 맞는 전체 snapshot과 result를 반환합니다. `canManage`와 비공개 `canView`는 서버가 계산한 boolean입니다. 서버는 소유 확인을 완료한 private DTO만 포함하고, 다른 사용자의 비공개 원문이나 비밀번호 hash/salt를 응답에 넣지 않습니다. 운영 권한 판정은 클라이언트의 role·ownerKey·official·canManage·privacyDetected 값을 신뢰해서는 안 됩니다. 개인정보 검출 여부도 서버에서 재계산합니다.

`integration/config.js`에 기관 API route·CSRF·세션 연결을 설정해야 합니다. 서버의 저장 전 HTML 정제·PII 재검사 예시는 `reference/privacy/examples/server-policy.example.cjs`입니다. 이 예시는 DB·인증·전체 게시판 백엔드 구현물이 아닙니다.

시연 비밀번호는 16바이트 무작위 salt와 PBKDF2 SHA-256 600,000회, 256비트 파생값으로만 보관하며 평문은 기록하지 않습니다. 5회 실패 후 60초 제한은 현재 페이지 메모리 기준의 시연 제어입니다. 브라우저 localStorage를 수정할 수 있는 사용자를 방어하는 운영 인증으로 사용할 수 없습니다. 운영에서는 HTTPS, 서버 세션/비회원 토큰, 서버 비밀번호 검증, CSRF, 시도 제한·감사 기록, DB 트랜잭션을 구현해야 합니다. 게스트 비밀번호를 URL·응답·로그에 포함하지 마세요.

## 검증 범위

`node --test tests/qna.test.cjs`로 회원/비회원 글 CRUD, 권한 거절, 비공개 확인, 댓글/답변 CRUD, 비밀번호 파생값, 개인정보 저장 전 제거, 메인 제외를 검증합니다. jsdom이 있는 경우 실제 DOMPurify와 실제 Quill 로컬 번들을 실행해 태그분할 개인정보, XSS, 서식 유지, 마스킹 미리보기를 검증합니다. jsdom은 QA 전용이며 운영 브라우저에 배포하지 않습니다. 설치 명령은 `npm install --prefix tmp/qa --save-exact jsdom@26.1.0 --ignore-scripts`입니다.

이 검증은 실제 브라우저의 시각 렌더링이나 기관 서버의 보안 검수를 대신하지 않습니다.

## 클릭형 구현 예시

기본 시안에는 설명 패널을 삽입하지 않습니다. 공개 Q&A 합성 게시물 P002에서 `김○○`를 누르면 기술 설명이, 나머지 제목을 누르면 글 상세가 열립니다. 본문의 `010-****-****`·`***@***.***`도 같은 방식입니다. 보라색 밑줄은 마스킹된 값에만 적용하며 원문은 링크 속성·숨겨진 DOM에 넣지 않습니다. 실제 처리 모듈은 `static/js/rms-enhance/ui/privacy-display.js`, 레이어 템플릿은 `templates/shared/privacy-tooltip.html`입니다. 닫기·바깥 클릭·Esc로 설명만 닫으며 기존 글 상세를 유지합니다.

## 다양한 개인정보 합성 사례

16개 문의글에서 주요 8종 번호를 포함한 20개 항목을 다룬다. 교육생 명단, 서류 배송, 의료·가족 증빙, 여권·면허, 정산 계좌·카드, 근무·소득, 로그인 로그·위치정보를 각각 다른 상황으로 구성했다. 항목별 PDF 근거와 생성·재현 경로는 [개인정보 구현 문서](09-privacy-protection.md)의 마지막 절에 있다. 명시된 필드의 전체값 숨김은 문맥 전체를 인식하는 기능과 구분한다. 본문의 HTML 결합검사는 번호 패턴에 적용하고 개인정보 필드는 줄바꿈을 보존한 텍스트에서 검사한다.
