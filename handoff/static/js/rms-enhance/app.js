/* @owner publisher | @since RMS-PUB-20261008-01
 * UI controller: routes, events and view-model composition. No endpoints or storage.
 * Edit templates/dialogs for markup; integration-owned adapter handles backend writes. */
(function () {
    'use strict';
    var T = window.RMSTemplates, extension = {};
    var root = document.getElementById('rms-enhance-app'), host = document.getElementById('rms-dialog-host'), store, views, modalReturnFocus, toastTimer;
    var ui = {
        doctorFilters: {}, statsFilters: {}, selected: new Set(), faqQuery: '', faqWork: '', docStatus: '', codeKind: 'technology', appId: '', programLayout: 'cards', globalQuery: '', boardQuery: ''
    };
    var V = window.RMSViews, e = V.esc, b = V.btn;
    function toast(message) {
        var el = document.getElementById('rms-toast');
        el.textContent = message;
        el.setAttribute('data-visible', '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.removeAttribute('data-visible'); }, 5000);
    }
    function showError(error) {
        var target = host.querySelector('[data-dialog-error]');
        if (target) {
            target.hidden = false;
            target.textContent = error.message || String(error);
            target.focus();
        }
        else
            toast(error.message || String(error));
    }
    function closeModal() {
        var d = host.querySelector('dialog');
        if (d) {
            window.RMSLayers.dispose(d);
            d.close();
            host.replaceChildren();
        }
        if (modalReturnFocus && modalReturnFocus.isConnected)
            modalReturnFocus.focus();
    }
    function modal(title, body, options) {
        modalReturnFocus = document.activeElement;
        host.innerHTML = T.render("dialogs/modal", {
            value: (options && options.program ? ' rms-dialog-program' : options && options.mydata ? ' rms-dialog-mydata' : ''), value2: (options && options.draggable ? ' tabindex="0" data-dialog-move title="제목 드래그 또는 방향키로 이동"' : ''), title: title, body: body
        });
        var d = host.querySelector('dialog');
        d.addEventListener('cancel', function (ev) {
            ev.preventDefault();
            closeModal();
        });
        d.showModal();
        if (options && options.draggable)
            window.RMSLayers.movable(d);
    }
    function route() { return (location.hash.slice(1) || 'home').split('/'); }
    function go(path) {
        closeModal();
        if (location.hash === '#' + path)
            render(true);
        else
            location.hash = path;
    }
    function render(focus) {
        var p = route(), r = store.getSession().role;
        document.body.classList.toggle('rms-home-design2', p[0] === 'home' && p[1] === '2');
        try {
            var extensionHtml = extension.route ? extension.route(p) : null;
            root.innerHTML = extensionHtml != null ? extensionHtml : p[0] === 'doctors' ? views.doctors() : p[0] === 'doctor' ? views.doctorDetail(p[1]) : p[0] === 'matches' ? views.matches() : p[0] === 'stats' ? views.stats() : p[0] === 'documents' ? views.documents(p[1], p[2]) : p[0] === 'boards' ? views.boards(p[1], ui.boardQuery) : p[0] === 'search' ? views.search(ui.globalQuery) : p[0] === 'mydata' ? mydataPage(p[1]) : p[0] === 'faq' ? views.faq(false) : p[0] === 'questions' ? views.faq(true) : p[0] === 'manage' ? views.manage(p[1]) : views.home(p[1]);
            if (p[0] === 'mydata' && window.RMSMydata)
                window.RMSMydata.mount(root.querySelector('#rms-receipt-page'), p[1] || defaultReceipt());
            root.setAttribute('aria-busy', 'false');
            document.title = (root.querySelector('h1')?.textContent || 'RMS') + ' · RMS';
            var names = {
                visitor: '', company: '지원기업', tp: '관리기관', admin: '시스템 관리자'
            };
            document.getElementById('rms-user-menu').innerHTML = r === 'visitor' ? T.render("dialogs/render", {}) : T.render("dialogs/render-2", {
                namesValue: store.getSession().displayName || names[r], value: (r === 'admin' ? T.render("dialogs/render-3", {}) : '')
            });
            document.querySelectorAll('.rms-site-nav a').forEach(function (a) {
                var target = a.hash.slice(1), current = target === p[0] || (target === 'doctors' && ['doctor', 'matches', 'stats'].includes(p[0])) || (target === 'faq' && p[0] === 'questions');
                if (current)
                    a.setAttribute('aria-current', 'page');
                else
                    a.removeAttribute('aria-current');
            });
            root.querySelectorAll('input[name=submission],input[name=companyRegion]').forEach(function (el) { el.readOnly = true; });
            if (focus)
                root.querySelector('h1')?.focus({
                    preventScroll: true
                });
            if (extension.onRender)
                extension.onRender(p);
        }
        catch (err) {
            root.innerHTML = V.empty('화면을 표시하지 못했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.');
            showError(err);
        }
    }
    // @change RMS-PUB-20261008-01: preserve input and dialog until server success.
    var commit = window.RMSCommandRunner.create({
        close: closeModal, render: render, toast: toast, error: showError, busy: function (value) {
            root.setAttribute('aria-busy', String(value));
            host.setAttribute('aria-busy', String(value));
        }
    });
    var download = window.RMSDom.download, data = window.RMSDom.formData;
    function checks(label, name, list, selected) {
        return T.render("dialogs/checks", {
            label: label, itemsHtml: list.map(function (x) {
                return T.render("dialogs/checks-2", {
                    name: name, id: x.id, value: (selected.includes(x.id) ? ' checked' : ''), name2: x.name
                });
            }).join('')
        });
    }
    function login() { if (extension.login)
        return extension.login(); if (window.RMSIntegration?.login)
        return window.RMSIntegration.login(); throw new Error('서버 로그인 경로가 설정되지 않았습니다.'); }
    var programRowSequence = 0;
    var programRows = {
        supportPrograms: [['지원대상명', 'target'], ['프로그램명', 'name'], ['프로그램 설명', 'description', 'textarea'], ['정부지원금 (원)', 'amount', 'number']], contentSections: [['내용 제목', 'heading'], ['세부내용', 'body', 'textarea']], contacts: [['기관명', 'institution'], ['담당자명', 'name'], ['연락처', 'phone'], ['이메일', 'email', 'email'], ['담당업무', 'duty']], attachments: [['파일명 (.txt)', 'name'], ['시연용 첨부 텍스트', 'content', 'textarea']]
    };
    function programRow(kind, values) {
        var id = String(++programRowSequence);
        values = values || {};
        return T.render("dialogs/program-row", {
            kind: kind, id: id, itemsHtml: programRows[kind].map(function (f) {
                var key = 'rms-program-' + id + '-' + f[1];
                return T.render("dialogs/program-row-2", {
                    value: (f[2] === 'textarea' ? ' rms-span2' : ''), key: key, fValue: f[0], value2: (f[2] === 'textarea' ? T.render("dialogs/program-row-3", {
                        key: key, key2: key, fValue: f[1], value: values[f[1]] || ''
                    }) : T.render('dialogs/program-input', { key: key, field: f[1], type: f[2] || 'text', value: values[f[1]] == null ? '' : values[f[1]] }))
                });
            }).join(''), bHtml: b('항목 삭제', 'program-row-remove', id, 'rms-btn-small')
        });
    }
    function addProgramRow(kind) {
        var target = host.querySelector('[data-program-group="' + kind + '"]');
        if (!target || !programRows[kind])
            return;
        var temp = document.createElement('div');
        temp.innerHTML = programRow(kind, {});
        target.appendChild(temp.firstElementChild);
    }
    function programDetail(id) {
        var s = store.getState(), p = s.programs.find(function (x) { return x.id === id; });
        if (!p)
            throw new Error('사업공고를 찾을 수 없습니다.');
        var fields = [['과제명', p.projectName], ['과제번호', p.projectNumber], ['사업연도', p.businessYear], ['과제지역', p.region], ['공고번호', p.noticeNumber], ['접수기간', p.start + ' ~ ' + p.end], ['공고명', p.title], ['접수마감', p.end + ' ' + p.deadlineTime], ['산업명', p.industry], ['수행기관', p.institution], ['공고일', p.publishedDate]];
        var body = T.render("dialogs/program-detail", {
            badgeHtml: V.badge(store.programStatus(id).label), itemsHtml: fields.map(function (f) {
                return T.render("dialogs/program-detail-2", {
                    fValue: f[0], fValue2: f[1]
                });
            }).join(''), value: (p.supportPrograms.length ? V.table('지원프로그램', ['지원대상명', '프로그램명', '프로그램 설명', '정부지원금 (원)'], p.supportPrograms.map(function (x) {
                return T.render("dialogs/program-detail-3", {
                    target: x.target, name: x.name, description: x.description, toLocaleStringHtml: Number(x.amount).toLocaleString('ko-KR')
                });
            })) : V.empty('등록된 지원프로그램이 없습니다.')), intro: p.intro, itemsHtml2: p.contentSections.map(function (x) {
                return T.render("dialogs/program-detail-4", {
                    heading: x.heading, body: x.body
                });
            }).join(''), itemsHtml3: p.requiredDocs.map(function (k) {
                return T.render("dialogs/program-detail-5", {
                    name: s.documentTypes.find(function (t) { return t.id === k; }).name
                });
            }).join(''), value2: (p.contacts.length ? V.table('담당자정보', ['기관명', '담당자명', '연락처', '이메일', '담당업무'], p.contacts.map(function (x) {
                return T.render("dialogs/program-detail-6", {
                    itemsHtml: [x.institution, x.name, x.phone, x.email, x.duty].map(function (v) {
                        return T.render("dialogs/program-detail-7", {
                            v: v
                        });
                    }).join('')
                });
            })) : V.empty('등록된 담당자정보가 없습니다.')), value3: (p.attachments.length ? V.table('공고 첨부파일', ['순번', '파일명', '크기 (KB)', '다운로드'], p.attachments.map(function (x, i) {
                return T.render("dialogs/program-detail-8", {
                    value: (i + 1), name: x.name, toFixedHtml: (x.size / 1024).toFixed(1), bHtml: b('다운로드', 'program-attachment', p.id + '/' + x.id, 'rms-btn-small rms-btn-primary')
                });
            })) : V.empty('등록된 첨부파일이 없습니다.')), bHtml: b('닫기', 'close'), value4: (store.getSession().role === 'admin' ? b('공고내용 수정', 'program-edit', id) : ''), bHtml2: b('신청하기', 'apply', id, 'rms-btn-primary')
        });
        modal('사업공고 상세', body, {
            program: true, draggable: true
        });
    }
    function programForm(id) {
        if (store.getSession().role !== 'admin')
            throw new Error('시스템 관리자만 공고를 등록·수정할 수 있습니다.');
        var s = store.getState(), p = s.programs.find(function (x) { return x.id === id; }) || {
            id: '', title: '', region: '충남', start: s.demoDate, end: s.demoDate, deadlineTime: '18:00', businessYear: s.demoDate.slice(0, 4), publishedDate: s.demoDate, requiredDocs: [], supportPrograms: [], contentSections: [], contacts: [], attachments: []
        };
        var scalar = [['공고명 *', 'title'], ['과제명 *', 'projectName'], ['과제번호 *', 'projectNumber'], ['공고번호 *', 'noticeNumber'], ['사업연도 *', 'businessYear'], ['지역 *', 'region'], ['지원분야 *', 'category'], ['산업명 *', 'industry'], ['접수 시작일 *', 'start', 'date'], ['접수 마감일 *', 'end', 'date'], ['접수 마감시간 *', 'deadlineTime', 'time'], ['공고일 *', 'publishedDate', 'date'], ['수행기관 *', 'institution']];
        var labels = {
            supportPrograms: '지원프로그램', contentSections: '공고내용', contacts: '담당자정보', attachments: '첨부파일 (.txt 시연자료)'
        };
        modal(id ? '사업공고 수정' : '사업공고 등록', T.render("dialogs/program-form", {
            id: p.id, itemsHtml: scalar.map(function (f) { return V.field(f[0], f[1], p[f[1]], f[2] || 'text'); }).join(''), value: p.intro || '', checksHtml: checks('필수 접수서류', 'requiredDocs', s.documentTypes, p.requiredDocs), itemsHtml2: Object.keys(programRows).map(function (kind) {
                return T.render("dialogs/program-form-2", {
                    labelsValue: labels[kind], bHtml: b('항목 추가', 'program-row-add', kind, 'rms-btn-small'), kind: kind, itemsHtml: p[kind].map(function (x) { return programRow(kind, x); }).join('')
                });
            }).join(''), bHtml: b('취소', 'close')
        }), {
            program: true, draggable: true
        });
    }
    function saveProgramForm(form) {
        var input = data(form);
        input.id = form.dataset.id;
        input.requiredDocs = new FormData(form).getAll('requiredDocs');
        Object.keys(programRows).forEach(function (kind) {
            input[kind] = Array.from(form.querySelectorAll('[data-program-row="' + kind + '"]')).map(function (row, index) {
                var result = {};
                row.querySelectorAll('[data-program-field]').forEach(function (field) { result[field.dataset.programField] = field.value; });
                if (kind === 'supportPrograms')
                    result.amount = Number(result.amount);
                if (kind === 'attachments') {
                    result.id = 'ATT' + (index + 1);
                    result.mimeType = 'text/plain';
                }
                return result;
            });
        });
        return store.saveProgram(input);
    }
    function doctorForm(id) {
        var s = store.getState(), d = s.doctors.find(function (x) { return x.id === id; }) || {
            id: '', userId: '', organization: '', institution: 'O02', industry: 'I01', year: '2026', degree: '', career: '', certificates: '', acquiredTechnology: '', technologies: [], consultations: [], supportRegions: [], reasons: [], available: true
        };
        var role = store.getSession();
        if (!['tp', 'admin'].includes(role.role))
            throw new Error('관리기관 역할로 전환해 주세요.');
        if (d.id && role.role !== 'admin' && d.owner !== role.region)
            throw new Error('등록기관 담당자만 수정할 수 있습니다.');
        modal(id ? '기술닥터 등록정보 수정' : '기술닥터 등록', T.render("dialogs/doctor-form", {
            id: d.id, selectHtml: V.select('SMTECH 사용자 *', 'userId', [{
                    id: '', name: '사용자 선택'
                }].concat(s.users.map(function (u) {
                return {
                    id: u.id, name: u.name + ' · ' + u.organization
                };
            })), d.userId), fieldHtml: V.field('소속기관 *', 'organization', d.organization), selectHtml2: V.select('기관유형 *', 'institution', views.codes('institution'), d.institution), selectHtml3: V.select('산업분야 *', 'industry', views.codes('industry'), d.industry), selectHtml4: V.select('선정연도 *', 'year', [{
                    id: '2026', name: '2026년'
                }, {
                    id: '2025', name: '2025년'
                }], d.year), fieldHtml2: V.field('학위정보 *', 'degree', d.degree), fieldHtml3: V.field('취득기술정보 *', 'acquiredTechnology', d.acquiredTechnology, 'text', 'rms-span2'), checksHtml: checks('기술분야 * (복수 선택)', 'technologies', views.codes('technology'), d.technologies), checksHtml2: checks('상담유형 * (복수 선택)', 'consultations', views.codes('consultation'), d.consultations), checksHtml3: checks('지원가능 지역 * (복수 선택)', 'supportRegions', views.codes('region').map(function (c) {
                return {
                    id: c.name, name: c.name
                };
            }), d.supportRegions), checksHtml4: checks('선정사유 * (복수 선택)', 'reasons', views.codes('reason'), d.reasons), fieldHtml4: V.field('주요경력 *', 'career', d.career, 'text', 'rms-span2'), fieldHtml5: V.field('자격증·포상 * (없으면 없음 입력)', 'certificates', d.certificates, 'text', 'rms-span2'), value: (d.available ? ' checked' : ''), bHtml: b('취소', 'close')
        }));
    }
    function defaultReceipt() { var api=window.RMSMydata; return api.defaultBundleId || (api.manifest[0] || {}).id || ''; }
    function mydataPage(bundleId) { return views.receiptPage(); }
    function receiptReport(id) {
        var parts = String(id || '').split('/'), bundleId = parts[0] || defaultReceipt();
        if (!window.RMSMydata?.getBundle(bundleId))
            throw new Error('XML 수신 샘플을 읽지 못했습니다. 새로고침 후 다시 확인하세요.');
        modal('공공마이데이터 · XML 수신 리포트', T.render("dialogs/receipt-report", {}), {
            mydata: true, draggable: true
        });
        window.RMSMydata.mount(host.querySelector('#rms-receipt-report'), bundleId, parts[1]);
    }
    function boardDetail(id) {
        var parts = String(id).split('/');
        modal((window.RMSBoards?.labels[parts[0]] || '게시판') + ' · 상세', views.boardDetail(parts[0], parts[1]), {
            program: true, draggable: true
        });
    }
    function docDetail(id) {
        var s = store.getState(), a = store.getApplications().find(function (x) { return x.id === ui.appId; }), d = a.docs.find(function (x) { return x.specId === id; }), spec = s.documentTypes.find(function (x) { return x.id === id; }), company = store.getSession().role === 'company', locked = a.submission === '제출완료';
        var mismatch = id === 'F01' && d.issue === 'mismatch';
        modal(spec.name + ' · 상세', T.render("dialogs/doc-detail", {
            value: (d.receipt ? T.render("dialogs/doc-detail-2", {
                value: d.receipt.documentName || '미수신', bundleId: d.receipt.bundleId, bHtml: b('수신 정보 리포트', 'receipt-report', d.receipt.bundleId + '/' + d.receipt.documentCode, 'rms-btn-small rms-btn-primary')
            }) : ''), badgeHtml: V.badge(d.status), provider: spec.provider, value2: (d.status === '조회실패' || d.status === '보완필요' ? 'rms-warning' : ''), value3: d.reason || '서류를 조회하거나 파일로 제출해 주세요.', value4: (mismatch ? T.render("dialogs/doc-detail-3", {
                inputAddress: a.inputAddress, address: a.address, value: (company && !locked ? T.render("dialogs/doc-detail-4", {
                    bHtml: b('기존 입력값 유지', 'mismatch-keep', id), bHtml2: b('조회 주소 반영', 'mismatch-apply', id, 'rms-btn-primary')
                }) : '')
            }) : ''), value5: (company && !locked ? T.render("dialogs/doc-detail-5", {
                id: id, bHtml: b(d.status === '조회실패' ? '재조회' : '조회', d.status === '조회실패' ? 'doc-retry' : 'doc-query', id, 'rms-btn-primary')
            }) : ''), value6: (d.history.length ? V.table('서류 처리이력', ['처리일시', '처리', '내용'], d.history.map(function (h) {
                return T.render("dialogs/doc-detail-6", {
                    replaceHtml: h.at.slice(0, 19).replace('T', ' '), action: h.action, reason: h.reason
                });
            }), true) : V.empty('아직 처리이력이 없습니다.'))
        }), {
            program: true, draggable: true
        });
    }
    function codeForm(id) {
        var s = store.getState(), c = s.classifications.find(function (x) { return x.id === id; }) || {
            id: '', kind: ui.codeKind, name: '', parentId: '', active: true, visible: true
        };
        modal(c.id ? '표준분류 수정' : '표준분류 추가', T.render("dialogs/code-form", {
            id: c.id, kind: c.kind, fieldHtml: V.field('분류명 *', 'name', c.name), selectHtml: V.select('상위분류', 'parentId', [{
                    id: '', name: '없음'
                }].concat(s.classifications.filter(function (x) { return x.kind === c.kind && x.id !== c.id; }).map(function (x) {
                return {
                    id: x.id, name: x.name
                };
            })), c.parentId), value: (c.active ? ' checked' : ''), value2: (c.visible ? ' checked' : ''), bHtml: b('취소', 'close')
        }));
    }
    function saveCompanyForm() {
        var form = root.querySelector('#rms-company-form');
        if (!form || form.querySelector('fieldset').hasAttribute('disabled'))
            return;
        var input = data(form), a = store.getApplications().find(function (x) { return x.id === form.dataset.id; });
        if (['companyName', 'representative', 'inputAddress'].some(function (k) { return input[k] !== a[k]; }))
            return store.saveApplicationInfo(a.id, input);
    }
    // Self-contained sample: no store writes, credentials, file uploads or API requests.
    var actions = {
        'program-layout': function (id) {
            if (!['cards', 'list'].includes(id))
                return;
            ui.programLayout = id;
            render();
        },
        'board-detail': boardDetail,
        'receipt-report': receiptReport,
        'receipt-apply': function (id) { commit(function () { return store.applyReceiptInfo(id); }, 'XML 수신값을 신청정보에 반영했습니다.', false, function (result) { go('documents/' + id + '/2'); }); },
        'home-programs': function () {
            var section = document.getElementById('rms-home2-programs');
            if (section) {
                section.scrollIntoView?.({
                    behavior: 'smooth', block: 'start'
                });
                section.focus({
                    preventScroll: true
                });
            }
        },
        'document-step': function (id) {
            if (!['1', '2', '3', '4'].includes(id))
                return;
            commit(saveCompanyForm, '', false, function () {
                ui.docStatus = '';
                go('documents/' + ui.appId + '/' + id);
            });
        },
        'application-open': function (id) {
            ui.docStatus = '';
            go('documents/' + id + '/2');
        },
        close: closeModal,
        login: login,
        'go-documents': function () { go('documents'); },
        'faq-work': function (id) {
            ui.faqWork = id;
            ui.faqQuery = '';
            go('faq');
        },
        'faq-reset': function () {
            ui.faqQuery = '';
            ui.faqWork = '';
            render();
        },
        program: programDetail,
        'program-edit': programForm,
        'program-row-add': addProgramRow,
        'program-row-remove': function (id) { host.querySelector('[data-program-row-id="' + id + '"]')?.remove(); },
        'program-attachment': function (id) {
            var ids = id.split('/'), p = store.getState().programs.find(function (x) { return x.id === ids[0]; }), file = p && p.attachments.find(function (x) { return x.id === ids[1]; });
            if (!file)
                throw new Error('첨부파일을 찾을 수 없습니다.');
            download(file.name, file.content, file.mimeType + ';charset=utf-8');
            toast('시연용 첨부파일을 내려받습니다.');
        },
        apply: function (id) {
            if (store.getSession().role !== 'company') {
                login();
                return;
            }
            var appId;
            commit(function () { return store.startApplication(id); }, '가상 신청서를 열었습니다.', false, function (result) {
                appId = result;
                go('documents/' + appId + '/2');
            });
        },
        question: function (id) {
            var q = store.publicQuestions().find(function (x) { return x.id === id; });
            if (!q)
                throw new Error('공개된 게시물이 아닙니다.');
            modal('소통하기 · 질문과 답변', T.render("dialogs/question", {
                title: q.title, badgeHtml: V.badge(q.status), labelHtml: store.label(q.work), date: q.date, value: q.answer || '아직 등록된 답변이 없습니다.'
            }));
        },
        'doctor-reset': function () {
            ui.doctorFilters = {};
            render();
        },
        'doctor-edit': doctorForm,
        compare: function () {
            var ds = store.getState().doctors.filter(function (d) { return ui.selected.has(d.id); });
            if (ds.length < 2)
                throw new Error('비교할 기술닥터를 2~3명 선택해 주세요.');
            var fields = [['소속기관', function (d) { return e(d.organization); }], ['기관유형', function (d) { return e(store.label(d.institution)); }], ['기술분야', function (d) { return d.technologies.map(function (x) { return e(store.label(x)); }).join(', '); }], ['지원가능 지역', function (d) { return d.supportRegions.map(e).join(', '); }], ['취득기술', function (d) { return e(d.acquiredTechnology); }], ['상담유형', function (d) { return d.consultations.map(function (x) { return e(store.label(x)); }).join(', '); }], ['상태', function (d) { return V.badge(d.available ? '지원가능' : '활동중지'); }], ['상세정보', function (d) {
                        return T.render("dialogs/compare", {
                            id: d.id
                        });
                    }]];
            modal('기술닥터 비교', V.table('선택 기술닥터 비교', ['비교항목'].concat(ds.map(function (d) { return e(d.name); })), fields.map(function (f) {
                return T.render("dialogs/compare-2", {
                    fValue: f[0], itemsHtml: ds.map(function (d) {
                        return T.render("dialogs/compare-3", {
                            value: f[1](d)
                        });
                    }).join('')
                });
            }), true));
        },
        'match-request': function (id) {
            var d = store.getState().doctors.find(function (x) { return x.id === id; });
            if (store.getSession().role === 'visitor') {
                login();
                return;
            }
            modal('기술닥터 매칭 요청', T.render("dialogs/match-request", {
                id: id, name: d.name, organization: d.organization, itemsHtml: d.supportRegions.map(e).join(' · '), bHtml: b('취소', 'close')
            }));
        },
        'match-progress': function (id) {
            var m = store.getState().matches.find(function (x) { return x.id === id; });
            if (m.status === '요청접수') {
                commit(function () { return store.progressMatch(id, '지원진행', ''); }, '지원진행으로 변경했습니다.');
                return;
            }
            modal('기업지원 실적 등록', T.render("dialogs/match-progress", {
                id: id
            }));
        },
        'stats-export': function () {
            if (!['tp', 'admin'].includes(store.getSession().role))
                throw new Error('관리기관 권한이 필요합니다.');
            var csv = function (v) {
                var x = String(v);
                if (/^[=+\-@\t\r]/.test(x))
                    x = "'" + x;
                return '"' + x.replace(/"/g, '""') + '"';
            };
            var lines = [['등록지역', '등록 전문가', '활동 전문가', '매칭 요청', '지원완료', '지역 간 매칭']].concat(views.statsData().rows.map(function (r) { return [r.region, r.registered, r.active, r.matched, r.completed, r.cross]; }));
            download('RMS_기술닥터통계.csv', '\uFEFF' + lines.map(function (row) { return row.map(csv).join(','); }).join('\r\n'), 'text/csv;charset=utf-8');
            toast('현재 조회조건의 통계 CSV를 저장했습니다.');
        },
        'doc-status': function (id) {
            ui.docStatus = id;
            render();
        },
        'doc-detail': docDetail,
        'doc-query': function (id) { commit(function () { return store.queryDocument(ui.appId, id, false); }, 'XML 수신 정보를 확인했습니다.', false, function (result) { docDetail(id); }); },
        'doc-retry': function (id) { commit(function () { return store.queryDocument(ui.appId, id, true); }, '같은 XML 수신 파일을 다시 확인했습니다.', false, function (result) { docDetail(id); }); },
        'query-required': function (id) {
            var s = store.getState(), a = store.getApplications().find(function (x) { return x.id === id; }), p = s.programs.find(function (x) { return x.id === a.programId; });
            if (!a.consent)
                throw new Error('정보 제공에 동의한 후 조회해 주세요.');
            if (a.submission === '제출완료')
                throw new Error('제출완료 신청서는 기관의 보완요청 후 수정할 수 있습니다.');
            commit(function () { return store.queryRequired(id); }, '필수서류 조회를 마쳤습니다. 보완필요·조회실패 항목을 확인하세요.');
        },
        'mismatch-keep': function () { commit(function () { return store.resolveMismatch(ui.appId, false); }, '기존 입력값을 유지했습니다. 증빙 파일을 첨부해 주세요.', false, function (result) { docDetail('F01'); }); },
        'mismatch-apply': function () { commit(function () { return store.resolveMismatch(ui.appId, true); }, '선택한 조회 주소를 신청서에 반영했습니다.', false, function (result) { docDetail('F01'); }); },
        supplement: function (id) {
            modal('증빙서류 보완요청', T.render("dialogs/supplement", {
                id: id
            }));
        },
        draft: function (id) { commit(function () { return store.submitApplication(id, true); }, '신청서를 임시저장했습니다.'); },
        submit: function (id) {
            modal('신청서 제출 확인', T.render("dialogs/submit", {
                bHtml: b('취소', 'close'), bHtml2: b('가상 신청서 제출', 'submit-confirm', id, 'rms-btn-primary')
            }));
        },
        'submit-confirm': function (id) { commit(function () { return store.submitApplication(id, false); }, '가상 신청서 제출이 완료되었습니다.'); },
        'code-kind': function (id) {
            ui.codeKind = id;
            render();
        },
        'code-edit': codeForm,
        'code-delete': function (id) {
            modal('분류 삭제 확인', T.render("dialogs/code-delete", {
                bHtml: b('취소', 'close'), bHtml2: b('삭제', 'code-delete-confirm', id, 'rms-btn-danger')
            }));
        },
        'code-delete-confirm': function (id) { commit(function () { return store.removeCode(id); }, '분류를 삭제했습니다.'); },
        'home-up': function (id) {
            commit(function () {
                var s = store.getState().settings, order = s.homeOrder.filter(function (k) { return k !== 'help'; }), i = order.indexOf(id);
                if (i > 0) {
                    order.splice(i, 1);
                    order.splice(i - 1, 0, id);
                }
                s.homeOrder = order.concat('help');
                return store.updateSettings(s);
            }, '메인 배치를 저장했습니다.');
        },
        'doc-type-edit': function (id) {
            var d = store.getState().documentTypes.find(function (x) { return x.id === id; }) || {
                id: '', name: '', provider: '', active: true
            };
            modal('연계 대상 서류 설정', T.render("dialogs/doc-type-edit", {
                id: d.id, fieldHtml: V.field('서류명 *', 'name', d.name), fieldHtml2: V.field('제공기관 *', 'provider', d.provider), value: (d.active ? ' checked' : '')
            }));
        }
    };
    function eventClick(event) {
        var button = event.target.closest('[data-action]');
        if (button) {
            event.preventDefault();
            try {
                var action = actions[button.dataset.action] || (extension.actions && extension.actions[button.dataset.action]);
                if (action)
                    action(button.dataset.id);
            }
            catch (err) {
                showError(err);
            }
        }
        if (event.target.closest('[data-close-link]'))
            closeModal();
    }
    function eventSubmit(event) {
        var form = event.target;
        if (!form.id.startsWith('rms-'))
            return;
        event.preventDefault();
        var f = data(form), id = form.dataset.id;
        try {
            if (form.id === 'rms-doctor-search') {
                ui.doctorFilters = Object.assign({}, f, {
                    available: !!f.available, stale: !!f.stale
                });
                ui.selected.clear();
                render();
            }
            else if (form.id === 'rms-global-search') {
                ui.globalQuery = (f.q || '').trim().slice(0, 500);
                go('search');
            }
            else if (form.id === 'rms-board-search') {
                ui.boardQuery = (f.q || '').trim().slice(0, 500);
                go('boards/' + form.dataset.board);
            }
            else if (form.id === 'rms-faq-search') {
                ui.faqQuery = f.q || '';
                ui.faqWork = f.work || ui.faqWork || '';
                if (route()[0] === 'questions')
                    render();
                else
                    go('faq');
            }
            else if (form.id === 'rms-stats-search') {
                if (f.start && f.end && f.start > f.end)
                    throw new Error('종료일은 시작일 이후로 선택해 주세요.');
                ui.statsFilters = f;
                render();
            }
            else if (form.id === 'rms-doctor-form') {
                var fd = new FormData(form);
                ['technologies', 'consultations', 'supportRegions', 'reasons'].forEach(function (k) {
                    f[k] = fd.getAll(k);
                    if (!f[k].length)
                        throw new Error('기술분야·상담유형·지원가능 지역·선정사유를 각각 선택하세요.');
                });
                f.id = id;
                f.available = !!f.available;
                var saved;
                commit(function () { return store.saveDoctor(f); }, '기술닥터 정보를 저장했습니다.', false, function (result) {
                    saved = result;
                    go('doctor/' + saved);
                });
            }
            else if (form.id === 'rms-match-form') {
                commit(function () { return store.requestMatch(id, f.request); }, '가상 매칭 요청이 접수되었습니다.', false, function (result) { go('matches'); });
            }
            else if (form.id === 'rms-result-form') {
                commit(function () { return store.progressMatch(id, '지원완료', f.result); }, '지원실적을 등록했습니다. 통계에서 확인할 수 있습니다.');
            }
            else if (form.id === 'rms-program-form') {
                var savedId;
                commit(function () { return saveProgramForm(form); }, '공고를 저장했습니다. JSON 내보내기에 포함됩니다.', false, function (result) {
                    savedId = result;
                    programDetail(savedId);
                });
            }
            else if (form.id === 'rms-company-form') {
                commit(saveCompanyForm, '기업정보를 저장했습니다.');
            }
            else if (form.id === 'rms-file-form') {
                var file = form.elements.file.files[0];
                commit(function () { return store.attachFile(ui.appId, id, file); }, '파일명·크기를 저장했습니다. 실제 파일은 전송하지 않았습니다.', false, function (result) { docDetail(id); });
            }
            else if (form.id === 'rms-supplement-form') {
                commit(function () { return store.requestSupplement(ui.appId, id, f.reason); }, '보완을 요청했습니다. 지원기업 역할에서 확인할 수 있습니다.');
            }
            else if (form.id === 'rms-code-form') {
                commit(function () {
                    return store.saveCode({
                        id: id, kind: form.dataset.kind, name: f.name, parentId: f.parentId, active: !!f.active, visible: !!f.visible
                    });
                }, '분류체계를 저장했습니다.');
            }
            else if (form.id === 'rms-work-map') {
                commit(function () { return store.mapWork(f.from, f.to); }, 'FAQ 및 소통 게시물의 업무분류를 변경했습니다.');
            }
            else if (form.id === 'rms-doctype-form') {
                commit(function () {
                    return store.saveDocumentType({
                        id: id, name: f.name, provider: f.provider, active: !!f.active
                    });
                }, '서류 설정을 저장했습니다.');
            }
        }
        catch (err) {
            showError(err);
        }
    }
    function eventChange(event) {
        var el = event.target;
        try {
            if (el.id === 'rms-mydata-bundle') {
                commit(function () { return store.selectMydataBundle(ui.appId, el.value); }, '수신 묶음을 변경했습니다. 정보 제공 동의 후 다시 확인하세요.');
            }
            else if (el.dataset.compare) {
                if (el.checked && ui.selected.size >= 3) {
                    el.checked = false;
                    throw new Error('기술닥터는 최대 3명까지 비교할 수 있습니다.');
                }
                if (el.checked)
                    ui.selected.add(el.dataset.compare);
                else
                    ui.selected.delete(el.dataset.compare);
                document.getElementById('rms-compare-count').textContent = ui.selected.size + '명 선택 · 최대 3명';
            }
            else if (el.id === 'rms-consent') {
                commit(function () { return store.consent(ui.appId, el.checked); }, el.checked ? '가상 정보제공 동의를 기록했습니다.' : '가상 정보제공 동의를 철회했습니다.');
            }
            else if (el.name === 'application') {
                ui.docStatus = '';
                go('documents/' + el.value + '/' + (route()[2] || '3'));
            }
            else if (el.name === 'userId') {
                var u = store.getState().users.find(function (x) { return x.id === el.value; });
                if (u)
                    host.querySelector('[name=organization]').value = u.organization;
            }
            else if (el.dataset.homeVisible) {
                commit(function () {
                    var s = store.getState().settings;
                    s.homeVisible[el.dataset.homeVisible] = el.checked;
                    return store.updateSettings(s);
                }, '메인 노출 설정을 저장했습니다.');
            }
            else if (el.dataset.questionVisible) {
                commit(function () { return store.updateQuestion(el.dataset.questionVisible, el.checked); }, '게시물 노출 설정을 저장했습니다.');
            }
        }
        catch (err) {
            showError(err);
        }
    }
    async function init() {
        try {
            var integration = window.RMSIntegration;
            if (!integration || !integration.adapter)
                throw new Error('업무 데이터 어댑터를 연결해 주세요. ZIP 루트의 개발자 이식 안내를 확인하세요.');
            store = await integration.adapter.open();
            views = V.create(store, ui);
            if (window.RMSHostExtension)
                extension = window.RMSHostExtension.connect({ root: root, host: host, store: store, views: views, ui: ui, modal: modal, closeModal: closeModal, render: render, toast: toast, showError: showError, commit: commit, go: go, route: route, eventClick: eventClick });
            root.addEventListener('click', eventClick);
            host.addEventListener('click', eventClick);
            root.addEventListener('submit', eventSubmit);
            host.addEventListener('submit', eventSubmit);
            root.addEventListener('change', eventChange);
            host.addEventListener('change', eventChange);
            window.addEventListener('hashchange', function () {
                closeModal();
                render(true);
            });
            document.getElementById('rms-user-menu').addEventListener('click', function (ev) {
                var el = ev.target.closest('[data-shell]');
                if (!el)
                    return;
                if (el.dataset.shell === 'login')
                    login();
                else if (el.dataset.shell === 'logout') {
                    if (extension.logout)
                        extension.logout();
                    else if (window.RMSIntegration?.logout)
                        window.RMSIntegration.logout();
                    else
                        showError(new Error('서버 로그아웃 경로가 설정되지 않았습니다.'));
                }
                else
                    modal('회원정보', T.render("dialogs/init", {
                        itemValue: store.getSession().displayName || '로그인 사용자'
                    }));
            });
            render();
            if (store.loadWarning)
                toast(store.loadWarning);
            if (store.connectionWarning)
                toast(store.connectionWarning);
        }
        catch (err) {
            root.setAttribute('aria-busy', 'false');
            root.innerHTML = T.render("dialogs/init-4", {
                message: err.message
            });
        }
    }
    init();
}());
