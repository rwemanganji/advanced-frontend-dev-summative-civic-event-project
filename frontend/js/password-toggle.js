// Show/hide eye buttons for password fields.
// The buttons are written in the HTML (data-password-toggle="<input id>"), and this file only
// switches them, so the eye is always visible even if another script fails to load.
(function () {
  const EYE = 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.5 12C3.8 7.9 7.6 5 12 5s8.2 2.9 9.5 7c-1.3 4.1-5.1 7-9.5 7s-8.2-2.9-9.5-7z';
  const EYE_OFF = 'M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c4.4 0 8.2 2.9 9.5 7a10.5 10.5 0 01-2.6 4M6.6 6.6A10.4 10.4 0 002.5 12c1.3 4.1 5.1 7 9.5 7 1.9 0 3.6-.5 5.1-1.4';

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-password-toggle]');
    if (!btn) return;
    const input = document.getElementById(btn.getAttribute('data-password-toggle'));
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.querySelector('path').setAttribute('d', show ? EYE_OFF : EYE);
    input.focus();
  });
})();
