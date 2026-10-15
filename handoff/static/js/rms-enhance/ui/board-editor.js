/* @owner publisher | Quill BSD-3-Clause editor, bundled locally. */
(function (root) {
    'use strict';
    var editors = new WeakMap();
    function mount(form, initial) {
        var target = form.querySelector('[data-board-editor]'), fallback = form.querySelector('[name=body]');
        fallback.value = initial && initial.body || '';
        if (!root.Quill || !target) return;
        try {
            var editor = new root.Quill(target,{theme:'snow',formats:['bold','italic','underline','strike','header','list','blockquote','code-block'],modules:{toolbar:[[{header:[2,3,false]}],['bold','italic','underline','strike'],[{list:'ordered'},{list:'bullet'}],['blockquote','code-block'],['clean']]},placeholder:'개인정보를 제외한 문의 내용을 입력해 주세요.'});
            editor.root.setAttribute('aria-label','게시글 내용');
            editor.root.setAttribute('role','textbox');
            editor.root.setAttribute('aria-multiline','true');
            editor.root.setAttribute('data-requirement-key','qna-editor');
            if (initial && initial.bodyHtml && root.DOMPurify?.isSupported) editor.clipboard.dangerouslyPasteHTML(root.RMSBoardSecurity.prepare(initial).bodyHtml);
            else editor.setText(fallback.value);
            fallback.hidden = true;
            fallback.required = false;
            editors.set(form,editor);
        } catch (error) {
            target.hidden = true;
            form.querySelector('.ql-toolbar')?.remove();
            fallback.hidden = false;
        }
    }
    function read(form) {
        var editor = editors.get(form);
        return root.RMSBoardSecurity.prepare({title:form.querySelector('[name=title]')?.value || '',body:editor ? editor.getText() : form.querySelector('[name=body]').value,bodyHtml:editor ? editor.getSemanticHTML() : ''});
    }
    function preview(form) {
        var safe = read(form), target = form.querySelector('[data-board-preview]');
        target.hidden = false;
        target.replaceChildren();
        var heading = root.document.createElement('strong'), content = root.document.createElement('p');
        heading.textContent = safe.privacyDetected ? '개인정보 의심 패턴 ' + safe.privacyCount + '건을 마스킹했습니다.' : '검사 완료 · 아래 내용으로 저장합니다.';
        content.textContent = (safe.title ? safe.title + '\n\n' : '') + safe.body;
        target.append(heading,content);
        root.RMSPrivacyDisplay?.enhance(target);
        return safe;
    }
    root.RMSBoardEditor = {mount:mount,read:read,preview:preview};
}(window));
