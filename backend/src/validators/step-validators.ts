import type { StepParseResult } from '../parsers/schemas.js';
import { db } from '../db/index.js';
import { patients, doctors, schedules, appointments } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

type AppointmentStep =
  | 'PATIENT_ID'
  | 'VISIT_TYPE'
  | 'DEPARTMENT'
  | 'DOCTOR'
  | 'DATE'
  | 'TIME'
  | 'CONFIRMATION';

type VisitType = 'new_visit' | 'follow_up' | 'checkup';

interface ValidationResult {
  valid: boolean;
  value: any;
  error?: string;
}

/**
 * Validate patient ID format and existence in database
 */
export async function validatePatientId(
  parseResult: StepParseResult
): Promise<ValidationResult> {
  const patientNumber = parseResult.extractedData.patientNumber;

  if (!patientNumber) {
    return {
      valid: false,
      value: null,
      error: 'No patient ID provided',
    };
  }

  // Format validation: P followed by 3-4 digits
  if (!/^P\d{3,4}$/i.test(patientNumber)) {
    return {
      valid: false,
      value: null,
      error: `Invalid patient ID format. Expected format: P001, P002, etc.`,
    };
  }

  // Database validation
  const normalizedId = patientNumber.toUpperCase();
  const patient = await db.query.patients.findFirst({
    where: eq(patients.patientNumber, normalizedId),
  });

  if (!patient) {
    return {
      valid: false,
      value: null,
      error: `Patient ID ${normalizedId} not found in our system`,
    };
  }

  return {
    valid: true,
    value: normalizedId,
  };
}

/**
 * Validate visit type
 */
export async function validateVisitType(
  parseResult: StepParseResult
): Promise<ValidationResult> {
  const visitType = parseResult.extractedData.visitType;

  if (!visitType) {
    return {
      valid: false,
      value: null,
      error: 'No visit type provided',
    };
  }

  // Already validated by Zod enum in schema
  const validTypes: VisitType[] = ['new_visit', 'follow_up', 'checkup'];
  if (!validTypes.includes(visitType)) {
    return {
      valid: false,
      value: null,
      error: `Invalid visit type. Must be one of: new_visit, follow_up, checkup`,
    };
  }

  return {
    valid: true,
    value: visitType,
  };
}

/**
 * Validate department and check if it exists in database
 */
export async function validateDepartment(
  parseResult: StepParseResult
): Promise<ValidationResult> {
  const departmentInput = parseResult.extractedData.department;

  if (!departmentInput) {
    return {
      valid: false,
      value: null,
      error: 'No department provided',
    };
  }

  // Database validation - find by name or code
  const allDepartments = await db.query.departments.findMany();

  const department = allDepartments.find(
    (dept) =>
      dept.name.toLowerCase() === departmentInput.toLowerCase() ||
      dept.code.toLowerCase() === departmentInput.toLowerCase()
  );

  if (!department) {
    const availableDepts = allDepartments.map((d) => d.name).join(', ');
    return {
      valid: false,
      value: null,
      error: `Department "${departmentInput}" not found. Available departments: ${availableDepts}`,
    };
  }

  return {
    valid: true,
    value: department.name,
  };
}

/**
 * Main validation dispatcher
 * Routes to appropriate validator based on current step
 */
/**
 * Validate doctor selection based on department and visit type
 * Requires: department, visitType from previous steps
 */
