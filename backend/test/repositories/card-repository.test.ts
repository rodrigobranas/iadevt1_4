import { describe, test, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { SqliteBoardRepository } from "../../src/kanban/repositories/sqlite/board-repository";
import { SqliteColumnRepository } from "../../src/kanban/repositories/sqlite/column-repository";
import { SqliteCardRepository } from "../../src/kanban/repositories/sqlite/card-repository";
import { MigrationRunner } from "../../src/kanban/db/migrations";
import { migration001InitialSchema } from "../../src/kanban/db/migrations/001_initial_schema";

describe("SqliteCardRepository", () => {
  let db: Database;
  let boardRepository: SqliteBoardRepository;
  let columnRepository: SqliteColumnRepository;
  let cardRepository: SqliteCardRepository;
  let boardId: string;
  let columnId1: string;
  let columnId2: string;

  beforeEach(async () => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    
    const runner = new MigrationRunner(db);
    runner.runMigrations([migration001InitialSchema]);
    
    boardRepository = new SqliteBoardRepository(db);
    columnRepository = new SqliteColumnRepository(db);
    cardRepository = new SqliteCardRepository(db);
    
    const board = await boardRepository.create("Test Board");
    boardId = board.id;
    
    const col1 = await columnRepository.create(boardId, "To Do");
    const col2 = await columnRepository.create(boardId, "Done");
    columnId1 = col1.id;
    columnId2 = col2.id;
  });

  test("should create a card", async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Test Card",
      description: "Test Description",
      assignee: "user@example.com",
      dueDate: "2024-12-31",
      labels: ["bug", "urgent"],
      priority: "high"
    });
    
    expect(card.id).toBeDefined();
    expect(card.title).toBe("Test Card");
    expect(card.description).toBe("Test Description");
    expect(card.labels).toEqual(["bug", "urgent"]);
    expect(card.priority).toBe("high");
    expect(card.position).toBe(0);
  });

  test("should handle cards with minimal data", async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Minimal Card"
    });
    
    expect(card.title).toBe("Minimal Card");
    expect(card.description).toBeNull();
    expect(card.assignee).toBeNull();
    expect(card.labels).toEqual([]);
    expect(card.priority).toBe("medium");
  });

  test("should update card", async () => {
    const card = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Original Title"
    });
    
    const updated = await cardRepository.update(card.id, {
      title: "Updated Title",
      description: "New Description",
      priority: "high",
      labels: ["feature"]
    });
    
    expect(updated.title).toBe("Updated Title");
    expect(updated.description).toBe("New Description");
    expect(updated.priority).toBe("high");
    expect(updated.labels).toEqual(["feature"]);
  });

  test("should move card between columns", async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 1"
    });
    
    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 2"
    });
    
    await cardRepository.move(card1.id, columnId2, 0);
    
    const movedCard = await cardRepository.getById(card1.id);
    const remainingCards = await cardRepository.list(boardId);
    
    expect(movedCard?.columnId).toBe(columnId2);
    expect(movedCard?.position).toBe(0);
    
    const col1Cards = remainingCards.filter(c => c.columnId === columnId1);
    expect(col1Cards.length).toBe(1);
    expect(col1Cards[0].position).toBe(0);
  });

  test("should reorder cards within column", async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 1"
    });
    
    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 2"
    });
    
    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 3"
    });
    
    await cardRepository.reorder(card3.id, 0);
    
    const cards = await cardRepository.list(boardId);
    const col1Cards = cards.filter(c => c.columnId === columnId1);
    
    expect(col1Cards[0].title).toBe("Card 3");
    expect(col1Cards[1].title).toBe("Card 1");
    expect(col1Cards[2].title).toBe("Card 2");
  });

  test("should delete card and normalize positions", async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 1"
    });
    
    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 2"
    });
    
    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 3"
    });
    
    await cardRepository.delete(card2.id);
    
    const cards = await cardRepository.list(boardId);
    
    expect(cards.length).toBe(2);
    expect(cards[0].position).toBe(0);
    expect(cards[1].position).toBe(1);
  });

  test("should set card order for column", async () => {
    const card1 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 1"
    });
    
    const card2 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 2"
    });
    
    const card3 = await cardRepository.create({
      boardId,
      columnId: columnId1,
      title: "Card 3"
    });
    
    await cardRepository.setOrderForColumn(columnId1, [card3.id, card1.id, card2.id]);
    
    const cards = await cardRepository.list(boardId);
    const col1Cards = cards.filter(c => c.columnId === columnId1);
    
    expect(col1Cards[0].title).toBe("Card 3");
    expect(col1Cards[1].title).toBe("Card 1");
    expect(col1Cards[2].title).toBe("Card 2");
  });
});