# Deployment Checklist

## ✅ Pre-Deployment (Local)

- [x] MySQL adapter created
- [x] Migration script updated
- [x] Frontend builds successfully
- [ ] Backend builds successfully (or use tsx)
- [ ] Test locally with MySQL (optional)

## 📦 Deployment Steps

### 1. Build Frontend
```bash
npm run build:frontend
```
**Output:** `dist/client/` folder

### 2. Prepare Production .env

Create `.env` file on VPS with:
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=frankimsocial_ff
DB_PASSWORD=prR03@gJbDFLhF$$
DB_NAME=frankimsocial_ff
DB_PORT=3306
DB_SSL=false
FRONTEND_URL=https://insta.imsocialclub.com
JWT_SECRET=<generate-strong-random-string>
GOOGLE_OAUTH_CLIENT_ID=378278205772-t4icp3d1tlqc1mthf0vgr75dseeamgcq.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
PORT=3000
NODE_ENV=production
STORAGE_PATH=./storage
```

### 3. Deploy to VPS

**SSH into server:**
```bash
ssh root@194.195.86.165
```

**On VPS:**
```bash
# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Navigate to project
cd /var/www/focusflow  # or your path

# Install dependencies
npm install --production --legacy-peer-deps

# Create .env file
nano .env  # Paste production .env content

# Run migrations
npm run migrate

# Start backend (using tsx - no build needed)
pm2 start npm --name focusflow-backend -- run start:tsx
pm2 save
pm2 startup
```

### 4. Deploy Frontend

Upload `dist/client/` contents to your web server for `insta.imsocialclub.com`

### 5. Configure Web Server

If using Nginx, proxy `/api/*` to `http://localhost:3000`

### 6. Update Google OAuth

Add to Google Cloud Console:
- `https://insta.imsocialclub.com/auth/callback`

### 7. Test

- Visit: https://insta.imsocialclub.com
- Test Google login
- Check logs: `pm2 logs focusflow-backend`

