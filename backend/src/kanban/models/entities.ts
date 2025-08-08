export type Priority = 'low' | 'medium' | 'high';

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  labels: string[];
  priority: Priority;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  priority?: Priority;
}

export type UpdateCardInput = Partial<Omit<CreateCardInput, 'boardId' | 'columnId' | 'title'>> & {
  title?: string;
};