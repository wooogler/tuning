import type { AppointmentStep } from '../types';
import { useSessionStore } from '../store/useSessionStore';

const STEP_LABELS: Record<AppointmentStep, string> = {
  PATIENT_ID: '1. Patient ID',
  VISIT_TYPE: '2. Visit Type',
  DEPARTMENT: '3. Department',
  DOCTOR: '4. Doctor',
  DATE: '5. Date',
  TIME: '6. Time',
  CONFIRMATION: '7. Confirmation',
};

interface ProgressBarProps {
  orderedSteps: AppointmentStep[];
}

export function ProgressBar({ orderedSteps }: ProgressBarProps) {
  const { currentStep, appointmentData } = useSessionStore();
  // Helper function to map step to appointmentData field
  const getStepValue = (step: AppointmentStep): string | undefined => {
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
      case 'CONFIRMATION':
        return undefined; // Confirmation doesn't have a specific field
      default:
        return undefined;
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Booking Progress</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {orderedSteps.map((step) => {
          const isCompleted = !!getStepValue(step);
          return (
            <div
              key={step}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                step === currentStep
                  ? 'bg-gray-900 text-white border-gray-900'
                  : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {STEP_LABELS[step]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
