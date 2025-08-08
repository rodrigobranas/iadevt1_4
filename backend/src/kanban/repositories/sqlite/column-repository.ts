import type { Database, Statement } from 'bun:sqlite';
import type { Column } from '../../models/entities';
import type { ColumnRepository } from '../kanban-repository';
import { generateId, getCurrentTimestamp, normalizePositions, setOrderForParent } from './helpers';

export class SqliteColumnRepository implements ColumnRepository {
  private createStmt: Statement;
  private listStmt: Statement;
  private getByIdStmt: Statement;
  private renameStmt: Statement;
  private deleteStmt: Statement;
  private getMaxPositionStmt: Statement;
  private updatePositionStmt: Statement;
  private shiftPositionsStmt: Statement;

  constructor(private db: Database) {
    this.createStmt = db.prepare(
      `INSERT INTO columns (id, board_id, name, position, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    this.listStmt = db.prepare(
      `SELECT id, board_id as boardId, name, position, 
              created_at as createdAt, updated_at as updatedAt 
       FROM columns WHERE board_id = ? ORDER BY position`,
    );

    this.getByIdStmt = db.prepare(
      `SELECT id, board_id as boardId, name, position,
              created_at as createdAt, updated_at as updatedAt
       FROM columns WHERE id = ?`,
    );

    this.renameStmt = db.prepare(`UPDATE columns SET name = ?, updated_at = ? WHERE id = ?`);

    this.deleteStmt = db.prepare(`DELETE FROM columns WHERE id = ?`);

    this.getMaxPositionStmt = db.prepare(
      `SELECT COALESCE(MAX(position), -1) as maxPos FROM columns WHERE board_id = ?`,
    );

    this.updatePositionStmt = db.prepare(
      `UPDATE columns SET position = ?, updated_at = ? WHERE id = ?`,
    );

    this.shiftPositionsStmt = db.prepare(
      `UPDATE columns 
       SET position = position + ?, updated_at = ?
       WHERE board_id = ? AND position >= ? AND position <= ?`,
    );
  }

  async create(boardId: string, name: string, position?: number): Promise<Column> {
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    const transaction = this.db.transaction(() => {
      const { maxPos } = this.getMaxPositionStmt.get(boardId) as { maxPos: number };
      const actualPosition = position ?? maxPos + 1;

      if (position !== undefined && position <= maxPos) {
        this.shiftPositionsStmt.run(1, timestamp, boardId, position, maxPos);
      }

      this.createStmt.run(id, boardId, name, actualPosition, timestamp, timestamp);
    });

    transaction();

    const column = await this.getById(id);
    if (!column) {
      throw new Error(`Failed to create column`);
    }

    return column;
  }

  async getById(columnId: string): Promise<Column | null> {
    const column = this.getByIdStmt.get(columnId) as Column | undefined;
    return column || null;
  }

  async list(boardId: string): Promise<Column[]> {
    return this.listStmt.all(boardId) as Column[];
  }

  async rename(columnId: string, name: string): Promise<Column> {
    const timestamp = getCurrentTimestamp();
    this.renameStmt.run(name, timestamp, columnId);

    const column = await this.getById(columnId);
    if (!column) {
      throw new Error(`Column with id ${columnId} not found`);
    }

    return column;
  }

  async reorder(columnId: string, newPosition: number): Promise<void> {
    const column = await this.getById(columnId);
    if (!column) {
      throw new Error(`Column with id ${columnId} not found`);
    }

    const timestamp = getCurrentTimestamp();
    const oldPosition = column.position;

    if (oldPosition === newPosition) return;

    const transaction = this.db.transaction(() => {
      if (newPosition > oldPosition) {
        this.shiftPositionsStmt.run(-1, timestamp, column.boardId, oldPosition + 1, newPosition);
      } else {
        this.shiftPositionsStmt.run(1, timestamp, column.boardId, newPosition, oldPosition - 1);
      }

      this.updatePositionStmt.run(newPosition, timestamp, columnId);
    });

    transaction();
  }

  async setOrderForBoard(boardId: string, orderedColumnIds: string[]): Promise<void> {
    setOrderForParent(this.db, 'columns', boardId, orderedColumnIds, 'board_id');
  }

  async delete(columnId: string): Promise<void> {
    const column = await this.getById(columnId);
    if (!column) return;

    const transaction = this.db.transaction(() => {
      this.deleteStmt.run(columnId);
      normalizePositions(this.db, 'columns', column.boardId, 'board_id');
    });

    transaction();
  }
}
