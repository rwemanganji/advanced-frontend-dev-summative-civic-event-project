// Events list (search, filters, pagination) and the admin create/edit form.
const EventsPage = (function () {
  const PER_PAGE = 6;
  let all = [];
  let page = 1;

  // Normal users only see published events. Admins see everything.
  const visible = ev => Auth.isAdmin() || ev.published !== false;

  function image(ev, cls) {
    const url = ev.metadata && ev.metadata.image_url;
    if (url) return `<img src="${UI.esc(UI.mediaUrl(url))}" alt="Photo for ${UI.esc(ev.title)}" loading="lazy" class="${cls} w-full object-cover">`;
    return `<div class="${cls} flex w-full items-center justify-center bg-mist text-harbor">${UI.icon('calendar', 'w-12 h-12')}</div>`;
  }

  function card(ev) {
    // Role guard (UX only): admins get Edit/Delete, normal users get Register.
    const actions = Auth.isAdmin()
      ? `<a class="btn btn-secondary" href="${pageUrl('event-form', { id: ev.id })}">${UI.icon('edit')}Edit<span class="sr-only"> ${UI.esc(ev.title)}</span></a>
         <button type="button" class="btn btn-danger" data-delete="${ev.id}">${UI.icon('trash')}Delete<span class="sr-only"> ${UI.esc(ev.title)}</span></button>`
      : Registrations.button(ev.id, ev.title);
    return `<article class="card flex flex-col overflow-hidden">
      ${image(ev, 'h-44')}
      <div class="flex flex-1 flex-col gap-2 p-5">
        ${ev.published === false ? '<span class="badge badge-muted self-start">Draft</span>' : ''}
        <h2 class="text-lg font-semibold">${UI.esc(ev.title)}</h2>
        <p class="flex gap-2 text-sm">${UI.icon('calendar', 'w-4 h-4')}<span>${UI.dateTime(ev.starts_at)}</span></p>
        <p class="flex gap-2 text-sm">${UI.icon('pin', 'w-4 h-4')}<span>${UI.esc(ev.location || 'Location to be announced')}</span></p>
        <p class="line-clamp-3 text-sm text-slate-700">${UI.esc(ev.description || '')}</p>
        <div class="mt-auto flex flex-wrap gap-2 pt-3">
          <a class="btn btn-ghost" href="${pageUrl('event-detail', { id: ev.id })}">View<span class="sr-only"> ${UI.esc(ev.title)}</span></a>${actions}
        </div></div></article>`;
  }

  function filtered() {
    const q = $('#f-search').val().trim().toLowerCase();
    const from = $('#f-date').val();
    const loc = $('#f-location').val();
    return all.filter(ev => visible(ev)
      && (!q || ev.title.toLowerCase().includes(q))
      && (!from || new Date(ev.starts_at) >= new Date(from + 'T00:00'))
      && (!loc || ev.location === loc));
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    page = Math.min(page, pages);
    $('#results-count').text(`${list.length} event${list.length === 1 ? '' : 's'} found`);
    UI.pager($('#pager'), page, pages, p => { page = p; render(); $('#results-count').trigger('focus'); });
    if (!list.length) return UI.empty($('#event-grid'), 'No events found', 'Try another search or clear the filters.');
    $('#event-grid').removeAttr('aria-busy').html(list.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(card).join(''));
  }

  function fillLocations() {
    const locations = [...new Set(all.filter(visible).map(ev => ev.location).filter(Boolean))].sort();
    $('#f-location').html('<option value="">All locations</option>' + locations.map(l => `<option>${UI.esc(l)}</option>`).join(''));
  }

  // Loads all events (the API returns every event at once, so filtering is done here).
  function load() {
    UI.loading($('#event-grid'), PER_PAGE, 'h-80');
    // Only normal users load their registrations (for Register/Cancel). Admins don't register.
    $.when(Api.get('/events'), Auth.isAdmin() ? null : Registrations.loadMine()).then(res => {
      all = res.data || [];
      fillLocations();
      render();
    }, err => UI.error($('#event-grid'), err, load));
  }

  function initList() {
    $('#f-search').val(UI.param('q') || '');
    $('#filters').on('submit', e => e.preventDefault()).on('input change', 'input, select', () => { page = 1; render(); });
    $('#f-clear').on('click', () => { $('#filters')[0].reset(); $('#f-search, #global-q').val(''); page = 1; render(); });
    Registrations.bindButtons($('#event-grid'));
    $('#event-grid').on('click', '[data-delete]', function () {
      const ev = all.find(x => x.id === $(this).data('delete'));
      UI.confirmDelete(ev.title, '/events/' + ev.id).then(done => {
        if (done) { all = all.filter(x => x.id !== ev.id); render(); }
      });
    });
    load();
  }

  // ISO string to the value format of a datetime-local input, in local time.
  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function fillForm(ev) {
    ['title', 'description', 'location'].forEach(k => $('#' + k).val(ev[k] || ''));
    $('#starts_at').val(toLocalInput(ev.starts_at));
    $('#ends_at').val(toLocalInput(ev.ends_at));
    const url = ev.metadata && ev.metadata.image_url;
    if (url) $('#current-image').html(`<p class="mb-2 text-sm">Current image:</p><img src="${UI.esc(UI.mediaUrl(url))}" alt="Current photo for ${UI.esc(ev.title)}" class="max-h-40 rounded-xl">`);
  }

  function validate($form) {
    Forms.clearErrors($form);
    Forms.checkRequired($form);
    const start = new Date($('#starts_at').val());
    const end = new Date($('#ends_at').val());
    if ($('#starts_at').val() && $('#ends_at').val() && end <= start) Forms.setError($('#ends_at'), 'End time must be after the start time.');
    const file = $('#image')[0].files[0];
    if (file && Forms.fileProblem(file, 'image')) Forms.setError($('#image'), Forms.fileProblem(file, 'image'));
    return !$form.find('[aria-invalid="true"]').length || Forms.focusFirstError($form);
  }

  // Create (POST) or update (PUT) an event as multipart/form-data with the image under "image".
  function save(id, $form) {
    const fd = new FormData();
    ['title', 'description', 'location'].forEach(k => fd.append(k, $('#' + k).val().trim()));
    fd.append('starts_at', new Date($('#starts_at').val()).toISOString());
    fd.append('ends_at', new Date($('#ends_at').val()).toISOString());
    const file = $('#image')[0].files[0];
    if (file) fd.append('image', file);

    const $btn = $form.find('[type=submit]');
    UI.setBusy($btn, true);
    const onProgress = pct => Forms.progress($('#upload-progress'), pct);
    const request = id ? Api.put('/events/' + id, fd, { onProgress }) : Api.post('/events', fd, { onProgress });
    request.then(res => {
      UI.flash(id ? 'Event updated.' : 'Event created and all users were notified.');
      location.href = pageUrl('event-detail', { id: res.data.id });
    }, err => {
      UI.setBusy($btn, false);
      $('#upload-progress').addClass('hidden');
      Forms.apiError($form, err);
    });
  }

  function initForm() {
    const id = UI.param('id');
    const $form = $('#event-form');
    if (id) {
      $('#page-title').text('Edit event');
      document.title = 'Edit event | CivicEvents';
      Api.get('/events/' + id).then(res => fillForm(res.data), err => {
        if (err.status === 404) location.replace(pageUrl('404'));
        else Forms.apiError($form, err);
      });
    }
    Forms.bindFile($('#image'), 'image', $('#image-preview'));
    $form.on('submit', e => {
      e.preventDefault();
      if (validate($form)) save(id, $form);
    });
  }

  return { initList, initForm, image };
})();
