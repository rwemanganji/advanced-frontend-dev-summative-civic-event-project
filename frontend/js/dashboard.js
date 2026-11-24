// Dashboard: admin stats with charts, or a personal summary for normal users.
const Dashboard = (function () {
  const num = v => Number(v || 0);

  // With a page name the whole card becomes a link to that page.
  function statCard(label, value, sub, iconName, page) {
    const body = `<div class="flex items-center gap-3 text-harbor">${UI.icon(iconName, 'w-6 h-6')}
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-700">${UI.esc(label)}</h2>
      ${page ? `<span class="stat-arrow ml-auto" aria-hidden="true">${UI.icon('down', 'w-4 h-4 -rotate-90')}</span>` : ''}</div>
      <p class="mt-2 text-3xl font-bold">${value}</p>${sub ? `<p class="mt-1 text-sm text-slate-700">${UI.esc(sub)}</p>` : ''}`;
    return page
      ? `<a href="${pageUrl(page)}" class="card stat-link block p-5">${body}</a>`
      : `<article class="card p-5">${body}</article>`;
  }

  // Data table for screen readers, shared by every chart.
  function srTable(caption, rows) {
    return `<table class="sr-only"><caption>${UI.esc(caption)}</caption><thead><tr><th scope="col">Item</th><th scope="col">Value</th></tr></thead>
      <tbody>${rows.map(([l, v]) => `<tr><th scope="row">${UI.esc(l)}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
  }

  // Horizontal bar chart built with plain divs.
  function barChart(title, rows, color = 'bg-harbor') {
    const max = Math.max(1, ...rows.map(r => r[1]));
    return `<figure class="card p-5"><figcaption class="text-lg font-semibold">${UI.esc(title)}</figcaption>
      <div class="mt-4 space-y-3" aria-hidden="true">${rows.map(([label, value]) => `<div>
        <div class="flex justify-between text-sm"><span>${UI.esc(label)}</span><span class="font-semibold">${value}</span></div>
        <div class="mt-1 h-3 rounded-full bg-mist"><div class="h-3 rounded-full ${color} transition-all duration-700" style="width:${(value / max) * 100}%"></div></div>
      </div>`).join('')}</div>${srTable(title, rows)}</figure>`;
  }

  // Column chart in inline SVG for new users per month.
  function columnChart(title, rows) {
    if (!rows.length) return `<figure class="card p-5"><figcaption class="text-lg font-semibold">${UI.esc(title)}</figcaption><p class="mt-4 text-slate-700">No signups in the last 6 months.</p></figure>`;
    const max = Math.max(1, ...rows.map(r => r[1]));
    const w = 60;
    const bars = rows.map(([label, value], i) => {
      const h = (value / max) * 140;
      return `<rect x="${i * w + 15}" y="${160 - h}" width="30" height="${h}" rx="4" fill="#105243"/>
        <text x="${i * w + 30}" y="${152 - h}" text-anchor="middle" font-size="12" font-weight="700" fill="#002428">${value}</text>
        <text x="${i * w + 30}" y="180" text-anchor="middle" font-size="11" fill="#002428">${UI.esc(label)}</text>`;
    }).join('');
    return `<figure class="card p-5"><figcaption class="text-lg font-semibold">${UI.esc(title)}</figcaption>
      <svg viewBox="0 0 ${rows.length * w} 190" class="mt-4 h-52 w-full" role="img" aria-label="${UI.esc(title)}: ${rows.map(r => `${r[0]} ${r[1]}`).join(', ')}">
        <line x1="0" y1="160" x2="${rows.length * w}" y2="160" stroke="#667C7E"/>${bars}</svg>${srTable(title, rows)}</figure>`;
  }

  const monthLabel = m => new Date(m + '-01T00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

  function renderAdmin(s, unread) {
    $('#stats').html([
      statCard('Events', num(s.events.total_events), `${num(s.events.upcoming_events)} upcoming, ${num(s.events.past_events)} past`, 'calendar', 'events'),
      statCard('Users', num(s.users.total_users), `${num(s.users.active_users)} active, ${num(s.users.inactive_users)} disabled`, 'user', 'admin-users'),
      statCard('Registrations', num(s.registrations.total_registrations), '', 'check', 'events'),
      statCard('Feedback', num(s.feedbacks.total_feedback), '', 'star', 'events'),
      statCard('Promos', num(s.promos.total_promos), '', 'film', 'promos'),
      statCard('Announcements', num(s.announcements.total_announcements), '', 'speaker', 'announcements'),
      statCard('Notifications', num(s.notifications.total_notifications), 'All notifications sent', 'bell', 'admin-notifications'),
      statCard('Unread for you', unread, 'Notifications you have not opened', 'info', 'notifications')
    ].join(''));
    $('#charts').html([
      barChart('Content and activity totals', [['Events', num(s.events.total_events)], ['Announcements', num(s.announcements.total_announcements)],
        ['Promos', num(s.promos.total_promos)], ['Registrations', num(s.registrations.total_registrations)], ['Feedback', num(s.feedbacks.total_feedback)]]),
      columnChart('New users per month', (s.user_growth || []).map(g => [monthLabel(g.month), num(g.new_users)])),
      barChart('User accounts by status', [['Active', num(s.users.active_users)], ['Disabled', num(s.users.inactive_users)]], 'bg-ink'),
      barChart('Events by timing', [['Upcoming', num(s.events.upcoming_events)], ['Past', num(s.events.past_events)]], 'bg-success')
    ].join(''));
  }

  function renderUser(s, unread) {
    $('#stats').html([
      statCard('Events registered', num(s.registrations.total_registered_events), '', 'calendar', 'my-registrations'),
      statCard('Feedback given', num(s.feedbacks.total_feedbacks), '', 'star', 'my-registrations'),
      statCard('Unread notifications', unread, `${num(s.notifications.total_notifications)} in total`, 'bell', 'notifications'),
      statCard('Announcements', num(s.announcements.total_announcements), '', 'speaker', 'announcements'),
      statCard('Promos', num(s.promos.total_promos), '', 'film', 'promos')
    ].join(''));
    $('#charts').html(`<section class="card p-5 lg:col-span-2" aria-labelledby="quick-title"><h2 id="quick-title" class="text-lg font-semibold">Quick links</h2>
      <div class="mt-4 flex flex-wrap gap-2"><a class="btn btn-primary" href="${pageUrl('events')}">Browse events</a>
      <a class="btn btn-secondary" href="${pageUrl('my-registrations')}">My registrations</a>
      <a class="btn btn-secondary" href="${pageUrl('announcements')}">Announcements</a><a class="btn btn-secondary" href="${pageUrl('promos')}">Promos</a></div></section>`);
  }

  // Admins read GET /dashboard/admin, normal users read GET /dashboard/me.
  // The backend also blocks /dashboard/admin for normal users, so this is just picking the right view.
  function load() {
    const admin = Auth.isAdmin();
    UI.loading($('#stats'), 4, 'h-28');
    $('#charts').empty();
    $.when(Api.get(admin ? '/dashboard/admin' : '/dashboard/me'), Notifs.load().catch(() => null)).then((res, notifs) => {
      $('#stats').removeAttr('aria-busy');
      const unread = notifs === null ? 'Unavailable' : Notifs.unreadCount();
      (admin ? renderAdmin : renderUser)(res.data, unread);
      $('#updated').text('Last updated ' + new Date().toLocaleTimeString(undefined, { timeStyle: 'short' }));
    }, err => UI.error($('#stats'), err, load));
  }

  function init() {
    const admin = Auth.isAdmin();
    $('#page-title').text(admin ? 'Admin dashboard' : `Welcome, ${Auth.getUser().full_name}`);
    $('#refresh').on('click', load);
    load();
    // Charts refresh every minute so numbers stay current.
    if (admin) setInterval(load, 60000);
  }

  return { init };
})();
