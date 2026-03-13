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

// Static frontend: serve from dist/client/ (Vite+Cloudflare output) or dist/. Server runs from dist/server/.
let staticDir = process.env.STATIC_DIR || path.join(__dirname, '..');

// When running from dist/server/, prefer sibling dist/client/ (where Vite builds to)
if (path.basename(__dirname) === 'server') {
  const siblingClient = path.join(__dirname, '..', 'client');
  try {
    fs.accessSync(path.join(siblingClient, 'index.html'));
    staticDir = siblingClient;
  } catch {
    /* dist/client not found, keep current staticDir */
  }
}

// If index.html still not in staticDir, try other common locations
try {
  fs.accessSync(path.join(staticDir, 'index.html'));
} catch {
  if (path.basename(staticDir) === 'server') {
    const parentClient = path.join(staticDir, '..', 'client');
    try {
      fs.accessSync(path.join(parentClient, 'index.html'));
      staticDir = parentClient;
    } catch {
      /* keep staticDir as-is */
    }
  } else {
    const clientSubdir = path.join(staticDir, 'client');
    try {
      fs.accessSync(path.join(clientSubdir, 'index.html'));
      staticDir = clientSubdir;
    } catch {
      /* keep staticDir as-is */
    }
  }
}
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

function isSpaPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '' || pathname === '/dashboard' || pathname === '/dashboard/') return true;
  if (pathname.startsWith('/dashboard/')) return true;
  if (!pathname.startsWith('/api') && !pathname.startsWith('/assets/') && !/\.(js|css|ico|svg|png|jpg|jpeg|woff2?|json)$/i.test(pathname)) return true;
  return false;
}

async function serveStatic(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (pathname.startsWith('/api')) return null;
  let filePath: string;
  if (pathname === '/' || pathname === '' || pathname === '/dashboard' || pathname === '/dashboard/') {
    filePath = path.join(staticDir, 'index.html');
  } else if (pathname.startsWith('/dashboard/')) {
    filePath = path.join(staticDir, 'index.html');
  } else if (pathname.startsWith('/assets/') || /\.(js|css|ico|svg|png|jpg|jpeg|woff2?|json)$/i.test(pathname)) {
    const safePath = pathname.replace(/^\/+/, '').replace(/\.\./g, '');
    filePath = path.join(staticDir, safePath);
  } else {
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
    if (e?.code === 'ENOENT' && isSpaPath(pathname)) {
      const indexPath = path.join(staticDir, 'index.html');
      try {
        const buf = await fs.promises.readFile(indexPath);
        return new Response(buf, { headers: { 'Content-Type': 'text/html' } });
      } catch {
        return new Response(
          `<!DOCTYPE html><html><head><title>Setup required</title></head><body><h1>Frontend not deployed</h1><p>Deploy the React build so <code>index.html</code> exists.</p><p>On the server, from project root run: <code>VITE_BASE_PATH=/dashboard/ npm run build</code>. Then ensure the <code>dist/</code> folder contains <code>dist/client/index.html</code> and <code>dist/client/assets/</code> (Vite outputs there). The Node app serves from <code>dist/client/</code> when it runs from <code>dist/server/</code>.</p><p>Static dir tried: <code>${staticDir}</code>. To override, set <code>STATIC_DIR=/home/flowchart/round_about/FF/dist/client</code> in .env.</p></body></html>`,
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
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
    try {
      fs.accessSync(path.join(staticDir, 'index.html'));
      console.log(`📂 Static frontend: ${staticDir} (index.html found)`);
    } catch {
      console.warn(`⚠️ Static frontend: ${staticDir} (index.html NOT found – run build and deploy dist/client/)`);
    }
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

