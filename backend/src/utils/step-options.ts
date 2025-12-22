import type { AppointmentStep, StepOptions, AppointmentData } from '../types/index.js';
import { db } from '../db/index.js';
import { doctors, schedules } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Get GUI configuration (shadcn/ui component props) for each step
 * This determines which component to render and its props on the frontend
 */
export async function getStepOptions(
  step: AppointmentStep,
  appointmentData: AppointmentData
): Promise<StepOptions> {
  switch (step) {
    case 'PATIENT_ID':
      return {
        component: 'Input',
        placeholder: 'PXXX (ex: P001, P002)',
      };

    case 'VISIT_TYPE':
      return {
        component: 'ButtonGroup',
        options: [
          { value: 'new_visit', label: 'New Visit' },
          { value: 'follow_up', label: 'Follow-up' },
          { value: 'checkup', label: 'Checkup' },
        ],
      };

    case 'DEPARTMENT':
      {
        // Query all departments from DB
        const departments = await db.query.departments.findMany();
        return {
          component: 'Select',
          options: departments.map((dept) => ({
            value: dept.name,
            label: dept.name,
          })),
        };
      }

    case 'DOCTOR':
      {
        // Query doctors filtered by department and visit type
        if (!appointmentData?.department) {
          return { component: 'Input', placeholder: 'Doctor name' };
        }

        const allDepartments = await db.query.departments.findMany();
        const department = allDepartments.find(
          (dept) =>
            dept.name.toLowerCase() === appointmentData.department?.toLowerCase() ||
            dept.code.toLowerCase() === appointmentData.department?.toLowerCase()
        );

        if (!department) {
          return { component: 'Input', placeholder: 'Doctor name' };
        }

        let eligibleDoctors = await db.query.doctors.findMany({
          where: eq(doctors.departmentId, department.id),
        });

        // Filter by visit type if available
        if (appointmentData.visitType) {
          const visitType = appointmentData.visitType as 'new_visit' | 'follow_up' | 'checkup';
          eligibleDoctors = eligibleDoctors.filter((doc) => {
            if (visitType === 'new_visit') return doc.acceptsNewPatients;
            if (visitType === 'follow_up') return doc.acceptsFollowUp;
            if (visitType === 'checkup') return doc.acceptsCheckup;
            return false;
          });
        }

        return {
          component: 'Select',
          options: eligibleDoctors.map((doc) => ({
            value: doc.name,
            label: doc.name,
          })),
        };
      }

    case 'DATE':
      {
        // Get doctor's available days of week
        if (!appointmentData?.doctor) {
          return {
            component: 'Calendar',
            calendarProps: {
              minDate: new Date().toISOString().split('T')[0], // Today
            },
          };
        }

        const allDoctors = await db.query.doctors.findMany();
        const doctor = allDoctors.find(
          (doc) => doc.name.toLowerCase() === appointmentData.doctor?.toLowerCase()
        );

        if (!doctor) {
          return {
            component: 'Calendar',
            calendarProps: {
              minDate: new Date().toISOString().split('T')[0],
            },
          };
        }

        // Get doctor's schedule to determine available days
        const doctorSchedules = await db.query.schedules.findMany({
          where: eq(schedules.doctorId, doctor.id),
        });

        const availableDays = doctorSchedules
          .filter((s) => s.isAvailable)
          .map((s) => s.dayOfWeek);

        // Convert to disabled days (inverse)
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        const disabledDays = allDays.filter((day) => !availableDays.includes(day));

        return {
          component: 'Calendar',
          calendarProps: {
            minDate: new Date().toISOString().split('T')[0],
            disabledDaysOfWeek: disabledDays,
          },
        };
      }

    case 'TIME':
      {
        // Get available time slots for the selected doctor and date
        if (!appointmentData?.doctor || !appointmentData?.date) {
          return { component: 'Input', placeholder: 'HH:MM (e.g., 14:00)' };
        }

        const allDoctors = await db.query.doctors.findMany();
        const doctor = allDoctors.find(
          (doc) => doc.name.toLowerCase() === appointmentData.doctor?.toLowerCase()
        );

        if (!doctor) {
          return { component: 'Input', placeholder: 'HH:MM (e.g., 14:00)' };
        }

        // Parse date string (YYYY-MM-DD) to get day of week
        // Split the date string to avoid timezone issues
        const [year, month, day] = appointmentData.date.split('-').map(Number);
        const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
        const dayOfWeek = appointmentDate.getDay();

        const doctorSchedules = await db.query.schedules.findMany({
          where: and(
            eq(schedules.doctorId, doctor.id),
            eq(schedules.dayOfWeek, dayOfWeek),
            eq(schedules.isAvailable, true)
          ),
        });

        const timeSlots = doctorSchedules.map((s) => s.timeSlot);

        if (timeSlots.length === 0) {
          return { component: 'Input', placeholder: 'No available slots' };
        }

        return {
          component: 'ButtonGroup',
          options: timeSlots.map((time) => ({
            value: time,
            label: time,
          })),
        };
      }

    case 'CONFIRMATION':
      return {
        component: 'ButtonGroup',
        options: [
          { value: 'yes', label: 'Yes, confirm' },
          { value: 'no', label: 'No, cancel' },
        ],
      };

    default:
      return { component: 'Input', placeholder: '' };
  }
}
