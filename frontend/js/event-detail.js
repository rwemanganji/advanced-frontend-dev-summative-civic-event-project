// Event detail: full info, map link, registration, admin registrant list and feedback.
const EventDetail = (function () {
  function render(ev) {
    document.title = ev.title + ' | CivicEvents';
    $('#page-title').text(ev.title);
    $('#crumb-current').text(ev.title);
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.location || '');
    // Role guard (UX only): admins see Edit/Delete, normal users see Register/Cancel.
    const actions = Auth.isAdmin()
      ? `<a class="btn btn-secondary" href="${pageUrl('event-form', { id: ev.id })}">${UI.icon('edit')}Edit event</a>
         <button type="button" class="btn btn-danger" id="delete-event">${UI.icon('trash')}Delete event</button>`
      : Registrations.button(ev.id, ev.title);

    $('#event').removeAttr('aria-busy').html(`<div class="grid gap-8 lg:grid-cols-5">
      <div class="overflow-hidden rounded-xl lg:col-span-3">${EventsPage.image(ev, 'h-64 sm:h-80')}</div>
      <div class="flex flex-col gap-4 lg:col-span-2">
        <dl class="space-y-3 rounded-xl bg-mist p-5">
          <div><dt class="flex gap-2 font-semibold">${UI.icon('calendar')}Starts</dt><dd class="pl-7">${UI.dateTime(ev.starts_at)}</dd></div>
          <div><dt class="flex gap-2 font-semibold">${UI.icon('clock')}Ends</dt><dd class="pl-7">${UI.dateTime(ev.ends_at)}</dd></div>
          <div><dt class="flex gap-2 font-semibold">${UI.icon('pin')}Location</dt><dd class="pl-7">${UI.esc(ev.location || 'To be announced')}
            ${ev.location ? `<a class="link mt-1 flex items-center gap-1" href="${mapUrl}" target="_blank" rel="noopener">Open in Google Maps${UI.icon('external', 'w-4 h-4')}<span class="sr-only"> (opens in a new tab)</span></a>` : ''}</dd></div>
        </dl>
        <div class="flex flex-wrap gap-2">${actions}</div>
      </div></div>
      <section class="mt-8" aria-labelledby="about-title"><h2 id="about-title" class="text-xl font-semibold">About this event</h2>
        <p class="mt-2 whitespace-pre-line">${UI.esc(ev.description || 'No description provided.')}</p></section>`);

    $('#delete-event').on('click', () => UI.confirmDelete(ev.title, '/events/' + ev.id).then(done => {
      if (done) { UI.flash(`"${ev.title}" was deleted.`); location.href = pageUrl('events'); }
    }));
  }

  // Admin only: who registered (GET /event-registrations/event/:id/attendees).
  function loadRegistrants(id) {
    const $list = $('#registrant-list');
    UI.loading($list, 2, 'h-12');
    Api.get(`/event-registrations/event/${id}/attendees`).then(res => {
      const rows = res.data || [];
      $('#registrant-count').text(`${rows.length} registered`);
      if (!rows.length) return UI.empty($list, 'No registrations yet', 'People who register will appear here.');
      $list.removeAttr('aria-busy').html(`<div class="relative overflow-x-auto"><table class="w-full text-left text-sm">
        <caption class="sr-only">People registered for this event</caption>
        <thead class="bg-mist"><tr><th scope="col" class="p-3">Name</th><th scope="col" class="p-3">Email</th><th scope="col" class="p-3">Registered</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="border-b border-mist"><td class="p-3">${UI.esc(r.full_name)}</td><td class="p-3">${UI.esc(r.email)}</td><td class="p-3">${UI.dateTime(r.created_at)}</td></tr>`).join('')}</tbody>
      </table></div>`);
    }, err => UI.error($list, err, () => loadRegistrants(id)));
  }

  function load(id) {
    UI.loading($('#event'), 1, 'h-80');
    // Only normal users load their registrations (for Register/Cancel). Admins don't register.
    $.when(Api.get('/events/' + id), Auth.isAdmin() ? null : Registrations.loadMine()).then(res => {
      render(res.data);
      Feedback.init(id);
      // Role guard (UX only): only admins load the registrant list.
      if (Auth.isAdmin()) loadRegistrants(id);
    }, err => {
      if (err.status === 404) return location.replace(pageUrl('404'));
      UI.error($('#event'), err, () => load(id));
    });
  }

  function init() {
    const id = UI.param('id');
    if (!id) return location.replace(pageUrl('404'));
    Registrations.bindButtons($('#event'));
    load(id);
  }

  return { init };
})();
