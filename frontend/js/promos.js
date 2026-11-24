// Video promos: cached list, captioned player and admin create/edit form.
const Promos = (function () {
  const CACHE_KEY = 'ce_promos_cache';
  const CACHE_MS = 5 * 60 * 1000;
  const PER_PAGE = 9;
  let items = [];
  let page = 1;

  // Promo list cache. A multi-page site loses memory on every page load, so sessionStorage holds it.
  function cacheGet(p) {
    try {
      const entry = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}')[p];
      return entry && Date.now() - entry.time < CACHE_MS ? entry.res : null;
    } catch (e) { return null; }
  }
  function cacheSet(p, res) {
    try {
      const all = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
      all[p] = { time: Date.now(), res };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(all));
    } catch (e) { /* cache is optional */ }
  }
  const invalidate = () => sessionStorage.removeItem(CACHE_KEY);

  // Loads one page of promos, from cache when fresh.
  function fetchPage(p) {
    const hit = cacheGet(p);
    if (hit) return $.Deferred().resolve(hit).promise();
    return Api.get(`/promos?page=${p}&limit=${PER_PAGE}`).then(res => { cacheSet(p, res); return res; });
  }

  const statusBadge = p => (p.published
    ? `<span class="badge badge-success">${UI.icon('check', 'w-3.5 h-3.5')}Published</span>`
    : `<span class="badge badge-muted">${UI.icon('x', 'w-3.5 h-3.5')}Draft</span>`);

  function card(p) {
    // Role guard (UX only): admins see status, Edit and Delete.
    const admin = Auth.isAdmin()
      ? `${statusBadge(p)}<a class="btn btn-secondary" href="${pageUrl('promo-form', { id: p.id })}">${UI.icon('edit')}Edit<span class="sr-only"> ${UI.esc(p.title)}</span></a>
         <button type="button" class="btn btn-danger" data-delete="${p.id}">${UI.icon('trash')}Delete<span class="sr-only"> ${UI.esc(p.title)}</span></button>`
      : '';
    return `<article class="card flex flex-col overflow-hidden">
      <div class="relative flex h-44 items-center justify-center bg-ink text-white">
        <video class="absolute inset-0 h-full w-full object-cover" data-src="${UI.esc(UI.mediaUrl(p.video_url))}#t=0.5" preload="none" muted playsinline aria-hidden="true" tabindex="-1"></video>
        <span class="relative rounded-full bg-ink/70 p-3">${UI.icon('play', 'w-8 h-8')}</span>
      </div>
      <div class="flex flex-1 flex-col gap-2 p-5">
        <h2 class="text-lg font-semibold">${UI.esc(p.title)}</h2>
        <p class="line-clamp-3 text-sm text-slate-700">${UI.esc(p.description || '')}</p>
        <div class="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <a class="btn btn-primary" href="${pageUrl('promo-detail', { id: p.id })}">${UI.icon('play')}Play<span class="sr-only"> ${UI.esc(p.title)}</span></a>${admin}
        </div></div></article>`;
  }

  // Lazy thumbnails: only load video metadata when the card scrolls into view.
  function lazyThumbs() {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.preload = 'metadata';
      video.src = video.dataset.src;
      video.onerror = () => $(video).remove();
      observer.unobserve(video);
    }), { rootMargin: '200px' });
    $('video[data-src]').each(function () { observer.observe(this); });
  }

  function initList() {
    const $grid = $('#promo-grid');
    const load = () => {
      UI.loading($grid, 6, 'h-80');
      fetchPage(page).then(res => {
        // Normal users only see published promos.
        items = (res.data || []).filter(p => Auth.isAdmin() || p.published);
        UI.pager($('#pager'), page, (res.pagination || {}).pages || 1, p => { page = p; load(); });
        if (!items.length) return UI.empty($grid, 'No promos yet', 'New promo videos will appear here.');
        $grid.removeAttr('aria-busy').html(items.map(card).join(''));
        lazyThumbs();
      }, err => UI.error($grid, err, load));
    };
    $grid.on('click', '[data-delete]', function () {
      const p = items.find(x => x.id === $(this).data('delete'));
      UI.confirmDelete(p.title, '/promos/' + p.id).then(done => { if (done) { invalidate(); load(); } });
    });
    load();
  }

  // The API stores caption_text only, so build a WebVTT file in the browser, split by sentence.
  function captionsUrl(text, seconds) {
    const parts = (text.match(/[^.!?]+[.!?]*/g) || [text]).map(s => s.replace(/-->/g, '').trim()).filter(Boolean);
    const step = (isFinite(seconds) && seconds > 0 ? seconds : 60) / parts.length;
    const stamp = s => new Date(s * 1000).toISOString().slice(11, 23);
    const cues = parts.map((line, i) => `${i + 1}\n${stamp(i * step)} --> ${stamp((i + 1) * step)}\n${line}`).join('\n\n');
    return URL.createObjectURL(new Blob(['WEBVTT\n\n' + cues], { type: 'text/vtt' }));
  }

  function addCaptions(video, promo) {
    const src = promo.caption_url ? UI.mediaUrl(promo.caption_url) : (promo.caption_text ? captionsUrl(promo.caption_text, video.duration) : null);
    if (!src) return $('#caption-note').text('Captions are not available for this promo.');
    $(video).append(`<track kind="captions" srclang="en" label="English" src="${src}" default>`);
    if (video.textTracks[0]) video.textTracks[0].mode = 'showing';
    $('#caption-note').text('English captions are on. Use the captions button in the player to turn them off.');
  }

  function renderDetail(p) {
    document.title = p.title + ' | CivicEvents';
    $('#page-title').text(p.title);
    $('#crumb-current').text(p.title);
    const url = UI.esc(UI.mediaUrl(p.video_url));
    const admin = Auth.isAdmin() ? `${statusBadge(p)}
      <a class="btn btn-secondary" href="${pageUrl('promo-form', { id: p.id })}">${UI.icon('edit')}Edit</a>
      <button type="button" class="btn btn-danger" id="delete-btn">${UI.icon('trash')}Delete</button>` : '';
    $('#promo').removeAttr('aria-busy').html(`<video id="promo-video" controls playsinline preload="metadata" class="max-h-[70vh] w-full rounded-xl bg-ink object-contain" aria-label="Promo video: ${UI.esc(p.title)}" aria-describedby="transcript">
        <source src="${url}">
        <p class="p-4 text-white">Your browser cannot play this video. <a class="underline" href="${url}" download>Download the video</a>.</p>
      </video>
      <p id="caption-note" class="hint" role="status">Loading captions...</p>
      <p id="video-error" class="field-error hidden" role="alert">This video could not be loaded. <a class="link" href="${url}" download>Download it instead</a>.</p>
      <section class="mt-6" aria-labelledby="desc-title"><h2 id="desc-title" class="text-xl font-semibold">About this promo</h2>
        <p class="mt-2 whitespace-pre-line">${UI.esc(p.description || 'No description provided.')}</p></section>
      <section class="mt-6 rounded-xl bg-mist p-5" aria-labelledby="transcript-title"><h2 id="transcript-title" class="text-xl font-semibold">Transcript</h2>
        <p id="transcript" class="mt-2 whitespace-pre-line">${UI.esc(p.caption_text || 'No transcript has been provided for this promo.')}</p></section>
      <div class="mt-6 flex flex-wrap items-center gap-2">${admin}</div>`);
    const video = $('#promo-video')[0];
    $(video).one('loadedmetadata', () => addCaptions(video, p));
    $(video).find('source').on('error', () => { $('#video-error').removeClass('hidden'); $('#caption-note').text(''); });
    $('#delete-btn').on('click', () => UI.confirmDelete(p.title, '/promos/' + p.id).then(done => {
      if (done) { invalidate(); UI.flash(`"${p.title}" was deleted.`); location.href = pageUrl('promos'); }
    }));
  }

  function initDetail() {
    const id = UI.param('id');
    if (!id) return location.replace(pageUrl('404'));
    const load = () => {
      UI.loading($('#promo'), 1, 'h-80');
      Api.get('/promos/' + id).then(res => {
        // Normal users cannot open unpublished promos.
        if (!res.data.published && !Auth.isAdmin()) return location.replace(pageUrl('404'));
        renderDetail(res.data);
      }, err => (err.status === 404 ? location.replace(pageUrl('404')) : UI.error($('#promo'), err, load)));
    };
    load();
  }

  // Create needs a video under "video". Edit can replace the video or keep the current one.
  function initForm() {
    const id = UI.param('id');
    const $form = $('#promo-form');
    Forms.bindFile($('#video'), 'video', $('#video-preview'));
    if (id) {
      $('#page-title').text('Edit promo');
      document.title = 'Edit promo | CivicEvents';
      $('#video').prop('required', false);
      $('#video-hint').text('Optional. Leave empty to keep the current video. MP4, MOV, AVI or MKV, up to 100 MB.');
      Api.get('/promos/' + id).then(res => {
        ['title', 'description', 'caption_text'].forEach(k => $('#' + k).val(res.data[k] || ''));
        $('#published').prop('checked', !!res.data.published);
      }, err => Forms.apiError($form, err));
    }
    $form.on('submit', e => {
      e.preventDefault();
      Forms.clearErrors($form);
      if (!Forms.checkRequired($form)) return Forms.focusFirstError($form);
      const fd = new FormData();
      ['title', 'description', 'caption_text'].forEach(k => fd.append(k, $('#' + k).val().trim()));
      const published = $('#published').is(':checked');
      if (id) fd.append('published', published);
      const file = $('#video')[0].files[0];
      if (file) fd.append('video', file);

      const $btn = $form.find('[type=submit]');
      UI.setBusy($btn, true, 'Uploading');
      const onProgress = pct => Forms.progress($('#upload-progress'), pct);
      (id ? Api.put('/promos/' + id, fd, { onProgress }) : Api.post('/promos', fd, { onProgress }))
        // Create has no published field, so a draft is unpublished right after upload.
        .then(res => (!id && !published ? Api.patch(`/promos/${res.data.id}/unpublish`).then(() => res) : res))
        .then(res => {
          invalidate();
          UI.flash(id ? 'Promo updated.' : 'Promo uploaded. All users were notified.');
          location.href = pageUrl('promo-detail', { id: res.data.id });
        }, err => {
          UI.setBusy($btn, false);
          $('#upload-progress').addClass('hidden');
          Forms.apiError($form, err);
        });
    });
  }

  return { initList, initDetail, initForm };
})();
