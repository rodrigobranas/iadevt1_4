import type { Database, Statement } from "bun:sqlite";
import type { Card, CreateCardInput, UpdateCardInput } from "../../models/entities";
import type { CardRepository } from "../kanban-repository";
import { 
  generateId, 
  getCurrentTimestamp, 
  validatePriority,
  serializeLabels,
  deserializeLabels,
  normalizePositions,
  setOrderForParent
} from "./helpers";

export class SqliteCardRepository implements CardRepository {
  private createStmt: Statement;
  private getByIdStmt: Statement;
  private listStmt: Statement;
  private updateStmt: Statement;
  private deleteStmt: Statement;
  private getMaxPositionStmt: Statement;
  private updatePositionStmt: Statement;
  private shiftPositionsStmt: Statement;
  private moveCardStmt: Statement;

  constructor(private db: Database) {
    this.createStmt = db.prepare(
      `INSERT INTO cards (id, board_id, column_id, title, description, assignee, 
                         due_date, labels, priority, position, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    this.getByIdStmt = db.prepare(
      `SELECT id, board_id as boardId, column_id as columnId, title, description, assignee,
              due_date as dueDate, labels, priority, position,
              created_at as createdAt, updated_at as updatedAt
       FROM cards WHERE id = ?`
    );
    
    this.listStmt = db.prepare(
      `SELECT id, board_id as boardId, column_id as columnId, title, description, assignee,
              due_date as dueDate, labels, priority, position,
              created_at as createdAt, updated_at as updatedAt
       FROM cards WHERE board_id = ? ORDER BY column_id, position`
    );
    
    this.updateStmt = db.prepare(
      `UPDATE cards 
       SET title = ?, description = ?, assignee = ?, due_date = ?, 
           labels = ?, priority = ?, updated_at = ?
       WHERE id = ?`
    );
    
    this.deleteStmt = db.prepare(
      `DELETE FROM cards WHERE id = ?`
    );
    
    this.getMaxPositionStmt = db.prepare(
      `SELECT COALESCE(MAX(position), -1) as maxPos FROM cards WHERE column_id = ?`
    );
    
    this.updatePositionStmt = db.prepare(
      `UPDATE cards SET position = ?, updated_at = ? WHERE id = ?`
    );
    
    this.shiftPositionsStmt = db.prepare(
      `UPDATE cards 
       SET position = position + ?, updated_at = ?
       WHERE column_id = ? AND position >= ? AND position <= ?`
    );
    
    this.moveCardStmt = db.prepare(
      `UPDATE cards SET column_id = ?, position = ?, updated_at = ? WHERE id = ?`
    );
  }

  private deserializeCard(row: any): Card {
    return {
      ...row,
      labels: deserializeLabels(row.labels)
    };
  }

  async create(input: CreateCardInput): Promise<Card> {
    const id = generateId();
    const timestamp = getCurrentTimestamp();
    const priority = validatePriority(input.priority);
    const labels = serializeLabels(input.labels);
    
    const transaction = this.db.transaction(() => {
      const { maxPos } = this.getMaxPositionStmt.get(input.columnId) as { maxPos: number };
      const position = maxPos + 1;
      
      this.createStmt.run(
        id,
        input.boardId,
        input.columnId,
        input.title,
        input.description || null,
        input.assignee || null,
        input.dueDate || null,
        labels,
        priority,
        position,
        timestamp,
        timestamp
      );
    });
    
    transaction();
    
    const card = await this.getById(id);
    if (!card) {
      throw new Error(`Failed to create card`);
    }
    
    return card;
  }

  async getById(cardId: string): Promise<Card | null> {
    const row = this.getByIdStmt.get(cardId);
    return row ? this.deserializeCard(row) : null;
  }

  async list(boardId: string): Promise<Card[]> {
    const rows = this.listStmt.all(boardId);
    return rows.map(row => this.deserializeCard(row));
  }

  async update(cardId: string, input: UpdateCardInput): Promise<Card> {
    const card = await this.getById(cardId);
    if (!card) {
      throw new Error(`Card with id ${cardId} not found`);
    }
    
    const timestamp = getCurrentTimestamp();
    const labels = input.labels !== undefined ? serializeLabels(input.labels) : serializeLabels(card.labels);
    const priority = input.priority !== undefined ? validatePriority(input.priority) : card.priority;
    
    this.updateStmt.run(
      input.title ?? card.title,
      input.description !== undefined ? input.description : card.description,
      input.assignee !== undefined ? input.assignee : card.assignee,
      input.dueDate !== undefined ? input.dueDate : card.dueDate,
      labels,
      priority,
      timestamp,
      cardId
    );
    
    const updatedCard = await this.getById(cardId);
    if (!updatedCard) {
      throw new Error(`Failed to update card`);
    }
    
    return updatedCard;
  }

  async delete(cardId: string): Promise<void> {
    const card = await this.getById(cardId);
    if (!card) return;
    
    const transaction = this.db.transaction(() => {
      this.deleteStmt.run(cardId);
      normalizePositions(this.db, 'cards', card.columnId, 'column_id');
    });
    
    transaction();
  }

  async move(cardId: string, toColumnId: string, toPosition: number): Promise<void> {
    const card = await this.getById(cardId);
    if (!card) {
      throw new Error(`Card with id ${cardId} not found`);
    }
    
    const timestamp = getCurrentTimestamp();
    
    const transaction = this.db.transaction(() => {
      if (card.columnId === toColumnId) {
        this.reorderWithinColumn(cardId, card.position, toPosition, toColumnId, timestamp);
      } else {
        this.shiftPositionsStmt.run(-1, timestamp, card.columnId, card.position + 1, 999999);
        
        const { maxPos } = this.getMaxPositionStmt.get(toColumnId) as { maxPos: number };
        const actualPosition = Math.min(toPosition, maxPos + 1);
        
        if (actualPosition <= maxPos) {
          this.shiftPositionsStmt.run(1, timestamp, toColumnId, actualPosition, maxPos);
        }
        
        this.moveCardStmt.run(toColumnId, actualPosition, timestamp, cardId);
        
        normalizePositions(this.db, 'cards', card.columnId, 'column_id');
      }
    });
    
    transaction();
  }

  async reorder(cardId: string, toPosition: number): Promise<void> {
    const card = await this.getById(cardId);
    if (!card) {
      throw new Error(`Card with id ${cardId} not found`);
    }
    
    const timestamp = getCurrentTimestamp();
    
    const transaction = this.db.transaction(() => {
      this.reorderWithinColumn(cardId, card.position, toPosition, card.columnId, timestamp);
    });
    
    transaction();
  }

  async setOrderForColumn(columnId: string, orderedCardIds: string[]): Promise<void> {
    setOrderForParent(this.db, 'cards', columnId, orderedCardIds, 'column_id');
  }

  private reorderWithinColumn(
    cardId: string,
    fromPosition: number,
    toPosition: number,
    columnId: string,
    timestamp: string
  ): void {
    if (fromPosition === toPosition) return;
    
    if (toPosition > fromPosition) {
      this.shiftPositionsStmt.run(-1, timestamp, columnId, fromPosition + 1, toPosition);
    } else {
      this.shiftPositionsStmt.run(1, timestamp, columnId, toPosition, fromPosition - 1);
    }
    
    this.updatePositionStmt.run(toPosition, timestamp, cardId);
  }
}