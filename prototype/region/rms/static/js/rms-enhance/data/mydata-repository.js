/* @owner publisher | @since RMS-PUB-20261008-01
 * XML parser and in-memory receipt repository. No DOM or HTML rendering.
 * Receipt metadata is supplied by the selected adapter; no embedded sample paths. */
(function (root, factory) {
    'use strict';
    var api = factory();
    if (typeof module === 'object' && module.exports)
        module.exports = api;
    else
        root.RMSMydata = api;
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';
    var manifest = [];
    function setManifest(values) { manifest.splice.apply(manifest, [0, manifest.length].concat(clone(values))); }
    var specs = {
        F01: {
            name: '사업자등록증명서', prefix: '사업자등록증명', provider: '국세청'
        },
        F02: {
            name: '폐업사실증명서', prefix: '폐업사실증명', provider: '국세청'
        },
        F03: {
            name: '휴업사실증명서', prefix: '휴업사실증명', provider: '국세청'
        },
        F04: {
            name: '표준재무제표증명서', prefix: '표준재무제표증명', provider: '국세청'
        },
        F05: {
            name: '국세 납세증명서', prefix: '국세_납세증명서', provider: '국세청'
        },
        F06: {
            name: '지방세 납세증명서', prefix: '지방세납세증명서', provider: '지방자치단체'
        },
        F07: {
            name: '부가가치세 과세표준증명', prefix: '부가가치세', provider: '국세청'
        },
        F08: {
            name: '중소기업확인서', prefix: '중소기업확인서', provider: '중소벤처기업부'
        },
        F09: {
            name: '4대 사회보험료 완납 증명서', prefix: '사대사회보험료완납증명서', provider: '국민건강보험공단'
        }
    };
    var bundles = [], loading = null;
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function entities(text) {
        if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/.test(text))
            throw new Error('XML 엔티티 형식이 올바르지 않습니다.');
        return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);/g, function (_, v) {
            if (v[0] === '#') {
                var code = v[1] === 'x' ? parseInt(v.slice(2), 16) : parseInt(v.slice(1), 10);
                if (!Number.isSafeInteger(code) || code < 1 || code > 0x10ffff)
                    throw new Error('XML 문자 코드 오류');
                return String.fromCodePoint(code);
            }
            return {
                amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"
            }[v];
        });
    }
    // Preserve order, empty leaves and repeated records. Never resolve DTDs or external entities.
    function parseTree(xml) {
        if (typeof xml !== 'string' || xml.length > 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml))
            throw new Error('지원하지 않는 XML 수신 형식입니다.');
        var holder = {
            name: '', children: [], text: ''
        }, stack = [holder], position = 0;
        var tokens = xml.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[^>]+>|[^<]+/g);
        for (var match of tokens) {
            if (match.index !== position)
                throw new Error('XML 구문 오류');
            position = match.index + match[0].length;
            var token = match[0], current = stack[stack.length - 1];
            if (token.startsWith('<!--') || token.startsWith('<?'))
                continue;
            if (token.startsWith('<![CDATA[')) {
                current.text += token.slice(9, -3);
                continue;
            }
            if (token[0] !== '<') {
                current.text += entities(token);
                continue;
            }
            if (token.startsWith('</')) {
                var endName = token.slice(2, -1).trim();
                if (stack.length === 1 || current.name !== endName)
                    throw new Error('XML 닫는 태그가 일치하지 않습니다: ' + endName);
                stack.pop();
                continue;
            }
            var selfClosing = /\/>$/.test(token), inside = token.slice(1, selfClosing ? -2 : -1).trim();
            var name = inside.split(/\s/)[0];
            if (!/^[A-Za-z_\u0080-\uFFFF][A-Za-z0-9_.:\-\u0080-\uFFFF]*$/.test(name) || name[0] === '!')
                throw new Error('XML 태그 형식 오류');
            var node = {
                name: name, children: [], text: ''
            };
            current.children.push(node);
            if (!selfClosing) {
                stack.push(node);
                if (stack.length > 50)
                    throw new Error('XML 계층이 너무 깊습니다.');
            }
        }
        if (position !== xml.length || stack.length !== 1 || holder.children.length !== 1 || holder.text.trim())
            throw new Error('XML 문서가 완전하지 않습니다.');
        return holder.children[0];
    }
    function child(node, name) { return node && node.children.find(function (n) { return n.name === name; }); }
    function flatten(node) {
        var result = [];
        function visit(n, parts) {
            if (!n.children.length) {
                result.push({
                    tag: n.name, value: n.text.trim(), group: parts.join(' › ') || '기본정보', path: parts.concat(n.name).join('/')
                });
                return;
            }
            var counts = {}, seen = {};
            n.children.forEach(function (c) { counts[c.name] = (counts[c.name] || 0) + 1; });
            n.children.forEach(function (c) {
                seen[c.name] = (seen[c.name] || 0) + 1;
                var segment = c.name + (counts[c.name] > 1 ? '[' + seen[c.name] + ']' : '');
                if (!c.children.length) {
                    result.push({
                        tag: c.name, value: c.text.trim(), group: parts.join(' › ') || '기본정보', path: parts.concat(segment).join('/')
                    });
                }
                else
                    visit(c, parts.concat(segment));
            });
        }
        if (node)
            visit(node, []);
        return result;
    }
    function first(fields, names) {
        for (var i = 0; i < names.length; i++) {
            var row = fields.find(function (f) { return f.tag === names[i] && f.value !== ''; });
            if (row)
                return row.value;
        }
        return '';
    }
    function providerFor(name, fields) {
        var spec = Object.keys(specs).map(function (id) { return specs[id]; }).find(function (s) { return name.indexOf(s.prefix) === 0; });
        return first(fields, ['확인기관명', '발급세무서', '발급세무서명']) || (spec ? spec.provider : '샘플 제공기관 미기재');
    }
    function companyFrom(documents) {
        var doc = documents.find(function (d) { return d.code.indexOf('사업자등록증명') === 0; }), f = doc ? doc.fieldsDetailed : [];
        return {
            companyName: first(f, ['상호-법인명', '기업명', '상호', '업체명']), representative: first(f, ['성명-대표자', '대표자명', '대표자', '성명']), address: first(f, ['사업장소재지', '소재지', '주소']), businessNumber: first(f, ['사업자등록번호-발급', '사업자등록번호', '입력사업자등록번호'])
        };
    }
    function transactionTime(value) {
        return /^\d{14}/.test(value || '') ? value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8) + ' ' + value.slice(8, 10) + ':' + value.slice(10, 12) + ':' + value.slice(12, 14) : '';
    }
    function parseXml(xml, metadata) {
        var meta = typeof metadata === 'string' ? manifest.find(function (m) { return m.id === metadata; }) : metadata;
        if (!meta || !meta.id)
            throw new Error('수신 묶음 식별자가 없습니다.');
        var tree = parseTree(xml), headerNode = child(child(tree, 'Header'), 'commonHeader'), response = child(child(tree, 'Body'), 'response');
        if (tree.name !== 'Envelope' || !headerNode || !response)
            throw new Error('Envelope 수신 구조가 올바르지 않습니다.');
        var header = {};
        flatten(headerNode).forEach(function (f) { header[f.tag] = f.value; });
        var payload = response.children.find(function (n) { return n.name !== '비고'; });
        if (!payload)
            throw new Error('묶음 응답 본문이 없습니다.');
        var documents = payload.children.map(function (n) {
            var fields = flatten(n), populated = fields.filter(function (f) { return f.value !== ''; }).length;
            var code = first(fields, ['처리결과코드', '결과코드', '오류코드']);
            var message = first(fields, ['처리결과메시지', '처리결과메세지', '처리결과내용', '결과메시지', '오류메시지']);
            return {
                code: n.name, name: n.name.replace(/-기업용$/, '').replace(/_/g, ' '), provider: providerFor(n.name, fields), fields: fields.map(function (f) { return [f.tag, f.value]; }), fieldsDetailed: fields, fieldCount: fields.length, populatedCount: populated, emptyCount: fields.length - populated, resultCode: code, resultMessage: message || (code ? '처리결과코드 ' + code + ' (원문값)' : populated ? '수신정보 확인' : '수신값 없음')
            };
        });
        var bundle = Object.assign({}, meta, {
            header: header, payloadName: payload.name, transactionAt: transactionTime(header.transactionUniqueId), processingResult: first(flatten(child(response, '비고')), ['원장처리결과']), documents: documents, xml: xml
        });
        bundle.fieldCount = documents.reduce(function (n, d) { return n + d.fieldCount; }, 0);
        bundle.populatedCount = documents.reduce(function (n, d) { return n + d.populatedCount; }, 0);
        bundle.emptyCount = bundle.fieldCount - bundle.populatedCount;
        bundle.company = companyFrom(documents);
        return bundle;
    }
    function setBundles(values) {
        if (!Array.isArray(values) || values.some(function (b) { return !b || !b.id || !Array.isArray(b.documents); }))
            throw new Error('수신 묶음 자료 형식 오류');
        bundles = clone(values);
        setManifest(values.map(function (b) { var m = Object.assign({}, b); delete m.xml; delete m.documents; return m; }));
        return bundles;
    }
    function load(options) {
        if (loading)
            return loading;
        var opts = options || {}, fetcher = opts.fetch || (typeof fetch === 'function' ? fetch : null);
        if (!fetcher)
            return Promise.reject(new Error('XML을 읽을 수 있는 fetch가 없습니다.'));
        loading = Promise.all(manifest.map(function (meta) {
            return fetcher((opts.baseUrl || '') + meta.xmlPath).then(function (res) {
                if (res.ok === false)
                    throw new Error(meta.label + ' 수신 XML을 읽지 못했습니다.');
                return res.text();
            }).then(function (xml) { return parseXml(xml, meta); });
        })).then(function (values) { return setBundles(values); }).catch(function (error) {
            loading = null;
            throw error;
        });
        return loading;
    }
    function getBundle(id) { return bundles.find(function (b) { return b.id === id; }) || null; }
    function companyInfo(id) {
        var bundle = getBundle(id);
        return clone(bundle ? bundle.company : {
            companyName: '', representative: '', address: '', businessNumber: ''
        });
    }
    function mapDocument(specId, bundleId) {
        var bundle = getBundle(bundleId), spec = specs[specId], doc = bundle && spec && bundle.documents.find(function (d) { return d.code.indexOf(spec.prefix) === 0; });
        if (!doc)
            return {
                available: false, bundleId: bundleId, documentCode: '', documentName: spec ? spec.name : String(specId), provider: spec ? spec.provider : '', resultCode: '', resultMessage: '선택한 수신 묶음에 해당 서류가 없습니다.', fields: [], fieldsDetailed: [], fieldCount: 0, populatedCount: 0, emptyCount: 0, company: companyInfo(bundleId)
            };
        return Object.assign({
            available: true, bundleId: bundleId, documentCode: doc.code, documentName: doc.name, company: companyInfo(bundleId)
        }, clone(doc));
    }
    return {
        manifest: manifest, setManifest: setManifest, specs: specs, load: load, setBundles: setBundles, parseXml: parseXml, getBundle: getBundle, mapDocument: mapDocument, companyInfo: companyInfo
    };
}));
