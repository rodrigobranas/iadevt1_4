import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { app } from '../../src/index';
import { Database } from 'bun:sqlite';
import { MigrationRunner } from '../../src/kanban/db/migrations';
import { migration001InitialSchema } from '../../src/kanban/db/migrations/001_initial_schema';

describe('Cards API Integration Tests', () => {
  const baseUrl = 'http://localhost:3005/api/v0/kanban';
  let db: Database;
  let boardId: string;
  let columnId1: string;
  let columnId2: string;

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

    // Create test board and columns
    const boardResponse = await app.request(`${baseUrl}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Board' }),
    });
    const board = await boardResponse.json();
    boardId = board.id;

    const column1Response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Do' }),
    });
    const column1 = await column1Response.json();
    columnId1 = column1.id;

    const column2Response = await app.request(`${baseUrl}/boards/${boardId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Done' }),
    });
    const column2 = await column2Response.json();
    columnId2 = column2.id;
  });

  describe('GET /boards/:boardId/cards', () => {
    test('should return empty array when no cards exist', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const cards = await response.json();
      expect(cards).toEqual([]);
    });

    test('should return all cards for a board', async () => {
      // Create cards
      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 1',
        }),
      });

      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId2,
          title: 'Card 2',
        }),
      });

      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const cards = await response.json();
      expect(cards.length).toBe(2);
      expect(cards.find(c => c.title === 'Card 1')).toBeDefined();
      expect(cards.find(c => c.title === 'Card 2')).toBeDefined();
    });

    test('should return 404 for non-existent board', async () => {
      const response = await app.request(`${baseUrl}/boards/non-existent/cards`, {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /boards/:boardId/cards', () => {
    test('should create a card with minimal data', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'New Card',
        }),
      });

      expect(response.status).toBe(201);
      const card = await response.json();
      expect(card.title).toBe('New Card');
      expect(card.columnId).toBe(columnId1);
      expect(card.boardId).toBe(boardId);
      expect(card.position).toBe(0);
      expect(card.priority).toBe('medium');
      expect(card.labels).toEqual([]);
    });

    test('should create a card with all fields', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Full Card',
          description: 'This is a description',
          assignee: 'user@example.com',
          dueDate: '2024-12-31',
          labels: ['bug', 'urgent'],
          priority: 'high',
        }),
      });

      expect(response.status).toBe(201);
      const card = await response.json();
      expect(card.title).toBe('Full Card');
      expect(card.description).toBe('This is a description');
      expect(card.assignee).toBe('user@example.com');
      expect(card.dueDate).toBe('2024-12-31');
      expect(card.labels).toEqual(['bug', 'urgent']);
      expect(card.priority).toBe('high');
    });

    test('should auto-increment positions', async () => {
      const response1 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 1',
        }),
      });

      const response2 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 2',
        }),
      });

      const response3 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 3',
        }),
      });

      const card1 = await response1.json();
      const card2 = await response2.json();
      const card3 = await response3.json();

      expect(card1.position).toBe(0);
      expect(card2.position).toBe(1);
      expect(card3.position).toBe(2);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Card without column',
        }),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for empty title', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: '',
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Card title is required');
    });

    test('should return 400 for too many labels', async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card',
          labels: Array(11).fill('label'),
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('maximum 10 labels');
    });
  });

  describe('GET /cards/:cardId', () => {
    let cardId: string;

    beforeEach(async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Test Card',
        }),
      });
      const card = await response.json();
      cardId = card.id;
    });

    test('should get card by ID', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const card = await response.json();
      expect(card.id).toBe(cardId);
      expect(card.title).toBe('Test Card');
    });

    test('should return 404 for non-existent card', async () => {
      const response = await app.request(`${baseUrl}/cards/non-existent`, {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /cards/:cardId', () => {
    let cardId: string;

    beforeEach(async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Original Title',
          description: 'Original Description',
          priority: 'low',
        }),
      });
      const card = await response.json();
      cardId = card.id;
    });

    test('should update card fields', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 'high',
          labels: ['updated'],
        }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated Description');
      expect(updated.priority).toBe('high');
      expect(updated.labels).toEqual(['updated']);
    });

    test('should update only specified fields', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Only Description Updated',
        }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.title).toBe('Original Title');
      expect(updated.description).toBe('Only Description Updated');
      expect(updated.priority).toBe('low');
    });

    test('should clear optional fields with null', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: null,
          assignee: null,
        }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.description).toBeNull();
      expect(updated.assignee).toBeNull();
    });

    test('should return 404 for non-existent card', async () => {
      const response = await app.request(`${baseUrl}/cards/non-existent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /cards/:cardId', () => {
    let cardId: string;

    beforeEach(async () => {
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card to Delete',
        }),
      });
      const card = await response.json();
      cardId = card.id;
    });

    test('should delete a card', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);

      // Verify card is deleted
      const getResponse = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'GET',
      });
      expect(getResponse.status).toBe(404);
    });

    test('should normalize positions after deletion', async () => {
      // Create more cards
      const response2 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 2',
        }),
      });

      const response3 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 3',
        }),
      });

      // Delete first card
      await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'DELETE',
      });

      // Verify positions are normalized
      const cardsResponse = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });
      const cards = await cardsResponse.json();
      const col1Cards = cards.filter(c => c.columnId === columnId1);
      
      expect(col1Cards.length).toBe(2);
      expect(col1Cards[0].position).toBe(0);
      expect(col1Cards[1].position).toBe(1);
    });

    test('should return 404 for non-existent card', async () => {
      const response = await app.request(`${baseUrl}/cards/non-existent`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /cards/:cardId/move', () => {
    let cardId: string;

    beforeEach(async () => {
      // Create a card in column 1
      const response = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card to Move',
        }),
      });
      const card = await response.json();
      cardId = card.id;
    });

    test('should move card to different column', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toColumnId: columnId2,
          toPosition: 0,
        }),
      });

      expect(response.status).toBe(200);

      // Verify card is in new column
      const cardResponse = await app.request(`${baseUrl}/cards/${cardId}`, {
        method: 'GET',
      });
      const card = await cardResponse.json();
      expect(card.columnId).toBe(columnId2);
      expect(card.position).toBe(0);
    });

    test('should move card to specific position in same column', async () => {
      // Create more cards in same column
      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 2',
        }),
      });

      await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 3',
        }),
      });

      // Move first card to position 2
      const response = await app.request(`${baseUrl}/cards/${cardId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toColumnId: columnId1,
          toPosition: 2,
        }),
      });

      expect(response.status).toBe(200);

      // Verify positions
      const cardsResponse = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });
      const cards = await cardsResponse.json();
      const col1Cards = cards
        .filter(c => c.columnId === columnId1)
        .sort((a, b) => a.position - b.position);
      
      expect(col1Cards[0].title).toBe('Card 2');
      expect(col1Cards[1].title).toBe('Card 3');
      expect(col1Cards[2].title).toBe('Card to Move');
    });

    test('should return 400 for negative position', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toColumnId: columnId2,
          toPosition: -1,
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Position must be non-negative');
    });

    test('should return 404 for non-existent card', async () => {
      const response = await app.request(`${baseUrl}/cards/non-existent/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toColumnId: columnId2,
          toPosition: 0,
        }),
      });

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent column', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toColumnId: 'non-existent',
          toPosition: 0,
        }),
      });

      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error.error).toContain('Column with ID non-existent not found');
    });
  });

  describe('POST /cards/:cardId/reorder', () => {
    let cardId1: string;
    let cardId2: string;
    let cardId3: string;

    beforeEach(async () => {
      // Create three cards in same column
      const response1 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 1',
        }),
      });
      cardId1 = (await response1.json()).id;

      const response2 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 2',
        }),
      });
      cardId2 = (await response2.json()).id;

      const response3 = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: columnId1,
          title: 'Card 3',
        }),
      });
      cardId3 = (await response3.json()).id;
    });

    test('should reorder card within column', async () => {
      // Move card 3 to position 0
      const response = await app.request(`${baseUrl}/cards/${cardId3}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPosition: 0,
        }),
      });

      expect(response.status).toBe(200);

      // Verify new order
      const cardsResponse = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });
      const cards = await cardsResponse.json();
      const col1Cards = cards
        .filter(c => c.columnId === columnId1)
        .sort((a, b) => a.position - b.position);
      
      expect(col1Cards[0].title).toBe('Card 3');
      expect(col1Cards[1].title).toBe('Card 1');
      expect(col1Cards[2].title).toBe('Card 2');
    });

    test('should handle reordering to end position', async () => {
      // Move card 1 to position 2 (end)
      const response = await app.request(`${baseUrl}/cards/${cardId1}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPosition: 2,
        }),
      });

      expect(response.status).toBe(200);

      // Verify new order
      const cardsResponse = await app.request(`${baseUrl}/boards/${boardId}/cards`, {
        method: 'GET',
      });
      const cards = await cardsResponse.json();
      const col1Cards = cards
        .filter(c => c.columnId === columnId1)
        .sort((a, b) => a.position - b.position);
      
      expect(col1Cards[0].title).toBe('Card 2');
      expect(col1Cards[1].title).toBe('Card 3');
      expect(col1Cards[2].title).toBe('Card 1');
    });

    test('should return 400 for negative position', async () => {
      const response = await app.request(`${baseUrl}/cards/${cardId1}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPosition: -1,
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Position must be non-negative');
    });

    test('should return 404 for non-existent card', async () => {
      const response = await app.request(`${baseUrl}/cards/non-existent/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPosition: 0,
        }),
      });

      expect(response.status).toBe(404);
    });
  });
});