import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database connection (absolute path)
const dbPath = join(__dirname, '../../data/hospital.db');
const sqlite = new Database(dbPath);

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export schema for type inference
export { schema };
