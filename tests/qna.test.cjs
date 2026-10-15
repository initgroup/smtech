'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'../prototype/region/rms');
const core=require('../prototype/region/rms/demo/js/demo-store.js');
const security=require('../prototype/region/rms/static/js/rms-enhance/common/board-security.js');
const seed=JSON.parse(fs.readFileSync(path.join(base,'demo/data/seed.json'),'utf8'));
const make=()=>core.createStore(JSON.parse(JSON.stringify(seed)),null);
const input=(overrides={})=>Object.assign({title:'사업 신청 문의',body:'신청 절차를 알려 주세요.',work:'W01',public:true},overrides);
const password='Guest-demo-test-2026!';
test('members create, edit and delete Q&A; another role cannot forge ownership',async()=>{
  const store=make();store.setRole('company');
  const id=await store.saveQuestion(input({ownerKind:'member',ownerKey:'admin:충남'}));
  assert.equal(store.publicQuestions().find(q=>q.id===id).canManage,true);
  store.setRole('tp');
  await assert.rejects(store.saveQuestion(input({id})),/작성자/);
  await assert.rejects(store.removeQuestion(id),/작성자/);
  store.setRole('company');
  await store.saveQuestion(input({id,title:'변경한 제목'}));
  assert.equal(store.publicQuestions().find(q=>q.id===id).title,'변경한 제목');
  await store.removeQuestion(id);
  assert.equal(store.publicQuestions().some(q=>q.id===id),false);
});
test('guest credentials are salted PBKDF2; raw PII and password never enter stored content or public DTO',async()=>{
  const store=make();
  const id=await store.saveQuestion(input({title:'전화 010-1234-5678 문의',body:'회신 qa@example.test',password}));
  const saved=store.getState().questions.find(q=>q.id===id), dto=store.publicQuestions().find(q=>q.id===id);
  assert.match(saved.guestSalt,/^[a-f0-9]{32}$/);assert.match(saved.guestHash,/^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(saved),/010-1234-5678|qa@example\.test|Guest-demo-test/);
  assert.doesNotMatch(JSON.stringify(dto),/guestHash|guestSalt|ownerKey|password|authorName|companyName/);
  await assert.rejects(store.saveQuestion(input({id,password:'incorrect-password'})),/일치/);
  await assert.rejects(store.removeQuestion(id,'incorrect-password'),/일치/);
  await store.saveQuestion(input({id,title:'비회원 수정 완료',password}));
  assert.equal(store.publicQuestions().find(q=>q.id===id).title,'비회원 수정 완료');
  store.setRole('admin');
  assert.throws(()=>store.updateQuestion(id,true),/개인정보/);
  store.setRole('visitor');
  await store.removeQuestion(id,password);
  assert.equal(store.publicQuestions().some(q=>q.id===id),false);
});
test('private guest question is hidden until owner verification and can then be edited/deleted',async()=>{
  const store=make();
  const id=await store.saveQuestion(input({title:'비공개 문의',public:false,password}));
  assert.equal(store.publicQuestions().some(q=>q.id===id),false);
  assert.equal(store.visibleQuestions().some(q=>q.id===id),false);
  assert.equal(store.accessibleQuestions().some(q=>q.id===id),true);
  store.setRole('visitor');
  assert.equal(store.accessibleQuestions().some(q=>q.id===id),false);
  await assert.rejects(store.unlockQuestion(id,'incorrect-password'),/일치/);
  assert.equal(store.accessibleQuestions().some(q=>q.id===id),false);
  await store.unlockQuestion(id,password);
  assert.equal(store.accessibleQuestions().find(q=>q.id===id).public,false);
  await store.saveQuestion(input({id,password,public:false,title:'비공개 수정'}));
  await store.removeQuestion(id,password);
  assert.equal(store.accessibleQuestions().some(q=>q.id===id),false);
});
test('private member questions return only to the owner; server canView DTO is respected',async()=>{
  const store=make();store.setRole('company');
  const id=await store.saveQuestion(input({public:false}));
  assert.ok(store.accessibleQuestions().some(q=>q.id===id));
  store.setRole('tp');assert.equal(store.accessibleQuestions().some(q=>q.id===id),false);
  store.setRole('company');assert.ok(store.accessibleQuestions().some(q=>q.id===id));
  await store.removeQuestion(id);
});
test('guest comments/answers and official answers support owner CRUD and mask content',async()=>{
  const store=make();store.setRole('company');const id=await store.saveQuestion(input());
  store.setRole('visitor');
  await store.saveQuestionReply(id,{kind:'comment',body:'연락처 010-2222-3333',password,official:true});
  let q=store.publicQuestions().find(q=>q.id===id),reply=q.replies[0];
  assert.equal(reply.official,false);assert.doesNotMatch(reply.body,/010-2222-3333/);
  assert.equal(q.privacyDetected,true);
  await assert.rejects(store.removeQuestionReply(id,reply.id,'incorrect-password'),/일치/);
  await store.saveQuestionReply(id,{id:reply.id,kind:'answer',body:'일반 답변 내용',password});
  assert.equal(store.publicQuestions().find(q=>q.id===id).status,'답변완료');
  await store.removeQuestionReply(id,reply.id,password);
  assert.equal(store.publicQuestions().find(q=>q.id===id).status,'답변대기');
  store.setRole('tp');
  await store.saveQuestionReply(id,{kind:'answer',body:'기관 답변입니다.'});
  q=store.publicQuestions().find(q=>q.id===id);assert.equal(q.replies[0].official,true);
  store.setRole('company');await assert.rejects(store.removeQuestionReply(id,q.replies[0].id,''),/작성자/);
  store.setRole('tp');await store.removeQuestionReply(id,q.replies[0].id,'');
});
test('5 failed guest checks cause a demo attempt cooldown',async()=>{
  const store=make(),id=await store.saveQuestion(input({password}));
  for(let i=0;i<5;i++) await assert.rejects(store.unlockQuestion(id,'incorrect-password'),/일치/);
  await assert.rejects(store.unlockQuestion(id,password),/시도가 많습니다/);
});
test('legacy answer-only and reply-only PII is masked and excluded from main; server DTO missing flag is guarded',()=>{
  const samples=JSON.parse(JSON.stringify(seed));
  const first=samples.questions.find(q=>q.public&&q.mainVisible);
  first.title='개인정보 없는 질문';first.body='정상 본문';first.answer='qa@example.test';
  const store=core.createStore(samples,null),saved=store.getState().questions.find(q=>q.id===first.id);
  assert.equal(saved.privacyDetected,true);assert.equal(saved.mainVisible,false);
  assert.doesNotMatch(saved.answer,/qa@example/);
  assert.equal(store.visibleQuestions().some(q=>q.id===first.id),false);
  const queries=require('../prototype/region/rms/static/js/rms-enhance/data/selectors.js').create(()=>({state:{...samples,questions:[{...first,answer:'qa@example.test',privacyDetected:false,mainVisible:true}]},session:{role:'visitor'}}));
  assert.equal(queries.visibleQuestions().length,0);
  first.answer='정상 답변';first.privacyDetected=false;first.mainVisible=true;first.replies=[{id:'TEST-REPLY',kind:'comment',body:'010-1234-5678',date:'2026-10-15'}];
  const imported=core.createStore(samples,null).getState().questions.find(q=>q.id===first.id);
  assert.equal(imported.privacyDetected,true);assert.equal(imported.mainVisible,false);
  assert.doesNotMatch(imported.replies[0].body,/010-1234/);
});
test('no DOM sanitizer: fail closed to escaped plain text and drop all supplied HTML',()=>{
  const safe=security.prepare({title:'<img src=x onerror=alert(1)>',body:'안전한 내용',bodyHtml:'<script>alert(1)</script><img src=x onerror=alert(1)>'});
  assert.equal(safe.bodyHtml,'<p>안전한 내용</p>');
});
let JSDOM;
try { ({JSDOM}=require('../tmp/qa/node_modules/jsdom')); } catch {}
function browser() {
  const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
  for(const file of ['static/vendor/dompurify-3.4.16/purify.min.js','static/js/rms-enhance/common/privacy.js','static/js/rms-enhance/common/board-security.js']) dom.window.eval(fs.readFileSync(path.join(base,file),'utf8'));
  assert.equal(dom.window.DOMPurify.isSupported,true);
  return dom;
}
test('real DOMPurify removes executable markup, attributes and external URLs while keeping safe formatting',{skip:!JSDOM},()=>{
  const dom=browser(),w=dom.window;
  const result=w.RMSBoardSecurity.prepare({bodyHtml:'<p style="color:red" onclick="alert(1)"><strong>안내</strong></p><script>alert(1)</script><img src=x onerror=alert(1)><svg onload=alert(1)></svg><a href="https://qa.example">링크</a><iframe srcdoc="x"></iframe>'});
  assert.match(result.bodyHtml,/<strong>안내<\/strong>/);
  assert.doesNotMatch(result.bodyHtml,/<script|<img|<svg|<iframe|onclick|onerror|style=|href=|src=/);
  dom.window.close();
});
test('HTML split phone plus independent email cannot bypass privacy masking',{skip:!JSDOM},()=>{
  const dom=browser(),w=dom.window;
  const inputs=['<p>010</p><p>1234</p><p>5678</p><p>qa@example.test</p>','<p>010-<strong>1234</strong>-5678 &nbsp; qa&#64;example.test</p>','<p>０１０－１２３４－５６７８</p><p>qa@<em>example</em>.test</p>'];
  for(const bodyHtml of inputs) {
    const safe=w.RMSBoardSecurity.prepare({bodyHtml});
    assert.equal(safe.privacyDetected,true);
    assert.doesNotMatch(safe.body,/010[\s-]*1234[\s-]*5678|qa@example\.test/);
    assert.doesNotMatch(safe.bodyHtml,/010[\s-]*1234[\s-]*5678|qa@example/);
  }
  const union=w.RMSBoardSecurity.prepare({bodyHtml:'<p>이름: 홍길동</p><p>문의처</p><p>010</p><p>1234</p><p>5678</p><p>qa@example.test</p>'});
  assert.doesNotMatch(union.body,/홍길동|010[\s-]*1234[\s-]*5678|qa@example/);
  dom.window.close();
});
test('real Quill mount, format and privacy preview use the bundled editor',{skip:!JSDOM},()=>{
  const dom=browser(),w=dom.window;
  w.eval(fs.readFileSync(path.join(base,'static/vendor/quill-2.0.3/quill.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(base,'static/js/rms-enhance/ui/board-editor.js'),'utf8'));
  w.document.body.innerHTML='<form><input name="title" value="문의"><div data-board-editor></div><textarea name="body"></textarea><section data-board-preview hidden></section></form>';
  const form=w.document.querySelector('form');
  w.RMSBoardEditor.mount(form,{body:'일반 문의'});
  const editor=w.Quill.find(form.querySelector('[data-board-editor]'));
  assert.ok(editor);assert.equal(form.querySelector('[name=body]').hidden,true);
  editor.setText('기관 안내');editor.formatText(0,2,'bold',true);
  assert.match(w.RMSBoardEditor.read(form).bodyHtml,/<strong>기관<\/strong>/);
  editor.setText('연락처 010-1234-5678');
  const safe=w.RMSBoardEditor.preview(form);
  assert.equal(safe.privacyDetected,true);
  assert.doesNotMatch(form.querySelector('[data-board-preview]').textContent,/010-1234-5678/);
  dom.window.close();
});

test('legacy examples upgrade once while edited posts, replies and deleted posts are preserved',()=>{
  const examples=require('../prototype/region/rms/demo/generated/privacy-scenarios.js');
  function previous(){
    const old=JSON.parse(JSON.stringify(seed));delete old.settings.privacyExamplesVersion;
    old.questions=examples.legacy.filter((q,i,all)=>all.findIndex(x=>x.id===q.id)===i).map(q=>({...q}));
    return old;
  }
  const store=core.createStore(previous(),null),state=store.getState();
  assert.equal(state.settings.privacyExamplesVersion,examples.version);
  assert.equal(store.publicQuestions().length,16);
  assert.match(store.publicQuestions().find(q=>q.id==='P005').body,/건강보험번호 숨김/);
  const edited=previous(),row=edited.questions.find(q=>q.id==='P002');
  row.body='사용자가 직접 변경한 내용';row.bodyHtml='<p>사용자가 직접 변경한 내용</p>';
  const preserved=core.createStore(edited,null).publicQuestions().find(q=>q.id===row.id);
  assert.equal(preserved.body,row.body);
  const replied=previous(),q=replied.questions.find(q=>q.id==='P003');
  q.replies=[{id:'USER-COMMENT',kind:'comment',body:'사용자가 등록한 댓글',date:'2026-10-15'}];
  assert.equal(core.createStore(replied,null).publicQuestions().find(x=>x.id===q.id).replies[0].body,'사용자가 등록한 댓글');
  state.questions=state.questions.filter(q=>q.id!=='P008');
  assert.equal(core.createStore(state,null).publicQuestions().some(q=>q.id==='P008'),false,'one-time migration must not restore a deleted example');
  const legacyDeleted=previous();legacyDeleted.questions=legacyDeleted.questions.filter(q=>q.id!=='P001');
  assert.equal(core.createStore(legacyDeleted,null).publicQuestions().some(q=>q.id==='P001'),false);
});

// These tests exercise the actual public projection, not just fixture counts.
test('16 document-based posts exercise distinct privacy contexts without leaking synthetic originals',()=>{
  const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'../reference/privacy/examples/board-scenarios.json'),'utf8'));
  const privacy=require('../prototype/region/rms/static/js/rms-enhance/common/privacy.js');
  const store=make();
  assert.equal(fixture.cases.length,16);
  const types=new Set(),locations=new Set();
  for(const item of fixture.cases){
    const dto=store.publicQuestions().find(q=>q.id===item.post.id);assert.ok(dto,item.post.id);
    const raw=[item.post.title,item.post.body,item.post.answer,...item.post.replies.map(r=>r.body)];
    const safe=[dto.title,dto.body,dto.answer,...dto.replies.map(r=>r.body)];
    for(let i=0;i<raw.length;i++){
      const result=privacy.inspect(raw[i]);
      result.types.forEach(type=>types.add(type));
      assert.equal(safe[i],result.text.trim(),item.post.id+' field '+i);
      for(const finding of result.findings){
        const original=privacy.normalize(raw[i]).slice(finding.start,finding.end);
        assert.ok(!JSON.stringify(dto).includes(original),item.post.id+' leaked '+finding.type);
      }
      if(result.detected)locations.add(i===0?'title':i===1?'body':i===2?'answer':'comment');
    }
    assert.equal(dto.privacyDetected,false,'curated synthetic examples are already redacted');
    assert.ok(item.pdfPages.length>0);
  }
  assert.ok(types.size>=20);assert.deepEqual([...locations].sort(),['answer','body','comment','title']);
  assert.equal(store.visibleQuestions().length,16);
});


test('real DOMPurify preserves already-redacted multi-field posts and still masks changed HTML',{skip:!JSDOM},()=>{
  const dom=browser(),w=dom.window;
  const examples=require('../prototype/region/rms/demo/generated/privacy-scenarios.js');
  for(const post of examples.items){
    const safe=w.RMSBoardSecurity.prepare(post);
    assert.equal(safe.privacyDetected,false,post.id+' must stay redacted without a false positive');
    assert.equal(safe.body,post.body,post.id+' must preserve realistic wording and separate fields');
  }
  const injected=w.RMSBoardSecurity.prepare({bodyHtml:'<p>진단명: <strong>합성 의료 원문</strong></p><p>연락처 010</p><p>1234</p><p>5678</p>'});
  assert.equal(injected.privacyDetected,true);assert.doesNotMatch(injected.bodyHtml,/합성 의료 원문|1234|5678/);
  const fake=w.RMSBoardSecurity.prepare({body:'진료기록: [개인정보: 합성 환자의 원문 진료기록 숨김]'});
  assert.doesNotMatch(fake.body,/합성 환자의 원문/,'only canonical safe tokens bypass a repeated field replacement');
  dom.window.close();
});
