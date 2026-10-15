'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const privacy=require('../prototype/region/rms/static/js/rms-enhance/common/privacy.js');
test('masks identifying parts of names/phones and fully hides other sensitive values',()=>{
    ['qa@example.test','010-1234-5678','02-123-4567','+82 10 1234 5678','900101-1234567','4111 1111 1111 1111','계좌: 123-456-789012','여권번호: M12345678','M123A4567','면허번호: 11-22-123456-78'].forEach(input=>{
        const out=privacy.inspect(input);assert.equal(out.detected,true,input);assert.match(out.text,/개인정보|\*|○/);assert.ok(!out.text.includes(input),input);assert.ok(!JSON.stringify(out.findings).includes('123456'),input);
    });
});
test('normalizes fullwidth, zero-width, bidi, entities and separated representations',()=>{
    ['０１０－１２３４－５６７８','010\u200b-1234\u202e-5678','０１０&#45;１２３４&#45;５６７８','qa [at] example [dot] test','qa @ example . test','010 1 2 3 4 5 6 7 8','010&ZeroWidthSpace;-1234-5678'].forEach(input=>assert.equal(privacy.inspect(input).detected,true,input));
});
test('suppresses labelled name and address fields; keeps ordinary business text',()=>{
    const result=privacy.inspect('성명: 김예시\n기업담당자: 박예시\n주소: 서울시 가상구 예시로 123 456동\n사업 공고는 2026-10-15입니다.');
    assert.ok(!result.text.includes('김예시'));assert.ok(!result.text.includes('박예시'));assert.ok(!result.text.includes('서울시'));assert.match(result.text,/2026-10-15/);
    assert.equal(privacy.mask('사업 신청 요건 및 제출 서류 문의'),'사업 신청 요건 및 제출 서류 문의');
});
test('output idempotence, no raw findings and fail-closed input length limit',()=>{
    const once=privacy.mask('문의 qa@example.test 또는 010-1234-5678');assert.equal(privacy.mask(once),once);
    assert.deepEqual(Object.keys(privacy.inspect('qa@example.test').findings[0]).sort(),['end','label','start','type']);
    assert.throws(()=>privacy.inspect('a'.repeat(100001)),RangeError);
});
test('documents semantic and attachment detection limits explicitly',()=>{
    assert.equal(privacy.inspect('김예시는 오늘 상담을 신청했습니다.').detected,false);
    assert.equal(privacy.inspect('생년월일과 질병 정보가 적힌 첨부이미지').detected,false);
});

test('server example requires trusted actor and keeps detected content out of public DTO',()=>{
    const policy=require('../reference/privacy/examples/server-policy.example.cjs');
    const actor={subject:'synthetic-guest-session',verified:true};
    assert.throws(()=>policy.prepareSubmission({title:'문의',body:'본문'},{}),/AUTH_REQUIRED/);
    const post=policy.prepareSubmission({title:'문의 010-1234-5678',body:'연락 qa@example.test',public:true},actor);
    assert.equal(post.mainVisible,false);assert.equal(post.reviewStatus,'pending');assert.ok(!JSON.stringify(post).includes('010-1234-5678'));
    assert.equal(policy.publicDTO({...post,mainVisible:true,reviewStatus:'approved'}),null);
    assert.throws(()=>policy.approvePublic(post,{...actor,role:'admin'}),/PRIVACY_REVIEW_REQUIRED/);
});
test('server public projection omits identity fields and invalidates review after edits',()=>{
    const policy=require('../reference/privacy/examples/server-policy.example.cjs');
    const actor={subject:'synthetic-member-session',verified:true};
    const post=policy.prepareSubmission({title:'신청 요건',body:'서류 안내 부탁드립니다.',public:true},actor);
    const approved=policy.approvePublic({...post,id:'synthetic-Q1',mainVisible:true,ownerEmail:'owner@example.test'}, {...actor,role:'admin'});
    const dto=policy.publicDTO(approved);assert.ok(dto);assert.ok(!Object.hasOwn(dto,'ownerSubject'));assert.ok(!Object.hasOwn(dto,'ownerEmail'));
    assert.equal(policy.publicDTO({...approved,body:'수정된 본문'}),null);
    assert.equal(policy.publicDTO({...approved,replies:[{body:'이름: 김예시'}]}),null);
});

test('handles line-split numbers, health-insurance-shaped values and long address fields',()=>{
    assert.equal(privacy.inspect('010\n1234\n5678').detected,true);
    assert.equal(privacy.inspect('건강보험번호 12345678901').detected,true);
    assert.ok(!privacy.mask('주소: '+ '가상동 '.repeat(80)+'끝주소').includes('끝주소'));
    const start=performance.now();privacy.inspect('a'.repeat(100000));assert.ok(performance.now()-start<2000,'bounded input must avoid catastrophic regex backtracking');
});


test('readable name and telephone masking preserves no identifying suffix and is idempotent',()=>{
    assert.equal(privacy.mask('이름: 김예시'), '이름: 김○○');
    assert.equal(privacy.mask('연락처 010-1234-5678'), '연락처 010-****-****');
    assert.equal(privacy.mask('메일 qa@example.test'), '메일 ***@***.***');
    for(const input of ['이름: 김○○','연락처 010-****-****','메일 ***@***.***']) assert.equal(privacy.mask(input),input);
});


test('labelled sensitive and contextual fields are hidden in full and remain idempotent',()=>{
    const cases=[
        ['외국인등록번호: 920303-5123456','foreigner'],['건강보험번호: 12345678901','insurance'],
        ['생년월일: 1994-05-17','birth'],['학번: DEMO-STUDENT-0042','education'],
        ['진료기록: 합성 진료와 복약 내역','health'],['가족관계: 합성 배우자와 자녀','family'],
        ['근무이력: 합성 근무처와 경력','employment'],['월소득: 합성 월급 3,450,000원','income'],
        ['비밀번호: DEMO-NOT-A-REAL-PASSWORD','credential'],['접속 IP: 192.0.2.42','ip'],
        ['GPS: 37.123456, 127.654321','location'],['배송지: 가상시 예시로 77 3동 502호','address']
    ];
    for(const [input,type] of cases){
        const out=privacy.inspect(input);assert.deepEqual(out.types,[type],input);
        assert.match(out.text,/\[개인정보: .+ 숨김\]/);assert.equal(privacy.inspect(out.text).detected,false,input);
        assert.equal(privacy.mask(out.text),out.text);assert.ok(!out.text.includes(input.split(': ')[1]));
    }
    const prose='개발팀은 건강보험번호 입력 범위와 교육 참여요건을 문의합니다. 가족 증빙은 별도로 안내합니다.';
    assert.equal(privacy.mask(prose),prose,'category words alone do not erase an ordinary business explanation');
    assert.equal(privacy.inspect('저는 합성병원에서 상담했습니다.').detected,false,'free-text semantic limits stay explicit');
});
