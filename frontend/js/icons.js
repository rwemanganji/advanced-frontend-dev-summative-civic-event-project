// Inline SVG icons (outline style). Always aria-hidden: pair them with visible text.
const Icons = (function () {
  const ICONS = {
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    pin: 'M17.66 16.66L13.41 20.9a2 2 0 01-2.83 0l-4.24-4.24a8 8 0 1111.32 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
    play: 'M6 4l14 8-14 8V4z',
    pause: 'M9 5v14M15 5v14',
    bell: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    check: 'M5 13l4 4L19 7',
    x: 'M6 18L18 6M6 6l12 12',
    alert: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    star: 'M11.48 3.5a.56.56 0 011.04 0l2.13 5.11 5.52.44c.5.04.7.66.32.99l-4.2 3.6 1.28 5.38a.56.56 0 01-.84.61L12 16.77l-4.73 2.86a.56.56 0 01-.84-.61l1.28-5.38-4.2-3.6a.56.56 0 01.32-.99l5.52-.44 2.13-5.11z',
    trash: 'M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-2-1.86L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z',
    plus: 'M12 4v16m8-8H4',
    refresh: 'M4 4v5h.6m15.3 2A8 8 0 004.6 9m0 0H9m11 11v-5h-.6m0 0a8 8 0 01-15.3-2m15.3 2H15',
    up: 'M5 15l7-7 7 7',
    down: 'M19 9l-7 7-7-7',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    speaker: 'M11 5L6 9H3v6h3l5 4V5zm5.5 3.5a5 5 0 010 7',
    eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.5 12C3.8 7.9 7.6 5 12 5s8.2 2.9 9.5 7c-1.3 4.1-5.1 7-9.5 7s-8.2-2.9-9.5-7z',
    eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c4.4 0 8.2 2.9 9.5 7a10.5 10.5 0 01-2.6 4M6.6 6.6A10.4 10.4 0 002.5 12c1.3 4.1 5.1 7 9.5 7 1.9 0 3.6-.5 5.1-1.4',
    film: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z'
  };

  function icon(name, cls = 'w-5 h-5', filled = false) {
    return `<svg class="${cls} shrink-0" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path stroke-linecap="round" stroke-linejoin="round" d="${ICONS[name]}"/></svg>`;
  }

  return { icon };
})();
