import { describe, test, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { SqliteBoardRepository } from "../../src/kanban/repositories/sqlite/board-repository";
import { MigrationRunner } from "../../src/kanban/db/migrations";
import { migration001InitialSchema } from "../../src/kanban/db/migrations/001_initial_schema";

describe("SqliteBoardRepository", () => {
  let db: Database;
  let repository: SqliteBoardRepository;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    
    const runner = new MigrationRunner(db);
    runner.runMigrations([migration001InitialSchema]);
    
    repository = new SqliteBoardRepository(db);
  });

  test("should create a board", async () => {
    const board = await repository.create("Test Board");
    
    expect(board.id).toBeDefined();
    expect(board.name).toBe("Test Board");
    expect(board.createdAt).toBeDefined();
    expect(board.updatedAt).toBeDefined();
  });

  test("should get board by id", async () => {
    const created = await repository.create("Test Board");
    const board = await repository.getById(created.id);
    
    expect(board).not.toBeNull();
    expect(board?.id).toBe(created.id);
    expect(board?.name).toBe("Test Board");
  });

  test("should return null for non-existent board", async () => {
    const board = await repository.getById("non-existent");
    expect(board).toBeNull();
  });

  test("should list all boards", async () => {
    await repository.create("Board 1");
    await repository.create("Board 2");
    await repository.create("Board 3");
    
    const boards = await repository.list();
    
    expect(boards.length).toBe(3);
    const boardNames = boards.map(b => b.name);
    expect(boardNames).toContain("Board 1");
    expect(boardNames).toContain("Board 2");
    expect(boardNames).toContain("Board 3");
  });

  test("should rename a board", async () => {
    const created = await repository.create("Original Name");
    const renamed = await repository.rename(created.id, "New Name");
    
    expect(renamed.name).toBe("New Name");
    expect(renamed.updatedAt).toBeDefined();
  });

  test("should delete a board", async () => {
    const board = await repository.create("To Delete");
    await repository.delete(board.id);
    
    const deleted = await repository.getById(board.id);
    expect(deleted).toBeNull();
  });
});