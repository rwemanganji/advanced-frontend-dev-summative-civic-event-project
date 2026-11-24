// Event feedback: one rating and comment per user, plus average and list for admins.
// The backend only lets admins read all feedback for an event, so normal users see their own.
const Feedback = (function () {
  let eventId = null;
  let mine = null;

  function stars(rating) {
    const icons = [1, 2, 3, 4, 5].map(n => `<span class="${n <= rating ? 'star-on' : 'star-off'}">${UI.icon('star', 'w-5 h-5')}</span>`).join('');
    return `<span class="inline-flex" role="img" aria-label="Rated ${rating} out of 5">${icons}</span>`;
  }

  function paintInput() {
    const value = Number($('input[name=rating]:checked').val() || 0);
    $('#stars label').each(function () {
      $(this).toggleClass('star-on', Number($(this).data('star')) <= value).toggleClass('star-off', Number($(this).data('star')) > value);
    });
    $('#rating-text').text(value ? `${value} out of 5 selected` : 'No rating selected');
  }

  function buildStarInput() {
    $('#stars').html([1, 2, 3, 4, 5].map(n => `<input type="radio" name="rating" id="rate-${n}" value="${n}" class="star-input sr-only">
      <label for="rate-${n}" data-star="${n}" class="star-off cursor-pointer rounded p-1">${UI.icon('star', 'w-8 h-8')}<span class="sr-only">${n} star${n > 1 ? 's' : ''}</span></label>`).join(''));
    $('#stars').on('change', 'input', paintInput);
    paintInput();
  }

  function showMine() {
    $('#feedback-form').toggleClass('hidden', !!mine);
    if (!mine) return $('#my-feedback').empty();
    $('#my-feedback').html(`<div class="rounded-xl bg-mist p-5">
      <h3 class="font-semibold">Your feedback</h3>
      <p class="mt-1">${stars(mine.rating)}</p>
      <p class="mt-2 whitespace-pre-line">${UI.esc(mine.comment || 'No comment.')}</p>
      <p class="hint">You can leave one feedback per event. You can still edit it.</p>
      <button type="button" class="btn btn-secondary mt-3" id="edit-feedback">${UI.icon('edit')}Edit my feedback</button></div>`);
    $('#edit-feedback').on('click', () => {
      $(`#rate-${mine.rating}`).prop('checked', true);
      $('#comment').val(mine.comment || '');
      paintInput();
      $('#my-feedback').empty();
      $('#feedback-form').removeClass('hidden').find('[type=submit]').text('Update feedback');
      $('#rate-' + mine.rating).trigger('focus');
    });
  }

  // Checks whether this user already left feedback for this event.
  function loadMine() {
    return Api.get('/event-feedback/my-feedback').then(res => {
      mine = (res.data || []).find(f => f.event_id === eventId) || null;
      showMine();
    }, err => UI.error($('#my-feedback'), err, loadMine));
  }

  // Admin only: average rating and every comment for this event.
  function loadAll() {
    const $list = $('#feedback-list');
    UI.loading($list, 2, 'h-20');
    Api.get(`/event-feedback/event/${eventId}`).then(res => {
      const rows = res.data || [];
      const avg = rows.length ? rows.reduce((s, f) => s + f.rating, 0) / rows.length : 0;
      $('#feedback-summary').html(rows.length
        ? `<p class="flex flex-wrap items-center gap-2 text-lg">${stars(Math.round(avg))}<strong>${avg.toFixed(1)} out of 5</strong><span class="text-slate-700">from ${rows.length} review${rows.length > 1 ? 's' : ''}</span></p>`
        : '<p>No ratings yet.</p>');
      if (!rows.length) return $list.empty();
      $list.removeAttr('aria-busy').html(rows.map(f => `<li class="card p-4"><article>
        <h3 class="font-semibold">${UI.esc(f.full_name)}</h3><p>${stars(f.rating)}</p>
        <p class="mt-1 whitespace-pre-line">${UI.esc(f.comment || 'No comment.')}</p>
        <p class="mt-1 text-xs text-slate-700">${UI.dateTime(f.created_at)}</p></article></li>`).join(''));
    }, err => UI.error($list, err, loadAll));
  }

  // Creates feedback (POST) or updates the user's existing feedback (PUT).
  function submit($form) {
    Forms.clearErrors($form);
    const rating = Number($('input[name=rating]:checked').val());
    const comment = $('#comment').val().trim();
    if (!rating) Forms.setError($('#rate-1'), 'Choose a rating from 1 to 5 stars.');
    if (comment.length > 500) Forms.setError($('#comment'), 'Keep your comment under 500 characters.');
    if ($form.find('[aria-invalid="true"]').length) return Forms.focusFirstError($form);

    const $btn = $form.find('[type=submit]');
    UI.setBusy($btn, true, 'Sending');
    const req = mine ? Api.put('/event-feedback/' + mine.id, { rating, comment }) : Api.post('/event-feedback', { event_id: eventId, rating, comment });
    req.then(res => {
      UI.setBusy($btn, false);
      mine = res.data;
      UI.toast('Thank you. Your feedback was saved.');
      showMine();
      // Admins also refresh the full feedback list (normal users can't load it).
      if (Auth.isAdmin()) loadAll();
    }, err => {
      UI.setBusy($btn, false);
      if (err.status === 409) { err.message = 'You already left feedback for this event.'; loadMine(); }
      Forms.apiError($form, err);
    });
  }

  function init(id) {
    eventId = id;
    buildStarInput();
    $('#feedback-form').on('submit', e => { e.preventDefault(); submit($('#feedback-form')); });
    loadMine();
    // Role guard (UX only): the full feedback list and average are admin-only in the API.
    if (Auth.isAdmin()) loadAll();
    else $('#feedback-summary').html('<p class="text-slate-700">Ratings from all attendees are shared with the event organizers.</p>');
  }

  return { init };
})();
