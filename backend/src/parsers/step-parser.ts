import { zodTextFormat } from 'openai/helpers/zod';
import { openai } from './openai-client.js';
import { StepParseResultSchema, type StepParseResult } from './schemas.js';
import { db } from '../db/index.js';
import { doctors } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const MODEL = 'gpt-4o-mini';

type AppointmentStep =
  | 'PATIENT_ID'
  | 'VISIT_TYPE'
  | 'DEPARTMENT'
  | 'DOCTOR'
  | 'DATE'
  | 'TIME'
  | 'CONFIRMATION';

const STEP_PROMPTS: Record<AppointmentStep, string> = {
  PATIENT_ID: `Extract the PATIENT NUMBER from user input.
- Format: P followed by 3 digits (e.g., P001, P002, P003, P004, P005)
- If user provides only a number (e.g., "1", "2", "123"), format it as P + 3-digit number with leading zeros
- Examples:
  * "My patient ID is P001" → "P001"
  * "1" → "P001"
  * "5" → "P005"
  * "123" → "P123"
  * "P002" → "P002"`,

  VISIT_TYPE: `Extract the VISIT TYPE from user input.
- Must be one of: new_visit, follow_up, checkup
- new_visit: First time, new patient, haven't seen this doctor
- follow_up: Continuing treatment, seen doctor before, return visit
- checkup: Routine exam, physical, annual checkup
- Examples: "I need a follow-up", "new patient visit", "annual checkup"`,

  DEPARTMENT: `Extract the DEPARTMENT from user input.
- Common departments: Cardiology, Orthopedics, Dermatology, Neurology, Pediatrics
- Accept both full names and abbreviations (e.g., "Cardio" → Cardiology)
- Examples: "I need Cardiology", "heart doctor" → Cardiology, "skin" → Dermatology`,

  DOCTOR: `Extract the DOCTOR NAME from user input.
- Full names like "Dr. Sarah Johnson", "Dr. Michael Chen"
- Accept partial names if clear: "Dr. Johnson", "Sarah Johnson"
- Examples: "I want to see Dr. Sarah Johnson", "Dr. Chen please"`,

  DATE: `Extract the APPOINTMENT DATE from user input.
- Accept various formats: "January 6th", "Jan 6", "next Monday", "01/06/2025"
- Convert relative dates: "tomorrow", "next week", "Monday"
- Return in YYYY-MM-DD format if possible
- Examples: "January 6th 2025", "next Monday", "tomorrow"`,

  TIME: `Extract the APPOINTMENT TIME from user input.
- Accept various formats: "2PM", "14:00", "2:00 PM", "afternoon"
- Convert to 24-hour format if possible (HH:MM)
- Examples: "2PM" → "14:00", "3:30 in the afternoon" → "15:30"`,

  CONFIRMATION: `This is the CONFIRMATION step. The user must confirm with "yes" or decline with "no".

**YOUR TASK**: Determine if the user confirmed (positive response) or not.

**CRITICAL RULES**:
1. Look ONLY at the user's CURRENT message to detect confirmation intent
2. Set ALL extractedData fields to NULL EXCEPT userConfirmed (patientNumber: null, visitType: null, department: null, doctor: null, date: null, time: null)
3. Set userConfirmed to TRUE if user gave positive confirmation (yes, confirm, okay, sure, good, sounds good, etc.)
4. Set userConfirmed to FALSE if user declined or said no
5. Set userConfirmed to NULL if ambiguous or unclear
6. Set containsOtherStepInfo to FALSE (always)

**This is a baseline agent - users can ONLY confirm or decline. No changes allowed.**

**Examples**:
  * User says "yes" → userConfirmed: true, all other fields NULL, containsOtherStepInfo: FALSE
  * User says "Yes, confirm" → userConfirmed: true, all other fields NULL, containsOtherStepInfo: FALSE
  * User says "confirm" → userConfirmed: true, all other fields NULL, containsOtherStepInfo: FALSE
  * User says "okay" → userConfirmed: true, all other fields NULL, containsOtherStepInfo: FALSE
  * User says "sounds good" → userConfirmed: true, all other fields NULL, containsOtherStepInfo: FALSE
  * User says "no" → userConfirmed: false, all other fields NULL, containsOtherStepInfo: FALSE
  * User says anything unclear → userConfirmed: null, all other fields NULL, containsOtherStepInfo: FALSE

**ALWAYS return**: All extractedData fields as NULL except userConfirmed, containsOtherStepInfo as FALSE.`,
};

