import { Hono } from 'hono';
import type { KanbanService } from '../services/kanban-service';

export function createBoardRoutes(service: KanbanService) {
  const app = new Hono();

  // GET /boards - List all boards
  app.get('/', async (c) => {
    try {
      const boards = await service.listBoards();
      return c.json(boards);
    } catch (error) {
      console.error('Error listing boards:', error);
      return c.json({ error: 'Failed to list boards' }, 500);
    }
  });

  // POST /boards - Create a new board
  app.post('/', async (c) => {
    try {
      const body = await c.req.json();
      const { name } = body;

      if (!name || typeof name !== 'string') {
        return c.json({ error: 'Board name is required and must be a string' }, 400);
      }

      const board = await service.createBoard(name);
      return c.json(board, 201);
    } catch (error: any) {
      console.error('Error creating board:', error);

      if (error.message?.includes('required') || error.message?.includes('characters')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to create board' }, 500);
    }
  });

  // GET /boards/:boardId - Get board by ID
  app.get('/:boardId', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      const board = await service.getBoard(boardId);

      if (!board) {
        return c.json({ error: `Board with ID ${boardId} not found` }, 404);
      }

      // Check if we should include related data
      const include = c.req.query('include');
      let response: any = board;

      if (include) {
        const includes = include.split(',');

        if (includes.includes('columns')) {
          const columns = await service.listColumns(boardId);
          response = { ...response, columns };
        }

        if (includes.includes('cards')) {
          const cards = await service.listCards(boardId);
          response = { ...response, cards };
        }
      }

      return c.json(response);
    } catch (error) {
      console.error('Error getting board:', error);
      return c.json({ error: 'Failed to get board' }, 500);
    }
  });

  // PATCH /boards/:boardId - Update board (rename)
  app.patch('/:boardId', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      const body = await c.req.json();
      const { name } = body;

      if (!name || typeof name !== 'string') {
        return c.json({ error: 'Board name is required and must be a string' }, 400);
      }

      const board = await service.renameBoard(boardId, name);
      return c.json(board);
    } catch (error: any) {
      console.error('Error updating board:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes('required') || error.message?.includes('characters')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to update board' }, 500);
    }
  });

  // DELETE /boards/:boardId - Delete board
  app.delete('/:boardId', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      await service.deleteBoard(boardId);
      return c.json({ message: 'Board deleted successfully' }, 200);
    } catch (error: any) {
      console.error('Error deleting board:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      return c.json({ error: 'Failed to delete board' }, 500);
    }
  });

  return app;
}
