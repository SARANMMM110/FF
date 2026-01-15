import { Pool, Client } from 'pg';
import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types';

/**
 * D1Database adapter for Node.js using PostgreSQL
 * This mimics the Cloudflare D1 API so the worker code doesn't need changes
 */
export class PostgresD1Database implements D1Database {
  private pool: Pool;
  private client?: Client;

  constructor(connectionString: string, ssl: boolean = false) {
    this.pool = new Pool({
      connectionString,
      ssl: ssl ? { rejectUnauthorized: false } : false,
    });
  }

  async connect(): Promise<void> {
    this.client = await this.pool.connect() as any;
  }

  prepare(query: string): D1PreparedStatement {
    return new PostgresD1PreparedStatement(this.pool, query);
  }

  withSession(constraintOrBookmark?: string): D1DatabaseSession {
    // Not implemented for PostgreSQL - return a minimal session
    return {
      ...this,
      getBookmark: () => '',
    } as D1DatabaseSession;
  }

  dump(): Promise<ArrayBuffer> {
    // Not implemented for PostgreSQL
    return Promise.resolve(new ArrayBuffer(0));
  }

  async exec(query: string): Promise<D1ExecResult> {
    const statements = query.split(';').filter(s => s.trim());
    const results: any[] = [];
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const result = await this.pool.query(statement);
          results.push({
            success: true,
            meta: {
              changes: result.rowCount || 0,
              last_insert_rowid: result.rows[0]?.id || null,
              last_row_id: result.rows[0]?.id || null,
              changed_db: false,
              duration: 0,
              rows_read: result.rowCount || 0,
              rows_written: result.rowCount || 0,
              size_after: 0,
            },
          });
        } catch (error: any) {
          console.error('Error executing statement:', error.message);
          throw error;
        }
      }
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
    return this.pool;
  }
}

/**
 * PostgreSQL D1PreparedStatement adapter
 */
class PostgresD1PreparedStatement implements D1PreparedStatement {
  private pool: Pool;
  private query: string;

  constructor(pool: Pool, query: string) {
    this.pool = pool;
    this.query = query;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new BoundPostgresD1PreparedStatement(this.pool, this.query, values);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const result = await this.pool.query(this.query);
      const row = result.rows[0] as T | undefined;
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
      const result = await this.pool.query(this.query);
      return {
        success: true,
        meta: {
          changes: result.rowCount || 0,
          last_insert_rowid: result.rows[0]?.id || null,
          last_row_id: result.rows[0]?.id || null,
          changed_db: false,
          duration: 0,
          rows_read: 0,
          rows_written: result.rowCount || 0,
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
      const result = await this.pool.query(this.query);
      return {
        success: true,
        meta: {
          duration: 0,
          size_after: 0,
          rows_read: result.rowCount || 0,
          rows_written: 0,
        },
        results: result.rows as T[],
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
      const result = await this.pool.query(this.query);
      if (options?.columnNames) {
        const columnNames = result.fields?.map(f => f.name) || [];
        return [columnNames, ...result.rows] as [string[], ...T[]];
      }
      return result.rows as T[];
    } catch (error: any) {
      console.error('Error in raw():', error.message);
      throw error;
    }
  }
}

/**
 * Bound prepared statement (after calling .bind())
 */
class BoundPostgresD1PreparedStatement implements D1PreparedStatement {
  private pool: Pool;
  private query: string;
  private values: unknown[];

  constructor(pool: Pool, query: string, values: unknown[]) {
    this.pool = pool;
    this.query = query;
    this.values = values;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new BoundPostgresD1PreparedStatement(
      this.pool,
      this.query,
      [...this.values, ...values]
    );
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const result = await this.pool.query(this.query, this.values);
      const row = result.rows[0] as T | undefined;
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
      const result = await this.pool.query(this.query, this.values);
      return {
        success: true,
        meta: {
          changes: result.rowCount || 0,
          last_insert_rowid: result.rows[0]?.id || null,
          last_row_id: result.rows[0]?.id || null,
          changed_db: false,
          duration: 0,
          rows_read: 0,
          rows_written: result.rowCount || 0,
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
      const result = await this.pool.query(this.query, this.values);
      return {
        success: true,
        meta: {
          duration: 0,
          size_after: 0,
          rows_read: result.rowCount || 0,
          rows_written: 0,
        },
        results: result.rows as T[],
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
      const result = await this.pool.query(this.query, this.values);
      if (options?.columnNames) {
        const columnNames = result.fields?.map(f => f.name) || [];
        return [columnNames, ...result.rows] as [string[], ...T[]];
      }
      return result.rows as T[];
    } catch (error: any) {
      console.error('Error in bound raw():', error.message);
      throw error;
    }
  }
}

