import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from '../worker/index.js';
import { NodeD1Database } from './adapters/database.js';
import { PostgresD1Database } from './adapters/postgres.js';
import { MysqlD1Database } from './adapters/mysql.js';
import { NodeR2Bucket } from './adapters/storage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(process.cwd(), '.env') });

// Static frontend: when Apache proxies /dashboard → Node, we serve the React build from here
const staticDir = process.env.STATIC_DIR || path.join(__dirname, '..');
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

async function serveStatic(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (pathname.startsWith('/api')) return null;
  let filePath: string;
  if (pathname === '/' || pathname === '') {
    filePath = path.join(staticDir, 'index.html');
  } else if (pathname.startsWith('/assets/') || /\.(js|css|ico|svg|png|jpg|jpeg|woff2?|json)$/i.test(pathname)) {
    const safePath = pathname.replace(/^\/+/, '').replace(/\.\./g, '');
    filePath = path.join(staticDir, safePath);
  } else {
    // SPA fallback: any other path → index.html
    filePath = path.join(staticDir, 'index.html');
  }
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(staticDir))) return new Response('Forbidden', { status: 403 });
  try {
    const buf = await fs.promises.readFile(resolved);
    const ext = path.extname(resolved);
    const contentType = MIME[ext] || 'application/octet-stream';
    return new Response(buf, { headers: { 'Content-Type': contentType } });
  } catch (e: any) {
    if (e?.code === 'ENOENT' && (pathname === '/' || pathname === '' || !pathname.includes('.'))) {
      const indexPath = path.join(staticDir, 'index.html');
      try {
        const buf = await fs.promises.readFile(indexPath);
        return new Response(buf, { headers: { 'Content-Type': 'text/html' } });
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Get environment variables
const getEnv = async () => {
  // Use MySQL if DB_TYPE is 'mysql', PostgreSQL if DATABASE_URL is provided, otherwise use SQLite
  let db: NodeD1Database | PostgresD1Database | MysqlD1Database;
  
  if (process.env.DB_TYPE === 'mysql' || (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)) {
    if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('❌ MySQL environment variables are missing');
    }
    
    db = new MysqlD1Database({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      ssl: process.env.DB_SSL === 'true',
    });
    console.log('📊 Using MySQL database');
  } else if (process.env.DATABASE_URL) {
    const ssl = process.env.DB_SSL === 'true';
    db = new PostgresD1Database(process.env.DATABASE_URL, ssl);
    console.log('📊 Using PostgreSQL database');
  } else {
    db = new NodeD1Database(
      process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite')
    );
    console.log('📊 Using SQLite database');
  }

  return {
    DB: db,
    R2_BUCKET: new NodeR2Bucket(
      process.env.STORAGE_PATH || path.join(__dirname, '../../storage')
    ),
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    SYSTEME_IO_API_KEY: process.env.SYSTEME_IO_API_KEY,
    AWEBER_CLIENT_ID: process.env.AWEBER_CLIENT_ID,
    AWEBER_CLIENT_SECRET: process.env.AWEBER_CLIENT_SECRET,
    AWEBER_ACCESS_TOKEN: process.env.AWEBER_ACCESS_TOKEN,
    AWEBER_ACCOUNT_ID: process.env.AWEBER_ACCOUNT_ID,
    AWEBER_LIST_ID: process.env.AWEBER_LIST_ID,
    // Support both GOOGLE_OAUTH_* and GOOGLE_CALENDAR_* for compatibility
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    NOTION_INTEGRATION_SECRET: process.env.NOTION_INTEGRATION_SECRET,
  };
};

// Port configuration
const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting FocusFlow Node.js Server...');
console.log(`📦 Storage: ${process.env.STORAGE_PATH || './storage'}`);
console.log(`🌐 Port: ${port}`);
if (process.env.FRONTEND_URL) {
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
}

// Initialize environment and start server
(async () => {
  const env = await getEnv();

  // Start server
  // Use '0.0.0.0' to listen on all interfaces (IPv4) - required for production
  // Use '127.0.0.1' if you want it to be private/localhost only
  const hostname = process.env.HOSTNAME || '0.0.0.0';
  
  serve({
    fetch: async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api')) {
        return app.fetch(request, env as any);
      }
      const staticRes = await serveStatic(request);
      if (staticRes) return staticRes;
      return app.fetch(request, env as any);
    },
    port,
    hostname,
  }, (info) => {
    console.log(`✅ Server is running on http://${hostname}:${info.port}`);
    console.log(`📝 API at http://${hostname}:${info.port}/api/*`);
    console.log(`📂 Static frontend from ${staticDir}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database...');
    if (env.DB && typeof (env.DB as any).close === 'function') {
      await (env.DB as any).close();
    }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing database...');
    if (env.DB && typeof (env.DB as any).close === 'function') {
      await (env.DB as any).close();
    }
    process.exit(0);
  });
})();

