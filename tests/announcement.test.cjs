'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../prototype/region/rms/static/js/rms-enhance/core.js');
const seed=require('../prototype/region/rms/data/seed.json');
const clone=value=>JSON.parse(JSON.stringify(value));
const oldFields=['id','title','region','start','end','category','requiredDocs'];
const view={role:'admin',route:'home',ui:{doctorFilters:{},statsFilters:{},selected:[],faqQuery:'',faqWork:'',docStatus:'',codeKind:'technology',appId:'A001'}};
function memory(initial){let raw=initial||null;return {getItem:key=>key===core.storageKey?raw:null,setItem:(key,value)=>{assert.equal(key,core.storageKey);raw=value;},read:()=>raw};}

test('seed notices contain complete portable detail and real UTF-8 sample downloads',()=>{
  const data=core.validate(clone(seed));
  for(const p of data.programs){
    assert.equal(p.deadlineTime,'18:00');assert.equal(p.businessYear,'2026');
    assert.ok(p.projectName&&p.projectNumber&&p.noticeNumber&&p.industry&&p.institution&&p.publishedDate);
    assert.ok(p.intro.includes('가상'));assert.ok(p.supportPrograms.length>=2);assert.ok(p.contentSections.length>=4);assert.ok(p.contacts.length>=2);assert.equal(p.attachments.length,3);
    for(const file of p.attachments){assert.match(file.name,/\.txt$/);assert.equal(file.size,Buffer.byteLength(file.content,'utf8'));assert.ok(file.content.length>40);}
  }
});

test('legacy raw, wrapped and namespaced saved JSON receive populated notice defaults without merging collections',()=>{
  const legacy=clone(seed);
  legacy.programs=legacy.programs.map(p=>Object.fromEntries(oldFields.map(k=>[k,p[k]])));
  legacy.questions=[];legacy.programs[0].title='기존 PC에서 수정한 공고';
  const fromRaw=core.parseBackup(JSON.stringify(legacy)).data;
  const fromWrapped=core.parseBackup(JSON.stringify({format:'smtech-demo',version:1,data:legacy,presentation:view})).data;
  const db=memory(JSON.stringify(legacy)),store=core.createStore(clone(seed),db);
  assert.deepEqual(store.getState(),fromRaw);assert.deepEqual(fromWrapped,fromRaw);
  assert.deepEqual(fromRaw.questions,[]);assert.equal(fromRaw.programs[0].title,legacy.programs[0].title);
  assert.equal(fromRaw.programs[0].projectName,legacy.programs[0].title);
  assert.ok(fromRaw.programs.every(p=>p.contentSections.length&&p.contacts.length&&p.attachments.length&&p.deadlineTime==='18:00'));
  assert.equal(legacy.programs[0].projectName,undefined,'Normalization must not mutate imported caller objects');
  const empty=clone(fromRaw);empty.programs[0].attachments=[];empty.programs[0].contacts=[];empty.programs[0].contentSections=[];
  assert.deepEqual(core.parseBackup(JSON.stringify(empty)).data.programs[0].attachments,[]);
  assert.deepEqual(core.parseBackup(JSON.stringify(empty)).data.programs[0].contacts,[]);
  assert.deepEqual(core.parseBackup(JSON.stringify(empty)).data.programs[0].contentSections,[]);
});

