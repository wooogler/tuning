import type { AppointmentData } from '../types';
import { Button } from './ui/button';

interface AppointmentDetailsCardProps {
  appointmentData: AppointmentData;
  showStartButton: boolean;
  onReset: () => void;
}

export function AppointmentDetailsCard({
  appointmentData,
  showStartButton,
  onReset,
}: AppointmentDetailsCardProps) {
  return (
    <>
      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 max-w-md">
        <h4 className="text-sm font-semibold mb-3 text-gray-900">Appointment Details</h4>
        <ul className="space-y-2">
          {appointmentData.patientId && (
            <li className="text-sm">
              <span className="text-gray-600">Patient ID: </span>
              <span className="font-medium text-gray-900">{appointmentData.patientId}</span>
            </li>
          )}
          {appointmentData.visitType && (
            <li className="text-sm">
              <span className="text-gray-600">Visit Type: </span>
              <span className="font-medium text-gray-900">
                {appointmentData.visitType === 'new_visit'
                  ? 'New Visit'
                  : appointmentData.visitType === 'follow_up'
                    ? 'Follow-up'
                    : appointmentData.visitType === 'checkup'
                      ? 'Checkup'
                      : appointmentData.visitType}
              </span>
            </li>
          )}
          {appointmentData.department && (
            <li className="text-sm">
              <span className="text-gray-600">Department: </span>
              <span className="font-medium text-gray-900">{appointmentData.department}</span>
            </li>
          )}
          {appointmentData.doctor && (
            <li className="text-sm">
              <span className="text-gray-600">Doctor: </span>
              <span className="font-medium text-gray-900">{appointmentData.doctor}</span>
            </li>
          )}
          {appointmentData.date && (
            <li className="text-sm">
              <span className="text-gray-600">Date: </span>
              <span className="font-medium text-gray-900">{appointmentData.date}</span>
            </li>
          )}
          {appointmentData.time && (
            <li className="text-sm">
              <span className="text-gray-600">Time: </span>
              <span className="font-medium text-gray-900">{appointmentData.time}</span>
            </li>
          )}
        </ul>
      </div>

      {showStartButton && (
        <div className="mt-3">
          <Button onClick={onReset} className="bg-emerald-600 hover:bg-emerald-700">
            Start New Booking
          </Button>
        </div>
      )}
    </>
  );
}
