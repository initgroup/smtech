/* @owner publisher | @since RMS-PUB-20261008-01
 * Shared UI components. No store/DOM/network. HTML is in templates/shared/.
 * table headers/rows accept already-escaped presenter fragments, never raw server text.
 */
(function(root){
    'use strict';
    var T=root.RMSTemplates;
    function badge(text){
        var color=/완료|가능|접수중|모집중/.test(text)?'green':/실패/.test(text)?'red':/보완|대기|현행화/.test(text)?'orange':/미제출|중지/.test(text)?'gray':'';
        return T.render('shared/badge',{color:color,text:text});
    }
    function button(text,action,id,style){
        return T.render('shared/button',{text:text,action:action,id:id||'',classes:style||''});
    }
    function field(label,name,value,type,extra){
        return T.render('shared/field',{label:label,name:name,value:value==null?'':value,type:type||'text',classes:extra||''});
    }
    function select(label,name,options,value,extra){
        var items=options.map(function(option){return T.render('shared/option',{id:option.id,name:option.name,selected:option.id===value?' selected':''});}).join('');
        return T.render('shared/select',{label:label,name:name,classes:extra||'',optionsHtml:items});
    }
    function table(caption,headers,rows,compact){
        var cells=headers.map(function(header){return T.render('shared/table-heading',{contentHtml:header});}).join('');
        return T.render('shared/table',{caption:caption,classes:compact?'rms-compact':'',headingsHtml:cells,rowsHtml:rows.join('')});
    }
    function empty(message){return T.render('shared/empty',{message:message});}
    root.RMSComponents={esc:T.escape,badge:badge,btn:button,field:field,select:select,table:table,empty:empty};
}(window));
