import { useRef, useEffect } from 'react';
import type { AppointmentStep } from '../types';
import { useSessionStore } from '../store/useSessionStore';
import { renderInline, renderAgentContent } from '../utils/markdown';
import { GuiComponents } from './GuiComponents';
import { AppointmentDetailsCard } from './AppointmentDetailsCard';

interface MessageListProps {
  onGuiSelect: (step: AppointmentStep, value: string, label: string) => void;
}

export function MessageList({ onGuiSelect }: MessageListProps) {
  const { messages, isLoading, currentStep, stepOptions, appointmentData, resetSession } = useSessionStore();
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Determine if this is the last assistant message
  const getLastAssistantMessageIndex = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return i;
      }
    }
    return -1;
  };

  const lastAssistantIndex = getLastAssistantMessageIndex();

  // Helper: Get value from appointmentData for a given step
  const getValueForStep = (step: AppointmentStep): string | undefined => {
    switch (step) {
      case 'PATIENT_ID':
        return appointmentData.patientId;
      case 'VISIT_TYPE':
        return appointmentData.visitType;
      case 'DEPARTMENT':
        return appointmentData.department;
      case 'DOCTOR':
        return appointmentData.doctor;
      case 'DATE':
        return appointmentData.date;
      case 'TIME':
        return appointmentData.time;
      default:
        return undefined;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((msg, index) =>
        msg.role === 'user' ? (
          <div key={index} className="w-full">
            <div className="mx-auto max-w-3xl px-4 py-4 flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3">
                <div className="text-[15px] leading-7 text-gray-900 whitespace-pre-wrap">
                  {renderInline(msg.content)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div key={index} className="w-full">
            <div className="mx-auto max-w-3xl px-4 py-6 flex gap-4">
              <div className="mt-0.5 h-8 w-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm flex-none">
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">Agent</span>
                  {msg.accepted !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        msg.accepted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {msg.accepted ? 'Accepted' : 'Rejected'}
                    </span>
                  )}
                </div>
                {renderAgentContent(msg.content)}
                {msg.rejectionReason && (
                  <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="font-semibold">Reason:</span> {msg.rejectionReason}
                  </div>
                )}

                {/* Render appointment details card on CONFIRMATION step */}
                {msg.metadata?.currentStep === 'CONFIRMATION' && index === lastAssistantIndex && (
                  <AppointmentDetailsCard
                    appointmentData={appointmentData}
                    showStartButton={!stepOptions}
                    onReset={resetSession}
                  />
                )}

                {/* Render GUI component if this is the last assistant message with options */}
                {index === lastAssistantIndex && stepOptions && (
                  <GuiComponents
                    step={currentStep}
                    options={stepOptions}
                    selectedValue={getValueForStep(currentStep)}
                    isActive={true}
                    onSelect={onGuiSelect}
                  />
                )}
              </div>
            </div>
          </div>
        ),
      )}
      {isLoading && (
        <div className="w-full">
          <div className="mx-auto max-w-3xl px-4 py-6 flex gap-4">
            <div className="mt-0.5 h-8 w-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm flex-none">
              A
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-500 mb-2">Agent</div>
              <div className="text-[15px] leading-7 text-gray-600">Thinking...</div>
            </div>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
}
