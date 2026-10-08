/* @owner publisher | @since RMS-PUB-20261008-01
 * Only this adapter loads mock JSON/localStorage/XML. Production selects a different adapter. */
(function (root) {
    'use strict';
    root.RMSDemoAdapter = {
        open: async function (options) {
            options = options || {};
            var fetcher = options.fetch || fetch;
            var response = await fetcher('demo/data/seed.json');
            if (!response.ok)
                throw new Error('가상 초기자료를 읽을 수 없습니다.');
            var seed = await response.json(), storage, warning = '';
            var boardResponse = await fetcher('demo/data/boards.json');
            if (!boardResponse.ok)
                throw new Error('게시판 초기자료를 읽을 수 없습니다.');
            var boards = await boardResponse.json();
            try {
                storage = root.localStorage;
            }
            catch (error) {
                storage = null;
            }
            try {
                await root.RMSMydata.load({
                    fetch: fetcher
                });
            }
            catch (error) {
                warning = 'XML 수신 샘플을 읽지 못했습니다. ' + error.message;
            }
            root.RMSMydata.defaultBundleId = 'company-application';
            var store = root.RMSCore.createStore(seed, storage, root.RMSMydata);
            var getState = store.getState;
            store.getState = function () {
                var state = getState();
                state.boards = boards;
                return state;
            };
            var getSession=store.getSession;store.getSession=function(){var session=getSession();return Object.assign({},session,{displayName:({company:'가상 한빛정밀',tp:'충남TP 담당자',admin:'시스템 관리자'})[session.role]||''});};
            store.mode = 'demo';
            store.connectionWarning = warning || (!storage ? '브라우저 저장소를 사용할 수 없습니다. JSON 저장으로 변경사항을 보관해 주세요.' : '');
            return store;
        }
    };
}(window));
