'use strict';

// Run with: node --test tests/core.test.cjs
// Only synthetic seed data and in-memory storage are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../prototype/region/rms/static/js/rms-enhance/core.js');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../prototype/region/rms/data/seed.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const evidence = {name: 'synthetic-evidence.pdf', size: 1024};

test('company info changes enforce ownership, validation, address evidence and submitted lock',()=>{
  const store=core.createStore(clone(seed),null);store.setRole('company');
  const original=store.getApplications().find(a=>a.id==='A001');
  store.attachFile('A001','F01',evidence);
  store.saveApplicationInfo('A001',{...original,inputAddress:'가상 변경 주소'});
  assert.equal(store.getApplications().find(a=>a.id==='A001').docs.find(d=>d.specId==='F01').status,'보완필요');
  const before=store.exportJson();
  assert.throws(()=>store.saveApplicationInfo('A001',{...original,companyName:' '}));
  assert.equal(store.exportJson(),before);
  const other=seed.applications.find(a=>a.companyId!==original.companyId);
  if(other)assert.throws(()=>store.saveApplicationInfo(other.id,original));
  store.setRole('admin');assert.throws(()=>store.saveApplicationInfo('A001',original));
  store.setRole('company');
  seed.programs.find(p=>p.id===original.programId).requiredDocs.forEach(id=>store.attachFile('A001',id,evidence));
  store.submitApplication('A001',false);
  assert.throws(()=>store.saveApplicationInfo('A001',original));
  store.setRole('tp');store.requestSupplement('A001','F01','주소 확인');
  store.setRole('company');store.saveApplicationInfo('A001',original);
  assert.equal(store.getApplications().find(a=>a.id==='A001').inputAddress,original.inputAddress);
});

function fixture(initial) {
  let raw = initial === undefined ? null : initial;
  let fail = false;
  const storage = {
    getItem(key) { assert.equal(key, core.storageKey); return raw; },
    setItem(key, value) {
      assert.equal(key, core.storageKey);
      if (fail) throw new Error('Simulated storage quota exceeded');
      raw = value;
    }
  };
  return {
    store: core.createStore(seed, storage), storage,
    saved: () => raw,
    failWrites: value => { fail = value; }
  };
}
function application(store, id = 'A001') {
  return store.getState().applications.find(row => row.id === id);
}
function document(store, id, appId = 'A001') {
  return application(store, appId).docs.find(row => row.specId === id);
}
function required(store, appId = 'A001') {
  const state = store.getState();
  return state.programs.find(row => row.id === application(store, appId).programId).requiredDocs;
}
function fillRequiredWithFiles(store, appId = 'A001') {
  store.setRole('company');
  required(store, appId).forEach(id => store.attachFile(appId, id, evidence));
}
function assertRejectedWithoutChange(store, operation, message) {
  const before = store.exportJson();
  assert.throws(operation, message);
  assert.equal(store.exportJson(), before, 'Rejected operation must not modify data or audit');
}

test('seed validates; export/import and reload preserve edited synthetic data', () => {
  assert.equal(core.validate(clone(seed)).schemaVersion, 1);
  const f = fixture();
  f.store.setRole('company');
  f.store.consent('A001', true);
  f.store.attachFile('A001', 'F09', evidence);
  f.store.submitApplication('A001', true);
  const exported = f.store.exportJson();
  const imported = fixture();
  imported.store.importJson(exported);
  assert.deepEqual(imported.store.getState(), JSON.parse(exported));
  const reloaded = core.createStore(seed, imported.storage);
  assert.deepEqual(reloaded.getState(), imported.store.getState());
  assert.equal(reloaded.getSession().role, 'visitor', 'Demo role must not persist as authentication');
  assert.equal(document(reloaded, 'F09').file.name, evidence.name);
});

test('storage failures roll back edits and imports; malformed saved JSON falls back', () => {
  const f = fixture();
  f.store.setRole('company');
  f.store.consent('A001', true);
  const state = f.store.exportJson(), persisted = f.saved();
  f.failWrites(true);
  assert.throws(() => f.store.attachFile('A001', 'F01', evidence), /quota/);
  assert.equal(f.store.exportJson(), state);
  assert.equal(f.saved(), persisted);
  assert.throws(() => f.store.importJson(JSON.stringify(seed)), /quota/);
  assert.equal(f.store.exportJson(), state);
  const broken = fixture('{invalid json');
  assert.ok(broken.store.loadWarning.length > 0);
  assert.deepEqual(broken.store.getState(), seed);
});

