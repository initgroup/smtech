# RMS 기능개선 사전 개발

제안요청서, 운영매뉴얼 HWP, 지원기업 사용자매뉴얼 PDF와 실제 공개 사이트 HTML·CSS·JS를 분석한 **로컬 시연용 프로토타입**입니다. 모든 시연 기업·전문가·공고·실적은 가상 데이터입니다.

## 실행

Codex 또는 Visual Studio Code에서 이 폴더를 연 뒤 PowerShell 터미널에서 실행합니다.

```powershell
cd D:\work\smtech
python -m venv .venv # 처음 한 번만 생성
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. .\.venv\Scripts\Activate.ps1
python tools/serve.py
```

브라우저: **http://127.0.0.1:8080/region/rms/**

VS Code에서 새 PowerShell 터미널을 열면 `.venv`가 자동 활성화됩니다. 기존 터미널은 위 활성화 명령을 실행하세요. `.venv/`는 Git에서 제외되므로 새로 내려받은 환경에서는 먼저 생성해야 합니다. `start.ps1`과 VS Code 실행 작업도 `.venv`의 Python을 사용합니다.

- 또는 VS Code의 **터미널 → 작업 실행 → RMS: 프로토타입 실행**을 이용하세요. PowerShell 실행 정책 변경은 필요 없습니다.
- 다른 포트: `python tools/serve.py --port 8081`
- 종료: 실행한 터미널에서 `Ctrl+C`.
- Python은 정적 파일 제공에만 사용합니다. DB·백엔드·실서비스 API 연결이 없습니다.
- 기존 Anaconda Python 3.6에서도 서버를 실행할 수 있도록 구성했습니다. 신규 패키지 설치 없이 시연할 수 있습니다.
- HTML을 파일로 직접 열면 JSON을 읽지 못하므로 반드시 위 로컬 주소를 사용하세요.

## Git 저장 및 업로드

`local/` 폴더와 모든 하위 파일은 `.gitignore`로 제외합니다. 중첩된 `local` 폴더도 제외됩니다. 루트의 `deliverables/`는 재생성 가능한 인계용 ZIP 보관 폴더로, Git 및 Render 배포에 필요하지 않아 제외합니다. `tmp/`, `node_modules/`, Python 캐시 및 로그도 제외합니다.

먼저 Git 커밋 작성자 정보가 없다면 본인 정보로 설정하세요.

```powershell
git config --global user.name "본인 이름"
git config --global user.email "본인 이메일"
```

프로젝트 루트에서 로컬 커밋만 만들기:

```powershell
.\git-upload.ps1
```

기본 원격 저장소는 `https://github.com/initgroup/smtech.git`입니다. 최초 업로드:

```powershell
.\git-upload.ps1 -Push
```

이후 변경사항 업로드:

```powershell
.\git-upload.ps1 -Push
```

커밋 메시지는 프로젝트 폴더명과 PC의 오늘 날짜를 사용해 `smtech-20260908-001` 형태로 자동 생성합니다. 로컬에 있는 모든 브랜치 및 원격 추적 이력에서 같은 날의 최대 순번에 1을 더하며, 날짜가 바뀌면 `001`부터 시작합니다. 변경사항이 없으면 새 커밋이나 순번을 만들지 않습니다. 직접 메시지를 지정하려면 `-Message "변경 내용"`을 추가하세요. 다른 PC의 아직 가져오지 않은 커밋은 순번 계산에 포함되지 않습니다.

스크립트는 필요하면 `main` 브랜치로 Git 저장소를 초기화하고, 제외 규칙에 해당하지 않는 모든 변경사항을 커밋합니다. `-Push`가 있을 때만 현재 브랜치를 `origin`으로 업로드하며, 원격 인증은 Git에서 진행합니다. 실행 정책으로 차단되면 `powershell -NoProfile -ExecutionPolicy Bypass -File .\git-upload.ps1 -Push`를 사용하세요. 실행 정책 우회는 해당 PowerShell 프로세스에만 적용됩니다.

이미 추적 중인 `local` 및 `deliverables` 파일은 디스크에 남겨 두고 Git 추적에서 제외합니다. 단, 과거 커밋에 포함된 파일까지 삭제하지는 않습니다.

## 우선 읽을 문서

1. [업무 목표와 요구사항](docs/01-business-requirements.md)
2. [실제 소스와 매뉴얼 대조](docs/02-source-and-environment.md)
3. [화면·데이터 설계와 시연 순서](docs/03-prototype-guide.md)
4. [개발자 인계와 통합 방법](docs/04-developer-handoff.md)
5. [검증 결과와 남은 확인사항](docs/05-validation.md)

세부 근거: [전체 요구사항 색인](reference/documents/requirements-index.md), [공개 소스 분석](reference/public-site/source-audit.md), [PDF 화면 분석](reference/user-manual/screen-audit.md).

## 폴더

