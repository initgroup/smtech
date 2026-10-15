/* @owner publisher | Board privacy boundary. Authorization belongs to the server. */
(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) module.exports = factory(globalThis, require('./privacy.js'));
    else root.RMSBoardSecurity = factory(root, root.RMSPrivacy);
}(typeof window !== 'undefined' ? window : this, function (root, privacy) {
    'use strict';
    function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function inspect(value, options) {
        if (!privacy) throw new Error('개인정보 보호 모듈을 불러오지 못했습니다. 게시물 처리를 중단합니다.');
        return privacy.inspect(String(value || ''), options);
    }
    function prepare(input) {
        input = input || {};
        if (String(input.bodyHtml || '').length > 100000) throw new Error('게시글 HTML이 허용 길이를 초과했습니다.');
        var title = inspect(input.title), html = '', text = String(input.body || ''), result;
        if (input.bodyHtml && root.document && root.DOMPurify && root.DOMPurify.isSupported) {
            html = root.DOMPurify.sanitize(String(input.bodyHtml), {ALLOWED_TAGS:['p','br','strong','em','u','s','blockquote','ol','ul','li','h2','h3','pre','code'], ALLOWED_ATTR:[], ALLOW_DATA_ATTR:false, ALLOW_ARIA_ATTR:false});
            var box = root.document.createElement('div');
            box.innerHTML = html;
            // Joined text catches numbers split by markup. Context fields use layout-aware text
            // so adjacent redacted fields do not become one false-positive field value.
            var joined = inspect(box.textContent, {patternsOnly:true});
            box.querySelectorAll('p,li,h2,h3,blockquote,pre,br').forEach(function (node) { node.appendChild(root.document.createTextNode('\n')); });
            text = box.textContent;
            result = inspect(text);
            if (joined.detected) {
                // Union of layout-aware and joined-text detections. Mask layout fields first;
                // then join lines and scan again so neither view can restore the other's PII.
                var combined = inspect(result.text.replace(/\n/g,''), {patternsOnly:true});
                result = {text:combined.text,masked:combined.text,detected:true,count:Math.max(joined.count,result.count+combined.count),types:Array.from(new Set(joined.types.concat(result.types,combined.types)))};
            }
            if (result.detected || joined.detected) html = '';
        } else result = inspect(text);
        var masked = result.masked === undefined ? result.text : result.masked;
        return {title: title.masked === undefined ? title.text : title.masked, body: masked.trim(), bodyHtml: html || '<p>' + esc(masked.trim()).replace(/\n/g,'<br>') + '</p>', privacyDetected: title.detected || result.detected, privacyTypes: Array.from(new Set(title.types.concat(result.types))), privacyCount: title.count + result.count};
    }
    function publicReply(reply) {
        var safe = prepare({body:reply.body,bodyHtml:reply.bodyHtml});
        return {id:reply.id,kind:reply.kind,official:reply.official === true,date:reply.date,body:safe.body,bodyHtml:safe.bodyHtml,authorLabel:reply.official ? '담당자' : reply.ownerKind === 'guest' ? '비회원' : '회원',ownerKind:reply.ownerKind,canManage:reply.canManage === true};
    }
    function publicQuestion(q) {
        var safe = prepare({title:q.title,body:q.body || q.content || q.title,bodyHtml:q.bodyHtml});
        return {id:q.id,title:safe.title,body:safe.body,bodyHtml:safe.bodyHtml,date:q.date,answeredAt:q.answeredAt || '',work:q.work,status:q.status,public:q.public === true,mainVisible:q.mainVisible === true,answer:inspect(q.answer).text,replies:(q.replies || []).map(publicReply),ownerKind:q.ownerKind,canManage:q.canManage === true,privacyDetected:safe.privacyDetected || inspect(q.answer).detected || (q.replies || []).some(function (r) { return prepare(r).privacyDetected; }) || q.privacyDetected === true};
    }
    return {prepare:prepare,mask:function (value) { return inspect(value).text; },publicQuestion:publicQuestion,publicReply:publicReply,escape:esc};
}));
