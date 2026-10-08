/* @owner publisher | @since RMS-PUB-20261008-01
 * Only numeric CSS geometry variables are set here. All visual rules live in CSS.
 * movable() may be called again on a reused JSP dialog; previous listeners are removed.
 */
(function (root) {
    'use strict';
    function position(element, box) {
        element.classList.add('rms-layer-positioned');
        ['left', 'top', 'width', 'height'].forEach(function (key) {
            if (Number.isFinite(box[key])) element.style.setProperty('--rms-layer-' + key, box[key] + 'px');
        });
    }
    function dispose(element) {
        if (element._rmsLayerCleanup) element._rmsLayerCleanup();
    }
    function movable(dialog) {
        dispose(dialog);
        var handle=dialog.querySelector('[data-dialog-move]'),drag=null,listeners=[];
        if (!handle) return;
        function listen(target, type, callback) {
            target.addEventListener(type,callback);
            listeners.push(function(){target.removeEventListener(type,callback);});
        }
        function rect() {
            var box=dialog.getBoundingClientRect();
            return {
                left:parseFloat(dialog.style.getPropertyValue('--rms-layer-left'))||box.left||8,
                top:parseFloat(dialog.style.getPropertyValue('--rms-layer-top'))||box.top||8,
                width:box.width||Math.min(1180,(root.innerWidth||1024)-16),
                height:box.height||Math.min(650,(root.innerHeight||768)-16)
            };
        }
        function place(x,y) {
            var box=rect(),width=root.innerWidth||1024,height=root.innerHeight||768;
            position(dialog,{left:Math.max(8,Math.min(x,width-box.width-8)),top:Math.max(8,Math.min(y,height-box.height-8))});
        }
        listen(handle,'pointerdown',function(event){
            if(event.button!==0)return;
            event.preventDefault();handle.focus();var box=rect();
            drag={x:event.clientX,y:event.clientY,left:box.left,top:box.top,id:event.pointerId};
            if(handle.setPointerCapture)handle.setPointerCapture(event.pointerId);
        });
        listen(handle,'pointermove',function(event){
            if(drag&&drag.id===event.pointerId)place(drag.left+event.clientX-drag.x,drag.top+event.clientY-drag.y);
        });
        ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){listen(handle,type,function(){drag=null;});});
        listen(handle,'keydown',function(event){
            var delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[event.key];
            if(delta){event.preventDefault();var box=rect();place(box.left+delta[0],box.top+delta[1]);}
        });
        function resize(){
            if(!dialog.isConnected){dispose(dialog);return;}
            if(dialog.style.getPropertyValue('--rms-layer-left')){var box=rect();place(box.left,box.top);}
        }
        dialog._rmsLayerCleanup=function(){listeners.forEach(function(remove){remove();});listeners=[];drag=null;dialog._rmsLayerCleanup=null;};
        listen(root,'resize',resize);
        listen(dialog,'close',function(){dispose(dialog);});
        resize();
    }
    root.RMSLayers={position:position,movable:movable,dispose:dispose};
}(window));
