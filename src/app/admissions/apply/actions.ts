'use server';

import { headers } from 'next/headers';
import { createPublicClient } from '@/lib/supabase/public';
import { allowRequest } from '@/lib/rate-limit';
import { applicationSchema, toDatabasePayload, type ApplicationInput } from '@/lib/admissions/schema';
import type { ApplicationStatusResult } from '@/lib/supabase/types';

export type SubmitResult = { ok: true; reference: string } | { ok: false; error: string };
export type LookupResult = { ok: true; result: ApplicationStatusResult | null } | { ok: false; error: string };

async function clientKey() {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown').split(',')[0].trim();
}

/**
 * Submit an online admission application.
 *
 * Visitors cannot write to any table. The only door is the database function
 * submit_admission_application(), which re-checks everything (school open, class
 * offered, age, consent...) and issues the reference number.
 */
export async function submitApplication(input: ApplicationInput): Promise<SubmitResult> {
  if (!allowRequest(`apply:${await clientKey()}`, 6)) {
    return { ok: false, error: 'Too many applications from this connection. Please wait a few minutes and try again.' };
  }

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }
  // Honeypot filled: pretend it worked so bots learn nothing.
  if (parsed.data.website) return { ok: true, reference: 'APP-RECEIVED' };

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('submit_admission_application', { p: toDatabasePayload(parsed.data) });

  if (error) {
    // The function raises plain-English messages (SQLSTATE P0001) meant for families.
    if (error.code === 'P0001') return { ok: false, error: error.message };
    console.error('[admissions] submit failed:', error.code, error.message);
    return { ok: false, error: 'We could not submit your application just now. Please try again, or contact the school office.' };
  }
  return { ok: true, reference: String(data) };
}

/** A family checks their own application with the reference number AND the guardian's phone number. */
export async function lookupApplication(reference: string, phone: string): Promise<LookupResult> {
  if (!allowRequest(`lookup:${await clientKey()}`, 15)) {
    return { ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
  }
  const ref = reference.trim();
  if (ref.length < 8 || ref.length > 40 || phone.replace(/\D/g, '').length < 7) {
    return { ok: false, error: 'Enter your reference number and the phone number you applied with.' };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('get_application_status', { p_reference: ref, p_phone: phone });
  if (error) {
    console.error('[admissions] lookup failed:', error.code, error.message);
    return { ok: false, error: 'We could not check your application just now. Please try again.' };
  }
  const rows = (data ?? []) as ApplicationStatusResult[];
  return { ok: true, result: rows[0] ?? null };
}

export type TrackResult = { ok: true; results: ApplicationStatusResult[] } | { ok: false; error: string };

/** The easy way for a family to check progress: the parent's phone number plus one name of the child. */
export async function trackApplications(phone: string, childName: string): Promise<TrackResult> {
  if (!allowRequest(`track:${await clientKey()}`, 15)) {
    return { ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
  }
  if (phone.replace(/\D/g, '').length < 9 || childName.trim().length < 3) {
    return { ok: false, error: 'Enter the parent’s phone number and at least 3 letters of one of the child’s names.' };
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('track_applications', { p_phone: phone, p_name: childName });
  if (error) {
    if (error.code === 'P0001') return { ok: false, error: error.message };
    console.error('[admissions] track failed:', error.code, error.message);
    return { ok: false, error: 'We could not check just now. Please try again.' };
  }
  return { ok: true, results: (data ?? []) as ApplicationStatusResult[] };
}
