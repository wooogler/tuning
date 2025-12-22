import { z } from 'zod';

/**
 * Common schema for all appointment data that could be mentioned
 * Used across all parsing steps to detect out-of-step information
 */
const AppointmentDataSchema = z.object({
  patientNumber: z.string().nullable().describe('Patient ID (e.g., P001)'),
  visitType: z.enum(['new_visit', 'follow_up', 'checkup']).nullable().describe('Visit type'),
  department: z.string().nullable().describe('Department name or code'),
  doctor: z.string().nullable().describe('Doctor name'),
  date: z.string().nullable().describe('Appointment date'),
  time: z.string().nullable().describe('Appointment time'),
  userConfirmed: z.boolean().nullable().describe('True if user confirmed/agreed, false if user declined, null otherwise'),
});

/**
 * Generic parsing result schema
 * Used for all appointment booking steps
 *
 * This enables:
 * - Baseline agent: Reject if containsOtherStepInfo is true
 * - Adaptive agent: Save extractedData for future steps
 */
export const StepParseResultSchema = z.object({
  extractedData: AppointmentDataSchema.describe(
    'All appointment data extracted from user input'
  ),
  containsOtherStepInfo: z.boolean().describe(
    'True if user mentioned information for steps other than the current one'
  ),
  confidence: z.number().min(0).max(1).describe(
    'Confidence score for the extraction (0-1)'
  ),
});

export type StepParseResult = z.infer<typeof StepParseResultSchema>;
