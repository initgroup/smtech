/* @owner publisher | Inline masked values and contextual help. No original PII is retained. */
(function (window) {
    'use strict';
    var document = window.document, current = null, returnFocus = null;
    var help = {
    "name": [
        "이름",
        "성만 남기고 나머지 글자를 ○로 바꿉니다. 성명·신청인·예금주 등 이름 필드를 검사하며 자유 문장 속 모든 인명을 자동 인식하는 기능은 아닙니다.",
        "신청인: 김○○ / 예금주: 박○○",
        27,
        "책자 p.25~26 · 명단 및 관리자 댓글 노출 사례"
    ],
    "phone": [
        "전화번호",
        "휴대전화 식별번호만 남기고 가입자 번호를 가립니다. 연락처를 다시 게시하지 않고 기관의 비공개 상담 경로로 안내합니다.",
        "연락처: 010-****-****",
        159,
        "책자 p.158 · 주요 개인정보 8종 / p.33~34 · 이용자 게시글·댓글"
    ],
    "email": [
        "이메일",
        "계정과 도메인을 모두 가립니다. 문의 회신용 주소도 개인을 식별하거나 다른 정보와 결합할 수 있습니다.",
        "회신 이메일: ***@***.***",
        9,
        "책자 p.8 · 개인정보 개념 / p.33~34 · 게시글·댓글"
    ],
    "identity": [
        "주민등록번호",
        "생년월일·성별을 추정할 수 있는 앞부분까지 전체 숨김 처리합니다. 공개 댓글이나 증빙서류 전사 내용에도 같은 검사를 적용합니다.",
        "주민등록번호: [개인정보: 주민등록번호 숨김]",
        159,
        "책자 p.158 · 주요 개인정보 8종 / p.34 · 댓글 사례"
    ],
    "foreigner": [
        "외국인등록번호",
        "번호 전체를 숨깁니다. 이용자가 기재한 값뿐 아니라 관리자 답변에 재인용한 번호도 공개 출력 전에 검사합니다.",
        "외국인등록번호: [개인정보: 외국인등록번호 숨김]",
        27,
        "책자 p.26 · 관리자 답변의 외국인등록번호 노출 / p.158"
    ],
    "passport": [
        "여권번호",
        "신·구 여권 형식을 검사하고 번호 전체를 제거합니다. 해외출장 문의에 필요한 일정·절차 설명은 유지합니다.",
        "여권번호: [개인정보: 여권번호 숨김]",
        159,
        "책자 p.158 · 여권번호 정규표현식"
    ],
    "license": [
        "운전면허번호",
        "운전면허 번호 전체를 숨깁니다. 면허 보유 여부를 묻는 일반 문장과 실제 식별번호를 구분합니다.",
        "운전면허번호: [개인정보: 운전면허번호 숨김]",
        159,
        "책자 p.158 · 운전면허번호 정규표현식"
    ],
    "account": [
        "계좌번호",
        "은행 계좌의 전체 숫자를 제거합니다. 예금주 이름도 별도로 마스킹해 정산·환급 문의에서 두 정보가 함께 드러나지 않도록 합니다.",
        "입금계좌: [개인정보: 계좌번호 숨김]",
        159,
        "책자 p.158 · 계좌번호 정규표현식 / p.10 · 신용정보"
    ],
    "card": [
        "카드번호",
        "카드번호 전체를 숨깁니다. 공개 게시판에서 결제 확인을 위해 전체 카드번호를 다시 요구하지 않습니다.",
        "카드번호: [개인정보: 카드번호 숨김]",
        159,
        "책자 p.158 · 신용카드번호 정규표현식"
    ],
    "insurance": [
        "건강보험번호",
        "건강보험번호를 별도 항목으로 판별해 전체 숨김 처리합니다. 건강상태·진료기록은 건강정보 필드 규칙으로 따로 검사합니다.",
        "건강보험번호: [개인정보: 건강보험번호 숨김]",
        159,
        "책자 p.158 · 건강보험번호 / p.12 · 의료정보 활용"
    ],
    "address": [
        "주소",
        "자택·거주지·배송지·주소 필드의 상세 값을 통째로 제거합니다. 자유 문장에 적힌 모든 주소를 판별하는 기능은 아닙니다.",
        "배송지: [개인정보: 주소 숨김]",
        11,
        "책자 p.10 · 일반정보 / p.29 · 문서파일 노출 사례"
    ],
    "birth": [
        "생년월일",
        "생년월일 필드 값을 전체 제거합니다. 이름·학번 등과 결합하면 특정인을 알아볼 수 있어 명단 공개 시 함께 보호합니다.",
        "생년월일: [개인정보: 생년월일 숨김]",
        26,
        "책자 p.25 · 이름·학번·생년월일·연락처 명단 노출"
    ],
    "education": [
        "교육정보",
        "학번·학력·학교명·성적·전공 등 명시된 필드 값을 숨깁니다. 교육 프로그램명 같은 일반적인 업무 안내는 유지합니다.",
        "학번: [개인정보: 교육정보 숨김]",
        26,
        "책자 p.25 · 명단 노출 / p.11 · 교육 및 훈련정보"
    ],
    "health": [
        "건강정보",
        "병명·진단명·진료기록·장애정보 등 명시된 필드의 내용을 통째로 제거합니다. 자유 문장의 질병·의료 문맥까지 자동 판별하지는 않습니다.",
        "진단명: [개인정보: 건강정보 숨김]",
        12,
        "책자 p.8·11 · 의료·건강정보 분류"
    ],
    "family": [
        "가족정보",
        "가족관계·보호자·배우자·자녀정보 필드 전체를 숨깁니다. 이름만 가리고 관계나 가족의 신상을 남기지 않습니다.",
        "가족관계: [개인정보: 가족정보 숨김]",
        11,
        "책자 p.10 · 가족관계·가족 구성원정보"
    ],
    "employment": [
        "고용정보",
        "사번·소속부서·근무이력 등 명시된 필드의 개인별 정보를 제거합니다. 공개된 기관 소개와 개인의 근무기록은 구분해 검토합니다.",
        "근무이력: [개인정보: 고용정보 숨김]",
        12,
        "책자 p.11 · 고용정보 분류"
    ],
    "income": [
        "소득·신용정보",
        "급여·소득·신용등급·대출내역 필드 값을 전체 제거합니다. 개인별 경제 상황이 드러나는 내용은 공개 문의에 남기지 않습니다.",
        "월소득: [개인정보: 소득·신용정보 숨김]",
        11,
        "책자 p.10 · 소득·신용정보 분류"
    ],
    "credential": [
        "계정·인증정보",
        "로그인 아이디·비밀번호·인증번호·토큰 등 명시된 필드 전체를 제거합니다. 실제 인증정보를 게시했다면 별도 폐기·재발급 절차가 필요합니다.",
        "임시비밀번호: [개인정보: 계정·인증정보 숨김]",
        13,
        "책자 p.12 · ID·PW 활용 사례"
    ],
    "ip": [
        "접속 IP",
        "접속 IP 필드 값을 숨깁니다. 개인과 연결되는 로그의 일부로 취급하며 상세 접속기록은 공개 게시판에 재게시하지 않습니다.",
        "접속 IP: [개인정보: 접속 IP 숨김]",
        10,
        "책자 p.9·11 · 자동생성 접속기록·통신정보"
    ],
    "location": [
        "위치정보",
        "현재위치·GPS·위도·경도 등 명시된 필드 값을 제거합니다. 상담 대상 지역 같은 일반 사업 범위는 유지합니다.",
        "현재위치: [개인정보: 위치정보 숨김]",
        12,
        "책자 p.11 · GPS·개인 위치정보"
    ],
    "number": [
        "개인식별·금융번호",
        "종류를 확정하지 못한 긴 개인식별·금융번호도 보수적으로 전체 숨김 처리합니다. 사업 식별번호 등은 오탐 여부를 담당자가 검토해야 합니다.",
        "식별번호: [개인정보: 개인식별·금융번호 숨김]",
        159,
        "책자 p.158 · 주요 식별·금융번호 분류"
    ],
    "protected": [
        "개인정보",
        "원문 전체를 숨긴 값입니다. 실제 원문은 HTML 속성이나 숨겨진 요소에 보관하지 않습니다.",
        "[개인정보: 해당 항목 숨김]",
        27,
        "책자 p.26 · 최소 기재·마스킹·비공개 처리"
    ]
};
    var labels={};Object.keys(help).forEach(function(type){labels[type]=help[type][0];});
    function matches(text) {
        var re=/[가-힣][○]{1,19}|\b[A-Z]\*{3}(?![\w@])|(?:01[016789]|02|\*{3})-\*{4}-\*{4}|\*{3}@\*{3}\.\*{3}|\[개인정보: [^\]\n]+ 숨김\]/g, list=[], match;
        while((match=re.exec(text))!==null) {
            var value=match[0],type=value.indexOf('@')>=0?'email':value.indexOf('-')>=0?'phone':value.indexOf('[개인정보:')===0?'protected':'name';
            if(type==='protected'){var label=value.slice(7,-4);type=Object.keys(help).find(function(key){return help[key][0]===label;}) || (label==='주민·외국인등록번호'?'identity':'protected');}
            list.push({index:match.index,end:re.lastIndex,value:value,type:type});
        }
        return list;
    }
    function marker(item) {
        var button=document.createElement('button');
        button.type='button';button.className='rms-masked-value';button.textContent=item.value;
        button.dataset.privacyType=item.type;
        button.setAttribute('aria-label',labels[item.type]+' 마스킹 '+item.value+' · 적용 기술 보기');
        button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
        button.addEventListener('click',function(event){event.preventDefault();event.stopImmediatePropagation();if(returnFocus===button)close(true);else open(button);});
        return button;
    }
    function close(focus) {
        if(!current) return;
        current.remove();current=null;
        if(returnFocus?.isConnected) {
            returnFocus.setAttribute('aria-expanded','false');returnFocus.removeAttribute('aria-controls');
            if(focus) returnFocus.focus({preventScroll:true});
        }
        returnFocus=null;
    }
    function position(panel,anchor) {
        var r=anchor.getBoundingClientRect?.() || {left:16,bottom:80,top:80};
        var width=Math.min(420,(window.innerWidth || 1280)-32), height=panel.getBoundingClientRect?.().height || 300;
        var left=Math.max(12,Math.min(r.left,(window.innerWidth || 1280)-width-12));
        var top=r.bottom+8;
        if(top+height>(window.innerHeight || 800)-12) top=Math.max(12,r.top-height-8);
        panel.style.setProperty('--rms-privacy-left',left+'px');
        panel.style.setProperty('--rms-privacy-top',top+'px');
    }
    function open(anchor) {
        close(false);
        var type=anchor.dataset.privacyType || 'protected',info=help[type] || help.protected,T=window.RMSTemplates;
        var holder=document.createElement('div');
        holder.innerHTML=T.render('shared/privacy-tooltip',{
            heading:labels[type]+' 마스킹',
            value:anchor.textContent,
            description:info[1],
            example:info[2],
            reference:'downloads/privacy/pipc-homepage-privacy-guide-202404.pdf#page='+info[3],
            referenceText:'홈페이지 개인정보 노출방지 안내서 (2024.04)',
            basis:info[4],
            technology:'RMSPrivacy '+window.RMSPrivacy.version+' · 패턴 탐지·유니코드 정규화·마스킹 / DOMPurify 3.4.16 · HTML 정화',
            source:'static/js/rms-enhance/common/privacy.js'
        });
        current=holder.firstElementChild;returnFocus=anchor;
        (anchor.closest('dialog') || document.body).appendChild(current);
        anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-controls',current.id);
        position(current,anchor);current.focus({preventScroll:true});
    }
    function enhance(container) {
        if(!container) return;
        var textNodes=[];
        function collect(node) {
            if(node.nodeType===3) {if(matches(node.nodeValue || '').length) textNodes.push(node);return;}
            if(node.nodeType!==1) return;
            if(node.matches('input,textarea,script,style,code,pre,[contenteditable],.ql-editor,.rms-privacy-tooltip,.rms-masked-value,[data-privacy-ignore]')) return;
            Array.from(node.childNodes).forEach(collect);
        }
        collect(container);
        textNodes.forEach(function (textNode) {
            if(!textNode.isConnected) return;
            var text=textNode.nodeValue,parts=matches(text),action=textNode.parentElement.closest('button[data-action],a[data-action]');
            if(!parts.length) return;
            var actionTemplate=action?.cloneNode(false);
            if(action) {
                // Split the original action into sibling controls; never nest a button inside a button/link.
                var wrapper=document.createElement('span');
                Array.from(action.attributes).forEach(function (attr) {if(!['type','href','role','tabindex'].includes(attr.name))wrapper.setAttribute(attr.name,attr.value);});
                wrapper.classList.add('rms-annotated-action');
                while(action.firstChild) wrapper.appendChild(action.firstChild);
                action.replaceWith(wrapper);
            }
            var fragment=document.createDocumentFragment(),cursor=0;
            function plain(value) {
                if(!value) return;
                if(actionTemplate && value.trim()) {
                    var button=actionTemplate.cloneNode(false);button.removeAttribute('id');button.dataset.annotationAction='';button.textContent=value;fragment.appendChild(button);
                } else fragment.appendChild(document.createTextNode(value));
            }
            parts.forEach(function (item) {plain(text.slice(cursor,item.index));fragment.appendChild(marker(item));cursor=item.end;});
            plain(text.slice(cursor));textNode.replaceWith(fragment);
        });
    }
    var api={enhance:enhance,open:open,close:close};
    window.RMSPrivacyDisplay=api;
    if(document) {
        document.addEventListener('click',function(event){
            var target=event.target;
            if(target.closest('[data-privacy-dismiss]')) {event.preventDefault();event.stopImmediatePropagation();close(true);return;}
            var button=target.closest('.rms-masked-value');
            if(button) {event.preventDefault();event.stopImmediatePropagation();if(returnFocus===button)close(true);else open(button);return;}
            if(current && !current.contains(target)) close(false);
        },true);
        document.addEventListener('keydown',function(event){if(current && event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
        window.addEventListener('hashchange',function(){close(false);});
        window.addEventListener('resize',function(){close(false);});
    }
}(window));
