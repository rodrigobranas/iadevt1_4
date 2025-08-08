import { Hono } from 'hono';
import type { KanbanService } from '../services/kanban-service';
import type { CreateCardInput, UpdateCardInput } from '../models/entities';

export function createCardRoutes(service: KanbanService) {
  const app = new Hono();

  // GET /boards/:boardId/cards - List cards for a board
  app.get('/boards/:boardId/cards', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      const cards = await service.listCards(boardId);
      return c.json(cards);
    } catch (error: any) {
      console.error('Error listing cards:', error);

      if (error.message?.includes('required')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to list cards' }, 500);
    }
  });

  // POST /boards/:boardId/cards - Create a new card
  app.post('/boards/:boardId/cards', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      const body = await c.req.json();
      const { columnId, title, description, assignee, dueDate, labels, priority } = body;

      if (!columnId || typeof columnId !== 'string') {
        return c.json({ error: 'Column ID is required and must be a string' }, 400);
      }

      if (!title || typeof title !== 'string') {
        return c.json({ error: 'Card title is required and must be a string' }, 400);
      }

      // Validate optional fields
      if (labels && !Array.isArray(labels)) {
        return c.json({ error: 'Labels must be an array of strings' }, 400);
      }

      if (priority && !['low', 'medium', 'high'].includes(priority)) {
        return c.json({ error: 'Priority must be one of: low, medium, high' }, 400);
      }

      const input: CreateCardInput = {
        boardId,
        columnId,
        title,
        description,
        assignee,
        dueDate,
        labels,
        priority,
      };

      const card = await service.createCard(input);
      return c.json(card, 201);
    } catch (error: any) {
      console.error('Error creating card:', error);

      if (
        error.message?.includes('required') ||
        error.message?.includes('characters') ||
        error.message?.includes('maximum')
      ) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to create card' }, 500);
    }
  });

  // GET /cards/:cardId - Get card by ID
  app.get('/cards/:cardId', async (c) => {
    try {
      const cardId = c.req.param('cardId');
      const card = await service.getCard(cardId);

      if (!card) {
        return c.json({ error: `Card with ID ${cardId} not found` }, 404);
      }

      return c.json(card);
    } catch (error) {
      console.error('Error getting card:', error);
      return c.json({ error: 'Failed to get card' }, 500);
    }
  });

  // PATCH /cards/:cardId - Update card
  app.patch('/cards/:cardId', async (c) => {
    try {
      const cardId = c.req.param('cardId');
      const body = await c.req.json();
      const { title, description, assignee, dueDate, labels, priority } = body;

      // Validate optional fields if provided
      if (labels !== undefined && !Array.isArray(labels)) {
        return c.json({ error: 'Labels must be an array of strings' }, 400);
      }

      if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
        return c.json({ error: 'Priority must be one of: low, medium, high' }, 400);
      }

      const input: UpdateCardInput = {
        title,
        description,
        assignee,
        dueDate,
        labels,
        priority,
      };

      const card = await service.updateCard(cardId, input);
      return c.json(card);
    } catch (error: any) {
      console.error('Error updating card:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (
        error.message?.includes('required') ||
        error.message?.includes('characters') ||
        error.message?.includes('maximum')
      ) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to update card' }, 500);
    }
  });

  // DELETE /cards/:cardId - Delete card
  app.delete('/cards/:cardId', async (c) => {
    try {
      const cardId = c.req.param('cardId');
      await service.deleteCard(cardId);
      return c.json({ message: 'Card deleted successfully' }, 200);
    } catch (error: any) {
      console.error('Error deleting card:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      return c.json({ error: 'Failed to delete card' }, 500);
    }
  });

  // POST /cards/:cardId/move - Move card to another column
  app.post('/cards/:cardId/move', async (c) => {
    try {
      const cardId = c.req.param('cardId');
      const body = await c.req.json();
      const { toColumnId, toPosition } = body;

      if (!toColumnId || typeof toColumnId !== 'string') {
        return c.json({ error: 'Target column ID is required and must be a string' }, 400);
      }

      if (typeof toPosition !== 'number' || toPosition < 0) {
        return c.json({ error: 'Position must be a non-negative number' }, 400);
      }

      await service.moveCard(cardId, toColumnId, toPosition);
      return c.json({ message: 'Card moved successfully' });
    } catch (error: any) {
      console.error('Error moving card:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes('required') || error.message?.includes('non-negative')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to move card' }, 500);
    }
  });

  // POST /cards/:cardId/reorder - Reorder card within same column
  app.post('/cards/:cardId/reorder', async (c) => {
    try {
      const cardId = c.req.param('cardId');
      const body = await c.req.json();
      const { toPosition } = body;

      if (typeof toPosition !== 'number' || toPosition < 0) {
        return c.json({ error: 'Position must be a non-negative number' }, 400);
      }

      await service.reorderCard(cardId, toPosition);
      return c.json({ message: 'Card reordered successfully' });
    } catch (error: any) {
      console.error('Error reordering card:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes('required') || error.message?.includes('non-negative')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to reorder card' }, 500);
    }
  });

  return app;
}
