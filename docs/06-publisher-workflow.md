# 퍼블리셔·내부 개발 협업과 배포

UI 구조·CSS·공용 JS·데이터 계약은 README 및 [개발자 이식 안내](delivery/00_먼저읽기_개발자이식안내.md)를 기준으로 관리합니다. 이번 버전은 시연 HTML/CSS/JS를 demo/로 물리 분리했습니다. 개발자 ZIP에 시연 자산을 추가하거나 CSS 숨김으로 대체하지 않습니다.

## 퍼블리셔 배포 절차

1. application.html, templates/, static/ 업무 소스를 수정합니다. 시연 전용 도구는 demo/에서 수정합니다. index.html과 generated/는 빌드 산출물입니다.
2. releases/next.json에 변경 제목·핵심 내용·내부 이식 주의사항을 적습니다.
3. node tools/build.cjs와 관련 테스트를 실행합니다. build는 업무·시연 템플릿을 별도 컴파일하고 두 진입점과 업무 참고 조각을 생성합니다.
4. python tools/package_source.py를 실행합니다. 소스가 바뀐 경우 버전이 증가합니다. 같은 소스의 반복 패키징은 같은 버전입니다. major/minor 변경은 --version으로 명시합니다.
5. ZIP 루트 안내·이력·manifest, 웹 소스의 시연 코드 누출 검사, SHA-256/CRC를 확인합니다. 버전 ZIP을 보관하고 최신 별칭을 제공합니다.
6. git-upload.ps1은 빌드·패키징 후 전체 변경을 stage하고 ZIP을 index/commit 소스와 비교합니다. 실제 commit/push는 요청받았을 때 실행합니다.

배포 입력 목록은 releases/developer-package.json의 허용 경로입니다. demo/ 전체, 원본 샘플, 가상 저장소, 시연 전용 템플릿·자산은 제외됩니다. 상단 배포내역 레이어 자체도 시연 전용이므로 내부 ZIP에 포함되지 않습니다.

## 변경분 이식

[변경분 적용 문서](delivery/02_파일경로와변경분적용.md)의 delivery_delta.py를 사용합니다. v1.1.0 이후 업무용 ZIP끼리 비교하며, 내부 파일이 이전 배포와 다른 경우 충돌로 보고 수동 병합합니다. 도구는 내부 트리를 자동으로 수정하거나 삭제하지 않습니다. 내부 소유 web/integration/은 변경분에서 제외합니다.

구형 RMS-PUB-20261008-01 전체 프로젝트 ZIP은 deliverables/에 참고용으로 보존했습니다. 시연이 포함되어 있으므로 신규 내부 이식 기준으로 사용하지 않습니다. 이력에는 v1.0.0으로 표시하고 v1.1.0부터 업무 전용 경로를 사용합니다.
