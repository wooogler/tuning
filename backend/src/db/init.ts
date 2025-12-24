import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sql } from 'drizzle-orm';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database connection
const dbPath = join(__dirname, '../../data/hospital.db');

export async function initializeDatabase() {
  console.log('🔧 Initializing database at:', dbPath);

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  // Create tables
  console.log('Creating tables...');

  // Patients table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      date_of_birth TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Departments table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // Doctors table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      doctor_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      specialization TEXT,
      accepts_new_patients INTEGER NOT NULL DEFAULT 1,
      accepts_follow_up INTEGER NOT NULL DEFAULT 1,
      accepts_checkup INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )
  `);

  // Schedules table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      time_slot TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `);

  // Appointments table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      visit_type TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      session_id TEXT,
      agent_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `);

  // Interaction logs table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS interaction_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      current_step TEXT NOT NULL,
      user_utterance TEXT NOT NULL,
      extracted_data TEXT,
      accepted INTEGER NOT NULL,
      rejection_reason TEXT,
      system_response TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database tables created successfully');
  sqlite.close();
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}
