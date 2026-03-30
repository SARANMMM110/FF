import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from '../worker/index.js';
import { NodeD1Database } from './adapters/database.js';
import { PostgresD1Database } from './adapters/postgres.js';
import { MysqlD1Database } from './adapters/mysql.js';
import { NodeR2Bucket } from './adapters/storage.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(process.cwd(), '.env') });

// Get environment variables
const getEnv = async () => {
  // DB_TYPE=sqlite → file DB (local dev without MySQL). Else MySQL if credentials / DB_TYPE=mysql, else Postgres or SQLite.
  let db: NodeD1Database | PostgresD1Database | MysqlD1Database;
  let dbSqlDialect: "mysql" | "sqlite" = "sqlite";

  if (process.env.DB_TYPE === 'sqlite') {
    db = new NodeD1Database(
      process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite')
    );
    console.log('📊 Using SQLite database (DB_TYPE=sqlite)');
  } else if (process.env.DB_TYPE === 'mysql' || (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)) {
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
    dbSqlDialect = "mysql";
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
    GOOGLE_OAUTH_REDIRECT_URL: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    NOTION_INTEGRATION_SECRET: process.env.NOTION_INTEGRATION_SECRET,
    DB_SQL_DIALECT: dbSqlDialect,
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
const oauthRedirectLog = process.env.GOOGLE_OAUTH_REDIRECT_URL?.trim();
if (oauthRedirectLog) {
  console.log(`🔗 Google OAuth redirect URI: ${oauthRedirectLog}`);
} else {
  console.log('🔗 Google OAuth redirect URI: derived as {request origin}/api/oauth/google/callback (set GOOGLE_OAUTH_REDIRECT_URL if public URL differs)');
}

// Initialize environment and start server
(async () => {
  const env = await getEnv();

  // Start server
  // Use '0.0.0.0' to listen on all interfaces (IPv4) - required for production
  // Use '127.0.0.1' if you want it to be private/localhost only
  const hostname = process.env.HOSTNAME || '0.0.0.0';
  
  serve({
    fetch: (request: Request) => {
      // Inject environment bindings into the request context
      // Hono will access these via c.env
      // For Node.js, we pass env as the second parameter (execution context)
      return app.fetch(request, env as any);
    },
    port,
    hostname,
  }, (info) => {
    console.log(`✅ Server is running on http://${hostname}:${info.port}`);
    console.log(`📝 API endpoints available at http://${hostname}:${info.port}/api/*`);
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