test('TP can update its own doctor, records changes, and cannot update another region', () => {
  const {store} = fixture();
  store.setRole('tp');
  const own = store.getState().doctors.find(d => d.owner === store.getSession().region);
  const beforeHistory = own.history.length;
  store.saveDoctor({...own, organization: '가상 수정기관'});
  const changed = store.getState().doctors.find(d => d.id === own.id);
  assert.equal(changed.organization, '가상 수정기관');
  assert.equal(changed.history.length, beforeHistory + 1);
  assert.ok(changed.history[0].changes.some(row => row.field === 'organization'));
  const other = store.getState().doctors.find(d => d.owner !== store.getSession().region);
  assertRejectedWithoutChange(store, () => store.saveDoctor({...other, organization: '권한 없는 수정'}));
  store.setRole('company');
  assertRejectedWithoutChange(store, () => store.saveDoctor(changed));
});

test('doctor registration initializes selected SMTECH user and prevents duplicate registration', () => {
  const {store} = fixture();
  store.setRole('tp');
  const state = store.getState();
  const user = state.users.find(u => !state.doctors.some(d => d.userId === u.id));
  assert.ok(user, 'Seed must contain one unregistered synthetic user');
  const input = {...state.doctors[0], userId: user.id, history: []};
  delete input.id;
  const id = store.saveDoctor(input);
  const created = store.getState().doctors.find(d => d.id === id);
  assert.equal(created.name, user.name);
  assert.equal(created.owner, store.getSession().region);
  assertRejectedWithoutChange(store, () => store.saveDoctor(input));
});

test('doctor search combines region and specialty; stale filter identifies old registrations', () => {
  const {store} = fixture();
  const expected = store.getState().doctors.find(d => d.supportRegions.includes('충남'));
  const results = store.searchDoctors({region: '충남', technology: expected.technologies[0], institution: expected.institution});
  assert.ok(results.some(d => d.id === expected.id));
  assert.ok(results.every(d => d.supportRegions.includes('충남') && d.technologies.includes(expected.technologies[0]) && d.institution === expected.institution));
  const stale = store.searchDoctors({stale: true});
  assert.ok(stale.length > 0);
  assert.ok(stale.every(store.isStale));
});

test('FAQ supports direct and related search; hidden categories suppress FAQ and main questions', () => {
  const {store} = fixture();
  const item = store.getState().faqs.find(f => f.published);
  const direct = store.searchFaqs(item.title, item.work);
  assert.equal(direct.related, false);
  assert.ok(direct.items.some(f => f.id === item.id));
  const related = store.searchFaqs(item.title + ' 찾아보기', item.work);
  assert.equal(related.related, true);
  assert.ok(related.items.some(f => f.id === item.id));
  assert.ok(store.visibleQuestions().every(q => q.public && q.mainVisible));
  const question = store.visibleQuestions()[0];
  const category = store.getState().classifications.find(c => c.id === question.work);
  store.setRole('admin');
  store.updateQuestion(question.id, false);
  assert.equal(store.visibleQuestions().some(q => q.id === question.id), false);
  assert.equal(store.publicQuestions().some(q => q.id === question.id), true, 'Main exposure setting must not remove public posts from the complete list');
  store.saveCode({...category, active: false, visible: false});
  assert.equal(store.searchFaqs('', question.work).items.length, 0);
  assert.equal(store.visibleQuestions().some(q => q.work === question.work), false);
  assert.equal(store.publicQuestions().some(q => q.work === question.work), false);
  const privateQuestion = store.getState().questions.find(q => !q.public);
  assertRejectedWithoutChange(store, () => store.updateQuestion(privateQuestion.id, true));
});

test('classification cycles and deletion of referenced codes are rejected; unused code can be removed', () => {
  const {store} = fixture();
  store.setRole('admin');
  const state = store.getState();
  const child = state.classifications.find(c => c.parentId);
  const parent = state.classifications.find(c => c.id === child.parentId);
  assertRejectedWithoutChange(store, () => store.saveCode({...parent, parentId: child.id}));
  assertRejectedWithoutChange(store, () => store.removeCode(state.doctors[0].institution));
  store.saveCode({id: 'TEST_UNUSED', name: '가상 미사용 분류', kind: 'technology', parentId: '', active: true, visible: true});
  assert.ok(store.getState().classifications.some(c => c.id === 'TEST_UNUSED'));
  store.removeCode('TEST_UNUSED');
  assert.equal(store.getState().classifications.some(c => c.id === 'TEST_UNUSED'), false);
});

