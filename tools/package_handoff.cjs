/* Generates publisher handoff fragments from the exact templates used in the demo. */
require('./sync_sfr.cjs');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const base = path.resolve(__dirname, '..');
const web = path.join(base, 'prototype/region/rms');
const core = require(path.join(web, 'static/js/rms-enhance/core.js'));
const seed = JSON.parse(fs.readFileSync(path.join(web, 'data/seed.json'), 'utf8'));
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(web, 'static/js/rms-enhance/views.js'), 'utf8'), sandbox);
const store = core.createStore(seed, null);
const ui = { doctorFilters: {}, statsFilters: {}, selected: new Set(), faqQuery: '', faqWork: '', docStatus: '', codeKind: 'technology' };
const views = sandbox.window.RMSViews.create(store, ui);
const target = path.join(base, 'handoff');
fs.mkdirSync(path.join(target, 'fragments'), { recursive: true });
const pages = [
  ['home', 'visitor', () => views.home()], ['doctors', 'company', () => views.doctors()],
  ['doctor-detail', 'tp', () => views.doctorDetail('D001')], ['matches', 'tp', () => views.matches()],
  ['statistics', 'tp', () => views.stats()], ['documents-company', 'company', () => views.documents('A001')],
  ['documents-manager', 'tp', () => views.documents('A001')], ['faq', 'visitor', () => views.faq(false)],
  ['questions', 'visitor', () => views.faq(true)], ['guide', 'visitor', () => views.guide()], ['classifications', 'admin', () => views.manage()],
  ['home-settings', 'admin', () => views.manage('home')], ['document-settings', 'admin', () => views.manage('documents')]
];
for (const [name, role, render] of pages) {
  store.setRole(role);
  const html = '<!-- Publisher fragment generated from RMSViews. Synthetic data; attach your controller handlers to data-action. -->\n<section class="rms-enhance" data-rms-screen="' + name + '">\n' + render().replace(/></g, '>\n<') + '\n</section>\n';
  fs.writeFileSync(path.join(target, 'fragments', name + '.html'), html);
}
for (const file of ['css/rms-enhance.css', 'js/rms-enhance/core.js', 'js/rms-enhance/views.js', 'js/rms-enhance/app.js']) {
  const dest = path.join(target, 'static', file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(web, 'static', file), dest);
}
const crypto = require('crypto');
const files = [];
function scan(dir) {for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {const p=path.join(dir,ent.name);if(ent.isDirectory())scan(p);else if(ent.name!=='manifest.json')files.push({path:path.relative(target,p).replace(/\\/g,'/'),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')});}}
scan(target);
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({generatedAt:new Date().toISOString(),source:'prototype/region/rms',screens:pages.map(([screen,role])=>({screen,role})),files},null,2));
console.log(`Handoff: ${pages.length} HTML fragments, ${files.length} files.`);
