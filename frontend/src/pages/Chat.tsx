import { useMemo } from 'react';
import type { AppointmentStep } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { Sidebar } from '../components/Sidebar';

interface ChatProps {
  onSendMessage: (message: string) => void;
  onGuiSelect: (step: AppointmentStep, value: string, label: string) => void;
}

const STEP_LABELS: Record<AppointmentStep, string> = {
  PATIENT_ID: '1. Patient ID',
  VISIT_TYPE: '2. Visit Type',
  DEPARTMENT: '3. Department',
  DOCTOR: '4. Doctor',
  DATE: '5. Date',
  TIME: '6. Time',
  CONFIRMATION: '7. Confirmation',
};

export function Chat({ onSendMessage, onGuiSelect }: ChatProps) {
  const orderedSteps = useMemo(
    () => Object.keys(STEP_LABELS) as AppointmentStep[],
    [],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chat Area */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[calc(100vh-10rem)] border border-gray-200 overflow-hidden">
          <ProgressBar orderedSteps={orderedSteps} />
          <MessageList onGuiSelect={onGuiSelect} />

          {/* Chat input - always show text input */}
          <ChatInput onSendMessage={onSendMessage} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Sidebar />
      </div>
    </div>
  );
}
