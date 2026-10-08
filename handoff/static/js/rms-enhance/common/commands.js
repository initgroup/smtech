/* @owner publisher | @since RMS-PUB-20261008-01
 * Runs sync demo or async server commands through the same UI completion boundary.
 * onSuccess is never called on rejected writes. Repeated writes are blocked while pending.
 */
(function (root) {
    'use strict';
    root.RMSCommandRunner = {
        create: function (hooks) {
            var pending = false;
            return function run(work, message, keepModal, after) {
                if (pending) {
                    hooks.error(new Error('이전 요청을 처리하는 중입니다.'));
                    return false;
                }
                function done(value) {
                    if (!keepModal)
                        hooks.close();
                    hooks.render();
                    if (message)
                        hooks.toast(message);
                    if (after)
                        after(value);
                    return true;
                }
                function failed(error) {
                    hooks.error(error);
                    return false;
                }
                try {
                    var result = work();
                    if (!result || typeof result.then !== 'function')
                        return done(result);
                    pending = true;
                    hooks.busy(true);
                    return Promise.resolve(result).then(done, failed).catch(failed).finally(function () {
                        pending = false;
                        hooks.busy(false);
                    });
                }
                catch (error) {
                    return failed(error);
                }
            };
        }
    };
}(window));
