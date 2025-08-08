import { Hono } from 'hono';
import { getDb } from '../db/sqlite';
import { SqliteBoardRepository } from '../repositories/sqlite/board-repository';
import { SqliteColumnRepository } from '../repositories/sqlite/column-repository';
import { SqliteCardRepository } from '../repositories/sqlite/card-repository';
import { KanbanServiceImpl } from '../services/kanban-service';
import { createBoardRoutes } from './boards';
import { createColumnRoutes } from './columns';
import { createCardRoutes } from './cards';

export function createKanbanRoutes() {
  const app = new Hono();

  // Initialize dependencies
  const db = getDb();
  const boardRepository = new SqliteBoardRepository(db);
  const columnRepository = new SqliteColumnRepository(db);
  const cardRepository = new SqliteCardRepository(db);

  const service = new KanbanServiceImpl(boardRepository, columnRepository, cardRepository);

  // Create route modules
  const boardRoutes = createBoardRoutes(service);
  const columnRoutes = createColumnRoutes(service);
  const cardRoutes = createCardRoutes(service);

  // Mount board routes
  app.route('/boards', boardRoutes);

  // Mount column routes (both under /boards and root for /columns/:id)
  app.route('/', columnRoutes);

  // Mount card routes (both under /boards and root for /cards/:id)
  app.route('/', cardRoutes);

  return app;
}
