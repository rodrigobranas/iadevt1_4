import { describe, test, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { SqliteBoardRepository } from "../../src/kanban/repositories/sqlite/board-repository";
import { SqliteColumnRepository } from "../../src/kanban/repositories/sqlite/column-repository";
import { MigrationRunner } from "../../src/kanban/db/migrations";
import { migration001InitialSchema } from "../../src/kanban/db/migrations/001_initial_schema";

describe("SqliteColumnRepository", () => {
  let db: Database;
  let boardRepository: SqliteBoardRepository;
  let columnRepository: SqliteColumnRepository;
  let boardId: string;

  beforeEach(async () => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    
    const runner = new MigrationRunner(db);
    runner.runMigrations([migration001InitialSchema]);
    
    boardRepository = new SqliteBoardRepository(db);
    columnRepository = new SqliteColumnRepository(db);
    
    const board = await boardRepository.create("Test Board");
    boardId = board.id;
  });

  test("should create a column", async () => {
    const column = await columnRepository.create(boardId, "To Do");
    
    expect(column.id).toBeDefined();
    expect(column.boardId).toBe(boardId);
    expect(column.name).toBe("To Do");
    expect(column.position).toBe(0);
  });

  test("should create columns with auto-incrementing positions", async () => {
    const col1 = await columnRepository.create(boardId, "To Do");
    const col2 = await columnRepository.create(boardId, "In Progress");
    const col3 = await columnRepository.create(boardId, "Done");
    
    expect(col1.position).toBe(0);
    expect(col2.position).toBe(1);
    expect(col3.position).toBe(2);
  });

  test("should insert column at specific position", async () => {
    const col1 = await columnRepository.create(boardId, "To Do");
    const col2 = await columnRepository.create(boardId, "Done");
    const col3 = await columnRepository.create(boardId, "In Progress", 1);
    
    const columns = await columnRepository.list(boardId);
    
    expect(columns[0].name).toBe("To Do");
    expect(columns[1].name).toBe("In Progress");
    expect(columns[2].name).toBe("Done");
  });

  test("should list columns in order", async () => {
    await columnRepository.create(boardId, "To Do");
    await columnRepository.create(boardId, "In Progress");
    await columnRepository.create(boardId, "Done");
    
    const columns = await columnRepository.list(boardId);
    
    expect(columns.length).toBe(3);
    expect(columns[0].name).toBe("To Do");
    expect(columns[1].name).toBe("In Progress");
    expect(columns[2].name).toBe("Done");
  });

  test("should reorder columns", async () => {
    const col1 = await columnRepository.create(boardId, "To Do");
    const col2 = await columnRepository.create(boardId, "In Progress");
    const col3 = await columnRepository.create(boardId, "Done");
    
    await columnRepository.reorder(col3.id, 0);
    
    const columns = await columnRepository.list(boardId);
    
    expect(columns[0].name).toBe("Done");
    expect(columns[1].name).toBe("To Do");
    expect(columns[2].name).toBe("In Progress");
  });

  test("should delete column and normalize positions", async () => {
    const col1 = await columnRepository.create(boardId, "To Do");
    const col2 = await columnRepository.create(boardId, "In Progress");
    const col3 = await columnRepository.create(boardId, "Done");
    
    await columnRepository.delete(col2.id);
    
    const columns = await columnRepository.list(boardId);
    
    expect(columns.length).toBe(2);
    expect(columns[0].name).toBe("To Do");
    expect(columns[0].position).toBe(0);
    expect(columns[1].name).toBe("Done");
    expect(columns[1].position).toBe(1);
  });

  test("should set column order for board", async () => {
    const col1 = await columnRepository.create(boardId, "To Do");
    const col2 = await columnRepository.create(boardId, "In Progress");
    const col3 = await columnRepository.create(boardId, "Done");
    
    await columnRepository.setOrderForBoard(boardId, [col3.id, col1.id, col2.id]);
    
    const columns = await columnRepository.list(boardId);
    
    expect(columns[0].name).toBe("Done");
    expect(columns[1].name).toBe("To Do");
    expect(columns[2].name).toBe("In Progress");
  });
});