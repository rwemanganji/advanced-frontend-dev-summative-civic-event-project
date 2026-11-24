// Frontend guards are for UX only. The backend checks the token and role on every request,
// so it is the real security layer. Hiding a button here never replaces that check.

let guardFailed = false;

// Login guard: signed-out or expired users are sent to the login page.
function requireLogin() {
  if (Auth.isLoggedIn()) {
    Auth.watchExpiry();
    return true;
  }
  guardFailed = true;
  const hadToken = !!Auth.getToken();
  Auth.logout(hadToken ? 'Your session expired. Please log in again.' : 'Please log in to continue.', true);
  return false;
}

// Role guard: only admins can open the page; everyone else sees the 403 page.
function requireAdmin() {
  if (!requireLogin()) return false; // must be logged in first
  if (Auth.isAdmin()) return true;   // admin: allowed in
  // Normal user: stop the page code and send them to the 403 page.
  guardFailed = true;
  location.replace(pageUrl('403'));
  return false;
}

// Guest guard: users who are already logged in skip the login and signup pages.
function requireGuest() {
  if (!Auth.isLoggedIn()) return true;
  guardFailed = true;
  location.replace(pageUrl('dashboard'));
  return false;
}

// Role helper: shows [data-admin-only] markup to admins and removes it for normal users.
function applyRoleVisibility(root) {
  $(root || document).find('[data-admin-only]').each(function () {
    if (Auth.isAdmin()) $(this).removeClass('hidden'); // admin: show it
    else $(this).remove();                              // normal user: take it out of the page
  });
}

// Runs page code on DOM ready, but never after a guard has redirected away.
function onPage(fn) {
  $(function () { if (!guardFailed) fn(); });
}
