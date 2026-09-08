const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const web = path.join(base, 'prototype/region/rms');
const original = path.join(base, 'reference/public-site/original/www.smtech.go.kr/region/rms/static');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('downloaded original CSS and copied assets retain identical bytes', () => {
  for (const name of ['ui.css', 'uiCustom.css']) assert.equal(hash(path.join(web, 'static/css', name)), hash(path.join(original, 'css', name)));
  function scan(dir) {for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {const p=path.join(dir,ent.name);if(ent.isDirectory())scan(p);else assert.equal(hash(p),hash(path.join(original,path.relative(path.join(web,'static'),p))));}}
  scan(path.join(web,'static/images'));scan(path.join(web,'static/notosansKR'));
});

test('all new feature CSS selectors are scoped; original selectors are not overwritten globally', () => {
  const css=fs.readFileSync(path.join(web,'static/css/rms-enhance.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  for (const match of css.matchAll(/([^{}]+)\{/g)) {
    const selector=match[1].trim();if(selector.startsWith('@'))continue;
    for (const part of selector.split(',')) assert.match(part.trim(),/^\.rms-enhance(?:[\s.:[]|$)/);
  }
  assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
});

test('entrypoint loads only local required assets and independent custom JavaScript', () => {
  const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {const value=m[1];if(value.startsWith('#'))continue;assert(!/^(?:https?:)?\/\//.test(value));assert(fs.existsSync(path.join(web,value)),value);}
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(scripts.length,3);
  scripts.forEach(s=>{assert(s.startsWith('static/js/rms-enhance/'));new vm.Script(fs.readFileSync(path.join(web,s),'utf8'));});
  assert(!/\son(?:click|change|submit)\s*=/.test(html));
  assert(html.includes("connect-src 'self'"));assert(html.includes("form-action 'none'"));
});

test('handoff contains 13 unique screen fragments and matching generated source copies', () => {
  const target=path.join(base,'handoff'),m=JSON.parse(fs.readFileSync(path.join(target,'manifest.json'),'utf8'));
  assert.equal(m.screens.length,13);
  for(const file of m.files)assert.equal(hash(path.join(target,file.path)),file.sha256,file.path);
  for(const {screen} of m.screens){const html=fs.readFileSync(path.join(target,'fragments',screen+'.html'),'utf8');assert(html.includes('class="rms-enhance"'));const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,screen+' duplicate IDs');for(const match of html.matchAll(/<label[^>]+for="([^"]+)"/g))assert(ids.includes(match[1]),screen+' missing labelled input');}
  for(const name of ['core.js','views.js','app.js'])assert.equal(hash(path.join(target,'static/js/rms-enhance',name)),hash(path.join(web,'static/js/rms-enhance',name)));
});

test('all archived successful resources match the collection manifest', () => {
  const dir=path.join(base,'reference/public-site'),m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const rows=m.resources.filter(r=>r.status===200);assert.equal(rows.length,91);
  rows.forEach(r=>assert.equal(hash(path.join(dir,r.local_path)),r.sha256,r.local_path));
});
