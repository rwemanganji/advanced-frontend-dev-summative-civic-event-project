// My profile: read-only role and status, editable name and email.
const Profile = (function () {
  let current = null;

  function fill(user) {
    current = user;
    $('#full_name').val(user.full_name);
    $('#email').val(user.email);
    $('#role').text(user.role);
    $('#status').html(user.is_active
      ? `<span class="badge badge-success">${UI.icon('check', 'w-3.5 h-3.5')}Active</span>`
      : `<span class="badge badge-danger">${UI.icon('x', 'w-3.5 h-3.5')}Disabled</span>`);
    $('#joined').text(UI.date(user.created_at));
  }

  // Loads the signed-in user's profile (GET /users/profile/me).
  function load() {
    const $form = $('#profile-form');
    Api.get('/users/profile/me').then(res => fill(res.data), err => Forms.apiError($form, err));
  }

  // Sends only the fields that changed (PATCH /users/profile/me). Role and status are never sent.
  function save($form) {
    Forms.clearErrors($form);
    const full_name = $('#full_name').val().trim();
    const email = $('#email').val().trim();
    if (!full_name) Forms.setError($('#full_name'), 'Enter your full name.');
    if (!Forms.isEmail(email)) Forms.setError($('#email'), 'Enter a valid email address.');
    if ($form.find('[aria-invalid="true"]').length) return Forms.focusFirstError($form);

    const changes = {};
    if (full_name !== current.full_name) changes.full_name = full_name;
    if (email !== current.email) changes.email = email;
    if (!Object.keys(changes).length) return UI.toast('Nothing to save. Your profile is unchanged.', 'info');

    const $btn = $form.find('[type=submit]');
    UI.setBusy($btn, true);
    Api.patch('/users/profile/me', changes).then(res => {
      UI.setBusy($btn, false);
      fill(res.data);
      Auth.setUser(res.data);
      $('#profile-btn span').first().text(res.data.full_name);
      UI.toast('Your profile was updated.');
    }, err => {
      UI.setBusy($btn, false);
      if (err.status === 409) {
        Forms.setError($('#email'), 'This email is already used by another account. Please choose a different one.');
        err.message = 'That email address is already taken.';
      }
      Forms.apiError($form, err);
    });
  }

  function init() {
    $('#profile-form').on('submit', e => { e.preventDefault(); save($('#profile-form')); });
    load();
  }

  return { init };
})();
