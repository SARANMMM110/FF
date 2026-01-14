# Quick Deployment Guide

## Production Environment Setup

### 1. Environment Variables (.env on VPS)

Create `.env` file on your VPS server with:

```env
# MySQL Database
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=frankimsocial_ff
DB_PASSWORD=prR03@gJbDFLhF$$
DB_NAME=frankimsocial_ff
DB_PORT=3306
DB_SSL=false

# Frontend URL
FRONTEND_URL=https://insta.imsocialclub.com

# JWT Secret (use a strong random string)
JWT_SECRET=your-strong-random-secret-key-here

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=378278205772-t4icp3d1tlqc1mthf0vgr75dseeamgcq.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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

# Server
PORT=3000
NODE_ENV=production
STORAGE_PATH=./storage
```

### 2. VPS Deployment Steps

```bash
# SSH into server
ssh root@194.195.86.165

# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Navigate to project directory
cd /var/www/focusflow  # or your project path

# Install dependencies
npm install --production --legacy-peer-deps

# Create .env file (copy from above)
nano .env

# Run migrations
npm run migrate

# Build backend
npm run build:server

# Start with PM2
pm2 start dist/server/index.js --name focusflow-backend
pm2 save
pm2 startup
```

### 3. Frontend Deployment

Upload the `dist/` folder contents to your web server root for `insta.imsocialclub.com`.

### 4. Google OAuth Setup

Add to Google Cloud Console → Authorized redirect URIs:
- `https://insta.imsocialclub.com/auth/callback`

### 5. Verify

- Visit: https://insta.imsocialclub.com
- Test Google OAuth login
- Check PM2 logs: `pm2 logs focusflow-backend`