| 위치 | 내용 |
|---|---|
| 원본 HWP 2개, PDF 1개 | 수정 없이 보존한 제공자료 |
| `reference/documents/` | HWP 추출·분석, 상세 요구사항 71개 |
| `reference/public-site/` | 공개 원본 91개, URL·SHA256·상태 manifest |
| `reference/user-manual/` | PDF 77쪽 텍스트, 주요 캡처 60개, 화면 분석 |
| `prototype/region/rms/` | 바로 실행하는 HTML·CSS·JS, 가상 JSON |
| `handoff/` | 신규 스타일/JS와 동일 템플릿에서 생성한 화면별 HTML 조각 |
| `tools/` | 로컬 서버, 자료 추출·수집, 인계파일 생성 |
| `tests/` | 핵심 업무 규칙 및 화면 동작 검사 |

## 데이터 보관

각 화면의 저장·제출·조회로 확정한 변경사항은 같은 브라우저·주소의 `localStorage`에서 **`smtech.rms.prototype.v1`** 키에 보관합니다. 기존 `rms.prototype.v1`의 유효한 시연 자료는 새 키로 자동 이관하며, 다른 앱의 저장 데이터는 변경하지 않습니다.

매번 JSON 파일을 만들 필요는 없습니다. 작업 후 **시연내용 JSON 내보내기**를 누르면 지원 브라우저에서 저장 창이 열려 폴더와 파일명을 선택할 수 있습니다. 기본 파일명은 `smtech-시연내용.json`입니다. HTTPS 또는 localhost에서 지원하는 브라우저 기능을 사용하며, 미지원·차단 환경은 안내 후 일반 다운로드를 제공합니다. 이때 브라우저의 ‘저장할 위치를 매번 확인’ 설정으로 위치를 선택하거나 `Ctrl+J` → **폴더에 표시**로 다운로드 위치를 확인하세요. 실제 전체 경로를 페이지가 읽거나 탐색기 폴더를 직접 여는 기능은 아닙니다.

다른 PC에서 같은 버전의 사이트를 열고 **JSON 불러오기 → 불러오기 확인**을 누르면 저장된 전체 자료, 처리이력, 선택한 시연 역할·화면·검색조건·비교 선택이 복원됩니다. 새 백업은 `format: smtech-demo`, `version: 1` 형식이며 예전 데이터 전용 JSON도 불러올 수 있습니다. 실제 로그인 권한을 옮기지 않으며 새로고침하면 역할은 로그인 전으로 돌아가지만 저장된 데이터는 유지됩니다.

불러오기는 **전체 교체**입니다. JSON 자체에 기초자료와 내보낼 당시의 추가·수정 내용이 들어 있으므로 기존 PC 자료를 합치지 않습니다. 예를 들어 이 PC에만 있던 게시글이 가져온 파일에 없으면 제거됩니다. 게시글·FAQ·신청서·분류·설정·처리이력 모두 같은 방식입니다. 파일의 빈 목록도 그대로 적용하며 삭제했던 기초 항목을 임의로 되살리지 않습니다. 부분 JSON은 지원하지 않으며, 파일 검증이나 저장에 실패하면 기존 자료를 유지합니다.

입력만 하고 저장하지 않은 값과 열린 팝업은 백업하지 않습니다. 접수 증빙 첨부파일은 **이름·크기만** 보관하므로 실제 증빙파일은 별도로 전달해야 합니다. 사업공고의 시연용 텍스트 첨부파일은 **본문까지** JSON에 보관하여 다른 PC에서도 내려받을 수 있습니다. **가상 기초자료로 되돌리기**는 확인 후 현재 브라우저의 시연 자료를 초기화합니다. 원본 `data/seed.json`과 다른 앱의 저장 데이터는 바뀌지 않습니다.

## 사업공고 상세정보와 시연 도구

맨 위의 보라색 영역에 기능개선 시연 설명, 사용자 역할, JSON 내보내기·불러오기, 초기화, 소스 다운로드, 현재 화면 SFR 표시를 모았습니다. 실제 업무 헤더와 콘텐츠는 그 아래에서 시작합니다.

공고 카드와 사업 선택 단계에 **접수기간**과 **마감일·시간**을 표시합니다. 상세보기에는 과제·공고 정보, 지원프로그램·지원금, 사업개요·지원대상·신청방법, 담당자, 첨부파일을 표시하며 제목을 드래그하거나 포커스 후 방향키를 눌러 이동할 수 있습니다. 긴 내용은 팝업 내부에서 스크롤하고 모바일의 넓은 표는 표 안에서 좌우로 스크롤합니다.

**시스템 관리자** 역할에서 공고 상세의 **공고내용 수정**, 메인의 **사업공고 등록**으로 내용을 편집하고 저장합니다. 지원프로그램·본문 구역·담당자·첨부는 행을 추가하거나 삭제할 수 있습니다. 공고 첨부는 JSON 이동 시 내용을 그대로 보존하기 위한 `.txt` 시연자료이며 실제 PDF/HWP 원본은 아닙니다.

