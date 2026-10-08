/* @owner publisher | @since RMS-PUB-20261008-01
 * Reusable browser utilities; no data source or endpoint knowledge. */
(function (root) {
    'use strict';
    function download(name, text, type) {
        var blob = new Blob([text], {
            type: type || 'application/json;charset=utf-8'
        }), url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
    root.RMSDom = {
        download: download, formData: function (form) { return Object.fromEntries(new FormData(form).entries()); }
    };
}(window));
