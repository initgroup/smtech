/* Local orchestration. Production integration swaps the adapter; existing globals are untouched. */
(function () {
  'use strict';
  var root=document.getElementById('rms-enhance-app'),host=document.getElementById('rms-dialog-host'),store,views,modalReturnFocus,toastTimer;
  var ui={doctorFilters:{},statsFilters:{},selected:new Set(),faqQuery:'',faqWork:'',docStatus:'',codeKind:'technology',appId:''};
  var V=window.RMSViews,e=V.esc,b=V.btn;
  function toast(message) {var el=document.getElementById('rms-toast');el.textContent=message;el.setAttribute('data-visible','');clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.removeAttribute('data-visible');},5000);}
  function showError(error) { var target=host.querySelector('[data-dialog-error]');if(target){target.hidden=false;target.textContent=error.message||String(error);target.focus();}else toast(error.message||String(error)); }
  function closeModal() {var d=host.querySelector('dialog');if(d){d.close();host.replaceChildren();}if(modalReturnFocus&&modalReturnFocus.isConnected)modalReturnFocus.focus();}
  function modal(title,body,options) {modalReturnFocus=document.activeElement;host.innerHTML='<dialog class="rms-dialog'+(options&&options.program?' rms-dialog-program':'')+'" aria-labelledby="rms-dialog-title"><div class="rms-dialoghead"><h2 id="rms-dialog-title"'+(options&&options.draggable?' tabindex="0" data-dialog-move title="제목 드래그 또는 방향키로 이동"':'')+'>'+e(title)+'</h2><button type="button" aria-label="닫기" data-action="close">×</button></div><div class="rms-dialogbody"><div class="rms-error" data-dialog-error tabindex="-1" role="alert" hidden></div>'+body+'</div></dialog>';var d=host.querySelector('dialog');d.addEventListener('cancel',function(ev){ev.preventDefault();closeModal();});d.showModal();if(options&&options.draggable)movableDialog(d);}
  function movableDialog(d) {
    var handle=d.querySelector('[data-dialog-move]'),drag;
    function rect(){var r=d.getBoundingClientRect();return {left:parseFloat(d.style.left)||r.left||8,top:parseFloat(d.style.top)||r.top||8,width:r.width||Math.min(1180,(window.innerWidth||1024)-16),height:r.height||Math.min(650,(window.innerHeight||768)-16)};}
    function place(x,y){var r=rect(),vw=window.innerWidth||1024,vh=window.innerHeight||768;d.style.inset='auto';d.style.margin='0';d.style.left=Math.max(8,Math.min(x,vw-r.width-8))+'px';d.style.top=Math.max(8,Math.min(y,vh-r.height-8))+'px';}
    handle.addEventListener('pointerdown',function(ev){if(ev.button!==0)return;ev.preventDefault();handle.focus();var r=rect();drag={x:ev.clientX,y:ev.clientY,left:r.left,top:r.top,id:ev.pointerId};if(handle.setPointerCapture)handle.setPointerCapture(ev.pointerId);});
    handle.addEventListener('pointermove',function(ev){if(drag&&drag.id===ev.pointerId)place(drag.left+ev.clientX-drag.x,drag.top+ev.clientY-drag.y);});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){handle.addEventListener(type,function(){drag=null;});});
    handle.addEventListener('keydown',function(ev){var delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[ev.key];if(delta){ev.preventDefault();var r=rect();place(r.left+delta[0],r.top+delta[1]);}});
    function resize(){if(!d.isConnected){window.removeEventListener('resize',resize);return;}if(d.style.left){var r=rect();place(r.left,r.top);}}
    window.addEventListener('resize',resize);
    d.addEventListener('close',function(){window.removeEventListener('resize',resize);});
  }
  function route() {return (location.hash.slice(1)||'home').split('/');}
  function go(path) {closeModal();if(location.hash==='#'+path)render(true);else location.hash=path;}
  function render(focus) {var p=route(),r=store.getSession().role;try{root.innerHTML=p[0]==='doctors'?views.doctors():p[0]==='doctor'?views.doctorDetail(p[1]):p[0]==='matches'?views.matches():p[0]==='stats'?views.stats():p[0]==='documents'?views.documents(p[1],p[2]):p[0]==='faq'?views.faq(false):p[0]==='questions'?views.faq(true):p[0]==='manage'?views.manage(p[1]):p[0]==='guide'?views.guide():views.home();var sfrBar=document.getElementById('rms-demo-sfr');if(sfrBar){sfrBar.innerHTML=views.sfrMarkup();sfrBar.hidden=!sfrBar.innerHTML;}root.setAttribute('aria-busy','false');document.title=(root.querySelector('h1')?.textContent||'RMS')+' · 기능개선 시연';document.getElementById('rms-role').value=r;var names={visitor:'',company:'가상 한빛정밀',tp:'충남TP 담당자',admin:'시스템 관리자'};document.getElementById('rms-user-menu').innerHTML=r==='visitor'?'<button type="button" data-shell="login">로그인</button>':'<span>'+e(names[r])+'</span><button type="button" data-shell="account">회원정보</button><button type="button" data-shell="logout">로그아웃</button>'+(r==='admin'?'<a href="#manage">설정</a>':'');document.querySelectorAll('.rms-demo-nav a').forEach(function(a){var target=a.hash.slice(1),current=target===p[0]||(target==='doctors'&&['doctor','matches','stats'].includes(p[0]))||(target==='faq'&&p[0]==='questions');if(current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});root.querySelectorAll('input[name=submission],input[name=companyRegion]').forEach(function(el){el.readOnly=true;});if(focus)root.querySelector('h1')?.focus({preventScroll:true});if(p[0]==='guide'&&/^SFR-\d{2}$/.test(p[1]||'')){var row=document.getElementById(p[1]);if(row){row.classList.add('rms-sfr-selected');row.focus({preventScroll:true});row.scrollIntoView?.({block:'start'});}}}catch(err){root.innerHTML=V.empty('화면을 표시하지 못했습니다. JSON 자료를 확인하거나 시연 안내에서 초기자료로 복원해 주세요.');showError(err);}}
  function commit(fn,message,keepModal) {try{fn();if(!keepModal)closeModal();render();if(message)toast(message);return true;}catch(err){showError(err);return false;}}
  function download(name,text,type) {var blob=new Blob([text],{type:type||'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  var sfrLayer,sfrReturnFocus,sfrGeometry,sfrDrag;
  function closeSfrLayer() {
    if(sfrLayer){sfrLayer.parentElement.remove();sfrLayer=null;}sfrDrag=null;
    if(sfrReturnFocus&&sfrReturnFocus.isConnected)sfrReturnFocus.focus();
  }
  function placeSfrLayer(box) {
    var vw=window.innerWidth||1024,vh=window.innerHeight||768;
    box.width=Math.max(Math.min(300,vw-16),Math.min(box.width,vw-16));
    box.height=Math.max(Math.min(220,vh-16),Math.min(box.height,vh-16));
    box.left=Math.max(8,Math.min(box.left,vw-box.width-8));
    box.top=Math.max(8,Math.min(box.top,vh-box.height-8));
    sfrGeometry=box;
    if(sfrLayer){sfrLayer.style.left=box.left+'px';sfrLayer.style.top=box.top+'px';sfrLayer.style.width=box.width+'px';sfrLayer.style.height=box.height+'px';}
  }
  function adjustSfrLayer(box,mode,dx,dy) {
    var next=Object.assign({},box),vw=window.innerWidth||1024,vh=window.innerHeight||768;
    if(mode==='move'){next.left+=dx;next.top+=dy;}
    else {if(mode!=='y')next.width=Math.min(next.width+dx,vw-next.left-8);if(mode!=='x')next.height=Math.min(next.height+dy,vh-next.top-8);}
    placeSfrLayer(next);
  }
  function navigateSfr(key) {
    var menu=V.sfrDestination(key);if(!menu)throw new Error('SFR 메뉴 연결을 찾을 수 없습니다.');
    if(menu.roles.length&&!menu.roles.includes(store.getSession().role)){
      modal('RMS 로그인 · 화면 접근 권한','<div data-sfr-login-target="'+e(key)+'"><p><strong>'+e(menu.label)+'</strong> 화면을 열려면 아래 역할로 로그인해 주세요.</p><p class="rms-note rms-space">현재는 가상 사용자 역할을 선택하는 시연입니다. 역할을 선택하면 요청한 화면으로 이동합니다.</p><div class="rms-actions rms-space">'+menu.roles.map(function(role){return b(V.sfrRoleNames[role]+'로 로그인','sfr-role-login',role,'rms-btn-primary');}).join('')+b('취소','close')+'</div></div>');return;
    }
    var path=menu.route;
    if(menu.record==='doctor'){
      var current=route(),doctors=store.getState().doctors,doctor=doctors.find(function(d){return current[0]==='doctor'&&d.id===current[1];})||doctors[0];
      if(doctor)path='doctor/'+doctor.id;else toast('등록된 기술닥터가 없어 검색 화면을 엽니다.');
    }
    if(menu.step){
      var apps=store.getApplications(),a=apps.find(function(item){return item.id===ui.appId;})||apps[0];
      ui.docStatus='';if(a)path='documents/'+a.id+'/'+menu.step;else toast('현재 역할로 조회 가능한 신청서가 없습니다.');
    }
    if(menu.codeKind)ui.codeKind=menu.codeKind;
    closeSfrLayer();go(path);
  }
  function openSfrLayer(id) {
    var r=V.requirement(id);if(!r)return;
    sfrReturnFocus=document.activeElement;
    if(!sfrLayer){
      var wrapper=document.createElement('div');wrapper.className='rms-enhance';
      wrapper.innerHTML='<section id="rms-sfr-layer" class="rms-sfr-layer" role="dialog" aria-modal="false" aria-labelledby="rms-sfr-layer-title"><header class="rms-sfr-layerhead"><button type="button" data-sfr-move aria-label="레이어 이동: 드래그 또는 방향키"><span id="rms-sfr-layer-title"></span><small>제목 드래그로 이동 · 방향키 사용 가능</small></button><button type="button" data-sfr-close aria-label="SFR 설명 닫기">×</button></header><div class="rms-sfr-layerbody" tabindex="0"></div><footer class="rms-sfr-layerfoot">현재 화면을 조작하며 비교할 수 있습니다. 가장자리로 크기 조절 · Esc 닫기</footer><button type="button" class="rms-sfr-resize-x" data-sfr-resize="x" aria-label="가로 크기 조절: 드래그 또는 좌우 방향키"></button><button type="button" class="rms-sfr-resize-y" data-sfr-resize="y" aria-label="세로 크기 조절: 드래그 또는 위아래 방향키"></button><button type="button" class="rms-sfr-resize-both" data-sfr-resize="both" aria-label="가로 세로 크기 조절: 드래그 또는 방향키">◢</button></section>';
      document.body.appendChild(wrapper);sfrLayer=wrapper.firstElementChild;
      sfrLayer.querySelector('[data-sfr-close]').addEventListener('click',closeSfrLayer);
      sfrLayer.addEventListener('click',eventClick);
      sfrLayer.addEventListener('pointerdown',function(ev){
        var control=ev.target.closest('[data-sfr-move],[data-sfr-resize]');if(!control||ev.button!==0)return;
        ev.preventDefault();control.focus();
        sfrDrag={pointerId:ev.pointerId,x:ev.clientX,y:ev.clientY,box:Object.assign({},sfrGeometry),mode:control.hasAttribute('data-sfr-move')?'move':control.dataset.sfrResize};
        if(control.setPointerCapture)control.setPointerCapture(ev.pointerId);
      });
      sfrLayer.addEventListener('keydown',function(ev){
        if(ev.key==='Escape'){ev.preventDefault();closeSfrLayer();return;}
        var control=ev.target.closest('[data-sfr-move],[data-sfr-resize]'),delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[ev.key];
        if(control&&delta){ev.preventDefault();adjustSfrLayer(sfrGeometry,control.hasAttribute('data-sfr-move')?'move':control.dataset.sfrResize,delta[0],delta[1]);}
      });
    }
    sfrLayer.querySelector('#rms-sfr-layer-title').textContent=r.id+' · '+r.name;
    var body=sfrLayer.querySelector('.rms-sfr-layerbody');
    body.innerHTML='<p class="rms-sfr-definition">'+e(r.definition)+'</p><h3>요구사항 세부내용</h3><ul class="rms-sfr-details">'+r.details.map(function(x){return '<li>'+e(x)+'</li>';}).join('')+'</ul>'+V.requirementCoverage(r);
    body.scrollTop=0;
    placeSfrLayer(sfrGeometry||{left:(window.innerWidth||1024)-928,top:96,width:900,height:620});
    sfrLayer.querySelector('[data-sfr-move]').focus();
  }
  document.addEventListener('pointermove',function(ev){if(sfrDrag&&ev.pointerId===sfrDrag.pointerId)adjustSfrLayer(sfrDrag.box,sfrDrag.mode,ev.clientX-sfrDrag.x,ev.clientY-sfrDrag.y);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){document.addEventListener(type,function(ev){if(sfrDrag&&ev.pointerId===sfrDrag.pointerId)sfrDrag=null;});});
  window.addEventListener('resize',function(){if(sfrLayer)placeSfrLayer(Object.assign({},sfrGeometry));});
  function clearUi() {
    closeSfrLayer();Object.assign(ui,{doctorFilters:{},statsFilters:{},selected:new Set(),faqQuery:'',faqWork:'',docStatus:'',codeKind:'technology',appId:''});
  }
  function presentation() {
    return {role:store.getSession().role,route:location.hash.slice(1)||'home',ui:Object.assign({},ui,{selected:Array.from(ui.selected)})};
  }
  function restorePresentation(saved) {
    clearUi();if(!saved){store.setRole('visitor');return;}
    store.setRole(saved.role);
    Object.assign(ui,saved.ui,{selected:new Set(saved.ui.selected)});
  }
  function exportFallback() {
    download('smtech-시연내용.json',store.exportBackup(presentation()));
    document.getElementById('rms-storage-help').textContent='smtech-시연내용.json 다운로드를 요청했습니다. 브라우저 다운로드 목록(Ctrl+J)에서 파일과 폴더를 확인하세요.';
    toast('JSON 다운로드를 요청했습니다. Ctrl+J에서 확인하세요.');
  }
  async function exportDemo() {
    if(typeof window.showSaveFilePicker!=='function'){
      modal('시연내용 JSON 내보내기','<p>이 브라우저는 웹페이지에서 저장 위치를 선택하는 기능을 지원하지 않습니다.</p><p class="rms-space">브라우저 다운로드 설정에서 <strong>저장할 위치를 매번 확인</strong>을 켠 뒤 아래 버튼을 누르면 위치를 선택할 수 있습니다. 기본 다운로드 폴더에 저장해도 JSON 불러오기로 다른 PC에서 복원할 수 있습니다.</p><div class="rms-actions rms-space">'+b('취소','close')+b('JSON 파일 다운로드','export-fallback','','rms-btn-primary')+'</div>');
      return;
    }
    var writer;
    try {
      var text=store.exportBackup(presentation());
      var handle=await window.showSaveFilePicker({id:'smtech-demo-json',suggestedName:'smtech-시연내용.json',startIn:'downloads',types:[{description:'SMTECH 시연 내용 JSON',accept:{'application/json':['.json']}}]});
      writer=await handle.createWritable();
      await writer.write(text);await writer.close();writer=null;
      document.getElementById('rms-storage-help').textContent='선택한 폴더에 '+handle.name+' 저장 완료 · 다른 PC에서 JSON 불러오기로 복원하세요.';
      toast('선택한 폴더에 시연내용 JSON을 저장했습니다.');
    } catch(error) {
      if(writer){try{await writer.abort();}catch(ignore){}}
      if(error.name==='AbortError'){toast('JSON 내보내기를 취소했습니다. 시연 내용은 유지됩니다.');return;}
      if(error.name==='SecurityError'){
        modal('저장 위치 선택이 차단되었습니다','<p>현재 브라우저 환경에서 파일 선택 창을 열 수 없습니다. 브라우저 다운로드 설정에서 저장 위치 확인을 켜고 파일 다운로드를 이용하세요.</p><div class="rms-actions rms-space">'+b('취소','close')+b('JSON 파일 다운로드','export-fallback','','rms-btn-primary')+'</div>');return;
      }
      showError(new Error('JSON 파일 저장에 실패했습니다. 시연 내용은 유지됩니다. '+error.message));
    }
  }
  function data(form) {return Object.fromEntries(new FormData(form).entries());}
  function checks(label,name,list,selected) {return '<div class="rms-field rms-span2"><span>'+e(label)+'</span><div class="rms-checkboxes">'+list.map(function(x){return '<label><input type="checkbox" name="'+e(name)+'" value="'+e(x.id)+'"'+(selected.includes(x.id)?' checked':'')+'>'+e(x.name)+'</label>';}).join('')+'</div></div>';}
  function login() {modal('RMS 로그인 시연','<div class="rms-note">현재는 가상 사용자 역할만 전환합니다. 실제 로그인은 SMTECH 계정 및 휴대폰 인증과 연결해야 합니다.</div><div class="rms-fieldgrid rms-cols2">'+b('지원기업으로 체험','role-login','company','rms-btn-primary')+b('충남TP 담당자로 체험','role-login','tp')+b('시스템 관리자로 체험','role-login','admin')+'</div>');}
  var programRowSequence=0;
  var programRows={supportPrograms:[['지원대상명','target'],['프로그램명','name'],['프로그램 설명','description','textarea'],['정부지원금 (원)','amount','number']],contentSections:[['내용 제목','heading'],['세부내용','body','textarea']],contacts:[['기관명','institution'],['담당자명','name'],['연락처','phone'],['이메일','email','email'],['담당업무','duty']],attachments:[['파일명 (.txt)','name'],['시연용 첨부 텍스트','content','textarea']]};
  function programRow(kind,values) {
    var id=String(++programRowSequence);values=values||{};
    return '<section class="rms-program-editor-row" data-program-row="'+kind+'" data-program-row-id="'+id+'"><div class="rms-fieldgrid rms-cols2">'+programRows[kind].map(function(f){var key='rms-program-'+id+'-'+f[1];return '<div class="rms-field'+(f[2]==='textarea'?' rms-span2':'')+'"><label for="'+key+'">'+e(f[0])+'</label>'+(f[2]==='textarea'?'<textarea id="'+key+'" name="'+key+'" data-program-field="'+f[1]+'" rows="4">'+e(values[f[1]]||'')+'</textarea>':'<input id="'+key+'" name="'+key+'" data-program-field="'+f[1]+'" type="'+(f[2]||'text')+'" value="'+e(values[f[1]]==null?'':values[f[1]])+'">')+'</div>';}).join('')+'</div><div class="rms-actions rms-space">'+b('항목 삭제','program-row-remove',id,'rms-btn-small')+'</div></section>';
  }
  function addProgramRow(kind) {var target=host.querySelector('[data-program-group="'+kind+'"]');if(!target||!programRows[kind])return;var temp=document.createElement('div');temp.innerHTML=programRow(kind,{});target.appendChild(temp.firstElementChild);}
  function programDetail(id) {
    var s=store.getState(),p=s.programs.find(function(x){return x.id===id;});if(!p)throw new Error('사업공고를 찾을 수 없습니다.');
    var fields=[['과제명',p.projectName],['과제번호',p.projectNumber],['사업연도',p.businessYear],['과제지역',p.region],['공고번호',p.noticeNumber],['접수기간',p.start+' ~ '+p.end],['공고명',p.title],['접수마감',p.end+' '+p.deadlineTime],['산업명',p.industry],['수행기관',p.institution],['공고일',p.publishedDate]];
    var body='<section class="rms-program-content"><div class="rms-panelhead"><h2>공고정보</h2>'+V.badge(store.programStatus(id).label)+'</div><dl class="rms-profile rms-program-info">'+fields.map(function(f){return '<div><dt>'+e(f[0])+'</dt><dd>'+e(f[1])+'</dd></div>';}).join('')+'</dl><h3>지원프로그램</h3><section class="rms-program-tablewrap">'+(p.supportPrograms.length?V.table('지원프로그램',['지원대상명','프로그램명','프로그램 설명','정부지원금 (원)'],p.supportPrograms.map(function(x){return '<tr><td>'+e(x.target)+'</td><td>'+e(x.name)+'</td><td>'+e(x.description)+'</td><td>'+Number(x.amount).toLocaleString('ko-KR')+'</td></tr>';})):V.empty('등록된 지원프로그램이 없습니다.'))+'</section><h3 class="rms-space">공고내용</h3><p class="rms-program-text rms-note">'+e(p.intro)+'</p>'+p.contentSections.map(function(x){return '<section class="rms-program-sections"><h3>'+e(x.heading)+'</h3><p class="rms-program-text">'+e(x.body)+'</p></section>';}).join('')+'<h3 class="rms-space">필수 접수서류</h3><ul class="rms-checks">'+p.requiredDocs.map(function(k){return '<li>'+e(s.documentTypes.find(function(t){return t.id===k;}).name)+'</li>';}).join('')+'</ul><h3 class="rms-space">담당자정보</h3><section class="rms-program-tablewrap">'+(p.contacts.length?V.table('담당자정보',['기관명','담당자명','연락처','이메일','담당업무'],p.contacts.map(function(x){return '<tr>'+[x.institution,x.name,x.phone,x.email,x.duty].map(function(v){return '<td>'+e(v)+'</td>';}).join('')+'</tr>';})):V.empty('등록된 담당자정보가 없습니다.'))+'</section><h3 class="rms-space">첨부파일</h3><section class="rms-program-tablewrap">'+(p.attachments.length?V.table('공고 첨부파일',['순번','파일명','크기 (KB)','다운로드'],p.attachments.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td>'+e(x.name)+'</td><td>'+(x.size/1024).toFixed(1)+'</td><td>'+b('다운로드','program-attachment',p.id+'/'+x.id,'rms-btn-small rms-btn-primary')+'</td></tr>';})):V.empty('등록된 첨부파일이 없습니다.'))+'</section><p class="rms-muted rms-space">검토용 가상 공고입니다. 첨부파일은 시연용 텍스트 자료이며 실제 공고문이 아닙니다.</p><div class="rms-actions rms-space">'+b('닫기','close')+(store.getSession().role==='admin'?b('공고내용 수정','program-edit',id):'')+b('신청하기','apply',id,'rms-btn-primary')+'</div></section>';
    modal('사업공고 상세',body,{program:true,draggable:true});
  }
  function programForm(id) {
    if(store.getSession().role!=='admin')throw new Error('시스템 관리자만 공고를 등록·수정할 수 있습니다.');
    var s=store.getState(),p=s.programs.find(function(x){return x.id===id;})||{id:'',title:'',region:'충남',start:s.demoDate,end:s.demoDate,deadlineTime:'18:00',businessYear:s.demoDate.slice(0,4),publishedDate:s.demoDate,requiredDocs:[],supportPrograms:[],contentSections:[],contacts:[],attachments:[]};
    var scalar=[['공고명 *','title'],['과제명 *','projectName'],['과제번호 *','projectNumber'],['공고번호 *','noticeNumber'],['사업연도 *','businessYear'],['지역 *','region'],['지원분야 *','category'],['산업명 *','industry'],['접수 시작일 *','start','date'],['접수 마감일 *','end','date'],['접수 마감시간 *','deadlineTime','time'],['공고일 *','publishedDate','date'],['수행기관 *','institution']];
    var labels={supportPrograms:'지원프로그램',contentSections:'공고내용',contacts:'담당자정보',attachments:'첨부파일 (.txt 시연자료)'};
    modal(id?'사업공고 수정':'사업공고 등록','<form id="rms-program-form" data-id="'+e(p.id)+'"><div class="rms-fieldgrid rms-cols2">'+scalar.map(function(f){return V.field(f[0],f[1],p[f[1]],f[2]||'text');}).join('')+'<div class="rms-field rms-span2"><label for="rms-intro">공고 소개 *</label><textarea id="rms-intro" name="intro" rows="4">'+e(p.intro||'')+'</textarea></div>'+checks('필수 접수서류','requiredDocs',s.documentTypes,p.requiredDocs)+'</div>'+Object.keys(programRows).map(function(kind){return '<div class="rms-panelhead rms-space"><h3>'+labels[kind]+'</h3>'+b('항목 추가','program-row-add',kind,'rms-btn-small')+'</div><div data-program-group="'+kind+'">'+p[kind].map(function(x){return programRow(kind,x);}).join('')+'</div>';}).join('')+'<div class="rms-actions rms-space">'+b('취소','close')+'<button type="submit" class="rms-btn rms-btn-primary">공고 저장</button></div></form>',{program:true,draggable:true});
  }
  function saveProgramForm(form) {
    var input=data(form);input.id=form.dataset.id;input.requiredDocs=new FormData(form).getAll('requiredDocs');
    Object.keys(programRows).forEach(function(kind){input[kind]=Array.from(form.querySelectorAll('[data-program-row="'+kind+'"]')).map(function(row,index){var result={};row.querySelectorAll('[data-program-field]').forEach(function(field){result[field.dataset.programField]=field.value;});if(kind==='supportPrograms')result.amount=Number(result.amount);if(kind==='attachments'){result.id='ATT'+(index+1);result.mimeType='text/plain';}return result;});});
    return store.saveProgram(input);
  }
  function doctorForm(id) {var s=store.getState(),d=s.doctors.find(function(x){return x.id===id;})||{id:'',userId:'',organization:'',institution:'O02',industry:'I01',year:'2026',degree:'',career:'',certificates:'',acquiredTechnology:'',technologies:[],consultations:[],supportRegions:[],reasons:[],available:true};var role=store.getSession();if(!['tp','admin'].includes(role.role))throw new Error('관리기관 역할로 전환해 주세요.');if(d.id&&role.role!=='admin'&&d.owner!==role.region)throw new Error('등록기관 담당자만 수정할 수 있습니다.');modal(id?'기술닥터 등록정보 수정':'기술닥터 등록','<form id="rms-doctor-form" data-id="'+e(d.id)+'"><div class="rms-note">SMTECH 가상 사용자를 선택하면 이름과 소속기관을 초기값으로 반영합니다. <span class="rms-required">*</span> 표시 항목은 필수입니다.</div><div class="rms-fieldgrid rms-cols2">'+V.select('SMTECH 사용자 *','userId',[{id:'',name:'사용자 선택'}].concat(s.users.map(function(u){return {id:u.id,name:u.name+' · '+u.organization};})),d.userId)+V.field('소속기관 *','organization',d.organization)+V.select('기관유형 *','institution',views.codes('institution'),d.institution)+V.select('산업분야 *','industry',views.codes('industry'),d.industry)+V.select('선정연도 *','year',[{id:'2026',name:'2026년'},{id:'2025',name:'2025년'}],d.year)+V.field('학위정보 *','degree',d.degree)+V.field('취득기술정보 *','acquiredTechnology',d.acquiredTechnology,'text','rms-span2')+checks('기술분야 * (복수 선택)','technologies',views.codes('technology'),d.technologies)+checks('상담유형 * (복수 선택)','consultations',views.codes('consultation'),d.consultations)+checks('지원가능 지역 * (복수 선택)','supportRegions',views.codes('region').map(function(c){return {id:c.name,name:c.name};}),d.supportRegions)+checks('선정사유 * (복수 선택)','reasons',views.codes('reason'),d.reasons)+V.field('주요경력 *','career',d.career,'text','rms-span2')+V.field('자격증·포상 * (없으면 없음 입력)','certificates',d.certificates,'text','rms-span2')+'<label class="rms-checkrow"><input name="available" type="checkbox"'+(d.available?' checked':'')+'>현재 기업지원 가능</label></div><div class="rms-actions rms-space">'+b('취소','close')+'<button class="rms-btn rms-btn-primary" type="submit">저장</button></div></form>');}
  function docDetail(id) {var s=store.getState(),a=store.getApplications().find(function(x){return x.id===ui.appId;}),d=a.docs.find(function(x){return x.specId===id;}),spec=s.documentTypes.find(function(x){return x.id===id;}),company=store.getSession().role==='company',locked=a.submission==='제출완료';var mismatch=id==='F01'&&d.issue==='mismatch';modal(spec.name+' · 상세','<div class="rms-panelhead"><h2>'+V.badge(d.status)+'</h2><span class="rms-muted">'+e(spec.provider)+'</span></div><p class="rms-note '+(d.status==='조회실패'||d.status==='보완필요'?'rms-warning':'')+'">'+e(d.reason||'서류를 조회하거나 파일로 제출해 주세요.')+'</p>'+(mismatch?'<dl class="rms-profile"><div class="rms-wide"><dt>신청서 주소</dt><dd>'+e(a.inputAddress)+'</dd></div><div class="rms-wide"><dt>조회된 주소</dt><dd>'+e(a.address)+'</dd></div></dl>'+(company&&!locked?'<div class="rms-actions">'+b('기존 입력값 유지','mismatch-keep',id)+b('조회 주소 반영','mismatch-apply',id,'rms-btn-primary')+'</div>':''):'')+(company&&!locked?'<form id="rms-file-form" data-id="'+e(id)+'" class="rms-space"><div class="rms-field"><label for="rms-document-file">직접 파일 제출 (1개 · 시연 제한 10MB)</label><input id="rms-document-file" name="file" type="file" accept=".pdf,.hwp,.hwpx,.jpg,.jpeg,.png,.zip" required></div><p class="rms-muted">내용은 서버에 전송하지 않으며 파일명·크기만 저장합니다.</p><div class="rms-actions rms-space"><button class="rms-btn" type="submit">파일 제출 시연</button>'+b(d.status==='조회실패'?'재조회':'조회',d.status==='조회실패'?'doc-retry':'doc-query',id,'rms-btn-primary')+'</div></form>':'')+'<h3 class="rms-space">처리이력</h3>'+(d.history.length?V.table('서류 처리이력',['처리일시','처리','내용'],d.history.map(function(h){return '<tr><td>'+e(h.at.slice(0,19).replace('T',' '))+'</td><td>'+e(h.action)+'</td><td>'+e(h.reason)+'</td></tr>';}),true):V.empty('아직 처리이력이 없습니다.')));}
  function codeForm(id) {var s=store.getState(),c=s.classifications.find(function(x){return x.id===id;})||{id:'',kind:ui.codeKind,name:'',parentId:'',active:true,visible:true};modal(c.id?'표준분류 수정':'표준분류 추가','<form id="rms-code-form" data-id="'+e(c.id)+'" data-kind="'+e(c.kind)+'"><div class="rms-fieldgrid rms-cols2">'+V.field('분류명 *','name',c.name)+V.select('상위분류','parentId',[{id:'',name:'없음'}].concat(s.classifications.filter(function(x){return x.kind===c.kind&&x.id!==c.id;}).map(function(x){return {id:x.id,name:x.name};})),c.parentId)+'<label class="rms-checkrow"><input type="checkbox" name="active"'+(c.active?' checked':'')+'>사용</label><label class="rms-checkrow"><input type="checkbox" name="visible"'+(c.visible?' checked':'')+'>노출 (소통 업무유형에 적용)</label></div><div class="rms-actions rms-space">'+b('취소','close')+'<button class="rms-btn rms-btn-primary" type="submit">저장</button></div></form>');}
  function saveCompanyForm() {
    var form=root.querySelector('#rms-company-form');
    if(!form||form.querySelector('fieldset').hasAttribute('disabled'))return;
    var input=data(form),a=store.getApplications().find(function(x){return x.id===form.dataset.id;});
    if(['companyName','representative','inputAddress'].some(function(k){return input[k]!==a[k];}))store.saveApplicationInfo(a.id,input);
  }
  var actions={
    'sfr-open':openSfrLayer,
    'sfr-navigate':navigateSfr,
    'sfr-role-login':function(role){var target=host.querySelector('[data-sfr-login-target]'),key=target&&target.dataset.sfrLoginTarget,menu=V.sfrDestination(key);if(!menu||!menu.roles.includes(role))throw new Error('이 화면에 허용된 역할을 선택해 주세요.');store.setRole(role);closeModal();navigateSfr(key);toast('선택한 역할로 요청한 화면을 열었습니다.');},
    'document-step':function(id){if(!['1','2','3','4'].includes(id))return;saveCompanyForm();ui.docStatus='';go('documents/'+ui.appId+'/'+id);},
    'application-open':function(id){ui.docStatus='';go('documents/'+id+'/2');},
    close:closeModal,login:login,'role-login':function(id){store.setRole(id);closeModal();render();toast('가상 사용자 역할을 변경했습니다.');},
    'account-help':function(){modal('SMTECH 계정 안내','<p>실제 서비스에서는 SMTECH의 아이디·비밀번호 찾기를 이용합니다.</p><p class="rms-muted rms-space">현재 시연에서는 실제 계정을 입력하지 않고 사용자 역할을 선택해 주세요.</p><div class="rms-actions rms-space">'+b('로그인 시연','login','','rms-btn-primary')+'</div>');},
    'go-documents':function(){go('documents');},'faq-work':function(id){ui.faqWork=id;ui.faqQuery='';go('faq');},'faq-reset':function(){ui.faqQuery='';ui.faqWork='';render();},
    program:programDetail,
    'program-edit':programForm,
    'program-row-add':addProgramRow,
    'program-row-remove':function(id){host.querySelector('[data-program-row-id="'+id+'"]')?.remove();},
    'program-attachment':function(id){var ids=id.split('/'),p=store.getState().programs.find(function(x){return x.id===ids[0];}),file=p&&p.attachments.find(function(x){return x.id===ids[1];});if(!file)throw new Error('첨부파일을 찾을 수 없습니다.');download(file.name,file.content,file.mimeType+';charset=utf-8');toast('시연용 첨부파일을 내려받습니다.');},
    apply:function(id){if(store.getSession().role!=='company'){login();return;}var appId; if(commit(function(){appId=store.startApplication(id);},'가상 신청서를 열었습니다.'))go('documents/'+appId+'/2');},
    question:function(id){var q=store.publicQuestions().find(function(x){return x.id===id;});if(!q)throw new Error('공개된 게시물이 아닙니다.');modal('소통하기 · 질문과 답변','<div class="rms-panelhead"><h2>'+e(q.title)+'</h2>'+V.badge(q.status)+'</div><p class="rms-muted">'+e(store.label(q.work))+' · '+e(q.date)+'</p><div class="rms-note rms-space">'+e(q.answer||'아직 등록된 답변이 없습니다.')+'</div>');},
    'doctor-reset':function(){ui.doctorFilters={};render();},'doctor-edit':doctorForm,
    compare:function(){var ds=store.getState().doctors.filter(function(d){return ui.selected.has(d.id);});if(ds.length<2)throw new Error('비교할 기술닥터를 2~3명 선택해 주세요.');var fields=[['소속기관',function(d){return e(d.organization);}],['기관유형',function(d){return e(store.label(d.institution));}],['기술분야',function(d){return d.technologies.map(function(x){return e(store.label(x));}).join(', ');}],['지원가능 지역',function(d){return d.supportRegions.map(e).join(', ');}],['취득기술',function(d){return e(d.acquiredTechnology);}],['상담유형',function(d){return d.consultations.map(function(x){return e(store.label(x));}).join(', ');}],['상태',function(d){return V.badge(d.available?'지원가능':'활동중지');}],['상세정보',function(d){return '<a href="#doctor/'+e(d.id)+'" data-close-link>상세보기</a>';}]];modal('기술닥터 비교',V.table('선택 기술닥터 비교',['비교항목'].concat(ds.map(function(d){return e(d.name);})),fields.map(function(f){return '<tr><th scope="row">'+f[0]+'</th>'+ds.map(function(d){return '<td>'+f[1](d)+'</td>';}).join('')+'</tr>';}),true));},
    'match-request':function(id){var d=store.getState().doctors.find(function(x){return x.id===id;});if(store.getSession().role==='visitor'){login();return;}modal('기술닥터 매칭 요청','<form id="rms-match-form" data-id="'+e(id)+'"><div class="rms-note">'+e(d.name)+' · '+e(d.organization)+'<br>지원가능 지역: '+d.supportRegions.map(e).join(' · ')+'</div><div class="rms-field"><label for="rms-request">기술애로 및 요청내용 *</label><textarea id="rms-request" name="request" required maxlength="1000" placeholder="기업의 기술애로와 필요한 지원 내용을 입력해 주세요."></textarea></div><div class="rms-actions rms-space">'+b('취소','close')+'<button class="rms-btn rms-btn-primary" type="submit">매칭 요청</button></div></form>');},
    'match-progress':function(id){var m=store.getState().matches.find(function(x){return x.id===id;});if(m.status==='요청접수'){commit(function(){store.progressMatch(id,'지원진행','');},'지원진행으로 변경했습니다.');return;}modal('기업지원 실적 등록','<form id="rms-result-form" data-id="'+e(id)+'"><div class="rms-field"><label for="rms-result">지원결과 *</label><textarea name="result" id="rms-result" required maxlength="1000" placeholder="지원 내용과 결과를 입력해 주세요."></textarea></div><div class="rms-actions rms-space"><button class="rms-btn rms-btn-primary" type="submit">지원완료 처리</button></div></form>');},
    'stats-export':function(){if(!['tp','admin'].includes(store.getSession().role))throw new Error('관리기관 권한이 필요합니다.');var csv=function(v){var x=String(v);if(/^[=+\-@\t\r]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';};var lines=[['등록지역','등록 전문가','활동 전문가','매칭 요청','지원완료','지역 간 매칭']].concat(views.statsData().rows.map(function(r){return [r.region,r.registered,r.active,r.matched,r.completed,r.cross];}));download('RMS_기술닥터통계.csv','\uFEFF'+lines.map(function(row){return row.map(csv).join(',');}).join('\r\n'),'text/csv;charset=utf-8');toast('현재 조회조건의 통계 CSV를 저장했습니다.');},
    'doc-status':function(id){ui.docStatus=id;render();},'doc-detail':docDetail,
    'doc-query':function(id){if(commit(function(){store.queryDocument(ui.appId,id,false);},'가상 조회 결과를 확인하세요.'))docDetail(id);},
    'doc-retry':function(id){if(commit(function(){store.queryDocument(ui.appId,id,true);},'가상 재조회 결과를 확인하세요.'))docDetail(id);},
    'query-required':function(id){var s=store.getState(),a=store.getApplications().find(function(x){return x.id===id;}),p=s.programs.find(function(x){return x.id===a.programId;});if(!a.consent)throw new Error('정보 제공에 동의한 후 조회해 주세요.');if(a.submission==='제출완료')throw new Error('제출완료 신청서는 기관의 보완요청 후 수정할 수 있습니다.');commit(function(){store.queryRequired(id);},'필수서류 조회를 마쳤습니다. 보완필요·조회실패 항목을 확인하세요.');},
    'mismatch-keep':function(){if(commit(function(){store.resolveMismatch(ui.appId,false);},'기존 입력값을 유지했습니다. 증빙 파일을 첨부해 주세요.'))docDetail('F01');},
    'mismatch-apply':function(){if(commit(function(){store.resolveMismatch(ui.appId,true);},'선택한 조회 주소를 신청서에 반영했습니다.'))docDetail('F01');},
    supplement:function(id){modal('증빙서류 보완요청','<form id="rms-supplement-form" data-id="'+e(id)+'"><div class="rms-field"><label for="rms-reason">보완 요청사유 *</label><textarea id="rms-reason" name="reason" required maxlength="1000" placeholder="기업이 조치할 수 있도록 보완사항을 구체적으로 입력해 주세요."></textarea></div><p class="rms-muted rms-space">이 시연에서는 기록만 변경하며 기업에 메시지를 전송하지 않습니다.</p><div class="rms-actions rms-space"><button class="rms-btn rms-btn-primary" type="submit">보완 요청</button></div></form>');},
    draft:function(id){commit(function(){store.submitApplication(id,true);},'신청서를 임시저장했습니다.');},
    submit:function(id){modal('신청서 제출 확인','<p>필수서류의 제출상태를 확인하고 가상 신청서를 제출합니다.</p><p class="rms-muted rms-space">제출 후에는 기관의 보완요청 전까지 수정할 수 없습니다. 실제 사업에는 접수되지 않습니다.</p><div class="rms-actions rms-space">'+b('취소','close')+b('가상 신청서 제출','submit-confirm',id,'rms-btn-primary')+'</div>');},
    'submit-confirm':function(id){commit(function(){store.submitApplication(id,false);},'가상 신청서 제출이 완료되었습니다.');},
    'code-kind':function(id){ui.codeKind=id;render();},'code-edit':codeForm,
    'code-delete':function(id){modal('분류 삭제 확인','<p>사용되지 않는 분류만 삭제할 수 있습니다. 현재 자료는 상단 JSON 저장으로 보관할 수 있습니다.</p><div class="rms-actions rms-space">'+b('취소','close')+b('삭제','code-delete-confirm',id,'rms-btn-danger')+'</div>');},
    'code-delete-confirm':function(id){commit(function(){store.removeCode(id);},'분류를 삭제했습니다.');},
    'home-up':function(id){commit(function(){var s=store.getState().settings,i=s.homeOrder.indexOf(id);if(i>0){s.homeOrder.splice(i,1);s.homeOrder.splice(i-1,0,id);}store.updateSettings(s);},'메인 배치를 저장했습니다.');},
    'doc-type-edit':function(id){var d=store.getState().documentTypes.find(function(x){return x.id===id;})||{id:'',name:'',provider:'',active:true};modal('연계 대상 서류 설정','<form id="rms-doctype-form" data-id="'+e(d.id)+'"><div class="rms-fieldgrid rms-cols2">'+V.field('서류명 *','name',d.name)+V.field('제공기관 *','provider',d.provider)+'<label class="rms-checkrow"><input type="checkbox" name="active"'+(d.active?' checked':'')+'>연계 사용</label></div><div class="rms-actions rms-space"><button class="rms-btn rms-btn-primary" type="submit">저장</button></div></form>');},
    'reset-confirm':function(){modal('시연 데이터 초기화','<p>브라우저에 저장한 시연 변경사항을 초기 가상 자료로 되돌립니다. 필요한 변경사항은 시연내용 JSON 내보내기로 먼저 보관해 주세요.</p><div class="rms-actions rms-space">'+b('취소','close')+b('시연내용 JSON 내보내기','export')+b('초기화','reset','', 'rms-btn-danger')+'</div>');},
    reset:function(){if(commit(function(){store.reset();clearUi();},'가상 자료를 초기화했습니다.'))go('home');},
    'export-fallback':exportFallback,
    export:exportDemo
  };
  function eventClick(event) {var button=event.target.closest('[data-action]');if(button){event.preventDefault();try{var action=actions[button.dataset.action];if(action)action(button.dataset.id);}catch(err){showError(err);}}if(event.target.closest('[data-close-link]'))closeModal();}
  function eventSubmit(event) {var form=event.target;if(!form.id.startsWith('rms-'))return;event.preventDefault();var f=data(form),id=form.dataset.id;try{
    if(form.id==='rms-doctor-search'){ui.doctorFilters=Object.assign({},f,{available:!!f.available,stale:!!f.stale});ui.selected.clear();render();}
    else if(form.id==='rms-faq-search'){ui.faqQuery=f.q||'';ui.faqWork=f.work||ui.faqWork||'';if(route()[0]==='questions')render();else go('faq');}
    else if(form.id==='rms-stats-search'){if(f.start&&f.end&&f.start>f.end)throw new Error('종료일은 시작일 이후로 선택해 주세요.');ui.statsFilters=f;render();}
    else if(form.id==='rms-doctor-form'){var fd=new FormData(form);['technologies','consultations','supportRegions','reasons'].forEach(function(k){f[k]=fd.getAll(k);if(!f[k].length)throw new Error('기술분야·상담유형·지원가능 지역·선정사유를 각각 선택하세요.');});f.id=id;f.available=!!f.available;var saved;if(commit(function(){saved=store.saveDoctor(f);},'기술닥터 정보를 저장했습니다.'))go('doctor/'+saved);}
    else if(form.id==='rms-match-form'){if(commit(function(){store.requestMatch(id,f.request);},'가상 매칭 요청이 접수되었습니다.'))go('matches');}
    else if(form.id==='rms-result-form'){commit(function(){store.progressMatch(id,'지원완료',f.result);},'지원실적을 등록했습니다. 통계에서 확인할 수 있습니다.');}
    else if(form.id==='rms-program-form'){var savedId;if(commit(function(){savedId=saveProgramForm(form);},'공고를 저장했습니다. JSON 내보내기에 포함됩니다.'))programDetail(savedId);}
    else if(form.id==='rms-company-form'){commit(saveCompanyForm,'기업정보를 저장했습니다.');}
    else if(form.id==='rms-file-form'){var file=form.elements.file.files[0];if(commit(function(){store.attachFile(ui.appId,id,file);},'파일명·크기를 저장했습니다. 실제 파일은 전송하지 않았습니다.'))docDetail(id);}
    else if(form.id==='rms-supplement-form'){commit(function(){store.requestSupplement(ui.appId,id,f.reason);},'보완을 요청했습니다. 지원기업 역할에서 확인할 수 있습니다.');}
    else if(form.id==='rms-code-form'){commit(function(){store.saveCode({id:id,kind:form.dataset.kind,name:f.name,parentId:f.parentId,active:!!f.active,visible:!!f.visible});},'분류체계를 저장했습니다.');}
    else if(form.id==='rms-work-map'){commit(function(){store.mapWork(f.from,f.to);},'FAQ 및 소통 게시물의 업무분류를 변경했습니다.');}
    else if(form.id==='rms-doctype-form'){commit(function(){store.saveDocumentType({id:id,name:f.name,provider:f.provider,active:!!f.active});},'서류 설정을 저장했습니다.');}
  }catch(err){showError(err);}}
  function eventChange(event) {var el=event.target;try{
    if(el.dataset.compare){if(el.checked&&ui.selected.size>=3){el.checked=false;throw new Error('기술닥터는 최대 3명까지 비교할 수 있습니다.');}if(el.checked)ui.selected.add(el.dataset.compare);else ui.selected.delete(el.dataset.compare);document.getElementById('rms-compare-count').textContent=ui.selected.size+'명 선택 · 최대 3명';}
    else if(el.id==='rms-consent'){commit(function(){store.consent(ui.appId,el.checked);},el.checked?'가상 정보제공 동의를 기록했습니다.':'가상 정보제공 동의를 철회했습니다.');}
    else if(el.name==='application'){ui.docStatus='';go('documents/'+el.value+'/'+(route()[2]||'3'));}
    else if(el.name==='userId'){var u=store.getState().users.find(function(x){return x.id===el.value;});if(u)host.querySelector('[name=organization]').value=u.organization;}
    else if(el.dataset.homeVisible){commit(function(){var s=store.getState().settings;s.homeVisible[el.dataset.homeVisible]=el.checked;store.updateSettings(s);},'메인 노출 설정을 저장했습니다.');}
    else if(el.dataset.questionVisible){commit(function(){store.updateQuestion(el.dataset.questionVisible,el.checked);},'게시물 노출 설정을 저장했습니다.');}
  }catch(err){showError(err);}}
  async function init() {
    try{var response=await fetch('data/seed.json');if(!response.ok)throw new Error('가상 초기자료를 읽을 수 없습니다.');var seed=await response.json(),storage;try{storage=window.localStorage;}catch(err){storage=null;}store=window.RMSCore.createStore(seed,storage);views=V.create(store,ui);root.addEventListener('click',eventClick);document.getElementById('rms-demo-sfr')?.addEventListener('click',eventClick);host.addEventListener('click',eventClick);root.addEventListener('submit',eventSubmit);host.addEventListener('submit',eventSubmit);root.addEventListener('change',eventChange);host.addEventListener('change',eventChange);window.addEventListener('hashchange',function(){closeModal();render(true);});
      document.getElementById('rms-role').addEventListener('change',function(ev){closeModal();store.setRole(ev.target.value);ui.docStatus='';render();toast('가상 사용자 역할을 변경했습니다.');});
      document.getElementById('rms-user-menu').addEventListener('click',function(ev){var el=ev.target.closest('[data-shell]');if(!el)return;if(el.dataset.shell==='login')login();else if(el.dataset.shell==='logout'){store.setRole('visitor');go('home');render();toast('로그아웃했습니다.');}else modal('회원정보','<p>'+e({company:'가상 한빛정밀 · 지원기업',tp:'충남TP · 관리기관',admin:'시스템 관리자'}[store.getSession().role])+'</p><p class="rms-muted rms-space">실제 회원정보는 SMTECH 인증과 연계됩니다.</p>');});
      document.getElementById('rms-export').addEventListener('click',actions.export);
      document.getElementById('rms-reset').addEventListener('click',actions['reset-confirm']);
      document.getElementById('rms-storage-info').addEventListener('click',function(){modal('시연 내용 저장 및 다른 PC에서 이어보기','<p><strong>시연내용 JSON 내보내기</strong>를 누르면 지원 브라우저에서 저장 창이 열립니다. 원하는 폴더와 파일명을 선택하세요.</p><p class="rms-space">지원하지 않는 환경에서는 안내 후 일반 다운로드를 이용합니다. Windows Chrome·Edge의 일반 다운로드는 Ctrl+J → 폴더에 표시로 위치를 확인할 수 있습니다.</p><p class="rms-note rms-space">화면별 저장은 smtech.rms.prototype.v1 키로 현재 브라우저에 보관합니다. 내보낸 JSON에는 저장된 전체 시연 자료와 역할·화면·검색조건이 포함됩니다. 다른 PC에서 JSON 불러오기 후 확인하면 같은 시연 내용을 이어볼 수 있습니다. 실제 인증 권한을 옮기는 것은 아닙니다.</p><p class="rms-space">입력만 하고 저장하지 않은 값과 열린 팝업은 포함되지 않습니다. 접수 증빙 첨부는 이름·크기와 처리이력만 복원하며 사업공고의 시연용 텍스트 첨부는 내용까지 복원합니다. 소스 다운로드는 개발자용 코드 ZIP이며, 개인 시연 데이터는 JSON으로 별도 전달하세요.</p>');});
      document.getElementById('rms-import').addEventListener('change',async function(ev){var input=ev.target,file=input.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('JSON은 5MB 이하로 선택해 주세요.');var text=await file.text();window.RMSCore.parseBackup(text);modal('시연 데이터 불러오기','<p>'+e(file.name)+'의 전체 시연 자료로 교체합니다. 이 PC의 기존 게시글·신청서·설정·처리이력은 남기지 않으며, 파일에 없는 기존 추가내용도 제거됩니다. 파일에는 내보낼 당시의 기초자료와 변경사항이 함께 들어 있습니다.</p><p class="rms-muted rms-space">현재 자료를 보관하려면 먼저 시연내용 JSON 내보내기를 선택하세요. 새 백업 파일은 시연 역할·화면·검색조건도 복원합니다.</p><div class="rms-actions rms-space">'+b('취소','close')+b('현재 시연내용 JSON 내보내기','export')+'<button type="button" class="rms-btn rms-btn-primary" id="rms-confirm-import">불러오기</button></div>');document.getElementById('rms-confirm-import').addEventListener('click',function(){var restored;if(commit(function(){restored=store.importJson(text);restorePresentation(restored);},'JSON 시연 데이터를 불러왔습니다.'))go(restored?restored.route:'home');});}catch(err){showError(err);}finally{input.value='';}});
      render();if(store.loadWarning)toast(store.loadWarning);if(!storage)toast('브라우저 저장소를 사용할 수 없습니다. JSON 저장으로 변경사항을 보관해 주세요.');
      // Minimal optional read-only WebMCP; no production API or personal data.
      if(document.modelContext?.registerTool){try{await document.modelContext.registerTool({name:'rms_search_demo_doctors',title:'가상 기술닥터 검색',description:'현재 가상 기술닥터 목록을 조회합니다. 데이터 변경이나 실제 기관 요청은 하지 않습니다.',inputSchema:{type:'object',properties:{query:{type:'string'},region:{type:'string'}},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:function(input){if(!input||Object.keys(input).some(function(k){return !['query','region'].includes(k);})||Object.values(input).some(function(v){return typeof v!=='string';}))throw new Error('검색어와 지역은 문자열이어야 합니다.');return store.searchDoctors({q:input.query||'',region:input.region||''}).map(function(d){return {id:d.id,name:d.name,organization:d.organization,supportRegions:d.supportRegions,available:d.available};});}});}catch(err){/* Unsupported optional capability does not block UI. */}}
    }catch(err){root.setAttribute('aria-busy','false');root.innerHTML='<div class="rms-error" role="alert">'+e(err.message)+'<br>프로젝트 루트에서 python tools/serve.py로 실행한 뒤 http://127.0.0.1:8080/region/rms/에 접속해 주세요.</div>';}
  }
  init();
}());
