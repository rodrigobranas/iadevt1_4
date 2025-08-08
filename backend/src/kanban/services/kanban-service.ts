import type { Board, Column, Card, CreateCardInput, UpdateCardInput } from '../models/entities';
import type {
  BoardRepository,
  ColumnRepository,
  CardRepository,
} from '../repositories/kanban-repository';

export interface KanbanService {
  // Board operations
  createBoard(name: string): Promise<Board>;
  getBoard(boardId: string): Promise<Board | null>;
  listBoards(): Promise<Board[]>;
  renameBoard(boardId: string, name: string): Promise<Board>;
  deleteBoard(boardId: string): Promise<void>;

  // Column operations
  createColumn(boardId: string, name: string): Promise<Column>;
  listColumns(boardId: string): Promise<Column[]>;
  renameColumn(columnId: string, name: string): Promise<Column>;
  reorderColumn(columnId: string, newPosition: number): Promise<void>;
  deleteColumn(columnId: string, force?: boolean): Promise<void>;

  // Card operations
  createCard(input: CreateCardInput): Promise<Card>;
  getCard(cardId: string): Promise<Card | null>;
  listCards(boardId: string): Promise<Card[]>;
  updateCard(cardId: string, input: UpdateCardInput): Promise<Card>;
  deleteCard(cardId: string): Promise<void>;
  moveCard(cardId: string, toColumnId: string, toPosition: number): Promise<void>;
  reorderCard(cardId: string, toPosition: number): Promise<void>;
}

export class KanbanServiceImpl implements KanbanService {
  constructor(
    private boardRepository: BoardRepository,
    private columnRepository: ColumnRepository,
    private cardRepository: CardRepository,
  ) {}

  // Board operations
  async createBoard(name: string): Promise<Board> {
    if (!name || name.trim().length === 0) {
      throw new Error('Board name is required');
    }

    if (name.length > 100) {
      throw new Error('Board name must be 100 characters or less');
    }

    return this.boardRepository.create(name.trim());
  }

  async getBoard(boardId: string): Promise<Board | null> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    return this.boardRepository.getById(boardId);
  }

  async listBoards(): Promise<Board[]> {
    return this.boardRepository.list();
  }

  async renameBoard(boardId: string, name: string): Promise<Board> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Board name is required');
    }

    if (name.length > 100) {
      throw new Error('Board name must be 100 characters or less');
    }

    const board = await this.boardRepository.getById(boardId);
    if (!board) {
      throw new Error(`Board with ID ${boardId} not found`);
    }

    return this.boardRepository.rename(boardId, name.trim());
  }

  async deleteBoard(boardId: string): Promise<void> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    const board = await this.boardRepository.getById(boardId);
    if (!board) {
      throw new Error(`Board with ID ${boardId} not found`);
    }

    return this.boardRepository.delete(boardId);
  }

  // Column operations
  async createColumn(boardId: string, name: string): Promise<Column> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Column name is required');
    }

    if (name.length > 100) {
      throw new Error('Column name must be 100 characters or less');
    }

    const board = await this.boardRepository.getById(boardId);
    if (!board) {
      throw new Error(`Board with ID ${boardId} not found`);
    }

    const columns = await this.columnRepository.list(boardId);
    const maxPosition = columns.length > 0 ? Math.max(...columns.map((c) => c.position)) : -1;

    return this.columnRepository.create(boardId, name.trim(), maxPosition + 1);
  }

  async listColumns(boardId: string): Promise<Column[]> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    return this.columnRepository.list(boardId);
  }

  async renameColumn(columnId: string, name: string): Promise<Column> {
    if (!columnId) {
      throw new Error('Column ID is required');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Column name is required');
    }

    if (name.length > 100) {
      throw new Error('Column name must be 100 characters or less');
    }

    return this.columnRepository.rename(columnId, name.trim());
  }

  async reorderColumn(columnId: string, newPosition: number): Promise<void> {
    if (!columnId) {
      throw new Error('Column ID is required');
    }

    if (newPosition < 0) {
      throw new Error('Position must be non-negative');
    }

    return this.columnRepository.reorder(columnId, newPosition);
  }

  async deleteColumn(columnId: string, force?: boolean): Promise<void> {
    if (!columnId) {
      throw new Error('Column ID is required');
    }

    // Get the column to verify it exists and get its board ID
    const column = await this.columnRepository.getById(columnId);
    if (!column) {
      throw new Error(`Column with ID ${columnId} not found`);
    }

    // Check if column has cards
    const cards = await this.cardRepository.list(column.boardId);
    const columnCards = cards.filter((card) => card.columnId === columnId);

    if (columnCards.length > 0 && !force) {
      throw new Error(
        `Column contains ${columnCards.length} card(s). ` +
          'Use force=true to delete a non-empty column',
      );
    }

    return this.columnRepository.delete(columnId);
  }

  // Card operations
  async createCard(input: CreateCardInput): Promise<Card> {
    // Validate required fields
    if (!input.boardId) {
      throw new Error('Board ID is required');
    }

    if (!input.columnId) {
      throw new Error('Column ID is required');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Card title is required');
    }

    if (input.title.length > 200) {
      throw new Error('Card title must be 200 characters or less');
    }

    // Validate optional fields
    if (input.description && input.description.length > 2000) {
      throw new Error('Card description must be 2000 characters or less');
    }

    if (input.labels && input.labels.length > 10) {
      throw new Error('Card can have maximum 10 labels');
    }

    // Ensure priority has a default
    const cardInput = {
      ...input,
      title: input.title.trim(),
      priority: input.priority || 'medium',
    };

    return this.cardRepository.create(cardInput);
  }

  async getCard(cardId: string): Promise<Card | null> {
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    return this.cardRepository.getById(cardId);
  }

  async listCards(boardId: string): Promise<Card[]> {
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    return this.cardRepository.list(boardId);
  }

  async updateCard(cardId: string, input: UpdateCardInput): Promise<Card> {
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    // Validate optional fields if provided
    if (input.title !== undefined) {
      if (!input.title || input.title.trim().length === 0) {
        throw new Error('Card title cannot be empty');
      }
      if (input.title.length > 200) {
        throw new Error('Card title must be 200 characters or less');
      }
    }

    if (input.description !== undefined && input.description.length > 2000) {
      throw new Error('Card description must be 2000 characters or less');
    }

    if (input.labels && input.labels.length > 10) {
      throw new Error('Card can have maximum 10 labels');
    }

    const card = await this.cardRepository.getById(cardId);
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found`);
    }

    const updateInput = {
      ...input,
      title: input.title ? input.title.trim() : undefined,
    };

    return this.cardRepository.update(cardId, updateInput);
  }

  async deleteCard(cardId: string): Promise<void> {
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    const card = await this.cardRepository.getById(cardId);
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found`);
    }

    return this.cardRepository.delete(cardId);
  }

  async moveCard(cardId: string, toColumnId: string, toPosition: number): Promise<void> {
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    if (!toColumnId) {
      throw new Error('Target column ID is required');
    }

    if (toPosition < 0) {
      throw new Error('Position must be non-negative');
    }

    const card = await this.cardRepository.getById(cardId);
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found`);
    }

    return this.cardRepository.move(cardId, toColumnId, toPosition);
  }

  async reorderCard(cardId: string, toPosition: number): Promise<void> {
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    if (toPosition < 0) {
      throw new Error('Position must be non-negative');
    }

    const card = await this.cardRepository.getById(cardId);
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found`);
    }

    return this.cardRepository.reorder(cardId, toPosition);
  }
}
