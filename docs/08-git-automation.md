# 실행·Git 배포 자동화

시연 실행과 Git 전달 절차는 tools/project-config.json의 공용 경로와 런타임 설정을 사용합니다. PowerShell 5.1+, Git, Node.js 20+가 필요합니다. Python은 현재 프로젝트의 3.6 환경을 포함해 호환되는 실행 파일을 .venv → PATH 순서로 찾습니다. 별도 실행 파일은 pythonCandidates에 절대 경로로 지정할 수 있습니다. 도구는 PC의 PATH·실행 정책·Git 전역 설정을 변경하지 않습니다.

## 실행 명령

~~~powershell
# 실행 도구와 설정만 점검. 파일 생성·서버 실행 없음
.\start.ps1 -Check

# 최신 화면을 빌드하고 로컬 시연 서버 실행
.\start.ps1
.\start.ps1 -Port 8090

# 이미 빌드한 화면만 제공
.\start.ps1 -NoBuild
~~~

서버는 127.0.0.1에만 열며 기본 주소는 http://127.0.0.1:8080/region/rms/ 입니다. Ctrl+C로 종료합니다. 이미 해당 포트를 쓰고 있으면 다른 -Port를 지정합니다. 어느 폴더에서 스크립트를 호출해도 프로젝트 루트를 기준으로 실행합니다.

## Git 배포 명령과 영향 범위

| 명령 | 생성/수정 | Git index/commit | 원격 변경 |
|---|---|---|---|
| git-upload.ps1 -Check | 없음 | 조회만 | 조회만, 네트워크 없음 |
| git-upload.ps1 -PrepareOnly | 빌드·버전·ZIP·배포이력 | 변경 없음 | 없음 |
| git-upload.ps1 | 위 배포본 + 전체 변경 stage | 로컬 commit | 없음 |
| git-upload.ps1 -Push | 위와 동일 | 로컬 commit | 설정된 원격에 일반 push |

~~~powershell
.\git-upload.ps1 -Check
.\git-upload.ps1 -PrepareOnly
.\git-upload.ps1 -Message "메인 게시판 개선"
.\git-upload.ps1 -Push

# 원격이 아직 없는 최초 push에만 주소를 지정
.\git-upload.ps1 -Push -RemoteUrl "내 저장소 주소"
# 다른 remote 이름 사용
.\git-upload.ps1 -Push -Remote upstream
~~~

기존 remote URL을 기본으로 사용합니다. 스크립트에 특정 GitHub 주소를 고정하지 않습니다. 이미 있는 주소와 -RemoteUrl 값이 다르면 중단하며 자동 변경하지 않습니다. 새 remote는 -Push를 실행할 때만 추가합니다. 자동 pull·rebase·stash·force push는 수행하지 않습니다. 원격이 앞서 있어 push가 거부되면 개발자가 변경을 검토·병합한 뒤 재실행합니다.

일반 실행은 **프로젝트 전체의 추가·수정·삭제를 stage하고 커밋**합니다. 선택 커밋이 필요하면 일반 실행 대신 Git을 직접 사용하세요. 배포 ZIP을 커밋할 때에는 그 ZIP에 대응하는 소스도 같은 커밋에 포함해야 검증을 통과합니다. 충돌·진행 중인 merge/rebase·detached HEAD·상위 저장소 내부의 잘못된 작업 경로는 빌드 전에 차단합니다. 기존 Git 저장소가 없으면 먼저 git init 또는 clone을 수행합니다.

## 제외 규칙과 무결성

.gitignore는 가상환경·의존성·임시 검사·로그·로컬 배포 복사본·개인 설정·.env를 제외합니다. 공유용 .env.example은 허용합니다. 과거에 이미 추적된 제외 파일도 일반 업로드에서 Git index에서만 제거하며 실제 작업 파일은 보존합니다. -Check는 개수만 알리고 -PrepareOnly는 index를 건드리지 않습니다.

공개 다운로드의 최신 ZIP, 버전별 ZIP·해시 파일, releases/ 이력, 생성된 런타임 템플릿은 Git에 포함합니다. 내부 개발자에게 제공하는 ZIP에는 기존처럼 업무 화면만 들어가며 시연 도구·SFR 소스는 제외됩니다. deliverables/는 로컬 전달용 복사본이므로 Git에서 제외합니다.

빌드 → 버전 ZIP 생성 → 현재 제외 규칙 반영 → 전체 stage → staged 소스/ZIP/과거 버전 검증 → commit → 동일 commit 재검증 → 선택적 push 순서로 처리합니다. 저장소에서 동시에 두 업로드가 실행되는 것도 방지합니다. Git hook이 staged 내용을 바꿔 ZIP과 달라져도 commit 검증에서 push를 중단합니다.

Git에 선언된 LF 정규화를 패키징에도 반영하고 원본 바이너리·CP949 샘플은 보존합니다. Windows의 기존 CRLF 해시 파일도 검증할 수 있습니다. 같은 소스 반복 실행은 버전과 ZIP을 유지합니다. Python 캐시나 제외된 개인 파일로 버전이 불필요하게 증가하지 않습니다.

## 이후 구조 변경 시

- 파일 추가·수정·삭제는 기존 소스 루트 안에서는 자동 수집됩니다. 업로드 스크립트에 파일명을 추가하지 않습니다.
- 실제 업무 소스 루트를 이동하면 tools/project-config.json의 webRoot/경로와 releases/developer-package.json의 허용 목록·watch를 함께 변경합니다. 빌드 도구는 project.cjs에서 공용 경로를 읽습니다.
- 공용 경로의 디렉터리 구조 자체를 바꾸면 해당 화면 자산 경로와 테스트 픽스처도 조정합니다. 설정 변경만으로 임의의 소스 구조를 자동 변환하지 않습니다.
- 새 로컬/개인 파일 규칙은 .gitignore에 추가합니다. 자동화가 .gitignore를 실행 중 임의로 고치지 않습니다.
- 배포 전 releases/next.json에 변경 제목과 이식 주의사항을 적고 관련 테스트를 실행합니다. 버전 ZIP과 SHA-256 목록은 그대로 보관합니다.

임시 저장소의 로컬 bare remote로 실제 PowerShell 실행·commit·push·재실행·새 파일·제외 파일 보존·CRLF·누락된 해시 파일 차단을 검증했습니다. 실제 프로젝트 저장소의 stage/commit/push는 이번 점검에서 실행하지 않았습니다.

## Git 속성 변경 후 원본 파일 불일치 방지

원본 CSS·폰트 스타일 등은 `-text -eol`로 원래 바이트를 보존합니다. 속성 규칙을 변경해도 Git이 기존 파일의 stat 캐시를 유지할 수 있으므로 업로드에서는 `git add --renormalize -- .` 후 `git add --all -- .`을 실행합니다. 원본 파일 내용을 수정하는 동작이 아니라 현재 속성 규칙으로 index를 다시 계산하는 단계입니다. ZIP 검증이 실패하면 차이가 나는 파일 경로도 함께 출력합니다.
