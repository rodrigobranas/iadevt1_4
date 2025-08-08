import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { app } from '../../src/index';
import { Database } from 'bun:sqlite';
import { MigrationRunner } from '../../src/kanban/db/migrations';
import { migration001InitialSchema } from '../../src/kanban/db/migrations/001_initial_schema';

describe('Boards API Integration Tests', () => {
  const baseUrl = 'http://localhost:3005/api/v0/kanban';
  let db: Database;

  beforeAll(() => {
    // Setup test database
    db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON');
    const runner = new MigrationRunner(db);
    runner.runMigrations([migration001InitialSchema]);
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    // Clear all data between tests
    db.exec('DELETE FROM cards');
    db.exec('DELETE FROM columns');
    db.exec('DELETE FROM boards');
  });

  describe('GET /boards', () => {
    test('should return empty array when no boards exist', async () => {
      const response = await app.request(`${baseUrl}/boards`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const boards = await response.json();
      expect(boards).toEqual([]);
    });

    test('should return all boards', async () => {
      // Create boards directly in DB
      db.run(
        'INSERT INTO boards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['board-1', 'Board 1', new Date().toISOString(), new Date().toISOString()]
      );
      db.run(
        'INSERT INTO boards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['board-2', 'Board 2', new Date().toISOString(), new Date().toISOString()]
      );

      const response = await app.request(`${baseUrl}/boards`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const boards = await response.json();
      expect(boards.length).toBe(2);
      expect(boards[0].name).toBe('Board 1');
      expect(boards[1].name).toBe('Board 2');
    });
  });

  describe('POST /boards', () => {
    test('should create a new board', async () => {
      const response = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Board' }),
      });

      expect(response.status).toBe(201);
      const board = await response.json();
      expect(board.name).toBe('New Board');
      expect(board.id).toBeDefined();
      expect(board.createdAt).toBeDefined();
      expect(board.updatedAt).toBeDefined();
    });

    test('should return 400 for empty name', async () => {
      const response = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Board name is required');
    });

    test('should return 400 for missing name', async () => {
      const response = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('should handle special characters in board name', async () => {
      const response = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Board "with" special & chars!' }),
      });

      expect(response.status).toBe(201);
      const board = await response.json();
      expect(board.name).toBe('Board "with" special & chars!');
    });
  });

  describe('GET /boards/:boardId', () => {
    test('should get board by ID', async () => {
      // Create board
      const createResponse = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Board' }),
      });
      const board = await createResponse.json();

      const response = await app.request(`${baseUrl}/boards/${board.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const retrieved = await response.json();
      expect(retrieved.id).toBe(board.id);
      expect(retrieved.name).toBe('Test Board');
    });

    test('should return 404 for non-existent board', async () => {
      const response = await app.request(`${baseUrl}/boards/non-existent`, {
        method: 'GET',
      });

      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error.error).toContain('not found');
    });

    test('should include columns and cards when requested', async () => {
      // Create board with columns and cards
      const boardResponse = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Board with Data' }),
      });
      const board = await boardResponse.json();

      // Create column
      const columnResponse = await app.request(`${baseUrl}/boards/${board.id}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 1' }),
      });
      const column = await columnResponse.json();

      // Create card
      await app.request(`${baseUrl}/boards/${board.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: column.id,
          title: 'Card 1',
        }),
      });

      const response = await app.request(`${baseUrl}/boards/${board.id}?include=columns,cards`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const boardWithData = await response.json();
      expect(boardWithData.columns).toBeDefined();
      expect(boardWithData.columns.length).toBe(1);
      expect(boardWithData.cards).toBeDefined();
      expect(boardWithData.cards.length).toBe(1);
    });
  });

  describe('PATCH /boards/:boardId', () => {
    test('should rename a board', async () => {
      // Create board
      const createResponse = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Original Name' }),
      });
      const board = await createResponse.json();

      const response = await app.request(`${baseUrl}/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(board.id);
    });

    test('should return 400 for empty name', async () => {
      // Create board
      const createResponse = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Board' }),
      });
      const board = await createResponse.json();

      const response = await app.request(`${baseUrl}/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
    });

    test('should return 404 for non-existent board', async () => {
      const response = await app.request(`${baseUrl}/boards/non-existent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /boards/:boardId', () => {
    test('should delete a board', async () => {
      // Create board
      const createResponse = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'To Delete' }),
      });
      const board = await createResponse.json();

      const deleteResponse = await app.request(`${baseUrl}/boards/${board.id}`, {
        method: 'DELETE',
      });

      expect(deleteResponse.status).toBe(204);

      // Verify board is deleted
      const getResponse = await app.request(`${baseUrl}/boards/${board.id}`, {
        method: 'GET',
      });
      expect(getResponse.status).toBe(404);
    });

    test('should cascade delete columns and cards', async () => {
      // Create board with columns and cards
      const boardResponse = await app.request(`${baseUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Board to Delete' }),
      });
      const board = await boardResponse.json();

      // Create column
      const columnResponse = await app.request(`${baseUrl}/boards/${board.id}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column' }),
      });
      const column = await columnResponse.json();

      // Create card
      await app.request(`${baseUrl}/boards/${board.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: column.id,
          title: 'Card',
        }),
      });

      // Delete board
      const deleteResponse = await app.request(`${baseUrl}/boards/${board.id}`, {
        method: 'DELETE',
      });

      expect(deleteResponse.status).toBe(204);

      // Verify columns are deleted
      const columnsResponse = await app.request(`${baseUrl}/boards/${board.id}/columns`, {
        method: 'GET',
      });
      expect(columnsResponse.status).toBe(404);
    });

    test('should return 404 for non-existent board', async () => {
      const response = await app.request(`${baseUrl}/boards/non-existent`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});