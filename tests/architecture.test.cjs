'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),web=path.join(root,'prototype/region/rms'),js=path.join(web,'static/js/rms-enhance');
const example=JSON.parse(fs.readFileSync(path.join(web,'contracts/snapshot.example.json'),'utf8'));
const copy=value=>JSON.parse(JSON.stringify(value));
function runtime(){const sandbox={window:{location:{href:'https://intranet.example/rms/',origin:'https://intranet.example'}},URL,FormData};Object.defineProperty(sandbox.window,'localStorage',{get(){throw Error('Server adapter must not touch browser persistence');}});for(const file of ['generated/templates.js','common/templates.js','common/components.js','generated/contracts.js','data/selectors.js','adapters/http.js','common/commands.js'])vm.runInNewContext(fs.readFileSync(path.join(js,file),'utf8'),sandbox,{filename:file});return sandbox.window;}

test('generated templates and contracts match editable originals; template slots escape untrusted text',()=>{
  cp.execFileSync('node',['tools/build_templates.cjs','--check'],{cwd:root});cp.execFileSync('node',['tools/build_contracts.cjs','--check'],{cwd:root});
  const w=runtime(),value='\"><img src=x onerror=alert(1)>';
  const html=w.RMSComponents.btn(value,'save',value);
  assert(!html.includes('<img'));assert(html.includes('&lt;img'));assert.throws(()=>w.RMSTemplates.render('shared/button',{}),/템플릿 값/);
  assert.throws(()=>w.RMSTemplates.render('unknown',{}),/템플릿이 없습니다/);
});

test('hand-written modules contain no UI markup, inline appearance, endpoints in app, or DOM access in data modules',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(web,'asset-manifest.json'),'utf8'));
  for(const file of manifest.scripts.filter(f=>!f.includes('/generated/'))){const text=fs.readFileSync(path.join(web,file),'utf8');assert.doesNotMatch(text,/<(?:div|form|section|table|dialog|button|input|svg)\b/i,file);assert.doesNotMatch(text,/\.style\.(?:left|top|width|height|margin|color|background)\s*=/,file);if(file.includes('/data/'))assert.doesNotMatch(text,/document\.(?:querySelector|createElement|getElementById)|\.innerHTML\s*=/,file);}
  const app=fs.readFileSync(path.join(js,'app.js'),'utf8');assert.doesNotMatch(app,/\bfetch\s*\(|localStorage|createStore\(/);
  const catalog=JSON.parse(fs.readFileSync(path.join(web,'templates/catalog.json'),'utf8'));assert.equal(catalog.length,176);for(const entry of catalog){assert.ok(entry.presenters.length,entry.template+' has no presenter');assert.doesNotMatch(fs.readFileSync(path.join(web,entry.source),'utf8'),/\sstyle\s*=|<style\b|\son\w+\s*=/);}
});

test('HTTP adapter uses server snapshot, returns saved ID and preserves data on network and invalid-response failure',async()=>{
  const w=runtime(),calls=[];let mode='success';
  const adapter=w.RMSHttpAdapter.create({request:async(command,payload)=>{calls.push([command,copy(payload)]);if(command==='bootstrap')return copy(example);if(mode==='network')throw Error('request failed');if(mode==='invalid')return {contractVersion:99};const next=copy(example);next.state.doctors[0].organization='서버 저장 기관';next.result='D001';return next;}});
  const store=await adapter.open();assert.equal(store.mode,'server');assert.equal(store.getSession().role,'company');assert.throws(()=>store.setRole('admin'),/서버 인증/);
  assert.equal(await store.saveDoctor({id:'D001',organization:'서버 저장 기관'}),'D001');assert.equal(store.getState().doctors[0].organization,'서버 저장 기관');assert.deepEqual(calls[1],['saveDoctor',{input:{id:'D001',organization:'서버 저장 기관'}}]);
  const before=copy(store.getState());mode='network';await assert.rejects(store.saveDoctor({id:'D001'}),/request failed/);assert.deepEqual(copy(store.getState()),before);
  mode='invalid';await assert.rejects(store.saveDoctor({id:'D001'}),/계약 버전/);assert.deepEqual(copy(store.getState()),before);
  assert.equal(store.programStatus(example.state.programs[0].id).state,'open');
});

test('all documented commands map arguments to payloads; pending writes are not sent twice',async()=>{
  const w=runtime();let release,calls=0;
  const store=await w.RMSHttpAdapter.create({request(command,payload){if(command==='bootstrap')return Promise.resolve(copy(example));calls++;return new Promise(resolve=>{release=()=>resolve(copy(example));});}}).open();
  const pending=store.consent('A001',true);await Promise.resolve();await assert.rejects(store.consent('A001',false),/이전 요청/);assert.equal(calls,1);release();await pending;
  for(const command of Object.keys(w.RMSCommands))assert.equal(typeof store[command],'function',command);
});

test('same-origin transport keeps credentials and CSRF, sends real File multipart and handles authorization failure',async()=>{
  const w=runtime(),requests=[];const file=new File(['proof'],'proof.pdf',{type:'application/pdf'});
  const request=w.RMSHttpAdapter.transport({routes:{bootstrap:'/api/read',attachFile:'/api/upload',saveDoctor:'/api/save'},headers:()=>({'X-CSRF-TOKEN':'test-only'}),fetch:async(url,init)=>{requests.push([url,init]);return {ok:true,json:async()=>copy(example)};}});
  await request('bootstrap',{});assert.equal(requests[0][1].method,'GET');assert.equal(requests[0][1].credentials,'same-origin');
  await request('attachFile',{appId:'A001',id:'F07',file});const upload=requests[1][1];assert.equal(upload.body.get('file'),file);assert.equal(upload.body.get('appId'),'A001');assert(!upload.headers['Content-Type']);assert.equal(upload.headers['X-CSRF-TOKEN'],'test-only');
  await request('saveDoctor',{input:{id:'D001'}});assert.equal(requests[2][1].body,JSON.stringify({input:{id:'D001'}}));
  await assert.rejects(w.RMSHttpAdapter.transport({routes:{saveDoctor:'https://other.example/save'},fetch(){throw Error('must not fetch');}})('saveDoctor',{}),/같은 출처/);
  await assert.rejects(w.RMSHttpAdapter.transport({routes:{saveDoctor:'/api/save'},fetch:async()=>({ok:false,status:403})})('saveDoctor',{}),/권한/);
});

test('command runner waits for async success, retains input/dialog on failure and clears busy state',async()=>{
  const w=runtime(),events=[];const hooks={close:()=>events.push('close'),render:()=>events.push('render'),toast:()=>events.push('toast'),error:e=>events.push('error:'+e.message),busy:v=>events.push('busy:'+v)};
  const run=w.RMSCommandRunner.create(hooks);let finish;
  const pending=run(()=>new Promise(resolve=>{finish=resolve;}),'saved',false,id=>events.push('after:'+id));assert.deepEqual(events,['busy:true']);assert.equal(run(()=>{throw Error('must not run');}),false);assert.equal(events[1],'error:이전 요청을 처리하는 중입니다.');finish('D002');await pending;assert.deepEqual(events.slice(2),['close','render','toast','after:D002','busy:false']);
  events.length=0;await run(()=>Promise.reject(Error('server rejected')),'saved',false,()=>events.push('must not navigate'));assert.deepEqual(events,['busy:true','error:server rejected','busy:false']);
  events.length=0;assert.equal(run(()=>123,'saved'),true);assert.deepEqual(events,['close','render','toast']);
});
