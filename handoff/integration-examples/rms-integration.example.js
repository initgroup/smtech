/* INTERNAL STARTER — copy once into your intranet-owned source.
 * @since RMS-PUB-20261008-01 | Not loaded by the public prototype.
 * Replace the illustrative .do URLs and decode your controller's response here.
 * Load after adapters/http.js and before app.js. Never edit publisher app.js for endpoints.
 */
(function (window) {
    'use strict';
    var routes = {bootstrap: '/rms/publisher/bootstrap.do'};
    Object.keys(window.RMSCommands).forEach(function (command) {
        routes[command] = '/rms/publisher/' + command + '.do';
    });
    var request = window.RMSHttpAdapter.transport({
        routes: routes,
        headers: function () {
            var token = document.querySelector('meta[name="csrf-token"]');
            return token ? {'X-CSRF-TOKEN': token.content} : {};
        },
        // Map your resultCode/resultMsg/data envelope to the documented DTO.
        // Business failures must throw; success must return contractVersion/state/session/result.
        decode: function (response) {
            if (response.error) throw new Error(response.error.message);
            return response;
        }
    });
    window.RMSIntegration = {
        mode: 'server',
        adapter: window.RMSHttpAdapter.create({request: request}),
        login: function () { window.location.assign('/login.do'); },
        // Implement the intranet's authorized logout flow, including POST/CSRF where required.
        logout: function () { window.location.assign('/logout-confirm.do'); }
    };
}(window));
