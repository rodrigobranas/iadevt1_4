// Types mirroring backend entities
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
  columnId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  priority?: Priority;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  priority?: Priority;
}

export interface BoardWithRelations extends Board {
  columns?: Column[];
  cards?: Card[];
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
const API_PATH = '/api/v0/kanban';

// Error handling
export class ApiError extends Error {
  status: number;
  data?: unknown;
  
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Base fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${API_PATH}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorData: unknown;
    
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
      errorData = errorBody;
    } catch {
      // If response body is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage, errorData);
  }

  // Handle empty responses (like DELETE operations)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

// Board API functions
export const boardsApi = {
  list(): Promise<Board[]> {
    return apiFetch<Board[]>('/boards');
  },

  create(name: string): Promise<Board> {
    return apiFetch<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  getById(boardId: string, include?: ('columns' | 'cards')[]): Promise<BoardWithRelations> {
    const params = include?.length ? `?include=${include.join(',')}` : '';
    return apiFetch<BoardWithRelations>(`/boards/${boardId}${params}`);
  },

  rename(boardId: string, name: string): Promise<Board> {
    return apiFetch<Board>(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  delete(boardId: string): Promise<void> {
    return apiFetch<void>(`/boards/${boardId}`, {
      method: 'DELETE',
    });
  },
};

// Column API functions
export const columnsApi = {
  list(boardId: string): Promise<Column[]> {
    return apiFetch<Column[]>(`/boards/${boardId}/columns`);
  },

  create(boardId: string, name: string): Promise<Column> {
    return apiFetch<Column>(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  rename(columnId: string, name: string): Promise<Column> {
    return apiFetch<Column>(`/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  reorder(columnId: string, position: number): Promise<void> {
    return apiFetch<void>(`/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    });
  },

  delete(columnId: string, force = false): Promise<void> {
    const params = force ? '?force=true' : '';
    return apiFetch<void>(`/columns/${columnId}${params}`, {
      method: 'DELETE',
    });
  },
};

// Card API functions
export const cardsApi = {
  list(boardId: string): Promise<Card[]> {
    return apiFetch<Card[]>(`/boards/${boardId}/cards`);
  },

  create(boardId: string, input: CreateCardInput): Promise<Card> {
    return apiFetch<Card>(`/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getById(cardId: string): Promise<Card> {
    return apiFetch<Card>(`/cards/${cardId}`);
  },

  update(cardId: string, input: UpdateCardInput): Promise<Card> {
    return apiFetch<Card>(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  delete(cardId: string): Promise<void> {
    return apiFetch<void>(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  },

  move(cardId: string, toColumnId: string, toPosition: number): Promise<void> {
    return apiFetch<void>(`/cards/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify({ toColumnId, toPosition }),
    });
  },

  reorder(cardId: string, toPosition: number): Promise<void> {
    return apiFetch<void>(`/cards/${cardId}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ toPosition }),
    });
  },
};

// Convenience function to get full board data with all relations
export async function getFullBoard(boardId: string): Promise<{
  board: Board;
  columns: Column[];
  cards: Card[];
}> {
  const boardData = await boardsApi.getById(boardId, ['columns', 'cards']);
  
  return {
    board: {
      id: boardData.id,
      name: boardData.name,
      createdAt: boardData.createdAt,
      updatedAt: boardData.updatedAt,
    },
    columns: boardData.columns || [],
    cards: boardData.cards || [],
  };
}

// Export all APIs together for convenient import
export const kanbanApi = {
  boards: boardsApi,
  columns: columnsApi,
  cards: cardsApi,
  getFullBoard,
};