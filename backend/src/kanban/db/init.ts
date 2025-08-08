import { MigrationRunner } from './migrations';
import { allMigrations } from './migrations/index';
import { getDb, isDbHealthy } from './sqlite';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing Kanban database...');

    const db = getDb();

    if (!isDbHealthy()) {
      throw new Error('Database connection is not healthy');
    }

    const runner = new MigrationRunner();
    await runner.runMigrations(allMigrations);

    const tableCheck = db
      .query(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('boards', 'columns', 'cards')
      ORDER BY name
    `,
      )
      .all() as { name: string }[];

    if (tableCheck.length !== 3) {
      throw new Error(`Expected 3 tables, found ${tableCheck.length}`);
    }

    const indexCheck = db
      .query(
        `
      SELECT name FROM sqlite_master 
      WHERE type='index' 
      AND name IN ('idx_columns_board', 'idx_cards_column', 'idx_cards_board')
      ORDER BY name
    `,
      )
      .all() as { name: string }[];

    if (indexCheck.length !== 3) {
      throw new Error(`Expected 3 indices, found ${indexCheck.length}`);
    }

    console.log('✅ Kanban database initialized successfully');
    console.log('📊 Tables created:', tableCheck.map((t) => t.name).join(', '));
    console.log('🔍 Indices created:', indexCheck.map((i) => i.name).join(', '));
  } catch (error) {
    console.error('❌ Failed to initialize Kanban database:', error);
    throw error;
  }
}
