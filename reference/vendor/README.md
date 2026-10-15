# Q&A 웹에디터·HTML 정제 라이브러리 참조

2026-10-15 확인. 런타임은 외부 CDN을 호출하지 않습니다. 배포 파일은 `prototype/region/rms/static/vendor/`, 재설치용 원본 npm 패키지와 해시 목록은 이 디렉터리에 둡니다.

| 라이브러리 | 고정 버전 | 라이선스 | 공식 소스 |
|---|---|---|---|
| Quill | 2.0.3 | BSD-3-Clause | https://github.com/slab/quill/tree/v2.0.3 |
| DOMPurify | 3.4.16 | Apache-2.0 OR MPL-2.0 | https://github.com/cure53/DOMPurify/tree/3.4.16 |

- `quill-2.0.3.tgz`, `dompurify-3.4.16.tgz`: npm registry의 해당 버전 패키지 원본.
- `packages-lock.json`: 패키지 버전, 공식 출처, archive URL, 배포 파일/설치 패키지의 바이트 수와 SHA-256. npm이 생성한 package-lock.json과 다른 프로젝트 검증용 잠금 목록입니다.
- 배포 폴더의 LICENSE 및 quill.js.LICENSE.txt: 원본 라이선스·번들 내 고지.

다른 PC에서는 이 저장소 전체를 복사하면 추가 npm 설치 없이 로컬 웹서버에서 작동합니다. 배포 파일이 손상되었다면 tgz 내부 package/dist에서 동일한 파일을 복구하고 packages-lock.json과 SHA-256을 대조하세요. 패키지 내부와 현재 배포 파일의 일치도 검증했습니다. 버전 변경 시 공식 릴리스·보안 공지를 확인하고 검증 및 잠금 목록을 갱신하세요.

QA 의존성 jsdom 26.1.0은 tmp/qa에만 설치했으며 운영 코드에 포함되지 않습니다. 테스트 설치는 `npm install --prefix tmp/qa --save-exact jsdom@26.1.0 --ignore-scripts`입니다. 편집 UI용 Quill, XSS 정제용 DOMPurify, 개인정보 패턴 처리용 프로젝트 RMSPrivacy는 서로 다른 역할입니다. 자세한 이식 계약은 `docs/11-qna-editor-security.md`를 참고하세요.
