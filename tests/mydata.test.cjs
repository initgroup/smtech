'use strict';

// Run with: node --test tests/mydata.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const web = path.resolve(__dirname, '../prototype/region/rms');
const source = require(path.join(web, 'static/js/rms-enhance/mydata-report.js'));
const core = require(path.join(web, 'static/js/rms-enhance/core.js'));
const seed = JSON.parse(fs.readFileSync(path.join(web, 'data/seed.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const evidence = {name:'received-document-supplement.pdf',size:1024};
const expectedCounts = {'personal-application':9,'personal-preference':5,'company-application':8,'company-preference':3};
function bundles() {
  return source.manifest.map(meta => source.parseXml(fs.readFileSync(path.join(web, meta.xmlPath), 'utf8'), meta));
}
function fixture() {
  source.setBundles(bundles());
  const store = core.createStore(clone(seed), null, source);
  store.setRole('company');
  return store;
}
function app(store) {return store.getState().applications.find(row=>row.id==='A001');}
function doc(store,id) {return app(store).docs.find(row=>row.specId===id);}
function unchanged(store,fn,pattern) {
  const before=store.exportJson();assert.throws(fn,pattern);assert.equal(store.exportJson(),before);
}

test('four shipped XML files preserve all original CP949 sample content as readable UTF-8',()=>{
  assert.equal(source.manifest.length,4);
  assert.deepEqual(new Set(source.manifest.map(row=>row.id)),new Set(Object.keys(expectedCounts)));
  for(const meta of source.manifest){
    const original=fs.readFileSync(path.join(web,meta.originalPath));
    const xml=fs.readFileSync(path.join(web,meta.xmlPath),'utf8');
    assert.ok(original.toString('utf8').includes('\uFFFD'),'Original bytes must remain unmodified CP949');
    const decoded=new TextDecoder('euc-kr').decode(original);
    assert.ok(!decoded.includes('\uFFFD'));
    assert.ok(!xml.includes('\uFFFD'));
    assert.equal(xml.replace(/\r\n/g,'\n').trim(),decoded.replace(/\r\n/g,'\n').trim(),meta.id);
  }
});

test('parser separates documents from the result note and retains every populated and empty field',()=>{
  for(const bundle of bundles()){
    assert.equal(bundle.documents.length,expectedCounts[bundle.id],bundle.id);
    assert.equal(bundle.processingResult,'정상');
    assert.equal(bundle.header.agreementYn,'Y');
    assert.match(bundle.header.serviceId,/^MDS\d+$/);
    assert.match(bundle.header.transactionUniqueId,/^\d{25}$/);
    assert.ok(!bundle.documents.some(row=>/원장처리결과|비고/.test(row.name)));
    assert.equal(bundle.fieldCount,bundle.documents.reduce((total,row)=>total+row.fieldCount,0));
    for(const document of bundle.documents){
      assert.equal(document.fieldCount,document.fields.length);
      assert.equal(document.fieldCount,document.fieldsDetailed.length);
      assert.equal(document.populatedCount+document.emptyCount,document.fieldCount);
      assert.ok(document.fieldsDetailed.every(row=>typeof row.tag==='string'&&typeof row.value==='string'&&typeof row.group==='string'&&typeof row.path==='string'));
    }
  }
});

test('mapping distinguishes absent documents, entirely empty payloads, and actual populated records',()=>{
  source.setBundles(bundles());
  for(const bundle of source.manifest){
    const absent=source.mapDocument('F07',bundle.id);
    assert.equal(absent.available,false,bundle.id+' has no VAT certificate');
    assert.equal(absent.fieldCount,0);
  }
  const personalInsurance=source.mapDocument('F09','personal-application');
  assert.equal(personalInsurance.available,true);
  assert.equal(personalInsurance.fieldCount,22);
  assert.equal(personalInsurance.populatedCount,0);
  const companyFinancial=source.mapDocument('F04','company-application');
  assert.equal(companyFinancial.available,true);
  assert.equal(companyFinancial.fieldCount,72);
  assert.equal(companyFinancial.populatedCount,0);
  const personalFinancial=source.mapDocument('F04','personal-application');
  assert.equal(personalFinancial.populatedCount,40);
  assert.ok(source.mapDocument('F06','company-application').populatedCount>0);
  assert.ok(source.mapDocument('F09','company-application').fields.some(([tag,value])=>tag==='체납여부'&&value==='Y'));
});

test('application profiles use the business-registration document instead of mixing other sample companies',()=>{
  source.setBundles(bundles());
  assert.deepEqual(source.companyInfo('personal-application'),{
    companyName:'신용상사',representative:'홍철수',address:'서울특별시 마포구 111-11',businessNumber:'200-00-00000'
  });
  assert.deepEqual(source.companyInfo('company-application'),{
    companyName:'브런치카페광주가산점',representative:'홍길동',address:'경기도 광주주시 가산로23번길 77, 1층 B105호(가산동, 에일린의뜰)',businessNumber:'123-81-12345'
  });
  const women=source.getBundle('personal-preference').documents.find(row=>row.name==='여성기업확인서');
  assert.ok(women.fieldsDetailed.some(row=>row.group.includes('지점')&&row.tag==='지점주소'));
  assert.ok(women.fieldsDetailed.some(row=>row.group.includes('재발급')&&row.tag==='변경후정보'&&row.value==='주식회사 닥터마더스티'));
});

test('reports escape XML field content and preserve raw sample status instead of inventing eligibility',()=>{
  source.setBundles(bundles());
  const companyReport=source.renderReport('company-application','사대사회보험료완납증명서-기업용');
  assert.match(companyReport,/체납여부/);
  assert.match(source.renderReport('company-application'),/브런치카페광주가산점/);
  const preferences=source.renderReport('personal-preference','메인비즈확인서');
  assert.match(preferences,/20221231/);
  const metadata=source.manifest.find(row=>row.id==='company-application');
  const xml=fs.readFileSync(path.join(web,metadata.xmlPath),'utf8').replace('브런치카페광주가산점','&lt;img src=x onerror=alert(1)&gt;&amp;');
  source.setBundles([source.parseXml(xml,metadata)]);
  const escaped=source.renderReport(metadata.id);
  assert.ok(!escaped.includes('<img src=x'));
  assert.match(escaped,/&lt;img src=x onerror=alert\(1\)&gt;&amp;/);
  source.setBundles(bundles());
});

test('XML loader reads all four local assets through the provided fetch function',async()=>{
  const requests=[];
  const loaded=await source.load({fetch:async url=>{
    requests.push(String(url));
    const local=String(url).replace(/^\.\//,'');
    return {ok:true,text:async()=>fs.readFileSync(path.join(web,local),'utf8')};
  }});
  assert.equal(loaded.length,4);
  assert.equal(new Set(requests).size,4);
  for(const meta of source.manifest)assert.ok(requests.some(url=>url.endsWith(meta.xmlPath)));
  assert.equal(source.getBundle('company-application').documents.length,8);
});

test('consented document queries capture actual XML evidence and use its address for explicit mismatch resolution',()=>{
  const store=fixture();
  unchanged(store,()=>store.queryDocument('A001','F01',false),/동의/);
  store.consent('A001',true);
  store.queryDocument('A001','F01',false);
  const received=source.mapDocument('F01','company-application');
  assert.deepEqual(doc(store,'F01').receipt.fields,received.fields);
  assert.equal(doc(store,'F01').receipt.bundleId,'company-application');
  assert.equal(doc(store,'F01').receipt.documentCode,received.documentCode);
  assert.equal(doc(store,'F01').issue,'mismatch');
  assert.equal(app(store).address,source.companyInfo('company-application').address);
  store.resolveMismatch('A001',true);
  assert.equal(app(store).inputAddress,source.companyInfo('company-application').address);
  assert.equal(doc(store,'F01').status,'조회완료');
  store.queryDocument('A001','F04',false);
  assert.equal(doc(store,'F04').status,'보완필요');
  assert.equal(doc(store,'F04').issue,'empty');
  store.queryDocument('A001','F07',true);
  assert.equal(doc(store,'F07').status,'조회실패');
  assert.equal(doc(store,'F07').issue,'unavailable');
  store.queryDocument('A001','F06',false);
  assert.equal(doc(store,'F06').status,'조회완료','Received local-tax fields must replace the former synthetic timeout');
  const restored=core.createStore(clone(seed),null,source);
  restored.importJson(store.exportJson());
  assert.deepEqual(doc(restored,'F01').receipt,doc(store,'F01').receipt);
});

test('changing source bundle revokes consent, resets queried evidence and preserves uploaded files',()=>{
  const store=fixture();
  store.consent('A001',true);
  store.queryDocument('A001','F04',false);
  store.queryDocument('A001','F06',false);
  store.attachFile('A001','F04',evidence);
  store.selectMydataBundle('A001','personal-application');
  assert.equal(app(store).consent,false);
  assert.equal(app(store).consentAt,null);
  assert.equal(doc(store,'F04').receipt,undefined);
  assert.deepEqual(doc(store,'F04').file,evidence);
  assert.equal(doc(store,'F04').status,'제출완료');
  assert.equal(doc(store,'F06').receipt,undefined);
  assert.equal(doc(store,'F06').queriedAt,null);
  assert.equal(doc(store,'F06').status,'미제출');
  unchanged(store,()=>store.queryDocument('A001','F04',false),/동의/);
  store.consent('A001',true);
  store.queryDocument('A001','F04',false);
  assert.equal(doc(store,'F04').receipt.bundleId,'personal-application');
  assert.equal(doc(store,'F04').status,'조회완료');
});

test('explicit profile application checks consent, ownership and submitted lock without partial changes',()=>{
  const store=fixture();
  unchanged(store,()=>store.applyReceiptInfo('A001'),/동의/);
  store.consent('A001',true);
  store.applyReceiptInfo('A001');
  const profile=source.companyInfo('company-application');
  assert.equal(app(store).companyName,profile.companyName);
  assert.equal(app(store).representative,profile.representative);
  assert.equal(app(store).inputAddress,profile.address);
  assert.equal(app(store).businessNumber,profile.businessNumber);
  assert.equal(doc(store,'F01').status,'조회완료');
  assert.ok(app(store).mydataAppliedAt);
  unchanged(store,()=>store.applyReceiptInfo('A003'),/본인/);
  store.setRole('tp');
  unchanged(store,()=>store.applyReceiptInfo('A001'),/지원기업/);
  store.setRole('company');
  seed.programs.find(row=>row.id===app(store).programId).requiredDocs.forEach(id=>store.attachFile('A001',id,evidence));
  store.submitApplication('A001',false);
  unchanged(store,()=>store.applyReceiptInfo('A001'),/제출완료/);
  unchanged(store,()=>store.selectMydataBundle('A001','personal-application'),/제출완료/);
});


test('loading or importing earlier synthetic query evidence requires fresh XML consent while retaining uploaded files',()=>{
  source.setBundles(bundles());
  const legacy=core.createStore(clone(seed),null);
  legacy.setRole('company');legacy.consent('A001',true);legacy.queryRequired('A001');
  legacy.resolveMismatch('A001',true);legacy.queryDocument('A001','F06',true);
  legacy.attachFile('A001','F04',evidence);legacy.submitApplication('A001',false);
  const saved=legacy.exportJson();
  const storage={getItem:key=>key===core.storageKey?saved:null,setItem(){}};
  const reloaded=core.createStore(clone(seed),storage,source);
  assert.match(reloaded.loadWarning,/이전 가상 조회/);
  for(const store of [reloaded,fixture()]){
    if(store!==reloaded)store.importJson(saved);
    store.setRole('company');
    assert.equal(app(store).submission,'작성중');assert.equal(app(store).consent,false);assert.equal(app(store).consentAt,null);
    assert.equal(doc(store,'F01').status,'미제출');assert.equal(doc(store,'F01').queriedAt,null);
    assert.equal(doc(store,'F04').status,'제출완료');assert.deepEqual(doc(store,'F04').file,evidence);
    unchanged(store,()=>store.submitApplication('A001',false),/필수서류/);
  }
});

test('retrying a certificate absent from every XML never invents a successful receipt',()=>{
  const store=fixture();store.consent('A001',true);
  store.queryDocument('A001','F07',false);store.queryDocument('A001','F07',true);
  assert.equal(doc(store,'F07').status,'조회실패');assert.equal(doc(store,'F07').issue,'unavailable');
  assert.deepEqual(doc(store,'F07').receipt.fields,[]);
  assert.ok(doc(store,'F07').history.some(row=>row.action==='재조회'));
  for(const bundleId of ['personal-application','personal-preference','company-preference']){
    store.selectMydataBundle('A001',bundleId);store.consent('A001',true);store.queryDocument('A001','F07',true);
    assert.equal(doc(store,'F07').status,'조회실패',bundleId);assert.equal(doc(store,'F07').receipt.bundleId,bundleId);
  }
});
