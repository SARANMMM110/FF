# Quick Start: Node.js Backend

This is a quick reference for running the FocusFlow backend on Node.js.

## Local Development

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev:node
   ```

## Production Build

1. **Build the server:**
   ```bash
   npm run build:server
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## Available Scripts

- `npm run dev:node` - Start development server with hot reload
- `npm run build:server` - Build TypeScript to JavaScript
- `npm run migrate` - Run database migrations
- `npm start` - Start production server
- `npm run build:frontend` - Build React frontend (for static hosting)

## Environment Variables

Required:
- `MOCHA_USERS_SERVICE_API_URL`
- `MOCHA_USERS_SERVICE_API_KEY`

Optional:
- `PORT` (default: 3000)
- `DATABASE_PATH` (default: ./database.sqlite)
- `STORAGE_PATH` (default: ./storage)
- Integration keys (see .env.example)

## File Structure

```
src/
├── server/
│   ├── index.ts          # Node.js server entry point
│   └── adapters/
│       ├── database.ts   # D1Database adapter (SQLite)
│       └── storage.ts   # R2Bucket adapter (filesystem)
├── worker/
│   └── index.ts          # Hono app (no changes needed)
└── ...
```

## Testing

1. Server should start on `http://localhost:3000`
2. Test API: `curl http://localhost:3000/api/health` (if endpoint exists)
3. Check logs for any errors

## Troubleshooting

- **Port already in use**: Change `PORT` in `.env`
- **Database errors**: Run `npm run migrate`
- **Module not found**: Run `npm install --legacy-peer-deps`
- **Type errors**: Run `npm run build:server` to check compilation

For full deployment guide, see `NODE_DEPLOYMENT.md`

