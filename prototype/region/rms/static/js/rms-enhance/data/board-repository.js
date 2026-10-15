/* @owner publisher | @since RMS-PUB-20261008-01
 * Board view models only. Content comes from the selected repository snapshot. */
(function (root) {
    'use strict';
    var labels = {
        notice: '공지사항', qna: 'Q&A', faq: 'FAQ', resources: '자료실'
    };
    var types = ['notice', 'qna', 'faq', 'resources'];
    function list(type, store, includePrivate) {
        if (type === 'notice')
            return (store.getState().boards?.notice || []).slice();
        if (type === 'resources')
            return (store.getState().boards?.resources || []).slice();
        if (type === 'qna')
            return (includePrivate && store.accessibleQuestions ? store.accessibleQuestions() : store.publicQuestions()).map(function (q) { return Object.assign(root.RMSBoardSecurity.publicQuestion(q), {category:store.label(q.work)}); });
        if (type === 'faq')
            return store.searchFaqs('', '').items.map(function (q) { return {
                id: q.id, title: q.title, date: '상시', category: store.label(q.work), body: q.answer, work: q.work, keywords: q.keywords || []
            }; });
        return [];
    }
    root.RMSBoards = {
        labels: labels, types: types, list: list, get: function (type, id, store) { return list(type, store, true).find(function (row) { return row.id === id; }); }, all: function (store) { return types.reduce(function (rows, type) { return rows.concat(list(type, store).map(function (row) { return Object.assign({
            type: type
        }, row); })); }, []); }
    };
}(window));
