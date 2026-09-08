const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../prototype/region/rms/static/js/rms-enhance/core.js');
const seed=require('../prototype/region/rms/data/seed.json');
function storage(entries=[]){const values=new Map(entries);return {values,getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
const view={role:'company',route:'documents/A001/4',ui:{doctorFilters:{q:'가상',available:true},statsFilters:{},selected:[],faqQuery:'',faqWork:'',docStatus:'',codeKind:'technology',appId:'A001'}};

test('import replaces all site collections and removes destination-only board posts and settings',()=>{
  const clone=x=>JSON.parse(JSON.stringify(x));
  const source=clone(seed),destination=clone(seed);
  destination.questions.push({...destination.questions[0],id:'DESTINATION-ONLY',title:'이 PC에만 있는 기존 게시글'});
  destination.faqs.push({...destination.faqs[0],id:'DESTINATION-FAQ',title:'이 PC의 추가 FAQ'});
  destination.settings.homeVisible.help=false;
  destination.applications[0].representative='이 PC의 기존 대표';
  destination.audit.unshift({at:new Date().toISOString(),role:'admin',action:'기존 PC 이력'});
  source.questions.push({...source.questions[0],id:'IMPORTED-POST',title:'파일의 신규 게시글'});
  const db=storage([[core.storageKey,JSON.stringify(destination)],['other.app','keep']]);
  const target=core.createStore(seed,db),sender=core.createStore(source,null);
  target.importJson(sender.exportBackup(view));
  assert.deepEqual(target.getState(),source);
  assert.equal(target.getState().questions.some(q=>q.id==='DESTINATION-ONLY'),false);
  assert.deepEqual(core.createStore(seed,db).getState(),source);assert.equal(db.getItem('other.app'),'keep');
  // A file with no added posts must also remove destination-only posts.
  target.importJson(JSON.stringify(seed));assert.deepEqual(target.getState(),seed);
  // Empty collections are authoritative; do not resurrect deleted seed records.
  const empty=clone(seed);empty.questions=[];empty.faqs=[];
  target.importJson(JSON.stringify(empty));assert.deepEqual(target.getState().questions,[]);assert.deepEqual(target.getState().faqs,[]);
});

test('valid legacy data migrates to smtech key without touching another application',()=>{
  const old=core.createStore(seed,null);old.setRole('company');old.saveApplicationInfo('A001',{...old.getApplications()[0],representative:'이전 시연 대표'});
  const db=storage([['rms.prototype.v1',old.exportJson()],['other.app','keep']]);
  const current=core.createStore(seed,db);
  assert.equal(core.storageKey,'smtech.rms.prototype.v1');
  assert.deepEqual(current.getState(),old.getState());
  assert.equal(db.getItem('rms.prototype.v1'),null);assert.equal(db.getItem('other.app'),'keep');
  current.reset();assert.equal(db.getItem('other.app'),'keep');
  assert.deepEqual(core.createStore(seed,db).getState(),seed);
});

test('migration failure preserves legacy data, while existing namespaced data always wins',()=>{
  const db=storage([['rms.prototype.v1',JSON.stringify(seed)]]);
  db.setItem=()=>{throw Error('quota');};
  const s=core.createStore(seed,db);assert.deepEqual(s.getState(),seed);assert.match(s.loadWarning,/quota/);
  assert.ok(db.getItem('rms.prototype.v1'));
  const newer=core.createStore(seed,null);newer.setRole('company');newer.consent('A001',true);
  const both=storage([['rms.prototype.v1','not our JSON'],[core.storageKey,newer.exportJson()]]);
  assert.deepEqual(core.createStore(seed,both).getState(),newer.getState());
  assert.equal(both.getItem('rms.prototype.v1'),'not our JSON');
});

test('JSON roundtrip between independent PCs restores all records, history and view metadata',()=>{
  const first=core.createStore(seed,storage());first.setRole('company');
  first.consent('A001',true);first.attachFile('A001','F09',{name:'PC-A-proof.pdf',size:450});
  first.submitApplication('A001',true);first.requestMatch('D001','다른 PC로 이어가는 시연');
  const backup=first.exportBackup(view),secondDb=storage([['other.app','keep']]),second=core.createStore(seed,secondDb);
  assert.deepEqual(second.importJson(backup),view);assert.deepEqual(second.getState(),first.getState());
  assert.deepEqual(core.createStore(seed,secondDb).getState(),first.getState());
  assert.equal(secondDb.getItem('other.app'),'keep');
  const before=second.exportJson();
  const broken=JSON.parse(backup);broken.presentation.route='javascript:alert(1)';
  assert.throws(()=>second.importJson(JSON.stringify(broken)));assert.equal(second.exportJson(),before);
  broken.presentation=view;broken.version=999;assert.throws(()=>second.importJson(JSON.stringify(broken)));
  assert.equal(second.exportJson(),before);
  assert.equal(second.importJson(first.exportJson()),null,'Legacy raw JSON remains importable');
});