export async function validateDoctor(
  parseResult: StepParseResult,
  sessionData: { department?: string; visitType?: string }
): Promise<ValidationResult> {
  const doctorInput = parseResult.extractedData.doctor;

  if (!doctorInput) {
    return {
      valid: false,
      value: null,
      error: 'No doctor name provided',
    };
  }

  // Require previous step data
  if (!sessionData.department) {
    return {
      valid: false,
      value: null,
      error: 'Department information is missing. Please restart the booking process.',
    };
  }

  if (!sessionData.visitType) {
    return {
      valid: false,
      value: null,
      error: 'Visit type information is missing. Please restart the booking process.',
    };
  }

  // Find department
  const allDepartments = await db.query.departments.findMany();
  const department = allDepartments.find(
    (dept) =>
      dept.name.toLowerCase() === sessionData.department?.toLowerCase() ||
      dept.code.toLowerCase() === sessionData.department?.toLowerCase()
  );

  if (!department) {
    return {
      valid: false,
      value: null,
      error: `Department "${sessionData.department}" not found in our system`,
    };
  }

  // Find all doctors in this department
  const allDoctors = await db.query.doctors.findMany({
    where: eq(doctors.departmentId, department.id),
    with: {
      department: true,
    },
  });

  // Filter by visit type
  const visitType = sessionData.visitType as 'new_visit' | 'follow_up' | 'checkup';
  const eligibleDoctors = allDoctors.filter((doc) => {
    if (visitType === 'new_visit') return doc.acceptsNewPatients;
    if (visitType === 'follow_up') return doc.acceptsFollowUp;
    if (visitType === 'checkup') return doc.acceptsCheckup;
    return false;
  });

  if (eligibleDoctors.length === 0) {
    return {
      valid: false,
      value: null,
      error: `No doctors in ${department.name} accept ${visitType.replace('_', ' ')} appointments`,
    };
  }

  // Match doctor by name (fuzzy matching)
  const matchedDoctor = eligibleDoctors.find((doc) =>
    doc.name.toLowerCase().includes(doctorInput.toLowerCase()) ||
    doctorInput.toLowerCase().includes(doc.name.toLowerCase())
  );

  if (!matchedDoctor) {
    const availableDoctors = eligibleDoctors.map((d) => d.name).join(', ');
    return {
      valid: false,
      value: null,
      error: `Doctor "${doctorInput}" not found. Available doctors in ${department.name} for ${visitType.replace('_', ' ')}: ${availableDoctors}`,
    };
  }

  return {
    valid: true,
    value: matchedDoctor.name,
  };
}

/**
 * Validate appointment date
 * Requires: doctor from previous step
 * Checks: Future date, doctor availability on that day of week
 */
export async function validateDate(
  parseResult: StepParseResult,
  sessionData: { doctor?: string }
): Promise<ValidationResult> {
  const dateInput = parseResult.extractedData.date;

  if (!dateInput) {
    return {
      valid: false,
      value: null,
      error: 'No date provided',
    };
  }

  // Require previous step data
  if (!sessionData.doctor) {
    return {
      valid: false,
      value: null,
      error: 'Doctor information is missing. Please restart the booking process.',
    };
  }

  // Parse date (expecting YYYY-MM-DD format from OpenAI)
  let appointmentDate: Date;
  try {
    // Parse date in local timezone to avoid day offset issues
    const [year, month, day] = dateInput.split('-').map(Number);
    appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
    if (isNaN(appointmentDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch {
    return {
      valid: false,
      value: null,
      error: `Invalid date format: "${dateInput}". Expected format: YYYY-MM-DD`,
    };
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);

  if (appointmentDate < today) {
    return {
      valid: false,
      value: null,
      error: 'Appointment date must be in the future',
    };
  }

  // Find doctor
  const allDoctors = await db.query.doctors.findMany();
  const doctor = allDoctors.find(
    (doc) => doc.name.toLowerCase() === sessionData.doctor?.toLowerCase()
  );

  if (!doctor) {
    return {
      valid: false,
      value: null,
      error: `Doctor "${sessionData.doctor}" not found in our system`,
    };
  }

  // Check if doctor is available on this day of week
  const dayOfWeek = appointmentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const doctorSchedules = await db.query.schedules.findMany({
    where: eq(schedules.doctorId, doctor.id),
  });

  const availableOnDay = doctorSchedules.some(
    (schedule) => schedule.dayOfWeek === dayOfWeek && schedule.isAvailable
  );

  if (!availableOnDay) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const availableDays = doctorSchedules
      .filter((s) => s.isAvailable)
      .map((s) => daysOfWeek[s.dayOfWeek])
      .filter((day, index, self) => self.indexOf(day) === index)
      .join(', ');

    return {
      valid: false,
      value: null,
      error: `${sessionData.doctor} is not available on ${daysOfWeek[dayOfWeek]}s. Available days: ${availableDays}`,
    };
  }

  // Return in YYYY-MM-DD format
  const year = appointmentDate.getFullYear();
  const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
  const day = String(appointmentDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  return {
    valid: true,
    value: formattedDate,
  };
}

/**
 * Validate appointment time
 * Requires: doctor, date from previous steps
 * Checks: Time slot exists in doctor's schedule, no conflicting appointments
 */
export async function validateTime(
  parseResult: StepParseResult,
  sessionData: { doctor?: string; date?: string }
): Promise<ValidationResult> {
  const timeInput = parseResult.extractedData.time;

  if (!timeInput) {
    return {
      valid: false,
      value: null,
      error: 'No time provided',
    };
  }

  // Require previous step data
  if (!sessionData.doctor) {
    return {
      valid: false,
      value: null,
      error: 'Doctor information is missing. Please restart the booking process.',
    };
  }

  if (!sessionData.date) {
    return {
      valid: false,
      value: null,
      error: 'Date information is missing. Please restart the booking process.',
    };
  }

  // Parse time (expecting HH:MM format from OpenAI)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(timeInput)) {
    return {
      valid: false,
      value: null,
      error: `Invalid time format: "${timeInput}". Expected format: HH:MM (e.g., 14:00)`,
    };
  }

  // Normalize to HH:MM format
  const [hours, minutes] = timeInput.split(':');
  const formattedTime = `${hours.padStart(2, '0')}:${minutes}`;

  // Find doctor
  const allDoctors = await db.query.doctors.findMany();
  const doctor = allDoctors.find(
    (doc) => doc.name.toLowerCase() === sessionData.doctor?.toLowerCase()
  );

  if (!doctor) {
    return {
      valid: false,
      value: null,
      error: `Doctor "${sessionData.doctor}" not found in our system`,
    };
  }

  // Parse date to get day of week (in local timezone)
  const [year, month, day] = sessionData.date.split('-').map(Number);
  const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
  const dayOfWeek = appointmentDate.getDay();

  // Check if time slot exists in doctor's schedule for this day
  const doctorSchedules = await db.query.schedules.findMany({
    where: and(
      eq(schedules.doctorId, doctor.id),
      eq(schedules.dayOfWeek, dayOfWeek),
      eq(schedules.isAvailable, true)
    ),
  });

  const matchingSchedule = doctorSchedules.find(
    (schedule) => schedule.timeSlot === formattedTime
  );

  if (!matchingSchedule) {
    const availableTimes = doctorSchedules.map((s) => s.timeSlot).join(', ');
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      valid: false,
      value: null,
      error: availableTimes
        ? `${sessionData.doctor} is not available at ${formattedTime} on ${daysOfWeek[dayOfWeek]}s. Available times: ${availableTimes}`
        : `${sessionData.doctor} has no available time slots on ${daysOfWeek[dayOfWeek]}s`,
    };
  }

  // Check for conflicting appointments
  const existingAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctor.id),
      eq(appointments.appointmentDate, sessionData.date),
      eq(appointments.appointmentTime, formattedTime),
      eq(appointments.status, 'confirmed')
    ),
  });

  if (existingAppointments.length > 0) {
    return {
      valid: false,
      value: null,
      error: `${sessionData.doctor} already has an appointment at ${formattedTime} on ${sessionData.date}. Please choose a different time.`,
    };
  }

  return {
    valid: true,
    value: formattedTime,
  };
}

