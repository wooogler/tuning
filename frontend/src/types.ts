/**
 * Frontend types (copied from backend for now)
 * TODO: Move to shared package when types grow
 */

// Appointment booking steps
export type AppointmentStep =
  | 'PATIENT_ID'
  | 'VISIT_TYPE'
  | 'DEPARTMENT'
  | 'DOCTOR'
  | 'DATE'
  | 'TIME'
  | 'CONFIRMATION';

// Agent types for A/B testing (baseline vs adaptive)
export type AgentType = 'baseline' | 'adaptive';

// Conversation message (follows OpenAI Chat API format)
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // Date serialized as string from API
  accepted?: boolean;
  rejectionReason?: string;
  metadata?: {
    currentStep?: AppointmentStep;
    extractedData?: any;
  };
}

// Collected appointment data (accumulated step by step)
export interface AppointmentData {
  patientId?: string;
  visitType?: string;
  department?: string;
  doctor?: string;
  date?: string;
  time?: string;
}

// shadcn/ui component configuration (from backend)
export interface StepOptions {
  component: 'Input' | 'Select' | 'ButtonGroup' | 'Calendar';
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  calendarProps?: {
    minDate?: string;
    disabledDaysOfWeek?: number[];
  };
}

// API Response types

export interface SessionStartResponse {
  sessionId: string;
  agentType: AgentType;
  currentStep: AppointmentStep;
  message: string;
  options?: StepOptions;
}

export interface MessageResponse {
  accepted: boolean;
  message: string;
  rejectionReason?: string;
  currentStep: AppointmentStep;
  appointmentData: AppointmentData;
  conversationHistory: Message[];
  options?: StepOptions;
}
