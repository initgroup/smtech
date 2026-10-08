/* @owner publisher | @since RMS-PUB-20261008-01
 * Transport-neutral store facade. URLs/CSRF/auth mappings belong to integration/.
 * A command installs the returned authorized snapshot only after validation.
 * No mock state, localStorage, optimistic writes or automatic POST retries.
 */
(function (root) {
    'use strict';
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function validate(snapshot) {
        if (!snapshot || snapshot.contractVersion !== 1 || !snapshot.state || !snapshot.session)
            throw new Error('서버 응답 계약 버전을 확인해 주세요.');
        ['classifications', 'doctors', 'users', 'programs', 'applications', 'matches', 'faqs', 'questions', 'documentTypes'].forEach(function (key) { if (!Array.isArray(snapshot.state[key]))
            throw new Error('서버 목록 형식 오류: ' + key); });
        if (!snapshot.state.settings || !snapshot.state.boards || !Array.isArray(snapshot.state.boards.notice) || !Array.isArray(snapshot.state.boards.resources) || !snapshot.state.demoDate)
            throw new Error('서버 화면 자료가 누락되었습니다.');
        if (!['visitor', 'company', 'tp', 'admin'].includes(snapshot.session.role))
            throw new Error('서버 사용자 역할 오류');
        if (snapshot.receipts !== undefined && (!Array.isArray(snapshot.receipts) || snapshot.receipts.some(function (b) { return !b || !b.id || !Array.isArray(b.documents); })))
            throw new Error('서버 수신자료 형식 오류');
        return clone(snapshot);
    }
    function create(options) {
        options = options || {};
        var current = null, inFlight = false;
        if (typeof options.request !== 'function')
            throw new Error('내부 개발자 request 어댑터가 필요합니다.');
        function accept(data) {
            var next = validate(data);
            if (root.RMSMydata) {
                root.RMSMydata.setBundles(next.receipts || []);
                root.RMSMydata.manifest.splice.apply(root.RMSMydata.manifest, [0, root.RMSMydata.manifest.length].concat((next.receipts || []).map(function (b) { return {
                    id: b.id, label: b.label, audience: b.audience, purpose: b.purpose
                }; })));
            }
            current = next;
            return data.result;
        }
        var queries = root.RMSQueries.create(function () {
            if (!current)
                throw new Error('서버 자료를 불러오는 중입니다.');
            return current;
        });
        var store = Object.assign({
            mode: 'server', loadWarning: '', connectionWarning: '', setRole: function () { throw new Error('사용자 역할은 서버 인증으로 결정합니다.'); }
        }, queries);
        Object.keys(root.RMSCommands).forEach(function (command) {
            store[command] = function () {
                if (inFlight)
                    return Promise.reject(new Error('이전 요청을 처리하는 중입니다.'));
                var args = arguments, payload = {};
                root.RMSCommands[command].forEach(function (key, index) { payload[key] = args[index]; });
                inFlight = true;
                return Promise.resolve().then(function () { return options.request(command, payload); }).then(accept).finally(function () { inFlight = false; });
            };
        });
        return {
            open: async function () {
                accept(await options.request('bootstrap', {}));
                return store;
            }
        };
    }
    // Optional same-origin JSON/multipart transport. Mapping is supplied by the intranet team.
    function transport(options) {
        return async function (command, payload) {
            var route = options.routes[command];
            if (!route)
                throw new Error('서버 경로 미설정: ' + command);
            var url = new URL(route, root.location.href);
            if (url.origin !== root.location.origin)
                throw new Error('같은 출처의 서버 경로만 사용하세요.');
            var headers = Object.assign({
                Accept: 'application/json'
            }, typeof options.headers === 'function' ? options.headers() : options.headers || {});
            var init = {
                method: command === 'bootstrap' ? 'GET' : 'POST', credentials: 'same-origin', headers: headers
            };
            if (command === 'attachFile') {
                var form = new FormData();
                Object.keys(payload).forEach(function (key) { form.append(key, payload[key]); });
                init.body = form;
            }
            else if (command !== 'bootstrap') {
                headers['Content-Type'] = 'application/json;charset=UTF-8';
                init.body = JSON.stringify(payload);
            }
            var response = await (options.fetch || fetch)(url.href, init);
            if (!response.ok)
                throw new Error(response.status === 401 ? '로그인이 필요합니다.' : response.status === 403 ? '이 작업의 권한이 없습니다.' : '서버 요청 실패 (' + response.status + ')');
            var body = await response.json();
            if (body.error)
                throw new Error(body.error.message || '서버에서 요청을 처리하지 못했습니다.');
            return options.decode ? options.decode(body, command) : body;
        };
    }
    root.RMSHttpAdapter = {
        create: create, transport: transport, validate: validate
    };
}(window));
