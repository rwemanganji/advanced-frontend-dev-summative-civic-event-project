// Change this one value if the backend runs on another host or port.
const API_BASE_URL = 'http://localhost:4000';
const API_URL = API_BASE_URL + '/api';

// Every page lives in the html/ folder. Change a file name here and all links and redirects follow.
const PAGES = {
  index: 'index.html',
  login: 'login.html',
  signup: 'signup.html',
  dashboard: 'dashboard.html',
  events: 'events.html',
  'event-detail': 'event-detail.html',
  'event-form': 'event-form.html',
  announcements: 'announcements.html',
  'announcement-detail': 'announcement-detail.html',
  'announcement-form': 'announcement-form.html',
  promos: 'promos.html',
  'promo-detail': 'promo-detail.html',
  'promo-form': 'promo-form.html',
  notifications: 'notifications.html',
  profile: 'profile.html',
  'my-registrations': 'my-registrations.html',
  'admin-users': 'admin-users.html',
  'admin-notifications': 'admin-notifications.html',
  accessibility: 'accessibility.html',
  403: '403.html',
  404: '404.html'
};

// Upload rules copied from backend/src/middlewares/upload.middleware.js.
const UPLOAD_RULES = {
  image: { exts: ['jpg', 'jpeg', 'png', 'gif'], maxMB: 2 },
  audio: { exts: ['mp3', 'wav', 'm4a', 'ogg'], maxMB: 5 },
  video: { exts: ['mp4', 'mov', 'avi', 'mkv'], maxMB: 100 }
};

// Builds a link to a page in html/, with optional query params. Pages sit side by side, so links are relative.
function pageUrl(name, params) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return PAGES[name] + query;
}
