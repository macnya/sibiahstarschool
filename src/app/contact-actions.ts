'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(500),
});

export type ContactResult = { ok: boolean; error?: string };

/**
 * Stores a contact enquiry. Inserts run as the anonymous role, which the
 * "anyone can submit a message" RLS policy allows for INSERT only — so a
 * visitor can send a message but cannot read anyone else's.
 */
export async function submitContactMessage(
  input: unknown
): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }

  const { fullName, email, phone, subject, message } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from('contact_messages').insert({
    name: fullName,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
  });

  if (error) {
    console.error('submitContactMessage:', error.message);
    return { ok: false, error: 'Could not send your message. Please try again.' };
  }

  return { ok: true };
}
