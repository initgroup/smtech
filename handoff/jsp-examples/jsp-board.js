/* INTERNAL STARTER | @since RMS-PUB-20261008-01
 * Server-rendered JSP enhancement; no client seed or business store.
 * Fetches a trusted same-origin JSP fragment whose data is escaped with c:out.
 */
(function () {
    'use strict';
    document.querySelectorAll('[data-jsp-board]').forEach(function (root) {
        var dialog=root.querySelector('dialog'),body=root.querySelector('[data-jsp-detail-body]');
        var error=root.querySelector('[data-jsp-error]'),returnFocus=null,pending=false;
        function close(){dialog.close();if(returnFocus&&returnFocus.isConnected)returnFocus.focus();}
        root.addEventListener('click',async function(event){
            if(event.target.closest('[data-jsp-close]')){close();return;}
            var button=event.target.closest('[data-jsp-detail]');if(!button||pending)return;
            pending=true;button.disabled=true;error.hidden=true;returnFocus=button;
            try{
                var url=new URL(button.dataset.jspDetail,window.location.href);
                if(url.origin!==window.location.origin)throw new Error('잘못된 상세 경로입니다.');
                var response=await fetch(url.href,{credentials:'same-origin',headers:{Accept:'text/html'}});
                if(!response.ok)throw new Error('상세 내용을 불러오지 못했습니다. ('+response.status+')');
                body.innerHTML=await response.text();dialog.showModal();window.RMSLayers.movable(dialog);
            }catch(failure){error.hidden=false;error.textContent=failure.message;}
            finally{pending=false;button.disabled=false;}
        });
        dialog.addEventListener('cancel',function(event){event.preventDefault();close();});
    });
}());
