import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initializeDatabase } from './kanban/db/init';
import { isDbHealthy } from './kanban/db/sqlite';
import { createKanbanRoutes } from './kanban/routes';

const app = new Hono();

initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Enable CORS for frontend with comprehensive configuration
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5176'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 600, // 10 minutes
  }),
);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// Health check endpoint
app.get('/health', (c) => {
  const dbHealthy = isDbHealthy();
  const overallHealthy = dbHealthy;

  const healthStatus = {
    status: overallHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'backend-api',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
    },
    database: {
      status: dbHealthy ? 'connected' : 'disconnected',
      type: 'sqlite',
    },
  };

  return c.json(healthStatus, overallHealthy ? 200 : 503);
});

// Mount Kanban routes under /api/v0/kanban
const kanbanRoutes = createKanbanRoutes();
app.route('/api/v0/kanban', kanbanRoutes);

export { app };

export default {
  port: 3005,
  fetch: app.fetch,
};
