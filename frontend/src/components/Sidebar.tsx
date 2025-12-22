import type { AppointmentData } from '../types';
import { useSessionStore } from '../store/useSessionStore';

// Map field names to human-readable labels
const FIELD_LABELS: Record<keyof AppointmentData, string> = {
  patientId: 'Patient ID',
  visitType: 'Visit Type',
  department: 'Department',
  doctor: 'Doctor',
  date: 'Date',
  time: 'Time',
};

// Map visit type values to labels
const VISIT_TYPE_LABELS: Record<string, string> = {
  new_visit: 'New Visit',
  follow_up: 'Follow-up',
  checkup: 'Checkup',
};

// Helper function to format value for display
const formatValue = (key: keyof AppointmentData, value: string): string => {
  if (key === 'visitType' && value in VISIT_TYPE_LABELS) {
    return VISIT_TYPE_LABELS[value];
  }
  return value;
};

export function Sidebar() {
  const { appointmentData } = useSessionStore();
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Collected Information
      </h3>
      {Object.keys(appointmentData).length > 0 ? (
        <ul className="space-y-3">
          {(Object.entries(appointmentData) as [keyof AppointmentData, string][]).map(([key, value]) => (
            <li key={key} className="border-b border-gray-200 pb-2">
              <span className="text-sm font-medium text-gray-600 block">
                {FIELD_LABELS[key]}
              </span>
              <span className="text-base text-gray-900">{formatValue(key, value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No information collected yet.</p>
      )}
    </div>
  );
}
