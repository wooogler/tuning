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
  timestamp: Date;
  accepted?: boolean;
  rejectionReason?: string;
  metadata?: {
    currentStep: AppointmentStep;
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

// Chat session state
export interface ChatSession {
  sessionId: string;
  agentType: AgentType;
  currentStep: AppointmentStep;
  conversationHistory: Message[];
  appointmentData: AppointmentData;
  createdAt: Date;
  lastActivity: Date;
}

// shadcn/ui component configuration for frontend
export interface StepOptions {
  // Component type (maps to shadcn/ui component names)
  component: 'Input' | 'Select' | 'ButtonGroup' | 'Calendar';

  // Input component props
  placeholder?: string;

  // Select/ButtonGroup component props
  options?: Array<{
    value: string;
    label: string;
  }>;

  // Calendar component props
  calendarProps?: {
    minDate?: string;              // ISO date string for disabled={(date) => date < minDate}
    disabledDaysOfWeek?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  };
}

// Agent processing result
export interface AgentResult {
  accepted: boolean;
  message: string;
  rejectionReason?: string;
  nextStep?: AppointmentStep;
  data?: Partial<AppointmentData>;
  options?: StepOptions; // GUI configuration for the next step
}
