# MortalFocus Deployment (Apache + Virtualmin, Debian)

This guide covers deploying FocusFlow (MortalFocus) on **mortalfocus.com** with:

- **Root domain** → WordPress (Apache DocumentRoot)
- **/dashboard** → React app (proxied to Node on port 3001)
- **/api** → Node API (proxied to Node on port 3001)
- **Node** → Single process on port 3001 (PM2), serves both frontend static build and API

---

## 1. Build with dashboard base path

From the project root:

```bash
# Build frontend with base path /dashboard/ (so assets load from mortalfocus.com/dashboard/assets/...)
VITE_BASE_PATH=/dashboard/ npm run build:frontend

# Build server (TypeScript → dist/server/)
npm run build:server
```

Or in one go:

```bash
VITE_BASE_PATH=/dashboard/ npm run build
```

The frontend build goes to `dist/` (index.html, assets/). The server runs from `dist/server/index.js` and serves static files from `dist/` by default.

---

## 2. Environment variables on the server

Create a `.env` in the app directory (e.g. `/path/to/focusflow/.env` or the directory where you run PM2). **Do not put credentials in JavaScript.**

Use the **application-level** DB user (e.g. `flowchart`) for the app, not the phpMyAdmin user:

```env
# Database (MariaDB/MySQL) – application user
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=flowchart
DB_PASSWORD=5dfDATA_5dfBASE
DB_NAME=horizon
DB_SSL=false

# Frontend origin – must match the site URL (no trailing slash)
FRONTEND_URL=https://mortalfocus.com

# Server
PORT=3001
NODE_ENV=production

# Optional: override directory for static frontend (default: parent of dist/server)
# STATIC_DIR=/var/www/focusflow/dist

# JWT and storage
JWT_SECRET=your-strong-random-secret-key-here
STORAGE_PATH=./storage

# Google OAuth (for login)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

For Google OAuth, set **Authorized redirect URIs** in Google Cloud Console to:

- `https://mortalfocus.com/auth/callback`

---

## 3. Apache reverse proxy (Virtualmin)

Apache must proxy **/dashboard** and **/api** to the Node server on port 3001. Paths must be forwarded so that:

- `https://mortalfocus.com/dashboard` → Node receives `GET /`
- `https://mortalfocus.com/dashboard/tasks` → Node receives `GET /tasks`
- `https://mortalfocus.com/dashboard/assets/...` → Node receives `GET /assets/...`
- `https://mortalfocus.com/api/users/me` → Node receives `GET /api/users/me`

Example using `mod_proxy` and `mod_proxy_http`:

```apache
# Enable proxy (if not already)
# a2enmod proxy proxy_http

# API first (more specific path)
ProxyPass /api http://127.0.0.1:3001/api
ProxyPassReverse /api http://127.0.0.1:3001/api

# Dashboard: strip /dashboard and send rest to Node (trailing slash on target)
ProxyPass /dashboard http://127.0.0.1:3001/
ProxyPassReverse /dashboard http://127.0.0.1:3001/
```

- **Order matters**: define `/api` before `/dashboard` so `/api` is not treated as part of the dashboard.
- **ProxyPassReverse** keeps `Location` headers correct for redirects.

If your Apache config is in a virtual host, place these inside the `VirtualHost` for mortalfocus.com (port 443 if using SSL). Then reload Apache:

```bash
sudo systemctl reload apache2
# or
sudo apachectl configtest && sudo apachectl graceful
```

---

## 4. PM2 (Node on port 3001)

From the project directory (where `ecosystem.config.cjs` and `dist/` live):

```bash
# Load .env (PM2 does not load .env by default; set in ecosystem or export before start)
export PORT=3001
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # if not already configured
```

Or set `PORT` in `ecosystem.config.cjs`:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,
},
```

Ensure the process is bound to the port Apache uses (e.g. 3001). If the host only needs local access, you can use `HOSTNAME=127.0.0.1` in `.env` or ecosystem.

---

## 5. Verify

1. **Health**
   - `curl -s http://127.0.0.1:3001/api/health` → JSON with `"status":"healthy"`.
2. **API from browser**
   - Open `https://mortalfocus.com/dashboard`.
   - In DevTools Network, confirm requests to `https://mortalfocus.com/api/...` return 200 (or 401 when not logged in), not 404.
3. **Login**
   - Use Google OAuth and confirm redirect to `https://mortalfocus.com/auth/callback` works.

---

## 6. Troubleshooting

| Issue | What to check |
|-------|----------------|
| 404 on `/api/*` | Apache: `ProxyPass /api` and `ProxyPassReverse /api`; Node running on 3001; `curl http://127.0.0.1:3001/api/health`. |
| 404 on `/dashboard` or blank page | Apache: `ProxyPass /dashboard` → `http://127.0.0.1:3001/`; build with `VITE_BASE_PATH=/dashboard/`; Node serving `dist/index.html` (check `STATIC_DIR` / default `dist`). |
| CORS / cookie errors | `FRONTEND_URL=https://mortalfocus.com` (no trailing slash); same-origin requests (mortalfocus.com → mortalfocus.com/api) so CORS only matters for credentials. |
| DB connection | `.env` uses application user/password and correct `DB_NAME`; MariaDB allows local connection; no credentials in frontend code. |

---

## Summary

- **Build**: `VITE_BASE_PATH=/dashboard/ npm run build`
- **Run**: Node on 3001 (PM2), serving API + static from `dist/`
- **Apache**: Proxy `/api` and `/dashboard` to `http://127.0.0.1:3001` as above
- **Env**: `FRONTEND_URL=https://mortalfocus.com`, DB and JWT set in `.env` on the server

Debian 13, Apache LAMP, and MariaDB are fine; the only requirement is that Apache proxies `/api` and `/dashboard` to the Node app on port 3001.
