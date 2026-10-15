'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parseHTML}=require('../tmp/qa/node_modules/linkedom');
const root=path.resolve(__dirname,'..'),web=path.join(root,'prototype/region/rms');
const registry=JSON.parse(fs.readFileSync(path.join(root,'docs/sfr-implementation.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'reference/documents/requirements-catalog.json'),'utf8'));
function runtime(html='<div class="rms-enhance" id="rms-enhance-app"></div>',route='#home'){
  const native=parseHTML('<html><body>'+html+'</body></html>'),values={location:{hash:route},setTimeout:fn=>fn(),MutationObserver:undefined};
  const window=new Proxy(native,{get:(obj,key)=>key in values?values[key]:obj[key],set:(obj,key,value)=>(values[key]=value,true)});
  const sandbox={window,document:window.document,location:values.location};vm.createContext(sandbox);
  const run=file=>vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),sandbox,{filename:file});
  run('demo/generated/requirements.js');
  window.RMSTemplateSources={};
  function read(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){if(f.isDirectory())read(path.join(dir,f.name),prefix+f.name+'/');else if(f.name.endsWith('.html'))window.RMSTemplateSources[prefix+f.name.slice(0,-5)]=fs.readFileSync(path.join(dir,f.name),'utf8').replace(/^<!--[^]*?-->\r?\n/,'');}}
  read(path.join(web,'demo/templates'));run('static/js/rms-enhance/common/templates.js');window.RMSComponents={btn:()=>''};run('demo/js/requirements-views.js');
  return {window,document:window.document,run};
}
test('all 93 immutable SFR detail lines have ordered unique IDs and independent implementation evidence',()=>{
  const all=new Set();let count=0;
  for(const source of catalog.requirements.filter(r=>/^SFR-\d\d$/.test(r.sourceId))){
    const r=registry.requirements.find(x=>x.id===source.sourceId);assert.equal(r.criteria.length,source.details.length);
    r.criteria.forEach((criterion,index)=>{
      assert.equal(criterion.id,source.sourceId+'-'+String(index+1).padStart(2,'0'));assert(!all.has(criterion.id));all.add(criterion.id);count++;
      assert(registry.statuses[criterion.status]);assert(criterion.evidence.length>10);assert(criterion.remaining.length>10);
      assert(criterion.menus.every(id=>r.menus.includes(id)&&registry.menus[id]));assert(criterion.features.every(id=>registry.features[id]));
    });
  }
  assert.equal(count,93);assert.equal(all.size,93);
  assert.equal(registry.requirements.find(r=>r.id==='SFR-09').criteria.length,7);
  assert.equal(registry.requirements.find(r=>r.id==='SFR-12').criteria[7].status,'pending');
  assert.equal(registry.requirements.find(r=>r.id==='SFR-13').criteria[3].status,'pending');
});
test('detail rendering preserves the source wording and shows per-item status, evidence and destination',()=>{
  const {window,document}=runtime();
  for(const source of catalog.requirements.filter(r=>/^SFR-\d\d$/.test(r.sourceId))){
    const r=window.RMSDemoViews.requirement(source.sourceId),container=document.createElement('ul');container.innerHTML=window.RMSDemoViews.requirementDetails(r);
    const rows=container.querySelectorAll('[data-criterion-id]');assert.equal(rows.length,source.details.length);
    rows.forEach((row,index)=>{const c=r.criteria[index];assert.equal(row.dataset.criterionId,c.id);assert.equal(row.querySelector('.rms-sfr-original-text').textContent,source.details[index]);assert(row.textContent.includes(c.statusLabel));assert(row.textContent.includes(c.evidence));assert(row.textContent.includes(c.remaining));assert.equal(row.querySelectorAll('a[data-action="sfr-navigate"]').length,c.menus.length);});
  }
});
test('privacy criteria and official downloadable documents are highlighted separately from web standards',()=>{
  const {window,document}=runtime(),r=window.RMSDemoViews.requirement('SFR-09'),container=document.createElement('div');
  container.innerHTML=window.RMSDemoViews.requirementDetails(r)+window.RMSDemoViews.requirementCoverage(r);
  assert.deepEqual(Array.from(container.querySelectorAll('.rms-sfr-privacy'),e=>e.dataset.criterionId),['SFR-09-05','SFR-09-07']);
  const resources=container.querySelector('.rms-sfr-privacy-resources');assert(resources);assert.equal(resources.querySelectorAll('a[download][href$=".pdf"]').length,3);assert(resources.textContent.includes('개인정보 탐지 패턴을 정하는 문서가 아닙니다'));
  assert(resources.querySelector('a[href="static/js/rms-enhance/common/privacy.js"]'));assert(resources.querySelector('a[href="downloads/privacy/privacy-implementation.html"]'));
});
test('all entrypoints exclude automatic SFR annotation and reference tools stay separate from business fragments',()=>{
  for(const file of ['asset-manifest.json','demo/asset-manifest.json']){
    const manifest=JSON.parse(fs.readFileSync(path.join(web,file),'utf8'));
    assert(!manifest.scripts.some(file=>file.includes('feature-trace')));
  }
  assert(!fs.existsSync(path.join(web,'demo/js/feature-trace.js')));
  for(const file of fs.readdirSync(path.join(root,'handoff/fragments')).filter(file=>file.endsWith('.html'))){
    const {document}=parseHTML(fs.readFileSync(path.join(root,'handoff/fragments',file),'utf8'));
    assert.doesNotMatch(document.querySelector('.rms-enhance').textContent,/SFR-\d{2}|기능 관리번호/,file);
    assert.equal(document.querySelector('.rms-feature-trace,[data-requirement-ids]'),null,file);
  }
});

test('download links resolve to real PDF files and implementation sources without corrupted labels',()=>{
  const r=registry.requirements.find(item=>item.id==='SFR-09');
  for(const resource of r.resources){
    const content=fs.readFileSync(path.join(web,resource.href));assert(content.length>100);
    if(resource.href.endsWith('.pdf')){assert.equal(content.subarray(0,4).toString(),'%PDF');assert(content.length>100000);}
  }
  assert.doesNotMatch(JSON.stringify(registry),/\?{2,}/);
  const {window}=runtime();const markup=window.RMSDemoViews.requirementDetails(window.RMSDemoViews.requirement('SFR-09'));
  assert(markup.includes('개인정보 보호'));assert.doesNotMatch(markup,/\?{2,}/);
});
