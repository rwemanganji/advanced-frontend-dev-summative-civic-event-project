// Admin user management: list, view, enable and disable. No role editing, by design.
const Users = (function () {
  const LIMIT = 10;
  let page = 1;
  let rows = [];

  const statusBadge = u => (u.is_active
    ? `<span class="badge badge-success">${UI.icon('check', 'w-3.5 h-3.5')}Active</span>`
    : `<span class="badge badge-danger">${UI.icon('x', 'w-3.5 h-3.5')}Disabled</span>`);

  function row(u) {
    const self = u.id === Auth.getUser().id;
    const toggle = self ? '<span class="text-sm text-slate-700">This is you</span>'
      : `<button type="button" class="btn ${u.is_active ? 'btn-danger' : 'btn-secondary'}" data-toggle="${u.id}">${u.is_active ? 'Disable' : 'Enable'}<span class="sr-only"> ${UI.esc(u.full_name)}</span></button>`;
    return `<tr class="border-b border-mist" data-user-row="${u.id}">
      <td class="p-3 font-semibold">${UI.esc(u.full_name)}</td><td class="p-3">${UI.esc(u.email)}</td>
      <td class="p-3 capitalize">${UI.esc(u.role)}</td><td class="p-3">${statusBadge(u)}</td><td class="p-3">${UI.date(u.created_at)}</td>
      <td class="p-3"><div class="flex flex-wrap gap-2"><button type="button" class="btn btn-ghost" data-view="${u.id}">View<span class="sr-only"> ${UI.esc(u.full_name)}</span></button>${toggle}</div></td></tr>`;
  }

  // Lists users, one page at a time (the API does not return a total).
  function load() {
    const $body = $('#user-rows');
    $body.html(`<tr><td colspan="6" class="p-3"><div class="skeleton h-40 rounded-xl" aria-hidden="true"></div><span class="sr-only" role="status">Loading users...</span></td></tr>`);
    Api.get(`/users?page=${page}&limit=${LIMIT}`).then(res => {
      rows = res.data || [];
      if (!rows.length) $body.html('<tr><td colspan="6" class="p-6 text-center">No users found.</td></tr>');
      else $body.html(rows.map(row).join(''));
      UI.pager($('#pager'), page, rows.length === LIMIT ? page + 1 : page, p => { page = p; load(); }, false);
    }, err => {
      $body.html('<tr><td colspan="6" id="user-error"></td></tr>');
      UI.error($('#user-error'), err, load);
    });
  }

  // Shows one user from GET /users/:id.
  function view(id) {
    Api.get('/users/' + id).then(res => {
      const u = res.data;
      UI.openModal(u.full_name, `<dl class="grid grid-cols-3 gap-2 text-sm">
        <dt class="font-semibold">Email</dt><dd class="col-span-2 break-all">${UI.esc(u.email)}</dd>
        <dt class="font-semibold">Role</dt><dd class="col-span-2 capitalize">${UI.esc(u.role)}</dd>
        <dt class="font-semibold">Status</dt><dd class="col-span-2">${statusBadge(u)}</dd>
        <dt class="font-semibold">Joined</dt><dd class="col-span-2">${UI.dateTime(u.created_at)}</dd>
        <dt class="font-semibold">Updated</dt><dd class="col-span-2">${UI.dateTime(u.updated_at)}</dd></dl>
        <p class="hint mt-4">Roles cannot be changed from the interface.</p>`);
    }, err => UI.toast(err.message, 'error', err.status === 0 ? () => view(id) : null));
  }

  // Enables or disables a user after confirmation (PATCH /users/:id/enable or /disable).
  function toggle(id, $btn) {
    const u = rows.find(r => r.id === id);
    const action = u.is_active ? 'disable' : 'enable';
    const send = () => {
      UI.setBusy($btn, true, action === 'disable' ? 'Disabling' : 'Enabling');
      Api.patch(`/users/${id}/${action}`).then(res => {
        Object.assign(u, res.data);
        $(`[data-user-row="${id}"]`).replaceWith(row(u));
        UI.toast(`${u.full_name} is now ${u.is_active ? 'active' : 'disabled'}.`);
      }, err => { UI.setBusy($btn, false); UI.toast(err.message, 'error', err.status === 0 ? send : null); });
    };
    UI.confirm(`${action === 'disable' ? 'Disable' : 'Enable'} the account for ${u.full_name}?`, action === 'disable' ? 'Disable' : 'Enable', action === 'disable')
      .then(ok => { if (ok) send(); });
  }

  function init() {
    $('#user-rows').on('click', '[data-view]', function () { view($(this).data('view')); })
      .on('click', '[data-toggle]', function () { toggle($(this).data('toggle'), $(this)); });
    load();
  }

  return { init };
})();
