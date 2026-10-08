const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../../prototype/region/rms/static/js/rms-enhance');
const api=require(path.join(base,'data/mydata-repository.js'));
const sandbox={window:{RMSMydata:api}};
for(const file of ['generated/templates.js','common/templates.js','ui/mydata-report.js'])vm.runInNewContext(fs.readFileSync(path.join(base,file),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(base,'../../../demo/js/receipt-samples.js'),'utf8'),sandbox);
module.exports=api;
