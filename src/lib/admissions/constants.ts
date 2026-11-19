import type { ApplicationStatus, GradeStage } from '@/lib/supabase/types';

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'New',
  under_review: 'Under review',
  assessment: 'Assessment / interview',
  offered: 'Place offered',
  accepted: 'Offer accepted',
  enrolled: 'Enrolled',
  waitlisted: 'Waitlisted',
  declined: 'Not offered',
  withdrawn: 'Withdrawn',
};

/** Plain-English message shown to the family on the status page. */
export const STATUS_FAMILY_MESSAGE: Record<ApplicationStatus, string> = {
  submitted: 'We have received your application. The admissions office will review it shortly.',
  under_review: 'Your application is being reviewed by the admissions office.',
  assessment: 'Your child has been invited for an assessment or interview. Please see the details below.',
  offered: 'Congratulations! Your child has been offered a place. Please contact the school office to accept it.',
  accepted: 'Thank you for accepting the place. The school will complete your child’s enrolment.',
  enrolled: 'Your child is enrolled. Welcome to the school family!',
  waitlisted: 'Your child is on our waiting list. We will contact you as soon as a place is available.',
  declined: 'We are sorry — we are unable to offer a place at this time. Please contact the school office if you have questions.',
  withdrawn: 'This application has been withdrawn.',
};

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  assessment: 'bg-purple-100 text-purple-800',
  offered: 'bg-emerald-100 text-emerald-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  enrolled: 'bg-green-200 text-green-900',
  waitlisted: 'bg-orange-100 text-orange-800',
  declined: 'bg-red-100 text-red-800',
  withdrawn: 'bg-slate-200 text-slate-700',
};

export const ALL_STATUSES = Object.keys(STATUS_LABEL) as ApplicationStatus[];

/** Which statuses staff may move an application to, from each status. Enrolment is a separate action. */
export const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['under_review', 'assessment', 'waitlisted', 'declined'],
  under_review: ['assessment', 'offered', 'waitlisted', 'declined'],
  assessment: ['offered', 'waitlisted', 'declined'],
  offered: ['accepted', 'declined', 'withdrawn'],
  accepted: ['withdrawn'],
  waitlisted: ['under_review', 'offered', 'declined'],
  declined: ['under_review'],
  withdrawn: ['under_review'],
  enrolled: [],
};

export const CAN_ENROL: ApplicationStatus[] = ['offered', 'accepted'];

export const STAGE_LABEL: Record<GradeStage, string> = {
  pre_primary: 'Pre-school',
  lower_primary: 'Lower primary (Grades 1–3)',
  upper_primary: 'Upper primary (Grades 4–6)',
  junior_school: 'Junior school (Grades 7–9)',
};

export const STAGE_ORDER: GradeStage[] = ['pre_primary', 'lower_primary', 'upper_primary', 'junior_school'];

export const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Aunt / Uncle', 'Sibling', 'Other'];

export const HOW_HEARD = [
  'Friend or family',
  'Current parent',
  'Social media',
  'Google / internet search',
  'Church or community',
  'Flyer or poster',
  'Other',
];

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}
