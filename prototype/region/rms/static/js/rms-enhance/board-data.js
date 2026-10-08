/* Public board content shared by both home concepts and public board pages. */
(function(root){
  'use strict';
  var labels={notice:'공지사항',qna:'Q&A',faq:'FAQ',resources:'자료실'};
  var types=['notice','qna','faq','resources'];
  var notices=[
    {id:'N001',title:'2026년 지역기업 지원사업 온라인 신청 안내',date:'2026-10-08',category:'사업안내',body:'지역기업 지원사업 공고를 확인한 뒤 신청할 사업을 선택해 주세요.\n\n사업 선택 → 신청기업 정보 작성 → 접수서류 확인 → 제출 및 보완 순서로 신청합니다.\n최종 제출이 완료되어야 접수가 완료되며, 임시저장한 신청서는 서류제출현황에서 이어서 작성할 수 있습니다.'},
    {id:'N002',title:'공공 마이데이터 수신자료 확인 및 서류제출 안내',date:'2026-10-07',category:'서비스안내',body:'사업신청의 접수서류 화면에서 수신한 공공 마이데이터 정보를 확인할 수 있습니다.\n\n정보 제공 동의 후 필요한 서류를 조회하고, 수신결과 보고서에서 증명정보와 신청정보를 비교해 주세요.\n조회가 지원되지 않거나 보완이 필요한 서류는 직접 발급한 파일로 제출할 수 있습니다.'},
    {id:'N003',title:'기술닥터 초광역권 검색·매칭 서비스 이용 안내',date:'2026-10-06',category:'기술지원',body:'기업 소재지 외의 기술닥터도 전문분야와 지원가능 지역을 확인하여 매칭을 요청할 수 있습니다.\n\n기술닥터 찾기에서 산업·기술분야, 기관유형, 지원지역을 조합해 검색해 주세요.\n상세 화면에서 전문정보를 확인하고 우리 기업의 기술애로를 작성하면 매칭현황에서 진행 상태를 확인할 수 있습니다.'},
    {id:'N004',title:'사업신청 마감일 및 최종 제출 유의사항',date:'2026-10-05',category:'접수안내',body:'사업별 접수 마감일과 마감 시간을 반드시 확인해 주세요.\n\n신청정보를 저장한 뒤 필수서류의 제출상태를 확인하고 최종 제출을 진행합니다.\n마감 직전에는 접속량이 늘어날 수 있으므로 충분한 시간을 두고 신청을 완료해 주세요.'},
    {id:'N005',title:'공지사항·Q&A·FAQ·자료실 공개 열람 안내',date:'2026-10-02',category:'이용안내',body:'공지사항, 공개 Q&A, FAQ, 자료실은 로그인하지 않아도 조회할 수 있습니다.\n\n메인화면에는 게시판별 최근 5건을 표시합니다. 제목을 누르면 상세 내용을 확인하고 더보기를 누르면 해당 게시판 목록으로 이동합니다.\n개별 신청서와 서류, 비공개 문의는 해당 업무 권한에 따라 조회합니다.'},
    {id:'N006',title:'온라인 신청서 보완 요청 확인 방법',date:'2026-10-01',category:'접수안내',body:'보완 요청은 서류제출현황에서 확인합니다.\n\n요청된 서류와 보완사유를 확인한 후 다시 조회하거나 파일을 첨부해 제출해 주세요.\n제출기한 및 세부 보완사항은 해당 사업 관리기관의 안내를 확인해 주세요.'}
  ];
  var resources=[
    {id:'R001',title:'지역기업 지원사업 온라인 신청 가이드',date:'2026-10-08',category:'이용매뉴얼',body:'온라인 사업신청의 단계별 이용방법입니다. 사업 선택, 신청기업 정보 작성, 접수서류 확인, 최종 제출 절차를 안내합니다.',attachment:{name:'RMS-온라인신청-가이드.txt',url:'downloads/boards/online-application-guide.txt',content:'RMS 온라인 사업신청 가이드\n\n1. 사업공고에서 지원대상, 접수기간, 필수서류를 확인합니다.\n2. 로그인 후 신청하기를 눌러 신청기업 정보를 작성합니다.\n3. 접수서류에서 정보 제공 동의 후 서류를 조회하거나 파일을 첨부합니다.\n4. 필수서류 완료 여부를 확인하고 신청서를 최종 제출합니다.\n5. 서류제출현황에서 기관 검토와 보완 요청을 확인합니다.\n'}},
    {id:'R002',title:'공공 마이데이터 수신결과 확인 가이드',date:'2026-10-07',category:'서류제출',body:'수신된 증명자료를 보고서 형태로 확인하고 신청정보와 비교하는 방법을 안내합니다.',attachment:{name:'RMS-수신결과-확인가이드.txt',url:'downloads/boards/mydata-report-guide.txt',content:'공공 마이데이터 수신결과 확인 가이드\n\n1. 사업신청의 접수서류 확인 화면을 엽니다.\n2. 필요한 서류의 조회 상태를 확인합니다.\n3. 수신결과 보고서에서 제공기관, 증명자료, 상세 항목을 확인합니다.\n4. 신청정보와 수신정보의 불일치 항목을 비교합니다.\n5. 반영할 값을 직접 선택하거나 발급 파일로 보완합니다.\n'}},
    {id:'R003',title:'기업 기본정보 및 증빙서류 준비 체크리스트',date:'2026-10-06',category:'신청자료',body:'사업신청 전 준비할 기업정보와 제출서류를 확인할 수 있는 체크리스트입니다. 사업별 필수서류는 공고를 우선 확인해 주세요.',attachment:{name:'RMS-서류준비-체크리스트.txt',url:'downloads/boards/document-checklist.txt',content:'기업 기본정보 및 증빙서류 준비 체크리스트\n\n[ ] 기업명, 대표자, 사업장 주소 확인\n[ ] 사업별 신청자격과 접수 마감 확인\n[ ] 사업자등록증명 등 기업 기본 증빙 확인\n[ ] 국세·지방세 납세 관련 자료 확인\n[ ] 우대가점 해당 여부 및 증빙 확인\n[ ] 필수서류 제출상태 확인\n[ ] 신청서 최종 제출 확인\n'}},
    {id:'R004',title:'기술닥터 검색 및 매칭 요청 이용 가이드',date:'2026-10-05',category:'기술지원',body:'전문가 복합검색, 비교, 상세정보 확인 및 기술애로 매칭 요청 방법을 안내합니다.',attachment:{name:'RMS-기술닥터-이용가이드.txt',url:'downloads/boards/doctor-matching-guide.txt',content:'기술닥터 검색 및 매칭 요청 가이드\n\n1. 기술닥터 찾기에서 전문분야와 지원가능 지역을 선택합니다.\n2. 검색결과에서 기관, 취득기술, 활동 여부를 확인합니다.\n3. 후보 전문가를 선택해 비교하고 상세정보를 읽습니다.\n4. 기업의 기술애로를 작성하여 매칭을 요청합니다.\n5. 매칭·지원 현황에서 처리 상태와 지원 결과를 확인합니다.\n'}},
    {id:'R005',title:'접수서류 보완 제출 안내문',date:'2026-10-02',category:'서류제출',body:'기관의 보완 요청을 확인하고 해당 서류를 다시 제출하는 절차를 안내합니다.',attachment:{name:'RMS-보완제출-안내문.txt',url:'downloads/boards/supplement-guide.txt',content:'접수서류 보완 제출 안내\n\n1. 서류제출현황에서 보완필요 상태를 확인합니다.\n2. 기관이 입력한 보완사유와 대상 서류를 확인합니다.\n3. 해당 서류를 다시 조회하거나 직접 발급한 파일을 첨부합니다.\n4. 서류명, 발급일 및 신청기업 정보가 맞는지 확인합니다.\n5. 보완 완료 후 제출합니다.\n'}},
    {id:'R006',title:'RMS 공개 게시판 이용 안내',date:'2026-10-01',category:'이용매뉴얼',body:'공지사항, 공개 Q&A, FAQ, 자료실의 검색과 상세 조회 방법을 안내합니다.',attachment:{name:'RMS-게시판-이용안내.txt',url:'downloads/boards/board-guide.txt',content:'RMS 공개 게시판 이용 안내\n\n공지사항, 공개 Q&A, FAQ, 자료실은 로그인 없이 조회할 수 있습니다.\n메인에는 최근 5건이 표시됩니다.\n제목을 누르면 이동 가능한 상세 레이어가 열립니다.\n더보기를 누르면 해당 게시판 전체 목록으로 이동합니다.\n자료실 상세의 첨부파일을 눌러 안내자료를 내려받을 수 있습니다.\n'}}
  ];
  function list(type,store){
    if(type==='notice')return notices.slice();
    if(type==='resources')return resources.slice();
    if(type==='qna')return store.publicQuestions().map(function(q){return {id:q.id,title:q.title,date:q.date,category:store.label(q.work),status:q.status,body:q.body||q.content||q.title,answer:q.answer||'',work:q.work};});
    if(type==='faq')return store.searchFaqs('','').items.map(function(q){return {id:q.id,title:q.title,date:'상시',category:store.label(q.work),body:q.answer,work:q.work,keywords:q.keywords||[]};});
    return [];
  }
  root.RMSBoards={labels:labels,types:types,list:list,get:function(type,id,store){return list(type,store).find(function(row){return row.id===id;});},all:function(store){return types.reduce(function(rows,type){return rows.concat(list(type,store).map(function(row){return Object.assign({type:type},row);}));},[]);}};
}(window));
