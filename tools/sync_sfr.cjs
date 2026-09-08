// Embed the extracted RFP requirements and reviewed coverage in the static views.
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(base, 'reference/documents/requirements-catalog.json'), 'utf8'));
const doc = fs.readFileSync(path.join(base, 'docs/01-business-requirements.md'), 'utf8');
const implementation = JSON.parse(fs.readFileSync(path.join(base, 'docs/sfr-implementation.json'), 'utf8'));
const implementationById = new Map(implementation.requirements.map(r => [r.id, r]));
if (implementationById.size !== 15 || implementation.requirements.length !== 15) throw Error('Incomplete SFR implementation notes');
for (const [id, menu] of Object.entries(implementation.menus)) {
  if (!/^[a-z-]+$/.test(id) || !menu.label || !['home','doctors','matches','stats','manage','manage/home','manage/documents','documents','faq','questions'].includes(menu.route) || !Array.isArray(menu.roles) || menu.roles.some(role => !['company','tp','admin'].includes(role)) || (menu.step && !['1','2','3','4'].includes(menu.step)) || (menu.record && menu.record !== 'doctor') || (menu.codeKind && !['technology','work'].includes(menu.codeKind))) throw Error('Invalid SFR menu: ' + id);
}
const coverage = new Map(doc.split(/\r?\n/).filter(line => /^\| SFR-\d\d \|/.test(line)).map(line => {
  const columns = line.split('|').map(s => s.trim());
  return [columns[1], {demo: columns[3], remaining: columns[4]}];
}));
const requirements = catalog.requirements.filter(r => /^SFR-\d\d$/.test(r.sourceId)).map(r => {
  const detail = implementationById.get(r.sourceId);
  if (!detail || ['design','screen','technology','data'].some(k => typeof detail[k] !== 'string' || !detail[k].trim()) || !Array.isArray(detail.followup) || detail.followup.length < 2 || !detail.menus?.length || new Set(detail.menus).size !== detail.menus.length) throw Error('Incomplete SFR implementation: ' + r.sourceId);
  return {
    id: r.sourceId, name: r.name, definition: r.definition, details: r.details,
    ...coverage.get(r.sourceId),
    implementation: {design: detail.design, screen: detail.screen, technology: detail.technology, data: detail.data},
    followup: detail.followup,
    menus: detail.menus.map(id => {if (!implementation.menus[id]) throw Error('Unknown SFR menu: ' + id);return {id, ...implementation.menus[id]};})
  };
});
if (requirements.length !== 15 || requirements.some(r => !r.demo || !r.remaining)) throw Error('Incomplete SFR catalog');
const target = path.join(base, 'prototype/region/rms/static/js/rms-enhance/views.js');
const source = fs.readFileSync(target, 'utf8');
const marker = /\/\* SFR-CATALOG-BEGIN \*\/[\s\S]*?\/\* SFR-CATALOG-END \*\//;
if (!marker.test(source)) throw Error('Missing SFR catalog markers');
fs.writeFileSync(target, source.replace(marker, () => '/* SFR-CATALOG-BEGIN */\n  var requirements = '+JSON.stringify(requirements,null,2)+';\n  /* SFR-CATALOG-END */'));
console.log('Embedded all 15 SFR requirements.');
