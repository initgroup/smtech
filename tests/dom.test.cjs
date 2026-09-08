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

async function browser() {
  const {window} = parseHTML(html);
  const document = window.document;
  const values = new Map();
  const errors = [];
  const storage = {getItem:key => values.get(key) || null, setItem:(key,value) => values.set(key,value)};
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
  const sandbox={
    window,document,location,FormData:BrowserFormData,Blob,URL,
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
  function state(){return values.size?JSON.parse(values.values().next().value):JSON.parse(JSON.stringify(seed));}
  function healthy(){assert.equal(one('#rms-enhance-app').getAttribute('aria-busy'),'false');assert.doesNotMatch(one('#rms-enhance-app').textContent,/화면을 표시하지 못했습니다|가상 초기자료를 읽을 수 없습니다/,one('#rms-toast').textContent);assert.deepEqual(errors,[]);}
  healthy();
  return {window,document,one,click,change,submit,set,route,state,healthy,role:value=>change('#rms-role',value),text:()=>one('#rms-enhance-app').textContent};
}
function app(b){return b.state().applications.find(a=>a.id==='A001');}
function doc(b,id){return app(b).docs.find(d=>d.specId===id);}
function close(b){if(b.document.querySelector('dialog'))b.click('[data-action="close"]');}
function openDocs(b){b.role('company');b.route('documents/A001');}
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
