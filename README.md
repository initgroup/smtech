# RMS 퍼블리싱·내부 개발 협업 소스

업무 HTML, 디자인 CSS, 화면 JS, 데이터 연결 어댑터를 나눠 관리합니다. 내부 개발자에게 전달하는 ZIP은 업무 소스만 포함합니다. 시연 도구와 SFR 전용 HTML·CSS·JS는 prototype/region/rms/demo/에 있으며 개발자 ZIP에서 파일 단위로 제외됩니다.

## 두 진입점

| 경로 | 용도 |
|---|---|
| prototype/region/rms/index.html | 퍼블리셔 시연: 업무 화면 + demo/ 도구를 조립한 생성 파일 |
| prototype/region/rms/application.html | 실제 업무 화면 뼈대; ZIP의 web/index.html로 전달 |
| prototype/region/rms/demo/ | 상단 도구, SFR, 시연 안내, 배포내역 팝업, 가상 저장소·역할·샘플 |
| prototype/region/rms/templates/ | 편집 가능한 업무 HTML 템플릿 |
| prototype/region/rms/static/css/ | 업무 디자인·반응형 배치 |
| prototype/region/rms/static/js/rms-enhance/ | common/data/adapters/presenters/ui/app 모듈 |
| prototype/region/rms/integration/ | 내부 개발자 전용 서버 연결 설정 |
| handoff/fragments/ | 20개 업무 화면의 정적 참고 산출물; 실제 이식 원본은 위 경로 |

시연을 확인하려면 Python 정적 서버로 prototype/을 제공하고 /region/rms/에 접속하세요. 업무용 application.html은 실제 bootstrap API 연결이 필요합니다. 실제 업무 화면에는 상단 시연 도구를 넣지 않습니다.

시연용 메인 시안은 상단 선택 도구 또는 #home(청색 업무 목록형), #home/2(청록 작업공간형), #home/3(남색 업무 대시보드형)에서 확인합니다. 공고·신청·게시판 데이터는 공유하며, 버튼·아이콘·블릿·배경·팝업과 업무 배치는 각 시안에 맞게 적용합니다. 로그인 전에는 상단 대메뉴를 숨깁니다.

업무용 ZIP은 시안 1·2·3별로 내려받으며, 각 ZIP의 rms-selected-design.css에 해당 시안이 기본 적용됩니다. 세 ZIP은 동일 HTML·JS와 교체용 CSS 3종을 제공합니다. 공통 소스를 한 번 이식한 뒤 web/static/css/themes/rms-design1.css~rms-design3.css 중 원하는 파일로 web/static/css/rms-selected-design.css만 교체하면 시안이 적용됩니다. 공통 smtech-source.zip의 기본값은 시안 1이며, 상세 절차는 docs/delivery/02_파일경로와변경분적용.md에 있습니다.

## 수정·빌드·전달

