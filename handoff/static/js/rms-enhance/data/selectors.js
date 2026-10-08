/* @owner publisher | @since RMS-PUB-20261008-01
 * Pure UI queries on a server-authorized snapshot. No storage, writes, DOM or fetch.
 * These filters support display only; authorization and eligibility remain server responsibilities. */
(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports)
        module.exports = api;
    else
        root.RMSQueries = api;
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';
    var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
    function assert(ok, message) { if (!ok)
        throw new Error(message); }
    function validDate(value) {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
    }
    function programStatus(program, referenceDate) {
        var day = referenceDate || new Date().toISOString().slice(0, 10);
        assert(validDate(day) && validDate(program.start) && validDate(program.end), '공고 기준 날짜 오류');
        return {
            label: day < program.start ? '접수예정' : day > program.end ? '접수마감' : '모집중', state: day < program.start ? 'upcoming' : day > program.end ? 'closed' : 'open', daysLeft: Math.round((Date.parse(program.end + 'T00:00:00Z') - Date.parse(day + 'T00:00:00Z')) / 86400000)
        };
    }
    function create(read) {
        var state, session, seed;
        function refresh() {
            var snapshot = read();
            state = snapshot.state;
            session = snapshot.session;
            seed = state;
        }
        function label(id) {
            var c = state.classifications.find(function (x) { return x.id === id; });
            return c ? c.name : id;
        }
        function isStale(d) {
            var base = new Date(seed.demoDate + 'T00:00:00+09:00');
            base.setMonth(base.getMonth() - state.settings.staleMonths);
            return new Date(d.updatedAt) < base;
        }
        function searchDoctors(f) {
            f = f || {};
            var text = (f.q || '').toLowerCase().trim();
            return state.doctors.filter(function (d) { return (!text || [d.name, d.organization, d.acquiredTechnology].concat(d.technologies.map(label)).join(' ').toLowerCase().indexOf(text) >= 0) && (!f.region || d.supportRegions.indexOf(f.region) >= 0) && (!f.owner || d.owner === f.owner) && (!f.industry || d.industry === f.industry) && (!f.technology || d.technologies.indexOf(f.technology) >= 0) && (!f.institution || d.institution === f.institution) && (!f.year || d.year === f.year) && (!f.available || d.available) && (!f.stale || isStale(d)); }).sort(function (a, b) {
                if (f.sort === 'updated')
                    return b.updatedAt.localeCompare(a.updatedAt);
                if (f.sort === 'organization')
                    return a.organization.localeCompare(b.organization, 'ko');
                if (f.sort === 'institution')
                    return label(a.institution).localeCompare(label(b.institution), 'ko');
                if (f.sort === 'technology')
                    return a.technologies.map(label).join().localeCompare(b.technologies.map(label).join(), 'ko');
                if (f.sort === 'region')
                    return a.owner.localeCompare(b.owner, 'ko');
                return a.name.localeCompare(b.name, 'ko');
            });
        }
        var queries = {
            getState: function () { return clone(state); },
            getSession: function () { return clone(session); },
            programStatus: function (program) {
                var p = typeof program === 'string' ? state.programs.find(function (row) { return row.id === program; }) : program;
                assert(p, '사업공고를 찾을 수 없습니다.');
                return programStatus(p, state.demoDate);
            },
            visibleQuestions: function () { return state.questions.filter(function (q) { return q.public && q.mainVisible && state.classifications.some(function (c) { return c.id === q.work && c.kind === 'work' && c.active && c.visible; }); }).sort(function (a, b) { return b.date.localeCompare(a.date); }); },
            publicQuestions: function () { return state.questions.filter(function (q) { return q.public && state.classifications.some(function (c) { return c.id === q.work && c.kind === 'work' && c.active && c.visible; }); }).sort(function (a, b) { return b.date.localeCompare(a.date); }); },
            searchFaqs: function (query, work) {
                var q = (query || '').trim().toLowerCase();
                var allowed = state.classifications.filter(function (c) { return c.kind === 'work' && c.active && c.visible; }).map(function (c) { return c.id; });
                var all = state.faqs.filter(function (f) { return f.published && allowed.indexOf(f.work) >= 0 && (!work || f.work === work); });
                var direct = all.filter(function (f) { return [f.title, f.answer].concat(f.keywords).join(' ').toLowerCase().indexOf(q) >= 0; });
                if (direct.length || !q)
                    return {
                        items: direct, related: false
                    };
                var tokens = q.split(/\s+/).filter(Boolean);
                var related = all.map(function (f) {
                    var text = [f.title, f.answer].concat(f.keywords).join(' ').toLowerCase();
                    var score = tokens.reduce(function (n, t) { return n + (text.indexOf(t) >= 0 ? 3 : 0); }, 0);
                    for (var i = 0; i < q.length - 1; i++) {
                        if (text.indexOf(q.slice(i, i + 2)) >= 0)
                            score++;
                    }
                    return {
                        item: f, score: score
                    };
                }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4).map(function (x) { return x.item; });
                return {
                    items: related, related: true
                };
            },
            getApplications: function () {
                if (session.role === 'visitor')
                    return [];
                return clone(state.applications.filter(function (a) { return session.role === 'company' ? a.companyId === session.companyId : session.role === 'tp' ? a.region === session.region : true; }));
            },
            label: label,
            isStale: isStale,
            searchDoctors: searchDoctors
        };
        var result = {};
        Object.keys(queries).forEach(function (name) { result[name] = function () {
            refresh();
            return queries[name].apply(null, arguments);
        }; });
        return result;
    }
    return {
        create: create, programStatus: programStatus
    };
}));