test('notice saves are admin-only, allowlisted, atomic and portable including full attachment text',()=>{
  const db=memory(),store=core.createStore(clone(seed),db);
  const input={...store.getState().programs[0],title:'편집한 사업공고',deadlineTime:'17:30',intro:'시연에서 수정한 상세 본문',unknown:'must not persist',attachments:[{id:'CUSTOM',name:'사용자-안내.txt',mimeType:'text/plain',content:'한글과 English\n다른 PC에서도 그대로 읽는 내용 😀',size:0}]};
  const before=store.exportJson();
  for(const role of ['visitor','company','tp']){store.setRole(role);assert.throws(()=>store.saveProgram(input),/시스템 관리자/);assert.equal(store.exportJson(),before);}
  store.setRole('admin');assert.equal(store.saveProgram(input),'B001');
  let p=store.getState().programs[0];assert.equal(p.title,input.title);assert.equal(p.deadlineTime,'17:30');assert.equal(p.unknown,undefined);assert.equal(p.attachments[0].size,Buffer.byteLength(input.attachments[0].content,'utf8'));assert.ok(store.getState().audit[0].action.includes('사업공고'));
  assert.deepEqual(core.createStore(clone(seed),db).getState(),store.getState());
  const receiving=core.createStore(clone(seed),memory());receiving.setRole('admin');receiving.saveProgram({...input,attachments:[{id:'DEST-ONLY',name:'다른-PC.txt',mimeType:'text/plain',content:'가져온 파일에 없으므로 없어져야 함'}]});
  assert.deepEqual(receiving.importJson(store.exportBackup(view)),view);
  assert.deepEqual(receiving.getState(),store.getState());assert.equal(receiving.getState().programs[0].attachments[0].content,input.attachments[0].content);
  store.saveProgram({id:'B001',title:'부분 수정'});p=store.getState().programs[0];assert.equal(p.deadlineTime,'17:30');assert.deepEqual(p.attachments,receiving.getState().programs[0].attachments);
  const newInput=clone(input);delete newInput.id;const id=store.saveProgram(newInput);assert.notEqual(id,'B001');assert.equal(store.getState().programs.length,seed.programs.length+1);
});

test('notice validation rejects invalid dates, money, contacts and unsafe downloads without partial saves',()=>{
  const store=core.createStore(clone(seed),memory());store.setRole('admin');
  const before=store.exportJson(),p=store.getState().programs[0];
  const invalid=[{start:'2026-02-30'},{end:'2026-08-01'},{deadlineTime:'24:10'},{businessYear:'26'},
    {supportPrograms:[{...p.supportPrograms[0],amount:-1}]},{supportPrograms:[{...p.supportPrograms[0],amount:1.5}]},
    {contentSections:Array.from({length:31},()=>p.contentSections[0])},{contacts:[{...p.contacts[0],email:'bad@email'}]},
    {attachments:[{...p.attachments[0],name:'../notice.txt'}]},{attachments:[{...p.attachments[0],name:'unsafe.html',mimeType:'text/html',content:'<script>alert(1)</script>'}]},
    {attachments:[{...p.attachments[0],content:''}]},{requiredDocs:['F01','F01']},{id:'missing'}];
  for(const patch of invalid){assert.throws(()=>store.saveProgram({...p,...patch}),JSON.stringify(patch));assert.equal(store.exportJson(),before);}
  const corrupt=clone(seed);corrupt.programs[0].deadlineTime='99:00';assert.throws(()=>store.importJson(JSON.stringify(corrupt)));assert.equal(store.exportJson(),before);
  const malicious=JSON.stringify(seed).replace('"projectName":','"__proto__":{},"projectName":');assert.throws(()=>store.importJson(malicious));assert.equal(store.exportJson(),before);
});

test('notice storage failure rolls back and status handles upcoming, final day and closed dates',()=>{
  const db=memory(),store=core.createStore(clone(seed),db);store.setRole('admin');const before=store.exportJson();
  db.setItem=()=>{throw Error('quota exceeded');};assert.throws(()=>store.saveProgram({id:'B001',title:'저장 실패'}),/quota/);assert.equal(store.exportJson(),before);
  const p=seed.programs[0];assert.deepEqual(core.programStatus(p,'2026-08-31'),{label:'접수예정',state:'upcoming',daysLeft:30});
  assert.deepEqual(core.programStatus(p,p.end),{label:'모집중',state:'open',daysLeft:0});
  assert.deepEqual(core.programStatus(p,'2026-10-01'),{label:'접수마감',state:'closed',daysLeft:-1});
  assert.deepEqual(store.programStatus('B001'),core.programStatus(p,seed.demoDate));assert.deepEqual(store.programStatus(p),core.programStatus(p,seed.demoDate));
});
