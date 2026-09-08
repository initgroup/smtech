'use strict';

// Optional independent DOM QA: node --test tests/dom.test.cjs
// linkedom is a temporary QA dependency; the delivered prototype does not need it.
// Shims below model missing browser APIs, not application behavior or rendering.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parseHTML} = require('../tmp/qa/node_modules/linkedom');
const base = path.join(__dirname, '../prototype/region/rms');
const seed = JSON.parse(fs.readFileSync(path.join(base, 'data/seed.json'), 'utf8'));
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const scripts = ['core.js', 'views.js', 'app.js'].map(name => ({name, text: fs.readFileSync(path.join(base, 'static/js/rms-enhance', name), 'utf8')}));

async function browser(options={}) {
  const {window} = parseHTML(html);
  const document = window.document;
  const values = new Map(options.entries||[]);
  const errors = [];
  const downloads = [];
  const storage = {getItem:key => values.has(key)?values.get(key):null, setItem:(key,value) => values.set(key,value),removeItem:key=>values.delete(key)};
  Object.defineProperty(window.HTMLInputElement.prototype, 'checked', {
    configurable:true, get(){return this.hasAttribute('checked');},
    set(value){if(value)this.setAttribute('checked','');else this.removeAttribute('checked');}
  });
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable:true,
    get(){const option=this.querySelector('option[selected]') || this.querySelector('option');return option ? option.value : '';},
    set(value){this.querySelectorAll('option').forEach(option=>{if(option.value===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');});}
  });
  Object.defineProperty(window.HTMLAnchorElement.prototype, 'hash', {
    configurable:true, get(){return new URL(this.getAttribute('href')||'', 'http://127.0.0.1/region/rms/').hash;}
  });
  Object.defineProperty(window.HTMLElement.prototype, 'elements', {
    configurable:true, get(){if(this.localName!=='form')return undefined;const result={};this.querySelectorAll('[name]').forEach(el=>{result[el.name]=el;});return result;}
  });
  window.HTMLElement.prototype.showModal = function(){this.setAttribute('open','');};
  window.HTMLElement.prototype.close = function(){this.removeAttribute('open');};
  class BrowserFormData {
    constructor(form) {
      this.pairs=[];
      form.querySelectorAll('input,select,textarea').forEach(el=>{
        if(!el.name || el.disabled || ['submit','button','reset'].includes(el.type))return;
        if(['checkbox','radio'].includes(el.type) && !el.checked)return;
        if(el.type==='file'){(el.files||[]).forEach(file=>this.pairs.push([el.name,file]));return;}
        this.pairs.push([el.name,el.value || (el.type==='checkbox'?'on':'')]);
      });
    }
    entries(){return this.pairs[Symbol.iterator]();}
    getAll(name){return this.pairs.filter(pair=>pair[0]===name).map(pair=>pair[1]);}
  }
  let hash='';
  const location={
    get hash(){return hash;},
    set hash(value){const next=value && !value.startsWith('#')?'#'+value:value;if(next!==hash){hash=next;window.dispatchEvent(new window.Event('hashchange'));}}
  };
  window.localStorage=storage;
  window.innerWidth=options.width||1280;window.innerHeight=options.height||800;
  window.showSaveFilePicker=options.picker;
  const sandbox={
    window,document,location,FormData:BrowserFormData,Blob,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:qa-download';},revokeObjectURL(){}},
    console:{log(){},warn(){},error(...args){errors.push(args.join(' '));}},
    fetch:async url=>{assert.equal(url,'data/seed.json','QA must not contact production');return {ok:true,json:async()=>JSON.parse(JSON.stringify(seed))};},
    setTimeout:(fn,ms)=>{const timer=setTimeout(fn,ms);timer.unref();return timer;},clearTimeout,
    requestAnimationFrame:fn=>fn(0)
  };
  vm.createContext(sandbox);
  scripts.forEach(script=>vm.runInContext(script.text,sandbox,{filename:script.name}));
  await new Promise(resolve=>setImmediate(resolve));
  function one(selector){const el=document.querySelector(selector);assert.ok(el,'Missing DOM element: '+selector);return el;}
  function dispatch(el,type){el.dispatchEvent(new window.Event(type,{bubbles:true,cancelable:true}));}
  function click(selector){dispatch(typeof selector==='string'?one(selector):selector,'click');}
  function change(selector,value){const el=one(selector);if(el.type==='checkbox')el.checked=!!value;else el.value=value;dispatch(el,'change');}
  function submit(selector){dispatch(one(selector),'submit');}
  function set(selector,value){one(selector).value=value;}
  function route(value){location.hash=value;}
  function state(){return values.has('smtech.rms.prototype.v1')?JSON.parse(values.get('smtech.rms.prototype.v1')):JSON.parse(JSON.stringify(seed));}
  function healthy(){assert.equal(one('#rms-enhance-app').getAttribute('aria-busy'),'false');assert.doesNotMatch(one('#rms-enhance-app').textContent,/화면을 표시하지 못했습니다|가상 초기자료를 읽을 수 없습니다/,one('#rms-toast').textContent);assert.deepEqual(errors,[]);}
  healthy();
  return {window,document,one,click,change,submit,set,route,currentRoute:()=>location.hash,state,healthy,downloads,values,role:value=>change('#rms-role',value),text:()=>one('#rms-enhance-app').textContent};
}
function app(b){return b.state().applications.find(a=>a.id==='A001');}
function doc(b,id){return app(b).docs.find(d=>d.specId===id);}
function close(b){if(b.document.querySelector('dialog'))b.click('[data-action="close"]');}
function pointer(b,target,type,x,y){const ev=new b.window.Event(type,{bubbles:true,cancelable:true});Object.assign(ev,{clientX:x,clientY:y,pointerId:1,button:0});(typeof target==='string'?b.one(target):target).dispatchEvent(ev);}
function key(b,selector,value){const ev=new b.window.Event('keydown',{bubbles:true,cancelable:true});ev.key=value;b.one(selector).dispatchEvent(ev);}
function openDocs(b){b.role('company');b.route('documents/A001');}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function importFile(b,text){Object.defineProperty(b.one('#rms-import'),'files',{configurable:true,value:[{name:'smtech-PC-A.json',size:Buffer.byteLength(text),text:async()=>text}]});b.change('#rms-import','');await flush();}

test('save picker writes and closes a complete backup; a second PC restores role, route and data',async()=>{
  let written,pickerOptions,closed=false;
  const first=await browser({picker:async options=>{pickerOptions=options;return {name:'PC-A.json',createWritable:async()=>({write:async text=>{written=text;},close:async()=>{closed=true;},abort:async()=>{}})};}});
  openDocs(first);first.route('documents/A001/2');first.set('#rms-representative','PC A 가상 대표');first.submit('#rms-company-form');
  first.click('#rms-export');await flush();
  assert.ok(closed);assert.equal(pickerOptions.id,'smtech-demo-json');assert.equal(pickerOptions.types[0].accept['application/json'][0],'.json');
  assert.equal(first.downloads.length,0);assert.match(first.one('#rms-storage-help').textContent,/PC-A.json 저장 완료/);
  const second=await browser({entries:[['unrelated','keep']]});await importFile(second,written);
  assert.notEqual(app(second).representative,'PC A 가상 대표','Import requires confirmation');
  second.click('#rms-confirm-import');
  assert.equal(second.one('#rms-role').value,'company');assert.match(second.one('h1').textContent,/신청기업 정보/);
  assert.equal(second.one('#rms-representative').value,'PC A 가상 대표');assert.deepEqual(second.state(),first.state());
  assert.equal(second.values.get('unrelated'),'keep');second.healthy();
});

test('picker cancellation and write failure do not claim success or trigger an extra download',async()=>{
  for(const mode of ['cancel','write']){
    let aborted=false;
    const b=await browser({picker:async()=>{if(mode==='cancel')throw Object.assign(Error('cancelled'),{name:'AbortError'});return {name:'fail.json',createWritable:async()=>({write:async()=>{throw Error('disk full');},close:async()=>{throw Error('must not close');},abort:async()=>{aborted=true;}})};}});
    openDocs(b);const before=b.state();b.click('#rms-export');await flush();
    assert.equal(b.downloads.length,0);assert.deepEqual(b.state(),before);
    assert.match(b.one('#rms-toast').textContent,mode==='cancel'?/취소/:/저장에 실패/);
    if(mode==='write')assert.ok(aborted);
  }
});

test('search filters and comparison selection survive transfer; invalid imports leave the current PC intact',async()=>{
  let backup;
  const first=await browser({picker:async()=>({name:'filters.json',createWritable:async()=>({write:async text=>{backup=text;},close:async()=>{}})})});
  first.role('company');first.route('doctors');
  first.set('#rms-q',seed.doctors[0].name);first.submit('#rms-doctor-search');
  first.change('[data-compare="'+seed.doctors[0].id+'"]',true);
  first.click('#rms-export');await flush();
  const second=await browser();await importFile(second,backup);second.click('#rms-confirm-import');
  assert.equal(second.one('#rms-q').value,seed.doctors[0].name);
  assert.ok(second.one('[data-compare="'+seed.doctors[0].id+'"]').checked);
  assert.match(second.one('#rms-compare-count').textContent,/1명 선택/);
  const before=second.state();await importFile(second,'{invalid');
  assert.deepEqual(second.state(),before);assert.equal(second.document.querySelector('#rms-confirm-import'),null);second.healthy();
});

test('blocked save picker offers explicit fallback without silently downloading',async()=>{
  const b=await browser({picker:async()=>{throw Object.assign(Error('blocked'),{name:'SecurityError'});}});
  b.click('#rms-export');await flush();assert.equal(b.downloads.length,0);
  assert.match(b.one('dialog').textContent,/차단/);
  b.click('[data-action="export-fallback"]');assert.equal(b.downloads.length,1);
});

test('all pages and application steps render for every demo role with working global controls',async()=>{
  const b=await browser();
  const pages=['home','doctors','doctor/D001','matches','stats','documents','documents/A001/1','documents/A001/2','documents/A001/3','documents/A001/4','faq','questions','manage','manage/home','manage/documents','guide'];
  for(const role of ['visitor','company','tp','admin']){
    b.role(role);
    for(const page of pages){
      b.route(page);b.healthy();assert.ok(b.one('h1').textContent,role+' '+page);
      assert.equal(b.one('#rms-export').textContent,'시연내용 JSON 내보내기');
      assert.equal(b.one('#rms-source-download').getAttribute('href'),'downloads/smtech-source.zip');
      assert.equal(b.document.querySelector('#rms-enhance-app .rms-sfr-highlight'),null,'SFR tools must remain outside the actual page');
      if(page!=='guide')assert.ok(b.one('#rms-demo-sfr .rms-sfr-highlight'),role+' '+page+' must identify its requirements in the demo toolbar');
      b.click('#rms-storage-info');assert.match(b.one('dialog').textContent,/smtech.rms.prototype.v1/);close(b);
    }
  }
});

test('guide displays all extracted SFR details and screen badges open a layer without navigation',async()=>{
  const b=await browser();
  const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../reference/documents/requirements-catalog.json'),'utf8'));
  b.route('guide');
  assert.equal(b.document.querySelectorAll('[data-sfr-row]').length,15);
  for(const r of catalog.requirements.filter(r=>r.sourceId.startsWith('SFR-'))){
    const row=b.one('[data-sfr-row="'+r.sourceId+'"]');
    assert.ok(row.textContent.includes(r.definition));
    r.details.forEach(detail=>assert.ok(row.textContent.includes(detail),r.sourceId+': '+detail));
    assert.equal(row.closest('details'),null);
  }
  b.role('admin');
  const expected={home:['06','07','08','09','10'],doctors:['01','02','03','04'],'doctor/D001':['01','02','03','04'],matches:['03'],stats:['05'],faq:['07','08'],questions:['08','09'],manage:['02','08'],'manage/home':['08','09','10'],'manage/documents':['12'],'documents/A001/2':['13'],'documents/A001/3':['11','12','13','14','15'],'documents/A001/4':['14','15']};
  for(const [route,ids] of Object.entries(expected)){
    b.route(route);b.healthy();
    assert.deepEqual(Array.from(b.document.querySelectorAll('#rms-demo-sfr .rms-sfr-highlight'),el=>el.textContent),ids.map(id=>'SFR-'+id));
  }
  const page=b.one('h1');b.click('.rms-sfr-highlight');
  assert.equal(b.one('h1'),page);
  assert.match(b.one('#rms-sfr-layer-title').textContent,/SFR-14/);
  assert.equal(b.one('#rms-sfr-layer').getAttribute('aria-modal'),'false');
});

test('SFR layer preserves unsaved inputs, allows background saves and supports drag and both resize axes',async()=>{
  const b=await browser();openDocs(b);b.route('documents/A001/2');
  b.set('#rms-representative','레이어 비교 중 입력');b.click('.rms-sfr-highlight');
  const layer=b.one('#rms-sfr-layer');
  assert.equal(b.one('#rms-representative').value,'레이어 비교 중 입력');
  assert.match(layer.textContent,/SFR-13/);assert.equal(b.document.querySelector('dialog'),null);
  const pointer=(target,type,x,y)=>{const ev=new b.window.Event(type,{bubbles:true,cancelable:true});Object.assign(ev,{clientX:x,clientY:y,pointerId:1,button:0});target.dispatchEvent(ev);};
  const startLeft=parseFloat(layer.style.left),startTop=parseFloat(layer.style.top);
  pointer(b.one('[data-sfr-move]'),'pointerdown',100,100);pointer(b.document,'pointermove',50,120);pointer(b.document,'pointerup',50,120);
  assert.equal(parseFloat(layer.style.left),startLeft-50);assert.equal(parseFloat(layer.style.top),startTop+20);
  const width=parseFloat(layer.style.width),height=parseFloat(layer.style.height);
  pointer(b.one('[data-sfr-resize="x"]'),'pointerdown',100,100);pointer(b.document,'pointermove',60,100);pointer(b.document,'pointerup',60,100);
  assert.equal(parseFloat(layer.style.width),width-40);assert.equal(parseFloat(layer.style.height),height);
  pointer(b.one('[data-sfr-resize="y"]'),'pointerdown',100,100);pointer(b.document,'pointermove',100,50);pointer(b.document,'pointercancel',100,50);
  assert.equal(parseFloat(layer.style.height),height-50);
  const key=(selector,value)=>{const ev=new b.window.Event('keydown',{bubbles:true,cancelable:true});ev.key=value;b.one(selector).dispatchEvent(ev);};
  key('[data-sfr-resize="both"]','ArrowRight');assert.equal(parseFloat(layer.style.width),width-24);
  b.submit('#rms-company-form');assert.equal(app(b).representative,'레이어 비교 중 입력');assert.equal(b.one('#rms-sfr-layer'),layer);
  b.window.innerWidth=375;b.window.innerHeight=600;b.window.dispatchEvent(new b.window.Event('resize'));
  assert.ok(parseFloat(layer.style.left)+parseFloat(layer.style.width)<=367);
  key('[data-sfr-move]','Escape');assert.equal(b.document.querySelector('#rms-sfr-layer'),null);b.healthy();
});

const sfrNotes=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/sfr-implementation.json'),'utf8'));
test('all 15 SFR rows show concrete design, screen, technology, data and planned work with bullet menu links',async()=>{
  const b=await browser();b.route('guide');
  for(const r of sfrNotes.requirements){
    const row=b.one('[data-sfr-row="'+r.id+'"]'),cell=row.querySelector('td:last-child');
    for(const field of ['design','screen','technology','data'])assert.ok(cell.textContent.includes(r[field]),r.id+' '+field);
    for(const paragraph of r.followup)assert.ok(cell.textContent.includes(paragraph),r.id+' implementation plan');
    assert.equal(cell.querySelectorAll('.rms-sfr-bullet[aria-hidden="true"]').length,r.menus.length);
    assert.equal(cell.querySelectorAll('a[data-action="sfr-navigate"]').length,r.menus.length);
    assert.match(cell.textContent,/현재 구현/);assert.match(cell.textContent,/구현 계획/);
    r.menus.forEach(id=>{const link=cell.querySelector('[data-id="'+r.id+'/'+id+'"]');assert.equal(link.textContent,sfrNotes.menus[id].label);assert.ok(link.getAttribute('href').startsWith('#'));});
  }
  b.route('home');b.click('[data-action="sfr-open"][data-id="SFR-06"]');
  const six=sfrNotes.requirements.find(r=>r.id==='SFR-06');
  for(const field of ['design','screen','technology','data'])assert.ok(b.one('#rms-sfr-layer').textContent.includes(six[field]));
  six.followup.forEach(p=>assert.ok(b.one('#rms-sfr-layer').textContent.includes(p)));
});

test('every SFR menu opens its destination or a restricted role login, without navigating before login',async()=>{
  const b=await browser();
  for(const role of ['visitor','company','tp','admin'])for(const r of sfrNotes.requirements)for(const id of r.menus){
    const menu=sfrNotes.menus[id];b.role(role);b.route('guide');
    const event=new b.window.Event('click',{bubbles:true,cancelable:true});b.one('[data-id="'+r.id+'/'+id+'"]').dispatchEvent(event);
    assert.equal(event.defaultPrevented,true,'Prevent the anchor default before checking access');
    if(menu.roles.length&&!menu.roles.includes(role)){
      assert.equal(b.currentRoute(),'#guide');assert.equal(b.one('#rms-role').value,role);
      assert.ok(b.one('dialog').textContent.includes(menu.label));
      assert.deepEqual(Array.from(b.document.querySelectorAll('dialog [data-action="sfr-role-login"]'),el=>el.dataset.id),menu.roles);
      b.click('dialog [data-action="sfr-role-login"][data-id="'+menu.roles[0]+'"]');
      assert.equal(b.one('#rms-role').value,menu.roles[0]);
    }else assert.equal(b.document.querySelector('dialog'),null,'Already permitted or public link should navigate immediately');
    if(menu.record==='doctor')assert.match(b.currentRoute(),/^#doctor\//);
    else if(menu.step){assert.match(b.currentRoute(),new RegExp('^#documents/[^/]+/'+menu.step+'$'));assert.doesNotMatch(b.text(),/조회 가능한 신청서가 없습니다/);}
    else assert.equal(b.currentRoute(),'#'+menu.route);
    if(menu.codeKind)assert.ok(b.one('[data-action="code-kind"][data-id="'+menu.codeKind+'"]').hasAttribute('aria-current')||b.text().includes(menu.codeKind==='work'?'업무유형':'기술분야'));
    assert.equal(b.document.querySelector('dialog'),null);b.healthy();
  }
});

test('SFR layer links retain unsaved input on cancelled login and clear the layer after an authorized transition',async()=>{
  const b=await browser();b.role('company');b.click('[data-action="sfr-open"][data-id="SFR-10"]');
  // A modeless comparison layer remains open while another background page is edited.
  b.route('documents/A001/2');b.set('#rms-representative','이동 전 작성 중');
  b.click('#rms-sfr-layer [data-id="SFR-10/home-settings"]');
  assert.match(b.one('dialog').textContent,/시스템 관리자/);assert.equal(b.currentRoute(),'#documents/A001/2');
  const invalid=b.one('dialog [data-action="sfr-role-login"]');invalid.dataset.id='company';b.click(invalid);
  assert.match(b.one('[data-dialog-error]').textContent,/허용된 역할/);assert.equal(b.one('#rms-role').value,'company');
  close(b);assert.ok(b.one('#rms-sfr-layer'));assert.equal(b.one('#rms-representative').value,'이동 전 작성 중');
  assert.equal(app(b).representative,seed.applications[0].representative,'Reading requirements and cancelling login must not save the form');
  b.click('#rms-sfr-layer [data-id="SFR-10/home-settings"]');b.click('dialog [data-id="admin"]');
  assert.equal(b.one('#rms-role').value,'admin');assert.equal(b.currentRoute(),'#manage/home');
  assert.equal(b.document.querySelector('#rms-sfr-layer'),null);assert.equal(b.document.querySelector('dialog'),null);b.healthy();
  // Cancel from the guide must not leave a hidden destination for a later unrelated login.
  b.role('visitor');b.route('guide');b.click('[data-id="SFR-05/stats"]');close(b);
  b.route('home');b.click('[data-action="login"]');b.click('[data-action="role-login"][data-id="company"]');
  assert.equal(b.currentRoute(),'#home');assert.equal(b.one('#rms-role').value,'company');
});

test('SFR navigation resolves imported record IDs and handles legitimately empty collections without creating data',async()=>{
  const payload=JSON.parse(JSON.stringify(seed));const oldId=payload.doctors[0].id;
  payload.doctors[0].id='IMPORTED-DOCTOR';payload.matches.forEach(m=>{if(m.doctorId===oldId)m.doctorId='IMPORTED-DOCTOR';});
  payload.applications[0].id='IMPORTED-APPLICATION';
  const b=await browser({entries:[['smtech.rms.prototype.v1',JSON.stringify(payload)]]});b.route('guide');b.click('[data-id="SFR-01/doctor-detail"]');
  assert.equal(b.currentRoute(),'#doctor/IMPORTED-DOCTOR');b.role('company');b.route('guide');b.click('[data-id="SFR-13/company-info"]');
  assert.equal(b.currentRoute(),'#documents/IMPORTED-APPLICATION/2');b.healthy();
  payload.doctors=[];payload.matches=[];payload.applications=[];
  const empty=await browser({entries:[['smtech.rms.prototype.v1',JSON.stringify(payload)]]});empty.route('guide');empty.click('[data-id="SFR-01/doctor-detail"]');
  assert.equal(empty.currentRoute(),'#doctors');empty.role('company');empty.route('guide');empty.click('[data-id="SFR-13/company-info"]');
  assert.equal(empty.currentRoute(),'#documents');assert.deepEqual(empty.state(),payload);empty.healthy();
});

test('SFR layer starts wider on desktop and remains entirely within narrow viewport bounds',async()=>{
  const b=await browser({width:1280,height:800});b.click('[data-action="sfr-open"]');const layer=b.one('#rms-sfr-layer');
  assert.equal(parseFloat(layer.style.width),900);
  for(const [width,height] of [[740,700],[375,600],[320,480]]){
    b.window.innerWidth=width;b.window.innerHeight=height;b.window.dispatchEvent(new b.window.Event('resize'));
    assert.ok(parseFloat(layer.style.left)>=8);assert.ok(parseFloat(layer.style.top)>=8);
    assert.ok(parseFloat(layer.style.left)+parseFloat(layer.style.width)<=width-8);
    assert.ok(parseFloat(layer.style.top)+parseFloat(layer.style.height)<=height-8);
  }
});

test('screen saves stay in browser until full JSON export; toolbar explains folder and confirms reset',async()=>{
  const b=await browser();openDocs(b);b.route('documents/A001/2');
  b.set('#rms-representative','가상 저장 검증');b.submit('#rms-company-form');
  assert.equal(b.downloads.length,0);assert.equal(app(b).representative,'가상 저장 검증');
  b.set('#rms-representative','아직 저장하지 않은 값');
  b.click('#rms-export');assert.equal(b.downloads.length,0);
  assert.match(b.one('dialog').textContent,/저장할 위치를 매번 확인/);
  b.click('[data-action="export-fallback"]');assert.equal(b.downloads.length,1);close(b);
  const exported=JSON.parse(await b.downloads[0].text());
  assert.deepEqual(exported.data,b.state());
  assert.equal(exported.data.applications.find(a=>a.id==='A001').representative,'가상 저장 검증');
  assert.match(b.one('#rms-storage-help').textContent,/Ctrl\+J/);
  b.click('#rms-storage-info');assert.match(b.one('dialog').textContent,/폴더에 표시/);close(b);
  assert.equal(b.one('#rms-import').parentElement.nextElementSibling.id,'rms-source-download');
  assert.equal(b.one('#rms-source-download').nextElementSibling.id,'rms-reset');
  b.click('#rms-reset');assert.equal(app(b).representative,'가상 저장 검증');
  close(b);assert.equal(app(b).representative,'가상 저장 검증');
  b.click('#rms-reset');b.click('[data-action="reset"]');
  assert.equal(app(b).representative,seed.applications.find(a=>a.id==='A001').representative);
  b.healthy();
});
function queryNeeded(b){openDocs(b);b.change('#rms-consent',true);b.click('[data-action="query-required"]');}
function attach(b,id,name='synthetic-proof.pdf'){
  close(b);b.click('[data-action="doc-detail"][data-id="'+id+'"]');
  Object.defineProperty(b.one('#rms-document-file'),'files',{configurable:true,value:[{name,size:256}]});
  b.submit('#rms-file-form');
}

test('application steps navigate, save company info, validate input and preserve application context',async()=>{
  const b=await browser();openDocs(b);
  const step=n=>b.click('.rms-steps [data-id="'+n+'"]');
  assert.equal(b.document.querySelectorAll('.rms-steps button').length,4);
  step(1);assert.match(b.one('h1').textContent,/사업 선택/);
  b.click('[data-action="application-open"][data-id="A001"]');
  assert.match(b.one('h1').textContent,/신청기업 정보/);
  b.set('#rms-representative','가상 변경 대표');
  step(3);assert.equal(app(b).representative,'가상 변경 대표');
  step(2);assert.equal(b.one('#rms-representative').value,'가상 변경 대표');
  b.set('#rms-companyName','');step(4);
  assert.match(b.one('h1').textContent,/신청기업 정보/);
  assert.notEqual(app(b).companyName,'');
  b.set('#rms-companyName','가상 수정 기업');b.submit('#rms-company-form');
  step(4);assert.match(b.text(),/가상 수정 기업/);
  b.click('[data-action="submit"]');b.click('[data-action="submit-confirm"]');
  assert.notEqual(app(b).submission,'제출완료');close(b);
  b.route('documents/A001/2');assert.equal(b.one('#rms-companyName').value,'가상 수정 기업');
  b.role('admin');assert.ok(b.one('#rms-company-form fieldset').hasAttribute('disabled'));
  [1,2,3,4].forEach(n=>{step(n);b.healthy();assert.equal(b.one('.rms-steps button[aria-current]').dataset.id,String(n));});
});

test('final step supports file submission, locked review, supplement and resubmission',async()=>{
  const b=await browser();openDocs(b);b.route('documents/A001/4');
  const required=seed.programs.find(p=>p.id===app(b).programId).requiredDocs;
  required.forEach(id=>attach(b,id));close(b);
  b.click('[data-action="submit"]');b.click('[data-action="submit-confirm"]');
  assert.equal(app(b).submission,'제출완료');
  b.click('.rms-steps [data-id="2"]');assert.ok(b.one('fieldset').hasAttribute('disabled'));
  b.click('.rms-steps [data-id="4"]');assert.equal(b.document.querySelector('[data-action="submit"]'),null);
  b.role('tp');b.click('[data-action="supplement"][data-id="'+required[0]+'"]');
  b.set('#rms-reason','새 증빙 요청');b.submit('#rms-supplement-form');
  b.role('company');assert.match(b.text(),/새 증빙 요청/);attach(b,required[0]);close(b);
  b.click('[data-action="submit"]');b.click('[data-action="submit-confirm"]');
  assert.equal(app(b).submission,'제출완료');b.healthy();
});

test('real scripts bootstrap home without errors and preserve the public shell',async()=>{
  const b=await browser();
  assert.match(b.one('h1').textContent,/기업의 성장/);
  assert.equal(b.document.querySelectorAll('.rms-announcement').length,seed.programs.length);
  assert.ok(b.document.querySelector('#header .rms-demo-nav'));
  assert.ok(b.document.querySelector('#rms-faq-search'));
  b.click('[data-shell="login"]');
  assert.ok(b.one('dialog').hasAttribute('open'));
  b.click('[data-action="role-login"][data-id="company"]');
  assert.match(b.one('#rms-user-menu').textContent,/가상 한빛정밀/);
  assert.equal(b.document.querySelector('dialog'),null);
  b.healthy();
});

test('prototype role, backup tools, instructions and SFR context are isolated above the public header',async()=>{
  const b=await browser();
  const toolbar=b.one('#rms-demo-tools'),header=b.one('#header');
  assert.equal(toolbar.nextElementSibling,header);
  assert.match(toolbar.textContent,/기능개선 시연/);
  assert.match(toolbar.textContent,/실제 업무 화면에 포함되지 않습니다/);
  for(const id of ['rms-role','rms-export','rms-storage-info','rms-import','rms-source-download','rms-reset','rms-storage-help','rms-demo-sfr']){
    assert.ok(toolbar.contains(b.one('#'+id)),id+' must stay inside the dedicated prototype toolbar');
    assert.equal(header.querySelector('#'+id),null);
    assert.equal(b.document.querySelector('#rms-enhance-app #'+id),null);
  }
  assert.equal(b.document.querySelector('#rms-enhance-app .rms-sfr-highlight'),null);
  assert.ok(b.one('#rms-demo-sfr .rms-sfr-highlight'));
});

test('announcement cards identify the reception period and closing date; details display all saved public information',async()=>{
  const b=await browser();
  for(const program of seed.programs){
    const card=b.one('[data-action="program"][data-id="'+program.id+'"]').closest('.rms-announcement');
    assert.match(card.textContent,/접수기간/);assert.match(card.textContent,/마감/);
    assert.ok(card.textContent.includes(program.start));assert.ok(card.textContent.includes(program.end));
    assert.ok(card.textContent.includes(program.deadlineTime));
    b.click(card.querySelector('[data-action="program"]'));
    const dialog=b.one('dialog');assert.ok(dialog.hasAttribute('open'));
    for(const label of ['공고정보','과제명','과제번호','사업연도','공고번호','접수기간','접수마감','산업명','지원프로그램','공고내용','수행기관','공고일','담당자정보','첨부파일'])assert.ok(dialog.textContent.includes(label),label);
    for(const field of ['title','projectName','projectNumber','businessYear','noticeNumber','start','end','deadlineTime','industry','intro','institution','publishedDate'])assert.ok(dialog.textContent.includes(program[field]),program.id+' '+field);
    program.supportPrograms.forEach(row=>{for(const field of ['target','name','description'])assert.ok(dialog.textContent.includes(row[field]),program.id+' support '+field);assert.ok(dialog.textContent.includes(row.amount.toLocaleString('ko-KR')));});
    program.contentSections.forEach(section=>{assert.ok(dialog.textContent.includes(section.heading));assert.ok(dialog.textContent.includes(section.body));});
    program.contacts.forEach(row=>{for(const field of ['institution','name','phone','email','duty'])assert.ok(dialog.textContent.includes(row[field]),program.id+' contact '+field);});
    for(const file of program.attachments){
      assert.ok(dialog.textContent.includes(file.name));
      const count=b.downloads.length;
      b.click('[data-action="program-attachment"][data-id="'+program.id+'/'+file.id+'"]');
      assert.equal(b.downloads.length,count+1);
      assert.equal(await b.downloads[count].text(),file.content);
      assert.equal(b.downloads[count].type,'text/plain;charset=utf-8');
      assert.equal(b.downloads[count].size,file.size);
    }
    assert.ok(b.one('.rms-program-info'));assert.ok(b.one('[data-dialog-move]'));
    close(b);b.healthy();
  }
  b.role('company');b.route('documents/A001/1');
  const card=b.one('[data-action="program"]').closest('.rms-announcement');
  assert.match(card.textContent,/접수기간/);assert.match(card.textContent,/마감/);
});

test('program dialogs move with pointer and keyboard while staying within a narrow viewport',async()=>{
  const b=await browser();b.click('[data-action="program"]');
  const dialog=b.one('dialog'),title=b.one('[data-dialog-move]');
  // A fixed geometry fixture exercises clamping logic; linkedom does not perform browser layout.
  const startLeft=40,startTop=60;
  dialog.getBoundingClientRect=()=>({left:startLeft,top:startTop,width:Math.min(800,b.window.innerWidth-16),height:Math.min(500,b.window.innerHeight-16)});
  // Pointer capture directs browser move/up events back to the title handle.
  pointer(b,title,'pointerdown',100,100);pointer(b,title,'pointermove',85,112);pointer(b,title,'pointerup',85,112);
  assert.equal(parseFloat(dialog.style.left),startLeft-15);assert.equal(parseFloat(dialog.style.top),startTop+12);
  key(b,'[data-dialog-move]','ArrowRight');
  assert.ok(parseFloat(dialog.style.left)>startLeft-15);
  b.window.innerWidth=375;b.window.innerHeight=600;b.window.dispatchEvent(new b.window.Event('resize'));
  pointer(b,title,'pointerdown',50,50);pointer(b,title,'pointermove',-1000,-1000);pointer(b,title,'pointercancel',-1000,-1000);
  assert.ok(parseFloat(dialog.style.left)>=0);assert.ok(parseFloat(dialog.style.top)>=0);
  const clampedLeft=dialog.style.left,clampedTop=dialog.style.top;
  pointer(b,title,'pointermove',500,500);
  assert.equal(dialog.style.left,clampedLeft);assert.equal(dialog.style.top,clampedTop,'Cancelled drag must stop changing position');
  assert.ok(dialog.hasAttribute('open'));close(b);assert.equal(b.document.querySelector('dialog'),null);b.healthy();
});

test('legacy JSON gains announcement details and replaces this PC including old announcement content',async()=>{
  const destination=JSON.parse(JSON.stringify(seed)),oldBackup=JSON.parse(JSON.stringify(seed));
  destination.programs[0].title='이 PC에서만 작성한 사업공고';
  destination.programs[0].contentSections=[{heading:'이 PC 전용 문단',body:'가져오면 남아 있으면 안 되는 본문'}];
  destination.questions.push({...destination.questions[0],id:'THIS-PC-POST',title:'이 PC 전용 게시글'});
  const legacyFields=new Set(['id','title','region','start','end','category','requiredDocs']);
  oldBackup.programs.forEach(program=>{for(const field of Object.keys(program))if(!legacyFields.has(field))delete program[field];});
  oldBackup.programs[0].title='이전 버전 JSON에서 불러온 공고';
  const b=await browser({entries:[['smtech.rms.prototype.v1',JSON.stringify(destination)],['another.app.data','untouched']]});
  await importFile(b,JSON.stringify(oldBackup));
  assert.equal(b.state().programs[0].title,destination.programs[0].title,'Import confirmation must happen before replacement');
  b.click('#rms-confirm-import');
  assert.equal(b.state().programs[0].title,oldBackup.programs[0].title);
  assert.equal(b.state().questions.some(q=>q.id==='THIS-PC-POST'),false);
  assert.equal(b.values.get('another.app.data'),'untouched');
  b.click('[data-action="program"][data-id="'+oldBackup.programs[0].id+'"]');
  assert.match(b.one('dialog').textContent,/이전 버전 JSON에서 불러온 공고/);
  assert.match(b.one('dialog').textContent,/사업개요/);
  assert.doesNotMatch(b.one('dialog').textContent,/이 PC 전용 문단|남아 있으면 안 되는 본문/);
  assert.ok(b.state().programs[0].contentSections.length);
  assert.ok(b.state().programs[0].attachments.length);b.healthy();
});

test('imported announcement content is displayed as text and explicit empty lists stay empty',async()=>{
  const payload=JSON.parse(JSON.stringify(seed));
  const program=payload.programs[0];
  program.intro='<img src=x onerror="alert(1)"> 내용 그대로';
  program.contentSections=[{heading:'<script>not executable</script>',body:'<iframe src="https://invalid.example">본문</iframe>'}];
  program.supportPrograms=[];program.contacts=[];program.attachments=[];
  const b=await browser();await importFile(b,JSON.stringify(payload));b.click('#rms-confirm-import');
  b.click('[data-action="program"][data-id="'+program.id+'"]');
  assert.ok(b.one('dialog').textContent.includes(program.intro));
  assert.ok(b.one('dialog').textContent.includes(program.contentSections[0].body));
  assert.equal(b.document.querySelector('dialog img,dialog script,dialog iframe'),null);
  assert.deepEqual(b.state().programs[0].attachments,[]);
  assert.deepEqual(b.state().programs[0].contacts,[]);b.healthy();
});

test('administrator edits structured announcement content, exports once and restores it with attachments on another PC',async()=>{
  let backup;
  const first=await browser({picker:async()=>({name:'공고-시연.json',createWritable:async()=>({write:async text=>{backup=text;},close:async()=>{}})})});
  first.role('admin');first.click('[data-action="program"][data-id="'+seed.programs[0].id+'"]');
  first.click('dialog [data-action="program-edit"]');
  const invalidTitle='';first.set('#rms-title',invalidTitle);first.submit('#rms-program-form');
  assert.ok(first.one('#rms-program-form'));assert.equal(first.state().programs[0].title,seed.programs[0].title);
  first.set('#rms-title','다른 PC로 옮기는 가상 사업공고');first.set('#rms-deadlineTime','17:30');
  first.set('#rms-intro','새로 작성한 공고 소개와\n두 번째 줄');
  const rowField=(kind,field)=>'[data-program-row="'+kind+'"] [data-program-field="'+field+'"]';
  first.set(rowField('supportPrograms','amount'),'42000000');
  first.set(rowField('contentSections','body'),'보완한 사업개요\n온라인 접수 안내');
  first.set(rowField('contacts','email'),'demo@example.test');
  for(const row of Array.from(first.document.querySelectorAll('[data-program-row="attachments"]')))first.click(row.querySelector('[data-action="program-row-remove"]'));
  first.click('[data-action="program-row-add"][data-id="attachments"]');
  first.set(rowField('attachments','name'),'사용자-추가-안내.txt');
  first.set(rowField('attachments','content'),'다른 PC에서도 읽히는 첨부파일\n가상 신청 안내');
  first.click('[data-action="program-row-add"][data-id="contentSections"]');
  const extra=Array.from(first.document.querySelectorAll('[data-program-row="contentSections"]')).at(-1);
  extra.querySelector('[data-program-field="heading"]').value='추가 안내';
  extra.querySelector('[data-program-field="body"]').value='새로 추가한 시연 공고 문단';
  first.submit('#rms-program-form');
  assert.equal(first.document.querySelector('#rms-program-form'),null,'Successful save must return to public announcement details');
  const saved=first.state().programs[0];assert.equal(saved.title,'다른 PC로 옮기는 가상 사업공고');
  assert.equal(saved.deadlineTime,'17:30');assert.equal(saved.supportPrograms[0].amount,42000000);
  assert.equal(saved.contentSections.at(-1).body,'새로 추가한 시연 공고 문단');
  assert.equal(saved.contacts[0].email,'demo@example.test');assert.equal(saved.attachments.length,1);
  assert.equal(first.downloads.length,0,'Per-page saves must not trigger JSON downloads');
  close(first);first.click('#rms-export');await flush();
  const second=await browser();await importFile(second,backup);second.click('#rms-confirm-import');
  assert.deepEqual(second.state(),first.state());
  second.click('[data-action="program"][data-id="'+saved.id+'"]');
  assert.match(second.one('dialog').textContent,/다른 PC로 옮기는 가상 사업공고/);
  assert.match(second.one('dialog').textContent,/새로 추가한 시연 공고 문단/);
  second.click('[data-action="program-attachment"]');
  assert.equal(await second.downloads[0].text(),saved.attachments[0].content);second.healthy();
});

test('new administrator announcement records appear publicly and company roles cannot edit them',async()=>{
  const b=await browser();b.role('admin');
  b.click('[data-action="program-edit"][data-id=""]');
  const fields={title:'새로 등록한 가상 지원사업',projectName:'신규 가상 과제',projectNumber:'DEMO-NEW-2026',noticeNumber:'DEMO-NOTICE-NEW',businessYear:'2026',region:'부산',category:'기업지원',industry:'바이오·의료',start:'2026-09-01',end:'2026-09-30',deadlineTime:'16:00',publishedDate:'2026-08-25',institution:'가상 지원기관',intro:'신규 사업공고 등록을 확인하는 가상 안내'};
  for(const [field,value] of Object.entries(fields))b.set('#rms-'+field,value);
  b.submit('#rms-program-form');
  const created=b.state().programs.find(program=>program.title===fields.title);
  assert.ok(created,'New program must be saved: '+(b.document.querySelector('[data-dialog-error]')?.textContent||''));
  assert.equal(b.state().programs.length,seed.programs.length+1);
  assert.ok(b.one('.rms-program-info').textContent.includes(fields.projectNumber));
  close(b);b.role('company');b.route('home');
  assert.equal(b.document.querySelector('[data-action="program-edit"]'),null);
  b.click('[data-action="program"][data-id="'+created.id+'"]');
  assert.equal(b.document.querySelector('dialog [data-action="program-edit"]'),null);
  assert.match(b.one('dialog').textContent,/새로 등록한 가상 지원사업/);b.healthy();
});

test('hash routes and role changes render company, TP and administrator screens',async()=>{
  const b=await browser();
  b.route('documents');assert.match(b.text(),/사용자 역할을 지원기업/);
  b.role('company');assert.ok(b.document.querySelector('#rms-consent'));
  b.route('doctors');assert.ok(b.document.querySelector('#rms-doctor-search'));
  b.route('stats');assert.match(b.text(),/통계는 관리기관/);
  b.role('tp');assert.ok(b.document.querySelector('#rms-stats-search'));
  b.route('manage');assert.match(b.text(),/시스템 관리자로 전환/);
  b.role('admin');assert.ok(b.document.querySelector('[data-action="code-edit"]'));
  ['manage/home','manage/documents','questions','faq','matches','guide'].forEach(route=>{b.route(route);b.healthy();assert.ok(b.document.querySelector('h1'));});
});

test('home FAQ search form navigates and renders actual matching answers',async()=>{
  const b=await browser();
  const faq=seed.faqs.find(f=>f.published);
  b.set('#rms-home-query',faq.title);
  b.submit('#rms-faq-search');
  assert.match(b.one('h1').textContent,/자주하는 질문/);
  assert.ok([...b.document.querySelectorAll('.rms-faqs summary')].some(el=>el.textContent===faq.title));
  assert.match(b.text(),/검색결과/);
  b.healthy();
});

test('doctor search submit filters rows and checkbox comparison opens selected expert table',async()=>{
  const b=await browser();b.route('doctors');
  b.set('#rms-q',seed.doctors[0].name);b.submit('#rms-doctor-search');
  assert.equal(b.document.querySelectorAll('[data-compare]').length,1);
  assert.equal(b.one('[data-compare]').dataset.compare,seed.doctors[0].id);
  b.click('[data-action="doctor-reset"]');
  const boxes=[...b.document.querySelectorAll('[data-compare]')];
  boxes.slice(0,3).forEach(el=>b.change('[data-compare="'+el.dataset.compare+'"]',true));
  b.change('[data-compare="'+boxes[3].dataset.compare+'"]',true);
  assert.equal(boxes[3].checked,false);
  assert.match(b.one('#rms-compare-count').textContent,/3명 선택/);
  b.click('[data-action="compare"]');
  assert.match(b.one('#rms-dialog-title').textContent,/기술닥터 비교/);
  assert.equal(b.one('dialog table thead tr').children.length,4);
  close(b);assert.equal(b.document.querySelector('dialog'),null);
  b.healthy();
});

test('doctor registration user selection populates organization and submitted form creates detail/history',async()=>{
  const b=await browser();b.role('tp');b.route('doctors');
  b.click('[data-action="doctor-edit"][data-id=""]');
  const user=seed.users.find(u=>!seed.doctors.some(d=>d.userId===u.id));
  b.change('#rms-userId',user.id);
  assert.equal(b.one('#rms-organization').value,user.organization);
  b.set('#rms-degree','가상 공학박사');b.set('#rms-acquiredTechnology','가상 품질 분석');
  b.set('#rms-career','가상 기업지원 경력');b.set('#rms-certificates','없음');
  ['technologies','consultations','supportRegions','reasons'].forEach(name=>{const el=b.one('dialog input[name="'+name+'"]');el.checked=true;});
  b.submit('#rms-doctor-form');
  const created=b.state().doctors.find(d=>d.userId===user.id);
  assert.ok(created,'Form must create a synthetic doctor; dialog error: '+(b.document.querySelector('[data-dialog-error]')?.textContent||''));
  assert.equal(created.organization,user.organization);
  assert.match(b.one('h1').textContent,new RegExp(user.name));
  assert.ok(created.history.length);
  assert.equal(b.document.querySelector('dialog'),null);
  b.healthy();
});

test('TP detail edit saves changed fields while another region remains read-only',async()=>{
  const b=await browser();b.role('tp');
  const own=seed.doctors.find(d=>d.owner==='충남'),other=seed.doctors.find(d=>d.owner!=='충남');
  b.route('doctor/'+other.id);assert.equal(b.document.querySelector('[data-action="doctor-edit"]'),null);
  b.route('doctor/'+own.id);b.click('[data-action="doctor-edit"]');
  b.set('#rms-career','DOM 시연 검증용 가상 경력');b.submit('#rms-doctor-form');
  assert.equal(b.state().doctors.find(d=>d.id===own.id).career,'DOM 시연 검증용 가상 경력');
  assert.match(b.text(),/DOM 시연 검증용 가상 경력/);
  b.healthy();
});

test('document consent, batch query, mismatch choice and failed-query retry run through delegated events',async()=>{
  const b=await browser();openDocs(b);
  b.click('[data-action="query-required"]');assert.match(b.one('#rms-toast').textContent,/동의한 후/);
  const before=app(b).inputAddress;
  b.change('#rms-consent',true);assert.equal(app(b).consent,true);
  b.click('[data-action="query-required"]');
  assert.equal(doc(b,'F01').issue,'mismatch');assert.equal(app(b).inputAddress,before);
  b.click('[data-action="doc-detail"][data-id="F01"]');
  assert.match(b.one('dialog').textContent,/신청서 주소/);
  b.click('[data-action="mismatch-apply"]');
  assert.equal(app(b).inputAddress,app(b).address);assert.equal(doc(b,'F01').status,'조회완료');
  close(b);b.click('[data-action="doc-retry"][data-id="F06"]');
  assert.equal(doc(b,'F06').status,'조회완료');
  assert.match(b.one('dialog').textContent,/재조회/);
  b.healthy();
});

test('file form, submit confirmation, locked controls, institution supplement and resubmission work',async()=>{
  const b=await browser();queryNeeded(b);
  b.click('[data-action="doc-detail"][data-id="F01"]');b.click('[data-action="mismatch-apply"]');close(b);
  b.click('[data-action="doc-retry"][data-id="F06"]');close(b);
  const program=seed.programs.find(p=>p.id===app(b).programId);
  program.requiredDocs.forEach(id=>{if(doc(b,id).status!=='조회완료')attach(b,id);});close(b);
  b.click('[data-action="submit"]');b.click('[data-action="submit-confirm"]');
  assert.equal(app(b).submission,'제출완료');assert.equal(b.one('#rms-consent').disabled,true);
  assert.equal(b.document.querySelector('#rms-enhance-app [data-action="doc-query"]'),null);
  b.role('tp');b.click('[data-action="supplement"][data-id="F01"]');
  b.set('#rms-reason','가상 추가 증빙 요청');b.submit('#rms-supplement-form');
  assert.equal(app(b).submission,'작성중');assert.equal(doc(b,'F01').issue,'supplement');
  b.role('company');attach(b,'F01','synthetic-supplement.pdf');close(b);
  b.click('[data-action="submit"]');b.click('[data-action="submit-confirm"]');
  assert.equal(app(b).submission,'제출완료');assert.equal(doc(b,'F01').file.name,'synthetic-supplement.pdf');
  b.healthy();
});

test('administrator code form persists changes and main visibility affects only the intended listing',async()=>{
  const b=await browser();b.role('admin');b.route('manage');
  b.click('[data-action="code-edit"][data-id=""]');b.set('#rms-name','DOM 가상 기술분류');b.submit('#rms-code-form');
  assert.ok(b.state().classifications.some(c=>c.name==='DOM 가상 기술분류'));
  assert.match(b.text(),/DOM 가상 기술분류/);
  b.route('manage/home');const q=seed.questions.find(q=>q.public&&q.mainVisible);
  b.change('[data-question-visible="'+q.id+'"]',false);
  b.route('home');assert.equal(b.document.querySelector('[data-action="question"][data-id="'+q.id+'"]'),null);
  b.route('questions');b.click('[data-action="question"][data-id="'+q.id+'"]');
  assert.match(b.one('dialog').textContent,new RegExp(q.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  b.healthy();
});

test('statistics form reports reversed dates and applies a valid region filter',async()=>{
  const b=await browser();b.role('tp');b.route('stats');
  b.set('#rms-start','2026-12-31');b.set('#rms-end','2026-01-01');b.submit('#rms-stats-search');
  assert.match(b.one('#rms-toast').textContent,/종료일은 시작일 이후/);
  b.set('#rms-start','2026-01-01');b.set('#rms-end','2026-12-31');b.change('#rms-region','충남');b.submit('#rms-stats-search');
  const expected=seed.doctors.filter(d=>d.owner==='충남').length;
  assert.match(b.one('.rms-metric strong').textContent,new RegExp('^'+expected));
  assert.ok(b.document.querySelector('[data-action="stats-export"]'));
  b.healthy();
});