/**
 * Generic parser for any appointment booking step
 * Extracts all possible appointment data and detects out-of-step information
 */
export async function parseStep(
  currentStep: AppointmentStep,
  userMessage: string,
  conversationHistory: any[],
  sessionData?: { department?: string; visitType?: string; doctor?: string; date?: string }
): Promise<StepParseResult> {
  // Query available options for steps that need them
  let availableOptionsText = '';

  if (currentStep === 'DEPARTMENT') {
    const departments = await db.query.departments.findMany();
    const deptNames = departments.map(d => d.name).join(', ');
    availableOptionsText = `\n\n**IMPORTANT - Available Departments**: ${deptNames}\n- If the user input is a typo or abbreviation, correct it to match one of these exact names.\n- Example: "Cardio" → "Cardiology", "Neuro" → "Neurology"`;
  }

  if (currentStep === 'DOCTOR') {
    // Query doctors filtered by department and visit type from session
    if (sessionData?.department) {
      // Find department
      const allDepartments = await db.query.departments.findMany();
      const department = allDepartments.find(
        (dept) =>
          dept.name.toLowerCase() === sessionData.department?.toLowerCase() ||
          dept.code.toLowerCase() === sessionData.department?.toLowerCase()
      );

      if (department) {
        // Find all doctors in this department
        const allDoctors = await db.query.doctors.findMany({
          where: eq(doctors.departmentId, department.id),
        });

        // Filter by visit type if available
        let eligibleDoctors = allDoctors;
        if (sessionData.visitType) {
          const visitType = sessionData.visitType as 'new_visit' | 'follow_up' | 'checkup';
          eligibleDoctors = allDoctors.filter((doc) => {
            if (visitType === 'new_visit') return doc.acceptsNewPatients;
            if (visitType === 'follow_up') return doc.acceptsFollowUp;
            if (visitType === 'checkup') return doc.acceptsCheckup;
            return false;
          });
        }

        if (eligibleDoctors.length > 0) {
          const doctorNames = eligibleDoctors.map(d => d.name).join(', ');
          availableOptionsText = `\n\n**IMPORTANT - Available Doctors**: ${doctorNames}\n- If the user input is a typo or partial name, correct it to match one of these exact names.\n- Example: "Dr. Jon" → "Dr. Sarah Johnson", "Chen" → "Dr. Michael Chen"`;
        }
      }
    }
  }

  const systemPrompt = `You are parsing user input for the ${currentStep} step of a hospital appointment booking system.

**Current Step**: ${currentStep}
${STEP_PROMPTS[currentStep]}${availableOptionsText}

**Your Task**:
1. Extract ALL appointment-related information from the user's message
2. Determine if the user mentioned information for OTHER steps (not ${currentStep})
3. Provide a confidence score (0-1) for your extraction

**Important**:
- Extract data for ALL fields in extractedData, even if they're for other steps
- Set containsOtherStepInfo to TRUE if ANY data for steps other than ${currentStep} is present
- If a field is not mentioned, set it to null
- Be flexible with variations (e.g., "Cardio" → "Cardiology", "2PM" → "14:00")
- **If available options are provided above, the extracted value MUST match one of them exactly**

Return structured JSON following the schema.`;

  // Clean conversation history - OpenAI API only accepts role and content
  const cleanedHistory = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...cleanedHistory,
    { role: 'user', content: userMessage },
  ];

  console.log(`🤖 Parsing ${currentStep}:`, userMessage);

  try {
    const response = await openai.responses.parse({
      model: MODEL,
      input: messages,
      text: {
        format: zodTextFormat(StepParseResultSchema, 'appointment_data_extraction'),
      },
    });

    const parsed = response.output_parsed;
    console.log(`✅ Parsed result:`, JSON.stringify(parsed, null, 2));
    console.log(`   extractedData:`, JSON.stringify(parsed?.extractedData, null, 2));

    if (!parsed) {
      throw new Error('OpenAI returned null parsed result');
    }

    return parsed;
  } catch (error) {
    console.error(`❌ Parsing error for ${currentStep}:`, error);
    throw error;
  }
}
