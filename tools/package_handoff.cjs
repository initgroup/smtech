/* Generates publisher handoff fragments from the exact templates used in the demo. */
require('./sync_sfr.cjs');
require('./build_templates.cjs');
require('./build_contracts.cjs');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const base = path.resolve(__dirname, '..');
const web = require('./project.cjs').web;
const core = require(path.join(web, 'demo/js/demo-store.js'));
const seed = JSON.parse(fs.readFileSync(path.join(web, 'demo/data/seed.json'), 'utf8'));
const sandbox = { window: {} };
const assets=JSON.parse(fs.readFileSync(path.join(web,'asset-manifest.json'),'utf8'));
for (const name of assets.scripts.filter(file=>!file.endsWith('/app.js')&&file!=='integration/config.js')) vm.runInNewContext(fs.readFileSync(path.join(web,name),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(web,'demo/js/receipt-samples.js'),'utf8'),sandbox);
sandbox.window.RMSMydata.setBundles(sandbox.window.RMSMydata.manifest.map(meta=>sandbox.window.RMSMydata.parseXml(fs.readFileSync(path.join(web,meta.xmlPath),'utf8'),meta)));
const store = core.createStore(seed, null);
const getState=store.getState;const boards=JSON.parse(fs.readFileSync(path.join(web,'demo/data/boards.json'),'utf8'));store.getState=()=>Object.assign(getState(),{boards});
const ui = { doctorFilters: {}, statsFilters: {}, selected: new Set(), faqQuery: '', faqWork: '', docStatus: '', codeKind: 'technology' };
const views = sandbox.window.RMSViews.create(store, ui);
const target = path.join(base, 'handoff');
fs.mkdirSync(path.join(target, 'fragments'), { recursive: true });
// Generated outputs only: reject links and remove stale files individually inside the verified handoff root.
const allowedAssets=new Set(assets.scripts.concat(assets.styles));
function pruneGenerated(dir){if(!fs.existsSync(dir))return;for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,ent.name);if(ent.isSymbolicLink())throw Error('Symlink in generated mirror');if(ent.isDirectory())pruneGenerated(file);else if(!allowedAssets.has(path.relative(target,file).replace(/\\/g,'/')))fs.unlinkSync(file);}}
pruneGenerated(path.join(target,'static'));pruneGenerated(path.join(target,'data'));
if(fs.existsSync(path.join(target,'fragments/guide.html')))fs.unlinkSync(path.join(target,'fragments/guide.html'));
const pages = [
  ['home', 'visitor', () => views.home()], ['home-two','visitor',()=>views.home('2')],
  ...['notice','qna','faq','resources'].map(type=>['board-'+type,'visitor',()=>views.boards(type,'')]),
  ['search','visitor',()=>views.search('사업')],['mydata-report','visitor',()=>sandbox.window.RMSMydata.renderReport('company-application')], ['doctors', 'company', () => views.doctors()],
  ['doctor-detail', 'tp', () => views.doctorDetail('D001')], ['matches', 'tp', () => views.matches()],
  ['statistics', 'tp', () => views.stats()], ['documents-company', 'company', () => views.documents('A001')],
  ['documents-manager', 'tp', () => views.documents('A001')], ['faq', 'visitor', () => views.faq(false)],
  ['questions', 'visitor', () => views.faq(true)], ['classifications', 'admin', () => views.manage()],
  ['home-settings', 'admin', () => views.manage('home')], ['document-settings', 'admin', () => views.manage('documents')]
];
for (const [name, role, render] of pages) {
  store.setRole(role);
  const html = '<!-- Publisher fragment generated from RMSViews. Synthetic data; attach your controller handlers to data-action. -->\n<section class="rms-enhance" data-rms-screen="' + name + '">\n' + render().replace(/></g, '>\n<') + '\n</section>\n';
  fs.writeFileSync(path.join(target, 'fragments', name + '.html'), html);
}
// Generated mirror; edit prototype source, never handoff/static or handoff/templates.
for(const file of assets.scripts.concat(assets.styles)){const dest=path.join(target,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(web,file),dest);}
for(const directory of ['templates','contracts']){
  // Remove only stale generated files whose source counterpart no longer exists.
  const mirror=path.join(target,directory);
  function prune(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Generated mirror must not contain links: '+file);if(entry.isDirectory())prune(file);else if(!fs.existsSync(path.join(web,path.relative(target,file))))fs.unlinkSync(file);}}
  prune(mirror);fs.cpSync(path.join(web,directory),mirror,{recursive:true});
}
fs.copyFileSync(path.join(web,'asset-manifest.json'),path.join(target,'asset-manifest.json'));

fs.cpSync(path.join(web,'downloads','boards'),path.join(target,'downloads','boards'),{recursive:true});
const crypto = require('crypto');
const files = [];
function scan(dir) {for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {const p=path.join(dir,ent.name);if(ent.isDirectory())scan(p);else if(ent.name!=='manifest.json')files.push({path:path.relative(target,p).replace(/\\/g,'/'),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')});}}
scan(target);
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({release:assets.release,generatedAt:'2026-10-08',source:'prototype/region/rms',screens:pages.map(([screen,role])=>({screen,role})),files},null,2));
console.log(`Handoff: ${pages.length} HTML fragments, ${files.length} files.`);
