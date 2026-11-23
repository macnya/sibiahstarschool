'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export interface ImportResult {
  committed: boolean;
  ok: number;
  duplicates: number;
  errors: number;
  rows: { row: number; status: 'ok' | 'duplicate' | 'error'; admission_number: string | null; message: string | null }[];
}

const text = (max: number) => z.string().trim().max(max);

const rowSchema = z.object({
  first_name: text(80).min(1),
  middle_name: text(80).optional(),
  last_name: text(80).min(1),
  gender: z.enum(['female', 'male']),
  grade_id: z.string().uuid(),
  guardian_name: text(120).min(1),
  guardian_phone: text(40).min(7),
  guardian_email: text(200).optional(),
  guardian_relationship: text(60).optional(),
  admission_number: text(30).optional(),
  upi_number: text(40).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  opening_balance_cents: z.number().int().min(-100_000_000).max(100_000_000).optional(),
});

/**
 * Checks (commit = false) or loads (commit = true) a pupil list for ONE school.
 * Runs as the signed-in user: the database refuses anyone who may not manage that school,
 * and re-validates every row — nothing here is trusted just because it came from our page.
 */
export async function runStudentImport(
  campusId: string,
  rows: unknown[],
  commit: boolean,
): Promise<{ ok: true; result: ImportResult } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in again.' };
  if (!z.string().uuid().safeParse(campusId).success) return { ok: false, error: 'Choose a school.' };

  const parsed = z.array(rowSchema).min(1, 'There are no usable rows to import.').max(2000, 'Please import at most 2,000 pupils at a time.').safeParse(rows);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'The file has rows we cannot read.' };

  const { data, error } = await supabase.rpc('import_students', { p_campus: campusId, p_rows: parsed.data, p_commit: commit });
  if (error) {
    return { ok: false, error: error.code === 'P0001' ? error.message : 'The import could not be completed. Please try again.' };
  }
  return { ok: true, result: data as ImportResult };
}
