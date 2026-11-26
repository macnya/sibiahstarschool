import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type {
  AdmissionApplicationRow, ApplicationEventRow, ApplicationStatus, CampusRow, GradeLevelRow, ProfileRow, StudentRow,
} from '@/lib/supabase/types';

/**
 * Who is looking, and which campus(es) may they see?
 * Row Level Security in the database is the real wall — these helpers only decide
 * what to *show* (filters, menus). A campus admin cannot read other campuses even
 * if they edit the URL.
 */
export async function getAdminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/staff-login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'editor'].includes(profile.role)) redirect('/staff-login?denied=1');
  const p = profile as ProfileRow;
  return {
    supabase,
    user,
    profile: p,
    isGroupAdmin: p.role === 'admin' && !p.campus_id,
    isAdmin: p.role === 'admin',
    campusId: p.campus_id,
  };
}

/** Pages that only group admins / any admin should see. */
export async function requireAdmissionsStaff() {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) redirect('/admin');
  return ctx;
}

export async function requireGroupAdmin() {
  const ctx = await getAdminContext();
  if (!ctx.isGroupAdmin) redirect('/admin');
  return ctx;
}

export async function getCampusesAndGrades() {
  const { supabase } = await getAdminContext();
  const [c, g] = await Promise.all([
    supabase.from('campuses').select('*').order('sort_order').order('name'),
    supabase.from('grade_levels').select('*').order('sort_order'),
  ]);
  return { campuses: (c.data ?? []) as CampusRow[], grades: (g.data ?? []) as GradeLevelRow[] };
}

/** Strip characters that have meaning inside a PostgREST filter string. */
function safeSearch(q: string) {
  return q.replace(/[,()%*\\:"']/g, ' ').trim().slice(0, 60);
}

export interface ApplicationFilters {
  campusId?: string;
  status?: ApplicationStatus;
  gradeId?: string;
  year?: number;
  q?: string;
}

export async function getApplications(filters: ApplicationFilters = {}) {
  const { supabase, campusId: scopedCampus } = await getAdminContext();
  let query = supabase.from('admission_applications').select('*').order('created_at', { ascending: false }).limit(300);

  const campusId = scopedCampus ?? filters.campusId;
  if (campusId) query = query.eq('campus_id', campusId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.gradeId) query = query.eq('grade_id', filters.gradeId);
  if (filters.year) query = query.eq('intake_year', filters.year);
  const q = filters.q ? safeSearch(filters.q) : '';
  if (q) {
    query = query.or(
      ['student_first_name', 'student_last_name', 'reference', 'guardian_name', 'guardian_phone']
        .map((c) => `${c}.ilike.%${q}%`).join(','),
    );
  }
  const { data } = await query;
  return (data ?? []) as AdmissionApplicationRow[];
}

export async function getStatusCounts(filters: { campusId?: string } = {}) {
  const { supabase, campusId: scopedCampus } = await getAdminContext();
  let query = supabase.from('admission_applications').select('status').limit(5000);
  const campusId = scopedCampus ?? filters.campusId;
  if (campusId) query = query.eq('campus_id', campusId);
  const { data } = await query;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { status: string }[]) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

export async function getApplication(id: string) {
  const { supabase } = await getAdminContext();
  const { data: application } = await supabase.from('admission_applications').select('*').eq('id', id).maybeSingle();
  if (!application) return null;
  const a = application as AdmissionApplicationRow;
  const [events, campus, grade, student] = await Promise.all([
    supabase.from('application_events').select('*').eq('application_id', id).order('created_at'),
    supabase.from('campuses').select('*').eq('id', a.campus_id).maybeSingle(),
    supabase.from('grade_levels').select('*').eq('id', a.grade_id).maybeSingle(),
    a.student_id ? supabase.from('students').select('*').eq('id', a.student_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    application: a,
    events: (events.data ?? []) as ApplicationEventRow[],
    campus: campus.data as CampusRow | null,
    grade: grade.data as GradeLevelRow | null,
    student: student.data as StudentRow | null,
  };
}

export async function getStudents(filters: { campusId?: string; gradeId?: string; q?: string } = {}) {
  const { supabase, campusId: scopedCampus } = await getAdminContext();
  let query = supabase.from('students').select('*').order('admission_number').limit(500);
  const campusId = scopedCampus ?? filters.campusId;
  if (campusId) query = query.eq('campus_id', campusId);
  if (filters.gradeId) query = query.eq('grade_id', filters.gradeId);
  const q = filters.q ? safeSearch(filters.q) : '';
  if (q) {
    query = query.or(
      ['first_name', 'last_name', 'admission_number', 'guardian_name', 'guardian_phone']
        .map((c) => `${c}.ilike.%${q}%`).join(','),
    );
  }
  const { data } = await query;
  return (data ?? []) as StudentRow[];
}
