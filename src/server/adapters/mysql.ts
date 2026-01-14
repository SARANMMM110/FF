import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types';

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

  async exec(query: string): Promise<D1Result> {
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
    } as D1Result;
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
          duration: 0,
          rows_read: 0,
          rows_written: result.affectedRows || 0,
          size_after: 0,
        },
      } as D1Result<T>;
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

  async raw<T = unknown>(): Promise<T[]> {
    try {
      const [rows]: any = await this.pool.execute(this.query);
      return rows as T[];
    } catch (error: any) {
      console.error('Error in raw():', error.message);
      throw error;
    }
  }
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
    this.values = values;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new BoundMysqlD1PreparedStatement(
      this.pool,
      this.query,
      [...this.values, ...values]
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
          duration: 0,
          rows_read: 0,
          rows_written: result.affectedRows || 0,
          size_after: 0,
        },
      } as D1Result<T>;
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

  async raw<T = unknown>(): Promise<T[]> {
    try {
      const [rows]: any = await this.pool.execute(this.query, this.values);
      return rows as T[];
    } catch (error: any) {
      console.error('Error in bound raw():', error.message);
      throw error;
    }
  }
}

