# Quick Fix for 503 Error

## The Problem
503 errors mean the backend server is not running or not reachable on port 3000.

## Quick Fix (Run on Your Server)

```bash
ssh root@194.195.86.165
cd /var/www/focusflow  # or your project directory

# Check if backend is running
pm2 list

# If NOT running, start it:
pm2 start npm --name focusflow-backend -- run start:tsx
# OR if using compiled:
pm2 start dist/server/index.js --name focusflow-backend

pm2 save

# Check if it's working
pm2 logs focusflow-backend --lines 20
```

## Or Use the Diagnostic Script

```bash
# Upload the script
scp fix-503.sh root@194.195.86.165:/var/www/focusflow/

# Run it
ssh root@194.195.86.165 "cd /var/www/focusflow && chmod +x fix-503.sh && ./fix-503.sh"
```

## Common Causes

1. **Backend crashed** - Check logs: `pm2 logs focusflow-backend`
2. **Backend not started** - Start it with PM2
3. **Port conflict** - Something else using port 3000
4. **Database connection failed** - Check MySQL is running and credentials are correct

## Verify It's Fixed

After starting the backend, test:
```bash
curl http://localhost:3000/api/health
```

Should return JSON, not HTML.

