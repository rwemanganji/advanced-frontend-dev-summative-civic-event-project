// Login and signup pages.
const AuthForms = (function () {
  const RULES = [
    ['length', 'At least 8 characters', p => p.length >= 8],
    ['case', 'Upper and lower case letters', p => /[a-z]/.test(p) && /[A-Z]/.test(p)],
    ['number', 'At least one number', p => /\d/.test(p)],
    ['special', 'At least one special character', p => /[\W_]/.test(p)]
  ];

  // Only allow redirects back to our own pages after login.
  function safeNext() {
    const next = UI.param('next');
    return next && /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(next) ? next : pageUrl('dashboard');
  }

  // Warns right away if the backend is not reachable, before the user fills the form.
  function checkServer($form) {
    Api.ping().then(ok => {
      if (ok) return;
      Forms.apiError($form, { status: 0, message: `Cannot reach the server at ${API_BASE_URL}. Start the backend (npm run dev in the backend folder), then reload this page.` });
      $form.find('[data-form-error] button').remove();
    });
  }

  // Sends the login request and stores the token in the chosen storage.
  function initLogin() {
    const $form = $('#login-form');
    Forms.passwordToggles($form);
    checkServer($form);
    $form.on('submit', e => {
      e.preventDefault();
      Forms.clearErrors($form);
      const email = $('#email').val().trim();
      const password = $('#password').val();
      if (!Forms.isEmail(email)) Forms.setError($('#email'), 'Enter a valid email address.');
      if (!password) Forms.setError($('#password'), 'Enter your password.');
      if ($form.find('[aria-invalid="true"]').length) return Forms.focusFirstError($form);

      const $btn = $form.find('[type=submit]');
      UI.setBusy($btn, true, 'Logging in');
      Api.post('/auth/login', { email, password }).then(res => {
        Auth.save(res.data.token, res.data.user, $('#remember').is(':checked'));
        // The login API does not check if an admin disabled the account, so check the profile here.
        // Disabled account: sign out straight away. If the check itself fails, carry on as normal.
        Api.get('/users/profile/me').then(me => (me.data && me.data.is_active === false ? 'disabled' : 'ok'), () => 'ok').then(state => {
          if (state === 'disabled') return Auth.logout('This account has been disabled. Please contact an administrator.');
          UI.flash(`Welcome back, ${res.data.user.full_name}.`);
          location.href = safeNext();
        });
      }, err => {
        UI.setBusy($btn, false);
        Forms.apiError($form, err);
      });
    });
  }

  function updateStrength() {
    const pwd = $('#password').val();
    const passed = RULES.filter(([, , test]) => test(pwd)).length;
    const levels = [['Too weak', 'bg-danger'], ['Weak', 'bg-danger'], ['Fair', 'bg-coral'], ['Good', 'bg-harbor'], ['Strong', 'bg-success']];
    const [label, color] = levels[passed];
    $('#strength-bar').attr('class', `h-2 rounded-full transition-all ${color}`).css('width', (passed / RULES.length) * 100 + '%');
    $('#strength-text').text(pwd ? `Password strength: ${label}` : 'Password strength: not set');
    RULES.forEach(([key, text, test]) => {
      const ok = test(pwd);
      $(`#rule-${key}`).attr('class', `flex items-center gap-2 ${ok ? 'text-success' : 'text-slate-700'}`)
        .html(`${UI.icon(ok ? 'check' : 'x', 'w-4 h-4')}<span>${text}<span class="sr-only">${ok ? ' (met)' : ' (not met)'}</span></span>`);
    });
    return passed === RULES.length;
  }

  function signupReady() {
    const strong = updateStrength();
    const match = $('#confirm_password').val() === $('#password').val() && $('#password').val() !== '';
    $('#match-text').text($('#confirm_password').val() ? (match ? 'Passwords match.' : 'Passwords do not match.') : '');
    $('#signup-btn').prop('disabled', !(strong && match));
    return strong && match;
  }

  // Creates the account. Role is never sent, so every signup is a normal user.
  function initSignup() {
    const $form = $('#signup-form');
    Forms.passwordToggles($form);
    checkServer($form);
    $form.on('input', '#password, #confirm_password', signupReady);
    signupReady();
    $form.on('submit', e => {
      e.preventDefault();
      Forms.clearErrors($form);
      const data = { full_name: $('#full_name').val().trim(), email: $('#email').val().trim(), password: $('#password').val() };
      if (!data.full_name) Forms.setError($('#full_name'), 'Enter your full name.');
      if (!Forms.isEmail(data.email)) Forms.setError($('#email'), 'Enter a valid email address.');
      if (!signupReady()) Forms.setError($('#password'), 'Use a strong password and make sure both passwords match.');
      if ($form.find('[aria-invalid="true"]').length) return Forms.focusFirstError($form);

      const $btn = $('#signup-btn');
      UI.setBusy($btn, true, 'Creating account');
      Api.post('/auth/signup', data).then(() => {
        UI.flash('Account created. Please log in.');
        location.href = pageUrl('login');
      }, err => {
        UI.setBusy($btn, false);
        if (err.status === 409) Forms.setError($('#email'), 'An account with this email already exists.');
        Forms.apiError($form, err);
      });
    });
  }

  return { initLogin, initSignup };
})();
