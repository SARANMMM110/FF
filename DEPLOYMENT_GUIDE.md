# Deployment Guide for FocusFlow

This guide explains how to deploy FocusFlow to different platforms, including VPS servers.

## Current Architecture

- **Frontend**: React + Vite (static files)
- **Backend**: Hono framework on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (object storage)

---

## Option 1: Deploy to Cloudflare Workers (Easiest - Recommended)

### Prerequisites
- Cloudflare account (free tier available)
- Node.js installed

### Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

3. **Deploy:**
   ```bash
   npx wrangler deploy
   ```

4. **Set environment variables in Cloudflare Dashboard:**
   - Go to Workers & Pages → Your Worker → Settings → Variables
   - Add required variables:
     - `MOCHA_USERS_SERVICE_API_URL`
     - `MOCHA_USERS_SERVICE_API_KEY`
     - `SYSTEME_IO_API_KEY` (optional)
     - `AWEBER_CLIENT_ID` (optional)
     - `AWEBER_CLIENT_SECRET` (optional)
     - `GOOGLE_CALENDAR_CLIENT_ID` (optional)
     - `GOOGLE_CALENDAR_CLIENT_SECRET` (optional)
     - `NOTION_INTEGRATION_SECRET` (optional)

5. **Set up D1 Database:**
   ```bash
   # Create database (if not exists)
   npx wrangler d1 create <database-name>
   
   # Run migrations
   npx wrangler d1 execute <database-name> --file=./migrations/1.sql
   # Repeat for all migration files in order
   ```

**Result**: Your app will be live at `https://<your-worker-name>.<your-subdomain>.workers.dev`

---

## Option 2: Deploy to VPS (Node.js Server)

### Prerequisites
- VPS with Node.js 18+ installed
- Database (SQLite, PostgreSQL, or MySQL)
- Storage solution (local filesystem, S3, or MinIO)

### Required Code Changes

#### Step 1: Install Node.js Adapter for Hono

```bash
npm install @hono/node-server
```

#### Step 2: Create Node.js Server Entry Point

Create `server.js` or `server.ts`:

```typescript
import { serve } from '@hono/node-server'
import { app } from './src/worker/index'
import { createAdapter } from './src/worker/node-adapter'

// Create adapter that replaces Cloudflare bindings
const adapter = createAdapter({
  // Database connection (SQLite example)
  db: new Database('./database.sqlite'),
  // Storage (local filesystem example)
  storage: new LocalStorage('./uploads'),
  // Environment variables
  env: {
    MOCHA_USERS_SERVICE_API_URL: process.env.MOCHA_USERS_SERVICE_API_URL!,
    MOCHA_USERS_SERVICE_API_KEY: process.env.MOCHA_USERS_SERVICE_API_KEY!,
    // ... other env vars
  }
})

serve({
  fetch: app.fetch,
  port: 3000,
})
```

#### Step 3: Replace D1Database with SQLite/PostgreSQL

You'll need to:
- Replace `c.env.DB.prepare()` calls with your database client
- Create a database adapter that mimics D1 API

#### Step 4: Replace R2Bucket with Local Storage/S3

Replace `c.env.R2_BUCKET` with:
- Local filesystem storage, or
- AWS S3, or
- MinIO (S3-compatible)

#### Step 5: Build Frontend Separately

```bash
# Build frontend
npm run build

# The built files will be in ./dist
# Serve them with your Node.js server or nginx
```

### Deployment Steps

1. **On your VPS, clone and install:**
   ```bash
   git clone <your-repo>
   cd FF
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file
   nano .env
   ```

3. **Set up database:**
   ```bash
   # For SQLite
   sqlite3 database.sqlite < migrations/1.sql
   
   # For PostgreSQL
   psql -U user -d database < migrations/1.sql
   ```

4. **Build and start:**
   ```bash
   npm run build
   node server.js
   ```

5. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name focusflow
   pm2 save
   pm2 startup
   ```

6. **Set up Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Frontend
       location / {
           root /path/to/FF/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option 3: Hybrid Approach (Frontend on VPS, Backend on Cloudflare)

### Steps

1. **Deploy backend to Cloudflare Workers** (follow Option 1)

2. **Build frontend:**
   ```bash
   npm run build
   ```

3. **Update API endpoints in frontend:**
   - Change API base URL to your Cloudflare Worker URL
   - Update CORS settings in Cloudflare Worker

4. **Deploy frontend to VPS:**
   ```bash
   # Copy dist folder to VPS
   scp -r dist/* user@your-vps:/var/www/focusflow/
   ```

5. **Set up Nginx on VPS:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/focusflow;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## Option 4: Docker Deployment (VPS)

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

### Deploy with Docker

```bash
# Build image
docker build -t focusflow .

# Run container
docker run -d \
  -p 3000:3000 \
  --name focusflow \
  --env-file .env \
  focusflow
```

---

## Comparison Table

| Option | Difficulty | Cost | Performance | Maintenance |
|--------|-----------|------|-------------|-------------|
| Cloudflare Workers | ⭐ Easy | Free tier available | ⭐⭐⭐ Excellent (edge) | ⭐⭐⭐ Low |
| VPS (Node.js) | ⭐⭐⭐ Hard | VPS cost | ⭐⭐ Good | ⭐⭐ Medium |
| Hybrid | ⭐⭐ Medium | VPS + Cloudflare | ⭐⭐⭐ Excellent | ⭐⭐ Medium |
| Docker (VPS) | ⭐⭐ Medium | VPS cost | ⭐⭐ Good | ⭐⭐ Medium |

---

## Recommended Approach

**For most users**: **Option 1 (Cloudflare Workers)** is recommended because:
- No code changes needed
- Free tier available
- Excellent performance
- Easy deployment
- Built-in DDoS protection

**If you need VPS specifically**: **Option 2** requires significant code changes but gives you full control.

---

## Next Steps

1. Choose your deployment option
2. Follow the specific steps for that option
3. Test your deployment
4. Set up monitoring and backups

For help with specific options, refer to the detailed sections above.