~~~powershell
node tools/build.cjs
node --test tests/*.test.cjs
python -m unittest discover -s tests -p "*_test.py"
python tools/package_source.py
~~~

1. UI 구조는 templates/, 디자인은 static/css/, 화면 조합은 presenters/, 이벤트는 app.js, 공용 동작은 common/에서 수정합니다. HTML 인라인 style·이벤트를 추가하지 않습니다.
2. API·인증·CSRF·DTO 변환은 integration 소유 파일과 서버에서 구현합니다. 내부 소스를 후속 퍼블리싱 ZIP으로 덮어쓰지 않습니다.
3. releases/next.json에 이번 변경 설명과 이식 주의사항을 입력합니다. 빌드와 테스트가 통과한 다음 package_source.py를 실행합니다.
4. 소스가 변경되면 버전이 자동 증가하고 같은 소스 재빌드는 동일 버전/바이트를 유지합니다. 최초 업무 분리 배포는 v1.1.0입니다. --version X.Y.Z로 명시 버전도 지정할 수 있습니다.
5. 개발자 ZIP은 downloads/releases/rms-developer-vX.Y.Z.zip에 누적 보관되고 downloads/smtech-source.zip은 최신 별칭입니다. 시안별 최신 파일은 downloads/smtech-source-design1.zip, smtech-source-design2.zip, smtech-source-design3.zip이며, 버전별 -design1·2·3.zip과 SHA-256도 함께 보관합니다. 기존 버전 내용을 변경해서 덮어쓸 수 없습니다.
6. releases/history.json, RELEASES.md, records/에 버전별 기록을 남깁니다. 시연 도구의 배포내역 레이어는 이 누적 기록을 사용합니다.

## 내부 개발자 안내

ZIP 루트에 [먼저 읽는 이식 안내](docs/delivery/00_먼저읽기_개발자이식안내.md), 누적 배포내역, [변경분 적용 방법](docs/delivery/02_파일경로와변경분적용.md)을 제공합니다. 적용 경로는 ZIP의 web/이며 examples/docs/tools는 개발 참고 자료입니다. XML 샘플 4개는 시연에 보존하고 업무 리포트는 서버 receipts DTO를 연결합니다.

[UI 데이터 계약](docs/07-data-contract.md), [협업·배포 절차](docs/06-publisher-workflow.md), [개발자 이식 지침](docs/04-developer-handoff.md)을 참고하세요. full workspace 구형 ZIP과 내부 이식용 ZIP을 구분하세요. tools/archive_workspace.py와 legacy_publisher_delta.py는 구형 전체 프로젝트 참고 도구이며 현재 내부 전달에는 사용하지 않습니다.

## 실행 및 Git 배포

`start.ps1 -Check`로 환경을 점검하고 `start.ps1`로 화면을 빌드·실행합니다. `git-upload.ps1 -Check`는 읽기 전용 점검, `-PrepareOnly`는 Git을 변경하지 않는 배포본 생성입니다. 기본 실행은 전체 변경을 로컬 커밋하며 `-Push`를 지정해야 원격에 업로드합니다. 기존 remote 주소를 사용합니다. 공용 설정은 tools/project-config.json이며 자세한 명령과 영향 범위는 [Git 자동화 안내](docs/08-git-automation.md)를 확인하세요.

# 서비스 실행
.\start.ps1

# git 배포
.\git-upload.ps1 -Push
## Q&A · 개인정보 보호 · 요구사항 추적

로그인 전후 Q&A 작성·수정·삭제, 댓글·답변과 무료 Quill 웹에디터를 제공합니다. 게시물의 제목·본문·댓글·답변에는 개인정보 패턴 마스킹과 DOMPurify HTML 정화를 적용합니다. 비회원 작성자 확인은 시연용이며 운영 서비스에서는 서버 인증·권한·CSRF·요청 제한을 구현해야 합니다.

- 구현·근거·예제·JS 위치: [개인정보 보호 적용 설명](docs/09-privacy-protection.md)
- 전체 SFR 세부 관리번호·구현상태: [구현 매핑](docs/sfr-implementation.json). 화면의 SFR 레이어에서 항목별 위치와 근거를 확인합니다.
- 공식 원문·출처·SHA-256: `reference/privacy/`. 시연 화면 다운로드 사본은 `prototype/region/rms/downloads/privacy/`입니다.
- 외부 패키지·라이선스·버전 고정 자료: `reference/vendor/`. 에디터와 정화 라이브러리는 CDN 없이 로컬 로드합니다.
- 다른 PC 환경 구성: [설치·실행 안내](reference/environment/README.md).

`start.ps1`, `stop.ps1`, `restart.ps1`은 다른 작업 폴더에서 호출해도 자신의 프로젝트를 대상으로 동작합니다. 기본 포트는 8080이며 `-Port`로 변경합니다. 세 시안의 업무 JS는 공통이므로 같은 기능과 보안 정책을 적용합니다. 개발자 ZIP의 `reference/` 자료는 참고용이며 웹 루트 전체에 공개하지 않습니다.

Q&A 명령·권한·웹에디터 이식 상세는 [이식 안내](docs/11-qna-editor-security.md), 화면 확인 순서는 [변경·검증 보고](docs/10-qna-change-report.md)를 참고하세요.

시안 1의 사업공고 보기에서 **기본형은 독립된 카드 그리드**, **목록형은 가로 행**으로 표시합니다. 기본형은 화면 폭에 따라 3열·2열·1열로 전환됩니다.

마스킹 구현 예시는 Q&A의 `김○○`·`010-****-****`처럼 실제 표시된 값을 보라색 밑줄로 표시합니다. 해당 값 클릭 시 적용 기술·JS·근거를 작은 레이어에서 확인합니다. 미리보기 본문에는 기능 관리번호 설명 패널을 삽입하지 않습니다.

모든 시안의 실제 업무 영역(폼·목록·상세 팝업·마스킹 툴팁 포함)에는 SFR 번호나 요구사항 설명·상태·강조 표시를 넣지 않습니다. SFR은 상단 시연 도구와 전용 요구사항 확인 화면·레이어에서 관리합니다.

개인정보 시연은 공식 안내서의 분류·노출 경로를 재구성한 합성 문의글 16개·20개 항목으로 구성합니다. 원문 시험자료는 `reference/privacy/examples/board-scenarios.json`에 두고 실제 필터를 거친 마스킹 결과만 브라우저에 배포합니다. 항목별 설명·PDF 근거는 마스킹 부분을 클릭해 확인하며 사례 목록은 `docs/09-privacy-protection.md`에 있습니다.

Git 배포는 `git add --all`로 삭제·변경·신규 파일을 먼저 반영한 뒤 `git add --renormalize`로 현재 속성을 적용합니다. 생성 과정에서 제거된 템플릿이 있어도 배포가 중단되지 않으며 원본 정적 파일의 바이트 보존과 스테이징된 압축소스 검증은 유지합니다.

게시판·FAQ의 검색 폼은 시안 1·2·3 모두 라벨을 컨트롤 위에 배치하고, 선택 상자·검색 입력·버튼의 높이와 하단 기준선을 통일합니다. 작은 화면에서는 필드 단위로 줄바꿈합니다. 공통 템플릿과 `static/css/rms-home-refresh.css`를 원본으로 관리합니다.
