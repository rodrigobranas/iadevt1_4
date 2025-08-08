import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { app } from '../../src/index';
import { Database } from 'bun:sqlite';
import { MigrationRunner } from '../../src/kanban/db/migrations';
import { migration001InitialSchema } from '../../src/kanban/db/migrations/001_initial_schema';

describe('Columns API Integration Tests', () => {
  const baseUrl = 'http://localhost:3005/api/v0/kanban';
  let db: Database;
  let boardId: string;

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

  beforeEach(async () => {
    // Clear all data between tests
    db.exec('DELETE FROM cards');
    db.exec('DELETE FROM columns');
    db.exec('DELETE FROM boards');

    // Create a test board for column operations
    const boardResponse = await app.request(`${baseUrl}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Board' }),
    });
    const board = await boardResponse.json();
    boardId = board.id;
  });

  describe('GET /boards/:boardId/columns', () => {
    test('should return empty array when no columns exist', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const columns = await response.json();
      expect(columns).toEqual([]);
    });

    test('should return columns in order', async () => {
      // Create columns
      await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'To Do' }),
      });

      await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'In Progress' }),
      });

      await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Done' }),
      });

      const response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const columns = await response.json();
      expect(columns.length).toBe(3);
      expect(columns[0].name).toBe('To Do');
      expect(columns[0].position).toBe(0);
      expect(columns[1].name).toBe('In Progress');
      expect(columns[1].position).toBe(1);
      expect(columns[2].name).toBe('Done');
      expect(columns[2].position).toBe(2);
    });

    test('should return 404 for non-existent board', async () => {
      const response = await app.request(`${baseUrl}/boards/non-existent/columns`, {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /boards/:boardId/columns', () => {
    test('should create a new column', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Column' }),
      });

      expect(response.status).toBe(201);
      const column = await response.json();
      expect(column.name).toBe('New Column');
      expect(column.boardId).toBe(boardId);
      expect(column.position).toBe(0);
      expect(column.id).toBeDefined();
    });

    test('should auto-increment positions', async () => {
      const response1 = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 1' }),
      });

      const response2 = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 2' }),
      });

      const response3 = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 3' }),
      });

      const col1 = await response1.json();
      const col2 = await response2.json();
      const col3 = await response3.json();

      expect(col1.position).toBe(0);
      expect(col2.position).toBe(1);
      expect(col3.position).toBe(2);
    });

    test('should return 400 for empty name', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Column name is required');
    });

    test('should return 404 for non-existent board', async () => {
      const response = await app.request(`${baseUrl}/boards/non-existent/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /columns/:columnId', () => {
    let columnId: string;

    beforeEach(async () => {
      // Create a test column
      const response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Column' }),
      });
      const column = await response.json();
      columnId = column.id;
    });

    test('should rename a column', async () => {
      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Renamed Column' }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.name).toBe('Renamed Column');
      expect(updated.id).toBe(columnId);
    });

    test('should reorder a column', async () => {
      // Create more columns
      await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 2' }),
      });

      await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 3' }),
      });

      // Reorder first column to position 2
      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: 2 }),
      });

      expect(response.status).toBe(200);

      // Verify new order
      const columnsResponse = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });
      const columns = await columnsResponse.json();
      
      expect(columns[0].name).toBe('Column 2');
      expect(columns[1].name).toBe('Column 3');
      expect(columns[2].name).toBe('Test Column');
    });

    test('should rename and reorder simultaneously', async () => {
      // Create more columns
      await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 2' }),
      });

      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'Renamed and Moved',
          position: 1 
        }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.name).toBe('Renamed and Moved');

      // Verify order
      const columnsResponse = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });
      const columns = await columnsResponse.json();
      
      expect(columns[0].name).toBe('Column 2');
      expect(columns[1].name).toBe('Renamed and Moved');
    });

    test('should return 400 for empty name', async () => {
      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for negative position', async () => {
      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: -1 }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Position must be non-negative');
    });

    test('should return 404 for non-existent column', async () => {
      const response = await app.request(`${baseUrl}/columns/non-existent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /columns/:columnId', () => {
    let columnId: string;

    beforeEach(async () => {
      // Create a test column
      const response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column to Delete' }),
      });
      const column = await response.json();
      columnId = column.id;
    });

    test('should delete an empty column', async () => {
      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);

      // Verify column is deleted
      const columnsResponse = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });
      const columns = await columnsResponse.json();
      expect(columns.length).toBe(0);
    });

    test('should fail to delete non-empty column without force', async () => {
      // Create a card in the column
      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId,
          title: 'Card in Column',
        }),
      });

      const response = await app.request(`${baseUrl}/columns/${columnId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Use force=true to delete a non-empty column');
    });

    test('should delete non-empty column with force=true', async () => {
      // Create cards in the column
      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId,
          title: 'Card 1',
        }),
      });

      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId,
          title: 'Card 2',
        }),
      });

      const response = await app.request(`${baseUrl}/columns/${columnId}?force=true`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);

      // Verify column and cards are deleted
      const columnsResponse = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });
      const columns = await columnsResponse.json();
      expect(columns.length).toBe(0);

      const cardsResponse = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });
      const cards = await cardsResponse.json();
      expect(cards.length).toBe(0);
    });

    test('should normalize positions after deletion', async () => {
      // Create more columns
      const response2 = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 2' }),
      });
      const col2 = await response2.json();

      const response3 = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Column 3' }),
      });

      // Delete middle column
      await app.request(`${baseUrl}/columns/${col2.id}`, {
        method: 'DELETE',
      });

      // Verify positions are normalized
      const columnsResponse = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
        method: 'GET',
      });
      const columns = await columnsResponse.json();
      
      expect(columns.length).toBe(2);
      expect(columns[0].name).toBe('Column to Delete');
      expect(columns[0].position).toBe(0);
      expect(columns[1].name).toBe('Column 3');
      expect(columns[1].position).toBe(1);
    });

    test('should return 404 for non-existent column', async () => {
      const response = await app.request(`${baseUrl}/columns/non-existent`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});