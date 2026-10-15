/* @owner common | @since RMS-PRIVACY-20261015
 * Public question visibility and author protection: Korean privacy guard.
 * Application code, not a government-certified or third-party PII engine.
 * Input: plain text extracted AFTER HTML sanitization. This is NOT an HTML
 * sanitizer or authorization boundary. The server must repeat these checks.
 */
(function(root,factory){
    'use strict';
    var api=factory();
    if(typeof module==='object'&&module.exports) module.exports=api;
    if(root) root.RMSPrivacy=api;
}(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this),function(){
    'use strict';
    var VERSION='1.2.0',MAX_LENGTH=100000;
    var labels={email:'이메일',phone:'전화번호',identity:'주민등록번호',foreigner:'외국인등록번호',card:'카드번호',account:'계좌번호',passport:'여권번호',license:'운전면허번호',name:'이름·담당자',address:'주소',number:'개인식별·금융번호',insurance:'건강보험번호',birth:'생년월일',education:'교육정보',health:'건강정보',family:'가족정보',employment:'고용정보',income:'소득·신용정보',credential:'계정·인증정보',ip:'접속 IP',location:'위치정보'};
    function normalize(value){
        var text=value==null?'':String(value);
        if(text.length>MAX_LENGTH) throw new RangeError('개인정보 검사 최대 길이를 초과했습니다.');
        if(text.normalize) text=text.normalize('NFKC');
        text=text.replace(/&#(x[0-9a-f]{1,6}|\d{1,7});?/gi,function(all,code){
            var n=code.charAt(0).toLowerCase()==='x'?parseInt(code.slice(1),16):parseInt(code,10);
            return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):'';
        }).replace(/&(commat|period|colon|hyphen|nbsp|ZeroWidthSpace);/gi,function(all,name){
            return {commat:'@',period:'.',colon:':',hyphen:'-',nbsp:' ',zerowidthspace:''}[name.toLowerCase()];
        });
        if(text.normalize) text=text.normalize('NFKC');
        return text.replace(/[\u00ad\u034f\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'')
            .replace(/[\u2010-\u2015\u2212\ufe63]/g,'-').replace(/\r\n?/g,'\n')
            .replace(/[\t\u00a0\u202f\u3000]/g,' ')
            .replace(/\s*[\[(]\s*at\s*[\])]\s*/gi,'@')
            .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi,'.');
    }
    function luhn(digits){
        var sum=0,even=false;
        for(var i=digits.length-1;i>=0;i--){var n=Number(digits.charAt(i));if(even){n*=2;if(n>9)n-=9;}sum+=n;even=!even;}
        return sum%10===0&&!/^0+$/.test(digits);
    }
    function replacement(type,value){
        if(type==='name') return /^[가-힣]{2,20}$/.test(value) ? value.charAt(0)+'○'.repeat(value.length-1) : value.charAt(0)+'***';
        if(type==='phone'){
            var digits=value.replace(/\D/g,'');
            if(/^01[016789]/.test(digits)) return digits.slice(0,3)+'-****-****';
            if(/^02/.test(digits)) return '02-****-****';
            return '***-****-****';
        }
        if(type==='email') return '***@***.***';
        return '[개인정보: '+labels[type]+' 숨김]';
    }
    function inspect(value,options){
        var text=normalize(value),spans=[];
        function add(start,end,type){if(end>start)spans.push({start:start,end:end,type:type,label:labels[type]});}
        function collect(regex,type,group){
            var match;regex.lastIndex=0;
            while((match=regex.exec(text))!==null){
                var found=group?match[group]:match[0];
                // Already redacted values stay safe and do not become new detections.
                if(Object.keys(labels).some(function(key){return found.trim()==='[개인정보: '+labels[key]+' 숨김]';}) || found.trim()==='[개인정보: 주민·외국인등록번호 숨김]') continue;
                var offset=group?match[0].lastIndexOf(match[group]):0;
                add(match.index+offset,match.index+offset+(group?match[group]:match[0]).length,type);
                if(!match[0].length)regex.lastIndex++;
            }
        }
        // Deliberately mask plausible IDs even when checksum/real-world validity is unknown.
        collect(/[A-Z0-9.!#$%&'*+/=?^_`{|}~가-힣-]{1,320}\s*@\s*[A-Z0-9가-힣-]{1,255}(?:\s*\.\s*[A-Z0-9가-힣-]{1,63})+/gi,'email');
        if(!options || !options.patternsOnly){
        collect(/(?:주민\s*등록\s*번호|주민번호)\s*[:=]?\s*([0-9][0-9 .\-]{5,30}[0-9])/g,'identity',1);
        collect(/(?:외국인\s*등록\s*번호)\s*[:=]?\s*([0-9][0-9 .\-]{5,30}[0-9])/g,'foreigner',1);
        collect(/(?:계좌(?:\s*번호)?|입금계좌|통장번호)\s*[:=]?\s*(?:[가-힣]{2,12}\s*)?([0-9][0-9 .\-]{5,30}[0-9])/g,'account',1);
        collect(/(?:카드(?:\s*번호)?|신용카드)\s*[:=]?\s*([0-9][0-9 .\-]{9,30}[0-9])/g,'card',1);
        collect(/(?:여권(?:\s*번호)?)\s*[:=]?\s*([A-Z0-9][A-Z0-9 \-]{5,17})/gi,'passport',1);
        collect(/(?:운전\s*면허(?:\s*번호)?|면허번호)\s*[:=]?\s*([0-9][0-9 .\-]{7,25}[0-9])/g,'license',1);
        collect(/(?:성명|이름|작성자|신청인|대표자|예금주|수령인|환자명|수강생명|기업\s*담당자|담당자(?:명)?)\s*[:=]\s*([가-힣]{2,20}|[A-Z][A-Z .'-]{1,60})(?=$|[\s,;|/])/gim,'name',1);
        // An address field may contain arbitrary details: suppress its entire line/field.
        collect(/(?:자택\s*주소|거주지|집\s*주소|상세\s*주소|도로명\s*주소|배송지|주소)\s*[:=]\s*([^\n;|]{3,})/g,'address',1);
        // Context fields: explicit labels only. This is not Korean semantic/NER detection.
        // The whole value is removed to avoid leaving combinations that identify a person.
        [
            ['건강\\s*보험(?:증)?\\s*번호','insurance'],
            ['생년월일|출생일|생일','birth'],
            ['학번|수강생번호|졸업학교|학교명|학력|성적|전공|졸업연도','education'],
            ['병명|진단명|진료기록|건강상태|장애정보|복약정보','health'],
            ['가족관계|가족사항|보호자정보|배우자정보|자녀정보','family'],
            ['사번|소속부서|근무이력|고용정보','employment'],
            ['월소득|연소득|급여|신용등급|신용점수|대출내역','income'],
            ['로그인\\s*아이디|비밀번호|임시비밀번호|인증번호|접근토큰','credential'],
            ['접속\\s*IP|IP\\s*주소','ip'],
            ['GPS|현재위치|위치좌표|위도|경도','location']
        ].forEach(function(rule){collect(new RegExp('(?:'+rule[0]+')\\s*[:=]\\s*([^\\n;|]{1,})','gi'),rule[1],1);});
        }
        collect(/\b[A-Z]\d{3}[A-Z]\d{4}\b|\b[A-Z]\d{8}\b/gi,'passport');
        collect(/\b\d{2}-\d{2}-\d{6}-\d{2}\b/g,'license');
        var candidate=/(?:\+?\d)(?:[\s.\-()]*\d){8,18}/g,match;
        while((match=candidate.exec(text))!==null){
            var raw=match[0],digits=raw.replace(/\D/g,''),type='number';
            if(digits.length===13&&/^[0-9]{6}[1-8]/.test(digits))type=/[5-8]/.test(digits.charAt(6))?'foreigner':'identity';
            else if((/^0(?:1[016789]|2|[3-6][1-5]|70|80)/.test(digits)&&digits.length>=9&&digits.length<=11)||(/^82/.test(digits)&&digits.length>=11&&digits.length<=12))type='phone';
            else if(digits.length>=13&&digits.length<=19&&(luhn(digits)||/\d{4}[ .-]\d{4}/.test(raw)))type='card';
            add(match.index,match.index+raw.length,type);
        }
        spans.sort(function(a,b){return a.start-b.start||b.end-a.end;});
        var merged=[];
        spans.forEach(function(span){var last=merged[merged.length-1];if(last&&span.start<last.end){last.end=Math.max(last.end,span.end);if(last.type==='number'&&span.type!=='number'){last.type=span.type;last.label=span.label;}}else merged.push(span);});
        var result='',cursor=0,types=[];
        merged.forEach(function(span){result+=text.slice(cursor,span.start)+replacement(span.type,text.slice(span.start,span.end));cursor=span.end;if(types.indexOf(span.type)<0)types.push(span.type);});
        result+=text.slice(cursor);
        // Never include raw submitted values in findings/log metadata.
        return {text:result,masked:result,detected:merged.length>0,count:merged.length,types:types,findings:merged,version:VERSION};
    }
    function mask(value){return inspect(value).text;}
    return Object.freeze({version:VERSION,maxLength:MAX_LENGTH,normalize:normalize,inspect:inspect,mask:mask});
}));
