import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import type { D1Database, D1PreparedStatement, D1Result, D1ExecResult } from '@cloudflare/workers-types';

// D1DatabaseSession is declared but not exported, so we define a compatible type
type D1DatabaseSession = D1Database & {
  getBookmark: () => string | null;
};

/**
 * D1Database adapter for Node.js using MySQL
 * This mimics the Cloudflare D1 API so the worker code doesn't need changes
 */
export class MysqlD1Database implements D1Database {
  private pool: Pool;

  constructor(config: {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
    ssl?: boolean;
  }) {
    this.pool = createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port || 3306,
      ssl: config.ssl ? {} : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async connect(): Promise<void> {
    // Connection is managed by pool
  }

  prepare(query: string): D1PreparedStatement {
    return new MysqlD1PreparedStatement(this.pool, query);
  }

  withSession(constraintOrBookmark?: string): D1DatabaseSession {
    // Not implemented for MySQL - return a minimal session
    return {
      ...this,
      getBookmark: () => '',
    } as D1DatabaseSession;
  }

  dump(): Promise<ArrayBuffer> {
    // Not implemented for MySQL
    return Promise.resolve(new ArrayBuffer(0));
  }

  async exec(query: string): Promise<D1ExecResult> {
    const statements = query.split(';').filter(s => s.trim());
    const results: any[] = [];

    const connection = await this.pool.getConnection();
    try {
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const [result]: any = await connection.execute(statement);
            results.push({
              success: true,
              meta: {
                changes: result.affectedRows || 0,
                last_insert_rowid: result.insertId || null,
                duration: 0,
                rows_read: result.affectedRows || 0,
                rows_written: result.affectedRows || 0,
                size_after: 0,
              },
            });
          } catch (error: any) {
            console.error('Error executing statement:', error.message);
            throw error;
          }
        }
      }
    } finally {
      connection.release();
    }

    return {
      success: true,
      meta: {
        duration: 0,
        size_after: 0,
      },
      results,
      count: results.length,
      duration: 0,
    } as D1ExecResult;
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return Promise.all(statements.map(stmt => stmt.all<T>()));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  get raw(): Pool {
    return this.pool as any;
  }
}

/**
 * MySQL D1PreparedStatement adapter
 */
class MysqlD1PreparedStatement implements D1PreparedStatement {
  private pool: Pool;
  private query: string;

  constructor(pool: Pool, query: string) {
    this.pool = pool;
    this.query = query;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new BoundMysqlD1PreparedStatement(this.pool, this.query, values);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const [rows]: any = await this.pool.execute(this.query);
      const row = rows[0] as T | undefined;
      if (colName && row && typeof row === 'object') {
        return Promise.resolve((row as any)[colName] ?? null);
      }
      return Promise.resolve((row as T) ?? null);
    } catch (error) {
      console.error('Error in first():', error);
      return null;
    }
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    try {
      const [result]: any = await this.pool.execute(this.query);
      return {
        success: true,
        meta: {
          changes: result.affectedRows || 0,
          last_insert_rowid: result.insertId || null,
          last_row_id: result.insertId || null,
          changed_db: false,
          duration: 0,
          rows_read: 0,
          rows_written: result.affectedRows || 0,
          size_after: 0,
        },
      } as unknown as D1Result<T>;
    } catch (error: any) {
      console.error('Error in run():', error.message);
      throw error;
    }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    try {
      const [rows]: any = await this.pool.execute(this.query);
      return {
        success: true,
        meta: {
          duration: 0,
          size_after: 0,
          rows_read: rows.length || 0,
          rows_written: 0,
        },
        results: rows as T[],
      } as D1Result<T>;
    } catch (error: any) {
      console.error('Error in all():', error.message);
      throw error;
    }
  }

  async raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  async raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
    try {
      const [rows]: any = await this.pool.execute(this.query);
      const typedRows = rows as T[];
      if (options?.columnNames) {
        const columnNames: string[] = [];
        try {
          const firstRow = typedRows[0] as any;
          if (firstRow) {
            columnNames.push(...Object.keys(firstRow));
          }
        } catch {
          // Fallback if we can't get column names
        }
        return [columnNames, ...typedRows] as [string[], ...T[]];
      }
      return typedRows;
    } catch (error: any) {
      console.error('Error in raw():', error.message);
      throw error;
    }
  }
}

/**
 * Convert a date to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
 */
function toMySQLDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Convert a date to MySQL date format (YYYY-MM-DD) for DATE columns
 */
function toMySQLDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert date values in an array to MySQL format
 */
function convertDatesForMySQL(values: unknown[]): unknown[] {
  return values.map(value => {
    // Skip null values
    if (value === null || value === undefined) {
      return value;
    }
    // If it's a Date object, convert it to MySQL datetime
    if (value instanceof Date) {
      return toMySQLDateTime(value);
    }
    // If it's an ISO 8601 datetime string (with time), convert to MySQL datetime
    if (typeof value === 'string') {
      // Match ISO 8601 with time: 2026-01-19T12:36:56.984Z or 2026-01-19T12:36:56Z or 2026-01-19T14:10:34.278Z
      // This regex matches: YYYY-MM-DDTHH:MM:SS (with optional milliseconds and timezone)
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        try {
          return toMySQLDateTime(value);
        } catch (error) {
          console.error(`[MySQL] Failed to convert date string: ${value}`, error);
          return value; // Return original if conversion fails
        }
      }
      // Match date-only string: 2026-01-19
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value; // DATE columns accept YYYY-MM-DD format directly
      }
    }
    return value;
  });
}

/**
 * Bound prepared statement (after calling .bind())
 */
class BoundMysqlD1PreparedStatement implements D1PreparedStatement {
  private pool: Pool;
  private query: string;
  private values: unknown[];

  constructor(pool: Pool, query: string, values: unknown[]) {
    this.pool = pool;
    this.query = query;
    // Convert ISO 8601 dates to MySQL format
    const convertedValues = convertDatesForMySQL(values);

    // Safety check: Ensure no NaN or undefined values are passed to MySQL execute
    // as mysql2 is very strict about prepared statement arguments
    this.values = convertedValues.map(v => {
      if (typeof v === 'number' && isNaN(v)) {
        console.warn('[MySQL] Detected NaN value in query parameters, converting to 0');
        return 0;
      }
      if (v === undefined) {
        return null;
      }
      return v;
    });

    // Debug: Log if any values were converted (only in development)
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
      const originalValues = [...values];
      const converted = originalValues.some((val, i) => val !== this.values[i]);
      if (converted) {
        console.log('[MySQL] Value conversion applied:', {
          original: originalValues,
          converted: this.values
        });
      }
    }
  }

  bind(...values: unknown[]): D1PreparedStatement {
    // Convert dates in the new values before adding them
    const convertedNewValues = convertDatesForMySQL(values);
    return new BoundMysqlD1PreparedStatement(
      this.pool,
      this.query,
      [...this.values, ...convertedNewValues]
    );
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const [rows]: any = await this.pool.execute(this.query, this.values);
      const row = rows[0] as T | undefined;
      if (colName && row && typeof row === 'object') {
        return (row as any)[colName] ?? null;
      }
      return (row as T) ?? null;
    } catch (error: any) {
      console.error('Error in bound first():', error.message);
      return null;
    }
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    try {
      const [result]: any = await this.pool.execute(this.query, this.values);
      return {
        success: true,
        meta: {
          changes: result.affectedRows || 0,
          last_insert_rowid: result.insertId || null,
          last_row_id: result.insertId || null,
          changed_db: false,
          duration: 0,
          rows_read: 0,
          rows_written: result.affectedRows || 0,
          size_after: 0,
        },
      } as unknown as D1Result<T>;
    } catch (error: any) {
      console.error('Error in bound run():', error.message);
      throw error;
    }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    try {
      const [rows]: any = await this.pool.execute(this.query, this.values);
      return {
        success: true,
        meta: {
          duration: 0,
          size_after: 0,
          rows_read: rows.length || 0,
          rows_written: 0,
        },
        results: rows as T[],
      } as D1Result<T>;
    } catch (error: any) {
      console.error('Error in bound all():', error.message);
      throw error;
    }
  }

  async raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  async raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
    try {
      const [rows]: any = await this.pool.execute(this.query, this.values);
      const typedRows = rows as T[];
      if (options?.columnNames) {
        const columnNames: string[] = [];
        try {
          const firstRow = typedRows[0] as any;
          if (firstRow) {
            columnNames.push(...Object.keys(firstRow));
          }
        } catch {
          // Fallback if we can't get column names
        }
        return [columnNames, ...typedRows] as [string[], ...T[]];
      }
      return typedRows;
    } catch (error: any) {
      console.error('Error in bound raw():', error.message);
      throw error;
    }
  }
}

