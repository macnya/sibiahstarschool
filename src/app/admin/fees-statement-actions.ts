'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export interface StatementResult {
  committed: boolean;
  total: number;
  matched: number;
  unmatched: number;
  duplicates: number;
  errors: number;
  matched_cents: number;
  unmatched_cents: number;
  rows: { line: number; status: 'matched' | 'unmatched' | 'duplicate' | 'error'; message: string | null; reference: string | null; amount_cents: number | null; student_name: string | null; admission_number: string | null }[];
}

const text = (max: number) => z.string().trim().max(max);

const rowSchema = z.object({
  trans_id: text(60).min(3),
  amount_cents: z.number().int().min(1).max(100_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reference: text(80),
  payer_name: text(120).optional(),
  phone: text(40).optional(),
});

/**
 * Checks (commit = false) or records (commit = true) the payments in a KCB / bank / M-Pesa statement
 * for ONE school. Runs as the signed-in user: the database refuses anyone who may not manage that school,
 * re-checks every line, and never counts the same transaction twice.
 */
export async function runStatementImport(
  campusId: string,
  channel: 'mpesa' | 'kcb' | 'bank',
  rows: unknown[],
  commit: boolean,
): Promise<{ ok: true; result: StatementResult } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in again.' };
  if (!z.string().uuid().safeParse(campusId).success) return { ok: false, error: 'Choose a school.' };
  if (!['mpesa', 'kcb', 'bank'].includes(channel)) return { ok: false, error: 'Choose where the statement is from.' };

  const parsed = z.array(rowSchema).min(1, 'There are no payments to import.').max(2000, 'Please import at most 2,000 payments at a time.').safeParse(rows);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'The file has rows we cannot read.' };

  const { data, error } = await supabase.rpc('import_statement', { p_campus: campusId, p_channel: channel, p_rows: parsed.data, p_commit: commit });
  if (error) {
    return { ok: false, error: error.code === 'P0001' ? error.message : 'The import could not be completed. Please try again.' };
  }
  return { ok: true, result: data as StatementResult };
}
