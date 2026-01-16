#!/bin/bash

echo "🔧 Fixing 503 Error - Backend Not Running"
echo "=========================================="
echo ""

# Check PM2 status
echo "1. Checking PM2 status..."
pm2 list
echo ""

# Check if backend process exists
if pm2 list | grep -q "focusflow-backend.*online"; then
    echo "✅ Backend is running in PM2"
    echo ""
    echo "2. Checking recent logs for errors..."
    pm2 logs focusflow-backend --lines 30 --nostream
else
    echo "❌ Backend is NOT running in PM2"
    echo ""
    echo "2. Attempting to start backend..."
    
    # Try to start with tsx
    if [ -f "src/server/index.ts" ]; then
        echo "   Starting with tsx (TypeScript)..."
        pm2 start npm --name focusflow-backend -- run start:tsx
    elif [ -f "dist/server/index.js" ]; then
        echo "   Starting with compiled JavaScript..."
        pm2 start dist/server/index.js --name focusflow-backend
    else
        echo "   ❌ Could not find backend files!"
        echo "   Please check your project directory"
        exit 1
    fi
    
    pm2 save
    echo ""
    echo "3. Waiting 3 seconds for backend to start..."
    sleep 3
    pm2 list
fi

echo ""
echo "4. Testing backend connection..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend responds on http://localhost:3000"
    curl -s http://localhost:3000/api/health | head -3
else
    echo "❌ Backend does NOT respond on http://localhost:3000"
    echo ""
    echo "5. Checking port 3000..."
    netstat -tulpn 2>/dev/null | grep ":3000" || ss -tulpn 2>/dev/null | grep ":3000" || echo "   Port 3000 is not in use"
fi

echo ""
echo "📋 Next Steps:"
echo "   - If backend is running but not responding: Check PM2 logs"
echo "   - If backend won't start: Check for errors in logs"
echo "   - If port is in use: Kill the process and restart"
echo ""
echo "View logs: pm2 logs focusflow-backend"
echo "Restart: pm2 restart focusflow-backend"

