// One AJAX wrapper for every request: adds the token, handles errors, retries GETs once.
const Api = (function () {
  const NETWORK_MESSAGE = `Cannot reach the server at ${API_BASE_URL}. Make sure the backend is running (npm run dev in the backend folder) and that API_BASE_URL in js/config.js uses the same port.`;

  function errorFrom(xhr, textStatus) {
    const body = xhr.responseJSON || {};
    const status = xhr.status;
    const fields = (body.errors || []).map(e => ({ field: e.field || e.path, message: e.message || e.msg }));
    // Status 0 means no response at all: server down, wrong URL or blocked by the browser.
    if (status === 0) return { status, message: NETWORK_MESSAGE, fields };
    // A 2xx that is not JSON means API_BASE_URL points at the wrong server.
    if (status < 300 && textStatus === 'parsererror') {
      return { status, message: `The server at ${API_BASE_URL} did not answer like the CivicEvents API. Check API_BASE_URL in js/config.js.`, fields };
    }
    // No JSON message means something other than the CivicEvents API answered.
    if (!body.message) {
      return { status, message: `The server at ${API_BASE_URL} answered ${status} ${xhr.statusText || ''} instead of the CivicEvents API. Check API_BASE_URL in js/config.js.`, fields };
    }
    let message = body.message;
    if (status >= 500) message = 'Server error: ' + message;
    if (fields.length && message === 'Validation failed') message = fields.map(f => f.message).join(' ');
    return { status, message, fields };
  }

  function request(method, path, data, opts = {}) {
    const settings = { url: API_URL + path, method, dataType: 'json', headers: {} };
    // Login and signup are public, so they never send a token.
    const token = path.startsWith('/auth') ? null : Auth.getToken();
    if (token) settings.headers.Authorization = 'Bearer ' + token;

    if (data instanceof FormData) {
      Object.assign(settings, { data, processData: false, contentType: false });
    } else if (data) {
      Object.assign(settings, { data: JSON.stringify(data), contentType: 'application/json' });
    }

    if (opts.onProgress) {
      settings.xhr = function () {
        const xhr = $.ajaxSettings.xhr();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) opts.onProgress(Math.round((e.loaded / e.total) * 100));
        });
        return xhr;
      };
    }

    return $.ajax(settings).then(res => res, (xhr, textStatus) => {
      const err = errorFrom(xhr, textStatus);
      // Expired or invalid token: clear storage and send the user to login.
      if (err.status === 401 && token) Auth.logout('Your session expired. Please log in again.', true);
      // Network blip on a read: try one more time before failing.
      if (err.status === 0 && method === 'GET' && !opts.retried) {
        return request(method, path, data, { ...opts, retried: true });
      }
      return $.Deferred().reject(err).promise();
    });
  }

  // Checks the backend /health route (outside /api). Resolves true or false, never rejects.
  function ping() {
    return $.ajax({ url: API_BASE_URL + '/health', dataType: 'json', timeout: 5000 })
      .then(res => !!(res && res.ok), () => $.Deferred().resolve(false).promise());
  }

  return {
    get: (path) => request('GET', path),
    post: (path, data, opts) => request('POST', path, data, opts),
    put: (path, data, opts) => request('PUT', path, data, opts),
    patch: (path, data) => request('PATCH', path, data),
    del: (path) => request('DELETE', path),
    ping
  };
})();
