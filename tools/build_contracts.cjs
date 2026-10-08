const fs=require('node:fs'),path=require('node:path');
const web=require('./project.cjs').web;
const contract=JSON.parse(fs.readFileSync(path.join(web,'contracts/commands.json'),'utf8'));
const file=path.join(web,'static/js/rms-enhance/generated/contracts.js');
const content='/* GENERATED from contracts/commands.json by tools/build_contracts.cjs. */\nwindow.RMSCommands = '+JSON.stringify(contract.commands,null,2)+';\n';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==content)throw Error('Command bundle is stale');}else fs.writeFileSync(file,content);
console.log('Command contract '+Object.keys(contract.commands).length+' commands verified.');
