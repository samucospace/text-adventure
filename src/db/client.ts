import { open, type DB, type Scalar } from '@op-engineering/op-sqlite';
import { runMigrations } from './migrations';

export type SQLiteParam = Scalar | undefined;

export interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SQLiteParam[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: SQLiteParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: SQLiteParam[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

function normalizeParams(params?: SQLiteParam[]): Scalar[] {
  if (!params) return [];
  return params.map((p) => (p === undefined ? null : p));
}

function wrapDatabase(rawDb: DB): SQLiteDatabase {
  const db: SQLiteDatabase = {
    async execAsync(sql: string) {
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of statements) {
        await rawDb.execute(stmt);
      }
    },

    async runAsync(sql: string, params?: SQLiteParam[]) {
      await rawDb.execute(sql, normalizeParams(params));
    },

    async getAllAsync<T>(sql: string, params?: SQLiteParam[]): Promise<T[]> {
      const result = await rawDb.execute(sql, normalizeParams(params));
      return (result.rows ?? []) as T[];
    },

    async getFirstAsync<T>(sql: string, params?: SQLiteParam[]): Promise<T | null> {
      const rows = await db.getAllAsync<T>(sql, params);
      return rows[0] ?? null;
    },

    async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
      await rawDb.transaction(async () => {
        await fn();
      });
    },
  };

  return db;
}

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = (async () => {
      const rawDb = open({ name: 'cyoa_adventure.db' });
      const db = wrapDatabase(rawDb);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await runMigrations(db);
      dbInstance = db;
      return db;
    })();
  }
  return initPromise;
}
