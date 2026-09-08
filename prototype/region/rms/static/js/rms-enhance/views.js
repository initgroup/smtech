/* Templates are isolated from business rules. Untrusted values always pass through esc(). */
(function (root) {
  'use strict';
  /* SFR-CATALOG-BEGIN */
  var requirements = [
  {
    "id": "SFR-01",
    "name": "기술닥터 등록정보 현행화",
    "definition": "기술닥터의 기본정보, 전문분야, 활동정보 등 등록정보를 체계적으로 관리하고 최신 정보로 현행화할 수 있도록 지원하는 기능",
    "details": [
      "◦ 관리기관(TP)이 기술닥터의 기본정보, 소속기관, 학위정보, 취득기술정보, 주요 경력, 자격증 및 포상정보, 선정사유 등의 정보를 등록·조회·수정할 수 있는 기능을 구현하여야 함",
      "◦ 기술닥터 등록기관의 관리권한을 보유한 담당자에 한하여 해당 기술닥터의 등록정보를 수정할 수 있도록 권한을 관리하여야 함",
      "◦ 등록기관과 타지역 관리기관 간 조회·수정 권한 구분",
      "◦ 기술닥터 등록 시 SMTECH에 등록된 사용자를 조회·선택할 수 있어야 하며, SMTECH에 등록된 사용자 기본정보를 연계하여 기술닥터 등록정보의 초기값으로 설정할 수 있어야 함",
      "◦ 기술닥터의 전문분야, 기술분야 및 지원가능 분야 등 기업과의 검색·매칭에 필요한 정보를 체계적으로 등록·관리할 수 있어야 함",
      "◦ 기술닥터 등록정보 변경 시 변경일시, 변경자, 변경내용 등의 변경이력을 관리·조회할 수 있어야 하며, 동일 기술닥터의 중복등록 방지",
      "◦ 기술닥터별 최종 정보 갱신일자를 관리하고, 일정 기간 이상 등록정보가 갱신되지 않은 기술닥터를 식별하여 현행화 대상 정보를 조회·관리할 수 있어야 함"
    ],
    "demo": "검색·상세·등록/수정 팝업, SMTECH 가상 사용자 초기값, 중복/등록기관 권한, 변경이력, 12개월 현행화 대상",
    "remaining": "SMTECH 사용자 조회, 실제 인적정보·기관권한·변경이력 테이블",
    "implementation": {
      "design": "전문가의 현재 상태를 빠르게 판단하도록 검색 목록에는 활동상태·최종 갱신일·현행화 대상 배지를 배치했습니다. 상세에서는 기본정보와 변경이력을 별도 패널로 나누어 현재 값과 수정 근거를 비교할 수 있습니다.",
      "screen": "관리기관·관리자에게 등록 버튼을 표시하고, 상세 수정 버튼은 소관 등록기관과 관리자에게 제공합니다. 등록 팝업에서 가상 SMTECH 사용자를 선택하면 소속기관을 채우며 학위·경력·취득기술·자격·선정사유·복수 전문분야를 입력합니다.",
      "technology": "JavaScript 업무 계층에서 userId 중복과 등록기관 수정권한을 검사합니다. 수정 전후 필드 값을 비교하여 시각·변경자·변경내역을 만들고, 시연 기준일과 설정된 현행화 개월 수로 미갱신 대상을 계산합니다.",
      "data": "users와 doctors를 userId로 연결하고 doctors.history에 변경 전후 값을 보관합니다. 검증한 변경만 smtech 전용 localStorage에 저장하며, 저장 오류가 나면 이전 상태를 유지합니다. 학위·경력·자격은 현재 텍스트 필드입니다."
    },
    "followup": [
      "SMTECH 사용자 조회 API와 기관 담당자 권한을 서버에서 연결·재검증해야 합니다. 프로토타입의 역할 선택은 실제 인증을 수행하지 않습니다.",
      "DB 설계 제안: 전문가 기본정보, 경력·학위·자격 반복 항목, 변경이력을 분리하고 사용자 식별자에 중복 제약을 둡니다. 기관·최종갱신일 검색 인덱스와 현행화 알림 배치는 미구현입니다."
    ],
    "menus": [
      {
        "id": "doctors",
        "label": "기술닥터 › 통합검색·비교",
        "route": "doctors",
        "roles": []
      },
      {
        "id": "doctor-detail",
        "label": "기술닥터 › 상세정보·변경이력",
        "route": "doctors",
        "record": "doctor",
        "roles": []
      },
      {
        "id": "doctor-register",
        "label": "기술닥터 › 통합검색 › 기술닥터 등록",
        "route": "doctors",
        "roles": [
          "tp",
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-02",
    "name": "기술닥터 표준 분류체계 구축",
    "definition": "기술닥터의 전문성 및 기업 지원 가능 분야를 산업분야, 기술분야, 상담유형, 기관유형, 지원가능 지역, 기타 선정·활동 정보 등 표준화된 분류체계로 관리하는 기능",
    "details": [
      "◦ 기술닥터 정보를 산업분야, 기술분야, 상담유형, 기관유형, 지원가능 지역, 기타 선정·활동 정보 등의 표준 분류체계에 따라 등록·관리할 수 있어야 함",
      "◦ 산업·기술정보 및 상담유형 등을 계층형 분류체계로 구성하여 기술닥터의 전문분야를 세분화하여 관리할 수 있어야 함",
      "◦ 기술닥터별 지원가능 지역을 등록하고 지역 단위로 검색할 수 있어야 함",
      "◦ 하나의 기술닥터가 복수의 상담유형, 취득기술정보 및 지원가능 지역, 선정사유를 등록할 수 있어야 함",
      "◦ 분류체계의 추가·수정·삭제 등 관리자가 표준 분류체계를 관리할 수 있도록 구현하여야 함",
      "◦ 기술닥터 검색 및 기업 매칭 시 해당 분류체계를 활용할 수 있도록 구현하여야 함"
    ],
    "demo": "관리자에서 산업·기술·상담·기관·지역·선정사유 분류 관리, parentId 계층, 복수 선택",
    "remaining": "표준코드 확정, 기존 자유입력 데이터 정제·이행",
    "implementation": {
      "design": "자유 입력으로 달라지기 쉬운 전문분류를 선택형 UI로 통일했습니다. 분류 관리에서는 상위 항목을 들여쓰기로 구별하고 사용·노출 상태를 함께 보여 관리자가 코드의 구조와 제공 상태를 한 화면에서 판단하게 했습니다.",
      "screen": "산업·기술·상담·기관·지역·선정사유 분류를 관리 화면에서 추가·수정합니다. 기술닥터 등록에는 복수 체크박스, 검색에는 같은 코드의 선택 목록, 상세에는 코드명 표시를 적용했습니다.",
      "technology": "분류 종류와 parentId를 검증하고 상위 분류 순환 및 다른 종류의 연결을 차단합니다. 하위 코드나 전문가·게시물에서 참조하는 코드는 삭제하지 못하게 하여 참조가 끊어지는 것을 방지합니다.",
      "data": "classifications에 id·kind·parentId·active·visible을 보관하고 전문가의 전문분야는 코드 ID 배열로 연결합니다. 업무분류 매핑은 기존 FAQ·질문의 참조를 함께 변경합니다. 지역 지원목록은 현재 지역명 문자열을 사용합니다."
    },
    "followup": [
      "실제 기관별 분류표를 대조해 표준코드와 폐기·대체 규칙을 확정하고 기존 자유입력 값의 미매핑 항목을 검수해야 합니다.",
      "DB 설계 제안: 코드그룹·계층코드·전문가별 코드 연결 테이블에 외래키와 중복 제약을 둡니다. 코드 유효기간·개정 이력·지역 ID 전환 및 이행 스크립트는 아직 구현하지 않았습니다."
    ],
    "menus": [
      {
        "id": "codes",
        "label": "설정 › 표준분류 › 기술·산업 등 분류",
        "route": "manage",
        "codeKind": "technology",
        "roles": [
          "admin"
        ]
      },
      {
        "id": "doctors",
        "label": "기술닥터 › 통합검색·비교",
        "route": "doctors",
        "roles": []
      },
      {
        "id": "doctor-detail",
        "label": "기술닥터 › 상세정보·변경이력",
        "route": "doctors",
        "record": "doctor",
        "roles": []
      },
      {
        "id": "doctor-register",
        "label": "기술닥터 › 통합검색 › 기술닥터 등록",
        "route": "doctors",
        "roles": [
          "tp",
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-03",
    "name": "초광역권 기술닥터 통합검색",
    "definition": "지역별로 분산되어 운영되는 기술닥터 정보를 통합하여 타지역 기술닥터까지 검색·활용할 수 있도록 지원하는 기능",
    "details": [
      "◦ 지역별 기술닥터 정보를 연계하여 초광역권 단위로 통합 검색할 수 있는 기능을 구현하여야 함",
      "◦ 기업이 소재한 지역뿐만 아니라 타지역의 기술닥터도 검색하고 활용할 수 있어야 함",
      "◦ 타지역 기술닥터 활용시 해당 전문가의 지원가능 여부 및 지원가능 지역을 확인할 수 있어야 함",
      "◦ 검색 결과에서 기술닥터의 소속기관, 기관유형, 취득기술정보, 지원가능 지역 등 주요 정보를 확인할 수 있어야 함",
      "◦ 기업 또는 관리기관이 타지역 기술닥터에 대한 매칭 또는 활용 요청을 등록·관리 할 수 있어야 함",
      "◦ 지역 간 기술닥터 활용이 가능하도록 지역 제한 여부 및 지원 가능 범위 등의 정보를 제공할 수 있어야 함",
      "◦ 초광역권 통합검색을 통해 기업의 기술애로에 적합한 타지역 기술닥터를 활용할 수 있도록 지원하여야 함",
      "◦ 타지역 기술닥터 활용에 따른 매칭·지원실적을 기술닥터 및 관리기관 단위로 관리 할 수 있어야 함"
    ],
    "demo": "전국 검색, 등록지역/지원가능 지역 구분, 타지역 전문가 매칭 요청과 실적",
    "remaining": "지역 간 관리권한·요청전달·승인 규칙",
    "implementation": {
      "design": "등록지역과 실제 지원가능 지역을 분리해 보여 지역 밖의 전문가도 찾을 수 있도록 구성했습니다. 상세의 매칭 요청 버튼에서 지원 관리로 이어지는 흐름과 지역 내·지역 간 매칭 배지로 초광역 협업 여부를 구별합니다.",
      "screen": "전국 전문가를 검색하고 지원가능 지역·활동상태를 확인한 뒤 기술애로를 입력해 요청합니다. 매칭 목록에서는 요청접수 → 지원진행 → 지원완료로 처리하고 완료 시 기업지원 결과를 입력합니다.",
      "technology": "JavaScript에서 지원지역·활동 여부와 진행 중인 동일 전문가 요청의 중복을 검사합니다. 기관 담당자는 소관 지역 요청만 처리하고, 지원단계를 건너뛰거나 완료 결과 없이 종료하는 작업은 차단합니다.",
      "data": "matches에 전문가·기업 식별자, 기업지역, 요청내용, 요청일, 상태, 결과를 저장합니다. 전문가 등록지역과 기업지역을 비교해 지역 간 매칭을 판별하며 처리된 변경은 공통 저장·감사이력에 반영합니다."
    },
    "followup": [
      "지역 간 요청 전달·수락·거절·취소, 기관 책임 범위와 기업 정보 열람권한을 합의해 서버 업무 흐름과 알림으로 구현해야 합니다.",
      "DB 설계 제안: 매칭 요청과 단계 이력을 분리하고 전문가·기업·기관 참조 및 진행 중 중복 제약을 설계합니다. 동시 요청 처리, 상태 전환 트랜잭션과 기관 간 승인 프로세스는 미구현입니다."
    ],
    "menus": [
      {
        "id": "doctors",
        "label": "기술닥터 › 통합검색·비교",
        "route": "doctors",
        "roles": []
      },
      {
        "id": "doctor-detail",
        "label": "기술닥터 › 상세정보·변경이력",
        "route": "doctors",
        "record": "doctor",
        "roles": []
      },
      {
        "id": "matches",
        "label": "기술닥터 › 매칭·지원 관리",
        "route": "matches",
        "roles": [
          "company",
          "tp",
          "admin"
        ]
      },
      {
        "id": "match-review",
        "label": "기술닥터 › 매칭·지원 관리 › 지원실적 처리",
        "route": "matches",
        "roles": [
          "tp",
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-04",
    "name": "기술닥터 검색 기능 고도화",
    "definition": "기업의 기술애로 및 지원수요에 적합한 기술닥터를 다양한 조건으로 검색하고 상세정보를 확인할 수 있는 기능",
    "details": [
      "◦ 기술닥터의 기관유형, 지원가능 지역, 소속기관명, 선정연도 등의 조건을 활용하여 검색할 수 있어야 함",
      "◦ 복수의 검색조건을 조합하여 기업의 기술수요에 적합한 기술닥터를 검색할 수 있어야 함",
      "◦ 검색결과를 기관유형, 취득기술정보, 지역 등 조건에 따라 정렬 및 필터링할 수 있어야 함",
      "◦ 검색결과에서 기술닥터의 이름, 소속기관, 기관유형, 취득기술정보, 지원가능 지역 등 주요 정보를 확인할 수 있어야 함",
      "◦ 기술닥터 상세정보 조회 시 기업의 기술애로 해결에 필요한 전문정보를 제공할 수 있어야 함",
      "◦ 검색조건 및 검색결과를 활용하여 적합한 기술닥터를 비교·선택할 수 있도록 구현하여야 함"
    ],
    "demo": "이름·기관·취득기술, 산업·기술·기관유형·지역·연도 복합 검색, 정렬, 2~3명 비교",
    "remaining": "대량 검색·페이징·접근 가능한 필드 결정",
    "implementation": {
      "design": "상단 필터 → 결과 목록 → 선택 비교 순서로 탐색 영역을 정리했습니다. 요약 지표와 갱신 배지를 먼저 보여 후보를 좁히고, 비교 표는 속성을 행으로 정렬하여 전문가별 차이를 나란히 읽도록 했습니다.",
      "screen": "이름·소속기관·취득기술 검색어와 산업·기술·기관유형·지원지역·선정연도 조건을 함께 적용합니다. 활동 가능·현행화 대상 필터와 정렬을 제공하며 최대 3명 선택, 2~3명 비교, 상세 진입을 연결했습니다.",
      "technology": "가상 목록에 JavaScript 필터·문자열 검색·정렬을 적용하고 Set으로 비교 선택 중복과 인원 제한을 관리합니다. 필터 UI와 결과 렌더링을 분리하고 빈 결과를 안내하며, 넓은 표는 내부 가로 스크롤로 표시합니다.",
      "data": "검색은 현재 JSON의 전문가·표준분류를 메모리에서 조회합니다. 내보내기에는 검색조건과 비교 선택 ID도 포함해 다른 PC에서 같은 후보를 검토할 수 있습니다. 서버 페이징이나 전문 검색 인덱스는 없습니다."
    },
    "followup": [
      "운영 검색 API에 서버 페이징·정렬·필터를 적용하고 공개 가능한 전문가 항목을 권한에 따라 제한해야 합니다. 검색량·데이터 규모에 맞는 응답시간 검증이 필요합니다.",
      "DB 설계 제안: 이름·기관·갱신일과 코드 연결의 조회 패턴을 기준으로 인덱스를 설계합니다. 한글 검색 정규화·전문검색 사용 여부는 실제 데이터의 실행계획과 품질을 확인한 후 결정하며 현재 적용하지 않았습니다."
    ],
    "menus": [
      {
        "id": "doctors",
        "label": "기술닥터 › 통합검색·비교",
        "route": "doctors",
        "roles": []
      },
      {
        "id": "doctor-detail",
        "label": "기술닥터 › 상세정보·변경이력",
        "route": "doctors",
        "record": "doctor",
        "roles": []
      }
    ]
  },
  {
    "id": "SFR-05",
    "name": "기술닥터 통계 관리",
    "definition": "지역 및 기술분야별 기술닥터 현황과 기술닥터 매칭 및 기업지원 실적 등의 통계정보를 조회·관리하는 기능",
    "details": [
      "◦ 지역별 기술닥터 등록 및 활동 현황을 조회할 수 있어야 함",
      "◦ 산업분야 및 기술분야별 기술닥터 현황을 조회할 수 있어야 함",
      "◦ 기술닥터와 기업 간 매칭 건수 및 매칭 실적을 조회할 수 있어야 함",
      "◦ 기술닥터를 활용한 기업지원 건수 및 지원실적을 조회할 수 있어야 함",
      "◦ 지역별·기술별·기간별 등 다양한 조건으로 통계자료를 조회할 수 있어야 함",
      "◦ 통계 및 성과정보를 관리자 및 사업관리자가 업무에 활용할 수 있도록 화면 조회 및 통계자료 제공 기능을 구현하여야 함",
      "◦ 조회된 통계자료는 엑셀 등 활용 가능한 형태로 내려받을 수 있어야함"
    ],
    "demo": "등록·활동 전문가, 매칭·지원완료·중복제거 기업 수, 지역/산업/기술/기간, CSV",
    "remaining": "공식 집계 정의, 이력 시점 통계, 대량 엑셀 출력",
    "implementation": {
      "design": "등록 전문가·매칭·지원완료·지원기업 수를 상단 지표로 구분했습니다. 지역별 막대 표시와 상세 수치 표를 함께 배치해 규모 비교와 정확한 숫자 확인을 동시에 할 수 있도록 했습니다.",
      "screen": "관리기관·관리자가 지역·산업·기술·매칭 요청기간을 조합해 통계를 조회합니다. 지원완료 건수와 중복을 제거한 기업 수를 별도로 표시하고 지역별 집계 표를 CSV로 내려받습니다.",
      "technology": "JavaScript의 필터·집계와 Set 기반 기업 ID 중복 제거를 사용합니다. 시작일이 종료일보다 늦으면 오류를 안내하며 CSV 문자열을 Blob 다운로드로 제공합니다. 그래프는 HTML progress 요소로 구성했습니다.",
      "data": "현재 doctors와 matches에서 계산하므로 등록·활동 현황은 현재값이며 기간 조건은 매칭 요청일에 적용됩니다. 과거 특정 날짜의 전문가 소속·활동 상태를 복원하는 시점 통계나 집계 DB는 구현하지 않았습니다."
    },
    "followup": [
      "공식 지표 정의, 완료일·요청일 중 기간 적용 기준, 기업 중복 제거 범위와 통계 열람권한을 확정해야 합니다. 대량 엑셀 생성과 다운로드 이력도 운영 기능으로 남아 있습니다.",
      "DB 설계 제안: 매칭 상태 이력과 전문가 유효기간 정보를 바탕으로 통계 뷰 또는 일별 집계 테이블을 구성합니다. 집계 배치·재집계·증분 갱신과 관련 인덱스는 미구현입니다."
    ],
    "menus": [
      {
        "id": "stats",
        "label": "기술닥터 › 통계·성과",
        "route": "stats",
        "roles": [
          "tp",
          "admin"
        ]
      },
      {
        "id": "match-review",
        "label": "기술닥터 › 매칭·지원 관리 › 지원실적 처리",
        "route": "matches",
        "roles": [
          "tp",
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-06",
    "name": "메인화면 로그인 영역 개선",
    "definition": "사용자의 로그인 접근성을 향상시키기 위해 메인화면 내 로그인 영역 및 로그인 팝업 기능을 개선하는 기능",
    "details": [
      "◦ 메인화면에서 로그인 기능을 쉽게 인지하고 접근할 수 있도록 로그인 영역을 배치하여야 함",
      "◦ 메인화면에서 로그인 선택 시 로그인 화면 또는 팝업 방식으로 로그인할 수 있도록 구현하여야 함",
      "◦ 로그인 상태에 따라 로그인, 로그아웃, 회원정보 등 사용자별 메뉴를 구분하여 제공하여야 함"
    ],
    "demo": "메인 로그인 패널/역할 선택 팝업, 로그인 전후 메뉴",
    "remaining": "SMTECH 인증·휴대폰 OTP·세션·로그아웃",
    "implementation": {
      "design": "메인에서 로그인 위치를 쉽게 찾도록 공고·검색 콘텐츠 옆에 독립 로그인 패널을 배치했습니다. 상단 계정 메뉴와 같은 청색 버튼 체계를 사용하고, 모바일에서는 로그인 패널을 업무 콘텐츠 앞에 배치합니다.",
      "screen": "로그인 전에는 로그인·아이디/비밀번호 찾기를 표시하고 로그인 후에는 사용자명·회원정보·로그아웃 및 나의 업무 진입을 제공합니다. 로그인 선택 시 역할 선택 팝업을 열며 SFR 메뉴에서 권한이 부족한 경우에도 필요한 역할을 안내합니다.",
      "technology": "HTML dialog와 이벤트 위임으로 로그인 팝업을 제어하고, 현재 세션 역할에 따라 메뉴를 다시 렌더링합니다. SFR 링크의 목적지를 보존해 허용된 역할을 선택한 다음 해당 화면을 열며 취소하면 현재 화면에 머뭅니다.",
      "data": "세션 역할은 브라우저 메모리의 가상 상태입니다. 비밀번호·OTP·인증 토큰은 수집하거나 저장하지 않습니다. JSON에는 시연 역할을 복원하는 메타정보만 포함되며 새로고침하면 로그인 전 역할로 돌아갑니다."
    },
    "followup": [
      "실제 SMTECH 인증, 휴대폰 OTP, 세션 발급·만료·로그아웃 및 계정 복구 화면을 연계해야 합니다. 모든 업무 API는 서버에서 사용자의 기관·기업·역할 권한을 다시 검사해야 합니다.",
      "DB·서버 설계 제안: 기존 회원·기관·역할 매핑과 로그인 감사기록을 활용하고 운영 인증 방식에 맞는 세션 저장소를 정합니다. 인증 테이블 변경, 서버 세션, 토큰 보호 및 실패 횟수 제한은 현재 미구현입니다."
    ],
    "menus": [
      {
        "id": "home",
        "label": "공고 › 메인 로그인·공고·주요 질문",
        "route": "home",
        "roles": []
      }
    ]
  },
  {
    "id": "SFR-07",
    "name": "FAQ 검색 및 주요 질문 제공",
    "definition": "사용자가 메인화면에서 자주 묻는 질문(FAQ)을 쉽게 검색하고 주요 질문 및 답변을 확인할 수 있도록 제공하는 기능",
    "details": [
      "◦ 사용자가 자주 묻는 질문을 쉽게 확인할 수 있도록 메인화면에 FAQ 영역을 구성하고 주요 FAQ를 제공하여야 함",
      "◦ 메인화면의 FAQ 영역에서 질문을 선택하면 해당 질문의 답변내용을 확인할 수 있어야 함",
      "◦ FAQ 영역의 [더보기] 기능을 통해 전체 FAQ 목록 화면으로 이동할 수 있어야 함",
      "◦ 제목, 질문내용, 답변내용 및 등록된 키워드를 대상으로 검색하고 검색어가 일부 포함된 관련 FAQ를 우선 제공하고, 검색어와 일치하는 FAQ가 없는 경우 검색어와 유사하거나 관련된 FAQ를 제공할 수 있어야 함"
    ],
    "demo": "메인 주요 질문 펼침, 제목·답변·키워드, 부분/관련 글자 검색, 더보기",
    "remaining": "기존 FAQ 데이터, 검색 품질·관련도 기준",
    "implementation": {
      "design": "메인에 질문형 제목과 검색창을 배치해 사용자가 메뉴명을 몰라도 질문으로 시작할 수 있게 했습니다. 주요 질문은 제목 목록에서 답변을 펼치는 아코디언으로 구성해 페이지 이동 없이 내용을 확인합니다.",
      "screen": "메인 검색과 FAQ 더보기를 전체 FAQ 화면에 연결하고 업무유형·검색어를 유지합니다. 제목·답변·키워드를 검색하며 직접 일치 결과가 없으면 관련 글자·키워드 기반 제안임을 안내합니다.",
      "technology": "details/summary의 기본 펼침 동작과 키보드 조작을 사용합니다. JavaScript 문자열 비교로 일치 항목을 찾고 관련 문자를 비교해 대체 후보를 정렬합니다. 생성형 AI·외부 검색 엔진을 호출하는 기능은 아닙니다.",
      "data": "faqs의 title·answer·keywords·work·published를 사용하고 업무분류의 사용·노출 설정도 함께 검사합니다. 검색어·업무유형은 시연 내보내기의 화면 메타정보로 복원하며 FAQ 데이터는 전체 백업에 포함합니다."
    },
    "followup": [
      "기존 FAQ와 관리자 답변 편집·게시·검수 절차를 연계해야 합니다. 실제 질문 로그를 바탕으로 동의어·오탈자·관련도 기준을 검증하고 검색 결과 없는 질문의 운영 처리방식을 정해야 합니다.",
      "DB 설계 제안: FAQ·키워드·업무분류 참조와 게시 상태를 저장하고 조회 빈도·검색 로그 집계를 분리합니다. 검색 인덱스·추천 집계 배치·운영 FAQ 작성 CRUD는 현재 미구현입니다."
    ],
    "menus": [
      {
        "id": "home",
        "label": "공고 › 메인 로그인·공고·주요 질문",
        "route": "home",
        "roles": []
      },
      {
        "id": "faq",
        "label": "소통관리 › 자주하는 질문",
        "route": "faq",
        "roles": []
      }
    ]
  },
  {
    "id": "SFR-08",
    "name": "업무 유형별 분류 및 검색",
    "definition": "로그인, 사업신청, 사업관리 등 사용자의 주요 업무 유형에 따라 FAQ 및 관련 정보를 분류하고 검색할 수 있도록 제공하는 기능",
    "details": [
      "◦ FAQ 및 질문·답변 정보를 로그인, 사업신청, 사업관리 등 업무 유형별로 분류하여 관리할 수 있어야 함",
      "◦ 메인화면에서 업무 유형을 선택하여 해당 업무와 관련된 질문 및 답변을 조회할 수 있어야 함",
      "◦ 업무 유형과 검색어를 조합하여 원하는 정보를 검색할 수 있어야 함",
      "◦ 업무 유형별 주요 질문 및 자주 이용되는 정보를 메인화면에서 확인할 수 있도록 구현하여야 함",
      "◦ 소통하기 분류체계를 기반으로 업무유형을 구성하되, 관리자가 분류체계의 추가·변경·사용여부·노출여부를 관리할 수 있도록 구현하여야 함",
      "◦ 기존 질문·답변 데이터에 검색기능에서 활용할 수 있도록 기존 데이터와의 매핑 또는 전환 방안을 마련하여야 함"
    ],
    "demo": "유형+검색어, 분류 사용/노출 설정, 기존 유형 일괄 매핑",
    "remaining": "기존 소통 분류 코드·데이터 매핑 검증",
    "implementation": {
      "design": "메인 업무유형 칩과 FAQ·소통하기의 선택 목록을 같은 분류명으로 통일했습니다. 관리자 설정에서는 사용 여부와 사용자에게 보일 노출 여부를 구분해 기존 분류를 즉시 삭제하지 않고 관리하도록 했습니다.",
      "screen": "업무유형과 검색어를 결합해 FAQ·공개 질문을 조회합니다. 표준분류의 업무유형 탭에서 항목을 관리하고 메인·소통 설정에서는 기존 유형을 다른 유형으로 일괄 매핑한 결과를 확인합니다.",
      "technology": "공통 codes/options 렌더링과 work ID 필터를 사용해 화면마다 서로 다른 분류 목록이 생기지 않게 했습니다. 동일 유형끼리의 무의미한 매핑과 잘못된 분류 참조를 차단하고 데이터 검증 후 저장합니다.",
      "data": "classifications의 work 코드와 faqs·questions의 work 필드를 연결합니다. 매핑 시 두 목록의 기존 참조를 함께 변경하며 비활성·비노출 업무유형의 항목은 공개 화면 후보에서 제외합니다."
    },
    "followup": [
      "기존 소통 게시판의 분류코드·권한·비공개 조건을 대조하고 실제 매핑 전후 건수와 누락을 검증해야 합니다. 분류 변경에 따른 검색 URL·통계 영향도 확인해야 합니다.",
      "DB 설계 제안: 게시물의 업무유형 외래키와 코드 변경 이력을 두고 일괄 매핑을 트랜잭션으로 처리합니다. 운영 데이터 이행·롤백 스크립트 및 대량 변경 성능 검증은 미구현입니다."
    ],
    "menus": [
      {
        "id": "home",
        "label": "공고 › 메인 로그인·공고·주요 질문",
        "route": "home",
        "roles": []
      },
      {
        "id": "faq",
        "label": "소통관리 › 자주하는 질문",
        "route": "faq",
        "roles": []
      },
      {
        "id": "questions",
        "label": "소통관리 › 소통하기 · 공개 질문과 답변",
        "route": "questions",
        "roles": []
      },
      {
        "id": "work-codes",
        "label": "설정 › 표준분류 › 업무유형",
        "route": "manage",
        "codeKind": "work",
        "roles": [
          "admin"
        ]
      },
      {
        "id": "home-settings",
        "label": "설정 › 메인·소통 설정",
        "route": "manage/home",
        "roles": [
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-09",
    "name": "최근 질문 및 답변완료 정보 제공",
    "definition": "최근 등록된 질문과 답변이 완료된 게시물을 메인화면에 제공하여 사용자가 최신 질문·답변 정보를 쉽게 확인할 수 있도록 하는 기능",
    "details": [
      "◦ 메인화면에 최근 등록된 질문을 조회할 수 있는 영역을 구성하여야 함",
      "◦ 최근 답변이 완료된 질문 및 답변 게시물을 메인화면에 제공하여야 함",
      "◦ 질문 제목, 등록일, 답변상태 등 주요 정보를 메인화면에서 확인할 수 있어야 함",
      "◦ 질문 또는 답변 선택 시 해당 상세 화면으로 이동할 수 있도록 구현하여야 함",
      "◦ 메인화면에는 공개가 가능한 질문·답변만 노출하여야 하며 비공개 게시물 및 개인정보가 포함된 정보는 노출하지 않아야 함",
      "◦ 관리자가 게시물의 메인화면 노출 여부를 지정할 수 있어야 함",
      "◦ 메인화면에 노출되는 정보에는 작성자 및 기업의 개인정보가 표시되지 않도록 하여야 함"
    ],
    "demo": "공개·메인노출허용·활성 업무유형 조건, 제목/날짜/상태, 상세 모달",
    "remaining": "개인정보 제거·게시물 승인·서버측 공개 검사",
    "implementation": {
      "design": "메인 하단에 최근 질문과 답변을 표로 배치하고 업무유형·제목·등록일·답변상태만 먼저 보여 정보를 빠르게 훑게 했습니다. 제목을 누르면 답변 팝업이 열려 메인 화면의 탐색 맥락을 유지합니다.",
      "screen": "메인에는 노출 허용된 공개 질문 일부를 표시하고 더보기로 공개 질문 전체 목록에 이동합니다. 관리자 설정에서 글별 메인 노출을 변경하며 비공개 글의 노출 선택은 막습니다.",
      "technology": "공개 여부·메인 노출 여부·활성 업무유형을 함께 평가합니다. 상세를 열 때도 공개 목록에서 다시 대상을 찾고 제목·답변은 HTML 이스케이프하여 저장된 문자열을 실행하지 않고 텍스트로 표시합니다.",
      "data": "questions에 public·mainVisible·work·status·date를 저장합니다. 메인 노출을 해제해도 공개 글 전체 목록에서는 조회되며, 비공개 글은 목록·상세 대상에서 제외됩니다. 원본 운영 게시판이나 승인 DB는 연결하지 않았습니다."
    },
    "followup": [
      "공개 답변의 개인정보 제거·게시 승인·첨부 열람 규칙을 적용하고 서버 목록·상세 API에서 공개권한을 검증해야 합니다. 브라우저에 가상 전체 JSON을 내려주는 현재 구조는 운영 비공개 데이터에 사용할 수 없습니다.",
      "DB 설계 제안: 게시물 공개상태·승인이력·메인 노출 순서와 공개일을 관리하고 목록 조회 인덱스를 구성합니다. 게시판 등록·답변 편집·승인 워크플로 및 서버 페이징은 미구현입니다."
    ],
    "menus": [
      {
        "id": "home",
        "label": "공고 › 메인 로그인·공고·주요 질문",
        "route": "home",
        "roles": []
      },
      {
        "id": "questions",
        "label": "소통관리 › 소통하기 · 공개 질문과 답변",
        "route": "questions",
        "roles": []
      },
      {
        "id": "home-settings",
        "label": "설정 › 메인·소통 설정",
        "route": "manage/home",
        "roles": [
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-10",
    "name": "메인화면 정보 재배치 및 웹접근성 UI 개선",
    "definition": "사용자의 이용 빈도와 업무 중요도를 고려하여 메인화면의 정보를 재배치하고 웹접근성을 강화하여 사용자 편의성을 향상시키는 기능",
    "details": [
      "◦ 사용자의 이용 빈도 및 업무 중요도 등을 분석하여 주요 기능 및 정보를 메인화면에 우선 배치할 수 있도록 개선하여야 함",
      "◦ 로그인, 사업신청, 사업관리, FAQ 등 주요 업무 기능에 대한 접근성을 높일 수 있도록 화면 UI를 개선하여야 함",
      "◦ 주요 정보 및 기능을 직관적으로 인지할 수 있도록 메뉴 및 콘텐츠 영역을 재구성하여 웹접근성 개선하여야 함",
      "◦ 기존 시스템 메뉴별 이용현황, 사용자 문의유형, 업무 중요도 등을 분석하여 메인화면의 콘텐츠 배치 및 노출 정보를 지속적으로 변경·관리할 수 있도록 구성하여야 함"
    ],
    "demo": "공고·FAQ·질문 위치/노출 관리, 키보드 조작·라벨·상태 텍스트",
    "remaining": "이용통계 분석, 공식 접근성·호환성 점검",
    "implementation": {
      "design": "공고·FAQ·최근 질문을 카드와 패널로 구분하고 로그인·바로가기를 보조 영역으로 배치했습니다. 기존 RMS 청색 계열과 원본 스타일을 유지하면서 개선 CSS의 적용 범위를 제한했습니다. 임시 시연 도구는 맨 위 보라색 영역으로 분리했습니다.",
      "screen": "관리자가 공고·FAQ·질문의 순서와 노출 여부를 바꾸면 메인에 즉시 반영됩니다. 공고에는 접수기간·마감일시, 상세에는 구조화된 지원내용·담당자·첨부를 표시하며 상세 팝업 이동과 내부 스크롤을 제공합니다.",
      "technology": "CSS Grid/Flex·미디어쿼리·minmax로 영역을 재배치하고 좁은 화면에서는 버튼을 줄바꿈합니다. 넓은 표는 자체 가로 스크롤을 사용하며 label·focus-visible·상태 텍스트·본문 건너뛰기를 적용합니다. SFR 비교 레이어는 Pointer Events로 이동·크기 조절합니다.",
      "data": "settings.homeOrder·homeVisible과 공고 programs의 구조화된 상세항목을 브라우저에 저장합니다. 공고 텍스트 첨부는 JSON에 내용까지 포함하고 기존 형식의 누락 필드를 보완합니다. 실서비스 CMS나 공고 DB를 변경한 것은 아닙니다."
    },
    "followup": [
      "실제 이용통계와 사용자 과업으로 콘텐츠 우선순위를 검증하고 대상 단말·브라우저 및 보조기기로 접근성을 점검해야 합니다. 현재 자동 검사는 실제 모바일 픽셀 배치·공식 접근성 인증을 대체하지 않습니다.",
      "DB·서버 설계 제안: 메인 배치 설정, 공고 기본정보·프로그램·담당자·첨부 메타정보를 분리하고 게시 예약·캐시 갱신을 연결합니다. 운영 파일 저장소·CMS 승인·캐시 무효화 작업은 미구현입니다."
    ],
    "menus": [
      {
        "id": "home",
        "label": "공고 › 메인 로그인·공고·주요 질문",
        "route": "home",
        "roles": []
      },
      {
        "id": "home-settings",
        "label": "설정 › 메인·소통 설정",
        "route": "manage/home",
        "roles": [
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-11",
    "name": "공공마이데이터 연계 및 증빙서류 간소화",
    "definition": "공공마이데이터 연계를 통해 사업 신청 시 기업이 직접 제출해야 하는 증빙서류를 온라인으로 조회·확인하여 서류 제출을 간소화하는 기능",
    "details": [
      "◦ 사업 신청 시 필요한 증빙서류 중 공공마이데이터로 제공 가능한 정보를 관계기관과 연계하여 조회할 수 있는 기능을 구현하여야 함",
      "◦ 기업의 정보 제공 동의 후 공공마이데이터를 조회할 수 있도록 동의 절차를 구현하여야 함",
      "◦ 공공마이데이터를 통해 확인 가능한 서류는 별도의 파일 제출 없이 해당 정보를 활용할 수 있도록 구현하여야 함",
      "◦ 공공마이데이터 연계를 통해 제출서류의 중복 제출을 최소화할 수 있도록 구현하여야 함",
      "◦ 공공마이데이터 조회가 불가능하거나 서비스에서 제공되지 않는 경우 기존 방식의 증빙서류 파일 제출이 가능하여야 함"
    ],
    "demo": "동의/미동의, 일괄조회, 미제공·실패 시 단일 파일 대체",
    "remaining": "기관 연계, 동의 법정 문구·목적·보유기간, 암호화",
    "implementation": {
      "design": "접수서류 목록 바로 위에 정보제공 동의를 배치해 조회의 목적과 선택 조건을 먼저 확인하도록 했습니다. 동의가 없는 경우에도 파일 제출 경로를 보여 선택 가능한 제출 방식을 분명하게 했습니다.",
      "screen": "지원기업은 동의 후 필수서류를 일괄 또는 개별 조회합니다. 미제공·실패 항목은 상세에서 재조회하거나 파일을 선택하며 기관은 같은 서류 상태를 조회하고 필요한 보완을 요청합니다.",
      "technology": "업무 함수에서 지원기업 역할·동의·제출 잠금을 검사하고 단일 갱신 단위로 검증한 후 저장합니다. 일괄조회 중 사용 중지 서류 등 오류가 있으면 일부 결과만 남기지 않고 이전 상태로 되돌립니다. 기관 호출은 가상 결과로 대체되어 있습니다.",
      "data": "신청서별 consent·consentAt와 서류별 상태·조회일시·처리이력을 저장합니다. 실제 증빙파일은 이름·크기만 보관하고 주민·기업 행정정보 원문을 수집하지 않습니다. 브라우저 JSON 전체 교체로 다른 PC에서 시연 상태를 복원합니다."
    },
    "followup": [
      "마이데이터 제공기관 연계 계약·인증·전송 규격, 동의 목적·항목·보유기간·철회 절차를 확정해야 합니다. 실제 암호화 통신·원문 보관·파기·열람 감사는 구현되지 않았습니다.",
      "DB 설계 제안: 신청서별 동의 이력과 조회 요청·결과 메타정보를 분리하고 보유기간·파기 상태를 관리합니다. 기관 API 어댑터, 암호화 저장소 및 파기 배치·동의 검증 API는 미구현입니다."
    ],
    "menus": [
      {
        "id": "company-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기업 조회·첨부",
        "route": "documents",
        "step": "3",
        "roles": [
          "company"
        ]
      },
      {
        "id": "manager-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기관 검토",
        "route": "documents",
        "step": "3",
        "roles": [
          "tp",
          "admin"
        ]
      },
      {
        "id": "company-submit",
        "label": "사업신청·관리 › 04 제출 및 보완 · 기업 제출",
        "route": "documents",
        "step": "4",
        "roles": [
          "company"
        ]
      }
    ]
  },
  {
    "id": "SFR-12",
    "name": "공공마이데이터 증빙서류 조회",
    "definition": "사업 신청 및 관리에 필요한 기업의 주요 증빙서류를   공공마이데이터와 연계하여 조회·확인하는 기능",
    "details": [
      "◦ 다음 증빙서류에 대한 공공마이데이터 연계 및 조회 기능을 구현하여야 함",
      "· 사업자등록증명서",
      "· 폐업사실증명서",
      "· 휴업사실증명서",
      "· 표준재무제표증명서",
      "· 국세 납세증명서",
      "· 지방세 납세증명서",
      "· 부가가치세 과세표준증명",
      "· 중소기업확인서",
      "· 4대 사회보험료 완납 증명서",
      "◦ 사업별 신청요건에 따라 필요한 증빙서류를 구분하여 조회할 수 있어야 함",
      "◦ 조회된 공공마이데이터의 정보 및 조회일시 등을 확인할 수 있어야 함",
      "◦ 공공마이데이터 제공기관의 서비스 제공 범위 및 연계방식 변경 등에 따라 대상 서류를 추가·변경할 수 있도록 구현하여야 함"
    ],
    "demo": "서류별 상태·기관·조회시각, 사업별 필수 구분, 대상서류 추가·수정",
    "remaining": "실제 제공항목·기관 규격·만료/유효기간",
    "implementation": {
      "design": "9종 증빙을 같은 표 구조로 정리하고 서류명·제공기관·필수여부·상태·조회일시·처리를 열로 분리했습니다. 색상 배지와 상태명을 함께 표시해 성공·미제출·실패를 색상만으로 판단하지 않게 했습니다.",
      "screen": "사업별 필수 서류와 선택 서류를 구별하고 각 행에서 상세·조회·재조회로 진입합니다. 관리자는 연계서류 설정에서 대상 서류를 추가하거나 명칭·기관·사용 여부를 수정할 수 있습니다.",
      "technology": "documentTypes와 programs.requiredDocs를 참조해 목록과 필수 조건을 생성합니다. 신규 서류 추가 시 기존 신청서에도 미제출 행을 만들고, 사용 중지 서류의 조회를 차단합니다. 실제 기관별 조회 응답 변환은 없습니다.",
      "data": "9종은 seed.json의 초기 대상이며 모든 사업에서 전부 필수인 것은 아닙니다. applications.docs는 서류 식별자로 원장을 참조하고 조회상태·파일 메타정보·이력을 저장합니다. 기존 JSON 복원 시 참조와 제출 근거를 검증합니다."
    },
    "followup": [
      "서류별 실제 제공기관·API·응답항목·유효기간을 확인하고 발급 불가·폐업·체납 등 업무 결과의 해석을 정의해야 합니다. 실제 기관 응답과 화면 상태 사이의 매핑 검증이 필요합니다.",
      "DB 설계 제안: 서류유형 원장, 사업별 필수서류 연결, 신청서별 서류 제출·조회결과를 분리합니다. 유효기간·만료 인덱스와 갱신 알림, 연계 대상 버전 관리 및 원문 보관은 미구현입니다."
    ],
    "menus": [
      {
        "id": "company-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기업 조회·첨부",
        "route": "documents",
        "step": "3",
        "roles": [
          "company"
        ]
      },
      {
        "id": "manager-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기관 검토",
        "route": "documents",
        "step": "3",
        "roles": [
          "tp",
          "admin"
        ]
      },
      {
        "id": "document-settings",
        "label": "설정 › 연계서류 설정",
        "route": "manage/documents",
        "roles": [
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-13",
    "name": "공공마이데이터 활용 신청정보 자동반영",
    "definition": "공공마이데이터를 통해 조회된 기업정보를 사업 신청 및 증빙서류 제출 화면에 자동 반영하여 기업의 정보 입력 및 서류 제출을 최소화하는 기능",
    "details": [
      "◦ 공공마이데이터 조회 정보와 입력 정보가 다른 경우 자동으로 변경하지 않고 불일치 항목을 식별하여 사용자에게 안내하여야 함",
      "◦ 기업이 직접 입력하거나 파일로 첨부하여야 하는 정보와 공공마이데이터를 통해 자동 확인되는 정보를 구분하여 제공하여야 함",
      "◦ 공공마이데이터 조회 결과와 신청서 입력정보 간 불일치 여부를 확인할 수 있어야 함",
      "◦ 동일한 증빙정보를 여러 사업에 반복 제출하는 경우 공공마이데이터를 활용하여 중복 제출을 최소화할 수 있어야 함",
      "◦ 공공마이데이터 조회 및 정보 활용에 대한 기업의 동의 여부를 확인할 수 있어야 함"
    ],
    "demo": "주소 불일치 대표 사례, 명시적 조회값 반영 또는 기존값 유지",
    "remaining": "전체 신청필드 매핑, 동일 정보의 사업 간 재사용 범위·재동의",
    "implementation": {
      "design": "신청기업 정보 입력과 증빙 확인을 별도 단계로 나누고 주소 불일치 시 두 값을 비교하는 팝업을 제공합니다. 자동 덮어쓰기 대신 조회값 반영·기존값 유지 버튼으로 사용자의 선택을 명시하게 했습니다.",
      "screen": "02 단계에서 기업명·대표자·주소를 저장하고 03 단계 사업자등록증명서 상세에서 주소를 비교합니다. 조회 주소를 반영하면 신청서 주소가 바뀌고 기존 주소를 유지하면 별도 증빙 보완이 필요하다고 안내합니다.",
      "technology": "소속 기업과 신청서 잠금을 검사한 뒤 입력값을 저장합니다. 조회로 확인한 뒤 주소를 다시 수정하면 해당 증빙을 보완필요로 바꾸며, 유효한 조회·동의·불일치 상태에서만 비교 선택을 처리합니다.",
      "data": "신청서의 inputAddress와 가상 조회주소 address를 분리하고 선택 결과를 서류 history에 기록합니다. 현재 자동 반영 사례는 주소 한 항목이며 사업 간 동일 증빙 재사용, 전체 신청필드 매핑과 동의 자동 복사는 구현하지 않았습니다."
    },
    "followup": [
      "사업별 동의 목적·유효기간·정보 출처를 확인한 후 재사용 범위와 재동의 조건을 정해야 합니다. 전체 신청필드에 대해 기관 조회항목·표시 형식·충돌 우선순위를 매핑해야 합니다.",
      "DB 설계 제안: 신청서 입력값과 조회 원본·출처·사용자 반영 이력을 구분하고 재사용 가능한 증빙의 버전·유효기간을 관리합니다. 다사업 증빙 참조, 충돌 해결 및 반영 트랜잭션은 미구현입니다."
    ],
    "menus": [
      {
        "id": "company-info",
        "label": "사업신청·관리 › 02 신청기업 정보",
        "route": "documents",
        "step": "2",
        "roles": [
          "company"
        ]
      },
      {
        "id": "company-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기업 조회·첨부",
        "route": "documents",
        "step": "3",
        "roles": [
          "company"
        ]
      }
    ]
  },
  {
    "id": "SFR-14",
    "name": "공공마이데이터 서류제출현황 관리",
    "definition": "기업 및 사업관리기관이 사업별 공공마이데이터 증빙서류의 제출 및 조회현황을 확인하고 관리할 수 있는 기능",
    "details": [
      "◦ 기업이 신청한 사업별 증빙서류의 제출 및 조회현황을 확인할 수 있어야 함",
      "◦ 기업 화면에서 증빙서류별 제출상태를 확인할 수 있어야 함",
      "◦ 사업관리기관은 신청기업별·사업별 증빙서류 제출현황을 조회할 수 있어야 함",
      "◦ 증빙서류별로 제출완료, 미제출, 조회완료, 조회실패, 보완필요 등의 상태를 구분하여 제공하여야 함",
      "◦ 사업관리기관이 미제출 및 보완이 필요한 증빙서류를 확인하고 기업에 보완을 요청할 수 있어야 함",
      "◦ 기업별·사업별·서류별 제출현황을 검색 및 조회할 수 있어야 함"
    ],
    "demo": "기업별/사업별 신청서 선택, 서류상태 필터, 기관의 보완요청",
    "remaining": "서버 검색·필터·권한·대량 목록, 보완 알림",
    "implementation": {
      "design": "사업 선택 → 신청기업 정보 → 접수서류 확인 → 제출 및 보완의 4단계로 진행 위치를 고정했습니다. 기업·사업 선택과 신청서 상태를 위에 두고 서류상태 필터로 확인해야 할 항목을 좁히도록 구성했습니다.",
      "screen": "기업은 자신의 신청서를, 관리기관은 소관 지역 신청서를 선택합니다. 서류별 제출·조회 근거와 보완 사유를 확인하고 04 단계에서 필수 준비상태·제출완료·보완 후 재제출을 점검합니다.",
      "technology": "허용된 신청서 목록을 세션 역할·기업·지역으로 필터링합니다. 필수 서류와 동의 조건을 검증해 미완료 제출을 막고, 제출 이후에는 수정·조회·임시저장을 잠그며 기관 보완요청 후 다시 작성 가능하게 합니다.",
      "data": "applications를 기업·사업 식별자로 구분하고 submission과 docs의 상태를 함께 관리합니다. 서류상태 필터와 선택 신청서 등 화면 맥락은 JSON 시연 메타정보로 복원합니다. 운영 서버 검색·대량 목록 조회는 없습니다."
    },
    "followup": [
      "담당자 배정·기관별 열람 범위·보완 기한·제출취소 정책을 확정하고 서버 권한·검색·페이징·알림에 반영해야 합니다. 제출 도중 여러 사용자가 수정하는 충돌도 처리해야 합니다.",
      "DB 설계 제안: 기업별 사업 신청서, 서류 상태, 보완요청 이력을 분리하고 기업·사업·기관·제출상태 검색 인덱스를 구성합니다. 제출 버전 관리·서버 잠금·동시성 제어와 보완 알림 배치는 미구현입니다."
    ],
    "menus": [
      {
        "id": "business-choice",
        "label": "사업신청·관리 › 01 사업 선택",
        "route": "documents",
        "step": "1",
        "roles": [
          "company",
          "tp",
          "admin"
        ]
      },
      {
        "id": "company-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기업 조회·첨부",
        "route": "documents",
        "step": "3",
        "roles": [
          "company"
        ]
      },
      {
        "id": "manager-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기관 검토",
        "route": "documents",
        "step": "3",
        "roles": [
          "tp",
          "admin"
        ]
      },
      {
        "id": "company-submit",
        "label": "사업신청·관리 › 04 제출 및 보완 · 기업 제출",
        "route": "documents",
        "step": "4",
        "roles": [
          "company"
        ]
      },
      {
        "id": "manager-review",
        "label": "사업신청·관리 › 04 제출 및 보완 · 기관 보완요청",
        "route": "documents",
        "step": "4",
        "roles": [
          "tp",
          "admin"
        ]
      }
    ]
  },
  {
    "id": "SFR-15",
    "name": "공공마이데이터 조회결과 및 보완관리",
    "definition": "공공마이데이터 조회 과정에서 발생하는 오류 및 보완사항을 관리하고 조회·제출 처리이력을 확인하는 기능",
    "details": [
      "◦ 공공마이데이터 조회 실패, 기업정보 불일치, 정보 미제공 등의 발생 상황을 확인할 수 있어야 함",
      "◦ 조회 실패 시 기업이 실패사유 및 조치방법을 확인할 수 있도록 안내하여야 함",
      "◦ 공공마이데이터 조회에 실패한 경우 재조회할 수 있는 기능을 제공하여야 함",
      "◦ 사업관리기관은 기업별 증빙서류의 보완 필요 여부를 확인하고 보완을 요청할 수 있어야 함",
      "◦ 공공마이데이터 조회, 제출, 보완 및 재조회 등에 대한 처리이력을 관리할 수 있어야 함",
      "◦ 조회된 정보의 조회일시 등 관련 이력을 확인할 수 있어야 함"
    ],
    "demo": "지연실패→재조회, 미제공→파일, 기관 보완→기업 재제출, 처리이력",
    "remaining": "오류코드·재시도·멱등성·기관 로그·장애 대응",
    "implementation": {
      "design": "오류 상태만 표시하는 대신 상세에 실패·보완 사유와 다음 행동을 함께 배치했습니다. 재조회·파일 제출·보완요청 버튼과 시간순 처리이력을 같은 팝업에 두어 복구 방법과 처리 근거를 확인하도록 했습니다.",
      "screen": "가상 지연 실패 후 재조회 성공, 기관 미제공 시 파일 대체, 관리자 보완요청 후 기업 재제출을 시연합니다. 주소 불일치 해결 이후 새로 발생한 기관 보완요청은 이전 조회 선택으로 해제되지 않도록 구분합니다.",
      "technology": "조회·재조회·파일 제출·보완 함수에서 역할·동의·서류 사용 여부·제출잠금 및 현재 처리 근거를 검증합니다. 미완료 필수서류는 제출을 차단하며 저장소 쓰기나 데이터 검증 실패 시 부분 변경을 남기지 않습니다.",
      "data": "docs의 status·issue·reason·queriedAt·file·history에 결과와 다음 조치 근거를 기록합니다. 가상 시나리오의 상태 전환은 브라우저에서 수행하며 실제 네트워크 오류·자동 재시도 작업·기관 로그를 수집하는 백그라운드 서비스는 없습니다."
    },
    "followup": [
      "제공기관 오류코드를 일시 장애·업무상 미제공·검증 실패로 분류하고 재시도 간격·상한·수동 처리 기준과 사용자 메시지를 정해야 합니다. 운영 장애 알림·재처리 승인·원문 로그 보호도 필요합니다.",
      "DB·서버 설계 제안: 조회 작업·시도별 결과·보완요청·감사이력을 분리하고 요청 식별자와 멱등키로 중복 처리를 방지합니다. 큐·재시도 스케줄러·실패 작업 관리·운영 모니터링 및 관련 인덱스는 미구현입니다."
    ],
    "menus": [
      {
        "id": "company-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기업 조회·첨부",
        "route": "documents",
        "step": "3",
        "roles": [
          "company"
        ]
      },
      {
        "id": "manager-docs",
        "label": "사업신청·관리 › 03 접수서류 확인 · 기관 검토",
        "route": "documents",
        "step": "3",
        "roles": [
          "tp",
          "admin"
        ]
      },
      {
        "id": "company-submit",
        "label": "사업신청·관리 › 04 제출 및 보완 · 기업 제출",
        "route": "documents",
        "step": "4",
        "roles": [
          "company"
        ]
      },
      {
        "id": "manager-review",
        "label": "사업신청·관리 › 04 제출 및 보완 · 기관 보완요청",
        "route": "documents",
        "step": "4",
        "roles": [
          "tp",
          "admin"
        ]
      }
    ]
  }
];
  /* SFR-CATALOG-END */
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function badge(text) { var color=/완료|가능|접수중|모집중/.test(text)?'green':/실패/.test(text)?'red':/보완|대기|현행화/.test(text)?'orange':/미제출|중지/.test(text)?'gray':'';return '<span class="rms-badge rms-badge-'+color+'">'+esc(text)+'</span>'; }
  function btn(text,action,id,style) { return '<button type="button" class="rms-btn '+(style||'')+'" data-action="'+esc(action)+'" data-id="'+esc(id||'')+'">'+esc(text)+'</button>'; }
  function field(label,name,value,type,extra) { return '<div class="rms-field '+(extra||'')+'"><label for="rms-'+esc(name)+'">'+esc(label)+'</label><input id="rms-'+esc(name)+'" name="'+esc(name)+'" type="'+(type||'text')+'" value="'+esc(value||'')+'"></div>'; }
  function select(label,name,options,value,extra) { return '<div class="rms-field '+(extra||'')+'"><label for="rms-'+esc(name)+'">'+esc(label)+'</label><select id="rms-'+esc(name)+'" name="'+esc(name)+'">'+options.map(function(o){return '<option value="'+esc(o.id)+'"'+(o.id===value?' selected':'')+'>'+esc(o.name)+'</option>';}).join('')+'</select></div>'; }
  function table(caption,headers,rows,compact) { return '<div class="rms-tablewrap" tabindex="0" role="region" aria-label="'+esc(caption)+' (표 가로 스크롤)"><table class="rms-table '+(compact?'rms-compact':'')+'"><caption>'+esc(caption)+'</caption><thead><tr>'+headers.map(function(h){return '<th scope="col">'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'; }
  function empty(message) { return '<div class="rms-empty">'+esc(message)+'</div>'; }
  var sfrRoleNames={company:'지원기업',tp:'관리기관 · 충남TP',admin:'시스템 관리자'};
  function sfrDestination(key) {
    var parts=String(key||'').split('/'),r=requirements.find(function(item){return item.id===parts[0];});
    return parts.length===2&&r?r.menus.find(function(menu){return menu.id===parts[1];}):null;
  }
  function requirementCoverage(r) {
    var labels={design:'디자인 컨셉',screen:'화면 구성·사용 흐름',technology:'적용 기술·동작',data:'데이터 처리·저장 구조'};
    return '<div class="rms-sfr-coverage"><h3>구현된 메뉴 바로가기</h3><ul class="rms-sfr-menus">'+r.menus.map(function(menu){return '<li><span class="rms-sfr-bullet" aria-hidden="true">●</span><div><a href="#'+esc(menu.route)+'" data-action="sfr-navigate" data-id="'+esc(r.id+'/'+menu.id)+'">'+esc(menu.label)+'</a><small>'+esc(menu.roles.length?menu.roles.map(function(role){return sfrRoleNames[role];}).join(' / ')+' · 권한이 없으면 로그인 팝업':'공개 화면 · 로그인 없이 이동')+'</small></div></li>';}).join('')+'</ul><h3>시연 반영 내용 · 현재 구현</h3><p class="rms-sfr-summary">'+esc(r.demo)+'</p><div class="rms-sfr-implementation">'+Object.keys(labels).map(function(key){return '<section><h4>'+labels[key]+'</h4><p>'+esc(r.implementation[key])+'</p></section>';}).join('')+'</div><h3 class="rms-sfr-followup">실서비스 후속 구현 · 구현 계획</h3><p class="rms-sfr-plan-note">아래는 운영 적용을 위한 구현 방안이며, 현재 구축 완료된 기능을 뜻하지 않습니다.</p><ul class="rms-sfr-plans">'+r.followup.map(function(item){return '<li>'+esc(item)+'</li>';}).join('')+'</ul></div>';
  }
  function create(store,ui) {
    var activeSfr=[];
    function codes(kind,all) { return store.getState().classifications.filter(function(c){return c.kind===kind&&(all||(c.active&&(kind!=='work'||c.visible)));}).map(function(c){return {id:c.id,name:(c.parentId?'└ ':'')+c.name};}); }
    function options(kind,label) { return [{id:'',name:label||'전체'}].concat(codes(kind)); }
    function name(id) { return esc(store.label(id)); }
    function head(title,path,description,action) { return '<div class="rms-pagehead"><div><p class="rms-eyebrow">REGIONAL MANAGEMENT SYSTEM</p><h1 id="rms-main" tabindex="-1">'+esc(title)+'</h1>'+(description?'<p class="rms-subtitle">'+esc(description)+'</p>':'')+'</div><div class="rms-pagecontext">'+(action||'')+'<p class="rms-breadcrumb">홈 &nbsp;›&nbsp; '+esc(path||title)+'</p></div></div>'; }
    function tabs(active,kind) { var entries=kind==='doctor'?[['doctors','기술닥터 통합검색'],['matches','매칭·지원 관리'],['stats','통계·성과']]:kind==='support'?[['faq','자주하는 질문'],['questions','소통하기']]:[['manage','표준분류'],['manage/home','메인·소통 설정'],['manage/documents','연계서류 설정']];return '<nav class="rms-tabs" aria-label="세부 업무">'+entries.map(function(x){return '<a href="#'+x[0]+'"'+(x[0]===active?' aria-current="page"':'')+'>'+x[1]+'</a>';}).join('')+'</nav>'; }
    function metric(label,count,unit) {return '<div class="rms-metric"><span>'+esc(label)+'</span><strong>'+esc(count)+'<small>'+esc(unit||'명')+'</small></strong></div>';}
    function faqList(list) { return list.length?'<div class="rms-faqs">'+list.map(function(f){return '<details><summary><span>'+esc(f.title)+'</span></summary><p>'+esc(f.answer)+'</p></details>';}).join('')+'</div>':empty('검색된 질문이 없습니다. 다른 검색어나 업무유형을 선택해 주세요.'); }
    function questionTable(list) { return table('소통하기 공개 질문',[ '업무유형','질문 제목','등록일','답변상태'],list.map(function(q){return '<tr><td>'+name(q.work)+'</td><td><button type="button" class="rms-link" data-action="question" data-id="'+esc(q.id)+'">'+esc(q.title)+'</button></td><td>'+esc(q.date)+'</td><td>'+badge(q.status)+'</td></tr>'; }),true); }
    function home() {
      var s=store.getState(), role=store.getSession().role;
      var cards=s.programs.map(function(p){var status=store.programStatus(p.id);return '<article class="rms-announcement"><div>'+badge(status.label)+' <span class="rms-muted">'+esc(p.region)+'</span></div><h3>'+esc(p.title)+'</h3><p>'+esc(p.category)+'</p><p><strong>접수기간</strong> '+esc(p.start)+' ~ '+esc(p.end)+'</p><p class="rms-program-deadline"><strong>마감</strong> '+esc(p.end)+' '+esc(p.deadlineTime)+'</p><div class="rms-actions">'+btn('상세보기','program',p.id,'rms-btn-small')+btn('신청하기','apply',p.id,'rms-btn-small rms-btn-primary')+'</div></article>';}).join('');
      var blocks={announcements:'<section class="rms-panel"><div class="rms-panelhead"><h2>모집 중인 사업공고</h2>'+(role==='admin'?btn('사업공고 등록','program-edit','','rms-btn-small'):'')+'<span class="rms-count">전체 <strong>'+s.programs.length+'</strong>건</span></div><div class="rms-announcements">'+cards+'</div></section>',help:'<section class="rms-panel"><div class="rms-panelhead"><h2>무엇을 도와드릴까요?</h2><a href="#faq">FAQ 더보기 ›</a></div><form id="rms-faq-search" class="rms-searchbar"><label class="rms-muted" for="rms-home-query">FAQ 검색</label><input id="rms-home-query" name="q" placeholder="궁금한 내용을 검색해 주세요" aria-label="궁금한 내용"><button class="rms-btn rms-btn-primary" type="submit">검색</button></form><div class="rms-chips">'+codes('work').map(function(c){return '<button type="button" class="rms-chip" data-action="faq-work" data-id="'+esc(c.id)+'">'+esc(c.name)+'</button>';}).join('')+'</div>'+faqList(store.searchFaqs('','').items.slice(0,3))+'</section>',questions:'<section class="rms-panel"><div class="rms-panelhead"><h2>최근 질문과 답변</h2><a href="#questions">소통하기 더보기 ›</a></div>'+questionTable(store.visibleQuestions().slice(0,3))+'</section>'};
      return head('기업의 성장을 함께 지원합니다','사업공고','사업 신청부터 기술애로 해결까지, 필요한 업무를 한곳에서 확인하세요.')+'<div class="rms-homegrid"><div>'+s.settings.homeOrder.filter(function(k){return s.settings.homeVisible[k];}).map(function(k){return blocks[k];}).join('')+'</div><aside class="rms-homeaside"><div class="rms-loginbox"><h2>'+(role==='visitor'?'RMS 로그인':'나의 업무')+'</h2><p>'+(role==='visitor'?'로그인하고 신청한 사업과<br>서류 제출현황을 확인하세요.':role==='company'?'가상 한빛정밀님,<br>신청서와 보완 요청을 확인하세요.':'관리기관 업무를<br>이어서 진행하세요.')+'</p>'+btn(role==='visitor'?'로그인':'서류제출현황 확인',role==='visitor'?'login':'go-documents','','')+'<div class="rms-loginlinks">'+(role==='visitor'?'<button type="button" data-action="account-help">아이디 찾기</button><span>│</span><button type="button" data-action="account-help">비밀번호 찾기</button>':'<span>가상 사용자 · '+esc(role==='company'?'지원기업':'관리자')+'</span>')+'</div></div><div class="rms-quick"><a href="#doctors"><b aria-hidden="true">⌕</b>기술닥터 찾기</a><a href="#documents"><b aria-hidden="true">▤</b>서류제출현황</a><a href="#matches"><b aria-hidden="true">⇄</b>매칭현황</a><a href="#faq"><b aria-hidden="true">?</b>자주하는 질문</a></div><div class="rms-asidenote">중소기업 통합콜센터<strong>1357</strong><small>이 화면은 가상 데이터 시연입니다.</small></div></aside></div>';
    }
    function doctors() {
      var f=ui.doctorFilters||{},all=store.getState().doctors,list=store.searchDoctors(f),role=store.getSession().role;
      var form='<form id="rms-doctor-search" class="rms-filter"><div class="rms-fieldgrid">'+field('이름·소속기관·취득기술','q',f.q,'text','rms-span2')+select('기관유형','institution',options('institution'),f.institution)+select('선정연도','year',[{id:'',name:'전체'},{id:'2026',name:'2026년'},{id:'2025',name:'2025년'}],f.year)+select('산업분야','industry',options('industry'),f.industry)+select('기술분야','technology',options('technology'),f.technology)+select('지원가능 지역','region',[{id:'',name:'전국'}].concat(codes('region').map(function(c){return {id:c.name,name:c.name};})),f.region)+select('정렬','sort',[{id:'name',name:'이름순'},{id:'updated',name:'최근 갱신순'},{id:'organization',name:'소속기관순'},{id:'institution',name:'기관유형순'},{id:'technology',name:'기술분야순'},{id:'region',name:'등록지역순'}],f.sort||'name')+'</div><div class="rms-filterfoot"><div class="rms-checkboxes"><label><input type="checkbox" name="available"'+(f.available?' checked':'')+'>지원 가능한 기술닥터만</label><label><input type="checkbox" name="stale"'+(f.stale?' checked':'')+'>정보 현행화 대상만</label></div><div class="rms-actions">'+btn('초기화','doctor-reset')+'<button class="rms-btn rms-btn-primary" type="submit">검색</button></div></div></form>';
      var rows=list.map(function(d){return '<tr><td><input type="checkbox" aria-label="'+esc(d.name)+' 비교 선택" data-compare="'+esc(d.id)+'"'+(ui.selected.has(d.id)?' checked':'')+'></td><td><a href="#doctor/'+esc(d.id)+'"><b>'+esc(d.name)+'</b></a><small>'+esc(d.year)+'년 선정</small></td><td>'+esc(d.organization)+'<small>'+name(d.institution)+' · '+esc(d.owner)+' 등록</small></td><td>'+d.technologies.map(name).join(', ')+'<small>'+esc(d.acquiredTechnology)+'</small></td><td>'+d.supportRegions.map(esc).join(' · ')+'</td><td>'+badge(d.available?'지원가능':'활동중지')+'</td><td>'+esc(d.updatedAt.slice(0,10))+(store.isStale(d)?'<small>'+badge('현행화 대상')+'</small>':'')+'</td></tr>';});
      return head('기술닥터 통합검색','기술닥터 › 통합검색','지역의 경계를 넘어, 기업에 필요한 전문가를 찾아보세요.',role==='tp'||role==='admin'?btn('기술닥터 등록','doctor-edit','','rms-btn-primary'):'')+tabs('doctors','doctor')+'<div class="rms-metrics">'+metric('전체 기술닥터',all.length)+metric('충남 지원가능',all.filter(function(d){return d.supportRegions.includes('충남')&&d.available;}).length)+metric('타지역 등록 전문가',all.filter(function(d){return d.owner!=='충남';}).length)+metric('정보 현행화 대상',all.filter(store.isStale).length)+'</div>'+form+'<section class="rms-panel"><div class="rms-panelhead"><span class="rms-count">검색결과 <strong>'+list.length+'</strong>명</span><div><span id="rms-compare-count" class="rms-muted">'+ui.selected.size+'명 선택 · 최대 3명</span>'+btn('선택 비교','compare','','rms-btn-small')+'</div></div>'+(rows.length?table('기술닥터 검색결과',['비교','기술닥터','소속기관','전문·취득기술','지원가능 지역','활동상태','최종 갱신일'],rows):empty('조건에 맞는 기술닥터가 없습니다. 검색조건을 변경해 주세요.'))+'<div class="rms-tablefoot"><span>등록지역과 지원가능 지역을 구분하여 표시합니다.</span><span>가상 전문가 데이터</span></div></section>';
    }
    function doctorDetail(id) {
      var d=store.getState().doctors.find(function(x){return x.id===id;});if(!d)return head('기술닥터 정보')+empty('존재하지 않는 기술닥터입니다.');var session=store.getSession(),canEdit=session.role==='admin'||session.role==='tp'&&d.owner===session.region;
      var fields=[['이름',d.name],['소속기관',d.organization],['기관유형',store.label(d.institution)],['등록기관',d.owner+'TP'],['산업분야',store.label(d.industry)],['선정연도',d.year+'년'],['기술분야',d.technologies.map(store.label).join(', ')],['지원가능 지역',d.supportRegions.join(' · ')],['상담유형',d.consultations.map(store.label).join(', ')],['학위정보',d.degree],['취득기술',d.acquiredTechnology],['활동상태',d.available?'지원가능':'활동중지'],['주요경력',d.career],['자격증·포상',d.certificates],['선정사유',d.reasons.map(store.label).join(', ')],['최종 갱신일',d.updatedAt.slice(0,10)]];
      return head(d.name+' 기술닥터','기술닥터 › 상세정보',d.organization)+tabs('doctors','doctor')+'<section class="rms-panel"><div class="rms-panelhead"><h2>전문가 기본정보</h2>'+badge(d.available?'지원가능':'활동중지')+'</div><div class="rms-note">등록기관: '+esc(d.owner)+'TP · '+(canEdit?'등록정보를 수정할 수 있습니다.':'다른 등록기관의 정보는 조회만 가능합니다.')+'</div><dl class="rms-profile">'+fields.map(function(f){return '<div><dt>'+f[0]+'</dt><dd>'+esc(f[1])+'</dd></div>';}).join('')+'</dl><div class="rms-actions"><a href="#doctors" class="rms-btn">목록</a>'+(canEdit?btn('등록정보 수정','doctor-edit',d.id):'')+btn('매칭 요청','match-request',d.id,'rms-btn-primary')+'</div></section><section class="rms-panel"><div class="rms-panelhead"><h2>등록정보 변경이력</h2></div>'+(d.history.length?table('기술닥터 변경이력',['변경일시','변경자','변경 항목'],d.history.map(function(h){return '<tr><td>'+esc(h.at.slice(0,19).replace('T',' '))+'</td><td>'+esc(h.by)+'</td><td>'+h.changes.map(function(c){return esc(c.field)+': '+esc(Array.isArray(c.before)?c.before.join(', '):c.before)+' → '+esc(Array.isArray(c.after)?c.after.join(', '):c.after);}).join('<br>')+'</td></tr>';}),true):empty('이 시연에서 등록정보를 수정하면 변경 전·후 값이 기록됩니다.'))+'</section>';
    }
    function matches() {
      var s=store.getState(),r=store.getSession(),list=s.matches.filter(function(m){return r.role==='company'?m.companyId===r.companyId:r.role==='tp'?m.region===r.region:r.role==='admin';});
      return head('매칭·지원 관리','기술닥터 › 매칭·지원 관리','초광역권 매칭 요청부터 기업지원 실적까지 확인합니다.')+tabs('matches','doctor')+(r.role==='visitor'?empty('사용자 역할에서 지원기업 또는 관리기관으로 전환해 주세요.'):'<section class="rms-panel"><div class="rms-panelhead"><h2>매칭 요청 및 지원실적</h2><a href="#doctors" class="rms-btn rms-btn-small">기술닥터 찾기</a></div>'+(list.length?table('매칭 및 지원실적',['요청일','지원기업','기술닥터','기술애로','지원구분','진행상태','처리'],list.map(function(m){var d=s.doctors.find(function(x){return x.id===m.doctorId;});return '<tr><td>'+esc(m.date)+'</td><td>'+esc(m.companyName)+'</td><td><a href="#doctor/'+esc(d.id)+'">'+esc(d.name)+'</a><small>'+esc(d.owner)+' 등록</small></td><td>'+esc(m.request)+(m.result?'<small>지원결과: '+esc(m.result)+'</small>':'')+'</td><td>'+badge(m.region!==d.owner?'지역 간 매칭':'지역 내 매칭')+'</td><td>'+badge(m.status)+'</td><td>'+((r.role==='tp'||r.role==='admin')&&m.status!=='지원완료'?btn(m.status==='요청접수'?'지원 시작':'실적 등록','match-progress',m.id,'rms-btn-small'):'—')+'</td></tr>';})):empty('등록된 매칭 요청이 없습니다. 기술닥터 검색에서 전문가를 선택하세요.'))+'</section>');
    }
    function statsData() { var s=store.getState(),f=ui.statsFilters||{},doctors=s.doctors.filter(function(d){return (!f.region||d.owner===f.region)&&(!f.technology||d.technologies.includes(f.technology))&&(!f.industry||d.industry===f.industry);}), ids=new Set(doctors.map(function(d){return d.id;})),matches=s.matches.filter(function(m){return ids.has(m.doctorId)&&(!f.start||m.date>=f.start)&&(!f.end||m.date<=f.end);});return {doctors:doctors,matches:matches,rows:codes('region').map(function(c){var ds=doctors.filter(function(d){return d.owner===c.name;}),di=new Set(ds.map(function(d){return d.id;})),ms=matches.filter(function(m){return di.has(m.doctorId);});return {region:c.name,registered:ds.length,active:ds.filter(function(d){return d.available;}).length,matched:ms.length,completed:ms.filter(function(m){return m.status==='지원완료';}).length,cross:ms.filter(function(m){return m.region!==c.name;}).length};})}; }
    function stats() {var f=ui.statsFilters||{},v=statsData();return head('기술닥터 통계·성과','기술닥터 › 통계·성과','전문가 현황과 기간별 매칭·기업지원 실적을 확인합니다.')+tabs('stats','doctor')+(store.getSession().role==='visitor'||store.getSession().role==='company'?empty('통계는 관리기관 또는 시스템 관리자 역할에서 확인할 수 있습니다.'):'<form id="rms-stats-search" class="rms-filter"><div class="rms-fieldgrid">'+select('등록지역','region',[{id:'',name:'전국'}].concat(codes('region').map(function(c){return {id:c.name,name:c.name};})),f.region)+select('산업분야','industry',options('industry'),f.industry)+select('기술분야','technology',options('technology'),f.technology)+field('매칭 요청 시작일','start',f.start||'2026-01-01','date')+field('매칭 요청 종료일','end',f.end||'2026-12-31','date')+'</div><div class="rms-actions rms-space"><button class="rms-btn rms-btn-primary" type="submit">통계 조회</button></div></form><div class="rms-metrics">'+metric('등록 전문가',v.doctors.length)+metric('매칭 요청',v.matches.length,'건')+metric('지원완료 실적',v.matches.filter(function(m){return m.status==='지원완료';}).length,'건')+metric('지원완료 기업',new Set(v.matches.filter(function(m){return m.status==='지원완료';}).map(function(m){return m.companyId;})).size,'개사')+'</div><div class="rms-two"><section class="rms-panel"><div class="rms-panelhead"><h2>지역별 전문가 현황</h2></div><div class="rms-chart">'+v.rows.map(function(r){return '<div class="rms-bar"><span>'+esc(r.region)+'</span><progress value="'+r.registered+'" max="'+Math.max(1,...v.rows.map(function(x){return x.registered;}))+'" aria-label="'+esc(r.region)+' 등록 전문가 '+r.registered+'명"></progress><b>'+r.registered+'명</b></div>';}).join('')+'</div></section><section class="rms-panel"><div class="rms-panelhead"><h2>집계 기준</h2></div><ul class="rms-checks"><li>등록·활동 현황은 현재 가상 데이터 기준입니다.</li><li>기간은 매칭 요청일에 적용합니다.</li><li>지원실적은 지원완료 상태의 매칭 건수입니다.</li><li>지원기업 수는 기업 ID의 중복을 제거합니다.</li><li>지역 간 매칭은 기업 지역과 등록지역을 비교합니다.</li></ul></section></div><section class="rms-panel"><div class="rms-panelhead"><h2>지역별 매칭 및 지원실적</h2>'+btn('CSV 내려받기','stats-export','','rms-btn-small')+'</div>'+table('지역별 기술닥터 통계',['등록지역','등록 전문가','활동 전문가','매칭 요청','지원완료','지역 간 매칭'],v.rows.map(function(r){return '<tr><td>'+esc(r.region)+'</td><td>'+r.registered+'</td><td>'+r.active+'</td><td>'+r.matched+'</td><td>'+r.completed+'</td><td>'+r.cross+'</td></tr>';}))+'</section>'); }
    function documents(id,step) {
      var s=store.getState(),session=store.getSession(),apps=store.getApplications();if(session.role==='visitor')return head('사업신청 · 서류제출현황')+empty('사용자 역할을 지원기업 또는 관리기관으로 전환하면 신청서와 서류제출현황을 확인할 수 있습니다.')+'<div class="rms-actions rms-space">'+btn('로그인 시연','login','','rms-btn-primary')+'</div>';
      var a=apps.find(function(x){return x.id===id;})||apps[0];if(!a)return head('서류제출현황')+empty('조회 가능한 신청서가 없습니다.');ui.appId=a.id;var p=s.programs.find(function(x){return x.id===a.programId;}), filtered=a.docs.filter(function(d){return !ui.docStatus||d.status===ui.docStatus;}),company=session.role==='company';
      step=['1','2','3','4'].includes(String(step))?String(step):'3';
      var labels=['사업 선택','신청기업 정보','접수서류 확인','제출 및 보완'];
      var top=head(step==='3'?'서류제출현황':labels[Number(step)-1],'사업신청 › '+labels[Number(step)-1],'신청기업과 관리기관이 같은 신청서와 서류 현황을 확인합니다.')+'<nav aria-label="사업신청 단계"><ol class="rms-steps">'+labels.map(function(label,i){return '<li'+(step===String(i+1)?' aria-current="step"':'')+'><button type="button" data-action="document-step" data-id="'+(i+1)+'"'+(step===String(i+1)?' aria-current="step"':'')+'>0'+(i+1)+' '+label+'</button></li>';}).join('')+'</ol></nav>';
      var locked=a.submission==='제출완료';
      if(step==='1')return top+'<section class="rms-panel"><h2>신청할 사업 선택</h2><p class="rms-muted rms-space">현재 신청서: '+esc(a.companyName)+' / '+esc(p.title)+'</p><div class="rms-announcements rms-space">'+s.programs.map(function(program){var existing=apps.filter(function(x){return x.programId===program.id;});return '<article class="rms-announcement"><h3>'+esc(program.title)+'</h3><p>'+esc(program.region)+' · '+esc(program.category)+'</p><p><strong>접수기간</strong> '+esc(program.start)+' ~ '+esc(program.end)+'</p><p class="rms-program-deadline"><strong>마감</strong> '+esc(program.end)+' '+esc(program.deadlineTime)+'</p><div class="rms-actions">'+btn('사업 상세','program',program.id,'rms-btn-small')+existing.map(function(x){return btn(x.companyName+' 신청서 열기','application-open',x.id,'rms-btn-small');}).join('')+(company&&!existing.length?btn('신청하기','apply',program.id,'rms-btn-primary'):'')+'</div></article>';}).join('')+'</div><div class="rms-actions rms-space">'+btn('다음: 신청기업 정보','document-step','2','rms-btn-primary')+'</div></section>';
      if(step==='2')return top+'<section class="rms-panel"><div class="rms-panelhead"><h2>'+esc(p.title)+'</h2>'+badge(a.submission)+'</div><p class="rms-note">'+(company&&!locked?'기업정보를 수정한 뒤 저장하세요. 단계 버튼으로 이동할 때도 저장합니다.':'신청기업 정보를 조회합니다. '+(locked?'제출완료 신청서는 보완요청 후 수정할 수 있습니다.':'기업정보 수정은 지원기업만 가능합니다.'))+'</p><form id="rms-company-form" data-id="'+esc(a.id)+'"><fieldset'+(!company||locked?' disabled':'')+'><div class="rms-fieldgrid rms-cols2">'+field('기업명 *','companyName',a.companyName)+field('대표자 *','representative',a.representative)+field('신청서 주소 *','inputAddress',a.inputAddress,'text','rms-span2')+'</div></fieldset><p class="rms-muted rms-space">기업 소재지: '+esc(a.region)+'</p><div class="rms-actions rms-space">'+btn('이전: 사업 선택','document-step','1')+(company&&!locked?'<button type="submit" class="rms-btn rms-btn-save">기업정보 저장</button>':'')+btn('다음: 접수서류 확인','document-step','3','rms-btn-primary')+'</div></form></section>';
      if(step==='4'){
        var missing=p.requiredDocs.filter(function(id){var d=a.docs.find(function(x){return x.specId===id;});return !(d.status==='제출완료'||d.status==='조회완료'&&a.consent);});
        return top+'<section class="rms-panel"><div class="rms-panelhead"><h2>'+esc(p.title)+' · '+esc(a.companyName)+'</h2>'+badge(a.submission)+'</div><p class="rms-note">'+(locked?'신청서 제출이 완료되었습니다. 기관 검토 및 보완요청을 기다려 주세요.':missing.length?'필수서류 '+missing.length+'건을 완료해야 제출할 수 있습니다.':'필수서류가 준비되었습니다. 신청서를 제출할 수 있습니다.')+'</p>'+table('제출 및 보완 확인',['서류명','필수여부','상태','보완사항','처리'],a.docs.filter(function(d){return p.requiredDocs.includes(d.specId)||d.status==='보완필요';}).map(function(d){var spec=s.documentTypes.find(function(x){return x.id===d.specId;});return '<tr><td>'+esc(spec.name)+'</td><td>'+(p.requiredDocs.includes(d.specId)?'필수':'선택')+'</td><td>'+badge(d.status)+'</td><td>'+esc(d.reason||'—')+'</td><td>'+btn(company&&!locked?'확인 / 보완':'상세','doc-detail',d.specId,'rms-btn-small')+(!company?btn('보완요청','supplement',d.specId,'rms-btn-small'):'')+'</td></tr>';}))+'<div class="rms-actions rms-space">'+btn('이전: 접수서류 확인','document-step','3')+(company&&!locked?btn('임시저장','draft',a.id,'rms-btn-save')+btn('신청서 제출','submit',a.id,'rms-btn-primary'):'')+'</div></section>';
      }
      return top+'<form id="rms-application-filter" class="rms-filter"><div class="rms-fieldgrid">'+select('신청기업 · 사업','application',apps.map(function(x){return {id:x.id,name:x.companyName+' / '+s.programs.find(function(y){return y.id===x.programId;}).title};}),a.id,'rms-span2')+field('신청서 상태','submission',a.submission)+field('기업 소재지','companyRegion',a.region)+'</div></form><section class="rms-panel"><div class="rms-panelhead"><h2>'+esc(p.title)+'</h2>'+badge(a.submission)+'</div><dl class="rms-profile"><div><dt>기업명</dt><dd>'+esc(a.companyName)+'</dd></div><div><dt>대표자</dt><dd>'+esc(a.representative)+'</dd></div><div class="rms-wide"><dt>신청서 주소</dt><dd>'+esc(a.inputAddress)+'</dd></div></dl>'+(company?'<label class="rms-consent"><input type="checkbox" id="rms-consent"'+(a.consent?' checked':'')+(a.submission==='제출완료'?' disabled':'')+'><span><strong>증빙서류 조회를 위한 정보 제공에 동의합니다.</strong><small>목적: '+esc(p.title)+' 신청서류 확인 · 항목: 선택한 증빙서류와 기업 기본정보<br>제공대상: 해당 사업 관리기관 · 보유기간/동의문은 실연계 전 협의가 필요합니다.<br>현재는 실제 동의 효력이 없는 시연입니다. 동의하지 않아도 파일 제출로 진행할 수 있습니다.</small></span></label>':'<div class="rms-note">기업 정보제공 동의: <b>'+(a.consent?'동의함':'동의하지 않음')+'</b>'+(a.consentAt?' · '+esc(a.consentAt.slice(0,19).replace('T',' ')):'')+' · 기업별 서류를 확인하고 보완을 요청할 수 있습니다.</div>')+'<div class="rms-panelhead"><h2>접수서류</h2>'+(company?btn('필수서류 일괄조회','query-required',a.id,'rms-btn-small rms-btn-primary'):'')+'</div><div class="rms-statusrow">'+['','미제출','조회완료','조회실패','보완필요','제출완료'].map(function(k){return '<button type="button" data-action="doc-status" data-id="'+k+'" aria-pressed="'+(ui.docStatus===k)+'">'+(k||'전체')+' '+a.docs.filter(function(d){return !k||d.status===k;}).length+'</button>';}).join('')+'</div>'+table('접수서류 목록',['순번','서류명 / 제공기관','필수여부','제출상태','조회일시 / 첨부파일','처리'],filtered.map(function(d,i){var spec=s.documentTypes.find(function(x){return x.id===d.specId;}),required=p.requiredDocs.includes(d.specId),locked=a.submission==='제출완료';return '<tr><td>'+(i+1)+'</td><td><b>'+esc(spec.name)+'</b><small>'+esc(spec.provider)+(spec.active?'':' · 연계 중지')+'</small></td><td>'+(required?'<span class="rms-required">필수</span>':'선택')+'</td><td>'+badge(d.status)+(d.reason?'<small>'+esc(d.reason)+'</small>':'')+'</td><td>'+(d.file?esc(d.file.name)+'<small>파일명·크기만 보관</small>':d.queriedAt?esc(d.queriedAt.slice(0,19).replace('T',' ')):'—')+'</td><td><div class="rms-actions">'+btn('상세','doc-detail',d.specId,'rms-btn-small')+(company&&!locked?btn(d.status==='조회실패'?'재조회':'조회',d.status==='조회실패'?'doc-retry':'doc-query',d.specId,'rms-btn-small'):'')+(!company?btn('보완요청','supplement',d.specId,'rms-btn-small'):'')+'</div></td></tr>';}))+'<p class="rms-muted rms-space">9종은 우선 연계대상입니다. 필수 여부는 사업별로 다릅니다. 서류당 한 파일을 선택하며 여러 파일은 ZIP으로 묶습니다.</p><div class="rms-actions rms-space">'+btn('이전: 신청기업 정보','document-step','2')+(company&&!locked?btn('임시저장','draft',a.id,'rms-btn-save')+btn('신청서 제출','submit',a.id,'rms-btn-primary'):'')+btn('다음: 제출 및 보완','document-step','4','rms-btn-primary')+'</div></section>';
    }
    function faq(questionsOnly) { var result=store.searchFaqs(ui.faqQuery,ui.faqWork);return head(questionsOnly?'소통하기':'자주하는 질문','소통관리 › '+(questionsOnly?'소통하기':'FAQ'),'업무유형과 궁금한 내용을 함께 검색하세요.')+tabs(questionsOnly?'questions':'faq','support')+'<section class="rms-panel"><form id="rms-faq-search" class="rms-searchbar">'+select('업무유형','work',options('work'),ui.faqWork)+'<div class="rms-field rms-span2" ><label for="rms-faq-query">검색어</label><input name="q" id="rms-faq-query" value="'+esc(ui.faqQuery)+'" placeholder="제목·내용·답변·키워드 검색"></div><button class="rms-btn rms-btn-primary" type="submit">검색</button>'+btn('초기화','faq-reset')+'</form>'+(questionsOnly?questionTable(store.publicQuestions().filter(function(q){return (!ui.faqWork||q.work===ui.faqWork)&&(!ui.faqQuery||[q.title,q.answer].join(' ').includes(ui.faqQuery));})):'<p class="rms-muted rms-space">'+(result.related?'정확히 일치하는 항목이 없어 글자·키워드가 관련된 질문을 제안합니다.':'검색결과 '+result.items.length+'건')+'</p>'+faqList(result.items))+'</section>';
    }
    function manage(sub) {
      if(store.getSession().role!=='admin')return head('관리자 설정')+empty('사용자 역할을 시스템 관리자로 전환해 주세요.');var s=store.getState(),active=sub?'manage/'+sub:'manage',html='';
      if(sub==='home')html='<div class="rms-two"><section class="rms-panel"><div class="rms-panelhead"><h2>메인 콘텐츠 배치</h2></div>'+s.settings.homeOrder.map(function(k,i){return '<div class="rms-sortable"><label class="rms-checkrow"><input type="checkbox" data-home-visible="'+k+'"'+(s.settings.homeVisible[k]?' checked':'')+'>'+({announcements:'모집 중인 사업공고',help:'FAQ 검색·주요 질문',questions:'최근 질문·답변'})[k]+'</label>'+btn('위로','home-up',k,'rms-btn-small')+'</div>';}).join('')+'<p class="rms-muted rms-space">설정한 순서와 노출 여부는 메인화면에 바로 반영됩니다.</p></section><section class="rms-panel"><div class="rms-panelhead"><h2>기존 업무분류 매핑</h2></div><form id="rms-work-map"><div class="rms-fieldgrid rms-cols2">'+select('기존 분류','from',codes('work',true),s.classifications.find(function(c){return c.kind==='work';}).id)+select('변경 분류','to',codes('work',true),'W03')+'</div><p class="rms-muted rms-space">선택한 분류의 FAQ와 소통 게시물에 동일한 업무분류를 적용합니다.</p><div class="rms-actions rms-space"><button class="rms-btn" type="submit">매핑 적용</button></div></form></section></div><section class="rms-panel"><div class="rms-panelhead"><h2>소통 게시물 메인 노출</h2></div>'+table('게시물 노출 설정',['제목','공개여부','메인 노출'],s.questions.map(function(q){return '<tr><td>'+esc(q.title)+'</td><td>'+badge(q.public?'공개':'비공개')+'</td><td><label class="rms-checkrow"><input type="checkbox" data-question-visible="'+q.id+'"'+(q.mainVisible?' checked':'')+(!q.public?' disabled':'')+'>메인에 표시</label></td></tr>';}),true)+'</section>';
      else if(sub==='documents')html='<section class="rms-panel"><div class="rms-panelhead"><h2>공공마이데이터 연계 대상</h2>'+btn('대상 서류 추가','doc-type-edit','','rms-btn-small rms-btn-primary')+'</div>'+table('증빙서류 대상 설정',['코드','서류명','제공기관','연계 사용','관리'],s.documentTypes.map(function(d){return '<tr><td>'+d.id+'</td><td>'+esc(d.name)+'</td><td>'+esc(d.provider)+'</td><td>'+badge(d.active?'사용':'중지')+'</td><td>'+btn('수정','doc-type-edit',d.id,'rms-btn-small')+'</td></tr>';}))+'<p class="rms-muted rms-space">기관명은 대상 서류를 설명하기 위한 표시입니다. 실제 API 제공기관·규격은 연계 협의로 확정합니다.</p></section>';
      else {var kind=ui.codeKind||'technology',list=s.classifications.filter(function(c){return c.kind===kind;});html='<section class="rms-panel"><div class="rms-panelhead"><h2>표준 분류체계</h2>'+btn('분류 추가','code-edit','','rms-btn-small rms-btn-primary')+'</div><div class="rms-chips">'+Object.entries({industry:'산업분야',technology:'기술분야',consultation:'상담유형',institution:'기관유형',region:'지원가능 지역',reason:'선정사유',work:'소통 업무유형'}).map(function(x){return '<button type="button" class="rms-chip" data-action="code-kind" data-id="'+x[0]+'" aria-pressed="'+(kind===x[0])+'">'+x[1]+'</button>';}).join('')+'</div><div class="rms-space">'+table('분류체계 관리',['코드','분류명','상위분류','사용','노출','관리'],list.map(function(c){return '<tr><td>'+esc(c.id)+'</td><td>'+esc(c.name)+'</td><td>'+name(c.parentId||'—')+'</td><td>'+badge(c.active?'사용':'중지')+'</td><td>'+badge(c.visible?'노출':'숨김')+'</td><td><div class="rms-actions">'+btn('수정','code-edit',c.id,'rms-btn-small')+btn('삭제','code-delete',c.id,'rms-btn-small rms-btn-danger')+'</div></td></tr>';}))+'</div><p class="rms-muted rms-space">가상 표준코드입니다. 사용 중인 코드는 삭제를 제한하고, 업무유형의 사용·노출 여부를 FAQ와 소통 화면에 적용합니다.</p></section>';}
      return head('관리자 설정','관리자 › 기능개선 설정','분류와 화면 노출, 연계 대상 서류를 관리합니다.')+tabs(active,'manage')+html;
    }
    function requirementsTable() {
      return '<section class="rms-panel rms-requirements"><div class="rms-panelhead"><h2>제안요청서 기능 요구사항 SFR-01~15</h2><span>15개 전체 펼침</span></div><p class="rms-note">제안요청서에서 추출한 정의와 세부내용 전체입니다. 화면의 SFR 강조 표시는 해당 요구사항의 시연 반영을 뜻하며, 실서비스 연계까지 완료되었다는 의미는 아닙니다.</p>'+table('제안요청서 SFR 전체 내용',['번호 / 요구사항','정의 및 세부내용 전체','시연 반영 내용 / 실서비스 후속 구현'],requirements.map(function(r){return '<tr id="'+esc(r.id)+'" data-sfr-row="'+esc(r.id)+'" tabindex="-1"><th scope="row"><strong>'+esc(r.id)+'</strong><p>'+esc(r.name)+'</p></th><td><p class="rms-sfr-definition">'+esc(r.definition)+'</p><ul class="rms-sfr-details">'+r.details.map(function(detail){return '<li>'+esc(detail)+'</li>';}).join('')+'</ul></td><td>'+requirementCoverage(r)+'</td></tr>';}))+'</section>';
    }
    function guide() { var groups=[['01','기술닥터 통합검색','지원기업 역할 → 복합 검색 → 최대 3명 비교 → 매칭 요청 → 충남TP에서 지원 시작·실적 등록 → 통계 CSV.','doctors'],['02','제출서류 간소화','지원기업 역할 → 정보제공 동의 → 일괄조회 → 주소 불일치 확인 → 실패 재조회 또는 파일 첨부 → 제출 → 기관 보완요청.','documents'],['03','메인·소통 관리','메인 FAQ 검색 → 업무별 질문 → 관리자 역할에서 분류·노출·배치 변경 → 메인에서 결과 확인.','manage/home']];return head('시연 안내','시연 안내','가상 데이터로 고객과 화면·처리 흐름을 검토하는 사전 개발본입니다.')+requirementsTable()+'<div class="rms-note">각 화면의 저장·제출·조회 등으로 확정한 변경사항은 현재 브라우저의 smtech.rms.prototype.v1 전용 저장소에 반영됩니다. JSON 파일을 매번 만들 필요는 없습니다. 작업을 마친 뒤 상단 시연내용 JSON 내보내기를 누르면 지원 브라우저에서 폴더를 선택하여 저장된 전체 자료와 시연 역할·화면·검색조건을 파일로 보관합니다. 지원하지 않는 환경에서는 일반 다운로드 안내를 제공합니다. 입력만 하고 저장하지 않은 내용은 포함되지 않습니다. 다른 PC에서 JSON 불러오기를 하면 현재 전체 자료를 파일 내용으로 교체하고 시연 역할·화면·검색조건도 복원합니다. 실제 인증과 열린 팝업은 옮기지 않습니다. 다른 브라우저·주소에서는 저장소가 다르며 브라우저 데이터 삭제 시 사라질 수 있으므로, 보관·이동·초기화 전에는 JSON으로 백업하세요. 접수 증빙 첨부파일은 이름·크기만 저장합니다. 사업공고의 시연용 텍스트 첨부파일은 내용까지 JSON에 포함하므로 다른 PC에서도 내려받을 수 있습니다.</div><div class="rms-announcements">'+groups.map(function(g){return '<article class="rms-guidecard"><strong>'+g[0]+'</strong><h2>'+g[1]+'</h2><p>'+g[2]+'</p><a href="#'+g[3]+'" class="rms-btn">화면 열기</a></article>';}).join('')+'</div><section class="rms-panel rms-space"><div class="rms-panelhead"><h2>시연 범위와 확인 기준</h2></div><ul class="rms-checks"><li>제안요청서 SFR-01~15의 주요 화면과 처리 원리를 시연합니다.</li><li>모든 기업·전문가·공고·서류·실적은 가상입니다.</li><li>SMTECH 인증, 공공마이데이터, DB, 알림 전송은 연결하지 않습니다.</li><li>실제 접수서류 화면의 표 구조와 단일 첨부 방식은 사용자매뉴얼 26쪽을 참고했습니다.</li><li>기술닥터 화면은 공개 소스의 스타일과 제안요청서를 바탕으로 설계한 개선안입니다.</li><li>역할 전환은 시연용입니다. 실제 접근제어는 서버에서 검증해야 합니다.</li><li>9종 서류 중 사업별 필수 서류만 제출 조건으로 확인합니다.</li><li>현행화 기준 12개월, 매칭 상태 및 통계 집계는 협의 전 가정입니다.</li></ul></section>'; }
    function withSfr(view,ids) {
      return function(){
        var selected=typeof ids==='function'?ids.apply(null,arguments):ids;
        var items=requirements.filter(function(r){return selected.includes(Number(r.id.slice(4)));});
        activeSfr=items;return view.apply(null,arguments);
      };
    }
    function sfrMarkup() {return activeSfr.length?'<aside class="rms-sfr" aria-label="현재 화면에 반영된 요구사항"><span>현재 화면 반영 SFR · 시연</span><div>'+activeSfr.map(function(r){return '<button type="button" class="rms-sfr-highlight" data-action="sfr-open" data-id="'+esc(r.id)+'" aria-haspopup="dialog" title="'+esc(r.name)+'">'+esc(r.id)+'</button>';}).join('')+'</div></aside>':'';}
    return {sfrMarkup:sfrMarkup,home:withSfr(home,[6,7,8,9,10]),doctors:withSfr(doctors,[1,2,3,4]),doctorDetail:withSfr(doctorDetail,[1,2,3,4]),matches:withSfr(matches,[3]),stats:withSfr(stats,[5]),statsData:statsData,documents:withSfr(documents,function(id,step){return String(step)==='1'?[14]:String(step)==='2'?[13]:String(step)==='4'?[14,15]:[11,12,13,14,15];}),faq:withSfr(faq,function(questionsOnly){return questionsOnly?[8,9]:[7,8];}),manage:withSfr(manage,function(section){return section==='home'?[8,9,10]:section==='documents'?[12]:[2,8];}),guide:withSfr(guide,[]),codes:codes,options:options,head:head};
  }
  root.RMSViews={requirementCoverage:requirementCoverage,sfrDestination:sfrDestination,sfrRoleNames:sfrRoleNames,requirement:function(id){return requirements.find(function(r){return r.id===id;});},create:create,esc:esc,badge:badge,btn:btn,field:field,select:select,table:table,empty:empty};
}(window));
