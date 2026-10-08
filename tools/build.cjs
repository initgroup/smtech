/* Reproducible publisher build; Node built-ins only. */
require('./package_handoff.cjs');require('./build_demo.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const web=require('./project.cjs').web;
for(const [entry,manifest] of [['application.html','asset-manifest.json'],['index.html','demo/asset-manifest.json']]){const assets=JSON.parse(fs.readFileSync(path.join(web,manifest),'utf8')),html=fs.readFileSync(path.join(web,entry),'utf8');const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);if(JSON.stringify(scripts)!==JSON.stringify(assets.scripts))throw Error(entry+' asset order mismatch');for(const file of scripts)new vm.Script(fs.readFileSync(path.join(web,file),'utf8'),{filename:file});for(const file of assets.styles)if(!html.includes('href="'+file+'"'))throw Error('Missing stylesheet: '+file);}
console.log('Business and demo entries verified independently.');
