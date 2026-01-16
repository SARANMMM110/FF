# Quick Backend Restart Guide

## If Backend is Not Running (503 Error)

### Step 1: Check Current Status

```bash
ssh root@194.195.86.165
cd /var/www/focusflow  # or your project directory
pm2 list
```

### Step 2: Check Logs for Errors

```bash
pm2 logs focusflow-backend --lines 50
```

Look for:
- Database connection errors
- Missing environment variables
- TypeScript/JavaScript errors
- Port already in use errors

### Step 3: Restart Backend

**If using tsx (TypeScript directly):**
```bash
pm2 restart focusflow-backend --update-env
# OR if not running:
pm2 start npm --name focusflow-backend -- run start:tsx
pm2 save
```

**If using compiled JavaScript:**
```bash
cd /var/www/focusflow
npm run build:server  # Rebuild if needed
pm2 restart focusflow-backend
# OR if not running:
pm2 start dist/server/index.js --name focusflow-backend
pm2 save
```

### Step 4: Verify Backend is Running

```bash
# Check PM2 status
pm2 list

# Check if port 3000 is listening
netstat -tulpn | grep 3000

# Test backend directly
curl http://localhost:3000/api/health

# Check logs in real-time
pm2 logs focusflow-backend
```

### Step 5: Common Issues & Fixes

**Issue: Backend crashes immediately**
- Check logs: `pm2 logs focusflow-backend --err`
- Verify `.env` file exists and has correct values
- Check database connection credentials

**Issue: Port 3000 already in use**
```bash
# Find what's using port 3000
lsof -i :3000
# OR
netstat -tulpn | grep 3000

# Kill the process if needed
kill -9 <PID>
```

**Issue: Module not found errors**
```bash
cd /var/www/focusflow
npm install --legacy-peer-deps
```

**Issue: Database connection failed**
- Verify MySQL is running: `systemctl status mysql`
- Check database credentials in `.env`
- Test connection: `mysql -u frankimsocial_ff -p frankimsocial_ff`

### Step 6: Test from Browser

1. Visit: `https://focus.imsocialclub.com`
2. Open browser console (F12)
3. Try to log in with Google
4. Check if 503 errors are gone

## Quick Diagnostic Script

Upload `check-backend.sh` to your server and run:
```bash
chmod +x check-backend.sh
./check-backend.sh
```

This will show you:
- PM2 status
- Port status
- Recent logs
- File existence
- Connection test

