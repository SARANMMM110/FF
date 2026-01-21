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
        // First, extract table schemas to identify TEXT columns
        const textColumns = new Map<string, Set<string>>(); // table -> set of TEXT column names
        const uniqueTextColumns = new Map<string, Set<string>>(); // table -> set of UNIQUE TEXT column names
        
        if (isMySQL) {
          // Extract CREATE TABLE statements and identify TEXT columns
          const tableMatches = sql.matchAll(/CREATE TABLE\s+(\w+)\s*\(([^)]+)\)/gi);
          for (const match of tableMatches) {
            const tableName = match[1];
            const columnsDef = match[2];
            const textCols = new Set<string>();
            
            // Parse column definitions
            const columnLines = columnsDef.split(',').map((line: string) => line.trim());
            for (const line of columnLines) {
              // Match: column_name TEXT ...
              const colMatch = line.match(/^(\w+)\s+TEXT/i);
              if (colMatch) {
                textCols.add(colMatch[1]);
              }
              
              // Also track UNIQUE TEXT columns
              const uniqueMatch = line.match(/^(\w+)\s+TEXT.*UNIQUE/i);
              if (uniqueMatch) {
                if (!uniqueTextColumns.has(tableName)) {
                  uniqueTextColumns.set(tableName, new Set<string>());
                }
                uniqueTextColumns.get(tableName)!.add(uniqueMatch[1]);
              }
            }
            
            if (textCols.size > 0) {
              textColumns.set(tableName, textCols);
            }
          }
        }
        
        if (isMySQL) {
          // Track multi-column UNIQUE constraints on TEXT columns
          const multiColumnUniqueConstraints: Array<{table: string, columns: string[]}> = [];
          
          // Extract multi-column UNIQUE constraints before conversion
          const tableMatchesForMultiUnique = sql.matchAll(/CREATE TABLE\s+(\w+)\s*\(([^)]+)\)/gi);
          for (const match of tableMatchesForMultiUnique) {
            const tableName = match[1];
            const columnsDef = match[2];
            
            // Look for UNIQUE(column1, column2, ...) patterns
            const uniqueMatch = columnsDef.match(/UNIQUE\s*\(([^)]+)\)/i);
            if (uniqueMatch) {
              const uniqueCols = uniqueMatch[1].split(',').map((col: string) => col.trim());
              // Check if any of these columns are TEXT
              const textCols = textColumns.get(tableName) || new Set<string>();
              const hasTextCols = uniqueCols.some((col: string) => textCols.has(col));
              
              if (hasTextCols) {
                multiColumnUniqueConstraints.push({
                  table: tableName,
                  columns: uniqueCols
                });
              }
            }
          }
          
          // MySQL conversions
          // Remove UNIQUE from TEXT columns (MySQL requires key length, handle via UNIQUE INDEX instead)
          sql = sql.replace(/TEXT\s+NOT\s+NULL\s+UNIQUE/gi, 'TEXT NOT NULL');
          sql = sql.replace(/TEXT\s+UNIQUE/gi, 'TEXT');
          // Remove multi-column UNIQUE constraints that involve TEXT columns
          // First, use a general pattern to remove ALL UNIQUE(...) that contain TEXT columns
          sql = sql.replace(/UNIQUE\s*\(([^)]+)\)/gi, (match, columnsStr) => {
            const cols = columnsStr.split(',').map((c: string) => c.trim());
            // Check if any of these columns are TEXT in any table
            for (const [tableName, textCols] of textColumns.entries()) {
              if (cols.some((col: string) => textCols.has(col))) {
                return ''; // Remove this UNIQUE constraint
              }
            }
            return match; // Keep it if no TEXT columns involved
          });
          
          // Also clean up any trailing commas that might be left
          sql = sql.replace(/,\s*,/g, ','); // Remove double commas
          sql = sql.replace(/,\s*\)/g, ')'); // Remove comma before closing paren
          sql = sql.replace(/\(\s*,/g, '('); // Remove comma after opening paren
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
          
          // Escape reserved keywords in ALTER TABLE statements (e.g., 'repeat' is a MySQL reserved keyword)
          // Pattern: ALTER TABLE table ADD COLUMN column_name ... -> ALTER TABLE table ADD COLUMN `column_name` ...
          sql = sql.replace(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)(\s+.*?)(?=;|$)/gi, (match, tableName, columnName, rest) => {
            // List of common MySQL reserved keywords that might be used as column names
            const reservedKeywords = new Set([
              'repeat', 'order', 'group', 'select', 'insert', 'update', 'delete', 'create', 'drop',
              'alter', 'table', 'index', 'key', 'primary', 'foreign', 'references', 'constraint',
              'default', 'null', 'not', 'unique', 'check', 'auto_increment', 'timestamp', 'datetime',
              'date', 'time', 'year', 'text', 'varchar', 'char', 'int', 'integer', 'bigint', 'smallint',
              'tinyint', 'decimal', 'float', 'double', 'real', 'boolean', 'bool', 'blob', 'binary',
              'varbinary', 'enum', 'set', 'json'
            ]);
            
            // Escape column name if it's a reserved keyword
            if (reservedKeywords.has(columnName.toLowerCase())) {
              return `ALTER TABLE ${tableName} ADD COLUMN \`${columnName}\`${rest}`;
            }
            return match;
          });
          
          // Add UNIQUE INDEX statements for multi-column UNIQUE constraints with TEXT columns
          for (const constraint of multiColumnUniqueConstraints) {
            const tableName = constraint.table;
            const textCols = textColumns.get(tableName) || new Set<string>();
            const indexedCols = constraint.columns.map((col: string) => {
              if (textCols.has(col)) {
                return `${col}(255)`;
              }
              return col;
            });
            const indexName = `idx_${tableName}_${constraint.columns.join('_')}_unique`;
            
            // Add UNIQUE INDEX after CREATE TABLE statement
            sql = sql.replace(
              new RegExp(`(CREATE TABLE IF NOT EXISTS ${tableName}[^;]+;)`, 'i'),
              `$1\nCREATE UNIQUE INDEX ${indexName} ON ${tableName}(${indexedCols.join(', ')});`
            );
          }
        } else {
          // PostgreSQL conversions
          sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
          sql = sql.replace(/AUTOINCREMENT/g, '');
          sql = sql.replace(/DATETIME/g, 'TIMESTAMP');
          sql = sql.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
          sql = sql.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
          sql = sql.replace(/INTEGER PRIMARY KEY(?!\s+AUTOINCREMENT)/g, 'SERIAL PRIMARY KEY');
        }
        
        // Convert SQLite INSERT syntax to MySQL/PostgreSQL
        if (isMySQL) {
          sql = sql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT IGNORE INTO');
          sql = sql.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'REPLACE INTO');
        } else if (isPostgres) {
          // PostgreSQL uses INSERT ... ON CONFLICT DO NOTHING instead
          sql = sql.replace(/INSERT\s+OR\s+IGNORE\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/gi, 
            'INSERT INTO $1 ($2) VALUES ON CONFLICT DO NOTHING');
          sql = sql.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO');
        }
        
        // Add IF NOT EXISTS to CREATE TABLE statements
        sql = sql.replace(/CREATE TABLE (\w+)/g, 'CREATE TABLE IF NOT EXISTS $1');
        
        if (isMySQL) {
          // MySQL: Add key length ONLY to TEXT columns in indexes (required by MySQL)
          sql = sql.replace(/CREATE INDEX (\w+) ON (\w+)\(([^)]+)\)/g, (match, indexName, tableName, columns) => {
            const textCols = textColumns.get(tableName) || new Set<string>();
            const uniqueTextCols = uniqueTextColumns.get(tableName) || new Set<string>();
            const cols = columns.split(',').map((col: string) => {
              const trimmed = col.trim();
              // Remove any existing length specification first
              const colName = trimmed.replace(/\([^)]*\)$/, '');
              
              // Only add key length if this is a TEXT column
              if (textCols.has(colName)) {
                return `${colName}(255)`;
              }
              return colName;
            });
            
            // Check if this index is on a single UNIQUE TEXT column - convert to UNIQUE INDEX
            const singleCol = cols.length === 1;
            const colName = singleCol ? cols[0].replace(/\([^)]*\)$/, '') : null;
            const isUniqueTextCol = colName && uniqueTextCols.has(colName);
            
            if (isUniqueTextCol && singleCol) {
              return `CREATE UNIQUE INDEX ${indexName} ON ${tableName}(${cols.join(', ')})`;
            }
            
            return `CREATE INDEX ${indexName} ON ${tableName}(${cols.join(', ')})`;
          });
          
          // For UNIQUE TEXT columns that don't have an index, add UNIQUE INDEX
          for (const [tableName, cols] of uniqueTextColumns.entries()) {
            for (const colName of cols) {
              // Check if there's already an index for this column
              const hasIndex = sql.match(new RegExp(`CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+\\w+\\s+ON\\s+${tableName}\\s*\\([^)]*${colName}`, 'i'));
              if (!hasIndex) {
                // Add UNIQUE INDEX after the CREATE TABLE statement
                sql = sql.replace(
                  new RegExp(`(CREATE TABLE IF NOT EXISTS ${tableName}[^;]+;)`, 'i'),
                  `$1\nCREATE UNIQUE INDEX idx_${tableName}_${colName}_unique ON ${tableName}(${colName}(255));`
                );
              }
            }
          }
        } else {
          // Add IF NOT EXISTS to CREATE INDEX statements (PostgreSQL only, MySQL doesn't support it)
          sql = sql.replace(/CREATE INDEX (\w+)/g, 'CREATE INDEX IF NOT EXISTS $1');
        }
      }
      
      // For MySQL, handle CREATE INDEX and ALTER TABLE ADD COLUMN statements separately to avoid duplicate errors
      if (isMySQL) {
        // Split SQL into individual statements
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (!statement.trim()) continue;
          
          // Check if this is a CREATE INDEX statement
          const indexMatch = statement.match(/CREATE\s+INDEX\s+(\w+)\s+ON/i);
          
          // Check if this is an ALTER TABLE ADD COLUMN statement
          const alterTableMatch = statement.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
          
          if (indexMatch) {
            const indexName = indexMatch[1];
            
            // Try to execute, but catch duplicate key errors
            try {
              await db.exec(statement.trim());
            } catch (execError: any) {
              // For CREATE INDEX, ignore duplicate key errors
              if (execError.code === 'ER_DUP_KEYNAME' || execError.errno === 1061) {
                console.log(`  ⏭️  Index ${indexName} already exists, skipping...`);
                continue;
              }
              throw execError;
            }
          } else if (alterTableMatch) {
            const tableName = alterTableMatch[1];
            const columnName = alterTableMatch[2];
            
            // Try to execute, but catch duplicate column errors
            try {
              await db.exec(statement.trim());
            } catch (execError: any) {
              // For ALTER TABLE ADD COLUMN, ignore duplicate column errors
              if (execError.code === 'ER_DUP_FIELDNAME' || execError.errno === 1060) {
                console.log(`  ⏭️  Column ${columnName} already exists in ${tableName}, skipping...`);
                continue;
              }
              throw execError;
            }
          } else {
            // For other statements (including prepared statements), execute normally
            await db.exec(statement.trim());
          }
        }
      } else {
        // For PostgreSQL and SQLite, execute normally
        await db.exec(sql);
      }
      
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

