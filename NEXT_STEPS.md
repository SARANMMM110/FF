# Next Steps for Deployment

## ✅ What's Done
- ✅ MySQL adapter created and configured
- ✅ Migration script updated for MySQL
- ✅ Frontend build working
- ✅ Backend code ready for MySQL

## 📋 Action Plan

### Step 1: Build Everything Locally (Do this now)

```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build:server
```

This creates:
- `dist/client/` - Frontend files to upload to your web server
- `dist/server/` - Backend files to run on VPS

### Step 2: Prepare Production Environment File

Create a `.env.production` file with your MySQL credentials:

```env
# MySQL Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=frankimsocial_ff
DB_PASSWORD=prR03@gJbDFLhF$$
DB_NAME=frankimsocial_ff
DB_PORT=3306
DB_SSL=false

# Frontend URL
FRONTEND_URL=https://insta.imsocialclub.com

# JWT Secret (generate a strong random string - IMPORTANT!)
JWT_SECRET=generate-a-strong-random-secret-here

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=378278205772-t4icp3d1tlqc1mthf0vgr75dseeamgcq.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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

# Server Configuration
PORT=3000
NODE_ENV=production
STORAGE_PATH=./storage
```

### Step 3: Deploy to VPS

1. **SSH into your server:**
   ```bash
   ssh root@194.195.86.165
   ```

2. **Install Node.js (if not installed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   ```

3. **Install PM2 (process manager):**
   ```bash
   npm install -g pm2
   ```

4. **Upload your project:**
   - Upload entire project folder to `/var/www/focusflow` (or your preferred location)
   - Or use git: `git clone <your-repo> /var/www/focusflow`

5. **On the VPS, install dependencies:**
   ```bash
   cd /var/www/focusflow
   npm install --production --legacy-peer-deps
   ```

6. **Create .env file:**
   ```bash
   nano .env
   # Paste the production .env content from Step 2
   ```

7. **Run database migrations:**
   ```bash
   npm run migrate
   ```

8. **Start the backend with PM2 (using tsx - no build needed):**
   ```bash
   pm2 start npm --name focusflow-backend -- run start:tsx
   pm2 save
   pm2 startup
   ```
   
   **OR** if you prefer to build first:
   ```bash
   npm run build:server
   pm2 start dist/server/index.js --name focusflow-backend
   pm2 save
   pm2 startup
   ```

### Step 4: Deploy Frontend

Upload the contents of `dist/client/` to your web server root for `insta.imsocialclub.com`.

If using Nginx, configure it to:
- Serve static files from the frontend directory
- Proxy `/api/*` requests to `http://localhost:3000`

### Step 5: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   - `https://insta.imsocialclub.com/auth/callback`

### Step 6: Test

1. Visit: https://insta.imsocialclub.com
2. Try logging in with Google
3. Check PM2 logs: `pm2 logs focusflow-backend`

## 🔧 Troubleshooting

- **Backend not starting?** Check: `pm2 logs focusflow-backend`
- **Database connection error?** Verify MySQL credentials in `.env`
- **OAuth not working?** Ensure redirect URI matches exactly in Google Console
- **Frontend not loading?** Check web server configuration and file permissions

## 📝 Quick Commands Reference

```bash
# On VPS - View logs
pm2 logs focusflow-backend

# On VPS - Restart backend
pm2 restart focusflow-backend

# On VPS - Stop backend
pm2 stop focusflow-backend

# On VPS - Check status
pm2 status
```
