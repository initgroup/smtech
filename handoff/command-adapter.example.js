/* Integration pattern only. Not loaded by the demo; no URL is guessed or called here. */
(function (root) {
  'use strict';
  root.RMSCommandAdapterExample = {
    create: function (transport, routes) {
      if (typeof transport !== 'function') throw new Error('Validated existing RMS transport is required.');
      return {
        execute: async function (command, payload) {
          if (!Object.prototype.hasOwnProperty.call(routes, command)) throw new Error('Unmapped command: ' + command);
          // transport must return a Promise, reject on server/validation/session/timeout errors,
          // and apply the real context path, POST form encoding and AJAX header contract.
          const response = await transport({ route: routes[command], method: 'POST', data: payload });
          return response; // Map actual response DTOs at this boundary, not inside CSS/templates.
        }
      };
    }
  };
}(typeof window !== 'undefined' ? window : this));

/* Consumer example (implement in the existing business JS):
async function onSave(form) {
  saveButton.disabled = true;
  try {
    const dto = serializeAndValidate(form);
    const saved = await adapter.execute('saveDoctor', dto);
    renderServerResult(saved);
  } catch (error) {
    showExistingRmsError(error);
  } finally {
    saveButton.disabled = false;
  }
}
*/
