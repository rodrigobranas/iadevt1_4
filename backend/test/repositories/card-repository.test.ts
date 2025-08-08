import { describe, test, expect, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { SqliteBoardRepository } from '../../src/kanban/repositories/sqlite/board-repository';
import { SqliteColumnRepository } from '../../src/kanban/repositories/sqlite/column-repository';
import { SqliteCardRepository } from '../../src/kanban/repositories/sqlite/card-repository';
import { MigrationRunner } from '../../src/kanban/db/migrations';
import { migration001InitialSchema } from '../../src/kanban/db/migrations/001_initial_schema';

describe('SqliteCardRepository', () => {
  let db: Database;
  let boardRepository: SqliteBoardRepository;
  let columnRepository: SqliteColumnRepository;
  let cardRepository: SqliteCardRepository;
  let boardId: string;
  let columnId1: string;
  let columnId2: string;

  beforeEach(async () => {
    db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON');

    const runner = new MigrationRunner(db);
    runner.runMigrations([migration001InitialSchema]);

    boardRepository = new SqliteBoardRepository(db);
    columnRepository = new SqliteColumnRepository(db);
    cardRepository = new SqliteCardRepository(db);

    const board = await boardRepository.create('Test Board');
    boardId = board.id;

    const col1 = await columnRepository.create(boardId, 'To Do');
    const col2 = await columnRepository.create(boardId, 'Done');
    columnId1 = col1.id;
    columnId2 = col2.id;
  });

  test('should create a card', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Test Card',
      description: 'Test Description',
      assignee: 'user@example.com',
      dueDate: '2024-12-31',
      labels: ['bug', 'urgent'],
      priority: 'high',
    });

    expect(card.id).toBeDefined();
    expect(card.title).toBe('Test Card');
    expect(card.description).toBe('Test Description');
    expect(card.labels).toEqual(['bug', 'urgent']);
    expect(card.priority).toBe('high');
    expect(card.position).toBe(0);
  });

  test('should handle cards with minimal data', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Minimal Card',
    });

    expect(card.title).toBe('Minimal Card');
    expect(card.description).toBeNull();
    expect(card.assignee).toBeNull();
    expect(card.labels).toEqual([]);
    expect(card.priority).toBe('medium');
  });

  test('should update card', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Original Title',
    });

    const updated = await cardRepository.update(card.id, {
      title: 'Updated Title',
      description: 'New Description',
      priority: 'high',
      labels: ['feature'],
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.description).toBe('New Description');
    expect(updated.priority).toBe('high');
    expect(updated.labels).toEqual(['feature']);
  });

  test('should move card between columns', async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 1',
    });

    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 2',
    });

    await cardRepository.move(card1.id, columnId2, 0);

    const movedCard = await cardRepository.getById(card1.id);
    const remainingCards = await cardRepository.list(boardId);

    expect(movedCard?.columnId).toBe(columnId2);
    expect(movedCard?.position).toBe(0);

    const col1Cards = remainingCards.filter((c) => c.columnId === columnId1);
    expect(col1Cards.length).toBe(1);
    expect(col1Cards[0].position).toBe(0);
  });

  test('should reorder cards within column', async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 1',
    });

    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 2',
    });

    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 3',
    });

    await cardRepository.reorder(card3.id, 0);

    const cards = await cardRepository.list(boardId);
    const col1Cards = cards.filter((c) => c.columnId === columnId1);

    expect(col1Cards[0].title).toBe('Card 3');
    expect(col1Cards[1].title).toBe('Card 1');
    expect(col1Cards[2].title).toBe('Card 2');
  });

  test('should delete card and normalize positions', async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 1',
    });

    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 2',
    });

    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 3',
    });

    await cardRepository.delete(card2.id);

    const cards = await cardRepository.list(boardId);

    expect(cards.length).toBe(2);
    expect(cards[0].position).toBe(0);
    expect(cards[1].position).toBe(1);
  });

  test('should set card order for column', async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 1',
    });

    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 2',
    });

    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 3',
    });

    await cardRepository.setOrderForColumn(columnId1, [card3.id, card1.id, card2.id]);

    const cards = await cardRepository.list(boardId);
    const col1Cards = cards.filter((c) => c.columnId === columnId1);

    expect(col1Cards[0].title).toBe('Card 3');
    expect(col1Cards[1].title).toBe('Card 1');
    expect(col1Cards[2].title).toBe('Card 2');
  });

  test('should handle moving card to empty column', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Lonely Card',
    });

    await cardRepository.move(card.id, columnId2, 0);

    const movedCard = await cardRepository.getById(card.id);
    expect(movedCard?.columnId).toBe(columnId2);
    expect(movedCard?.position).toBe(0);
  });

  test('should handle complex move scenarios', async () => {
    // Create cards in column 1
    const cards = [];
    for (let i = 1; i <= 5; i++) {
      cards.push(await cardRepository.create({
        boardId,
        columnId: columnId1,
        title: `Card ${i}`,
      }));
    }

    // Move card 3 to column 2 at position 0
    await cardRepository.move(cards[2].id, columnId2, 0);

    // Move card 1 to column 2 at position 1
    await cardRepository.move(cards[0].id, columnId2, 1);

    const allCards = await cardRepository.list(boardId);
    const col1Cards = allCards.filter(c => c.columnId === columnId1);
    const col2Cards = allCards.filter(c => c.columnId === columnId2);

    expect(col1Cards.length).toBe(3);
    expect(col2Cards.length).toBe(2);
    expect(col2Cards[0].title).toBe('Card 3');
    expect(col2Cards[1].title).toBe('Card 1');
  });

  test('should return null for non-existent card', async () => {
    const card = await cardRepository.getById('non-existent');
    expect(card).toBeNull();
  });

  test('should handle cards with all priority levels', async () => {
    const lowCard = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Low Priority',
      priority: 'low',
    });

    const mediumCard = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Medium Priority',
      priority: 'medium',
    });

    const highCard = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'High Priority',
      priority: 'high',
    });

    expect(lowCard.priority).toBe('low');
    expect(mediumCard.priority).toBe('medium');
    expect(highCard.priority).toBe('high');
  });

  test('should handle cards with empty labels array', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'No Labels',
      labels: [],
    });

    expect(card.labels).toEqual([]);
    
    const retrieved = await cardRepository.getById(card.id);
    expect(retrieved?.labels).toEqual([]);
  });

  test('should handle partial updates correctly', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Original',
      description: 'Original Desc',
      priority: 'low',
      labels: ['bug'],
    });

    // Update only description
    const updated1 = await cardRepository.update(card.id, {
      description: 'New Desc',
    });

    expect(updated1.title).toBe('Original');
    expect(updated1.description).toBe('New Desc');
    expect(updated1.priority).toBe('low');
    expect(updated1.labels).toEqual(['bug']);

    // Update only priority
    const updated2 = await cardRepository.update(card.id, {
      priority: 'high',
    });

    expect(updated2.description).toBe('New Desc');
    expect(updated2.priority).toBe('high');
  });

  test('should handle reordering within same position', async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 1',
    });

    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 2',
    });

    // Reorder card2 to its current position
    await cardRepository.reorder(card2.id, 1);

    const cards = await cardRepository.list(boardId);
    const col1Cards = cards.filter(c => c.columnId === columnId1);

    expect(col1Cards[0].title).toBe('Card 1');
    expect(col1Cards[1].title).toBe('Card 2');
  });

  test('should handle cards with long descriptions', async () => {
    const longDesc = 'A'.repeat(1000);
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Long Description Card',
      description: longDesc,
    });

    expect(card.description).toBe(longDesc);
    
    const retrieved = await cardRepository.getById(card.id);
    expect(retrieved?.description).toBe(longDesc);
  });

  test('should handle deletion of first card in column', async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 1',
    });

    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 2',
    });

    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Card 3',
    });

    await cardRepository.delete(card1.id);

    const cards = await cardRepository.list(boardId);
    
    expect(cards.length).toBe(2);
    expect(cards[0].title).toBe('Card 2');
    expect(cards[0].position).toBe(0);
    expect(cards[1].title).toBe('Card 3');
    expect(cards[1].position).toBe(1);
  });

  test('should handle cards with future due dates', async () => {
    const futureDate = '2025-12-31';
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Future Task',
      dueDate: futureDate,
    });

    expect(card.dueDate).toBe(futureDate);
  });

  test('should handle clearing optional fields', async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: 'Full Card',
      description: 'Has description',
      assignee: 'user@example.com',
      dueDate: '2024-12-31',
    });

    const updated = await cardRepository.update(card.id, {
      description: null,
      assignee: null,
      dueDate: null,
    });

    expect(updated.description).toBeNull();
    expect(updated.assignee).toBeNull();
    expect(updated.dueDate).toBeNull();
  });
});
