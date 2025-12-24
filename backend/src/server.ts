import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import healthRoutes from './routes/health.js';
import patientsRoutes from './routes/patients.js';
import sessionRoutes from './routes/session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = Fastify({
  logger:
    process.env.NODE_ENV === 'production'
      ? { level: 'info' } // Simple JSON logging in production
      : {
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        },
});

// Register CORS for frontend integration
await app.register(cors, {
  origin: true, // Allow all origins in development
});

// Register API routes first (before static files)
await app.register(healthRoutes);
await app.register(patientsRoutes);
await app.register(sessionRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = join(__dirname, '../../frontend/dist');

  await app.register(fastifyStatic, {
    root: frontendDistPath,
    prefix: '/',
  });

  // Fallback to index.html for SPA routing
  app.setNotFoundHandler((request, reply) => {
    reply.sendFile('index.html');
  });
}

// Start server
const start = async () => {
  try {
    const port = 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`✅ Server is running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
