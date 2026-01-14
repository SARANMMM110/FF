import { serve } from '@hono/node-server';
import app from '../worker/index';
import { NodeD1Database } from './adapters/database';
import { PostgresD1Database } from './adapters/postgres';
import { MysqlD1Database } from './adapters/mysql';
import { NodeR2Bucket } from './adapters/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

// Get environment variables
const getEnv = async () => {
  // Use MySQL if DB_TYPE is 'mysql', PostgreSQL if DATABASE_URL is provided, otherwise use SQLite
  let db: NodeD1Database | PostgresD1Database | MysqlD1Database;
  
  if (process.env.DB_TYPE === 'mysql') {
    db = new MysqlD1Database({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
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
  serve({
    fetch: (request: Request) => {
      // Inject environment bindings into the request context
      // Hono will access these via c.env
      // For Node.js, we pass env as the second parameter (execution context)
      return app.fetch(request, env as any);
    },
    port,
  }, (info) => {
    console.log(`✅ Server is running on http://localhost:${info.port}`);
    console.log(`📝 API endpoints available at http://localhost:${info.port}/api/*`);
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

