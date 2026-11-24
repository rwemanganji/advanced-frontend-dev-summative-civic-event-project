# CivicEvents Frontend

## Project Overview

CivicEvents is a city events and services portal. Residents can find and register for local events, leave feedback, listen to audio announcements, watch promo videos with captions and receive notifications. Administrators manage all of this content, along with user accounts, from a dashboard.

This folder contains the frontend: the pages people use in the browser. It has no server of its own. All data comes from the provided Node.js and PostgreSQL backend in `../backend`.

## Features

- **Authentication:** sign up with a live password strength check, log in, "Remember me", show/hide password, and automatic logout when the session expires.
- **Events:** browse, search, filter by date and location, and page through events. Admins create, edit and delete events with an image.
- **Registrations:** register for an event or cancel, and see everything you signed up for on "My registrations".
- **Feedback:** rate an event from 1 to 5 stars with an optional comment, and edit it later. Admins see every review and the average rating.
- **Announcements:** audio announcements with a player (play/pause, skip, time display). Admins upload, edit, delete and save drafts.
- **Promos:** promo videos with English captions on by default and a transcript. Admins upload, edit, delete and save drafts.
- **Notifications:** a bell with an unread count, a slide-out panel, an inbox with an "Unread only" filter, and links to the related event, announcement or promo.
- **User profile:** view your account and update your name and email.
- **Admin dashboard:** live statistics and charts. Each card links to its page. Admins also manage users (view, enable, disable).
- **Accessibility and layout:** keyboard friendly, screen reader labels, visible focus, good color contrast, and layouts that work on phones, tablets and desktops.

## Technologies Used

- HTML5
- Tailwind CSS 3, loaded from the CDN (`https://cdn.tailwindcss.com`)
- jQuery 3.7.1, loaded from the CDN (`https://code.jquery.com`)
- Plain CSS for shared components (`css/custom.css`)
- Plain JavaScript files, one per feature

There is no build step, no package manager and no framework.

## Project Structure

```
frontend/
├── index.html        Entry point. Redirects to html/index.html
├── html/             All 21 pages (login, signup, dashboard, events, promos, admin pages, 403, 404...)
├── js/               One script per feature, plus shared helpers
├── css/custom.css    Buttons, inputs, cards, focus ring and other shared styles
└── assets/           Logo and favicon
```

Key files in `js/`:

| File | Purpose |
|---|---|
| `config.js` | Backend address (`API_BASE_URL`), upload limits, page names |
| `api.js` | Sends every request to the backend, adds the login token, handles errors |
| `auth.js` | Stores the login token and user, checks the role, logs out |
| `guards.js` | Page protection: `requireLogin()`, `requireAdmin()`, `requireGuest()` |
| `layout.js` | Navigation bar, admin sidebar and footer shared by every page |
| `theme.js` | Brand colors for Tailwind |
| `events.js`, `promos.js`, `announcements.js`, ... | Code for each feature, named after the feature |

## Requirements

