/* @owner publisher | @since RMS-PUB-20261008-01
 * Receipt presenter and report interactions. HTML: templates/reports/.
 * Backend supplies parsed receipt bundles through the repository API. */
(function (root) {
    'use strict';
    var api = root.RMSMydata, T = root.RMSTemplates, esc = T.escape, manifest = api.manifest, specs = api.specs, getBundle = api.getBundle, mapDocument = api.mapDocument;
    function button(label, attribute, value, pressed) {
        return T.render("reports/button", {
            attribute: attribute, value: value, value2: (typeof pressed === 'boolean' ? ' aria-pressed="' + pressed + '"' : ''), label: label
        });
    }
    function renderIndex(selected) {
        return T.render("reports/render-index", {
            itemsHtml: manifest.map(function (meta) {
                var bundle = getBundle(meta.id);
                return T.render("reports/render-index-2", {
                    id: meta.id, value: (selected === meta.id), audience: meta.audience, purpose: meta.purpose, value2: (bundle ? bundle.documents.length + '개 문서 · ' + bundle.populatedCount + '개 수신값' : '파일 준비 중')
                });
            }).join('')
        });
    }
    function kv(label, value) { return T.render("reports/kv", {
        label: label, value: value || '미기재'
    }); }
    function status(doc) { return T.render("reports/status", {
        value: (!doc.populatedCount ? ' is-empty' : ''), value2: (doc.populatedCount ? '정보 수신' : '값 없는 서식')
    }); }
    function renderSummary(bundle) {
        var company = bundle.company;
        return T.render("reports/render-summary", {
            length: bundle.documents.length, populatedCount: bundle.populatedCount, emptyCount: bundle.emptyCount, fieldCount: bundle.fieldCount, roundHtml: Math.round(bundle.populatedCount / Math.max(bundle.fieldCount, 1) * 100), kvHtml: kv('기업명 · 사업자등록증명 기준', company.companyName), kvHtml2: kv('대표자', company.representative), kvHtml3: kv('사업자등록번호', company.businessNumber), kvHtml4: kv('사업장 소재지', company.address), itemsHtml: bundle.documents.map(function (doc, i) { return T.render("reports/render-summary-2", {
                code: doc.code, padStartHtml: String(i + 1).padStart(2, '0'), name: doc.name, provider: doc.provider, statusHtml: status(doc), populatedCount: doc.populatedCount, fieldCount: doc.fieldCount
            }); }).join(''), itemsHtml2: Object.keys(specs).map(function (id) {
                var mapped = mapDocument(id, bundle.id);
                return T.render("reports/render-summary-3", {
                    name: specs[id].name, value: (!mapped.available ? 'is-missing' : ''), value2: (!mapped.available ? '묶음에 없음' : mapped.populatedCount ? '수신값 ' + mapped.populatedCount + '개' : '값 없음')
                });
            }).join('')
        });
    }
    function renderFields(doc, query) {
        var q = (query || '').trim().toLocaleLowerCase(), groups = [];
        doc.fieldsDetailed.forEach(function (field) {
            if (q && [field.tag, field.value, field.path].join(' ').toLocaleLowerCase().indexOf(q) < 0)
                return;
            var group = groups.find(function (g) { return g.name === field.group; });
            if (!group) {
                group = {
                    name: field.group, fields: []
                };
                groups.push(group);
            }
            group.fields.push(field);
        });
        if (!groups.length)
            return T.render("reports/render-fields", {});
        return groups.map(function (group) { return T.render("reports/render-fields-2", {
            name: group.name, itemsHtml: group.fields.map(function (f) { return T.render("reports/render-fields-3", {
                value: (!f.value ? ' class="is-empty"' : ''), tag: f.tag, value2: f.value || '수신값 없음'
            }); }).join('')
        }); }).join('');
    }
    function renderDocuments(bundle, documentCode, query) {
        var doc = bundle.documents.find(function (d) { return d.code === documentCode; }) || bundle.documents[0];
        if (!doc)
            return T.render("reports/render-documents", {});
        return T.render("reports/render-documents-2", {
            itemsHtml: bundle.documents.map(function (d, i) { return T.render("reports/render-documents-3", {
                code: d.code, value: (d.code === doc.code), padStartHtml: String(i + 1).padStart(2, '0'), name: d.name, populatedCount: d.populatedCount, fieldCount: d.fieldCount
            }); }).join(''), provider: doc.provider, name: doc.name, statusHtml: status(doc), fieldCount: doc.fieldCount, populatedCount: doc.populatedCount, emptyCount: doc.emptyCount, value: (doc.resultCode ? T.render("reports/render-documents-4", {
                resultCode: doc.resultCode
            }) : ''), value2: query || '', renderFieldsHtml: renderFields(doc, query)
        });
    }
    function renderReport(bundleId, documentCode, state) {
        var bundle = getBundle(bundleId) || getBundle(manifest[0] && manifest[0].id);
        if (!bundle)
            return T.render("reports/render-report", {});
        var view = state && state.tab || (documentCode ? 'documents' : 'summary'), query = state && state.query || '';
        var tabs = [['summary', '수신 요약'], ['documents', '문서별 상세'], ['xml', 'XML 원문']];
        return T.render("reports/render-report-2", {
            id: bundle.id, renderIndexHtml: renderIndex(bundle.id), label: bundle.label, fileName: bundle.fileName, kvHtml: kv('서비스 ID', bundle.header.serviceId), kvHtml2: kv('거래 ID', bundle.header.transactionUniqueId), kvHtml3: kv('거래 식별시각', bundle.transactionAt), kvHtml4: kv('정보제공 동의', bundle.header.agreementYn === 'Y' ? 'Y · 동의' : bundle.header.agreementYn), kvHtml5: kv('원장 처리결과', bundle.processingResult), itemsHtml: tabs.map(function (tab) { return button(tab[1], 'data-report-tab', tab[0], view === tab[0]); }).join(''), id2: bundle.id, value: (view === 'xml' ? T.render("reports/render-report-3", {
                originalPath: bundle.originalPath, xml: bundle.xml
            }) : view === 'documents' ? renderDocuments(bundle, documentCode, query) : renderSummary(bundle))
        });
    }
    function mount(element, bundleId, documentCode) {
        if (!element)
            throw new Error('수신 보고서 표시 영역이 없습니다.');
        var bundle = getBundle(bundleId) || getBundle(manifest[0] && manifest[0].id), state = {
            bundleId: bundle ? bundle.id : bundleId, documentCode: documentCode || '', tab: documentCode ? 'documents' : 'summary', query: ''
        };
        if (element._rmsReportCleanup)
            element._rmsReportCleanup();
        function draw(focusSelector) {
            element.innerHTML = renderReport(state.bundleId, state.documentCode, state);
            var focus = focusSelector && element.querySelector(focusSelector);
            if (focus)
                focus.focus({
                    preventScroll: true
                });
        }
        function click(ev) {
            var control = ev.target.closest('[data-report-bundle],[data-report-tab],[data-report-document],[data-report-download]');
            if (!control || !element.contains(control))
                return;
            ev.preventDefault();
            ev.stopPropagation();
            if (control.hasAttribute('data-report-download')) {
                var current = getBundle(control.dataset.reportDownload);
                if (!current)
                    return;
                root.RMSDom.download(current.id+'.xml',current.xml,'application/xml;charset=utf-8');
                return;
            }
            if (control.hasAttribute('data-report-bundle')) {
                state.bundleId = control.dataset.reportBundle;
                state.documentCode = '';
                state.query = '';
            }
            if (control.hasAttribute('data-report-tab')) {
                state.tab = control.dataset.reportTab;
                state.query = '';
            }
            if (control.hasAttribute('data-report-document')) {
                state.documentCode = control.dataset.reportDocument;
                state.tab = 'documents';
                state.query = '';
            }
            var attr = control.hasAttribute('data-report-bundle') ? 'data-report-bundle' : control.hasAttribute('data-report-tab') ? 'data-report-tab' : 'data-report-document';
            var value = control.getAttribute(attr);
            draw();
            var next = Array.from(element.querySelectorAll('[' + attr + ']')).find(function (c) { return c.getAttribute(attr) === value; });
            if (next)
                next.focus({
                    preventScroll: true
                });
        }
        function input(ev) {
            if (!ev.target.hasAttribute('data-report-query'))
                return;
            state.query = ev.target.value;
            var current = getBundle(state.bundleId), doc = current && current.documents.find(function (d) { return d.code === state.documentCode; }) || current && current.documents[0];
            if (doc)
                element.querySelector('[data-report-fields]').innerHTML = renderFields(doc, state.query);
        }
        element.addEventListener('click', click);
        element.addEventListener('input', input);
        element._rmsReportCleanup = function () {
            element.removeEventListener('click', click);
            element.removeEventListener('input', input);
        };
        draw();
        return element._rmsReportCleanup;
    }
    Object.assign(api, {
        renderIndex: renderIndex, renderReport: renderReport, mount: mount
    });
}(window));
