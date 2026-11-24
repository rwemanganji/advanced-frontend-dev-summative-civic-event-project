// Event registration buttons and the "My registrations" page.
const Registrations = (function () {
  let mine = [];

  // Loads the signed-in user's registrations (registered and cancelled).
  function loadMine() {
    return Api.get('/event-registrations/my-registrations').then(res => { mine = res.data || []; return mine; });
  }

  const statusFor = eventId => (mine.find(r => r.event_id === eventId) || {}).status || null;

  function setStatus(eventId, status) {
    const found = mine.find(r => r.event_id === eventId);
    if (found) found.status = status;
    else mine.push({ event_id: eventId, status });
  }

  // Button state follows the registration: Register, Cancel, or a cancelled note.
  function button(eventId, title) {
    const status = statusFor(eventId);
    let inner = `<button type="button" class="btn btn-primary" data-reg="register" data-title="${UI.esc(title)}">Register<span class="sr-only"> for ${UI.esc(title)}</span></button>`;
    if (status === 'registered') {
      inner = `<span class="badge badge-success">${UI.icon('check', 'w-3.5 h-3.5')}Registered</span>
        <button type="button" class="btn btn-secondary" data-reg="cancel" data-title="${UI.esc(title)}">Cancel registration<span class="sr-only"> for ${UI.esc(title)}</span></button>`;
    } else if (status === 'cancelled') {
      // The backend keeps cancelled rows and rejects a second registration for the same event.
      inner = `<span class="badge badge-muted">${UI.icon('x', 'w-3.5 h-3.5')}Registration cancelled</span>`;
    }
    return `<div class="flex flex-wrap items-center gap-2" data-reg-slot="${eventId}">${inner}</div>`;
  }

  function refreshSlot(eventId, title) {
    $(`[data-reg-slot="${eventId}"]`).replaceWith(button(eventId, title));
  }

  // Register for an event.
  function register(eventId) {
    return Api.post('/event-registrations/register', { event_id: eventId });
  }

  // Cancel a registration.
  function cancel(eventId) {
    return Api.post('/event-registrations/cancel', { event_id: eventId });
  }

  // Handles Register and Cancel clicks without reloading the page.
  function bindButtons($root, onChange) {
    $root.on('click', '[data-reg]', async function handle(e, confirmed) {
      const $btn = $(this);
      const eventId = $btn.closest('[data-reg-slot]').data('reg-slot');
      const title = $btn.data('title');
      const action = $btn.data('reg');
      if (action === 'cancel' && !confirmed && !(await UI.confirm(`Cancel your registration for "${title}"?`, 'Cancel registration'))) return;

      UI.setBusy($btn, true, action === 'register' ? 'Registering' : 'Cancelling');
      (action === 'register' ? register(eventId) : cancel(eventId)).then(() => {
        setStatus(eventId, action === 'register' ? 'registered' : 'cancelled');
        UI.toast(action === 'register' ? `You are registered for "${title}".` : 'Your registration was cancelled.');
        refreshSlot(eventId, title);
        if (onChange) onChange();
      }, err => {
        UI.setBusy($btn, false);
        const retry = err.status === 0 ? () => $btn.trigger('click', [true]) : null;
        UI.toast(err.status === 409 ? 'You already have a registration for this event.' : err.message, 'error', retry);
        if (err.status === 409) loadMine().then(() => refreshSlot(eventId, title));
      });
    });
  }

  // My registrations page.
  function initMyPage() {
    const $list = $('#my-regs');
    const load = () => {
      UI.loading($list, 3, 'h-28');
      loadMine().then(render, err => UI.error($list, err, load));
    };
    const render = () => {
      if (!mine.length) {
        return UI.empty($list, 'No registrations yet', 'Browse upcoming events and register for the ones you like.',
          `<a class="btn btn-primary" href="${pageUrl('events')}">Browse events</a>`);
      }
      const sorted = [...mine].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      $list.removeAttr('aria-busy').html(sorted.map(r => `<li class="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div class="flex-1">
          <h2 class="text-lg font-semibold"><a class="link" href="${pageUrl('event-detail', { id: r.event_id })}">${UI.esc(r.title)}</a></h2>
          <p class="mt-1 flex gap-2 text-sm">${UI.icon('calendar', 'w-4 h-4')}${UI.dateTime(r.starts_at)}</p>
          <p class="mt-1 flex gap-2 text-sm">${UI.icon('pin', 'w-4 h-4')}${UI.esc(r.location || 'Location to be announced')}</p>
        </div>${button(r.event_id, r.title)}</li>`).join(''));
    };
    bindButtons($list);
    load();
  }

  return { loadMine, button, bindButtons, initMyPage };
})();
