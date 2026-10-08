/* Four received XML samples. Data-only parser and report renderer; no production API calls. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RMSMydata = api;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var manifest = [
    {id:'personal-application',label:'개인용 · 신청',audience:'개인용',purpose:'신청',fileName:'묶음정보(개인용-신청)_수신결과(샘플).txt'},
    {id:'personal-preference',label:'개인용 · 우대가점',audience:'개인용',purpose:'우대가점',fileName:'묶음정보(개인용-우대가점)_수신결과(샘플).txt'},
    {id:'company-application',label:'기업용 · 신청',audience:'기업용',purpose:'신청',fileName:'묶음정보(기업용-신청)_수신결과(샘플).txt'},
    {id:'company-preference',label:'기업용 · 우대가점',audience:'기업용',purpose:'우대가점',fileName:'묶음정보(기업용-우대가점)_수신결과(샘플).txt'}
  ].map(function (m) {
    m.xmlPath='data/mydata/'+m.id+'.xml';
    m.originalPath='data/mydata/'+m.fileName;
    m.sourceEncoding='EUC-KR (CP949)';
    return m;
  });
  var specs = {
    F01:{name:'사업자등록증명서',prefix:'사업자등록증명',provider:'국세청'},
    F02:{name:'폐업사실증명서',prefix:'폐업사실증명',provider:'국세청'},
    F03:{name:'휴업사실증명서',prefix:'휴업사실증명',provider:'국세청'},
    F04:{name:'표준재무제표증명서',prefix:'표준재무제표증명',provider:'국세청'},
    F05:{name:'국세 납세증명서',prefix:'국세_납세증명서',provider:'국세청'},
    F06:{name:'지방세 납세증명서',prefix:'지방세납세증명서',provider:'지방자치단체'},
    F07:{name:'부가가치세 과세표준증명',prefix:'부가가치세',provider:'국세청'},
    F08:{name:'중소기업확인서',prefix:'중소기업확인서',provider:'중소벤처기업부'},
    F09:{name:'4대 사회보험료 완납 증명서',prefix:'사대사회보험료완납증명서',provider:'국민건강보험공단'}
  };
  var bundles=[],loading=null;
  function esc(v) {return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clone(value) {return JSON.parse(JSON.stringify(value));}
  function entities(text) {
    if(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/.test(text))throw new Error('XML 엔티티 형식이 올바르지 않습니다.');
    return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);/g,function(_,v){
      if(v[0]==='#'){var code=v[1]==='x'?parseInt(v.slice(2),16):parseInt(v.slice(1),10);if(!Number.isSafeInteger(code)||code<1||code>0x10ffff)throw new Error('XML 문자 코드 오류');return String.fromCodePoint(code);}
      return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[v];
    });
  }
  // Preserve order, empty leaves and repeated records. Never resolve DTDs or external entities.
  function parseTree(xml) {
    if(typeof xml!=='string'||xml.length>1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('지원하지 않는 XML 수신 형식입니다.');
    var holder={name:'',children:[],text:''},stack=[holder],position=0;
    var tokens=xml.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[^>]+>|[^<]+/g);
    for(var match of tokens){
      if(match.index!==position)throw new Error('XML 구문 오류');position=match.index+match[0].length;
      var token=match[0],current=stack[stack.length-1];
      if(token.startsWith('<!--')||token.startsWith('<?'))continue;
      if(token.startsWith('<![CDATA[')){current.text+=token.slice(9,-3);continue;}
      if(token[0]!=='<'){current.text+=entities(token);continue;}
      if(token.startsWith('</')){
        var endName=token.slice(2,-1).trim();
        if(stack.length===1||current.name!==endName)throw new Error('XML 닫는 태그가 일치하지 않습니다: '+endName);
        stack.pop();continue;
      }
      var selfClosing=/\/>$/.test(token),inside=token.slice(1,selfClosing?-2:-1).trim();
      var name=inside.split(/\s/)[0];
      if(!/^[A-Za-z_\u0080-\uFFFF][A-Za-z0-9_.:\-\u0080-\uFFFF]*$/.test(name)||name[0]==='!')throw new Error('XML 태그 형식 오류');
      var node={name:name,children:[],text:''};current.children.push(node);
      if(!selfClosing){stack.push(node);if(stack.length>50)throw new Error('XML 계층이 너무 깊습니다.');}
    }
    if(position!==xml.length||stack.length!==1||holder.children.length!==1||holder.text.trim())throw new Error('XML 문서가 완전하지 않습니다.');
    return holder.children[0];
  }
  function child(node,name) {return node&&node.children.find(function(n){return n.name===name;});}
  function flatten(node) {
    var result=[];
    function visit(n,parts) {
      if(!n.children.length){result.push({tag:n.name,value:n.text.trim(),group:parts.join(' › ')||'기본정보',path:parts.concat(n.name).join('/')});return;}
      var counts={},seen={};
      n.children.forEach(function(c){counts[c.name]=(counts[c.name]||0)+1;});
      n.children.forEach(function(c){
        seen[c.name]=(seen[c.name]||0)+1;
        var segment=c.name+(counts[c.name]>1?'['+seen[c.name]+']':'');
        if(!c.children.length){result.push({tag:c.name,value:c.text.trim(),group:parts.join(' › ')||'기본정보',path:parts.concat(segment).join('/')});}
        else visit(c,parts.concat(segment));
      });
    }
    if(node)visit(node,[]);
    return result;
  }
  function first(fields,names) {
    for(var i=0;i<names.length;i++){var row=fields.find(function(f){return f.tag===names[i]&&f.value!=='';});if(row)return row.value;}
    return '';
  }
  function providerFor(name,fields) {
    var spec=Object.keys(specs).map(function(id){return specs[id];}).find(function(s){return name.indexOf(s.prefix)===0;});
    return first(fields,['확인기관명','발급세무서','발급세무서명'])||(spec?spec.provider:'샘플 제공기관 미기재');
  }
  function companyFrom(documents) {
    var doc=documents.find(function(d){return d.code.indexOf('사업자등록증명')===0;}),f=doc?doc.fieldsDetailed:[];
    return {companyName:first(f,['상호-법인명','기업명','상호','업체명']),representative:first(f,['성명-대표자','대표자명','대표자','성명']),address:first(f,['사업장소재지','소재지','주소']),businessNumber:first(f,['사업자등록번호-발급','사업자등록번호','입력사업자등록번호'])};
  }
  function transactionTime(value) {
    return /^\d{14}/.test(value||'')?value.slice(0,4)+'-'+value.slice(4,6)+'-'+value.slice(6,8)+' '+value.slice(8,10)+':'+value.slice(10,12)+':'+value.slice(12,14):'';
  }
  function parseXml(xml,metadata) {
    var meta=typeof metadata==='string'?manifest.find(function(m){return m.id===metadata;}):metadata;
    if(!meta||!meta.id)throw new Error('수신 묶음 식별자가 없습니다.');
    var tree=parseTree(xml),headerNode=child(child(tree,'Header'),'commonHeader'),response=child(child(tree,'Body'),'response');
    if(tree.name!=='Envelope'||!headerNode||!response)throw new Error('Envelope 수신 구조가 올바르지 않습니다.');
    var header={};flatten(headerNode).forEach(function(f){header[f.tag]=f.value;});
    var payload=response.children.find(function(n){return n.name!=='비고';});
    if(!payload)throw new Error('묶음 응답 본문이 없습니다.');
    var documents=payload.children.map(function(n){
      var fields=flatten(n),populated=fields.filter(function(f){return f.value!=='';}).length;
      var code=first(fields,['처리결과코드','결과코드','오류코드']);
      var message=first(fields,['처리결과메시지','처리결과메세지','처리결과내용','결과메시지','오류메시지']);
      return {code:n.name,name:n.name.replace(/-기업용$/,'').replace(/_/g,' '),provider:providerFor(n.name,fields),fields:fields.map(function(f){return [f.tag,f.value];}),fieldsDetailed:fields,fieldCount:fields.length,populatedCount:populated,emptyCount:fields.length-populated,resultCode:code,resultMessage:message||(code?'처리결과코드 '+code+' (원문값)':populated?'수신정보 확인':'수신값 없음')};
    });
    var bundle=Object.assign({},meta,{header:header,payloadName:payload.name,transactionAt:transactionTime(header.transactionUniqueId),processingResult:first(flatten(child(response,'비고')),['원장처리결과']),documents:documents,xml:xml});
    bundle.fieldCount=documents.reduce(function(n,d){return n+d.fieldCount;},0);
    bundle.populatedCount=documents.reduce(function(n,d){return n+d.populatedCount;},0);
    bundle.emptyCount=bundle.fieldCount-bundle.populatedCount;
    bundle.company=companyFrom(documents);
    return bundle;
  }
  function setBundles(values) {
    if(!Array.isArray(values)||values.some(function(b){return !b||!b.id||!Array.isArray(b.documents);}))throw new Error('수신 묶음 자료 형식 오류');
    bundles=clone(values);return bundles;
  }
  function load(options) {
    if(loading)return loading;
    var opts=options||{},fetcher=opts.fetch||(typeof fetch==='function'?fetch:null);
    if(!fetcher)return Promise.reject(new Error('XML을 읽을 수 있는 fetch가 없습니다.'));
    loading=Promise.all(manifest.map(function(meta){
      return fetcher((opts.baseUrl||'')+meta.xmlPath).then(function(res){if(res.ok===false)throw new Error(meta.label+' 수신 XML을 읽지 못했습니다.');return res.text();}).then(function(xml){return parseXml(xml,meta);});
    })).then(function(values){return setBundles(values);}).catch(function(error){loading=null;throw error;});
    return loading;
  }
  function getBundle(id) {return bundles.find(function(b){return b.id===id;})||null;}
  function companyInfo(id) {
    var bundle=getBundle(id);
    return clone(bundle?bundle.company:{companyName:'',representative:'',address:'',businessNumber:''});
  }
  function mapDocument(specId,bundleId) {
    var bundle=getBundle(bundleId),spec=specs[specId],doc=bundle&&spec&&bundle.documents.find(function(d){return d.code.indexOf(spec.prefix)===0;});
    if(!doc)return {available:false,bundleId:bundleId,documentCode:'',documentName:spec?spec.name:String(specId),provider:spec?spec.provider:'',resultCode:'',resultMessage:'선택한 수신 묶음에 해당 서류가 없습니다.',fields:[],fieldsDetailed:[],fieldCount:0,populatedCount:0,emptyCount:0,company:companyInfo(bundleId)};
    return Object.assign({available:true,bundleId:bundleId,documentCode:doc.code,documentName:doc.name,company:companyInfo(bundleId)},clone(doc));
  }
  function button(label,attribute,value,pressed) {
    return '<button type="button" '+attribute+'="'+esc(value)+'"'+(typeof pressed==='boolean'?' aria-pressed="'+pressed+'"':'')+'>'+esc(label)+'</button>';
  }
  function renderIndex(selected) {
    return '<nav class="rms-report-bundles" aria-label="수신 XML 묶음 선택">'+manifest.map(function(meta){
      var bundle=getBundle(meta.id);
      return '<button type="button" data-report-bundle="'+meta.id+'" aria-pressed="'+(selected===meta.id)+'"><span>'+esc(meta.audience)+'</span><strong>'+esc(meta.purpose)+'</strong><small>'+(bundle?bundle.documents.length+'개 문서 · '+bundle.populatedCount+'개 수신값':'파일 준비 중')+'</small></button>';
    }).join('')+'</nav>';
  }
  function kv(label,value) {return '<div><dt>'+esc(label)+'</dt><dd>'+esc(value||'미기재')+'</dd></div>';}
  function status(doc) {return '<span class="rms-report-state'+(!doc.populatedCount?' is-empty':'')+'">'+(doc.populatedCount?'정보 수신':'값 없는 서식')+'</span>';}
  function renderSummary(bundle) {
    var company=bundle.company;
    return '<section class="rms-report-summary"><div class="rms-report-summarytop"><div><p class="rms-report-overline">수신 데이터 현황</p><h3>'+bundle.documents.length+'개 문서에서 '+bundle.populatedCount+'개 값을 확인했습니다</h3><p>공란 '+bundle.emptyCount+'개를 포함한 전체 '+bundle.fieldCount+'개 항목을 원문 순서대로 제공합니다.</p></div><div class="rms-report-ratio"><strong>'+Math.round(bundle.populatedCount/Math.max(bundle.fieldCount,1)*100)+'<small>%</small></strong><span>필드 수신율</span></div></div>'+
      '<dl class="rms-report-keyfacts">'+kv('기업명 · 사업자등록증명 기준',company.companyName)+kv('대표자',company.representative)+kv('사업자등록번호',company.businessNumber)+kv('사업장 소재지',company.address)+'</dl>'+
      '<div class="rms-report-notice">각 문서는 서로 다른 예시 기업·기간의 정보를 포함합니다. 문서별 원문값을 그대로 표시하며, 공란이나 과거 유효기간을 정상·적격으로 판정하지 않습니다.</div>'+
      '<div class="rms-report-documentcards">'+bundle.documents.map(function(doc,i){return '<button type="button" data-report-document="'+esc(doc.code)+'"><span class="rms-report-docnumber">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(doc.name)+'</strong><small>'+esc(doc.provider)+'</small></span>'+status(doc)+'<span class="rms-report-doccount">'+doc.populatedCount+' / '+doc.fieldCount+' 항목 <b aria-hidden="true">↗</b></span></button>';}).join('')+'</div>'+
      '<section class="rms-report-coverage"><h3>신청 증빙 9종과 수신 묶음 대조</h3><div class="rms-report-coveragegrid">'+Object.keys(specs).map(function(id){var mapped=mapDocument(id,bundle.id);return '<div><span>'+esc(specs[id].name)+'</span><b class="'+(!mapped.available?'is-missing':'')+'">'+(!mapped.available?'묶음에 없음':mapped.populatedCount?'수신값 '+mapped.populatedCount+'개':'값 없음')+'</b></div>';}).join('')+'</div></section></section>';
  }
  function renderFields(doc,query) {
    var q=(query||'').trim().toLocaleLowerCase(),groups=[];
    doc.fieldsDetailed.forEach(function(field){
      if(q&&[field.tag,field.value,field.path].join(' ').toLocaleLowerCase().indexOf(q)<0)return;
      var group=groups.find(function(g){return g.name===field.group;});
      if(!group){group={name:field.group,fields:[]};groups.push(group);}group.fields.push(field);
    });
    if(!groups.length)return '<p class="rms-report-empty">일치하는 수신 항목이 없습니다.</p>';
    return groups.map(function(group){return '<section class="rms-report-fieldgroup"><h4>'+esc(group.name)+'</h4><dl>'+group.fields.map(function(f){return '<div'+(!f.value?' class="is-empty"':'')+'><dt>'+esc(f.tag)+'</dt><dd>'+esc(f.value||'수신값 없음')+'</dd></div>';}).join('')+'</dl></section>';}).join('');
  }
  function renderDocuments(bundle,documentCode,query) {
    var doc=bundle.documents.find(function(d){return d.code===documentCode;})||bundle.documents[0];
    if(!doc)return '<p class="rms-report-empty">수신된 문서가 없습니다.</p>';
    return '<div class="rms-report-documents"><nav class="rms-report-docnav" aria-label="문서별 수신정보">'+bundle.documents.map(function(d,i){return '<button type="button" data-report-document="'+esc(d.code)+'" aria-pressed="'+(d.code===doc.code)+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(d.name)+'</strong><small>'+d.populatedCount+' / '+d.fieldCount+'</small></button>';}).join('')+'</nav><section class="rms-report-document"><div class="rms-report-documenthead"><div><p class="rms-report-overline">'+esc(doc.provider)+'</p><h3>'+esc(doc.name)+'</h3></div>'+status(doc)+'</div><div class="rms-report-documentmeta"><span>전체 <b>'+doc.fieldCount+'</b></span><span>수신값 <b>'+doc.populatedCount+'</b></span><span>공란 <b>'+doc.emptyCount+'</b></span>'+(doc.resultCode?'<span>처리결과코드 <b>'+esc(doc.resultCode)+'</b></span>':'')+'</div><label class="rms-report-filter">수신항목 검색<input type="search" data-report-query placeholder="항목명 또는 수신값 검색" value="'+esc(query||'')+'"></label><div data-report-fields>'+renderFields(doc,query)+'</div></section></div>';
  }
  function renderReport(bundleId,documentCode,state) {
    var bundle=getBundle(bundleId)||bundles[0];
    if(!bundle)return '<p class="rms-report-empty" role="status">수신 XML 파일을 불러오는 중입니다.</p>';
    var view=state&&state.tab|| (documentCode?'documents':'summary'),query=state&&state.query||'';
    var tabs=[['summary','수신 요약'],['documents','문서별 상세'],['xml','XML 원문']];
    return '<div class="rms-report" data-report-current="'+esc(bundle.id)+'">'+renderIndex(bundle.id)+
      '<header class="rms-report-header"><div><p class="rms-report-overline">RECEIVED XML REPORT</p><h2>'+esc(bundle.label)+' 수신정보 보고서</h2><p>'+esc(bundle.fileName)+'</p></div><span class="rms-report-source">사용자 제공 샘플</span></header>'+
      '<dl class="rms-report-metadata">'+kv('서비스 ID',bundle.header.serviceId)+kv('거래 ID',bundle.header.transactionUniqueId)+kv('거래 식별시각',bundle.transactionAt)+kv('정보제공 동의',bundle.header.agreementYn==='Y'?'Y · 동의':bundle.header.agreementYn)+kv('원장 처리결과',bundle.processingResult)+'</dl>'+
      '<div class="rms-report-toolbar"><nav class="rms-report-tabs" aria-label="수신 보고서 보기">'+tabs.map(function(tab){return button(tab[1],'data-report-tab',tab[0],view===tab[0]);}).join('')+'</nav><button type="button" class="rms-btn rms-btn-small" data-report-download="'+esc(bundle.id)+'">XML 다운로드 ↓</button></div>'+
      '<div class="rms-report-content">'+(view==='xml'?'<div class="rms-report-rawintro"><h3>수신 XML 원문</h3><p>첨부 원본의 EUC-KR 한글을 UTF-8로 변환한 XML입니다. 태그·수신값·공란과 문서 순서를 보존했습니다.</p><a href="'+esc(bundle.originalPath)+'" download>첨부 원본 TXT 다운로드</a></div><pre class="rms-report-raw" tabindex="0"><code>'+esc(bundle.xml)+'</code></pre>':view==='documents'?renderDocuments(bundle,documentCode,query):renderSummary(bundle))+'</div>'+
      '<footer class="rms-report-footer">표시 기준: 첨부된 수신결과 샘플 · 거래 식별시각은 transactionUniqueId 앞 14자리이며 실제 조회일시와 구분합니다.</footer></div>';
  }
  function mount(element,bundleId,documentCode) {
    if(!element)throw new Error('수신 보고서 표시 영역이 없습니다.');
    var bundle=getBundle(bundleId)||bundles[0],state={bundleId:bundle?bundle.id:bundleId,documentCode:documentCode||'',tab:documentCode?'documents':'summary',query:''};
    if(element._rmsReportCleanup)element._rmsReportCleanup();
    function draw(focusSelector) {
      element.innerHTML=renderReport(state.bundleId,state.documentCode,state);
      var focus=focusSelector&&element.querySelector(focusSelector);if(focus)focus.focus({preventScroll:true});
    }
    function click(ev) {
      var control=ev.target.closest('[data-report-bundle],[data-report-tab],[data-report-document],[data-report-download]');
      if(!control||!element.contains(control))return;
      ev.preventDefault();ev.stopPropagation();
      if(control.hasAttribute('data-report-download')){
        var current=getBundle(control.dataset.reportDownload);if(!current)return;
        var url=URL.createObjectURL(new Blob([current.xml],{type:'application/xml;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=current.id+'.xml';link.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);return;
      }
      if(control.hasAttribute('data-report-bundle')){state.bundleId=control.dataset.reportBundle;state.documentCode='';state.query='';}
      if(control.hasAttribute('data-report-tab')){state.tab=control.dataset.reportTab;state.query='';}
      if(control.hasAttribute('data-report-document')){state.documentCode=control.dataset.reportDocument;state.tab='documents';state.query='';}
      var attr=control.hasAttribute('data-report-bundle')?'data-report-bundle':control.hasAttribute('data-report-tab')?'data-report-tab':'data-report-document';
      var value=control.getAttribute(attr);draw();
      var next=Array.from(element.querySelectorAll('['+attr+']')).find(function(c){return c.getAttribute(attr)===value;});if(next)next.focus({preventScroll:true});
    }
    function input(ev) {
      if(!ev.target.hasAttribute('data-report-query'))return;
      state.query=ev.target.value;var current=getBundle(state.bundleId),doc=current&&current.documents.find(function(d){return d.code===state.documentCode;})||current&&current.documents[0];
      if(doc)element.querySelector('[data-report-fields]').innerHTML=renderFields(doc,state.query);
    }
    element.addEventListener('click',click);element.addEventListener('input',input);
    element._rmsReportCleanup=function(){element.removeEventListener('click',click);element.removeEventListener('input',input);};
    draw();return element._rmsReportCleanup;
  }
  return {manifest:manifest,specs:specs,load:load,setBundles:setBundles,parseXml:parseXml,getBundle:getBundle,mapDocument:mapDocument,companyInfo:companyInfo,renderIndex:renderIndex,renderReport:renderReport,mount:mount};
}));
