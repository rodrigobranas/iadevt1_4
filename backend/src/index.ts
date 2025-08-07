import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for frontend with comprehensive configuration
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5175'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 600, // 10 minutes
  })
);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// Health check endpoint
app.get('/health', (c) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'backend-api',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
    },
  };

  return c.json(healthStatus, 200);
});

export default {
  port: 3005,
  fetch: app.fetch,
};
