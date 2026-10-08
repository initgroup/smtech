/* @owner publisher | @since RMS-PUB-20261008-01
 * View-model presenters. HTML lives in templates/screens; data comes only from store queries.
 * Double-brace slots escape text; raw slots accept presenter-generated fragments only. */
(function (root) {
    'use strict';
    var T = root.RMSTemplates;

    var C=root.RMSComponents,esc=C.esc,badge=C.badge,btn=C.btn,field=C.field,select=C.select,table=C.table,empty=C.empty;

    
    
    function create(store, ui) {

        function codes(kind, all) { return store.getState().classifications.filter(function (c) { return c.kind === kind && (all || (c.active && (kind !== 'work' || c.visible))); }).map(function (c) { return {
            id: c.id, name: (c.parentId ? '└ ' : '') + c.name
        }; }); }
        function options(kind, label) { return [{
                id: '', name: label || '전체'
            }].concat(codes(kind)); }
        function name(id) { return esc(store.label(id)); }
        function head(title, path, description, action) { return T.render("screens/head", {
            title: title, value: (description ? T.render("screens/head-2", {
                description: description
            }) : ''), value2: (action || ''), value3: path || title
        }); }
        function tabs(active, kind) {
            var entries = kind === 'doctor' ? [['doctors', '기술닥터 통합검색'], ['matches', '매칭·지원 관리'], ['stats', '통계·성과']] : kind === 'support' ? [['faq', '자주하는 질문'], ['questions', '소통하기']] : [['manage', '표준분류'], ['manage/home', '메인·소통 설정'], ['manage/documents', '연계서류 설정']];
            return T.render("screens/tabs", {
                itemsHtml: entries.map(function (x) { return T.render("screens/tabs-2", {
                    xValue: x[0], value: (x[0] === active ? ' aria-current="page"' : ''), xValue2: x[1]
                }); }).join('')
            });
        }
        function metric(label, count, unit) { return T.render("screens/metric", {
            label: label, count: count, value: unit || '명'
        }); }
        function faqList(list) { return list.length ? T.render("screens/faq-list", {
            itemsHtml: list.map(function (f) { return T.render("screens/faq-list-2", {
                title: f.title, answer: f.answer
            }); }).join('')
        }) : empty('검색된 질문이 없습니다. 다른 검색어나 업무유형을 선택해 주세요.'); }
        function questionTable(list) { return table('소통하기 공개 질문', ['업무유형', '질문 제목', '등록일', '답변상태'], list.map(function (q) { return T.render("screens/question-table", {
            nameHtml: name(q.work), id: q.id, title: q.title, date: q.date, badgeHtml: badge(q.status)
        }); }), true); }
        function globalSearch(query) {
            return T.render("screens/global-search", {
                value: query || '', homeIconHtml: homeIcon('search')
            });
        }
        function programLayout() {
            var layout = ui.programLayout === 'list' ? 'list' : 'cards';
            return T.render("screens/program-layout", {
                value: (layout === 'cards'), value2: (layout === 'list')
            });
        }
        function programSection(variant) {
            var s = store.getState(), role = store.getSession().role, layout = ui.programLayout === 'list' ? 'list' : 'cards';
            var programs = s.programs.filter(function (p) { return store.programStatus(p.id).state === 'open'; });
            var header = {
                length: programs.length, value: (role === 'admin' ? btn('공고 등록', 'program-edit', '', 'rms-btn-small') : ''), programLayoutHtml: programLayout()
            };
            if (!programs.length)
                return T.render('screens/program-section', Object.assign(header, {
                    contentHtml: empty('현재 모집 중인 사업공고가 없습니다.')
                }));
            if (layout === 'list')
                return T.render("screens/program-section", Object.assign(header, {
                    contentHtml: T.render("screens/program-section-3", {
                        itemsHtml: programs.map(function (p) {
                            var status = store.programStatus(p.id);
                            return T.render("screens/program-section-4", {
                                badgeHtml: badge(status.label), region: p.region, category: p.category, id: p.id, title: p.title, start: p.start, end: p.end, deadlineTime: p.deadlineTime, btnHtml: btn('상세보기', 'program', p.id, 'rms-btn-small'), btnHtml2: btn('신청하기', 'apply', p.id, 'rms-btn-small rms-btn-primary')
                            });
                        }).join('')
                    })
                }));
            return T.render("screens/program-section", Object.assign(header, {
                contentHtml: T.render("screens/program-section-5", {
                    itemsHtml: programs.map(function (p) {
                        var status = store.programStatus(p.id);
                        return T.render("screens/program-section-6", {
                            badgeHtml: badge(status.label), region: p.region, category: p.category, id: p.id, title: p.title, start: p.start, end: p.end, end2: p.end, deadlineTime: p.deadlineTime, btnHtml: btn('상세보기', 'program', p.id, 'rms-btn-small'), btnHtml2: btn('신청하기', 'apply', p.id, 'rms-btn-small rms-btn-primary')
                        });
                    }).join('')
                })
            }));
        }
        function boardRows(type, items) {
            return items.length ? items.map(function (item) { return T.render("screens/board-rows", {
                value: type + '/' + item.id, title: item.title, value2: (type === 'qna' ? T.render("screens/board-rows-2", {
                    value: (item.answer ? 'is-complete' : 'is-waiting'), status: item.status
                }) : ''), date: item.date
            }); }).join('') : T.render("screens/board-rows-3", {});
        }
        function homeBoards() {
            return T.render("screens/home-boards", {
                itemsHtml: root.RMSBoards.types.map(function (type) {
                    var items = root.RMSBoards.list(type, store);
                    if (type === 'qna') {
                        var mainIds = store.visibleQuestions().map(function (q) { return q.id; });
                        items = items.filter(function (q) { return mainIds.includes(q.id); });
                    }
                    items = items.slice(0, 5);
                    return T.render("screens/home-boards-2", {
                        itemValue: root.RMSBoards.labels[type], type: type, itemValue2: root.RMSBoards.labels[type], homeIconHtml: homeIcon('arrow'), boardRowsHtml: boardRows(type, items)
                    });
                }).join('')
            });
        }
        function homeLogin(variant) {
            var role = store.getSession().role, visitor = role === 'visitor', displayName = store.getSession().displayName || (role === 'company' ? '지원기업' : role === 'tp' ? '관리기관 담당자' : '시스템 관리자');
            return T.render("screens/home-login", {
                value: (variant === '2' ? 'rms-public-login-gov' : ''), value2: (visitor ? T.render("screens/home-login-2", {}) : T.render("screens/home-login-3", {
                    displayName: displayName
                })), value3: (visitor ? T.render("screens/home-login-4", {}) : T.render("screens/home-login-5", {})), btnHtml: btn(visitor ? '로그인' : '나의 신청현황', visitor ? 'login' : 'go-documents', '', 'rms-btn-primary'), value4: (visitor ? T.render("screens/home-login-6", {}) : T.render("screens/home-login-7", {}))
            });
        }
        function boards(type, query) {
            type = root.RMSBoards.types.includes(type) ? type : 'notice';
            var label = root.RMSBoards.labels[type], q = String(query || '').trim(), all = root.RMSBoards.list(type, store), items = all.filter(function (row) { return !q || [row.title, row.body, row.answer, row.category].join(' ').toLowerCase().includes(q.toLowerCase()); });
            return T.render("screens/boards", {
                headHtml: head(label, '고객지원 › ' + label, '로그인 없이 공개된 게시물과 안내자료를 확인할 수 있습니다.'), itemsHtml: root.RMSBoards.types.map(function (t) { return T.render("screens/boards-2", {
                    t: t, value: (t === type ? ' aria-current="page"' : ''), itemValue: root.RMSBoards.labels[t]
                }); }).join(''), type: type, label: label, q: q, length: items.length, value: (q ? ' · 검색어 “' + esc(q) + '”' : ''), tableHtml: table(label + ' 목록', type === 'qna' ? ['번호', '업무유형', '제목', '답변상태', '등록일'] : ['번호', '분류', '제목', '등록일'], items.map(function (row, i) { return T.render("screens/boards-3", {
                    value: (items.length - i), category: row.category, value2: type + '/' + row.id, title: row.title, value3: (type === 'qna' ? T.render("screens/boards-4", {
                        badgeHtml: badge(row.status)
                    }) : ''), date: row.date
                }); }), true), value2: (items.length ? '' : empty('검색된 게시물이 없습니다. 다른 검색어를 입력해 주세요.'))
            });
        }
        function boardDetail(type, id) {
            var row = root.RMSBoards.get(type, id, store);
            if (!row)
                return empty('공개된 게시물을 찾을 수 없습니다.');
            return T.render("screens/board-detail", {
                itemValue: root.RMSBoards.labels[type], category: row.category, title: row.title, date: row.date, value: (row.status ? badge(row.status) : ''), body: row.body, value2: (type === 'qna' ? T.render("screens/board-detail-2", {
                    value: row.answer || '담당자가 문의 내용을 확인하고 있습니다. 답변이 등록되면 이 화면에서 확인할 수 있습니다.'
                }) : ''), value3: (row.attachment ? T.render("screens/board-detail-3", {
                    homeIconHtml: homeIcon('document'), url: row.attachment.url, name: row.attachment.name, name2: row.attachment.name
                }) : ''), type: type, btnHtml: btn('닫기', 'close')
            });
        }
        function search(query) {
            var q = String(query || '').trim(), term = q.toLowerCase(), s = store.getState();
            if (!q)
                return globalSearch('') + head('통합검색', '통합검색', '사업공고, 기술닥터와 공개 게시판을 함께 검색하세요.') + empty('상단 검색창에 찾으려는 내용을 입력해 주세요.');
            var match = function (values) { return values.join(' ').toLowerCase().includes(term); };
            var programs = s.programs.filter(function (p) { return match([p.title, p.region, p.category, p.intro, p.institution]); });
            var posts = root.RMSBoards.all(store).filter(function (p) { return match([p.title, p.body, p.answer, p.category].concat(p.keywords || [])); });
            var doctors = s.doctors.filter(function (d) { return match([d.name, d.organization, d.acquiredTechnology, d.career, d.owner].concat(d.supportRegions).concat((d.technologies || []).map(store.label))); });
            var total = programs.length + posts.length + doctors.length;
            var content = '';
            if (programs.length)
                content += T.render("screens/search", {
                    length: programs.length, itemsHtml: programs.map(function (p) { return T.render("screens/search-2", {
                        badgeHtml: badge(store.programStatus(p.id).label), region: p.region, category: p.category, id: p.id, title: p.title, start: p.start, end: p.end, deadlineTime: p.deadlineTime
                    }); }).join('')
                });
            if (posts.length)
                content += T.render("screens/search-3", {
                    length: posts.length, itemsHtml: posts.map(function (p) { return T.render("screens/search-4", {
                        itemValue: root.RMSBoards.labels[p.type], category: p.category, date: p.date, value: p.type + '/' + p.id, title: p.title, sliceHtml: (p.answer || p.body || '').slice(0, 160)
                    }); }).join('')
                });
            if (doctors.length)
                content += T.render("screens/search-5", {
                    length: doctors.length, itemsHtml: doctors.map(function (d) { return T.render("screens/search-6", {
                        organization: d.organization, id: d.id, name: d.name, acquiredTechnology: d.acquiredTechnology, itemsHtml: d.supportRegions.join(', ')
                    }); }).join('')
                });
            return globalSearch(q) + head('통합검색 결과', '통합검색', '“' + q + '” 검색결과 ' + total + '건') + (content || empty('검색된 정보가 없습니다. 다른 검색어나 더 짧은 단어로 검색해 주세요.'));
        }
        function homeShortcuts() {
            return T.render("screens/home-shortcuts", {
                itemsHtml: [['기술닥터 찾기', 'doctor', '#doctors'], ['서류제출현황', 'document', '#documents'], ['매칭·지원 현황', 'match', '#matches'], ['이용 안내', 'guide', '#faq']].map(function (x) { return T.render("screens/home-shortcuts-2", {
                    xValue: x[2], homeIconHtml: homeIcon(x[1]), xValue2: x[0], homeIconHtml2: homeIcon('chevron')
                }); }).join('')
            });
        }
        function homeMainBlocks(variant) {
            var settings = store.getState().settings, order = settings.homeOrder || [], showPrograms = !settings.homeVisible || settings.homeVisible.announcements !== false;
            var primary = variant === '2' ? (showPrograms ? T.render("screens/home-main-blocks", {
                programSectionHtml: programSection('2'), homeLoginHtml: homeLogin('2')
            }) : T.render("screens/home-main-blocks-2", {
                homeLoginHtml: homeLogin('2')
            })) : T.render("screens/home-main-blocks-3", {
                value: (showPrograms ? programSection('1') : ''), homeShortcutsHtml: homeShortcuts(), homeLoginHtml: homeLogin('1')
            });
            var boards = homeBoards(), programIndex = order.indexOf('announcements'), boardIndex = order.indexOf('questions'), boardsFirst = boardIndex >= 0 && programIndex >= 0 && boardIndex < programIndex;
            return T.render("screens/home-main-blocks-4", {
                value: (boardsFirst ? boards + primary : primary + boards)
            });
        }
        function home(variant) {
            if (variant === '2')
                return homeTwo();
            return T.render("screens/home", {
                globalSearchHtml: globalSearch(''), headHtml: head('기업의 성장을 함께 지원합니다', '사업공고', '사업 신청부터 기술애로 해결까지, 필요한 업무를 한곳에서 확인하세요.'), homeMainBlocksHtml: homeMainBlocks('1')
            });
        }
        // A second home concept shares the same data and existing business screens.
        function homeIcon(kind) {
            var paths = {
                search: T.render("screens/home-icon", {}),
                notice: T.render("screens/home-icon-2", {}),
                apply: T.render("screens/home-icon-3", {}),
                doctor: T.render("screens/home-icon-4", {}),
                document: T.render("screens/home-icon-5", {}),
                match: T.render("screens/home-icon-6", {}),
                help: T.render("screens/home-icon-7", {}),
                chat: T.render("screens/home-icon-8", {}),
                guide: T.render("screens/home-icon-9", {}),
                arrow: T.render("screens/home-icon-10", {}),
                chevron: T.render("screens/home-icon-11", {}),
                building: T.render("screens/home-icon-12", {}),
                phone: T.render("screens/home-icon-13", {})
            };
            return T.render("screens/home-icon-14", {
                value: (paths[kind] || paths.notice)
            });
        }
        function homeTwo() {
            return T.render("screens/home-two", {
                globalSearchHtml: globalSearch(''), headHtml: head('기업지원 사업공고', '사업공고'), homeMainBlocksHtml: homeMainBlocks('2'), homeIconHtml: homeIcon('doctor'), homeIconHtml2: homeIcon('arrow'), homeIconHtml3: homeIcon('chat'), homeIconHtml4: homeIcon('arrow')
            });
        }
        function doctors() {
            var f = ui.doctorFilters || {}, all = store.getState().doctors, list = store.searchDoctors(f), role = store.getSession().role;
            var form = T.render("screens/doctors", {
                fieldHtml: field('이름·소속기관·취득기술', 'q', f.q, 'text', 'rms-span2'), selectHtml: select('기관유형', 'institution', options('institution'), f.institution), selectHtml2: select('선정연도', 'year', [{
                        id: '', name: '전체'
                    }, {
                        id: '2026', name: '2026년'
                    }, {
                        id: '2025', name: '2025년'
                    }], f.year), selectHtml3: select('산업분야', 'industry', options('industry'), f.industry), selectHtml4: select('기술분야', 'technology', options('technology'), f.technology), selectHtml5: select('지원가능 지역', 'region', [{
                        id: '', name: '전국'
                    }].concat(codes('region').map(function (c) { return {
                    id: c.name, name: c.name
                }; })), f.region), selectHtml6: select('정렬', 'sort', [{
                        id: 'name', name: '이름순'
                    }, {
                        id: 'updated', name: '최근 갱신순'
                    }, {
                        id: 'organization', name: '소속기관순'
                    }, {
                        id: 'institution', name: '기관유형순'
                    }, {
                        id: 'technology', name: '기술분야순'
                    }, {
                        id: 'region', name: '등록지역순'
                    }], f.sort || 'name'), value: (f.available ? ' checked' : ''), value2: (f.stale ? ' checked' : ''), btnHtml: btn('초기화', 'doctor-reset')
            });
            var rows = list.map(function (d) { return T.render("screens/doctors-2", {
                name: d.name, id: d.id, value: (ui.selected.has(d.id) ? ' checked' : ''), id2: d.id, name2: d.name, year: d.year, organization: d.organization, nameHtml: name(d.institution), owner: d.owner, itemsHtml: d.technologies.map(name).join(', '), acquiredTechnology: d.acquiredTechnology, itemsHtml2: d.supportRegions.map(esc).join(' · '), badgeHtml: badge(d.available ? '지원가능' : '활동중지'), sliceHtml: d.updatedAt.slice(0, 10), value2: (store.isStale(d) ? T.render("screens/doctors-3", {
                    badgeHtml: badge('현행화 대상')
                }) : '')
            }); });
            return T.render("screens/doctors-4", {
                headHtml: head('기술닥터 통합검색', '기술닥터 › 통합검색', '지역의 경계를 넘어, 기업에 필요한 전문가를 찾아보세요.', role === 'tp' || role === 'admin' ? btn('기술닥터 등록', 'doctor-edit', '', 'rms-btn-primary') : ''), tabsHtml: tabs('doctors', 'doctor'), metricHtml: metric('전체 기술닥터', all.length), metricHtml2: metric('충남 지원가능', all.filter(function (d) { return d.supportRegions.includes('충남') && d.available; }).length), metricHtml3: metric('타지역 등록 전문가', all.filter(function (d) { return d.owner !== '충남'; }).length), metricHtml4: metric('정보 현행화 대상', all.filter(store.isStale).length), form: form, length: list.length, size: ui.selected.size, btnHtml: btn('선택 비교', 'compare', '', 'rms-btn-small'), value: (rows.length ? table('기술닥터 검색결과', ['비교', '기술닥터', '소속기관', '전문·취득기술', '지원가능 지역', '활동상태', '최종 갱신일'], rows) : empty('조건에 맞는 기술닥터가 없습니다. 검색조건을 변경해 주세요.'))
            });
        }
        function doctorDetail(id) {
            var d = store.getState().doctors.find(function (x) { return x.id === id; });
            if (!d)
                return head('기술닥터 정보') + empty('존재하지 않는 기술닥터입니다.');
            var session = store.getSession(), canEdit = session.role === 'admin' || session.role === 'tp' && d.owner === session.region;
            var fields = [['이름', d.name], ['소속기관', d.organization], ['기관유형', store.label(d.institution)], ['등록기관', d.owner + 'TP'], ['산업분야', store.label(d.industry)], ['선정연도', d.year + '년'], ['기술분야', d.technologies.map(store.label).join(', ')], ['지원가능 지역', d.supportRegions.join(' · ')], ['상담유형', d.consultations.map(store.label).join(', ')], ['학위정보', d.degree], ['취득기술', d.acquiredTechnology], ['활동상태', d.available ? '지원가능' : '활동중지'], ['주요경력', d.career], ['자격증·포상', d.certificates], ['선정사유', d.reasons.map(store.label).join(', ')], ['최종 갱신일', d.updatedAt.slice(0, 10)]];
            return T.render("screens/doctor-detail", {
                headHtml: head(d.name + ' 기술닥터', '기술닥터 › 상세정보', d.organization), tabsHtml: tabs('doctors', 'doctor'), badgeHtml: badge(d.available ? '지원가능' : '활동중지'), owner: d.owner, value: (canEdit ? '등록정보를 수정할 수 있습니다.' : '다른 등록기관의 정보는 조회만 가능합니다.'), itemsHtml: fields.map(function (f) { return T.render("screens/doctor-detail-2", {
                    fValue: f[0], fValue2: f[1]
                }); }).join(''), value2: (canEdit ? btn('등록정보 수정', 'doctor-edit', d.id) : ''), btnHtml: btn('매칭 요청', 'match-request', d.id, 'rms-btn-primary'), value3: (d.history.length ? table('기술닥터 변경이력', ['변경일시', '변경자', '변경 항목'], d.history.map(function (h) { return T.render("screens/doctor-detail-3", {
                    replaceHtml: h.at.slice(0, 19).replace('T', ' '), by: h.by, itemsHtml: h.changes.map(function (c) { return esc(c.field) + ': ' + esc(Array.isArray(c.before) ? c.before.join(', ') : c.before) + ' → ' + esc(Array.isArray(c.after) ? c.after.join(', ') : c.after); }).join(T.render("screens/doctor-detail-4", {}))
                }); }), true) : empty('등록정보를 수정하면 변경 전·후 값이 기록됩니다.'))
            });
        }
        function matches() {
            var s = store.getState(), r = store.getSession(), list = s.matches.filter(function (m) { return r.role === 'company' ? m.companyId === r.companyId : r.role === 'tp' ? m.region === r.region : r.role === 'admin'; });
            return head('매칭·지원 관리', '기술닥터 › 매칭·지원 관리', '초광역권 매칭 요청부터 기업지원 실적까지 확인합니다.') + tabs('matches', 'doctor') + (r.role === 'visitor' ? empty('사용자 역할에서 지원기업 또는 관리기관으로 전환해 주세요.') : T.render("screens/matches", {
                value: (list.length ? table('매칭 및 지원실적', ['요청일', '지원기업', '기술닥터', '기술애로', '지원구분', '진행상태', '처리'], list.map(function (m) {
                    var d = s.doctors.find(function (x) { return x.id === m.doctorId; });
                    return T.render("screens/matches-2", {
                        date: m.date, companyName: m.companyName, id: d.id, name: d.name, owner: d.owner, request: m.request, value: (m.result ? T.render("screens/matches-3", {
                            result: m.result
                        }) : ''), badgeHtml: badge(m.region !== d.owner ? '지역 간 매칭' : '지역 내 매칭'), badgeHtml2: badge(m.status), value2: ((r.role === 'tp' || r.role === 'admin') && m.status !== '지원완료' ? btn(m.status === '요청접수' ? '지원 시작' : '실적 등록', 'match-progress', m.id, 'rms-btn-small') : '—')
                    });
                })) : empty('등록된 매칭 요청이 없습니다. 기술닥터 검색에서 전문가를 선택하세요.'))
            }));
        }
        function statsData() {
            var s = store.getState(), f = ui.statsFilters || {}, doctors = s.doctors.filter(function (d) { return (!f.region || d.owner === f.region) && (!f.technology || d.technologies.includes(f.technology)) && (!f.industry || d.industry === f.industry); }), ids = new Set(doctors.map(function (d) { return d.id; })), matches = s.matches.filter(function (m) { return ids.has(m.doctorId) && (!f.start || m.date >= f.start) && (!f.end || m.date <= f.end); });
            return {
                doctors: doctors, matches: matches, rows: codes('region').map(function (c) {
                    var ds = doctors.filter(function (d) { return d.owner === c.name; }), di = new Set(ds.map(function (d) { return d.id; })), ms = matches.filter(function (m) { return di.has(m.doctorId); });
                    return {
                        region: c.name, registered: ds.length, active: ds.filter(function (d) { return d.available; }).length, matched: ms.length, completed: ms.filter(function (m) { return m.status === '지원완료'; }).length, cross: ms.filter(function (m) { return m.region !== c.name; }).length
                    };
                })
            };
        }
        function stats() {
            var f = ui.statsFilters || {}, v = statsData();
            return head('기술닥터 통계·성과', '기술닥터 › 통계·성과', '전문가 현황과 기간별 매칭·기업지원 실적을 확인합니다.') + tabs('stats', 'doctor') + (store.getSession().role === 'visitor' || store.getSession().role === 'company' ? empty('통계는 관리기관 또는 시스템 관리자 역할에서 확인할 수 있습니다.') : T.render("screens/stats", {
                selectHtml: select('등록지역', 'region', [{
                        id: '', name: '전국'
                    }].concat(codes('region').map(function (c) { return {
                    id: c.name, name: c.name
                }; })), f.region), selectHtml2: select('산업분야', 'industry', options('industry'), f.industry), selectHtml3: select('기술분야', 'technology', options('technology'), f.technology), fieldHtml: field('매칭 요청 시작일', 'start', f.start || '2026-01-01', 'date'), fieldHtml2: field('매칭 요청 종료일', 'end', f.end || '2026-12-31', 'date'), metricHtml: metric('등록 전문가', v.doctors.length), metricHtml2: metric('매칭 요청', v.matches.length, '건'), metricHtml3: metric('지원완료 실적', v.matches.filter(function (m) { return m.status === '지원완료'; }).length, '건'), metricHtml4: metric('지원완료 기업', new Set(v.matches.filter(function (m) { return m.status === '지원완료'; }).map(function (m) { return m.companyId; })).size, '개사'), itemsHtml: v.rows.map(function (r) { return T.render("screens/stats-2", {
                    region: r.region, registered: r.registered, maxHtml: Math.max(1, ...v.rows.map(function (x) { return x.registered; })), region2: r.region, registered2: r.registered, registered3: r.registered
                }); }).join(''), btnHtml: btn('CSV 내려받기', 'stats-export', '', 'rms-btn-small'), tableHtml: table('지역별 기술닥터 통계', ['등록지역', '등록 전문가', '활동 전문가', '매칭 요청', '지원완료', '지역 간 매칭'], v.rows.map(function (r) { return T.render("screens/stats-3", {
                    region: r.region, registered: r.registered, active: r.active, matched: r.matched, completed: r.completed, cross: r.cross
                }); }))
            }));
        }
        function receiptPanel(a, company, locked) {
            var manifest = root.RMSMydata ? root.RMSMydata.manifest : [], bundleId = a.mydataBundle || (manifest[0] || {}).id || '', label = (manifest.find(function (m) { return m.id === bundleId; }) || {}).label || bundleId;
            return T.render("screens/receipt-panel", {
                bundleId: bundleId, value: (!company || locked ? ' disabled' : ''), itemsHtml: manifest.filter(function (m) { return m.purpose === '신청'; }).map(function (m) { return T.render("screens/receipt-panel-2", {
                    id: m.id, value: (m.id === bundleId ? ' selected' : ''), label: m.label
                }); }).join(''), label: label, value2: (company && !locked ? T.render("screens/receipt-panel-3", {
                    id: a.id, value: (!a.consent ? ' disabled' : '')
                }) : ''), itemsHtml2: manifest.map(function (m) { return btn(m.label + ' 리포트', 'receipt-report', m.id, 'rms-btn-small'); }).join('')
            });
        }
        function receiptPage() { return T.render("screens/receipt-page", {
            headHtml: head('공공마이데이터 수신 리포트', '사업신청·관리 › XML 수신 리포트', '첨부된 수신 샘플 4개의 문서와 원문을 확인합니다.')
        }); }
        function documents(id, step) {
            var s = store.getState(), session = store.getSession(), apps = store.getApplications();
            if (session.role === 'visitor')
                return T.render("screens/documents", {
                    headHtml: head('사업신청 · 서류제출현황'), emptyHtml: empty('로그인하면 권한에 따라 신청서와 서류제출현황을 확인할 수 있습니다.'), btnHtml: btn('로그인', 'login', '', 'rms-btn-primary')
                });
            var a = apps.find(function (x) { return x.id === id; }) || apps[0];
            if (!a)
                return head('서류제출현황') + empty('조회 가능한 신청서가 없습니다.');
            ui.appId = a.id;
            var p = s.programs.find(function (x) { return x.id === a.programId; }), filtered = a.docs.filter(function (d) { return !ui.docStatus || d.status === ui.docStatus; }), company = session.role === 'company';
            step = ['1', '2', '3', '4'].includes(String(step)) ? String(step) : '3';
            var labels = ['사업 선택', '신청기업 정보', '접수서류 확인', '제출 및 보완'];
            var top = T.render("screens/documents-2", {
                headHtml: head(step === '3' ? '서류제출현황' : labels[Number(step) - 1], '사업신청 › ' + labels[Number(step) - 1], '신청기업과 관리기관이 같은 신청서와 서류 현황을 확인합니다.'), itemsHtml: labels.map(function (label, i) { return T.render("screens/documents-3", {
                    value: (step === String(i + 1) ? ' aria-current="step"' : ''), value2: (i + 1), value3: (step === String(i + 1) ? ' aria-current="step"' : ''), value4: (i + 1), label: label
                }); }).join('')
            });
            var locked = a.submission === '제출완료';
            if (step !== '1')
                top += receiptPanel(a, company, locked);
            if (step === '1')
                return T.render("screens/documents-4", {
                    top: top, companyName: a.companyName, title: p.title, itemsHtml: s.programs.map(function (program) {
                        var existing = apps.filter(function (x) { return x.programId === program.id; });
                        return T.render("screens/documents-5", {
                            title: program.title, region: program.region, category: program.category, start: program.start, end: program.end, end2: program.end, deadlineTime: program.deadlineTime, btnHtml: btn('사업 상세', 'program', program.id, 'rms-btn-small'), itemsHtml: existing.map(function (x) { return btn(x.companyName + ' 신청서 열기', 'application-open', x.id, 'rms-btn-small'); }).join(''), value: (company && !existing.length ? btn('신청하기', 'apply', program.id, 'rms-btn-primary') : '')
                        });
                    }).join(''), btnHtml: btn('다음: 신청기업 정보', 'document-step', '2', 'rms-btn-primary')
                });
            if (step === '2')
                return T.render("screens/documents-6", {
                    top: top, title: p.title, badgeHtml: badge(a.submission), value: (company && !locked ? '기업정보를 수정한 뒤 저장하세요. 단계 버튼으로 이동할 때도 저장합니다.' : '신청기업 정보를 조회합니다. ' + (locked ? '제출완료 신청서는 보완요청 후 수정할 수 있습니다.' : '기업정보 수정은 지원기업만 가능합니다.')), id: a.id, value2: (!company || locked ? ' disabled' : ''), fieldHtml: field('기업명 *', 'companyName', a.companyName), fieldHtml2: field('대표자 *', 'representative', a.representative), fieldHtml3: field('신청서 주소 *', 'inputAddress', a.inputAddress, 'text', 'rms-span2'), region: a.region, value3: (a.businessNumber ? ' · XML 사업자번호: ' + esc(a.businessNumber) : ''), btnHtml: btn('이전: 사업 선택', 'document-step', '1'), value4: (company && !locked ? T.render("screens/documents-7", {}) : ''), btnHtml2: btn('다음: 접수서류 확인', 'document-step', '3', 'rms-btn-primary')
                });
            if (step === '4') {
                var missing = p.requiredDocs.filter(function (id) {
                    var d = a.docs.find(function (x) { return x.specId === id; });
                    return !(d.status === '제출완료' || d.status === '조회완료' && a.consent);
                });
                return T.render("screens/documents-8", {
                    top: top, title: p.title, companyName: a.companyName, badgeHtml: badge(a.submission), value: (locked ? '신청서 제출이 완료되었습니다. 기관 검토 및 보완요청을 기다려 주세요.' : missing.length ? '필수서류 ' + missing.length + '건을 완료해야 제출할 수 있습니다.' : '필수서류가 준비되었습니다. 신청서를 제출할 수 있습니다.'), tableHtml: table('제출 및 보완 확인', ['서류명', '필수여부', '상태', '보완사항', '처리'], a.docs.filter(function (d) { return p.requiredDocs.includes(d.specId) || d.status === '보완필요'; }).map(function (d) {
                        var spec = s.documentTypes.find(function (x) { return x.id === d.specId; });
                        return T.render("screens/documents-9", {
                            name: spec.name, value: (p.requiredDocs.includes(d.specId) ? '필수' : '선택'), badgeHtml: badge(d.status), value2: d.reason || '—', btnHtml: btn(company && !locked ? '확인 / 보완' : '상세', 'doc-detail', d.specId, 'rms-btn-small'), value3: (!company ? btn('보완요청', 'supplement', d.specId, 'rms-btn-small') : '')
                        });
                    })), btnHtml: btn('이전: 접수서류 확인', 'document-step', '3'), value2: (company && !locked ? btn('임시저장', 'draft', a.id, 'rms-btn-save') + btn('신청서 제출', 'submit', a.id, 'rms-btn-primary') : '')
                });
            }
            return T.render("screens/documents-10", {
                top: top, selectHtml: select('신청기업 · 사업', 'application', apps.map(function (x) { return {
                    id: x.id, name: x.companyName + ' / ' + s.programs.find(function (y) { return y.id === x.programId; }).title
                }; }), a.id, 'rms-span2'), fieldHtml: field('신청서 상태', 'submission', a.submission), fieldHtml2: field('기업 소재지', 'companyRegion', a.region), title: p.title, badgeHtml: badge(a.submission), companyName: a.companyName, representative: a.representative, inputAddress: a.inputAddress, value: (company ? T.render("screens/documents-11", {
                    value: (a.consent ? ' checked' : ''), value2: (a.submission === '제출완료' ? ' disabled' : ''), title: p.title
                }) : T.render("screens/documents-12", {
                    value: (a.consent ? '동의함' : '동의하지 않음'), value2: (a.consentAt ? ' · ' + esc(a.consentAt.slice(0, 19).replace('T', ' ')) : '')
                })), value2: (company && !locked ? btn('필수서류 일괄확인', 'query-required', a.id, 'rms-btn-small rms-btn-primary') : ''), itemsHtml: ['', '미제출', '조회완료', '조회실패', '보완필요', '제출완료'].map(function (k) { return T.render("screens/documents-13", {
                    k: k, value: (ui.docStatus === k), value2: (k || '전체'), length: a.docs.filter(function (d) { return !k || d.status === k; }).length
                }); }).join(''), tableHtml: table('접수서류 목록', ['순번', '서류명 / 제공기관', '필수여부', '제출상태', '조회일시 / 첨부파일', '처리'], filtered.map(function (d, i) {
                    var spec = s.documentTypes.find(function (x) { return x.id === d.specId; }), required = p.requiredDocs.includes(d.specId), locked = a.submission === '제출완료';
                    return T.render("screens/documents-14", {
                        value: (i + 1), name: spec.name, provider: spec.provider, value2: (spec.active ? '' : ' · 연계 중지'), value3: (required ? T.render("screens/documents-15", {}) : '선택'), badgeHtml: badge(d.status), value4: (d.reason ? T.render("screens/documents-16", {
                            reason: d.reason
                        }) : ''), value5: (d.file ? T.render("screens/documents-17", {
                            name: d.file.name
                        }) : d.queriedAt ? esc(d.queriedAt.slice(0, 19).replace('T', ' ')) : '—'), btnHtml: btn('상세', 'doc-detail', d.specId, 'rms-btn-small'), value6: (d.receipt ? btn('수신 리포트', 'receipt-report', d.receipt.bundleId + '/' + d.receipt.documentCode, 'rms-btn-small') : ''), value7: (company && !locked ? btn(d.status === '조회실패' ? '재조회' : '조회', d.status === '조회실패' ? 'doc-retry' : 'doc-query', d.specId, 'rms-btn-small') : ''), value8: (!company ? btn('보완요청', 'supplement', d.specId, 'rms-btn-small') : '')
                    });
                })), btnHtml: btn('이전: 신청기업 정보', 'document-step', '2'), value3: (company && !locked ? btn('임시저장', 'draft', a.id, 'rms-btn-save') + btn('신청서 제출', 'submit', a.id, 'rms-btn-primary') : ''), btnHtml2: btn('다음: 제출 및 보완', 'document-step', '4', 'rms-btn-primary')
            });
        }
        function faq(questionsOnly) {
            var result = store.searchFaqs(ui.faqQuery, ui.faqWork);
            return T.render("screens/faq", {
                headHtml: head(questionsOnly ? '소통하기' : '자주하는 질문', '소통관리 › ' + (questionsOnly ? '소통하기' : 'FAQ'), '업무유형과 궁금한 내용을 함께 검색하세요.'), tabsHtml: tabs(questionsOnly ? 'questions' : 'faq', 'support'), selectHtml: select('업무유형', 'work', options('work'), ui.faqWork), faqQuery: ui.faqQuery, btnHtml: btn('초기화', 'faq-reset'), value: (questionsOnly ? questionTable(store.publicQuestions().filter(function (q) { return (!ui.faqWork || q.work === ui.faqWork) && (!ui.faqQuery || [q.title, q.answer].join(' ').includes(ui.faqQuery)); })) : T.render("screens/faq-2", {
                    value: (result.related ? '정확히 일치하는 항목이 없어 글자·키워드가 관련된 질문을 제안합니다.' : '검색결과 ' + result.items.length + '건'), faqListHtml: faqList(result.items)
                }))
            });
        }
        function manage(sub) {
            if (store.getSession().role !== 'admin')
                return head('관리자 설정') + empty('사용자 역할을 시스템 관리자로 전환해 주세요.');
            var s = store.getState(), active = sub ? 'manage/' + sub : 'manage', html = '';
            if (sub === 'home')
                html = T.render("screens/manage", {
                    itemsHtml: s.settings.homeOrder.filter(function (k) { return k !== 'help'; }).map(function (k, i) { return T.render("screens/manage-2", {
                        value: (k === 'announcements' ? T.render("screens/manage-3", {
                            value: (s.settings.homeVisible.announcements ? ' checked' : '')
                        }) : T.render("screens/manage-4", {})), btnHtml: btn('위로', 'home-up', k, 'rms-btn-small')
                    }); }).join(''), selectHtml: select('기존 분류', 'from', codes('work', true), s.classifications.find(function (c) { return c.kind === 'work'; }).id), selectHtml2: select('변경 분류', 'to', codes('work', true), 'W03'), tableHtml: table('게시물 노출 설정', ['제목', '공개여부', '메인 노출'], s.questions.map(function (q) { return T.render("screens/manage-5", {
                        title: q.title, badgeHtml: badge(q.public ? '공개' : '비공개'), id: q.id, value: (q.mainVisible ? ' checked' : ''), value2: (!q.public ? ' disabled' : '')
                    }); }), true)
                });
            else if (sub === 'documents')
                html = T.render("screens/manage-6", {
                    btnHtml: btn('대상 서류 추가', 'doc-type-edit', '', 'rms-btn-small rms-btn-primary'), tableHtml: table('증빙서류 대상 설정', ['코드', '서류명', '제공기관', '연계 사용', '관리'], s.documentTypes.map(function (d) { return T.render("screens/manage-7", {
                        id: d.id, name: d.name, provider: d.provider, badgeHtml: badge(d.active ? '사용' : '중지'), btnHtml: btn('수정', 'doc-type-edit', d.id, 'rms-btn-small')
                    }); }))
                });
            else {
                var kind = ui.codeKind || 'technology', list = s.classifications.filter(function (c) { return c.kind === kind; });
                html = T.render("screens/manage-8", {
                    btnHtml: btn('분류 추가', 'code-edit', '', 'rms-btn-small rms-btn-primary'), itemsHtml: Object.entries({
                        industry: '산업분야', technology: '기술분야', consultation: '상담유형', institution: '기관유형', region: '지원가능 지역', reason: '선정사유', work: '소통 업무유형'
                    }).map(function (x) { return T.render("screens/manage-9", {
                        xValue: x[0], value: (kind === x[0]), xValue2: x[1]
                    }); }).join(''), tableHtml: table('분류체계 관리', ['코드', '분류명', '상위분류', '사용', '노출', '관리'], list.map(function (c) { return T.render("screens/manage-10", {
                        id: c.id, name: c.name, nameHtml: name(c.parentId || '—'), badgeHtml: badge(c.active ? '사용' : '중지'), badgeHtml2: badge(c.visible ? '노출' : '숨김'), btnHtml: btn('수정', 'code-edit', c.id, 'rms-btn-small'), btnHtml2: btn('삭제', 'code-delete', c.id, 'rms-btn-small rms-btn-danger')
                    }); }))
                });
            }
            return head('관리자 설정', '관리자 › 기능개선 설정', '분류와 화면 노출, 연계 대상 서류를 관리합니다.') + tabs(active, 'manage') + html;
        }
        
        
        
        
        return {
            receiptPage: receiptPage, boards: boards, boardDetail: boardDetail, search: search, home: home, doctors: doctors, doctorDetail: doctorDetail, matches: matches, stats: stats, statsData: statsData, documents: documents, faq: faq, manage: manage, codes: codes, options: options, head: head
        };
    }
    root.RMSViews = {
        create: create, esc: esc, badge: badge, btn: btn, field: field, select: select, table: table, empty: empty
    };
}(window));
