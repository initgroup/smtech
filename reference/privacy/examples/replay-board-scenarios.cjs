/* Run from any folder: node reference/privacy/examples/replay-board-scenarios.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../../..');
const web=fs.existsSync(path.join(base,'web'))?path.join(base,'web'):path.join(base,'prototype/region/rms');
const security=require(path.join(web,'static/js/rms-enhance/common/board-security.js'));
const privacy=require(path.join(web,'static/js/rms-enhance/common/privacy.js'));
const input=JSON.parse(fs.readFileSync(path.join(__dirname,'board-scenarios.json'),'utf8'));
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'board-scenarios.masked.json'),'utf8'));
const types=new Set();
for(const {post} of input.cases){
 const safe=expected.items.find(q=>q.id===post.id);assert.ok(safe,post.id);
 const raw=[post.title,post.body,post.answer,...post.replies.map(r=>r.body)];
 const output=[safe.title,safe.body,safe.answer,...safe.replies.map(r=>r.body)];
 raw.forEach((value,i)=>{
  const result=privacy.inspect(value);result.types.forEach(type=>types.add(type));
  assert.equal(output[i],result.text.trim(),post.id+' field '+i);
  for(const finding of result.findings){
   const original=privacy.normalize(value).slice(finding.start,finding.end);
   assert.ok(!JSON.stringify(safe).includes(original),post.id+' original value leaked');
  }
 });
 assert.equal(security.publicQuestion(safe).privacyDetected,false,post.id);
}
console.log(input.cases.length+' synthetic posts / '+types.size+' privacy types: masking and public projection verified.');
