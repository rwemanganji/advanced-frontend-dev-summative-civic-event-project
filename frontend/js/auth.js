// Token and user storage. "Remember me" uses localStorage, otherwise sessionStorage.
// Security tradeoff: localStorage survives restarts, but any XSS script on the page can read it.
// sessionStorage is cleared when the tab closes, so a stolen token is useful for less time.
const Auth = (function () {
  const TOKEN_KEY = 'ce_token';
  const USER_KEY = 'ce_user';
  let expiryTimer = null;

  function store() {
    return localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  }

  function clear() {
    [localStorage, sessionStorage].forEach(s => { s.removeItem(TOKEN_KEY); s.removeItem(USER_KEY); });
  }

  function save(token, user, remember) {
    clear();
    const s = remember ? localStorage : sessionStorage;
    s.setItem(TOKEN_KEY, token);
    // Keep the role so the UI knows if it should show admin pages and buttons.
    s.setItem(USER_KEY, JSON.stringify({ id: user.id, full_name: user.full_name, role: user.role }));
  }

  function setUser(user) {
    const current = getUser() || {};
    store().setItem(USER_KEY, JSON.stringify({ ...current, full_name: user.full_name }));
  }

  function getToken() {
    return store().getItem(TOKEN_KEY);
  }

  function getUser() {
    try { return JSON.parse(store().getItem(USER_KEY)); } catch (e) { return null; }
  }

  // Reads the exp claim from the JWT payload (milliseconds), or 0 if unreadable.
  function expiresAt() {
    try {
      const payload = getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload)).exp * 1000;
    } catch (e) { return 0; }
  }

  function isLoggedIn() {
    return !!getToken() && expiresAt() > Date.now();
  }

  // Role check used everywhere in the frontend: true only for a logged-in user whose role is 'admin'.
  function isAdmin() {
    const user = getUser();
    return isLoggedIn() && !!user && user.role === 'admin';
  }

  // Signs out automatically the moment the token expires.
  function watchExpiry() {
    clearTimeout(expiryTimer);
    const ms = expiresAt() - Date.now();
    if (ms > 0) expiryTimer = setTimeout(() => logout('Your session expired. Please log in again.', true), ms);
  }

  function logout(message, returnHere) {
    clear();
    sessionStorage.removeItem('ce_promos_cache');
    if (message) sessionStorage.setItem('ce_flash', JSON.stringify({ message, type: 'info' }));
    const next = returnHere ? { next: location.pathname.split('/').pop() + location.search } : null;
    location.replace(pageUrl('login', next));
  }

  return { save, setUser, getToken, getUser, isLoggedIn, isAdmin, watchExpiry, logout };
})();