- A modern browser (Chrome, Edge, Firefox or Safari)
- An internet connection, because Tailwind and jQuery load from CDNs
- A way to serve the folder over HTTP: the VS Code **Live Server** extension, or Python 3
- The backend running locally (see [Backend Connection](#backend-connection)), which needs Node.js 18+ and PostgreSQL 15+

## Installation & Setup

1. Get the project, then open the `advanced-frontend-dev-summative-civic-event-project` folder in VS Code:
   ```bash
   git clone <repository-url>
   ```
2. Nothing needs to be installed for the frontend. There is no `npm install` step.
3. Check that `frontend/js/config.js` points to your backend (see the next section).

## Backend Connection

The frontend talks to the backend through one setting at the top of `js/config.js`:

```js
const API_BASE_URL = 'http://localhost:4000';
```

- API requests go to `API_BASE_URL + '/api'`, for example `http://localhost:4000/api/events`.
- Uploaded images, audio and videos load from `http://localhost:4000/uploads/...`.
- If the backend runs on another host or port, change this one line. Nothing else needs to change.

The frontend has **no environment variables** and no `.env` file. The database settings live in the backend's `.env` file (`DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`). Set those up by following `backend/README.md`.

Start the backend before opening the frontend:

```bash
cd backend
npm install
npm run dev
```

You should see `CivicEvents+ backend listening on port 4000` and `Connected to PostgreSQL`. To check it is running, open `http://localhost:4000/health` in the browser. It should show `{"ok":true,...}`.

No CORS changes are needed. The backend already accepts requests from any origin.

### Endpoints the frontend uses

Every request goes through `js/api.js`, which adds the `Authorization: Bearer <token>` header and turns errors (401, 403, 404, 409, 5xx, no connection) into clear messages.

| Feature | Endpoints | Admin only |
|---|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login` | |
| Profile | `GET`, `PATCH /users/profile/me` | |
| Users | `GET /users`, `GET /users/:id`, `PATCH /users/:id/enable`, `PATCH /users/:id/disable` | Yes |
| Events | `GET /events`, `GET /events/:id` | |
| | `POST /events`, `PUT /events/:id`, `DELETE /events/:id` | Yes |
| Registrations | `POST /event-registrations/register`, `POST /event-registrations/cancel`, `GET /event-registrations/my-registrations` | |
| | `GET /event-registrations/event/:id/attendees` | Yes |
| Feedback | `POST /event-feedback`, `PUT /event-feedback/:id`, `GET /event-feedback/my-feedback` | |
| | `GET /event-feedback/event/:id` | Yes |
| Announcements | `GET /announcements`, `GET /announcements/:id` | |
| | `POST /announcements`, `PUT /announcements/:id`, `DELETE /announcements/:id` | Yes |
| Promos | `GET /promos`, `GET /promos/:id` | |
| | `POST /promos`, `PUT /promos/:id`, `PATCH /promos/:id/unpublish`, `DELETE /promos/:id` | Yes |
| Notifications | `GET /notifications` | |
| | `DELETE /notifications/:id` | Yes |
| Dashboard | `GET /dashboard/me` | |
| | `GET /dashboard/admin` | Yes |

All paths start with `/api`. Uploads (event image, announcement audio, promo video) are sent as form data with the file keys `image`, `audio` and `video`.

## Running the Application

Keep the backend running, then serve the `frontend` folder with one of these options.

**Option 1: VS Code Live Server (recommended)**

Right-click `frontend/index.html` and choose **Open with Live Server**. The app opens in your browser.

**Option 2: Python**

```bash
cd frontend
python3 -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

Either way, `index.html` forwards you to the landing page at `html/index.html`. From there, sign up or log in.

## User Roles

Every new account is a **normal user**. To create an administrator, sign up first, then update the role in the database (replace the email):

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Log out and back in afterwards, because the role is read at login.

| What you can do | Normal user | Admin |
|---|---|---|
| Browse published events, announcements and promos | Yes | Yes |
| Register for and cancel events | Yes | No |
| Leave and edit feedback | Yes | Yes |
| See all feedback, averages and who registered | No | Yes |
| See draft announcements and promos | No | Yes |
| Create, edit and delete events, announcements and promos | No | Yes |
| Admin dashboard with site statistics | No (personal summary) | Yes |
| Manage users and delete notifications | No | Yes |
| Edit own profile | Yes | Yes |

Admin pages are protected in two places. The frontend sends normal users to a 403 page and hides admin buttons (`js/guards.js`). The backend also rejects their requests with a 403 (`backend/src/middlewares/auth.middleware.js`), so the protection holds even if someone bypasses the frontend.

## Important Notes

- **Start the backend first.** Without it, pages show "Cannot reach the server" with a Retry button.
- **Sessions last 1 hour.** After that the backend token expires and you are asked to log in again. "Remember me" keeps you logged in after closing the browser; do not use it on shared computers.
- **Upload limits:** images JPG, PNG or GIF up to 2 MB; audio MP3, WAV, M4A or OGG up to 5 MB; video MP4, MOV, AVI or MKV up to 100 MB. These match `backend/src/middlewares/upload.middleware.js`. If you use the original course backend, which allows 8 MB videos, change `video.maxMB` to `8` in `js/config.js`.

These limitations come from the provided backend:

- After cancelling a registration, you cannot register for that event again.
- The login API does not check whether an account was disabled. The frontend checks it right after login (`GET /api/users/profile/me`) and signs disabled users out with a message. Someone calling the API directly could still get a token.
- There is no "mark as read" endpoint, so read notifications are remembered in your browser only.
- Events cannot be saved as drafts. Only announcements and promos can.
- Normal users cannot see other people's feedback; only admins can.
- There is no service requests feature, because the backend has no endpoints for it.
