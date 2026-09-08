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

`local/` 폴더와 모든 하위 파일은 `.gitignore`로 제외합니다. 중첩된 `local` 폴더도 제외됩니다. `tmp/`, `node_modules/`, Python 캐시 및 로그도 제외합니다.

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

이미 추적 중인 `local` 파일은 디스크에 남겨 두고 Git 추적에서 제외합니다. 단, 과거 커밋에 포함된 파일까지 삭제하지는 않습니다. 현재 프로젝트는 Git 저장소가 없는 상태에서 준비했습니다.

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

변경사항은 같은 브라우저·주소의 `localStorage`에 저장됩니다. 상단 **JSON 저장 → JSON 불러오기**로 파일에 보관하고 복원할 수 있습니다. 원본 `data/seed.json`은 바뀌지 않습니다. 첨부파일은 **이름·크기만** 보관합니다. 고객 확인용 데이터만 사용하세요.

## 인계파일 다시 만들기

```powershell
node tools/package_handoff.cjs
node tests/core.test.cjs
```

인계할 HTML은 화면에서 쓰는 `views.js`와 동일한 템플릿으로 생성됩니다. 원본 `ui.css`, `uiCustom.css`를 수정하지 않습니다. 신규 CSS는 `.rms-enhance` 안에 한정되며 데모 외곽 스타일 `rms-demo-shell.css`는 운영 화면에 넣지 않습니다.

공개 서버의 Java/JSP 원본, DB 테이블, 인증 뒤 실제 DOM은 확보한 것으로 간주하지 않습니다. 상세 한계와 확인사항은 문서에 구분되어 있습니다.
