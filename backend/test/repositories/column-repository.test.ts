import { describe, test, expect, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { SqliteBoardRepository } from '../../src/kanban/repositories/sqlite/board-repository';
import { SqliteColumnRepository } from '../../src/kanban/repositories/sqlite/column-repository';
import { MigrationRunner } from '../../src/kanban/db/migrations';
import { migration001InitialSchema } from '../../src/kanban/db/migrations/001_initial_schema';

describe('SqliteColumnRepository', () => {
  let db: Database;
  let boardRepository: SqliteBoardRepository;
  let columnRepository: SqliteColumnRepository;
  let boardId: string;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON');

    const runner = new MigrationRunner(db);
    runner.runMigrations([migration001InitialSchema]);

    boardRepository = new SqliteBoardRepository(db);
    columnRepository = new SqliteColumnRepository(db);

    const board = await boardRepository.create('Test Board');
    boardId = board.id;
  });

  test('should create a column', async () => {
    const column = await columnRepository.create(boardId, 'To Do');

    expect(column.id).toBeDefined();
    expect(column.boardId).toBe(boardId);
    expect(column.name).toBe('To Do');
    expect(column.position).toBe(0);
  });

  test('should create columns with auto-incrementing positions', async () => {
    const col1 = await columnRepository.create(boardId, 'To Do');
    const col2 = await columnRepository.create(boardId, 'In Progress');
    const col3 = await columnRepository.create(boardId, 'Done');

    expect(col1.position).toBe(0);
    expect(col2.position).toBe(1);
    expect(col3.position).toBe(2);
  });

  test('should insert column at specific position', async () => {
    const col1 = await columnRepository.create(boardId, 'To Do');
    const col2 = await columnRepository.create(boardId, 'Done');
    const col3 = await columnRepository.create(boardId, 'In Progress', 1);

    const columns = await columnRepository.list(boardId);

    expect(columns[0].name).toBe('To Do');
    expect(columns[1].name).toBe('In Progress');
    expect(columns[2].name).toBe('Done');
  });

  test('should list columns in order', async () => {
    await columnRepository.create(boardId, 'To Do');
    await columnRepository.create(boardId, 'In Progress');
    await columnRepository.create(boardId, 'Done');

    const columns = await columnRepository.list(boardId);

    expect(columns.length).toBe(3);
    expect(columns[0].name).toBe('To Do');
    expect(columns[1].name).toBe('In Progress');
    expect(columns[2].name).toBe('Done');
  });

  test('should reorder columns', async () => {
    const col1 = await columnRepository.create(boardId, 'To Do');
    const col2 = await columnRepository.create(boardId, 'In Progress');
    const col3 = await columnRepository.create(boardId, 'Done');

    await columnRepository.reorder(col3.id, 0);

    const columns = await columnRepository.list(boardId);

    expect(columns[0].name).toBe('Done');
    expect(columns[1].name).toBe('To Do');
    expect(columns[2].name).toBe('In Progress');
  });

  test('should delete column and normalize positions', async () => {
    const col1 = await columnRepository.create(boardId, 'To Do');
    const col2 = await columnRepository.create(boardId, 'In Progress');
    const col3 = await columnRepository.create(boardId, 'Done');

    await columnRepository.delete(col2.id);

    const columns = await columnRepository.list(boardId);

    expect(columns.length).toBe(2);
    expect(columns[0].name).toBe('To Do');
    expect(columns[0].position).toBe(0);
    expect(columns[1].name).toBe('Done');
    expect(columns[1].position).toBe(1);
  });

  test('should set column order for board', async () => {
    const col1 = await columnRepository.create(boardId, 'To Do');
    const col2 = await columnRepository.create(boardId, 'In Progress');
    const col3 = await columnRepository.create(boardId, 'Done');

    await columnRepository.setOrderForBoard(boardId, [col3.id, col1.id, col2.id]);

    const columns = await columnRepository.list(boardId);

    expect(columns[0].name).toBe('Done');
    expect(columns[1].name).toBe('To Do');
    expect(columns[2].name).toBe('In Progress');
  });

  test('should handle reordering to same position', async () => {
    const col1 = await columnRepository.create(boardId, 'Col 1');
    const col2 = await columnRepository.create(boardId, 'Col 2');
    const col3 = await columnRepository.create(boardId, 'Col 3');

    await columnRepository.reorder(col2.id, 1);

    const columns = await columnRepository.list(boardId);
    expect(columns[1].name).toBe('Col 2');
  });

  test('should handle reordering to end position', async () => {
    const col1 = await columnRepository.create(boardId, 'Col 1');
    const col2 = await columnRepository.create(boardId, 'Col 2');
    const col3 = await columnRepository.create(boardId, 'Col 3');

    await columnRepository.reorder(col1.id, 2);

    const columns = await columnRepository.list(boardId);
    expect(columns[0].name).toBe('Col 2');
    expect(columns[1].name).toBe('Col 3');
    expect(columns[2].name).toBe('Col 1');
  });

  test('should handle empty column list for new board', async () => {
    const columns = await columnRepository.list(boardId);
    expect(columns).toEqual([]);
  });

  test('should rename column', async () => {
    const col = await columnRepository.create(boardId, 'Original Name');
    const renamed = await columnRepository.rename(col.id, 'New Name');

    expect(renamed.name).toBe('New Name');
    expect(renamed.id).toBe(col.id);
    
    const retrieved = await columnRepository.getById(col.id);
    expect(retrieved?.name).toBe('New Name');
  });

  test('should handle column names with special characters', async () => {
    const specialName = 'Column "with" special & chars!';
    const col = await columnRepository.create(boardId, specialName);

    expect(col.name).toBe(specialName);
    const retrieved = await columnRepository.getById(col.id);
    expect(retrieved?.name).toBe(specialName);
  });

  test('should maintain positions when creating at specific index', async () => {
    const col1 = await columnRepository.create(boardId, 'Col 1'); // position 0
    const col2 = await columnRepository.create(boardId, 'Col 2'); // position 1
    const col3 = await columnRepository.create(boardId, 'Col 3'); // position 2
    
    // Insert at position 1
    const col4 = await columnRepository.create(boardId, 'Col 4', 1);

    const columns = await columnRepository.list(boardId);
    
    expect(columns[0].name).toBe('Col 1');
    expect(columns[0].position).toBe(0);
    expect(columns[1].name).toBe('Col 4');
    expect(columns[1].position).toBe(1);
    expect(columns[2].name).toBe('Col 2');
    expect(columns[2].position).toBe(2);
    expect(columns[3].name).toBe('Col 3');
    expect(columns[3].position).toBe(3);
  });

  test('should handle deletion of middle column', async () => {
    const col1 = await columnRepository.create(boardId, 'Col 1');
    const col2 = await columnRepository.create(boardId, 'Col 2');
    const col3 = await columnRepository.create(boardId, 'Col 3');
    const col4 = await columnRepository.create(boardId, 'Col 4');

    await columnRepository.delete(col2.id);

    const columns = await columnRepository.list(boardId);
    
    expect(columns.length).toBe(3);
    expect(columns[0].name).toBe('Col 1');
    expect(columns[0].position).toBe(0);
    expect(columns[1].name).toBe('Col 3');
    expect(columns[1].position).toBe(1);
    expect(columns[2].name).toBe('Col 4');
    expect(columns[2].position).toBe(2);
  });

  test('should handle multiple reorders', async () => {
    const col1 = await columnRepository.create(boardId, 'Col 1');
    const col2 = await columnRepository.create(boardId, 'Col 2');
    const col3 = await columnRepository.create(boardId, 'Col 3');

    await columnRepository.reorder(col1.id, 2); // Move first to last
    await columnRepository.reorder(col3.id, 0); // Move last to first

    const columns = await columnRepository.list(boardId);
    
    expect(columns[0].name).toBe('Col 3');
    expect(columns[1].name).toBe('Col 2');
    expect(columns[2].name).toBe('Col 1');
  });

  test('should return null for non-existent column', async () => {
    const column = await columnRepository.getById('non-existent');
    expect(column).toBeNull();
  });
});