test('matching enforces availability, duplicate requests, manager rights and progress order', () => {
  const {store} = fixture();
  const doctor = store.getState().doctors.find(d => d.available && d.supportRegions.includes('충남') && !store.getState().matches.some(m => m.doctorId === d.id && m.companyId === 'CO001' && m.status !== '지원완료'));
  assertRejectedWithoutChange(store, () => store.requestMatch(doctor.id, '가상 기술애로'));
  store.setRole('company');
  store.requestMatch(doctor.id, '가상 기술애로 해결 요청');
  const match = store.getState().matches[0];
  assert.equal(match.status, '요청접수');
  assertRejectedWithoutChange(store, () => store.requestMatch(doctor.id, '중복 요청'));
  assertRejectedWithoutChange(store, () => store.progressMatch(match.id, '지원진행', ''));
  const unavailable = store.getState().doctors.find(d => !d.available);
  assertRejectedWithoutChange(store, () => store.requestMatch(unavailable.id, '지원불가 전문가 요청'));
  store.setRole('tp');
  assertRejectedWithoutChange(store, () => store.progressMatch(match.id, '지원완료', '순서 생략'));
  store.progressMatch(match.id, '지원진행', '');
  assertRejectedWithoutChange(store, () => store.progressMatch(match.id, '지원완료', ''));
  store.progressMatch(match.id, '지원완료', '가상 공정 개선 지원 완료');
  assert.equal(store.getState().matches.find(m => m.id === match.id).result, '가상 공정 개선 지원 완료');
});

test('starting an application reuses own existing one and creates a clean application for another program', () => {
  const {store} = fixture();
  assertRejectedWithoutChange(store, () => store.startApplication('B003'));
  store.setRole('company');
  assert.equal(store.startApplication('B001'), 'A001');
  const id = store.startApplication('B003');
  const created = application(store, id);
  assert.equal(created.programId, 'B003');
  assert.equal(created.consent, false);
  assert.equal(created.submission, '작성중');
  assert.equal(created.docs.length, seed.documentTypes.length);
  assert.ok(created.docs.every(d => d.status === '미제출' && d.file === null && d.history.length === 0));
  assert.equal(store.startApplication('B003'), id);
});

test('companies can only access their own applications and cannot query without consent', () => {
  const {store} = fixture();
  assert.deepEqual(store.getApplications(), []);
  store.setRole('company');
  assert.ok(store.getApplications().every(a => a.companyId === 'CO001'));
  assertRejectedWithoutChange(store, () => store.consent('A003', true));
  assertRejectedWithoutChange(store, () => store.attachFile('A003', 'F01', evidence));
  assertRejectedWithoutChange(store, () => store.queryDocument('A001', 'F01', false));
  assertRejectedWithoutChange(store, () => store.queryRequired('A001'));
});

test('required-document batch query is atomic when a required type is disabled', () => {
  const {store} = fixture();
  const types = required(store);
  store.setRole('admin');
  const blocked = store.getState().documentTypes.find(d => d.id === types[types.length - 1]);
  store.saveDocumentType({...blocked, active: false});
  store.setRole('company');
  store.consent('A001', true);
  assertRejectedWithoutChange(store, () => store.queryRequired('A001'));
  assert.ok(application(store).docs.every(d => d.history.length === 0));
});

test('address mismatch requires explicit choice; keeping input requires a replacement file', () => {
  const {store} = fixture();
  store.setRole('company');
  store.consent('A001', true);
  const inputAddress = application(store).inputAddress;
  store.queryDocument('A001', 'F01', false);
  assert.equal(application(store).inputAddress, inputAddress);
  assert.equal(document(store, 'F01').issue, 'mismatch');
  store.resolveMismatch('A001', false);
  assert.equal(application(store).inputAddress, inputAddress);
  assert.equal(document(store, 'F01').status, '보완필요');
  assertRejectedWithoutChange(store, () => store.resolveMismatch('A001', true));
  store.attachFile('A001', 'F01', evidence);
  assert.equal(document(store, 'F01').status, '제출완료');
});

test('timeout retry, unavailable-provider fallback and file metadata preservation work', () => {
  const {store} = fixture();
  store.setRole('company');
  store.consent('A001', true);
  store.queryDocument('A001', 'F06', false);
  assert.equal(document(store, 'F06').issue, 'timeout');
  store.queryDocument('A001', 'F06', true);
  assert.equal(document(store, 'F06').status, '조회완료');
  assert.ok(document(store, 'F06').history.some(h => h.action === '재조회'));
  store.queryDocument('A001', 'F09', true);
  assert.equal(document(store, 'F09').issue, 'unavailable');
  store.attachFile('A001', 'F09', evidence);
  assert.equal(document(store, 'F09').status, '제출완료');
  store.queryDocument('A001', 'F09', true);
  assert.deepEqual(document(store, 'F09').file, evidence, 'Failed query must preserve existing uploaded metadata');
  store.attachFile('A001', 'F09', evidence);
});

