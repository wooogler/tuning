import type { Agent } from './agent-interface.js';
import type { ChatSession, AgentResult, AppointmentStep } from '../types/index.js';
import { parseStep } from '../parsers/step-parser.js';
import { validateCurrentStep } from '../validators/step-validators.js';
import { db } from '../db/index.js';
import { appointments, patients, doctors } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Baseline Agent: Rigid, step-aligned chatbot
 *
 * Characteristics:
 * - Only accepts input for current step
 * - Rejects information for other steps
 * - No inference or flexibility
 * - Strictly sequential progression
 */
export class BaselineAgent implements Agent {

  getInitialMessage(): string {
    return 'Hello! I will help you book an appointment. Please provide your patient number (format: PXXX, e.g., P001).';
  }

  getStepPrompt(step: AppointmentStep): string {
    const prompts: Record<AppointmentStep, string> = {
      PATIENT_ID: 'Please provide your patient number (format: PXXX, e.g., P001, P002, P003).',
      VISIT_TYPE: 'Please select visit type: New visit, Follow-up, or Checkup.',
      DEPARTMENT: 'Which department would you like to visit?',
      DOCTOR: 'Which doctor would you like to see?',
      DATE: 'What date would you prefer?',
      TIME: 'What time slot would you prefer?',
      CONFIRMATION: 'Please confirm your appointment details.',
    };

    return prompts[step];
  }

  async processInput(session: ChatSession, userMessage: string): Promise<AgentResult> {
    const currentStep = session.currentStep;

    // Use generic handler for all steps (including CONFIRMATION)
    switch (currentStep) {
      case 'PATIENT_ID':
      case 'VISIT_TYPE':
      case 'DEPARTMENT':
      case 'DOCTOR':
      case 'DATE':
      case 'TIME':
      case 'CONFIRMATION':
        return this.handleStep(currentStep, userMessage, session);

      default:
        return {
          accepted: false,
          message: 'Invalid step.',
          rejectionReason: 'INVALID_STEP',
        };
    }
  }

  /**
   * Generic handler for all steps using new unified parser/validator system
   */
  private async handleStep(
    step: AppointmentStep,
    userMessage: string,
    session: ChatSession
  ): Promise<AgentResult> {
    // Parse user input (pass session data for steps that need DB options)
    const parseResult = await parseStep(step, userMessage, session.conversationHistory, {
      department: session.appointmentData.department,
      visitType: session.appointmentData.visitType,
      doctor: session.appointmentData.doctor,
      date: session.appointmentData.date,
    });

    // Baseline behavior: Reject if other step info is present
    if (parseResult.containsOtherStepInfo) {
      return {
        accepted: false,
        message: `Please provide only information for the current step (${step}). Other information will be requested later.`,
        rejectionReason: 'CONTAINS_OTHER_STEP_INFO',
      };
    }

    // Validate current step data (pass session data for steps that need it)
    const validation = await validateCurrentStep(step, parseResult, {
      department: session.appointmentData.department,
      visitType: session.appointmentData.visitType,
      doctor: session.appointmentData.doctor,
      date: session.appointmentData.date,
    });

    if (!validation.valid) {
      return {
        accepted: false,
        message: validation.error || 'Invalid input',
        rejectionReason: 'VALIDATION_FAILED',
      };
    }

    // Determine next step
    const stepOrder: AppointmentStep[] = [
      'PATIENT_ID',
      'VISIT_TYPE',
      'DEPARTMENT',
      'DOCTOR',
      'DATE',
      'TIME',
      'CONFIRMATION',
    ];
    const currentIndex = stepOrder.indexOf(step);
    const nextStep = currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : undefined;

    // Build data object with appropriate key
    const dataKey = this.getDataKeyForStep(step);
    const data = { [dataKey]: validation.value };

    // Handle CONFIRMATION step
    if (step === 'CONFIRMATION') {
      if (validation.value === true) {
        // User confirmed - save appointment
        try {
          await this.saveAppointment(session);
        } catch (error) {
          console.error('Failed to save appointment:', error);
          return {
            accepted: false,
            message: 'Failed to save appointment. Please try again.',
            rejectionReason: 'DB_SAVE_FAILED',
          };
        }

        return {
          accepted: true,
          message: '✓ Appointment confirmed.',
          nextStep: undefined,
          data,
        };
      } else {
        // User declined - cancel appointment
        return {
          accepted: true,
          message: 'Appointment cancelled.',
          nextStep: undefined,
          data,
        };
      }
    }

    // Success for other steps!
    const nextPrompt = nextStep ? this.getStepPrompt(nextStep) : '';

    return {
      accepted: true,
      message: `✓ ${this.getStepConfirmation(step, validation.value)}. ${nextPrompt}`,
      nextStep,
      data,
    };
  }

  /**
   * Save confirmed appointment to database
   */
  private async saveAppointment(session: ChatSession): Promise<void> {
    const { patientId, visitType, doctor, date, time } = session.appointmentData;

    // Find patient
    const patient = await db.query.patients.findFirst({
      where: eq(patients.patientNumber, patientId!),
    });

    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    // Find doctor
    const doctorRecord = await db.query.doctors.findFirst({
      where: eq(doctors.name, doctor!),
    });

    if (!doctorRecord) {
      throw new Error(`Doctor ${doctor} not found`);
    }

    // Insert appointment
    await db.insert(appointments).values({
      patientId: patient.id,
      doctorId: doctorRecord.id,
      visitType: visitType!,
      appointmentDate: date!,
      appointmentTime: time!,
      status: 'confirmed',
      sessionId: session.sessionId,
      agentType: 'baseline',
    });

    console.log(`✅ Appointment saved for patient ${patientId} with ${doctor} on ${date} at ${time}`);
  }

  /**
   * Get data key name for each step
   */
  private getDataKeyForStep(step: AppointmentStep): string {
    const keys: Record<AppointmentStep, string> = {
      PATIENT_ID: 'patientId',
      VISIT_TYPE: 'visitType',
      DEPARTMENT: 'department',
      DOCTOR: 'doctor',
      DATE: 'date',
      TIME: 'time',
      CONFIRMATION: 'confirmed',
    };
    return keys[step];
  }

  /**
   * Get confirmation message for each step
   */
  private getStepConfirmation(step: AppointmentStep, value: any): string {
    switch (step) {
      case 'PATIENT_ID':
        return `Patient ${value} confirmed`;
      case 'VISIT_TYPE':
        return `Visit type: ${value.replace('_', ' ')}`;
      case 'DEPARTMENT':
        return `Department: ${value}`;
      case 'DOCTOR':
        return `Doctor: ${value}`;
      case 'DATE':
        return `Date: ${value}`;
      case 'TIME':
        return `Time: ${value}`;
      case 'CONFIRMATION':
        return 'Appointment confirmed';
      default:
        return 'Confirmed';
    }
  }
}
