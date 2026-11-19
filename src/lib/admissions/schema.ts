import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .refine((v) => v.replace(/\D/g, '').length >= 9, 'Enter a valid phone number')
  .refine((v) => v.length <= 40, 'Too long');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const thisYear = new Date().getFullYear();

/**
 * The application form. Used by the browser for instant feedback AND by the
 * server action before anything reaches the database (the database then
 * validates again — never trust the browser).
 */
export const applicationSchema = z.object({
  campusId: z.string().uuid('Choose a school'),
  gradeId: z.string().uuid('Choose the class your child is applying for'),
  intakeYear: z.coerce.number().int().min(thisYear).max(thisYear + 2),
  intakeTerm: z.coerce.number().int().min(1).max(3),

  studentFirstName: z.string().trim().min(1, 'Enter first name').max(80),
  studentMiddleName: optionalText(80),
  studentLastName: z.string().trim().min(1, 'Enter last name').max(80),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter the date of birth')
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const now = new Date();
      const youngest = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oldest = new Date(now.getFullYear() - 19, now.getMonth(), now.getDate());
      return d <= youngest && d >= oldest;
    }, 'Please check the date of birth'),
  gender: z.enum(['female', 'male'], { errorMap: () => ({ message: 'Choose gender' }) }),
  nationality: optionalText(80),
  birthCertNumber: optionalText(60),
  previousSchool: optionalText(160),
  previousGrade: optionalText(60),
  medicalNotes: optionalText(1000),
  specialNeeds: optionalText(1000),

  guardianName: z.string().trim().min(2, 'Enter the parent or guardian’s name').max(120),
  guardianRelationship: z.string().trim().min(2, 'Choose the relationship').max(60),
  guardianPhone: phone,
  guardianEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Enter a valid email address'),
  guardianOccupation: optionalText(120),
  guardianAddress: optionalText(300),

  guardian2Name: optionalText(120),
  guardian2Relationship: optionalText(60),
  guardian2Phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || v.replace(/\D/g, '').length >= 9, 'Enter a valid phone number'),

  howHeard: optionalText(160),
  wantsTransport: z.boolean(),
  consent: z.boolean().refine((v) => v === true, 'Please confirm the declaration'),

  /** Honeypot: real people never see or fill this, bots do. */
  website: z.string().max(0).optional(),
});

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationValues = z.output<typeof applicationSchema>;

/** camelCase form values -> the snake_case JSON the database function expects. */
export function toDatabasePayload(v: ApplicationValues) {
  return {
    campus_id: v.campusId,
    grade_id: v.gradeId,
    intake_year: v.intakeYear,
    intake_term: v.intakeTerm,
    student_first_name: v.studentFirstName,
    student_middle_name: v.studentMiddleName ?? '',
    student_last_name: v.studentLastName,
    date_of_birth: v.dateOfBirth,
    gender: v.gender,
    nationality: v.nationality ?? '',
    birth_cert_number: v.birthCertNumber ?? '',
    previous_school: v.previousSchool ?? '',
    previous_grade: v.previousGrade ?? '',
    medical_notes: v.medicalNotes ?? '',
    special_needs: v.specialNeeds ?? '',
    guardian_name: v.guardianName,
    guardian_relationship: v.guardianRelationship,
    guardian_phone: v.guardianPhone,
    guardian_email: v.guardianEmail ?? '',
    guardian_occupation: v.guardianOccupation ?? '',
    guardian_address: v.guardianAddress ?? '',
    guardian2_name: v.guardian2Name ?? '',
    guardian2_relationship: v.guardian2Relationship ?? '',
    guardian2_phone: v.guardian2Phone ?? '',
    how_heard: v.howHeard ?? '',
    wants_transport: v.wantsTransport,
    consent_given: v.consent,
  };
}