기초자료 `data/seed.json`의 `programs`에 상세항목을 보관하며 `tools/make_seed.py`로 재생성할 수 있습니다. 기존 저장자료와 예전 JSON에서 빠진 공고 상세항목은 자동으로 보완합니다. 이미 저장한 값과 명시한 빈 목록은 보존하며, JSON 불러오기 시 적용 대상 PC의 공고나 게시글을 합치지 않습니다.

## 개발자 소스 다운로드

상단 **JSON 불러오기** 오른쪽의 파란색 **소스 다운로드 · ZIP** 버튼으로 `smtech-source.zip`을 내려받습니다. 업로드 시 HTML·JS·CSS뿐 아니라 문서·검증 도구·참고자료 등 **해당 커밋에 들어가는 전체 파일**을 포함합니다. ZIP 자체와 `.git` 이력은 제외하고, 파일별 Git 객체 ID·SHA-256을 기록한 `_smtech_source_manifest.json`을 추가합니다. 브라우저 시연내용은 소스에 없으므로 필요한 경우 JSON 백업을 별도로 전달하세요.

공개 다운로드 파일은 `prototype/region/rms/downloads/smtech-source.zip`입니다. `/deliverables/`의 내부 인계 ZIP과는 별개이며, Render에서 버튼이 동작하도록 이 공개 ZIP은 Git에 포함합니다. `.\git-upload.ps1 -Push`는 소스를 스테이징한 뒤 **Git에 실제 저장되는 바이트**로 ZIP을 만들고, ZIP을 스테이징해 일치 검증 후 커밋합니다. 커밋된 소스와 ZIP을 다시 검증한 뒤 push하므로 줄바꿈 변환도 반영됩니다. 다르면 업로드를 중단합니다. `local/`, `deliverables/`, `.venv/` 등의 제외 파일이 추적 중이면 패키징을 중단합니다.

`python tools/package_source.py`는 아직 커밋하지 않은 수정까지 포함하는 로컬 미리보기 ZIP을 만듭니다. 매니페스트에 `working-tree-preview`로 표시되며, 업로드 명령이 이를 `git` 기준 ZIP으로 교체합니다. 커밋 후 확인 명령은 `python tools/package_source.py --verify-ref HEAD`입니다. Render에서는 이 스크립트로 업로드한 동일 브랜치를 배포하세요.

## 요구사항 확인

시연 안내에는 제안요청서 SFR-01~15의 정의·세부내용 전체와 시연 반영 내용·실서비스 후속 구현을 표로 표시합니다. 사이트 맨 위의 별도 시연 도구 영역에 표시된 현재 화면의 SFR 번호를 선택하면 **현재 화면 위에 비교용 레이어**가 열립니다. 제목 드래그로 이동하고 오른쪽·아래쪽·모서리를 드래그해 가로·세로 크기를 조절합니다. 긴 내용은 레이어 안에서 스크롤하며 뒤의 화면도 조작할 수 있습니다. 이동·크기 조절 손잡이에 키보드 포커스를 두고 방향키를 사용할 수 있고, 레이어 안에서 Esc로 닫습니다.

표 오른쪽 셀과 SFR 비교 레이어에는 **구현된 메뉴 바로가기**, **디자인 컨셉**, **화면 구성·사용 흐름**, **적용 기술·동작**, **데이터 처리·저장 구조**, **실서비스 구현 계획**을 표시합니다. 글머리표가 있는 메뉴 경로를 누르면 해당 화면으로 이동합니다. 현재 역할의 권한이 부족하면 허용된 역할만 표시하는 로그인 팝업이 열리고, 역할 선택 후 원래 요청한 화면으로 이동합니다. 취소하면 화면·역할을 유지합니다. 레이어의 기본 너비는 900px이며 작은 화면에서는 화면 안에 맞춰 줄어듭니다.

원문 출처는 `reference/documents/requirements-catalog.json`, 반영 요약은 `docs/01-business-requirements.md`, 상세 설명·구현 계획·메뉴와 역할 연결은 [docs/sfr-implementation.json](docs/sfr-implementation.json)에서 관리합니다. 상세 설명은 확인된 현재 구현과 향후 구현 방안을 구분하며 백엔드·DB 작업이 완료되었다는 의미가 아닙니다. 내용을 수정한 뒤 `node tools/sync_sfr.cjs`로 화면 자료를 갱신하세요. `node tools/package_handoff.cjs`도 이 갱신을 수행하고 시연 안내를 포함한 인계파일을 생성합니다.

## 인계파일 다시 만들기

```powershell
node tools/package_handoff.cjs
node tests/core.test.cjs
```

인계할 HTML은 화면에서 쓰는 `views.js`와 동일한 템플릿으로 생성됩니다. 원본 `ui.css`, `uiCustom.css`를 수정하지 않습니다. 신규 CSS는 `.rms-enhance` 안에 한정되며 데모 외곽 스타일 `rms-demo-shell.css`는 운영 화면에 넣지 않습니다.

공개 서버의 Java/JSP 원본, DB 테이블, 인증 뒤 실제 DOM은 확보한 것으로 간주하지 않습니다. 상세 한계와 확인사항은 문서에 구분되어 있습니다.
