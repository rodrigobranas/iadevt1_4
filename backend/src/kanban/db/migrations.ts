import type { Database } from "bun:sqlite";
import { getDb } from "./sqlite";

export interface Migration {
  id: string;
  name: string;
  up: (db: Database) => void;
}

export class MigrationRunner {
  private db: Database;
  
  constructor(db?: Database) {
    this.db = db || getDb();
    this.ensureMigrationsTable();
  }
  
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);
  }
  
  private hasBeenApplied(migrationId: string): boolean {
    const result = this.db.query(
      "SELECT id FROM migrations WHERE id = ?"
    ).get(migrationId) as { id: string } | undefined;
    
    return !!result;
  }
  
  private markAsApplied(migration: Migration): void {
    this.db.query(
      "INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)"
    ).run(migration.id, migration.name, new Date().toISOString());
  }
  
  public async runMigrations(migrations: Migration[]): Promise<void> {
    console.log("🔄 Running database migrations...");
    
    let appliedCount = 0;
    
    for (const migration of migrations) {
      if (this.hasBeenApplied(migration.id)) {
        console.log(`⏭️  Migration ${migration.id} (${migration.name}) already applied, skipping...`);
        continue;
      }
      
      console.log(`▶️  Applying migration ${migration.id}: ${migration.name}`);
      
      try {
        this.db.transaction(() => {
          migration.up(this.db);
          this.markAsApplied(migration);
        })();
        
        appliedCount++;
        console.log(`✅ Migration ${migration.id} applied successfully`);
      } catch (error) {
        console.error(`❌ Failed to apply migration ${migration.id}:`, error);
        throw new Error(`Migration ${migration.id} failed: ${error}`);
      }
    }
    
    if (appliedCount > 0) {
      console.log(`✅ Applied ${appliedCount} migration(s) successfully`);
    } else {
      console.log("✅ All migrations are up to date");
    }
  }
}