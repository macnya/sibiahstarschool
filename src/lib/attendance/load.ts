import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Pupil } from '@/components/attendance/attendance-form';
import type { AttendanceStatus } from '@/lib/attendance/shared';

/** Active pupils of a class plus whatever was already marked that day. RLS limits what the caller sees. */
export async function loadRegister(supabase: SupabaseClient, classId: string, day: string) {
  const [{ data: kids }, { data: marks }] = await Promise.all([
    supabase.from('students').select('id, first_name, middle_name, last_name, admission_number').eq('class_id', classId).eq('status', 'active').order('first_name'),
    supabase.from('attendance').select('student_id, status, note').eq('class_id', classId).eq('day', day),
  ]);
  const pupils: Pupil[] = ((kids ?? []) as { id: string; first_name: string; middle_name: string | null; last_name: string; admission_number: string }[])
    .map((k) => ({ id: k.id, name: [k.first_name, k.middle_name, k.last_name].filter(Boolean).join(' '), admission: k.admission_number }));
  const existing = new Map(((marks ?? []) as { student_id: string; status: AttendanceStatus; note: string | null }[]).map((m) => [m.student_id, { status: m.status, note: m.note }]));
  return { pupils, existing };
}
