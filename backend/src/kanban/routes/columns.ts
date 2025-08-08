import { Hono } from 'hono';
import type { KanbanService } from '../services/kanban-service';

export function createColumnRoutes(service: KanbanService) {
  const app = new Hono();

  // GET /boards/:boardId/columns - List columns for a board
  app.get('/boards/:boardId/columns', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      const columns = await service.listColumns(boardId);
      return c.json(columns);
    } catch (error: any) {
      console.error('Error listing columns:', error);

      if (error.message?.includes('required')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to list columns' }, 500);
    }
  });

  // POST /boards/:boardId/columns - Create a new column
  app.post('/boards/:boardId/columns', async (c) => {
    try {
      const boardId = c.req.param('boardId');
      const body = await c.req.json();
      const { name } = body;

      if (!name || typeof name !== 'string') {
        return c.json({ error: 'Column name is required and must be a string' }, 400);
      }

      const column = await service.createColumn(boardId, name);
      return c.json(column, 201);
    } catch (error: any) {
      console.error('Error creating column:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes('required') || error.message?.includes('characters')) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to create column' }, 500);
    }
  });

  // PATCH /columns/:columnId - Update column (rename or reorder)
  app.patch('/columns/:columnId', async (c) => {
    try {
      const columnId = c.req.param('columnId');
      const body = await c.req.json();
      const { name, position } = body;

      // Handle rename
      if (name !== undefined) {
        if (typeof name !== 'string') {
          return c.json({ error: 'Column name must be a string' }, 400);
        }

        const column = await service.renameColumn(columnId, name);
        return c.json(column);
      }

      // Handle reorder
      if (position !== undefined) {
        if (typeof position !== 'number' || position < 0) {
          return c.json({ error: 'Position must be a non-negative number' }, 400);
        }

        await service.reorderColumn(columnId, position);
        return c.json({ message: 'Column reordered successfully' });
      }

      return c.json({ error: 'Either name or position must be provided' }, 400);
    } catch (error: any) {
      console.error('Error updating column:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (
        error.message?.includes('required') ||
        error.message?.includes('characters') ||
        error.message?.includes('non-negative')
      ) {
        return c.json({ error: error.message }, 400);
      }

      return c.json({ error: 'Failed to update column' }, 500);
    }
  });

  // DELETE /columns/:columnId - Delete column
  app.delete('/columns/:columnId', async (c) => {
    try {
      const columnId = c.req.param('columnId');
      const force = c.req.query('force') === 'true';

      await service.deleteColumn(columnId, force);
      return c.json({ message: 'Column deleted successfully' }, 200);
    } catch (error: any) {
      console.error('Error deleting column:', error);

      if (error.message?.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }

      if (error.message?.includes('force=true')) {
        return c.json({ error: error.message }, 409);
      }

      return c.json({ error: 'Failed to delete column' }, 500);
    }
  });

  return app;
}
