#!/bin/bash

echo "🔍 Checking Backend Status..."
echo ""

# Check PM2 status
echo "1. PM2 Status:"
pm2 list
echo ""

# Check if backend is running
echo "2. Checking if backend process is running:"
if pm2 list | grep -q "focusflow-backend.*online"; then
    echo "✅ Backend is running in PM2"
else
    echo "❌ Backend is NOT running in PM2"
fi
echo ""

# Check port 3000
echo "3. Checking port 3000:"
if netstat -tulpn 2>/dev/null | grep -q ":3000" || ss -tulpn 2>/dev/null | grep -q ":3000"; then
    echo "✅ Port 3000 is in use"
    netstat -tulpn 2>/dev/null | grep ":3000" || ss -tulpn 2>/dev/null | grep ":3000"
else
    echo "❌ Port 3000 is NOT in use - backend not listening"
fi
echo ""

# Check recent logs
echo "4. Recent PM2 Logs (last 20 lines):"
pm2 logs focusflow-backend --lines 20 --nostream
echo ""

# Check if backend file exists
echo "5. Checking backend files:"
if [ -f "dist/server/index.js" ]; then
    echo "✅ Compiled backend file exists: dist/server/index.js"
elif [ -f "src/server/index.ts" ]; then
    echo "✅ Source file exists: src/server/index.ts"
    echo "⚠️  You may need to run: npm run build:server"
else
    echo "❌ Backend files not found!"
fi
echo ""

# Test backend connection
echo "6. Testing backend connection:"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend responds on http://localhost:3000/api/health"
    curl -s http://localhost:3000/api/health | head -5
else
    echo "❌ Backend does NOT respond on http://localhost:3000"
fi
echo ""

echo "📋 Next Steps:"
echo "   - If backend is not running: pm2 start npm --name focusflow-backend -- run start:tsx"
echo "   - If backend crashed: pm2 logs focusflow-backend --lines 50"
echo "   - If port is in use by wrong process: kill the process and restart"
echo ""

