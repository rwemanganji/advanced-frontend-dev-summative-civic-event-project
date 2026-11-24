# CivicEvent+ Project

CivicEvents is an accessible city events and services portal. Residents find and register for events, leave feedback, listen to audio announcements, watch captioned promo videos and get notifications. Admins manage all of that, plus users, from a dashboard.

| Folder | What it is | Docs |
|---|---|---|
| `frontend/` | HTML, Tailwind CSS (CDN) and jQuery. No build step. | [frontend/README.md](frontend/README.md): setup, backend connection, API endpoints, roles, known limitations |
| `backend/` | The provided Node.js + Express + PostgreSQL API | [backend/README.md](backend/README.md) |
| `video-demo/` | Demo video | [video-demo/README.md](video-demo/README.md) |

## Quick start

1. Create the PostgreSQL database `"civic-events-db"` (keep the double quotes, because of the hyphen) and run `backend/migrations/001_create_tables.sql` ([details](backend/README.md)).
2. Put your database credentials in `backend/.env` (`DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`).
3. Start the API:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   It runs at `http://localhost:4000` (check `http://localhost:4000/health`).
4. Serve the frontend over HTTP: right-click `frontend/index.html` in VS Code and choose **Open with Live Server**, or run `cd frontend && python3 -m http.server 5500` and open `http://localhost:5500` ([details](frontend/README.md#running-the-application)).
5. Sign up two accounts, then make one an admin:
   ```sql
   UPDATE users SET role='admin' WHERE email='admin@civic.test';
   ```

The API address is set in one place: `frontend/js/config.js` (`API_BASE_URL`).

## Roles in one line

The backend enforces roles with `authenticate` and `authorize(['admin'])` in `backend/src/middlewares/auth.middleware.js`. The frontend mirrors them for a better experience with `requireLogin()`, `requireAdmin()` and `applyRoleVisibility()` in `frontend/js/guards.js`. See [User Roles](frontend/README.md#user-roles).
