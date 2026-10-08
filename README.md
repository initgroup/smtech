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
| handoff/fragments/ | 19개 업무 화면의 정적 참고 산출물; 실제 이식 원본은 위 경로 |

시연을 확인하려면 Python 정적 서버로 prototype/을 제공하고 /region/rms/에 접속하세요. 업무용 application.html은 실제 bootstrap API 연결이 필요합니다. 실제 업무 화면에는 상단 시연 도구를 넣지 않습니다.

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
5. 개발자 ZIP은 downloads/releases/rms-developer-vX.Y.Z.zip에 누적 보관되고 downloads/smtech-source.zip은 최신 별칭입니다. 기존 버전 내용을 변경해서 덮어쓸 수 없습니다.
6. releases/history.json, RELEASES.md, records/에 버전별 기록을 남깁니다. 시연 도구의 배포내역 레이어는 이 누적 기록을 사용합니다.

## 내부 개발자 안내

ZIP 루트에 [먼저 읽는 이식 안내](docs/delivery/00_먼저읽기_개발자이식안내.md), 누적 배포내역, [변경분 적용 방법](docs/delivery/02_파일경로와변경분적용.md)을 제공합니다. 적용 경로는 ZIP의 web/이며 examples/docs/tools는 개발 참고 자료입니다. XML 샘플 4개는 시연에 보존하고 업무 리포트는 서버 receipts DTO를 연결합니다.

[UI 데이터 계약](docs/07-data-contract.md), [협업·배포 절차](docs/06-publisher-workflow.md), [개발자 이식 지침](docs/04-developer-handoff.md)을 참고하세요. full workspace 구형 ZIP과 내부 이식용 ZIP을 구분하세요. tools/archive_workspace.py와 legacy_publisher_delta.py는 구형 전체 프로젝트 참고 도구이며 현재 내부 전달에는 사용하지 않습니다.

## 실행 및 Git 배포

`start.ps1 -Check`로 환경을 점검하고 `start.ps1`로 화면을 빌드·실행합니다. `git-upload.ps1 -Check`는 읽기 전용 점검, `-PrepareOnly`는 Git을 변경하지 않는 배포본 생성입니다. 기본 실행은 전체 변경을 로컬 커밋하며 `-Push`를 지정해야 원격에 업로드합니다. 기존 remote 주소를 사용합니다. 공용 설정은 tools/project-config.json이며 자세한 명령과 영향 범위는 [Git 자동화 안내](docs/08-git-automation.md)를 확인하세요.
