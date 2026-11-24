// Notifications: bell count, slide-in drawer, inbox page and admin delete page.
// The backend has no "mark as read" endpoint, so read state is saved per user in localStorage.
const Notifs = (function () {
  let items = [];
  let releaseDrawer = null;

  const readKey = () => 'ce_read_' + ((Auth.getUser() || {}).id || '');
  function readIds() {
    try { return new Set(JSON.parse(localStorage.getItem(readKey()) || '[]')); } catch (e) { return new Set(); }
  }
  const isRead = n => n.read === true || readIds().has(n.id);
  const unreadCount = () => items.filter(n => !isRead(n)).length;

  // Loads notifications for the signed-in user (targeted and broadcast).
  function load() {
    return Api.get('/notifications').then(res => { items = res.data || []; updateBadge(); return items; });
  }

  function updateBadge() {
    const n = unreadCount();
    $('#bell-count').text(n).toggleClass('hidden', n === 0);
    $('#bell-btn').attr('aria-label', `Notifications, ${n} unread`);
  }

  // Optimistic: update the UI first, then save. Revert and warn if saving fails.
  function markRead(id) {
    const ids = readIds();
    if (ids.has(id)) return;
    $(`[data-notif="${id}"]`).each(function () { $(this).replaceWith(itemHtml(find(id), $(this).data('compact'), true)); });
    updateBadge();
    try {
      ids.add(id);
      localStorage.setItem(readKey(), JSON.stringify([...ids]));
      updateBadge();
    } catch (e) {
      $(`[data-notif="${id}"]`).each(function () { $(this).replaceWith(itemHtml(find(id), $(this).data('compact'), false)); });
      updateBadge();
      UI.toast('Could not mark this notification as read.', 'error');
    }
  }

  function markAllRead() {
    items.forEach(n => markRead(n.id));
  }

  const find = id => items.find(n => n.id === id);

  function relatedLink(n) {
    const m = n.metadata || {};
    if (m.event_id) return [pageUrl('event-detail', { id: m.event_id }), 'View event'];
    if (m.announcement_id) return [pageUrl('announcement-detail', { id: m.announcement_id }), 'Listen to announcement'];
    if (m.promo_id) return [pageUrl('promo-detail', { id: m.promo_id }), 'Watch promo'];
    return null;
  }

  function itemHtml(n, compact, forceRead) {
    const read = forceRead === undefined ? isRead(n) : forceRead;
    const status = read
      ? '<span class="badge badge-muted">Read</span>'
      : `<span class="badge badge-new">${UI.icon('bell', 'w-3.5 h-3.5')}New</span>`;
    return `<li data-notif="${n.id}" data-compact="${compact ? 1 : 0}">
      <button type="button" class="notif-item ${read ? 'bg-white' : 'notif-unread'}" data-open="${n.id}">
        <span class="flex flex-wrap items-center gap-2">${status}<span class="badge badge-muted">${UI.esc(n.type)}</span>
          <time class="text-xs text-slate-700" datetime="${n.created_at}">${UI.relativeTime(n.created_at)}</time></span>
        <span class="mt-1 block font-semibold">${UI.esc(n.title)}</span>
        <span class="block text-sm text-slate-700 ${compact ? 'line-clamp-2' : ''}">${UI.esc(n.message)}</span>
      </button></li>`;
  }

  function openDetail(id) {
    const n = find(id);
    if (!n) return UI.toast('That notification no longer exists.', 'error');
    markRead(id);
    const link = relatedLink(n);
    UI.openModal(n.title, `<p class="text-sm text-slate-700">${UI.esc(n.type)} &middot; ${UI.dateTime(n.created_at)}</p>
      <p class="mt-3 whitespace-pre-line">${UI.esc(n.message)}</p>`,
      link ? `<a class="btn btn-primary" href="${link[0]}">${link[1]}</a>` : '');
  }

  function renderList($list, list, compact) {
    if (!list.length) return UI.empty($list, 'No notifications', 'You are all caught up.');
    $list.removeAttr('aria-busy').html(list.map(n => itemHtml(n, compact)).join(''));
  }

  function drawerHtml() {
    return `<div id="drawer" class="fixed inset-0 z-50 hidden">
      <div class="absolute inset-0 bg-ink/50" data-drawer-close></div>
      <div role="dialog" aria-modal="true" aria-labelledby="drawer-title" class="drawer-panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-mist p-4">
          <h2 id="drawer-title" class="text-lg font-semibold">Notifications</h2>
          <button type="button" class="rounded-lg p-1 hover:bg-mist" data-drawer-close aria-label="Close notifications">${UI.icon('x')}</button>
        </div>
        <ul id="drawer-list" class="flex-1 space-y-2 overflow-y-auto p-4"></ul>
        <div class="flex gap-2 border-t border-mist p-4">
          <button type="button" class="btn btn-secondary flex-1" id="drawer-read-all">Mark all as read</button>
          <a class="btn btn-primary flex-1" href="${pageUrl('notifications')}">Open inbox</a>
        </div></div></div>`;
  }

  function openDrawer() {
    $('#drawer').removeClass('hidden');
    requestAnimationFrame(() => $('#drawer .drawer-panel').addClass('drawer-open'));
    $('#bell-btn').attr('aria-expanded', 'true');
    releaseDrawer = UI.trapFocus($('#drawer [role=dialog]'), closeDrawer);
    UI.loading($('#drawer-list'), 4, 'h-20');
    load().then(() => renderList($('#drawer-list'), items.slice(0, 15), true),
      err => UI.error($('#drawer-list'), err, openDrawer));
  }

  function closeDrawer() {
    if (releaseDrawer) releaseDrawer();
    releaseDrawer = null;
    $('#drawer .drawer-panel').removeClass('drawer-open');
    $('#drawer').addClass('hidden');
    $('#bell-btn').attr('aria-expanded', 'false').trigger('focus');
  }

  function initDrawer() {
    $('body').append(drawerHtml());
    $('#bell-btn').attr({ 'aria-controls': 'drawer', 'aria-expanded': 'false' }).on('click', openDrawer);
    $('#drawer').on('click', '[data-drawer-close]', closeDrawer)
      .on('click', '[data-open]', function () { const id = $(this).data('open'); closeDrawer(); openDetail(id); });
    $('#drawer-read-all').on('click', markAllRead);
    load().fail(() => $('#bell-btn').attr('aria-label', 'Notifications, count unavailable'));
  }

  // Inbox page: full list with All / Unread filter. ?id= opens one notification.
  function initInbox() {
    const $list = $('#inbox-list');
    const render = () => {
      const unreadOnly = $('input[name=filter]:checked').val() === 'unread';
      renderList($list, unreadOnly ? items.filter(n => !isRead(n)) : items, false);
    };
    const fetchAll = () => {
      UI.loading($list, 5, 'h-24');
      load().then(() => { render(); if (UI.param('id')) openDetail(UI.param('id')); }, err => UI.error($list, err, fetchAll));
    };
    $('input[name=filter]').on('change', render);
    $('#read-all').on('click', () => { markAllRead(); render(); });
    $list.on('click', '[data-open]', function () { openDetail($(this).data('open')); });
    fetchAll();
  }

  // Admin page: every notification with a delete button.
  function initAdmin() {
    const $list = $('#admin-notif-list');
    const render = () => {
      if (!items.length) return UI.empty($list, 'No notifications', 'New ones appear when content is published.');
      $list.removeAttr('aria-busy').html(items.map(n => `<li class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div class="flex-1"><p class="font-semibold">${UI.esc(n.title)}</p><p class="text-sm text-slate-700">${UI.esc(n.message)}</p>
        <p class="mt-1 text-xs text-slate-700">${UI.esc(n.type)} &middot; ${n.recipient_id ? 'Targeted' : 'Broadcast'} &middot; ${UI.dateTime(n.created_at)}</p></div>
        <button type="button" class="btn btn-danger" data-delete="${n.id}">${UI.icon('trash')}Delete<span class="sr-only"> ${UI.esc(n.title)}</span></button></li>`).join(''));
    };
    const fetchAll = () => { UI.loading($list, 4, 'h-20'); load().then(render, err => UI.error($list, err, fetchAll)); };
    $list.on('click', '[data-delete]', function () {
      const n = find($(this).data('delete'));
      UI.confirmDelete(n.title, '/notifications/' + n.id).then(done => {
        if (!done) return;
        items = items.filter(x => x.id !== n.id);
        updateBadge();
        render();
      });
    });
    fetchAll();
  }

  return { initDrawer, initInbox, initAdmin, load, unreadCount };
})();
