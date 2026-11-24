// Injects the shared skip link, navbar, admin sidebar, notification drawer and footer.
const Layout = (function () {
  const current = () => $('body').data('page');

  function navLink(page, label, extra = '') {
    const active = current() === page;
    return `<a href="${pageUrl(page)}" class="nav-link ${active ? 'nav-link-active' : ''}" ${active ? 'aria-current="page"' : ''} ${extra}>${label}</a>`;
  }

  // Same dashboard link for everyone: admins see site stats, normal users see their own.
  function userMenu(user) {
    return `<div class="relative" id="profile-menu">
      <button type="button" id="profile-btn" class="nav-link flex items-center gap-2" aria-expanded="false" aria-controls="profile-list">
        ${UI.icon('user')}<span class="max-w-[10rem] truncate">${UI.esc(user.full_name)}</span>${UI.icon('down', 'w-4 h-4')}
      </button>
      <ul id="profile-list" class="absolute right-0 z-40 mt-2 hidden w-56 rounded-xl border border-mist bg-white p-2 text-ink shadow-lg">
        <li><a class="menu-item" href="${pageUrl('dashboard')}">${Auth.isAdmin() ? 'Dashboard' : 'My dashboard'}</a></li>
        <li><a class="menu-item" href="${pageUrl('profile')}">My profile</a></li>
        <li><a class="menu-item" href="${pageUrl('my-registrations')}">My registrations</a></li>
        <li><button type="button" class="menu-item w-full text-left" id="logout-btn">Log out</button></li>
      </ul></div>`;
  }

  function header() {
    const user = Auth.isLoggedIn() ? Auth.getUser() : null;
    // Role guard (UX only): Dashboard and Admin links render for admins only.
    const adminLinks = Auth.isAdmin() ? navLink('dashboard', 'Dashboard') + navLink('admin-users', 'Admin') : '';
    const links = user
      ? navLink('events', 'Events') + navLink('announcements', 'Announcements') + navLink('promos', 'Promos') + adminLinks +
        `<button type="button" id="bell-btn" class="nav-link relative flex items-center gap-2" aria-label="Notifications">
          ${UI.icon('bell')}<span class="md:sr-only">Notifications</span>
          <span id="bell-count" class="hidden min-w-[1.25rem] rounded-full bg-marigold px-1.5 text-center text-xs font-bold text-ink"></span>
        </button>` + userMenu(user)
      : navLink('login', 'Log in') + `<a href="${pageUrl('signup')}" class="btn btn-primary">Sign up</a>`;
    const search = user ? `<form id="global-search" role="search" class="order-3 w-full md:order-none md:w-64 lg:w-80">
        <label for="global-q" class="sr-only">Search events by title</label>
        <div class="relative"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">${UI.icon('search', 'w-4 h-4')}</span>
        <input id="global-q" type="search" placeholder="Search events" class="input py-2 pl-9" value="${UI.esc(UI.param('q') || '')}"></div>
      </form>` : '';

    return `<a href="#main" class="skip-link">Skip to main content</a>
      <header class="sticky top-0 z-30 border-b-4 border-harbor bg-ink text-white shadow">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <a href="${pageUrl(user ? 'dashboard' : 'index')}" class="mr-auto flex items-center gap-2 rounded-lg text-lg font-bold">
            <img src="../assets/logo.png" alt="" class="brand-logo h-9 w-9" width="36" height="36">
            CivicEvents</a>
          ${search}
          <button type="button" id="menu-btn" class="nav-link md:hidden" aria-expanded="false" aria-controls="main-menu">${UI.icon('menu')}<span class="sr-only">Menu</span></button>
          <nav id="main-menu" aria-label="Main" class="hidden w-full flex-col gap-1 md:flex md:w-auto md:flex-row md:items-center">${links}</nav>
        </div>
      </header>`;
  }

  function adminSidebar() {
    const items = [['dashboard', 'Dashboard'], ['admin-users', 'Users'], ['admin-notifications', 'Notifications'],
      ['event-form', 'New event'], ['announcement-form', 'New announcement'], ['promo-form', 'New promo']];
    return `<nav aria-label="Admin" class="mb-6 md:mb-0 md:w-56 md:shrink-0">
      <p class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Admin</p>
      <ul class="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
        ${items.map(([p, l]) => `<li class="shrink-0">${navLink(p, l).replace('nav-link', 'side-link')}</li>`).join('')}
      </ul></nav>`;
  }

  function footer() {
    return `<footer class="mt-16 border-t border-mist bg-mist">
      <div class="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <section aria-labelledby="f-contact"><h2 id="f-contact" class="font-semibold">Contact</h2>
          <p class="mt-2">Email <a class="link" href="mailto:help@civicevents.example">help@civicevents.example</a></p></section>
        <section aria-labelledby="f-help"><h2 id="f-help" class="font-semibold">Help</h2>
          <ul class="mt-2 space-y-1"><li><a class="link" href="${pageUrl('events')}">Find events</a></li>
          <li><a class="link" href="${pageUrl('my-registrations')}">Manage registrations</a></li>
          <li><a class="link" href="${pageUrl('accessibility')}">Accessibility statement</a></li></ul></section>
        <p class="sm:text-right"><img src="../assets/logo.png" alt="" class="brand-logo mr-2 inline-block h-6 w-6 align-middle" width="24" height="24">&copy; ${new Date().getFullYear()} CivicEvents. City events and services for everyone.</p>
      </div></footer>
      <button type="button" id="to-top" class="btn btn-secondary fixed bottom-4 left-4 z-20 hidden shadow" aria-label="Back to top">${UI.icon('up')}</button>`;
  }

  function bindMenus() {
    $('#menu-btn').on('click', function () {
      const open = $(this).attr('aria-expanded') !== 'true';
      $(this).attr('aria-expanded', open);
      $('#main-menu').toggleClass('hidden', !open).toggleClass('flex', open);
    });
    const closeProfile = () => { $('#profile-list').addClass('hidden'); $('#profile-btn').attr('aria-expanded', 'false'); };
    $('#profile-btn').on('click', function (e) {
      e.stopPropagation();
      const open = $(this).attr('aria-expanded') !== 'true';
      $(this).attr('aria-expanded', open);
      $('#profile-list').toggleClass('hidden', !open);
      if (open) $('#profile-list a').first().trigger('focus');
    });
    $('#profile-menu').on('keydown', e => { if (e.key === 'Escape') { closeProfile(); $('#profile-btn').trigger('focus'); } });
    $(document).on('click', e => { if (!$(e.target).closest('#profile-menu').length) closeProfile(); });
    $('#logout-btn').on('click', () => Auth.logout('You have logged out.'));
    $('#global-search').on('submit', e => {
      e.preventDefault();
      location.href = pageUrl('events', { q: $('#global-q').val().trim() });
    });
    $(window).on('scroll', () => $('#to-top').toggleClass('hidden', window.scrollY < 600));
    $('#to-top').on('click', () => { window.scrollTo({ top: 0 }); $('#main').trigger('focus'); });
  }

  function init() {
    $('body').prepend(header());
    $('main').attr({ id: 'main', tabindex: '-1' });
    // Role guard (UX only): the admin sidebar is only injected for admins.
    if ($('#admin-shell').length && Auth.isAdmin()) $('#admin-shell').addClass('md:flex md:gap-8').prepend(adminSidebar());
    $('body').append(footer());
    applyRoleVisibility();
    bindMenus();
    if (Auth.isLoggedIn()) Notifs.initDrawer();
    UI.showFlash();
  }

  return { init };
})();

onPage(Layout.init);
