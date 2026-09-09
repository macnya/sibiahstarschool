'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// --- scholarship request (parent/guardian) -----------------------------

const scholarshipSchema = z.object({
  parentName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(200),
  studentName: z.string().trim().min(2).max(120),
  studentLevel: z.string().trim().min(1).max(80),
  reason: z.string().trim().min(20).max(1000),
});

export type ScholarshipResult = { ok: boolean; error?: string };

/**
 * Stores a scholarship application. Inserts run as the anonymous role,
 * which the "anyone can request a scholarship" RLS policy allows for
 * INSERT only — a parent can submit but cannot read other applications.
 */
export async function submitScholarshipRequest(
  input: unknown
): Promise<ScholarshipResult> {
  const parsed = scholarshipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }

  const { parentName, phone, email, studentName, studentLevel, reason } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from('scholarship_requests').insert({
    parent_name: parentName,
    phone,
    email,
    student_name: studentName,
    student_level: studentLevel,
    reason,
  });

  if (error) {
    console.error('submitScholarshipRequest:', error.message);
    return { ok: false, error: 'Could not submit your application. Please try again.' };
  }

  return { ok: true };
}

// --- sponsor request (investor/sponsor) ---------------------------------

const sponsorSchema = z.object({
  sponsorName: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(160).optional(),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(1000).optional(),
});

export type SponsorResult = { ok: boolean; error?: string };

/**
 * Stores a sponsorship offer. Same anonymous-insert-only pattern as
 * scholarship requests above.
 */
export async function submitSponsorRequest(
  input: unknown
): Promise<SponsorResult> {
  const parsed = sponsorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }

  const { sponsorName, organization, phone, email, message } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from('sponsor_requests').insert({
    sponsor_name: sponsorName,
    organization: organization || null,
    phone,
    email,
    message: message || null,
  });

  if (error) {
    console.error('submitSponsorRequest:', error.message);
    return { ok: false, error: 'Could not submit your request. Please try again.' };
  }

  return { ok: true };
}
