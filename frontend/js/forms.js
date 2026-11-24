// Form helpers: inline field errors, API errors, file checks and upload progress.
const Forms = (function () {
  const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Shows an error under a field and links it with aria-describedby.
  function setError($input, message) {
    const errorId = $input.attr('id') + '-error';
    let $msg = $('#' + errorId);
    if (!$msg.length) {
      const $anchor = $input.closest('[data-field]').length ? $input.closest('[data-field]') : $input;
      $msg = $(`<p id="${errorId}" class="field-error" aria-live="polite"></p>`).insertAfter($anchor);
    }
    $msg.text(message);
    const ids = ($input.attr('aria-describedby') || '').split(' ').filter(Boolean);
    if (!ids.includes(errorId)) ids.push(errorId);
    $input.attr({ 'aria-invalid': 'true', 'aria-describedby': ids.join(' ') });
  }

  function clearErrors($form) {
    $form.find('[aria-invalid]').removeAttr('aria-invalid');
    $form.find('.field-error').text('');
    $form.find('[data-form-error]').addClass('hidden').empty();
  }

  function focusFirstError($form) {
    $form.find('[aria-invalid="true"]').first().trigger('focus');
    return false;
  }

  // Shows the API message at the top of the form, plus any field errors. Network errors get a Retry button.
  function apiError($form, err) {
    (err.fields || []).forEach(f => {
      const $input = $form.find(`[name="${f.field}"]`);
      if ($input.length) setError($input, f.message);
    });
    const $box = $form.find('[data-form-error]');
    $box.removeClass('hidden').html(`<p class="flex gap-2">${UI.icon('alert')}<span>${UI.esc(err.message)}</span></p>`);
    if (err.status === 403) {
      $box.append('<a class="link mt-2 inline-block" href="mailto:help@civicevents.example?subject=Access%20request">Contact admin</a>');
    }
    if (err.status === 0) {
      $('<button type="button" class="btn btn-secondary mt-3">Retry</button>').appendTo($box)
        .on('click', () => $form.trigger('submit'));
    }
  }

  // Checks every [required] field is filled. Returns true when all are present.
  function checkRequired($form) {
    let ok = true;
    $form.find('[required]').each(function () {
      const $i = $(this);
      const empty = $i.is(':file') ? !this.files.length : !String($i.val() || '').trim();
      if (empty) { setError($i, `${$i.data('name') || 'This field'} is required.`); ok = false; }
    });
    return ok;
  }

  // Returns an error message for a bad file, or null when the file is fine.
  function fileProblem(file, kind) {
    const rule = UPLOAD_RULES[kind];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!rule.exts.includes(ext)) return `Please choose a ${rule.exts.join(', ').toUpperCase()} file.`;
    if (file.size > rule.maxMB * 1024 * 1024) return `This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${rule.maxMB} MB.`;
    return null;
  }

  // Validates a file input on change and shows a local preview.
  function bindFile($input, kind, $preview) {
    $input.on('change', function () {
      const file = this.files[0];
      $input.removeAttr('aria-invalid');
      $('#' + $input.attr('id') + '-error').text('');
      $preview.empty();
      if (!file) return;
      const problem = fileProblem(file, kind);
      if (problem) { this.value = ''; setError($input, problem); return; }
      const url = URL.createObjectURL(file);
      const tags = {
        image: `<img src="${url}" alt="Preview of the selected image" class="max-h-56 rounded-xl">`,
        audio: `<audio src="${url}" controls class="w-full" aria-label="Preview of the selected audio"></audio>`,
        video: `<video src="${url}" controls muted class="max-h-56 rounded-xl" aria-label="Preview of the selected video"></video>`
      };
      $preview.html(`<p class="mb-2 text-sm text-slate-700">Selected: ${UI.esc(file.name)}</p>${tags[kind]}`);
    });
  }

  // Adds a show/hide eye button to every password field inside $root.
  function passwordToggles($root) {
    $root.find('input[type=password]').each(function () {
      // Skip fields whose eye button is already written in the HTML (see password-toggle.js).
      if ($(this).siblings('[data-password-toggle]').length) return;
      const $input = $(this).addClass('pr-12');
      const $wrap = $('<div class="relative" data-field></div>');
      $input.wrap($wrap);
      const $btn = $(`<button type="button" class="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-harbor hover:bg-mist" aria-controls="${this.id}" aria-pressed="false" aria-label="Show password">${UI.icon('eye')}</button>`);
      $btn.insertAfter($input).on('click', () => {
        const show = $input.attr('type') === 'password';
        $input.attr('type', show ? 'text' : 'password');
        $btn.attr({ 'aria-pressed': show, 'aria-label': show ? 'Hide password' : 'Show password' }).html(UI.icon(show ? 'eyeOff' : 'eye'));
        $input.trigger('focus');
      });
    });
  }

  function progress($wrap, pct) {
    $wrap.removeClass('hidden');
    $wrap.find('[role=progressbar]').attr('aria-valuenow', pct).find('div').css('width', pct + '%');
    $wrap.find('[data-pct]').text(pct + '%');
  }

  return { isEmail, setError, clearErrors, focusFirstError, apiError, checkRequired, fileProblem, bindFile, passwordToggles, progress };
})();
