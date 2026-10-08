/* @owner publisher | @since RMS-PUB-20261008-01
 * HTML sources: /templates. Escaped {{value}}; trusted presenter markup {{{slot}}}.
 * No eval, Function constructor, network or business data in the template runtime.
 */
(function (root) {
    'use strict';
    function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]; }); }
    function render(name, values) {
        var template = root.RMSTemplateSources[name];
        if (typeof template !== 'string')
            throw new Error('HTML 템플릿이 없습니다: ' + name);
        values = values || {};
        return template.replace(/\{\{\{([A-Za-z]\w*)\}\}\}|\{\{([A-Za-z]\w*)\}\}/g, function (_, htmlKey, textKey) {
            var key = htmlKey || textKey;
            if (!Object.prototype.hasOwnProperty.call(values, key))
                throw new Error('템플릿 값이 없습니다: ' + name + '.' + key);
            return htmlKey ? String(values[key] == null ? '' : values[key]) : escape(values[key]);
        });
    }
    root.RMSTemplates = {
        render: render, escape: escape
    };
}(window));
