import Database from 'better-sqlite3';
import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types';

/**
 * D1Database adapter for Node.js using better-sqlite3
 * This mimics the Cloudflare D1 API so the worker code doesn't need changes
 */
export class NodeD1Database implements D1Database {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
  }

  prepare(query: string): D1PreparedStatement {
    return new NodeD1PreparedStatement(this.db, query);
  }

  async exec(query: string): Promise<D1ExecResult> {
    const statements = query.split(';').filter(s => s.trim());
    const results: any[] = [];
    
    for (const statement of statements) {
      if (statement.trim()) {
        const stmt = this.db.prepare(statement);
        const result = stmt.run();
        results.push({
          success: true,
          meta: {
            changes: result.changes,
            last_insert_rowid: result.lastInsertRowid,
            last_row_id: result.lastInsertRowid,
            changed_db: false,
            duration: 0,
            rows_read: 0,
            rows_written: result.changes,
            size_after: 0,
          },
        });
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

  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return Promise.all(statements.map(stmt => stmt.all<T>()));
  }

  close(): void {
    this.db.close();
  }

  withSession(constraintOrBookmark?: string): D1DatabaseSession {
    // Not implemented for local SQLite - return a minimal session
    return {
      ...this,
      getBookmark: () => '',
    } as D1DatabaseSession;
  }

  dump(): Promise<ArrayBuffer> {
    // Not implemented for local SQLite
    return Promise.resolve(new ArrayBuffer(0));
  }

  get raw(): Database.Database {
    return this.db;
  }
}

/**
 * D1PreparedStatement adapter
 */
class NodeD1PreparedStatement implements D1PreparedStatement {
  private db: Database.Database;
  private query: string;
  private stmt: Database.Statement | null = null;

  constructor(db: Database.Database, query: string) {
    this.db = db;
    this.query = query;
  }

  private getStatement(): Database.Statement {
    if (!this.stmt) {
      this.stmt = this.db.prepare(this.query);
    }
    return this.stmt;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    // Create a new statement with bound values
    const stmt = this.db.prepare(this.query);
    return new BoundD1PreparedStatement(this.db, this.query, stmt, values);
  }

  first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.getStatement();
    const row = stmt.get() as T | undefined;
    if (colName && row && typeof row === 'object') {
      return Promise.resolve((row as any)[colName] ?? null);
    }
    return Promise.resolve((row as T) ?? null);
  }

  run<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.getStatement();
    const result = stmt.run() as Database.RunResult;
    
    return Promise.resolve({
      success: true,
      meta: {
        changes: result.changes,
        last_insert_rowid: result.lastInsertRowid,
        last_row_id: result.lastInsertRowid,
        changed_db: false,
        duration: 0,
        rows_read: 0,
        rows_written: result.changes,
        size_after: 0,
      },
    } as unknown as D1Result<T>);
  }

  all<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.getStatement();
    const rows = stmt.all() as T[];
    
    return Promise.resolve({
      success: true,
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: rows.length,
        rows_written: 0,
      },
      results: rows,
    } as D1Result<T>);
  }

  raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
    const stmt = this.getStatement();
    const rows = stmt.all() as T[];
    if (options?.columnNames) {
      // Get column names from the statement
      const columnNames: string[] = [];
      try {
        const firstRow = rows[0] as any;
        if (firstRow) {
          columnNames.push(...Object.keys(firstRow));
        }
      } catch {
        // Fallback if we can't get column names
      }
      return Promise.resolve([columnNames, ...rows] as [string[], ...T[]]);
    }
    return Promise.resolve(rows);
  }
}

/**
 * Bound prepared statement (after calling .bind())
 */
class BoundD1PreparedStatement implements D1PreparedStatement {
  private db: Database.Database;
  private query: string;
  private stmt: Database.Statement;
  private values: unknown[];

  constructor(
    db: Database.Database,
    query: string,
    stmt: Database.Statement,
    values: unknown[]
  ) {
    this.db = db;
    this.query = query;
    this.stmt = stmt;
    this.values = values;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    // Combine with existing bound values
    return new BoundD1PreparedStatement(
      this.db,
      this.query,
      this.db.prepare(this.query),
      [...this.values, ...values]
    );
  }

  first<T = unknown>(colName?: string): Promise<T | null> {
    const row = this.stmt.get(...this.values) as T | undefined;
    if (colName && row && typeof row === 'object') {
      return Promise.resolve((row as any)[colName] ?? null);
    }
    return Promise.resolve((row as T) ?? null);
  }

  run<T = unknown>(): Promise<D1Result<T>> {
    const result = this.stmt.run(...this.values) as Database.RunResult;
    
    return Promise.resolve({
      success: true,
      meta: {
        changes: result.changes,
        last_insert_rowid: result.lastInsertRowid,
        last_row_id: result.lastInsertRowid,
        changed_db: false,
        duration: 0,
        rows_read: 0,
        rows_written: result.changes,
        size_after: 0,
      },
    } as unknown as D1Result<T>);
  }

  all<T = unknown>(): Promise<D1Result<T>> {
    const rows = this.stmt.all(...this.values) as T[];
    
    return Promise.resolve({
      success: true,
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: rows.length,
        rows_written: 0,
      },
      results: rows,
    } as D1Result<T>);
  }

  raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
    const rows = this.stmt.all(...this.values) as T[];
    if (options?.columnNames) {
      const columnNames: string[] = [];
      try {
        const firstRow = rows[0] as any;
        if (firstRow) {
          columnNames.push(...Object.keys(firstRow));
        }
      } catch {
        // Fallback if we can't get column names
      }
      return Promise.resolve([columnNames, ...rows] as [string[], ...T[]]);
    }
    return Promise.resolve(rows);
  }
}

