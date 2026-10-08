/* DEMO ONLY: never ship this module in the developer application package. */
(function (root) {
    'use strict';
    var T = root.RMSTemplates, C = root.RMSComponents, btn = C.btn, requirements = root.RMSRequirements;
    var sfrRoleNames = { company: '지원기업', tp: '관리기관 · 충남TP', admin: '시스템 관리자' };
    function sfrDestination(key) {
        var parts = String(key || '').split('/'), r = requirements.find(function (item) { return item.id === parts[0]; });
        return parts.length === 2 && r ? r.menus.find(function (menu) { return menu.id === parts[1]; }) : null;
    }
    function requirementCoverage(r) {
        var labels = {
            design: '디자인 컨셉', screen: '화면 구성·사용 흐름', technology: '적용 기술·동작', data: '데이터 처리·저장 구조'
        };
        return T.render("screens/requirement-coverage", {
            itemsHtml: r.menus.map(function (menu) {
                return T.render("screens/requirement-coverage-2", {
                    route: menu.route, value: r.id + '/' + menu.id, label: menu.label, content: menu.roles.length ? menu.roles.map(function (role) { return sfrRoleNames[role]; }).join(' / ') + ' · 권한이 없으면 로그인 팝업' : '공개 화면 · 로그인 없이 이동'
                });
            }).join(''), demo: r.demo, itemsHtml2: Object.keys(labels).map(function (key) {
                return T.render("screens/requirement-coverage-3", {
                    labelsValue: labels[key], itemValue: r.implementation[key]
                });
            }).join(''), itemsHtml3: r.followup.map(function (item) {
                return T.render("screens/requirement-coverage-4", {
                    item: item
                });
            }).join('')
        });
    }
    function create(views) {
        var head = views.head, activeSfr = [];
        function requirementsTable() {
            return T.render("screens/requirements-table", {
                btnHtml: btn('전체 펼침', 'requirements-expand', '', 'rms-btn-small'), btnHtml2: btn('전체 닫힘', 'requirements-collapse', '', 'rms-btn-small'), itemsHtml: requirements.map(function (r) {
                    return T.render("screens/requirements-table-2", {
                        id: r.id, id2: r.id, id3: r.id, name: r.name, demo: r.demo, definition: r.definition, itemsHtml: r.details.map(function (detail) {
                            return T.render("screens/requirements-table-3", {
                                detail: detail
                            });
                        }).join(''), requirementCoverageHtml: requirementCoverage(r)
                    });
                }).join('')
            });
        }
        function guide() {
            var groups = [['01', '기술닥터 통합검색', '지원기업 역할 → 복합 검색 → 최대 3명 비교 → 매칭 요청 → 충남TP에서 지원 시작·실적 등록 → 통계 CSV.', 'doctors'], ['02', '제출서류 간소화', '지원기업 역할 → XML 수신 묶음 선택 → 정보제공 동의 → 수신 확인·리포트 → 신청정보 반영 → 미수신·공란 파일 보완 → 제출 → 기관 보완요청.', 'documents'], ['03', '메인·소통 관리', '메인 FAQ 검색 → 업무별 질문 → 관리자 역할에서 분류·노출·배치 변경 → 메인에서 결과 확인.', 'manage/home']];
            return T.render("screens/guide", {
                headHtml: head('시연 안내', '시연 안내', '가상 데이터로 고객과 화면·처리 흐름을 검토하는 사전 개발본입니다.'), requirementsTableHtml: requirementsTable(), itemsHtml: groups.map(function (g) {
                    return T.render("screens/guide-2", {
                        gValue: g[0], gValue2: g[1], gValue3: g[2], gValue4: g[3]
                    });
                }).join('')
            });
        }
        function sfrMarkup() {
            var related = activeSfr.map(function (r) { return r.id; });
            return T.render("screens/sfr-markup", {
                itemsHtml: requirements.map(function (r) {
                    var active = related.includes(r.id), context = active ? '현재 메뉴 관련' : '다른 메뉴 요구사항';
                    return T.render("screens/sfr-markup-2", {
                        value: (active ? 'rms-sfr-highlight' : 'rms-sfr-inactive'), id: r.id, active: active, value2: r.id + ' · ' + r.name + ' · ' + context, value3: r.name + ' · ' + context, id2: r.id
                    });
                }).join('')
            });
        }
        return { guide: guide, markup: function (ids) { activeSfr = requirements.filter(function (r) { return ids.includes(Number(r.id.slice(4))); }); return sfrMarkup(); } };
    }
    root.RMSDemoViews = { create: create, requirementCoverage: requirementCoverage, sfrDestination: sfrDestination, sfrRoleNames: sfrRoleNames, requirement: function (id) { return requirements.find(function (r) { return r.id === id; }); } };
}(window));
