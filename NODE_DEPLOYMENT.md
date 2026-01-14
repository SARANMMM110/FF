# Node.js Deployment Guide for FocusFlow

This guide explains how to deploy FocusFlow backend to a VPS server running Node.js.

## Prerequisites

- VPS server with Node.js 18+ installed
- Domain name (for frontend)
- Basic knowledge of Linux/SSH

## Step 1: Prepare Your VPS

### Install Node.js (if not already installed)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Upload Code to VPS

### Option A: Using Git (Recommended)

```bash
# On your VPS
cd /var/www  # or your preferred directory
git clone <your-repo-url> focusflow
cd focusflow
```

### Option B: Using SCP

```bash
# From your local machine
scp -r . user@your-vps-ip:/var/www/focusflow/
```

## Step 3: Install Dependencies

```bash
cd /var/www/focusflow
npm install --legacy-peer-deps
```

## Step 4: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required variables:**
- `MOCHA_USERS_SERVICE_API_URL` - Your Mocha API URL
- `MOCHA_USERS_SERVICE_API_KEY` - Your Mocha API key

**Optional variables:**
- `PORT` - Server port (default: 3000)
- `DATABASE_PATH` - Database file path (default: ./database.sqlite)
- `STORAGE_PATH` - Storage directory (default: ./storage)
- Integration keys (AWeber, Google Calendar, Notion, etc.)

## Step 5: Run Database Migrations

```bash
npm run migrate
```

This will:
- Create the database file (if it doesn't exist)
- Run all migration files in order
- Track applied migrations

## Step 6: Build the Server

```bash
npm run build:server
```

This compiles TypeScript to JavaScript in the `dist/server` directory.

## Step 7: Start the Server

### Development Mode

```bash
npm run dev:node
```

### Production Mode (with PM2 - Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server
pm2 start dist/server/index.js --name focusflow

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

### Production Mode (Manual)

```bash
NODE_ENV=production npm start
```

## Step 8: Set Up Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/focusflow
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Your API subdomain

    # Backend API
    location / {
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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/focusflow /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 9: Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
```

## Step 10: Deploy Frontend

### Build Frontend

```bash
npm run build:frontend
```

The built files will be in the `dist` directory.

### Option A: Serve with Nginx

```bash
sudo nano /etc/nginx/sites-available/focusflow-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # Your main domain

    root /var/www/focusflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/focusflow-frontend /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
sudo systemctl reload nginx
```

### Option B: Use a CDN (Cloudflare, etc.)

Upload the `dist` folder contents to your CDN or static hosting service.

## Step 11: Update Frontend API URL

If your API is on a different domain, update the frontend configuration:

1. Find where API calls are made (usually in a config file)
2. Update the base URL to `https://api.yourdomain.com`

## Step 12: Monitor and Maintain

### View PM2 Logs

```bash
pm2 logs focusflow
```

### Restart Server

```bash
pm2 restart focusflow
```

### Update Application

```bash
cd /var/www/focusflow
git pull  # or upload new files
npm install --legacy-peer-deps
npm run build:server
npm run migrate  # if there are new migrations
pm2 restart focusflow
```

## Troubleshooting

### Server won't start

1. Check logs: `pm2 logs focusflow`
2. Verify environment variables: `cat .env`
3. Check database file exists and is writable
4. Verify port 3000 is not in use: `sudo lsof -i :3000`

### Database errors

1. Ensure migrations ran: `npm run migrate`
2. Check database file permissions
3. Verify database path in `.env`

### Storage errors

1. Ensure storage directory exists and is writable
2. Check `STORAGE_PATH` in `.env`

### API not accessible

1. Check Nginx configuration: `sudo nginx -t`
2. Verify firewall allows ports 80/443
3. Check PM2 is running: `pm2 status`

## File Structure

```
/var/www/focusflow/
├── dist/              # Built files
│   ├── server/        # Backend server
│   └── ...            # Frontend files
├── database.sqlite    # SQLite database
├── storage/           # File storage
├── src/
├── migrations/
├── .env               # Environment variables
└── package.json
```

## Security Recommendations

1. **Firewall**: Only open ports 80, 443, and 22 (SSH)
2. **Environment Variables**: Never commit `.env` file
3. **Database**: Regular backups of `database.sqlite`
4. **Updates**: Keep Node.js and dependencies updated
5. **SSL**: Always use HTTPS in production

## Backup Strategy

```bash
# Backup database
cp database.sqlite database.sqlite.backup

# Backup storage
tar -czf storage-backup.tar.gz storage/

# Schedule daily backups with cron
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

## Support

For issues or questions:
- Check the main README.md
- Review PM2 logs
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