test('only program-required documents are needed; mixed query/file evidence permits submission', () => {
  const {store} = fixture();
  store.setRole('company');
  assertRejectedWithoutChange(store, () => store.submitApplication('A001', false));
  store.consent('A001', true);
  const needed = required(store);
  const addressBefore = application(store).inputAddress;
  store.queryRequired('A001');
  assert.equal(application(store).inputAddress, addressBefore);
  assert.ok(application(store).docs.filter(d => !needed.includes(d.specId)).every(d => d.status === '미제출' && d.history.length === 0));
  needed.forEach(id => {
    if (id === 'F01') store.resolveMismatch('A001', true);
    else if (id === 'F06') store.queryDocument('A001', id, true);
    else if (id === 'F09') store.attachFile('A001', id, evidence);
  });
  assert.equal(application(store).inputAddress, application(store).address);
  store.submitApplication('A001', false);
  assert.equal(application(store).submission, '제출완료');
  assert.ok(application(store).docs.some(d => d.status === '미제출'), 'Optional documents must remain optional');
});

test('submitted application is locked, including draft-save; institution supplement permits resubmission', () => {
  const {store} = fixture();
  fillRequiredWithFiles(store);
  store.submitApplication('A001', false);
  [
    () => store.consent('A001', true),
    () => store.queryDocument('A001', 'F06', false),
    () => store.attachFile('A001', 'F01', evidence),
    () => store.submitApplication('A001', true)
  ].forEach(operation => assertRejectedWithoutChange(store, operation));
  store.setRole('tp');
  store.requestSupplement('A001', 'F01', '가상 증빙 보완요청');
  assert.equal(application(store).submission, '작성중');
  assert.equal(document(store, 'F01').issue, 'supplement');
  store.setRole('company');
  assertRejectedWithoutChange(store, () => store.submitApplication('A001', false));
  assertRejectedWithoutChange(store, () => store.resolveMismatch('A001', true));
  store.attachFile('A001', 'F01', {...evidence, name: 'synthetic-supplement.pdf'});
  store.submitApplication('A001', false);
  assert.equal(application(store).submission, '제출완료');
  assert.ok(document(store, 'F01').history.some(h => h.action === '보완 요청'));
});

test('resolved address query cannot clear a subsequent institution supplement', () => {
  const {store} = fixture();
  store.setRole('company');
  store.consent('A001', true);
  store.queryDocument('A001', 'F01', false);
  store.resolveMismatch('A001', true);
  store.setRole('tp');
  store.requestSupplement('A001', 'F01', '가상 추가 증빙 요청');
  store.setRole('company');
  assertRejectedWithoutChange(store, () => store.resolveMismatch('A001', true));
  assert.equal(document(store, 'F01').issue, 'supplement');
});

test('withdrawing consent prevents query-based submission, while file-only submission remains possible', () => {
  const {store} = fixture();
  store.setRole('company');
  store.consent('A001', true);
  store.queryRequired('A001');
  required(store).forEach(id => {
    if (id === 'F01') store.resolveMismatch('A001', true);
    else if (id === 'F06') store.queryDocument('A001', id, true);
    else if (id === 'F09') store.attachFile('A001', id, evidence);
  });
  store.consent('A001', false);
  assertRejectedWithoutChange(store, () => store.submitApplication('A001', false));
  fillRequiredWithFiles(store);
  store.submitApplication('A001', false);
  assert.equal(application(store).submission, '제출완료');
  assert.equal(application(store).consent, false);
});

test('forged JSON evidence, invalid references and dangerous property names are rejected atomically', () => {
  const mutations = [
    data => { const d = data.applications[0].docs[0]; d.status = '제출완료'; d.file = null; },
    data => { const d = data.applications[0].docs[0]; d.status = '조회완료'; d.queriedAt = null; d.history = []; },
    data => { data.applications[0].submission = '제출완료'; },
    data => { data.doctors[0].institution = data.classifications.find(c => c.kind === 'technology').id; },
    data => { data.doctors[0].userId = 'NONEXISTENT_USER'; },
    data => { data.doctors[0].supportRegions = ['NONEXISTENT_REGION']; },
    data => { data.doctors[1].userId = data.doctors[0].userId; },
    data => { data.schemaVersion = 999; }
  ];
  const f = fixture();
  mutations.forEach(mutate => {
    const bad = clone(seed);
    mutate(bad);
    assertRejectedWithoutChange(f.store, () => f.store.importJson(JSON.stringify(bad)));
    assert.equal(f.saved(), null);
  });
  const unsafe = JSON.stringify(seed).replace('"schemaVersion":1', '"__proto__":{"polluted":true},"schemaVersion":1');
  assertRejectedWithoutChange(f.store, () => f.store.importJson(unsafe));
  assert.equal({}.polluted, undefined);
});
