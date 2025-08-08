import type { Database, Statement } from "bun:sqlite";
import type { Board } from "../../models/entities";
import type { BoardRepository } from "../kanban-repository";
import { generateId, getCurrentTimestamp } from "./helpers";

export class SqliteBoardRepository implements BoardRepository {
  private createStmt: Statement;
  private getByIdStmt: Statement;
  private listStmt: Statement;
  private renameStmt: Statement;
  private deleteStmt: Statement;

  constructor(private db: Database) {
    this.createStmt = db.prepare(
      `INSERT INTO boards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`
    );
    
    this.getByIdStmt = db.prepare(
      `SELECT id, name, created_at as createdAt, updated_at as updatedAt 
       FROM boards WHERE id = ?`
    );
    
    this.listStmt = db.prepare(
      `SELECT id, name, created_at as createdAt, updated_at as updatedAt 
       FROM boards ORDER BY created_at DESC`
    );
    
    this.renameStmt = db.prepare(
      `UPDATE boards SET name = ?, updated_at = ? WHERE id = ?`
    );
    
    this.deleteStmt = db.prepare(
      `DELETE FROM boards WHERE id = ?`
    );
  }

  async create(name: string): Promise<Board> {
    const id = generateId();
    const timestamp = getCurrentTimestamp();
    
    this.createStmt.run(id, name, timestamp, timestamp);
    
    return {
      id,
      name,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  async getById(boardId: string): Promise<Board | null> {
    const board = this.getByIdStmt.get(boardId) as Board | undefined;
    return board || null;
  }

  async list(): Promise<Board[]> {
    return this.listStmt.all() as Board[];
  }

  async rename(boardId: string, name: string): Promise<Board> {
    const timestamp = getCurrentTimestamp();
    this.renameStmt.run(name, timestamp, boardId);
    
    const board = await this.getById(boardId);
    if (!board) {
      throw new Error(`Board with id ${boardId} not found`);
    }
    
    return board;
  }

  async delete(boardId: string): Promise<void> {
    this.deleteStmt.run(boardId);
  }
}