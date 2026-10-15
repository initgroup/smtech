'use strict';
/* Server integration example only. Not connected to the static prototype.
 * The HTTP layer MUST establish actor from its authenticated session/verified guest
 * capability, enforce CSRF/rate limits, validate ownership, and use a transaction.
 * Accepts plain text only; parse rich text with a maintained server HTML parser first.
 */
const crypto=require('node:crypto');
const path=require('node:path');
const fs=require('node:fs');
const root=path.resolve(__dirname,'../../..');
const moduleCandidates=['prototype/region/rms/static/js/rms-enhance/common/privacy.js','web/static/js/rms-enhance/common/privacy.js'];
const modulePath=moduleCandidates.map(p=>path.join(root,p)).find(p=>fs.existsSync(p));
if(!modulePath)throw new Error('PRIVACY_MODULE_NOT_FOUND');
const privacy=require(modulePath);
function fingerprint(record){
    return crypto.createHash('sha256').update(JSON.stringify([record.title,record.body,(record.replies||[]).map(r=>[r.body,r.official])])).digest('hex');
}
function requireActor(actor){
    if(!actor||actor.verified!==true||!actor.subject)throw new Error('AUTH_REQUIRED');
}
function prepareSubmission(input,actor){
    requireActor(actor);
    if(!input||typeof input.title!=='string'||typeof input.body!=='string')throw new Error('TEXT_REQUIRED');
    if(input.bodyHtml!==undefined)throw new Error('SERVER_HTML_EXTRACTION_REQUIRED');
    if(input.title.length<1||input.title.length>200||input.body.length<1||input.body.length>30000)throw new Error('INVALID_LENGTH');
    const title=privacy.inspect(input.title),body=privacy.inspect(input.body);
    return {ownerSubject:actor.subject,title:title.text,body:body.text,public:input.public===true,mainVisible:false,
        reviewStatus:'pending',reviewFingerprint:null,privacyDetected:title.detected||body.detected,
        privacyTypes:Array.from(new Set(title.types.concat(body.types))),replies:[]};
}
function approvePublic(record,actor){
    requireActor(actor);
    if(actor.role!=='admin')throw new Error('FORBIDDEN');
    // Human review is required even when the automated rules find nothing.
    if(record.privacyDetected||privacy.inspect(record.title).detected||privacy.inspect(record.body).detected)throw new Error('PRIVACY_REVIEW_REQUIRED');
    (record.replies||[]).forEach(r=>{if(privacy.inspect(r.body).detected)throw new Error('PRIVACY_REVIEW_REQUIRED');});
    return {...record,reviewStatus:'approved',reviewFingerprint:fingerprint(record)};
}
function publicDTO(record){
    if(!record||record.public!==true||record.mainVisible!==true||record.reviewStatus!=='approved'||record.privacyDetected===true)return null;
    // Any title/body/reply change invalidates prior review, even after a forged client flag.
    if(record.reviewFingerprint!==fingerprint(record))return null;
    const checked=[privacy.inspect(record.title),privacy.inspect(record.body)];
    const replies=(record.replies||[]).map(r=>({id:r.id,body:privacy.mask(r.body),official:r.official===true}));
    if(checked.some(r=>r.detected)||(record.replies||[]).some(r=>privacy.inspect(r.body).detected))return null;
    // Never serialize the database object. No owner, company/contact, IP, credentials.
    return {id:record.id,title:checked[0].text,body:checked[1].text,date:record.date,status:record.status,replies};
}
module.exports={prepareSubmission,approvePublic,publicDTO,fingerprint};
