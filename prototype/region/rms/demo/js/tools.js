/* DEMO ONLY — toolbar, SFR, role simulation, JSON transfer. Excluded from developer ZIP. */
(function (window) {
    'use strict';
    if (!window.RMSIntegration)
        window.RMSIntegration = { mode: 'demo', adapter: window.RMSDemoAdapter };
    window.RMSHostExtension = { connect: function (context) {
            var root = context.root, host = context.host, store = context.store, views = context.views, ui = context.ui, modal = context.modal, closeModal = context.closeModal, render = context.render, toast = context.toast, showError = context.showError, commit = context.commit, go = context.go, route = context.route, eventClick = context.eventClick;
            if (store.mode !== 'demo') {
                document.getElementById('rms-demo-tools')?.remove();
                return {};
            }
            var T = window.RMSTemplates, V = Object.assign({}, window.RMSViews, window.RMSDemoViews), e = V.esc, b = V.btn, download = window.RMSDom.download, guideViews = window.RMSDemoViews.create(views);
            var release=(window.RMSReleaseHistory||{}).releases?.[0];
            if(release&&!release.legacy){
                document.getElementById('rms-release-history').textContent='배포내역 · v'+release.version;
                var sourceLink=document.getElementById('rms-source-download');
                sourceLink.textContent='개발자 소스 · v'+release.version+' ZIP';
                sourceLink.setAttribute('download','rms-developer-v'+release.version+'.zip');
            }
            var sfrUI = window.RMSSfrLayer.create({
                onAction: eventClick
            });
            function openSfrLayer(id) { sfrUI.open(id); }
            function closeSfrLayer() { sfrUI.close(); }
            function repositionSfrLayer() { sfrUI.reposition(); }
            function navigateSfr(key) {
                var menu = V.sfrDestination(key);
                if (!menu)
                    throw new Error('SFR 메뉴 연결을 찾을 수 없습니다.');
                if (menu.roles.length && !menu.roles.includes(store.getSession().role)) {
                    modal('RMS 로그인 · 화면 접근 권한', T.render("dialogs/navigate-sfr", {
                        key: key, label: menu.label, itemsHtml: menu.roles.map(function (role) { return b(V.sfrRoleNames[role] + '로 로그인', 'sfr-role-login', role, 'rms-btn-primary'); }).join(''), bHtml: b('취소', 'close')
                    }));
                    return;
                }
                var path = menu.route;
                if (menu.record === 'doctor') {
                    var current = route(), doctors = store.getState().doctors, doctor = doctors.find(function (d) { return current[0] === 'doctor' && d.id === current[1]; }) || doctors[0];
                    if (doctor)
                        path = 'doctor/' + doctor.id;
                    else
                        toast('등록된 기술닥터가 없어 검색 화면을 엽니다.');
                }
                if (menu.step) {
                    var apps = store.getApplications(), a = apps.find(function (item) { return item.id === ui.appId; }) || apps[0];
                    ui.docStatus = '';
                    if (a)
                        path = 'documents/' + a.id + '/' + menu.step;
                    else
                        toast('현재 역할로 조회 가능한 신청서가 없습니다.');
                }
                if (menu.codeKind)
                    ui.codeKind = menu.codeKind;
                closeSfrLayer();
                go(path);
            }
            function clearUi() {
                closeSfrLayer();
                Object.assign(ui, {
                    doctorFilters: {}, statsFilters: {}, selected: new Set(), faqQuery: '', faqWork: '', docStatus: '', codeKind: 'technology', appId: '', programLayout: 'cards', globalQuery: '', boardQuery: ''
                });
            }
            function presentation() {
                return {
                    role: store.getSession().role, route: location.hash.slice(1) || 'home', ui: Object.assign({}, ui, {
                        selected: Array.from(ui.selected)
                    })
                };
            }
            function restorePresentation(saved) {
                clearUi();
                if (!saved) {
                    store.setRole('visitor');
                    return;
                }
                store.setRole(saved.role);
                Object.assign(ui, saved.ui, {
                    selected: new Set(saved.ui.selected)
                });
            }
            function exportFallback() {
                if (store.mode !== 'demo')
                    throw new Error('시연 환경에서만 내보낼 수 있습니다.');
                download('smtech-시연내용.json', store.exportBackup(presentation()));
                document.getElementById('rms-storage-help').textContent = 'smtech-시연내용.json 다운로드를 요청했습니다. 브라우저 다운로드 목록(Ctrl+J)에서 파일과 폴더를 확인하세요.';
                toast('JSON 다운로드를 요청했습니다. Ctrl+J에서 확인하세요.');
            }
            async function exportDemo() {
                if (store.mode !== 'demo') {
                    showError(new Error('시연 환경에서만 내보낼 수 있습니다.'));
                    return;
                }
                if (typeof window.showSaveFilePicker !== 'function') {
                    modal('시연내용 JSON 내보내기', T.render("dialogs/export-demo", {
                        bHtml: b('취소', 'close'), bHtml2: b('JSON 파일 다운로드', 'export-fallback', '', 'rms-btn-primary')
                    }));
                    return;
                }
                var writer;
                try {
                    var text = store.exportBackup(presentation());
                    var handle = await window.showSaveFilePicker({
                        id: 'smtech-demo-json', suggestedName: 'smtech-시연내용.json', startIn: 'downloads', types: [{
                                description: 'SMTECH 시연 내용 JSON', accept: {
                                    'application/json': ['.json']
                                }
                            }]
                    });
                    writer = await handle.createWritable();
                    await writer.write(text);
                    await writer.close();
                    writer = null;
                    document.getElementById('rms-storage-help').textContent = '선택한 폴더에 ' + handle.name + ' 저장 완료 · 다른 PC에서 JSON 불러오기로 복원하세요.';
                    toast('선택한 폴더에 시연내용 JSON을 저장했습니다.');
                }
                catch (error) {
                    if (writer) {
                        try {
                            await writer.abort();
                        }
                        catch (ignore) { }
                    }
                    if (error.name === 'AbortError') {
                        toast('JSON 내보내기를 취소했습니다. 시연 내용은 유지됩니다.');
                        return;
                    }
                    if (error.name === 'SecurityError') {
                        modal('저장 위치 선택이 차단되었습니다', T.render("dialogs/export-demo-2", {
                            bHtml: b('취소', 'close'), bHtml2: b('JSON 파일 다운로드', 'export-fallback', '', 'rms-btn-primary')
                        }));
                        return;
                    }
                    showError(new Error('JSON 파일 저장에 실패했습니다. 시연 내용은 유지됩니다. ' + error.message));
                }
            }
            function login() {
                modal('RMS 로그인 시연', T.render("dialogs/login", {
                    bHtml: b('지원기업으로 체험', 'role-login', 'company', 'rms-btn-primary'), bHtml2: b('충남TP 담당자로 체험', 'role-login', 'tp'), bHtml3: b('시스템 관리자로 체험', 'role-login', 'admin')
                }));
            }
            function releaseHistory() {
                var releases = (window.RMSReleaseHistory || {}).releases || [];
                modal('개발자 소스 배포내역', T.render('dialogs/releases', { itemsHtml: releases.map(function (item, index) { return T.render('dialogs/release-item', { version: item.version, date: item.date, title: item.title, status: item.legacy ? '구형 · 시연 포함' : index === 0 ? '현재 배포' : '이전 배포', openAttr: index === 0 ? 'open' : '', changesHtml: item.changes.map(function (text) { return T.render('dialogs/release-change', { text: text }); }).join(''), migration: item.migration, downloadHtml: item.download ? T.render('dialogs/release-download', { url: item.download, version: item.version }) : '' }); }).join('') }), { draggable: true, program: true });
            }
            document.getElementById('rms-release-history').addEventListener('click', releaseHistory);
            var actions = { 'requirements-expand': function () { root.querySelectorAll('.rms-requirement-card').forEach(function (card) { card.setAttribute('open', ''); }); },
                'requirements-collapse': function () { root.querySelectorAll('.rms-requirement-card').forEach(function (card) { card.removeAttribute('open'); }); },
                'sfr-open': openSfrLayer,
                'sfr-navigate': navigateSfr,
                'sfr-role-login': function (role) {
                    var target = host.querySelector('[data-sfr-login-target]'), key = target && target.dataset.sfrLoginTarget, menu = V.sfrDestination(key);
                    if (!menu || !menu.roles.includes(role))
                        throw new Error('이 화면에 허용된 역할을 선택해 주세요.');
                    store.setRole(role);
                    closeModal();
                    navigateSfr(key);
                    toast('선택한 역할로 요청한 화면을 열었습니다.');
                },
                'role-login': function (id) {
                    store.setRole(id);
                    closeModal();
                    render();
                    toast('가상 사용자 역할을 변경했습니다.');
                },
                'account-help': function () {
                    modal('SMTECH 계정 안내', T.render("dialogs/account-help", {
                        bHtml: b('로그인 시연', 'login', '', 'rms-btn-primary')
                    }));
                },
                'reset-confirm': function () {
                    modal('시연 데이터 초기화', T.render("dialogs/reset-confirm", {
                        bHtml: b('취소', 'close'), bHtml2: b('시연내용 JSON 내보내기', 'export'), bHtml3: b('초기화', 'reset', '', 'rms-btn-danger')
                    }));
                },
                reset: function () {
                    commit(function () {
                        store.reset();
                        clearUi();
                    }, '가상 자료를 초기화했습니다.', false, function (result) { go('home'); });
                },
                'export-fallback': exportFallback,
                export: exportDemo };
            document.getElementById('rms-role').addEventListener('change', function (ev) {
                closeModal();
                store.setRole(ev.target.value);
                ui.docStatus = '';
                render();
                toast('가상 사용자 역할을 변경했습니다.');
            });
            document.getElementById('rms-export').addEventListener('click', actions.export);
            document.getElementById('rms-reset').addEventListener('click', actions['reset-confirm']);
            document.getElementById('rms-storage-info').addEventListener('click', function () { modal('시연 내용 저장 및 다른 PC에서 이어보기', T.render("dialogs/init-2", {})); });
            document.getElementById('rms-import').addEventListener('change', async function (ev) {
                var input = ev.target, file = input.files[0];
                if (store.mode !== 'demo') {
                    input.value = '';
                    showError(new Error('시연 환경에서만 불러올 수 있습니다.'));
                    return;
                }
                if (!file)
                    return;
                try {
                    if (file.size > 5 * 1024 * 1024)
                        throw new Error('JSON은 5MB 이하로 선택해 주세요.');
                    var text = await file.text();
                    window.RMSCore.parseBackup(text);
                    modal('시연 데이터 불러오기', T.render("dialogs/init-3", {
                        name: file.name, bHtml: b('취소', 'close'), bHtml2: b('현재 시연내용 JSON 내보내기', 'export')
                    }));
                    document.getElementById('rms-confirm-import').addEventListener('click', function () {
                        var restored;
                        commit(function () {
                            restored = store.importJson(text);
                            restorePresentation(restored);
                        }, 'JSON 시연 데이터를 불러왔습니다.', false, function (result) { go(restored ? restored.route : 'home'); });
                    });
                }
                catch (err) {
                    showError(err);
                }
                finally {
                    input.value = '';
                }
            });
            document.getElementById('rms-demo-sfr').addEventListener('click', eventClick);
            function idsFor(p) { if (p[0] === 'home')
                return [6, 7, 8, 9, 10]; if (p[0] === 'boards')
                return [8, 9]; if (p[0] === 'search')
                return [6, 7, 8, 9]; if (['doctors', 'doctor'].includes(p[0]))
                return [1, 2, 3, 4]; if (p[0] === 'matches')
                return [3]; if (p[0] === 'stats')
                return [5]; if (p[0] === 'mydata')
                return [11, 12, 13, 14, 15]; if (p[0] === 'documents')
                return p[2] === '1' ? [14] : p[2] === '2' ? [13] : p[2] === '4' ? [14, 15] : [11, 12, 13, 14, 15]; if (['faq', 'questions'].includes(p[0]))
                return p[0] === 'questions' ? [8, 9] : [7, 8]; if (p[0] === 'manage')
                return p[1] === 'home' ? [8, 9, 10] : p[1] === 'documents' ? [12] : [2, 8]; return []; }
            ;
            return { actions: actions, login: login, logout: function () { store.setRole('visitor'); go('home'); render(); toast('로그아웃했습니다.'); }, route: function (p) { return p[0] === 'guide' ? guideViews.guide() : null; }, onRender: function (p) { var bar = document.getElementById('rms-demo-sfr'); bar.innerHTML = guideViews.markup(idsFor(p)); bar.hidden = false; repositionSfrLayer(); document.getElementById('rms-role').value = store.getSession().role; document.querySelectorAll('[data-home-design]').forEach(function (link) { if (p[0] === 'home' && link.dataset.homeDesign === (p[1] === '2' ? '2' : '1'))
                    link.setAttribute('aria-current', 'page');
                else
                    link.removeAttribute('aria-current'); }); if (p[0] === 'guide' && /^SFR-\d{2}$/.test(p[1] || '')) {
                    var card = document.getElementById(p[1]);
                    if (card) {
                        card.setAttribute('open', '');
                        card.classList.add('rms-sfr-selected');
                        (card.querySelector('summary') || card).focus({ preventScroll: true });
                        card.scrollIntoView?.({ block: 'start' });
                    }
                } } };
        } };
}(window));