/**
 * Validate confirmation step
 * Baseline agent: Only accepts "yes" confirmations, no changes allowed
 * User must go through entire flow again to make changes
 */
export async function validateConfirmation(
  parseResult: StepParseResult
): Promise<ValidationResult> {
  // Check the userConfirmed field set by OpenAI parser
  const userConfirmed = parseResult.extractedData.userConfirmed;

  console.log('🔍 CONFIRMATION validation - userConfirmed:', userConfirmed);

  if (userConfirmed === true) {
    // User confirmed the appointment
    console.log('✅ User confirmed appointment');
    return {
      valid: true,
      value: true, // Confirmed
    };
  }

  if (userConfirmed === false) {
    // User explicitly declined
    console.log('❌ User declined appointment');
    return {
      valid: false,
      value: null,
      error: 'Appointment booking cancelled. You can start a new booking by clicking the Reset button.',
    };
  }

  // userConfirmed is null - ambiguous or unclear input
  console.log('⚠️  Unclear confirmation response');
  return {
    valid: false,
    value: null,
    error: 'Please confirm your appointment with "yes" or decline with "no".',
  };
}

export async function validateCurrentStep(
  step: AppointmentStep,
  parseResult: StepParseResult,
  sessionData?: { department?: string; visitType?: string; doctor?: string; date?: string }
): Promise<ValidationResult> {
  switch (step) {
    case 'PATIENT_ID':
      return validatePatientId(parseResult);

    case 'VISIT_TYPE':
      return validateVisitType(parseResult);

    case 'DEPARTMENT':
      return validateDepartment(parseResult);

    case 'DOCTOR':
      return validateDoctor(parseResult, sessionData || {});

    case 'DATE':
      return validateDate(parseResult, sessionData || {});

    case 'TIME':
      return validateTime(parseResult, sessionData || {});

    case 'CONFIRMATION':
      return validateConfirmation(parseResult);

    default:
      return { valid: false, value: null, error: 'Unknown step' };
  }
}
