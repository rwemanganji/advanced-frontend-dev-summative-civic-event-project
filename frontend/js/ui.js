// Shared UI helpers: formatting, toasts, modals, loading, empty and error states.
const UI = (function () {
  const icon = Icons.icon;

  function esc(value) {
    return $('<div>').text(value == null ? '' : String(value)).html().replace(/"/g, '&quot;');
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  // Backend usually returns full URLs; relative /uploads paths get the API host.
  function mediaUrl(url) {
    if (!url) return '';
    return /^https?:\/\//.test(url) ? url : API_BASE_URL + (url.startsWith('/') ? '' : '/') + url;
  }

  function dateTime(iso) {
    if (!iso) return 'Date to be announced';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function date(iso) {
    return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';
  }

  function relativeTime(iso) {
    const seconds = Math.round((new Date(iso) - Date.now()) / 1000);
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return 'just now';
  }

  function duration(sec) {
    if (!isFinite(sec)) return '--:--';
    const s = Math.floor(sec);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  // Pass onRetry to add a Retry button (used for failed actions after a network error).
  function toast(message, type = 'success', onRetry) {
    let $region = $('#toast-region');
    if (!$region.length) {
      $region = $('<div id="toast-region" class="fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite"></div>').appendTo('body');
    }
    const styles = { success: ['bg-success', 'check', 'Success'], error: ['bg-danger', 'alert', 'Error'], info: ['bg-ink', 'info', 'Notice'] };
    const [bg, ic, label] = styles[type] || styles.info;
    const $t = $(`<div class="toast ${bg} flex items-start gap-3 rounded-xl p-4 text-white shadow-lg" ${type === 'error' ? 'role="alert"' : ''}>
      ${icon(ic)}<p class="flex-1 text-sm"><span class="font-semibold">${label}:</span> ${esc(message)}</p>
      <button type="button" class="rounded p-0.5 hover:bg-white/20" aria-label="Dismiss message">${icon('x', 'w-4 h-4')}</button></div>`);
    $t.find('button').on('click', () => $t.remove());
    if (onRetry) {
      $('<button type="button" class="rounded-lg border border-white px-2 py-1 text-sm font-semibold">Retry</button>')
        .insertAfter($t.find('p')).on('click', () => { $t.remove(); onRetry(); });
    }
    $region.append($t);
    setTimeout(() => $t.fadeOut(300, () => $t.remove()), 6000);
  }

  // Saves a toast to show after the next page load (used before redirects).
  function flash(message, type = 'success') {
    sessionStorage.setItem('ce_flash', JSON.stringify({ message, type }));
  }

  function showFlash() {
    const raw = sessionStorage.getItem('ce_flash');
    if (!raw) return;
    sessionStorage.removeItem('ce_flash');
    try { const f = JSON.parse(raw); toast(f.message, f.type); } catch (e) { /* ignore broken flash */ }
  }

  // Keeps Tab inside a dialog and closes it on Escape. Returns a function that removes the trap.
  function trapFocus($box, onEscape) {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const handler = e => {
      if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      const items = $box.find(sel).filter(':visible');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    $(document).on('keydown', handler);
    setTimeout(() => ($box.find(sel).filter(':visible')[0] || $box[0]).focus(), 30);
    return () => $(document).off('keydown', handler);
  }

  let modalState = null;

  function openModal(title, bodyHtml, footerHtml = '', onClose) {
    closeModal();
    const $m = $(`<div id="modal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-ink/60" data-close></div>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1" class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" class="text-xl font-semibold">${esc(title)}</h2>
          <button type="button" class="rounded-lg p-1 hover:bg-mist" data-close aria-label="Close dialog">${icon('x')}</button>
        </div>
        <div>${bodyHtml}</div>
        ${footerHtml ? `<div class="mt-6 flex flex-wrap justify-end gap-3">${footerHtml}</div>` : ''}
      </div></div>`).appendTo('body');
    modalState = { opener: document.activeElement, onClose, release: trapFocus($m.find('[role=dialog]'), closeModal) };
    $m.on('click', '[data-close]', closeModal);
    return $m;
  }

  function closeModal() {
    if (!modalState) return;
    const state = modalState;
    modalState = null;
    state.release();
    $('#modal').remove();
    if (state.onClose) state.onClose();
    if (state.opener && document.contains(state.opener)) state.opener.focus();
  }

  // Confirm dialog for destructive actions. Resolves true or false.
  function confirm(message, okText = 'Delete', danger = true) {
    return new Promise(resolve => {
      let answer = false;
      const footer = `<button type="button" class="btn btn-secondary" data-close>Cancel</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okText)}</button>`;
      const $m = openModal('Please confirm', `<p>${esc(message)}</p>`, footer, () => resolve(answer));
      $m.on('click', '[data-ok]', () => { answer = true; closeModal(); });
    });
  }

  function setBusy($btn, busy, text = 'Saving') {
    if (busy) {
      $btn.data('label', $btn.html()).prop('disabled', true).attr('aria-busy', 'true')
        .html(`<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity=".3"/><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" fill="none"/></svg>${esc(text)}...`);
    } else {
      $btn.prop('disabled', false).removeAttr('aria-busy').html($btn.data('label'));
    }
  }

  // Lists need an li wrapper so the markup stays valid.
  const wrap = ($el, html) => ($el.is('ul, ol') ? `<li class="col-span-full list-none">${html}</li>` : html);

  function loading($el, count = 6, height = 'h-72') {
    const blocks = Array.from({ length: count }, () => `<div class="skeleton rounded-xl ${height}" aria-hidden="true"></div>`).join('');
    $el.attr('aria-busy', 'true').html($el.is('ul, ol') ? `<li class="contents">${blocks}</li>` : blocks);
    $el.append(wrap($el, '<p class="sr-only" role="status">Loading...</p>'));
  }

  function empty($el, title, text, actionHtml = '') {
    $el.removeAttr('aria-busy').html(wrap($el, `<div class="col-span-full rounded-xl bg-mist p-8 text-center">
      ${icon('info', 'w-10 h-10 mx-auto text-harbor')}
      <h2 class="mt-3 text-lg font-semibold">${esc(title)}</h2><p class="mt-1 text-slate-700">${esc(text)}</p>
      ${actionHtml ? `<div class="mt-4">${actionHtml}</div>` : ''}</div>`));
  }

  // Error state for a failed load. 403 offers "Contact admin", 404 has no retry, others get Retry.
  function error($el, err, retry) {
    const e = typeof err === 'string' ? { message: err } : err;
    const titles = { 403: 'You do not have access to this', 404: 'Not found' };
    let action = retry ? `<button type="button" class="btn btn-primary mt-4" data-retry>${icon('refresh')}Retry</button>` : '';
    if (e.status === 403) action = '<a class="btn btn-primary mt-4" href="mailto:help@civicevents.example?subject=Access%20request">Contact admin</a>';
    if (e.status === 404) action = '';
    $el.removeAttr('aria-busy').html(wrap($el, `<div class="col-span-full rounded-xl border border-danger bg-white p-8 text-center" role="alert">
      ${icon('alert', 'w-10 h-10 mx-auto text-danger')}
      <h2 class="mt-3 text-lg font-semibold">${titles[e.status] || 'Could not load this content'}</h2><p class="mt-1 text-slate-700">${esc(e.message)}</p>
      ${action}</div>`));
    $el.find('[data-retry]').on('click', retry);
  }

  // Prev/next pager with page numbers. Pass showNumbers=false when the total is unknown.
  function pager($el, page, pages, onChange, showNumbers = true) {
    if (pages <= 1) return $el.empty();
    const btn = (p, label, extra = '', style = 'btn-ghost') => `<button type="button" class="btn ${style} px-3" data-page="${p}" ${extra}>${label}</button>`;
    let html = btn(page - 1, 'Previous', page <= 1 ? 'disabled' : '');
    if (showNumbers) {
      for (let p = 1; p <= pages; p++) {
        const current = p === page;
        html += btn(p, `<span class="sr-only">Page </span>${p}`, current ? 'aria-current="page"' : '', current ? 'btn-secondary' : 'btn-ghost');
      }
    }
    html += btn(page + 1, 'Next', page >= pages ? 'disabled' : '');
    $el.html(`<nav aria-label="Pagination" class="flex flex-wrap justify-center gap-2">${html}</nav>`);
    $el.find('[data-page]').on('click', function () { onChange(Number($(this).data('page'))); });
  }

  // Asks for confirmation, then deletes through the API. Resolves true when deleted.
  function confirmDelete(label, path) {
    return confirm(`Delete "${label}"? This cannot be undone.`).then(ok => {
      if (!ok) return false;
      const remove = () => Api.del(path).then(() => { toast(`"${label}" was deleted.`); return true; }, err => {
        toast(err.message, 'error', err.status === 0 ? remove : null);
        return false;
      });
      return remove();
    });
  }

  return {
    icon, esc, param, mediaUrl, dateTime, date, relativeTime, duration, toast, flash, showFlash,
    trapFocus, openModal, closeModal, confirm, setBusy, loading, empty, error, pager, confirmDelete
  };
})();
