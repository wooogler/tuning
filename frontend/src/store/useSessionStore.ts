import { create } from 'zustand';
import type { AgentType, AppointmentStep, Message, AppointmentData, StepOptions } from '../types';

interface SessionState {
  // Session data
  sessionId: string | null;
  agentType: AgentType;
  currentStep: AppointmentStep;
  messages: Message[];
  appointmentData: AppointmentData;
  stepOptions: StepOptions | null;
  isLoading: boolean;

  // Actions
  setSessionId: (sessionId: string | null) => void;
  setAgentType: (agentType: AgentType) => void;
  setCurrentStep: (step: AppointmentStep) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setAppointmentData: (data: AppointmentData) => void;
  setStepOptions: (options: StepOptions | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  resetSession: () => void;
}

const initialState = {
  sessionId: null,
  agentType: 'baseline' as AgentType,
  currentStep: 'PATIENT_ID' as AppointmentStep,
  messages: [],
  appointmentData: {},
  stepOptions: null,
  isLoading: false,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSessionId: (sessionId) => set({ sessionId }),
  setAgentType: (agentType) => set({ agentType }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setMessages: (messages) =>
    set((state) => ({
      messages: typeof messages === 'function' ? messages(state.messages) : messages,
    })),
  setAppointmentData: (appointmentData) => set({ appointmentData }),
  setStepOptions: (stepOptions) => set({ stepOptions }),
  setIsLoading: (isLoading) => set({ isLoading }),
  resetSession: () =>
    set({
      sessionId: null,
      messages: [],
      appointmentData: {},
      currentStep: 'PATIENT_ID',
      stepOptions: null,
    }),
}));
