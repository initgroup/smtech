// Shared build paths. Update project-config.json and the delivery allowlist when moving source roots.
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');const config=JSON.parse(fs.readFileSync(path.join(__dirname,'project-config.json'),'utf8'));
function projectPath(relative){const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))throw Error('Path escapes project: '+relative);return file;}
module.exports={root,config,web:projectPath(config.webRoot),projectPath};
