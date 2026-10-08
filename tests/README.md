# 검증 실행

먼저 생성물을 갱신한 뒤 검증합니다. 런타임/빌드는 Node·Python 기본 기능을 사용합니다.

~~~powershell
node tools/build.cjs
node --test tests/*.test.cjs
python -m unittest discover -s tests -p "*_test.py"
~~~

DOM 검사의 linkedom은 tmp/qa에만 설치하며 내부 ZIP에 포함하지 않습니다. 설치가 필요하면 다음 명령을 사용합니다.

~~~powershell
npm.cmd install --prefix tmp/qa --cache tmp/npm-cache --no-package-lock --ignore-scripts --no-audit --no-fund linkedom@0.18.12
~~~

현재 Node 93개 + Python 20개 = 113개 검증을 통과했습니다. 업무 전용 application.html은 시연 JS 없이 서버 스냅샷으로 테스트하고, index.html은 demo/ 도구를 포함해 별도로 테스트합니다. linkedom의 window 전역은 테스트별로 격리하여 시연 플러그인이 업무 테스트에 남지 않게 합니다.

source_package_test.py는 실제 허용 목록과 ZIP 자산 연결을 확인하고, 임시 소스로 동일 버전 재현성·변경 시 버전 증가·시연만 변경된 배포·과거 ZIP 불변·시연 누출 거부를 검사합니다. 임시 Git index에서 staged 파일만 검증하고 미배포 변경을 거부합니다. 실제 프로젝트의 commit/push는 실행하지 않습니다.

delivery_delta_test.py는 내부 수정 충돌, integration 보호, HTML 수동 병합, 삭제 지시, 검사 전후 내부 파일 바이트 불변과 경로·해시 오류를 검사합니다. publisher_package_test.py는 보존한 구형 legacy_publisher_delta.py의 회귀 검사입니다. 현행 배포는 package_source.py 및 tools/delivery/delivery_delta.py를 사용합니다.

최종 배포는 검증 후 python tools/package_delivery.py로 생성합니다. ZIP 해시/CRC·시연 누출·파일 목록은 패키징 시 검사합니다. 실제 브라우저 시각 검수 및 WAS·DB·기관 API 통합은 별도 확인이 필요합니다. 초기 review-core-behavior/findings 기록은 현재 통과 결과표로 사용하지 않습니다.

## Git·PowerShell 자동화 검사

`automation_test.py`는 tmp/의 임시 저장소와 로컬 bare remote에서 실제 스크립트를 실행합니다. 점검/생성 전용 모드의 index·commit 보존, 전체 커밋·새 파일·반복 실행·로컬 push, 제외 파일의 실제 파일 보존, CRLF 정규화, 버전 해시 파일 누락 차단, remote 불일치·detached HEAD 차단, 다른 경로의 Python 실행을 확인합니다. 실제 프로젝트 저장소에는 commit/push하지 않습니다.
