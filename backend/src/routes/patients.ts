import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/index.js';
import { patients } from '../db/schema.js';

const patientsRoutes: FastifyPluginAsync = async (app) => {
  // Get all patients (for testing database)
  app.get('/api/patients', async (request, reply) => {
    const allPatients = await db.select().from(patients);
    return {
      patients: allPatients,
      count: allPatients.length,
    };
  });
};

export default patientsRoutes;
