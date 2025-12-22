import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './routes/health.js';
import patientsRoutes from './routes/patients.js';
import sessionRoutes from './routes/session.js';

const app = Fastify({
  logger: {
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

// Register routes
await app.register(healthRoutes);
await app.register(patientsRoutes);
await app.register(sessionRoutes);

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
