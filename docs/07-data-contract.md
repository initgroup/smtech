# UI 데이터 연결 계약 v1

계약 원본: [commands.json](../prototype/region/rms/contracts/commands.json), [snapshot.schema.json](../prototype/region/rms/contracts/snapshot.schema.json), [전체 응답 예시](../prototype/region/rms/contracts/snapshot.example.json).

예시 값은 가상 자료입니다. 실제 DB 컬럼명과 UI 필드명이 달라도 내부 DTO 매퍼에서 변환하며 HTML·CSS를 바꾸지 않습니다.

## 조회 스냅샷

bootstrap과 성공한 저장 명령은 아래 구조를 반환합니다.

~~~json
{
  "contractVersion": 1,
  "state": { "demoDate": "2026-10-08", "settings": {}, "boards": {}, "programs": [] },
  "session": { "role": "company", "companyId": "CO001", "region": "충남", "displayName": "로그인 사용자" },
  "receipts": [],
  "result": null
}
~~~

위 코드는 축약 설명입니다. 필수 목록·필드가 모두 있는 snapshot.example.json을 기준으로 구현하세요. 빈 목록도 생략하지 않고 []로 전달합니다. demoDate는 기존 화면과의 호환을 위해 유지한 필드명이며 운영에서는 서버의 업무 기준일입니다.

| 영역 | UI에서 사용하는 내용 |
|---|---|
| classifications | id, kind, name, parentId, active, visible |
| doctors | id, userId, name, organization, owner, institution, industry, year, degree, career, certificates, acquiredTechnology, technologies, consultations, supportRegions, reasons, available, updatedAt, history |
| users | 화면에서 조회 허용된 기술닥터 등록 대상 사용자 정보 |
| programs | id/title/region/category/start/end/deadlineTime, 과제·공고 정보, requiredDocs, supportPrograms, contentSections, contacts, attachments |
| applications | id/programId/companyId/companyName/representative/region, 주소·사업자번호, consent/consentAt, submission, docs, mydataBundle |
| documentTypes | id, name, provider, active |
| matches | id/doctorId/companyId/companyName/region/request/date/status/result |
| faqs / questions | 공개여부·분류·제목·본문·답변·날짜·메인 노출 |
| boards | notice[] / resources[]: id,title,date,category,body, 선택적 attachment{name,url} |
| settings | homeVisible, homeOrder, staleMonths 등 화면 설정 |
| session | 서버 인증 결과의 role, companyId, region, 선택적 displayName |

최상위 schema는 계약 형식 확인용입니다. adapter는 핵심 필드와 배열·역할을 확인하며 모든 업무 필드의 깊은 검증이나 DB 무결성을 대신하지 않습니다. 서버가 필수값·참조 관계·권한·업무 규칙을 검증해야 합니다.

## 저장 명령

app은 UI facade의 saveDoctor(input) 등을 호출합니다. HTTP adapter는 commands.json의 인자명을 이용해 request(command, payload)에 전달합니다. 예를 들면 saveApplicationInfo(id, input)는 {id, input}, queryDocument(appId, id, retry)는 {appId, id, retry}입니다.

| 명령 묶음 | 목적 |
|---|---|
| saveProgram, startApplication | 공고 저장·신청 생성. result는 저장/조회할 ID 문자열 |
| saveDoctor, requestMatch, progressMatch | 전문가 저장·매칭·지원 실적. saveDoctor의 result는 ID |
| saveApplicationInfo, consent, selectMydataBundle, applyReceiptInfo | 기업정보·동의·수신 묶음·신청정보 반영 |
| queryDocument, queryRequired, resolveMismatch | 수신 조회·일괄 조회·불일치 선택 |
| attachFile, requestSupplement, submitApplication | 파일 제출·보완·임시/최종 제출 |
| saveCode, removeCode, mapWork | 분류 관리 |
| updateQuestion, updateSettings, saveDocumentType | 노출·화면·연계 대상 관리 |

기타 명령의 result는 null이어도 됩니다. 새 ID가 필요한 세 명령은 문자열 ID를 반환하세요. 서버 업무 오류는 request Promise를 reject하거나 decode에서 Error를 발생시킵니다. 정상 HTTP 200 안의 resultCode 실패도 내부 decode에서 오류로 변환해야 합니다.

공용 transport는 bootstrap을 GET, 나머지를 JSON POST로 보냅니다. attachFile은 {appId,id,file}을 FormData로 보내므로 내부 서버는 실제 multipart File을 받아야 합니다. 공고의 텍스트 시연 첨부와 운영 바이너리 공고 파일은 별도 기능입니다. 실제 공고 첨부 API·다운로드 정책은 내부 시스템의 모델에 맞게 확장합니다.

요청 중 중복 쓰기를 막고 자동 재시도는 하지 않습니다. 성공 스냅샷을 검증한 다음 메모리 자료를 교체합니다. 실패·잘못된 응답은 기존 자료를 유지합니다. 명령 실패 후 입력과 팝업을 남기며 성공 메시지나 다음 단계로 이동하지 않습니다.

## XML 수신 자료

mydata-repository.js는 XML 파싱·반복 태그·공란·문서 매핑을 담당하며 HTML을 만들지 않습니다. ui/mydata-report.js가 같은 파싱 DTO를 받아 templates/reports/로 화면을 만듭니다.

시연 adapter만 demo/data/mydata의 4개 파일을 읽으며 개발자 ZIP에는 샘플 파일과 adapter가 포함되지 않습니다. 서버 모드는 receipts[]로 권한에 맞는 파싱 결과를 전달합니다. DTO는 parseXml(xml, metadata)의 반환 구조를 기준으로 하며 id,label,audience,purpose,fileName,header,company,transactionAt,processingResult,documents,fieldCount,populatedCount,emptyCount,xml 등을 포함합니다. documents의 fieldsDetailed는 tag,value,path,group 등 원문 순서 정보를 보존합니다. 내부 서버가 원문 다운로드를 제공한다면 originalPath는 허용된 같은 출처 다운로드 경로로 변환하세요.

수신값이 있다는 것과 적격 판정은 별개입니다. 미수신 서류·공란·다른 예시 기업의 값이 섞인 샘플을 정상 판정으로 바꾸지 않습니다. 조회 완료의 근거와 제출 가능 여부는 실제 서버에서 확인합니다.

## 버전·안전 경계

contractVersion=1의 필드명과 명령 인자 순서를 유지하면 템플릿·디자인을 변경해도 데이터 어댑터가 영향을 덜 받습니다. 필드 삭제·타입 변경·비동기 조회 추가는 양측 합의와 계약 버전 변경 대상으로 기록합니다.

인증은 서버 세션, 쓰기 권한·지역·소유권·신청 마감·최종 제출 잠금은 서버 서비스에서 검증합니다. 서버는 허용된 레코드만 응답하며 브라우저에 비공개 전체 목록을 내려보내지 않습니다. HTML 텍스트 값은 {{value}} 또는 JSP c:out으로 이스케이프합니다. {{{fragment}}}에는 신뢰된 presenter/공용 템플릿 결과만 넣고 DB 문자열을 직접 넣지 않습니다. URL 필드도 서버가 허용된 주소로 제한해야 합니다.
