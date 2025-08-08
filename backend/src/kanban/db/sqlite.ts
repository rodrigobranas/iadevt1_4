import { Database } from 'bun:sqlite';
import { join } from 'path';

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'kanban.db');

    db = new Database(dbPath, { create: true });

    db.exec('PRAGMA foreign_keys = ON');

    db.exec('PRAGMA journal_mode = WAL');

    db.exec('PRAGMA busy_timeout = 5000');

    console.log(`✅ SQLite database initialized at: ${dbPath}`);
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 SQLite database connection closed');
  }
}

export function isDbHealthy(): boolean {
  try {
    const db = getDb();
    const result = db.query('SELECT 1 as health').get() as { health: number } | undefined;
    return result?.health === 1;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}
