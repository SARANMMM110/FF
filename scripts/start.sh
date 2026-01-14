#!/bin/bash

# FocusFlow Node.js Server Startup Script

echo "🚀 Starting FocusFlow Server..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure it"
    exit 1
fi

# Check if database exists, if not run migrations
if [ ! -f "${DATABASE_PATH:-database.sqlite}" ]; then
    echo "📊 Database not found, running migrations..."
    npm run migrate
fi

# Build server if dist doesn't exist
if [ ! -d "dist/server" ]; then
    echo "🔨 Building server..."
    npm run build:server
fi

# Start server
echo "✅ Starting server..."
npm start

