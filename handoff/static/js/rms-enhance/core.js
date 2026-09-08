/* RMS enhancement business layer. No dependencies, DOM calls or production endpoints. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RMSCore = api;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var KEY = 'rms.prototype.v1';
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  var now = function () { return new Date().toISOString(); };
  var roles = ['visitor', 'company', 'tp', 'admin'];
  var statuses = ['미제출', '조회완료', '조회실패', '보완필요', '제출완료'];
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function clean(s, max) { assert(typeof s === 'string' && s.trim().length > 0 && s.length <= (max || 500), '필수 입력값과 입력 길이를 확인해 주세요.'); return s.trim(); }
  function safeTree(value, depth) {
    assert(depth < 15, 'JSON 구조가 너무 깊습니다.');
    if (typeof value === 'string') assert(value.length <= 20000, 'JSON 문자열이 너무 깁니다.');
    if (value && typeof value === 'object') Object.keys(value).forEach(function (k) {
      assert(['__proto__', 'prototype', 'constructor'].indexOf(k) < 0, '허용되지 않는 JSON 속성입니다.');
      safeTree(value[k], depth + 1);
    });
  }
  function validate(data) {
    safeTree(data, 0);
    assert(data && data.schemaVersion === 1, '지원하지 않는 JSON 형식입니다. schemaVersion 1 파일을 선택하세요.');
    ['classifications','doctors','users','programs','documentTypes','applications','faqs','questions','matches','audit'].forEach(function (k) {
      assert(Array.isArray(data[k]) && data[k].length <= 5000, k + ' 목록이 올바르지 않습니다.');
      var ids = new Set();
      data[k].forEach(function (row) { assert(row && typeof row === 'object' && !Array.isArray(row), k + ' 항목 형식 오류'); if (k !== 'audit') { clean(row.id, 80); assert(!ids.has(row.id), '중복 ID: ' + row.id); ids.add(row.id); } });
    });
    var codeIds = new Set(data.classifications.map(function(c) { return c.id; }));
    data.classifications.forEach(function(c) { clean(c.name, 100); assert(['industry','technology','consultation','institution','region','reason','work'].indexOf(c.kind)>=0,'분류 종류 오류'); assert(typeof c.active==='boolean' && typeof c.visible==='boolean','분류 사용/노출 값 오류'); assert(typeof c.parentId==='string' && (!c.parentId || codeIds.has(c.parentId)), '상위 분류 오류'); var seen=new Set([c.id]), p=c; while(p.parentId){p=data.classifications.find(function(x){return x.id===p.parentId;});assert(p && p.kind===c.kind && !seen.has(p.id),'분류 순환/종류 오류');seen.add(p.id);} });
    data.doctors.forEach(function(d) { ['name','organization','owner','institution','industry','year','degree','career','certificates','acquiredTechnology','userId'].forEach(function(k){clean(d[k],2000);}); ['technologies','supportRegions','consultations','reasons','history'].forEach(function(k){assert(Array.isArray(d[k]),'기술닥터 '+k+' 형식 오류');}); assert(d.technologies.length && d.supportRegions.length,'기술·지역을 선택하세요.'); assert(typeof d.available==='boolean' && !isNaN(Date.parse(d.updatedAt)),'기술닥터 상태·날짜 오류'); [d.institution,d.industry].concat(d.technologies,d.consultations,d.reasons).forEach(function(id){assert(codeIds.has(id),'미등록 분류: '+id);}); });
    data.doctors.forEach(function(d){
      assert(data.users.some(function(u){return u.id===d.userId;}),'존재하지 않는 SMTECH 사용자');
      [['institution',[d.institution]],['industry',[d.industry]],['technology',d.technologies],['consultation',d.consultations],['reason',d.reasons]].forEach(function(pair){assert(pair[1].length>0&&pair[1].every(function(id){return data.classifications.some(function(c){return c.id===id&&c.kind===pair[0];});}),'전문분류 종류가 올바르지 않습니다.');});
      assert(d.supportRegions.every(function(r){return data.classifications.some(function(c){return c.kind==='region'&&c.name===r;});}),'미등록 지원가능 지역');
    });
    assert(new Set(data.doctors.map(function(d){return d.userId;})).size===data.doctors.length,'SMTECH 사용자 중복등록입니다.');
    data.users.forEach(function(u){clean(u.name,100);clean(u.organization,300);});
    data.documentTypes.forEach(function(d){clean(d.name,100);clean(d.provider,100);assert(typeof d.active==='boolean','서류 사용값 오류');});
    data.programs.forEach(function(p){clean(p.title,300);clean(p.region,30);clean(p.category,100);assert(Array.isArray(p.requiredDocs) && p.requiredDocs.every(function(id){return data.documentTypes.some(function(d){return d.id===id;});}),'사업별 필수서류 오류');assert(!isNaN(Date.parse(p.start))&&!isNaN(Date.parse(p.end)),'공고 기간 오류');});
    data.applications.forEach(function(a){['companyId','companyName','region','representative','address','inputAddress'].forEach(function(k){clean(a[k],500);}); assert(data.programs.some(function(p){return p.id===a.programId;}),'존재하지 않는 사업');assert(typeof a.consent==='boolean' && Array.isArray(a.docs),'신청서 형식 오류');assert(['작성중','임시저장','제출완료'].indexOf(a.submission)>=0,'신청 상태 오류');assert(a.docs.length===data.documentTypes.length && new Set(a.docs.map(function(d){return d.specId;})).size===a.docs.length,'서류 목록 오류');a.docs.forEach(function(d){assert(data.documentTypes.some(function(t){return t.id===d.specId;}) && statuses.indexOf(d.status)>=0 && Array.isArray(d.history),'서류 상태 오류');assert(typeof d.reason==='string','서류 사유 오류'); if(d.file){clean(d.file.name,255);assert(Number.isFinite(d.file.size)&&d.file.size>=0,'파일 크기 오류');}});});
    data.applications.forEach(function(a){
      a.docs.forEach(function(d){
        if(d.status==='제출완료')assert(d.file&&d.file.size>0&&d.file.size<=10*1024*1024&&/\.(pdf|hwp|hwpx|jpg|jpeg|png|zip)$/i.test(d.file.name),'제출완료 서류의 파일 정보가 없습니다.');
        if(d.status==='조회완료')assert(d.queriedAt&&!isNaN(Date.parse(d.queriedAt))&&d.history.some(function(h){return h.action==='조회'||h.action==='재조회';}),'조회완료 서류의 조회 근거가 없습니다.');
      });
      if(a.submission==='제출완료'){
        var required=data.programs.find(function(p){return p.id===a.programId;}).requiredDocs;
        assert(required.every(function(id){var d=a.docs.find(function(x){return x.specId===id;});return d.status==='제출완료'||(d.status==='조회완료'&&a.consent);}), '필수서류가 완료되지 않은 제출완료 신청서입니다.');
      }
    });
    data.faqs.forEach(function(f){clean(f.title,300);clean(f.answer,5000);assert(Array.isArray(f.keywords)&&f.keywords.every(function(x){return typeof x==='string';}),'키워드 형식 오류');assert(data.classifications.some(function(c){return c.id===f.work&&c.kind==='work';})&&typeof f.published==='boolean','FAQ 분류 오류');});
    data.questions.forEach(function(q){clean(q.title,300);assert(typeof q.answer==='string' && typeof q.public==='boolean' && typeof q.mainVisible==='boolean' && codeIds.has(q.work),'소통 게시물 오류');assert(['답변대기','답변완료'].indexOf(q.status)>=0&&!isNaN(Date.parse(q.date)),'게시물 상태 오류');});
    data.matches.forEach(function(m){assert(data.doctors.some(function(d){return d.id===m.doctorId;}),'매칭 전문가 오류');['companyId','companyName','region','request'].forEach(function(k){clean(m[k],2000);});assert(['요청접수','지원진행','지원완료'].indexOf(m.status)>=0&&!isNaN(Date.parse(m.date))&&typeof m.result==='string','매칭 상태 오류');});
    assert(data.settings && Array.isArray(data.settings.homeOrder) && data.settings.homeOrder.length===3 && new Set(data.settings.homeOrder).size===3 && data.settings.homeOrder.every(function(k){return ['announcements','help','questions'].indexOf(k)>=0;}),'메인 배치 설정 오류');
    assert(data.settings.homeVisible && ['announcements','help','questions'].every(function(k){return typeof data.settings.homeVisible[k]==='boolean';}),'메인 노출 설정 오류');
    assert(Number.isInteger(data.settings.staleMonths)&&data.settings.staleMonths>0&&data.settings.staleMonths<=60,'현행화 기준 오류');
    return data;
  }
  function createStore(seed, storage) {
    validate(seed);
    var state = clone(seed), session = {role:'visitor', region:'충남', companyId:'CO001'}, loadWarning='';
    if (storage) { try { var saved=storage.getItem(KEY); if(saved) state=validate(JSON.parse(saved)); } catch(e) { loadWarning='저장 데이터를 읽지 못해 가상 초기자료를 불러왔습니다. ' + e.message; } }
    function update(action, fn) { var next=clone(state); var result=fn(next); next.audit.unshift({at:now(),role:session.role,action:action});next.audit=next.audit.slice(0,300);validate(next);if(storage) storage.setItem(KEY,JSON.stringify(next));state=next;return result; }
    function signed() { assert(session.role!=='visitor','사용자 역할에서 지원기업 또는 관리기관으로 전환해 주세요.'); }
    function manager() { assert(['tp','admin'].indexOf(session.role)>=0,'관리기관 또는 관리자만 처리할 수 있습니다.'); }
    function admin() { assert(session.role==='admin','시스템 관리자만 설정할 수 있습니다.'); }
    function doctor(s,id) { var d=s.doctors.find(function(x){return x.id===id;});assert(d,'기술닥터를 찾을 수 없습니다.');return d; }
    function editable(d) { manager(); assert(session.role==='admin'||d.owner===session.region,'등록기관 담당자만 이 기술닥터를 수정할 수 있습니다.'); }
    function application(s,id) { signed();var a=s.applications.find(function(x){return x.id===id;});assert(a,'신청서를 찾을 수 없습니다.');assert(session.role!=='company'||a.companyId===session.companyId,'본인 기업의 신청서만 확인할 수 있습니다.');assert(session.role!=='tp'||a.region===session.region,'소관 지역의 신청서만 관리할 수 있습니다.');return a; }
    function doc(s,appId,id) { var a=application(s,appId), d=a.docs.find(function(x){return x.specId===id;});assert(d,'서류를 찾을 수 없습니다.');return {a:a,d:d}; }
    function log(d,action,reason) {d.history.unshift({at:now(),action:action,reason:reason||'',role:session.role});}
    function writable(a){assert(a.submission!=='제출완료','제출완료 신청서는 기관의 보완요청 후 수정할 수 있습니다.');}
    function queryOne(s,a,d,retry){
      assert(session.role==='company','지원기업 역할에서 조회하세요.');writable(a);
      assert(a.consent,'정보 제공에 동의한 후 조회할 수 있습니다.');
      assert(s.documentTypes.some(function(t){return t.id===d.specId&&t.active;}),'사용 중지된 서류입니다.');
      d.queriedAt=now();d.issue='';
      if(d.specId==='F06'&&!retry){d.status='조회실패';d.issue='timeout';d.reason='제공기관 응답 지연 (가상). 재조회하거나 파일을 첨부해 주세요.';}
      else if(d.specId==='F09'){d.status='조회실패';d.issue='unavailable';d.reason='가상 연계기관에서 정보를 제공하지 않습니다. 파일로 제출해 주세요.';}
      else if(d.specId==='F01'&&a.inputAddress!==a.address){d.status='보완필요';d.issue='mismatch';d.reason='신청서 주소와 조회 주소가 다릅니다. 비교 후 반영 여부를 선택하세요.';}
      else{d.status='조회완료';d.reason='가상 정보 조회 완료';}
      log(d,retry?'재조회':'조회',d.reason);
    }
    function label(id){var c=state.classifications.find(function(x){return x.id===id;});return c?c.name:id;}
    function searchDoctors(f) { f=f||{};var text=(f.q||'').toLowerCase().trim();return state.doctors.filter(function(d){return (!text || [d.name,d.organization,d.acquiredTechnology].concat(d.technologies.map(label)).join(' ').toLowerCase().indexOf(text)>=0) && (!f.region||d.supportRegions.indexOf(f.region)>=0) && (!f.owner||d.owner===f.owner) && (!f.industry||d.industry===f.industry) && (!f.technology||d.technologies.indexOf(f.technology)>=0) && (!f.institution||d.institution===f.institution) && (!f.year||d.year===f.year) && (!f.available||d.available) && (!f.stale||isStale(d));}).sort(function(a,b){ if(f.sort==='updated')return b.updatedAt.localeCompare(a.updatedAt);if(f.sort==='organization')return a.organization.localeCompare(b.organization,'ko');if(f.sort==='institution')return label(a.institution).localeCompare(label(b.institution),'ko');if(f.sort==='technology')return a.technologies.map(label).join().localeCompare(b.technologies.map(label).join(),'ko');if(f.sort==='region')return a.owner.localeCompare(b.owner,'ko');return a.name.localeCompare(b.name,'ko');});}
    function isStale(d){var base=new Date(seed.demoDate+'T00:00:00+09:00');base.setMonth(base.getMonth()-state.settings.staleMonths);return new Date(d.updatedAt)<base;}
    return {
      getState:function(){return clone(state);}, getSession:function(){return clone(session);},loadWarning:loadWarning,label:label,isStale:isStale,
      setRole:function(role){assert(roles.indexOf(role)>=0,'역할 오류');session.role=role;},
      searchDoctors:searchDoctors,
      visibleQuestions:function(){return state.questions.filter(function(q){return q.public&&q.mainVisible&&state.classifications.some(function(c){return c.id===q.work&&c.kind==='work'&&c.active&&c.visible;});}).sort(function(a,b){return b.date.localeCompare(a.date);});},
      publicQuestions:function(){return state.questions.filter(function(q){return q.public&&state.classifications.some(function(c){return c.id===q.work&&c.kind==='work'&&c.active&&c.visible;});}).sort(function(a,b){return b.date.localeCompare(a.date);});},
      searchFaqs:function(query,work){var q=(query||'').trim().toLowerCase();var allowed=state.classifications.filter(function(c){return c.kind==='work'&&c.active&&c.visible;}).map(function(c){return c.id;});var all=state.faqs.filter(function(f){return f.published&&allowed.indexOf(f.work)>=0&&(!work||f.work===work);});var direct=all.filter(function(f){return [f.title,f.answer].concat(f.keywords).join(' ').toLowerCase().indexOf(q)>=0;});if(direct.length||!q)return {items:direct,related:false};var tokens=q.split(/\s+/).filter(Boolean);var related=all.map(function(f){var text=[f.title,f.answer].concat(f.keywords).join(' ').toLowerCase();var score=tokens.reduce(function(n,t){return n+(text.indexOf(t)>=0?3:0);},0);for(var i=0;i<q.length-1;i++){if(text.indexOf(q.slice(i,i+2))>=0)score++;}return {item:f,score:score};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,4).map(function(x){return x.item;});return {items:related,related:true};},
      saveDoctor:function(input){return update('기술닥터 정보 저장',function(s){manager();var old=input.id?doctor(s,input.id):null;if(old)editable(old);var user=s.users.find(function(u){return u.id===input.userId;});assert(user,'SMTECH 가상 사용자를 선택하세요.');assert(!s.doctors.some(function(d){return d.userId===input.userId&&d.id!==input.id;}),'이미 등록된 SMTECH 사용자입니다.');var d=Object.assign({},old||{id:'D'+Date.now(),owner:session.region,history:[]},input,{name:user.name,updatedAt:now()});d.id=old?old.id:'D'+Date.now();if(old)d.owner=old.owner;else d.owner=session.region; ['organization','degree','career','certificates','acquiredTechnology'].forEach(function(k){d[k]=clean(d[k],2000);}); var changes=old?Object.keys(input).filter(function(k){return JSON.stringify(old[k])!==JSON.stringify(d[k]);}).map(function(k){return {field:k,before:old[k],after:d[k]};}):[{field:'등록',before:null,after:user.name}];d.history.unshift({at:now(),by:session.role==='admin'?'시스템 관리자':session.region+'TP 담당자',changes:changes});if(old)s.doctors[s.doctors.indexOf(old)]=d;else s.doctors.push(d);return d.id;});},
      saveCode:function(input){return update('표준분류 저장',function(s){admin();var existing=s.classifications.find(function(c){return c.id===input.id;});var c={id:input.id||'X'+Date.now(),kind:input.kind,name:clean(input.name,100),parentId:input.parentId||'',active:!!input.active,visible:!!input.visible};if(existing){assert(existing.kind===c.kind,'기존 분류의 종류는 변경할 수 없습니다.');if(c.kind==='region'&&existing.name!==c.name)s.doctors.forEach(function(d){d.supportRegions=d.supportRegions.map(function(r){return r===existing.name?c.name:r;});});s.classifications[s.classifications.indexOf(existing)]=c;}else s.classifications.push(c);});},
      removeCode:function(id){return update('표준분류 삭제',function(s){admin();assert(!s.classifications.some(function(c){return c.parentId===id;}),'하위 분류가 있어 삭제할 수 없습니다.');var c=s.classifications.find(function(x){return x.id===id;});assert(c,'분류를 찾을 수 없습니다.');var used=s.doctors.some(function(d){return [d.industry,d.institution].concat(d.technologies,d.consultations,d.reasons).indexOf(id)>=0||(c.kind==='region'&&d.supportRegions.indexOf(c.name)>=0);})||s.faqs.some(function(f){return f.work===id;})||s.questions.some(function(q){return q.work===id;});assert(!used,'사용 중인 분류입니다. 삭제 대신 사용을 해제하거나 매핑을 변경하세요.');s.classifications=s.classifications.filter(function(x){return x.id!==id;});});},
      mapWork:function(from,to){return update('소통 업무분류 매핑',function(s){admin();assert(from!==to,'서로 다른 업무유형을 선택하세요.');[from,to].forEach(function(id){assert(s.classifications.some(function(c){return c.id===id&&c.kind==='work';}),'업무유형 오류');});s.faqs.concat(s.questions).forEach(function(f){if(f.work===from)f.work=to;});});},
      requestMatch:function(id,request){return update('기술닥터 매칭 요청',function(s){signed();var d=doctor(s,id);assert(d.available&&d.supportRegions.indexOf(session.region)>=0,'현재 지역에서 지원 가능한 기술닥터가 아닙니다.');assert(!s.matches.some(function(m){return m.doctorId===id&&m.companyId===session.companyId&&m.status!=='지원완료';}),'진행 중인 동일 전문가 매칭 요청이 있습니다.');s.matches.unshift({id:'M'+Date.now(),doctorId:id,companyId:session.companyId,companyName:'가상 한빛정밀',region:session.region,request:clean(request,1000),date:now().slice(0,10),status:'요청접수',result:''});});},
      progressMatch:function(id,status,result){return update('매칭 실적 갱신',function(s){manager();var m=s.matches.find(function(x){return x.id===id;});assert(m,'매칭 요청이 없습니다.');assert(session.role==='admin'||m.region===session.region,'소관 지역 요청만 처리할 수 있습니다.');assert((m.status==='요청접수'&&status==='지원진행')||(m.status==='지원진행'&&status==='지원완료'),'순서대로 지원진행 → 지원완료 처리해 주세요.');m.status=status;m.result=status==='지원완료'?clean(result,1000):'';});},
      getApplications:function(){if(session.role==='visitor')return [];return clone(state.applications.filter(function(a){return session.role==='company'?a.companyId===session.companyId:session.role==='tp'?a.region===session.region:true;}));},
      startApplication:function(programId){var existing=state.applications.find(function(a){return a.programId===programId&&a.companyId===session.companyId;});assert(session.role==='company','지원기업 역할에서 신청하세요.');if(existing)return existing.id;return update('가상 신청서 생성',function(s){assert(s.programs.some(function(p){return p.id===programId;}),'사업이 없습니다.');var a=clone(s.applications.find(function(x){return x.companyId===session.companyId;}));assert(a,'가상 기업 기본정보가 없습니다.');a.id='A'+Date.now();a.programId=programId;a.consent=false;a.consentAt=null;a.submission='작성중';a.docs=s.documentTypes.map(function(t){return {specId:t.id,status:'미제출',queriedAt:null,reason:'',file:null,history:[]};});s.applications.push(a);return a.id;});},
      saveApplicationInfo:function(id,input){return update('신청기업 정보 저장',function(s){assert(session.role==='company','지원기업만 신청기업 정보를 수정할 수 있습니다.');var a=application(s,id);writable(a);var address=clean(input.inputAddress,500);a.companyName=clean(input.companyName,200);a.representative=clean(input.representative,200);if(a.inputAddress!==address){var d=a.docs.find(function(x){return x.specId==='F01';});if(d&&d.status!=='미제출'){d.status='보완필요';d.issue='manual';d.reason='신청서 주소가 변경되었습니다. 다시 조회하거나 증빙파일을 제출해 주세요.';log(d,'신청정보 변경',d.reason);}}a.inputAddress=address;});},
      consent:function(id,yes){return update(yes?'정보제공 동의':'정보제공 동의 철회',function(s){assert(session.role==='company','지원기업 역할에서 정보제공 동의를 선택하세요.');var a=application(s,id);writable(a);a.consent=!!yes;a.consentAt=yes?now():null;});},
      queryDocument:function(appId,id,retry){return update(retry?'증빙서류 재조회':'증빙서류 조회',function(s){var v=doc(s,appId,id);queryOne(s,v.a,v.d,retry);});},
      queryRequired:function(appId){return update('필수서류 일괄조회',function(s){var a=application(s,appId),p=s.programs.find(function(x){return x.id===a.programId;});p.requiredDocs.forEach(function(id){queryOne(s,a,a.docs.find(function(d){return d.specId===id;}),false);});});},
      resolveMismatch:function(appId,apply){return update('주소 불일치 확인',function(s){assert(session.role==='company','지원기업만 입력값을 선택할 수 있습니다.');var v=doc(s,appId,'F01');writable(v.a);assert(v.a.consent&&v.d.queriedAt&&v.d.issue==='mismatch','현재 조회에서 주소 불일치가 확인된 항목만 처리할 수 있습니다.');v.d.issue='';if(apply){v.a.inputAddress=v.a.address;v.d.status='조회완료';v.d.reason='사용자가 조회 주소 반영을 선택함';}else{v.d.status='보완필요';v.d.issue='manual';v.d.reason='기존 주소 유지. 별도 증빙 파일을 제출해 주세요.';}log(v.d,apply?'조회값 반영':'기존값 유지',v.d.reason);});},
      attachFile:function(appId,id,file){return update('증빙 파일 제출',function(s){assert(session.role==='company','지원기업만 증빙파일을 제출할 수 있습니다.');var v=doc(s,appId,id);writable(v.a);assert(file&&/\.(pdf|hwp|hwpx|jpg|jpeg|png|zip)$/i.test(file.name),'PDF, HWP, HWPX, 이미지 또는 ZIP을 선택하세요.');assert(file.size>0&&file.size<=10*1024*1024,'파일은 0바이트 초과, 10MB 이하로 선택하세요.');v.d.file={name:clean(file.name,255),size:file.size};v.d.status='제출완료';v.d.issue='';v.d.reason='파일명·크기만 저장하는 시연입니다.';log(v.d,'파일 제출',file.name);});},
      requestSupplement:function(appId,id,reason){return update('보완 요청',function(s){manager();var v=doc(s,appId,id);v.d.status='보완필요';v.d.issue='supplement';v.d.reason=clean(reason,1000);v.a.submission='작성중';log(v.d,'보완 요청',v.d.reason);});},
      submitApplication:function(id,draft){return update(draft?'신청서 임시저장':'사업 신청서 제출',function(s){assert(session.role==='company','지원기업 역할에서 제출하세요.');var a=application(s,id);writable(a);if(!draft){var p=s.programs.find(function(x){return x.id===a.programId;});var missing=p.requiredDocs.filter(function(k){var d=a.docs.find(function(x){return x.specId===k;});return !d||!((d.status==='조회완료'&&a.consent)||d.status==='제출완료');});assert(!missing.length,'필수서류를 확인하세요. 조회완료 또는 제출완료 상태여야 합니다. 동의 철회 시 파일 제출이 필요합니다.');}a.submission=draft?'임시저장':'제출완료';});},
      updateQuestion:function(id,mainVisible){return update('소통 메인노출 변경',function(s){admin();var q=s.questions.find(function(x){return x.id===id;});assert(q,'게시물이 없습니다.');assert(!mainVisible||q.public,'비공개 게시물은 메인에 노출할 수 없습니다.');q.mainVisible=!!mainVisible;});},
      updateSettings:function(settings){return update('메인화면 배치 설정',function(s){admin();s.settings=clone(settings);});},
      saveDocumentType:function(input){return update('증빙서류 대상 설정',function(s){admin();var d=s.documentTypes.find(function(x){return x.id===input.id;});if(d){d.name=clean(input.name,100);d.provider=clean(input.provider,100);d.active=!!input.active;}else{var id='F'+Date.now();s.documentTypes.push({id:id,name:clean(input.name,100),provider:clean(input.provider,100),active:true});s.applications.forEach(function(a){a.docs.push({specId:id,status:'미제출',queriedAt:null,reason:'',file:null,history:[]});});}});},
      exportJson:function(){return JSON.stringify(state,null,2);},
      importJson:function(text){assert(text.length<=5*1024*1024,'JSON은 5MB 이하로 선택하세요.');var next=validate(JSON.parse(text));if(storage)storage.setItem(KEY,JSON.stringify(next));state=clone(next);},
      reset:function(){if(storage)storage.setItem(KEY,JSON.stringify(seed));state=clone(seed);session.role='visitor';}
    };
  }
  return {createStore:createStore,validate:validate,storageKey:KEY};
}));
