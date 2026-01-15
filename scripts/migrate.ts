import { NodeD1Database } from '../src/server/adapters/database';
import { PostgresD1Database } from '../src/server/adapters/postgres';
import { MysqlD1Database } from '../src/server/adapters/mysql';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

const migrationsDir = path.join(__dirname, '../migrations');

(async () => {
  console.log('🔄 Running database migrations...');
  console.log(`📂 Migrations: ${migrationsDir}`);

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
    console.log(`📁 Database: MySQL (${process.env.DB_HOST}/${process.env.DB_NAME})`);
  } else if (process.env.DATABASE_URL) {
    const ssl = process.env.DB_SSL === 'true';
    db = new PostgresD1Database(process.env.DATABASE_URL, ssl);
    console.log(`📁 Database: PostgreSQL (${process.env.DATABASE_URL.split('@')[1]})`);
  } else {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
    db = new NodeD1Database(dbPath);
    console.log(`📁 Database: SQLite (${dbPath})`);
  }

  // Get all migration files sorted by number
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.includes('down'))
    .map(file => {
      const match = file.match(/^(\d+)\.sql$/);
      if (match) {
        return {
          number: parseInt(match[1], 10),
          file: file,
          path: join(migrationsDir, file),
        };
      }
      return null;
    })
    .filter((m): m is { number: number; file: string; path: string } => m !== null)
    .sort((a, b) => a.number - b.number);

  console.log(`📋 Found ${migrationFiles.length} migration files`);

  // Create migrations table if it doesn't exist
  const isMySQL = process.env.DB_TYPE === 'mysql';
  const isPostgres = !!process.env.DATABASE_URL;
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id ${isMySQL ? 'INT AUTO_INCREMENT PRIMARY KEY' : isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      migration_number INTEGER UNIQUE NOT NULL,
      applied_at ${isMySQL || isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'}
    );
  `);

  // Get applied migrations
  const appliedMigrationsResult = await db.prepare('SELECT migration_number FROM _migrations ORDER BY migration_number').all();
  const appliedMigrations = (appliedMigrationsResult as any).results || [];
  const appliedNumbers = new Set(appliedMigrations.map((m: any) => m.migration_number));

  // Apply pending migrations
  for (const migration of migrationFiles) {
    if (appliedNumbers.has(migration.number)) {
      console.log(`⏭️  Migration ${migration.number} already applied, skipping...`);
      continue;
    }

    console.log(`▶️  Applying migration ${migration.number}...`);
    try {
      let sql = readFileSync(migration.path, 'utf-8');
      
      // Convert SQLite syntax to MySQL or PostgreSQL
      const isMySQL = process.env.DB_TYPE === 'mysql';
      const isPostgres = !!process.env.DATABASE_URL;
      
      if (isMySQL || isPostgres) {
        if (isMySQL) {
          // MySQL conversions
          // Remove default values from TEXT columns (MySQL doesn't allow this)
          sql = sql.replace(/TEXT\s+NOT\s+NULL\s+DEFAULT\s+'[^']*'/gi, 'TEXT NOT NULL');
          sql = sql.replace(/TEXT\s+DEFAULT\s+'[^']*'/gi, 'TEXT');
          sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'INT AUTO_INCREMENT PRIMARY KEY');
          sql = sql.replace(/AUTOINCREMENT/g, 'AUTO_INCREMENT');
          sql = sql.replace(/DATETIME/g, 'TIMESTAMP');
          sql = sql.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
          sql = sql.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
          sql = sql.replace(/INTEGER PRIMARY KEY(?!\s+AUTOINCREMENT)/g, 'INT PRIMARY KEY');
          sql = sql.replace(/TEXT/g, 'TEXT');
        } else {
          // PostgreSQL conversions
          sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
          sql = sql.replace(/AUTOINCREMENT/g, '');
          sql = sql.replace(/DATETIME/g, 'TIMESTAMP');
          sql = sql.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
          sql = sql.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
          sql = sql.replace(/INTEGER PRIMARY KEY(?!\s+AUTOINCREMENT)/g, 'SERIAL PRIMARY KEY');
        }
        
        // Add IF NOT EXISTS to CREATE TABLE statements
        sql = sql.replace(/CREATE TABLE (\w+)/g, 'CREATE TABLE IF NOT EXISTS $1');
        
        // Add IF NOT EXISTS to CREATE INDEX statements
        sql = sql.replace(/CREATE INDEX (\w+)/g, 'CREATE INDEX IF NOT EXISTS $1');
      }
      
      await db.exec(sql);
      
      // Record migration
      await db.prepare('INSERT INTO _migrations (migration_number) VALUES (?)')
        .bind(migration.number)
        .run();
      
      console.log(`✅ Migration ${migration.number} applied successfully`);
    } catch (error: any) {
      console.error(`❌ Error applying migration ${migration.number}:`, error.message);
      throw error;
    }
  }

  console.log('✅ All migrations completed!');
  await db.close();
})().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

