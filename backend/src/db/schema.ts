import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// Patients table
export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientNumber: text('patient_number').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  dateOfBirth: text('date_of_birth'), // SQLite doesn't have DATE type, use TEXT
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Departments table
export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(), // e.g., CARDIO, ORTHO
  name: text('name').notNull(),
  description: text('description'),
});

// Doctors table
export const doctors = sqliteTable('doctors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  departmentId: integer('department_id')
    .notNull()
    .references(() => departments.id),
  doctorNumber: text('doctor_number').notNull().unique(), // e.g., D001
  name: text('name').notNull(),
  specialization: text('specialization'),
  acceptsNewPatients: integer('accepts_new_patients', { mode: 'boolean' })
    .notNull()
    .default(true),
  acceptsFollowUp: integer('accepts_follow_up', { mode: 'boolean' })
    .notNull()
    .default(true),
  acceptsCheckup: integer('accepts_checkup', { mode: 'boolean' })
    .notNull()
    .default(true),
});

// Schedules table
export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  timeSlot: text('time_slot').notNull(), // e.g., "08:00", "14:00"
  isAvailable: integer('is_available', { mode: 'boolean' })
    .notNull()
    .default(true),
});

// Appointments table
export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id),
  visitType: text('visit_type').notNull(), // 'new_visit', 'follow_up', 'checkup'
  appointmentDate: text('appointment_date').notNull(), // Format: "2025-12-25"
  appointmentTime: text('appointment_time').notNull(), // Format: "14:00"
  status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'cancelled'
  sessionId: text('session_id'), // Research: session that created this appointment
  agentType: text('agent_type'), // Research: 'baseline' or 'adaptive'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Interaction logs table (for research)
export const interactionLogs = sqliteTable('interaction_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  agentType: text('agent_type').notNull(), // 'baseline' or 'adaptive'
  currentStep: text('current_step').notNull(),
  userUtterance: text('user_utterance').notNull(),
  extractedData: text('extracted_data'), // JSON string
  accepted: integer('accepted', { mode: 'boolean' }).notNull(),
  rejectionReason: text('rejection_reason'),
  systemResponse: text('system_response').notNull(),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  doctors: many(doctors),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  department: one(departments, {
    fields: [doctors.departmentId],
    references: [departments.id],
  }),
  schedules: many(schedules),
  appointments: many(appointments),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  doctor: one(doctors, {
    fields: [schedules.doctorId],
    references: [doctors.id],
  }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
}));
