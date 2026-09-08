/* Read-only review probes: production prototype sources are never modified. */
const fs = require('node:fs');
const path = require('node:path');
const core = require('../prototype/region/rms/static/js/rms-enhance/core.js');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../prototype/region/rms/data/seed.json'), 'utf8'));
const copy = value => JSON.parse(JSON.stringify(value));
function store() {
  let raw = null;
  return core.createStore(seed, {getItem:()=>raw, setItem:(key,value)=>{raw=value;}});
}
const results = [];
function probe(name, fn) {
  try { results.push({name, result: fn()}); }
  catch (error) { results.push({name, error: error.message}); }
}
function rejected(fn) { try {fn(); return false;} catch {return true;} }
function app(s) {return s.getState().applications.find(a=>a.id==='A001');}
function doc(s,id) {return app(s).docs.find(d=>d.specId===id);}
function required() {return seed.programs.find(p=>p.id===seed.applications[0].programId).requiredDocs;}
const file={name:'evidence.pdf',size:128};

probe('control_seed_valid',()=>!!core.validate(copy(seed)));
probe('control_no_consent_query_rejected',()=>{const s=store();s.setRole('company');return rejected(()=>s.queryDocument('A001','F01',false));});
probe('control_other_company_application_rejected',()=>{const s=store();s.setRole('company');return rejected(()=>s.attachFile('A003','F01',file));});
probe('control_other_region_doctor_edit_rejected',()=>{const s=store();s.setRole('tp');const d=s.getState().doctors.find(d=>d.owner!=='충남');return rejected(()=>s.saveDoctor(d));});
probe('control_mismatch_not_auto_overwritten',()=>{const s=store();s.setRole('company');s.consent('A001',true);const before=app(s).inputAddress;s.queryDocument('A001','F01',false);return {inputPreserved:before===app(s).inputAddress,status:doc(s,'F01').status};});
probe('control_private_question_hidden',()=>{const s=store();return !s.visibleQuestions().some(q=>!q.public);});

probe('submitted_application_later_query_failure',()=>{
  const s=store();s.setRole('company');required().forEach(id=>s.attachFile('A001',id,file));s.submitApplication('A001',false);s.consent('A001',true);s.queryDocument('A001','F06',false);
  return {submission:app(s).submission,requiredStatus:doc(s,'F06').status,previousFileLost:doc(s,'F06').file===null};
});
probe('submitted_application_consent_withdrawal',()=>{
  const s=store();s.setRole('company');s.consent('A001',true);
  required().forEach(id=>{if(id==='F09')s.attachFile('A001',id,file);else s.queryDocument('A001',id,true);if(id==='F01')s.resolveMismatch('A001',true);});
  s.submitApplication('A001',false);s.consent('A001',false);
  return {submission:app(s).submission,consent:app(s).consent,submissionNowRejected:rejected(()=>s.submitApplication('A001',false))};
});
probe('json_submitted_docs_without_evidence',()=>{
  const bad=copy(seed);const a=bad.applications[0];required().forEach(id=>{const d=a.docs.find(d=>d.specId===id);d.status='제출완료';d.file=null;d.queriedAt=null;d.history=[];});
  const s=store();s.importJson(JSON.stringify(bad));s.setRole('company');s.submitApplication('A001',false);
  return {importAccepted:true,submission:app(s).submission,consent:app(s).consent,files:app(s).docs.filter(d=>d.file).length};
});
probe('json_wrong_classification_kind',()=>{const bad=copy(seed);bad.doctors[0].institution=bad.classifications.find(c=>c.kind==='technology').id;return {accepted:!!core.validate(bad)};});
probe('json_nonexistent_doctor_user',()=>{const bad=copy(seed);bad.doctors[0].userId='NO_SUCH_USER';return {accepted:!!core.validate(bad)};});
probe('json_nonexistent_support_region',()=>{const bad=copy(seed);bad.doctors[0].supportRegions=['NO_SUCH_REGION'];return {accepted:!!core.validate(bad)};});
probe('hidden_work_classification_questions',()=>{const s=store();s.setRole('admin');const q=s.visibleQuestions()[0];const code=s.getState().classifications.find(c=>c.id===q.work);s.saveCode({...code,active:false,visible:false});return {questionStillVisible:s.visibleQuestions().some(x=>x.id===q.id),faqCount:s.searchFaqs('',q.work).items.length};});
probe('supplement_resolved_with_prior_address_query',()=>{const s=store();s.setRole('company');s.consent('A001',true);s.queryDocument('A001','F01',false);s.resolveMismatch('A001',true);s.setRole('tp');s.requestSupplement('A001','F01','Additional evidence required');s.setRole('company');s.resolveMismatch('A001',true);return {status:doc(s,'F01').status,lastAction:doc(s,'F01').history[0].action,file:doc(s,'F01').file};});

fs.writeFileSync(path.join(__dirname,'review-core-findings.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
