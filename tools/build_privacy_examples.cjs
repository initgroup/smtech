/* Generate safe demo examples through the same privacy boundary used by the board. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),web=require('./project.cjs').web;
const privacy=require(path.join(web,'static/js/rms-enhance/common/privacy.js'));
const security=require(path.join(web,'static/js/rms-enhance/common/board-security.js'));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'reference/privacy/examples/board-scenarios.json'),'utf8'));
function protect(post){
 const safe=security.prepare(post),answer=security.prepare({body:post.answer});
 return {...post,title:safe.title,body:safe.body,bodyHtml:safe.bodyHtml,answer:answer.body,
  replies:post.replies.map(r=>({...r,body:security.prepare(r).body,bodyHtml:security.prepare(r).bodyHtml})),privacyDetected:false};
}
const items=fixture.cases.map(c=>{
 const detected=new Set([c.post.title,c.post.body,c.post.answer,...c.post.replies.map(r=>r.body)].flatMap(v=>privacy.inspect(v).types));
 for(const type of c.types)if(!detected.has(type))throw Error(c.post.id+' missing detection '+type);
 const post=protect(c.post);
 if(security.publicQuestion(post).privacyDetected)throw Error(post.id+' redacted example is not idempotent');
 return post;
});
fs.writeFileSync(path.join(root,'reference/privacy/examples/board-scenarios.masked.json'),JSON.stringify({version:fixture.scenarioVersion,items},null,2)+'\n');
const data={version:fixture.scenarioVersion,items,legacy:fixture.legacy};
fs.writeFileSync(path.join(web,'demo/data/privacy-scenarios.json'),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(web,'demo/generated/privacy-scenarios.js'),'/* GENERATED: synthetic examples, redacted before browser delivery. */\n(function(root,data){if(typeof module===\'object\'&&module.exports)module.exports=data;else root.RMSPrivacyScenarios=data;}(typeof window!==\'undefined\'?window:this,'+JSON.stringify(data,null,2)+'));\n');
console.log('Privacy scenarios: '+items.length+' curated synthetic posts generated; no raw scenario values in browser data.');