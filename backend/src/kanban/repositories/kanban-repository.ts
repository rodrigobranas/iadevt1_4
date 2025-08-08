import type { Board, Column, Card, CreateCardInput, UpdateCardInput } from '../models/entities';

export interface BoardRepository {
  create(name: string): Promise<Board>;
  getById(boardId: string): Promise<Board | null>;
  list(): Promise<Board[]>;
  rename(boardId: string, name: string): Promise<Board>;
  delete(boardId: string): Promise<void>;
}

export interface ColumnRepository {
  create(boardId: string, name: string, position: number): Promise<Column>;
  list(boardId: string): Promise<Column[]>;
  rename(columnId: string, name: string): Promise<Column>;
  reorder(columnId: string, newPosition: number): Promise<void>;
  delete(columnId: string): Promise<void>;
}

export interface CardRepository {
  create(input: CreateCardInput): Promise<Card>;
  getById(cardId: string): Promise<Card | null>;
  list(boardId: string): Promise<Card[]>;
  update(cardId: string, input: UpdateCardInput): Promise<Card>;
  delete(cardId: string): Promise<void>;
  move(cardId: string, toColumnId: string, toPosition: number): Promise<void>;
  reorder(cardId: string, toPosition: number): Promise<void>;
}