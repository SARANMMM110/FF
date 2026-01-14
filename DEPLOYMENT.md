# FocusFlow Deployment Guide

## Production Environment

- **Frontend Domain**: https://insta.imsocialclub.com/
- **Backend VPS**: SSH root@194.195.86.165
- **Database**: MySQL
  - Database: `frankimsocial_ff`
  - User: `frankimsocial_ff`
  - Password: `prR03@gJbDFLhF$$`

## Environment Variables

Create a `.env` file on your VPS with the following:

```env
# Database Configuration (MySQL)
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=frankimsocial_ff
DB_PASSWORD=prR03@gJbDFLhF$$
DB_NAME=frankimsocial_ff
DB_PORT=3306
DB_SSL=false

# Frontend URL
FRONTEND_URL=https://insta.imsocialclub.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your-strong-random-secret-key-here

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret

# Server Configuration
PORT=3000
NODE_ENV=production

# Storage Configuration
STORAGE_PATH=./storage
```

## Deployment Steps

### 1. On Your Local Machine

1. **Build the frontend:**
   ```bash
   npm run build:frontend
   ```

2. **Build the backend:**
   ```bash
   npm run build:server
   ```

3. **Prepare files for deployment:**
   - The built frontend will be in `dist/`
   - The built backend will be in `dist/server/`

### 2. On Your VPS Server

1. **SSH into the server:**
   ```bash
   ssh root@194.195.86.165
   ```

2. **Install Node.js (if not already installed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   ```

3. **Install PM2 (process manager):**
   ```bash
   npm install -g pm2
   ```

4. **Create project directory:**
   ```bash
   mkdir -p /var/www/focusflow
   cd /var/www/focusflow
   ```

5. **Upload your project files:**
   - Upload the entire project folder
   - Or use git to clone your repository

6. **Install dependencies:**
   ```bash
   npm install --production --legacy-peer-deps
   ```

7. **Create `.env` file:**
   ```bash
   nano .env
   ```
   Paste the environment variables from above

8. **Run database migrations:**
   ```bash
   npm run migrate
   ```

9. **Build the project:**
   ```bash
   npm run build:server
   ```

10. **Start the backend with PM2:**
    ```bash
    pm2 start dist/server/index.js --name focusflow-backend
    pm2 save
    pm2 startup
    ```

### 3. Frontend Deployment

The frontend needs to be served from `https://insta.imsocialclub.com/`. You have a few options:

#### Option A: Serve from VPS with Nginx

1. **Install Nginx:**
   ```bash
   apt-get update
   apt-get install -y nginx
   ```

2. **Copy frontend files:**
   ```bash
   cp -r dist/* /var/www/html/
   ```

3. **Configure Nginx:**
   ```bash
   nano /etc/nginx/sites-available/insta.imsocialclub.com
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name insta.imsocialclub.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name insta.imsocialclub.com;

       ssl_certificate /path/to/ssl/cert.pem;
       ssl_certificate_key /path/to/ssl/key.pem;

       root /var/www/html;
       index index.html;

       # Frontend
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site:**
   ```bash
   ln -s /etc/nginx/sites-available/insta.imsocialclub.com /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

#### Option B: Use Your Existing Web Server

If you already have a web server configured for `insta.imsocialclub.com`:
1. Upload the `dist/` folder contents to your web root
2. Configure your server to proxy `/api/*` requests to `http://localhost:3000`

### 4. Google OAuth Configuration

Update your Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   - `https://insta.imsocialclub.com/auth/callback`

### 5. Verify Deployment

1. **Check backend is running:**
   ```bash
   pm2 status
   pm2 logs focusflow-backend
   ```

2. **Test the API:**
   ```bash
   curl http://localhost:3000/api/users/me
   ```

3. **Visit your site:**
   - Open https://insta.imsocialclub.com/
   - Try logging in with Google

## Troubleshooting

### Backend not starting
- Check PM2 logs: `pm2 logs focusflow-backend`
- Verify `.env` file has all required variables
- Check database connection

### Database connection errors
- Verify MySQL credentials in `.env`
- Ensure MySQL is running: `systemctl status mysql`
- Test connection: `mysql -u frankimsocial_ff -p frankimsocial_ff`

### Frontend not loading
- Check Nginx configuration: `nginx -t`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Verify files are in the correct location

### OAuth not working
- Verify redirect URI matches exactly in Google Cloud Console
- Check backend logs for OAuth errors
- Ensure `FRONTEND_URL` is set correctly in `.env`

## Maintenance

### Update the application
1. Pull latest code or upload new files
2. Install dependencies: `npm install --production`
3. Build: `npm run build:server`
4. Restart: `pm2 restart focusflow-backend`

### View logs
```bash
pm2 logs focusflow-backend
```

### Stop/Start
```bash
pm2 stop focusflow-backend
pm2 start focusflow-backend
```

