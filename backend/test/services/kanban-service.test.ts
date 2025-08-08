import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { KanbanServiceImpl } from '../../src/kanban/services/kanban-service';
import type {
  BoardRepository,
  ColumnRepository,
  CardRepository,
} from '../../src/kanban/repositories/kanban-repository';
import type {
  Board,
  Column,
  Card,
  CreateCardInput,
  UpdateCardInput,
} from '../../src/kanban/models/entities';

describe('KanbanService', () => {
  let service: KanbanServiceImpl;
  let boardRepository: BoardRepository;
  let columnRepository: ColumnRepository;
  let cardRepository: CardRepository;

  const mockBoard: Board = {
    id: 'board-1',
    name: 'Test Board',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockColumn: Column = {
    id: 'column-1',
    boardId: 'board-1',
    name: 'Test Column',
    position: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCard: Card = {
    id: 'card-1',
    boardId: 'board-1',
    columnId: 'column-1',
    title: 'Test Card',
    description: 'Test Description',
    assignee: 'user@example.com',
    dueDate: '2024-12-31',
    labels: ['bug', 'urgent'],
    priority: 'high',
    position: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Create mock repositories
    boardRepository = {
      create: mock(() => Promise.resolve(mockBoard)),
      getById: mock(() => Promise.resolve(mockBoard)),
      list: mock(() => Promise.resolve([mockBoard])),
      rename: mock(() => Promise.resolve(mockBoard)),
      delete: mock(() => Promise.resolve()),
    };

    columnRepository = {
      create: mock(() => Promise.resolve(mockColumn)),
      getById: mock(() => Promise.resolve(mockColumn)),
      list: mock(() => Promise.resolve([mockColumn])),
      rename: mock(() => Promise.resolve(mockColumn)),
      reorder: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    };

    cardRepository = {
      create: mock(() => Promise.resolve(mockCard)),
      getById: mock(() => Promise.resolve(mockCard)),
      list: mock(() => Promise.resolve([mockCard])),
      update: mock(() => Promise.resolve(mockCard)),
      delete: mock(() => Promise.resolve()),
      move: mock(() => Promise.resolve()),
      reorder: mock(() => Promise.resolve()),
    };

    service = new KanbanServiceImpl(boardRepository, columnRepository, cardRepository);
  });

  describe('Board operations', () => {
    test('should create a board', async () => {
      const board = await service.createBoard('New Board');

      expect(boardRepository.create).toHaveBeenCalledWith('New Board');
      expect(board).toEqual(mockBoard);
    });

    test('should throw error when creating board with empty name', async () => {
      await expect(service.createBoard('')).rejects.toThrow('Board name is required');
      await expect(service.createBoard('   ')).rejects.toThrow('Board name is required');
    });

    test('should throw error when board name is too long', async () => {
      const longName = 'a'.repeat(101);
      await expect(service.createBoard(longName)).rejects.toThrow(
        'Board name must be 100 characters or less',
      );
    });

    test('should get board by id', async () => {
      const board = await service.getBoard('board-1');

      expect(boardRepository.getById).toHaveBeenCalledWith('board-1');
      expect(board).toEqual(mockBoard);
    });

    test('should throw error when getting board without id', async () => {
      await expect(service.getBoard('')).rejects.toThrow('Board ID is required');
    });

    test('should list boards', async () => {
      const boards = await service.listBoards();

      expect(boardRepository.list).toHaveBeenCalled();
      expect(boards).toEqual([mockBoard]);
    });

    test('should rename board', async () => {
      const board = await service.renameBoard('board-1', 'Updated Board');

      expect(boardRepository.getById).toHaveBeenCalledWith('board-1');
      expect(boardRepository.rename).toHaveBeenCalledWith('board-1', 'Updated Board');
      expect(board).toEqual(mockBoard);
    });

    test('should throw error when renaming non-existent board', async () => {
      boardRepository.getById = mock(() => Promise.resolve(null));

      await expect(service.renameBoard('board-1', 'New Name')).rejects.toThrow(
        'Board with ID board-1 not found',
      );
    });

    test('should delete board', async () => {
      await service.deleteBoard('board-1');

      expect(boardRepository.getById).toHaveBeenCalledWith('board-1');
      expect(boardRepository.delete).toHaveBeenCalledWith('board-1');
    });
  });

  describe('Column operations', () => {
    test('should create a column', async () => {
      const column = await service.createColumn('board-1', 'New Column');

      expect(boardRepository.getById).toHaveBeenCalledWith('board-1');
      expect(columnRepository.list).toHaveBeenCalledWith('board-1');
      expect(columnRepository.create).toHaveBeenCalledWith('board-1', 'New Column', 1);
      expect(column).toEqual(mockColumn);
    });

    test('should throw error when creating column with empty name', async () => {
      await expect(service.createColumn('board-1', '')).rejects.toThrow('Column name is required');
    });

    test('should throw error when column name is too long', async () => {
      const longName = 'a'.repeat(101);
      await expect(service.createColumn('board-1', longName)).rejects.toThrow(
        'Column name must be 100 characters or less',
      );
    });

    test('should throw error when creating column for non-existent board', async () => {
      boardRepository.getById = mock(() => Promise.resolve(null));

      await expect(service.createColumn('board-1', 'New Column')).rejects.toThrow(
        'Board with ID board-1 not found',
      );
    });

    test('should list columns', async () => {
      const columns = await service.listColumns('board-1');

      expect(columnRepository.list).toHaveBeenCalledWith('board-1');
      expect(columns).toEqual([mockColumn]);
    });

    test('should rename column', async () => {
      const column = await service.renameColumn('column-1', 'Updated Column');

      expect(columnRepository.rename).toHaveBeenCalledWith('column-1', 'Updated Column');
      expect(column).toEqual(mockColumn);
    });

    test('should reorder column', async () => {
      await service.reorderColumn('column-1', 2);

      expect(columnRepository.reorder).toHaveBeenCalledWith('column-1', 2);
    });

    test('should throw error when reordering with negative position', async () => {
      await expect(service.reorderColumn('column-1', -1)).rejects.toThrow(
        'Position must be non-negative',
      );
    });

    test('should delete empty column without force', async () => {
      cardRepository.list = mock(() => Promise.resolve([]));

      await service.deleteColumn('column-1');

      expect(columnRepository.getById).toHaveBeenCalledWith('column-1');
      expect(cardRepository.list).toHaveBeenCalledWith('board-1');
      expect(columnRepository.delete).toHaveBeenCalledWith('column-1');
    });

    test('should throw error when deleting non-empty column without force', async () => {
      await expect(service.deleteColumn('column-1')).rejects.toThrow(
        'Column contains 1 card(s). Use force=true to delete a non-empty column',
      );
    });

    test('should delete non-empty column with force', async () => {
      await service.deleteColumn('column-1', true);

      expect(columnRepository.delete).toHaveBeenCalledWith('column-1');
    });

    test('should throw error when deleting non-existent column', async () => {
      columnRepository.getById = mock(() => Promise.resolve(null));

      await expect(service.deleteColumn('column-1')).rejects.toThrow(
        'Column with ID column-1 not found',
      );
    });
  });

  describe('Card operations', () => {
    test('should create a card', async () => {
      const input: CreateCardInput = {
        boardId: 'board-1',
        columnId: 'column-1',
        title: 'New Card',
        description: 'Description',
        assignee: 'user@example.com',
        dueDate: '2024-12-31',
        labels: ['bug'],
        priority: 'high',
      };

      const card = await service.createCard(input);

      expect(cardRepository.create).toHaveBeenCalledWith({
        ...input,
        title: 'New Card',
      });
      expect(card).toEqual(mockCard);
    });

    test('should create card with default priority', async () => {
      const input: CreateCardInput = {
        boardId: 'board-1',
        columnId: 'column-1',
        title: 'New Card',
      };

      await service.createCard(input);

      expect(cardRepository.create).toHaveBeenCalledWith({
        ...input,
        priority: 'medium',
      });
    });

    test('should throw error when creating card without required fields', async () => {
      await expect(
        service.createCard({ columnId: 'column-1', title: 'Title' } as CreateCardInput),
      ).rejects.toThrow('Board ID is required');

      await expect(
        service.createCard({ boardId: 'board-1', title: 'Title' } as CreateCardInput),
      ).rejects.toThrow('Column ID is required');

      await expect(
        service.createCard({
          boardId: 'board-1',
          columnId: 'column-1',
          title: '',
        } as CreateCardInput),
      ).rejects.toThrow('Card title is required');
    });

    test('should throw error when card title is too long', async () => {
      const input: CreateCardInput = {
        boardId: 'board-1',
        columnId: 'column-1',
        title: 'a'.repeat(201),
      };

      await expect(service.createCard(input)).rejects.toThrow(
        'Card title must be 200 characters or less',
      );
    });

    test('should throw error when card has too many labels', async () => {
      const input: CreateCardInput = {
        boardId: 'board-1',
        columnId: 'column-1',
        title: 'Card',
        labels: Array(11).fill('label'),
      };

      await expect(service.createCard(input)).rejects.toThrow('Card can have maximum 10 labels');
    });

    test('should get card by id', async () => {
      const card = await service.getCard('card-1');

      expect(cardRepository.getById).toHaveBeenCalledWith('card-1');
      expect(card).toEqual(mockCard);
    });

    test('should list cards', async () => {
      const cards = await service.listCards('board-1');

      expect(cardRepository.list).toHaveBeenCalledWith('board-1');
      expect(cards).toEqual([mockCard]);
    });

    test('should update card', async () => {
      const input: UpdateCardInput = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const card = await service.updateCard('card-1', input);

      expect(cardRepository.getById).toHaveBeenCalledWith('card-1');
      expect(cardRepository.update).toHaveBeenCalledWith('card-1', input);
      expect(card).toEqual(mockCard);
    });

    test('should throw error when updating non-existent card', async () => {
      cardRepository.getById = mock(() => Promise.resolve(null));

      await expect(service.updateCard('card-1', { title: 'New' })).rejects.toThrow(
        'Card with ID card-1 not found',
      );
    });

    test('should delete card', async () => {
      await service.deleteCard('card-1');

      expect(cardRepository.getById).toHaveBeenCalledWith('card-1');
      expect(cardRepository.delete).toHaveBeenCalledWith('card-1');
    });

    test('should move card', async () => {
      await service.moveCard('card-1', 'column-2', 1);

      expect(cardRepository.getById).toHaveBeenCalledWith('card-1');
      expect(cardRepository.move).toHaveBeenCalledWith('card-1', 'column-2', 1);
    });

    test('should throw error when moving with negative position', async () => {
      await expect(service.moveCard('card-1', 'column-2', -1)).rejects.toThrow(
        'Position must be non-negative',
      );
    });

    test('should reorder card', async () => {
      await service.reorderCard('card-1', 2);

      expect(cardRepository.getById).toHaveBeenCalledWith('card-1');
      expect(cardRepository.reorder).toHaveBeenCalledWith('card-1', 2);
    });

    test('should throw error when reordering non-existent card', async () => {
      cardRepository.getById = mock(() => Promise.resolve(null));

      await expect(service.reorderCard('card-1', 1)).rejects.toThrow(
        'Card with ID card-1 not found',
      );
    });
  });

  describe('Complex move and reorder scenarios', () => {
    test('should handle moving card between columns with position normalization', async () => {
      const sourceCards = [
        { ...mockCard, id: 'card-1', columnId: 'column-1', position: 0 },
        { ...mockCard, id: 'card-2', columnId: 'column-1', position: 1 },
        { ...mockCard, id: 'card-3', columnId: 'column-1', position: 2 },
      ];

      const targetCards = [
        { ...mockCard, id: 'card-4', columnId: 'column-2', position: 0 },
        { ...mockCard, id: 'card-5', columnId: 'column-2', position: 1 },
      ];

      cardRepository.list = mock(() => {
        return Promise.resolve([...sourceCards, ...targetCards]);
      });

      await service.moveCard('card-2', 'column-2', 1);

      expect(cardRepository.move).toHaveBeenCalledWith('card-2', 'column-2', 1);
    });

    test('should validate column exists when moving card', async () => {
      columnRepository.getById = mock(() => Promise.resolve(null));

      await expect(service.moveCard('card-1', 'non-existent-column', 0)).rejects.toThrow(
        'Column with ID non-existent-column not found',
      );
    });

    test('should handle reordering multiple cards sequentially', async () => {
      const cards = [
        { ...mockCard, id: 'card-1', position: 0 },
        { ...mockCard, id: 'card-2', position: 1 },
        { ...mockCard, id: 'card-3', position: 2 },
        { ...mockCard, id: 'card-4', position: 3 },
      ];

      cardRepository.list = mock(() => Promise.resolve(cards));

      // Move last card to first position
      await service.reorderCard('card-4', 0);
      expect(cardRepository.reorder).toHaveBeenCalledWith('card-4', 0);

      // Move middle card to end
      await service.reorderCard('card-2', 3);
      expect(cardRepository.reorder).toHaveBeenCalledWith('card-2', 3);
    });

    test('should handle edge case of moving to position beyond current cards', async () => {
      const cards = [
        { ...mockCard, id: 'card-1', position: 0 },
        { ...mockCard, id: 'card-2', position: 1 },
      ];

      cardRepository.list = mock(() => Promise.resolve(cards));

      // Move to position 10 should be clamped to last position
      await service.moveCard('card-1', 'column-2', 10);
      expect(cardRepository.move).toHaveBeenCalledWith('card-1', 'column-2', 10);
    });
  });

  describe('Validation edge cases', () => {
    test('should handle extremely long board names gracefully', async () => {
      const longName = 'a'.repeat(100);
      const board = await service.createBoard(longName);

      expect(boardRepository.create).toHaveBeenCalledWith(longName);
      expect(board).toEqual(mockBoard);
    });

    test('should validate priority values', async () => {
      const validPriorities = ['low', 'medium', 'high'];
      
      for (const priority of validPriorities) {
        const input: CreateCardInput = {
          boardId: 'board-1',
          columnId: 'column-1',
          title: 'Card',
          priority: priority as 'low' | 'medium' | 'high',
        };

        await service.createCard(input);
        expect(cardRepository.create).toHaveBeenCalledWith(expect.objectContaining({ priority }));
      }
    });

    test('should handle concurrent column deletions gracefully', async () => {
      const column1 = { ...mockColumn, id: 'col-1' };
      const column2 = { ...mockColumn, id: 'col-2' };

      columnRepository.getById = mock((id) => {
        if (id === 'col-1') return Promise.resolve(column1);
        if (id === 'col-2') return Promise.resolve(column2);
        return Promise.resolve(null);
      });

      // Both columns are empty
      cardRepository.list = mock(() => Promise.resolve([]));

      // Delete both columns concurrently
      const results = await Promise.all([
        service.deleteColumn('col-1'),
        service.deleteColumn('col-2'),
      ]);

      expect(columnRepository.delete).toHaveBeenCalledTimes(2);
      expect(columnRepository.delete).toHaveBeenCalledWith('col-1');
      expect(columnRepository.delete).toHaveBeenCalledWith('col-2');
    });

    test('should handle special characters in card fields', async () => {
      const input: CreateCardInput = {
        boardId: 'board-1',
        columnId: 'column-1',
        title: 'Card with "quotes" & special chars',
        description: 'Description with\nnewlines\tand\ttabs',
        assignee: 'user+test@example.com',
        labels: ['bug/fix', 'feature:new', 'priority-1'],
      };

      const card = await service.createCard(input);

      expect(cardRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Card with "quotes" & special chars',
        description: 'Description with\nnewlines\tand\ttabs',
        assignee: 'user+test@example.com',
        labels: ['bug/fix', 'feature:new', 'priority-1'],
      }));
    });

    test('should validate date format for due dates', async () => {
      const validDates = [
        '2024-12-31',
        '2025-01-01',
        '2024-06-15',
      ];

      for (const dueDate of validDates) {
        const input: CreateCardInput = {
          boardId: 'board-1',
          columnId: 'column-1',
          title: 'Card',
          dueDate,
        };

        await service.createCard(input);
        expect(cardRepository.create).toHaveBeenCalledWith(expect.objectContaining({ dueDate }));
      }
    });

    test('should handle column deletion with cards in different states', async () => {
      const cardsInColumn = [
        { ...mockCard, id: 'card-1', priority: 'high' },
        { ...mockCard, id: 'card-2', priority: 'low' },
        { ...mockCard, id: 'card-3', labels: ['important', 'blocked'] },
      ];

      cardRepository.list = mock(() => Promise.resolve(cardsInColumn));

      // Should fail without force
      await expect(service.deleteColumn('column-1')).rejects.toThrow(
        'Column contains 3 card(s). Use force=true to delete a non-empty column',
      );

      // Should succeed with force
      await service.deleteColumn('column-1', true);
      expect(columnRepository.delete).toHaveBeenCalledWith('column-1');
    });

    test('should maintain board integrity when operations fail', async () => {
      // Simulate a failure in the middle of an operation
      columnRepository.create = mock(() => Promise.reject(new Error('Database error')));

      await expect(service.createColumn('board-1', 'New Column')).rejects.toThrow('Database error');

      // Verify board was still checked
      expect(boardRepository.getById).toHaveBeenCalledWith('board-1');
    });

    test('should handle whitespace in names correctly', async () => {
      const board = await service.renameBoard('board-1', '  Trimmed Name  ');

      expect(boardRepository.rename).toHaveBeenCalledWith('board-1', '  Trimmed Name  ');
    });

    test('should handle empty label arrays', async () => {
      const input: CreateCardInput = {
        boardId: 'board-1',
        columnId: 'column-1',
        title: 'Card',
        labels: [],
      };

      await service.createCard(input);

      expect(cardRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        labels: [],
      }));
    });

    test('should handle updating card with null values', async () => {
      const updates: UpdateCardInput = {
        description: null,
        assignee: null,
        dueDate: null,
        labels: null,
      };

      await service.updateCard('card-1', updates);

      expect(cardRepository.update).toHaveBeenCalledWith('card-1', updates);
    });
  });
});
