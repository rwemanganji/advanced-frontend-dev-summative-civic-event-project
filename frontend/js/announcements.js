// Audio announcements: list, detail player and admin create/edit form.
const Announcements = (function () {
  let items = [];

  const statusBadge = a => (a.published
    ? `<span class="badge badge-success">${UI.icon('check', 'w-3.5 h-3.5')}Published</span>`
    : `<span class="badge badge-muted">${UI.icon('x', 'w-3.5 h-3.5')}Draft</span>`);

  function card(a) {
    // Role guard (UX only): admins see status, Edit and Delete.
    const admin = Auth.isAdmin()
      ? `${statusBadge(a)}<a class="btn btn-secondary" href="${pageUrl('announcement-form', { id: a.id })}">${UI.icon('edit')}Edit<span class="sr-only"> ${UI.esc(a.title)}</span></a>
         <button type="button" class="btn btn-danger" data-delete="${a.id}">${UI.icon('trash')}Delete<span class="sr-only"> ${UI.esc(a.title)}</span></button>`
      : '';
    return `<article class="card flex flex-col gap-3 p-5">
      <div class="flex items-center gap-3"><span class="rounded-xl bg-mist p-3 text-harbor">${UI.icon('speaker', 'w-6 h-6')}</span>
        <h2 class="text-lg font-semibold">${UI.esc(a.title)}</h2></div>
      <p class="flex gap-2 text-sm">${UI.icon('clock', 'w-4 h-4')}<span>Length: <span data-length="${UI.esc(UI.mediaUrl(a.audio_url))}">loading</span></span></p>
      <p class="flex gap-2 text-sm">${UI.icon('calendar', 'w-4 h-4')}<span>Posted ${UI.date(a.created_at)}</span></p>
      <div class="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <a class="btn btn-primary" href="${pageUrl('announcement-detail', { id: a.id })}">${UI.icon('play')}Play<span class="sr-only"> ${UI.esc(a.title)}</span></a>${admin}
      </div></article>`;
  }

  // The API has no duration field, so read it from each file's metadata.
  function loadLengths() {
    $('[data-length]').each(function () {
      const $el = $(this);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => $el.text(UI.duration(audio.duration));
      audio.onerror = () => $el.text('unavailable');
      audio.src = $el.data('length');
    });
  }

  function initList() {
    const $grid = $('#announcement-grid');
    const load = () => {
      UI.loading($grid, 6, 'h-48');
      Api.get('/announcements?limit=100').then(res => {
        // Normal users only see published announcements.
        items = (res.data || []).filter(a => Auth.isAdmin() || a.published);
        if (!items.length) return UI.empty($grid, 'No announcements yet', 'New audio announcements will appear here.');
        $grid.removeAttr('aria-busy').html(items.map(card).join(''));
        loadLengths();
      }, err => UI.error($grid, err, load));
    };
    $grid.on('click', '[data-delete]', function () {
      const a = items.find(x => x.id === $(this).data('delete'));
      UI.confirmDelete(a.title, '/announcements/' + a.id).then(done => { if (done) load(); });
    });
    load();
  }

  function bindPlayer(audio) {
    const $toggle = $('#play-toggle');
    const update = () => $('#time-now').text(UI.duration(audio.currentTime));
    $(audio).on('loadedmetadata', () => $('#time-total').text(UI.duration(audio.duration)))
      .on('timeupdate', update)
      .on('play pause', () => $toggle.html(audio.paused ? `${UI.icon('play')}Play` : `${UI.icon('pause')}Pause`).attr('aria-pressed', !audio.paused))
      .on('error', () => $('#player-error').removeClass('hidden'));
    $toggle.on('click', () => (audio.paused ? audio.play() : audio.pause()));
    $('[data-skip]').on('click', function () { audio.currentTime = Math.max(0, audio.currentTime + Number($(this).data('skip'))); update(); });
  }

  function renderDetail(a) {
    document.title = a.title + ' | CivicEvents';
    $('#page-title').text(a.title);
    $('#crumb-current').text(a.title);
    const url = UI.esc(UI.mediaUrl(a.audio_url));
    const admin = Auth.isAdmin() ? `${statusBadge(a)}
      <a class="btn btn-secondary" href="${pageUrl('announcement-form', { id: a.id })}">${UI.icon('edit')}Edit</a>
      <button type="button" class="btn btn-danger" id="delete-btn">${UI.icon('trash')}Delete</button>` : '';
    $('#announcement').removeAttr('aria-busy').html(`<p class="text-slate-700">Posted ${UI.dateTime(a.created_at)}</p>
      <figure class="mt-4 rounded-xl bg-mist p-5">
        <figcaption id="audio-label" class="label">Listen to: ${UI.esc(a.title)}</figcaption>
        <audio id="player" controls preload="metadata" class="w-full" aria-labelledby="audio-label" src="${url}">
          <p>Your browser cannot play this audio. <a class="link" href="${url}" download>Download the audio file</a>.</p>
        </audio>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-primary" id="play-toggle" aria-pressed="false">${UI.icon('play')}Play</button>
          <button type="button" class="btn btn-secondary" data-skip="-10">Back 10 seconds</button>
          <button type="button" class="btn btn-secondary" data-skip="10">Forward 10 seconds</button>
          <p class="ml-auto font-mono"><span class="sr-only">Position: </span><span id="time-now">0:00</span> / <span id="time-total">--:--</span></p>
        </div>
        <p id="player-error" class="field-error hidden" role="alert">This audio file could not be loaded. <a class="link" href="${url}" download>Download it instead</a>.</p>
      </figure>
      <section class="mt-6" aria-labelledby="transcript-title"><h2 id="transcript-title" class="text-xl font-semibold">Transcript</h2>
        <p class="mt-2 whitespace-pre-line">${UI.esc(a.transcript || 'No transcript has been provided for this announcement.')}</p></section>
      <div class="mt-6 flex flex-wrap items-center gap-2">${admin}</div>`);
    bindPlayer($('#player')[0]);
    $('#delete-btn').on('click', () => UI.confirmDelete(a.title, '/announcements/' + a.id).then(done => {
      if (done) { UI.flash(`"${a.title}" was deleted.`); location.href = pageUrl('announcements'); }
    }));
  }

  function initDetail() {
    const id = UI.param('id');
    if (!id) return location.replace(pageUrl('404'));
    const load = () => {
      UI.loading($('#announcement'), 1, 'h-48');
      Api.get('/announcements/' + id).then(res => {
        // Normal users cannot open unpublished announcements.
        if (!res.data.published && !Auth.isAdmin()) return location.replace(pageUrl('404'));
        renderDetail(res.data);
      }, err => (err.status === 404 ? location.replace(pageUrl('404')) : UI.error($('#announcement'), err, load)));
    };
    load();
  }

  // Create sends the audio file under "audio". The backend ignores new audio on edit, so edit only changes title and status.
  function initForm() {
    const id = UI.param('id');
    const $form = $('#announcement-form');
    Forms.bindFile($('#audio'), 'audio', $('#audio-preview'));
    if (id) {
      $('#page-title').text('Edit announcement');
      document.title = 'Edit announcement | CivicEvents';
      $('#audio-group').addClass('hidden').find('input').prop('required', false);
      $('#audio-edit-note').removeClass('hidden');
      Api.get('/announcements/' + id).then(res => {
        $('#title').val(res.data.title);
        $('#published').prop('checked', !!res.data.published);
      }, err => Forms.apiError($form, err));
    }
    $form.on('submit', e => {
      e.preventDefault();
      Forms.clearErrors($form);
      if (!Forms.checkRequired($form)) return Forms.focusFirstError($form);
      const fd = new FormData();
      fd.append('title', $('#title').val().trim());
      fd.append('published', $('#published').is(':checked'));
      if (!id) fd.append('audio', $('#audio')[0].files[0]);

      const $btn = $form.find('[type=submit]');
      UI.setBusy($btn, true, 'Uploading');
      const onProgress = pct => Forms.progress($('#upload-progress'), pct);
      (id ? Api.put('/announcements/' + id, fd, { onProgress }) : Api.post('/announcements', fd, { onProgress })).then(res => {
        UI.flash(id ? 'Announcement updated.' : 'Announcement created. All users were notified.');
        location.href = pageUrl('announcement-detail', { id: res.data.id });
      }, err => {
        UI.setBusy($btn, false);
        $('#upload-progress').addClass('hidden');
        Forms.apiError($form, err);
      });
    });
  }

  return { initList, initDetail, initForm };
})();
