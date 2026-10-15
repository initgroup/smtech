# 환경 재현 안내

확인 환경: Node.js 24.12.0, Python 3.6.10, Windows PowerShell 5.1 이상. 빌드는 Node/Python 기본 모듈을 사용합니다. 기존 최소 버전은 tools/project-config.json을 확인하세요. 운영 서버/DB는 이 저장소에 포함되지 않습니다.

1. 프로젝트 전체를 복사하고 Node.js 20 이상 및 Python 3를 설치합니다. 운영용 인터프리터는 기관이 지원하는 보안 업데이트 버전을 사용합니다.
2. `start.ps1 -Check`로 경로와 환경을 확인합니다. 스크립트는 호출 폴더가 아닌 자신의 위치를 기준으로 동작합니다.
3. `node tools/build.cjs`로 업무/시연 산출물을 생성합니다.
4. `start.ps1`로 실행, `stop.ps1`로 종료, `restart.ps1`로 재시작합니다. 기본 포트 8080이며 각 명령에 `-Port`를 지정할 수 있습니다.
5. 외부 에디터/정화 라이브러리는 `reference/vendor/`에 출처·버전·라이선스·원본 패키지가 있으며 실행본은 `prototype/region/rms/static/vendor/`에 있습니다. 실행 시 CDN 연결은 필요하지 않습니다.
6. DOM 테스트 전용 linkedom 설치: `npm.cmd install --prefix tmp/qa --cache tmp/npm-cache --no-package-lock --ignore-scripts --no-audit --no-fund linkedom@0.18.12`. 업무 배포에는 필요하지 않습니다.
7. `node --test tests/*.test.cjs`와 `python -m unittest discover -s tests -p "*_test.py"`를 실행합니다.
8. `python tools/package_source.py`로 공통 및 시안 1·2·3의 ZIP을 만듭니다. 과거 버전은 보존됩니다.

공식 지침 원문과 수집일·해시는 `reference/privacy/`에서 확인합니다. 서버 통합 요구와 개인정보 보호 한계는 `docs/09-privacy-protection.md`를 확인하세요.

Q&A 보안·실제 에디터 DOM 검증에는 `jsdom@26.1.0`도 사용합니다. 다음 명령은 시험 전용 의존성만 `tmp/qa`에 설치하며 배포 웹에는 포함하지 않습니다.

```powershell
npm.cmd install --prefix tmp/qa --cache tmp/npm-cache --no-package-lock --ignore-scripts --no-audit --no-fund linkedom@0.18.12 jsdom@26.1.0
```

실제 브라우저 렌더링 검수와 jsdom 기반 기능 검사는 다릅니다. 이번 환경에는 연결된 브라우저가 없어 실제 브라우저 시각검수는 수행하지 못했습니다.
