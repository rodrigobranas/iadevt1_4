import type { Database } from "bun:sqlite";
import type { Migration } from "../migrations";

export const migration001InitialSchema: Migration = {
  id: "001",
  name: "initial_schema",
  up: (db: Database) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        assignee TEXT,
        due_date TEXT,
        labels TEXT NOT NULL,
        priority TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    db.exec(`CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cards_board ON cards(board_id)`);
  }
};