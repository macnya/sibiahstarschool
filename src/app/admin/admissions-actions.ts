'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ALL_STATUSES, NEXT_STATUSES } from '@/lib/admissions/constants';
import type { ApplicationStatus } from '@/lib/supabase/types';

/**
 * Admissions + campus management.
 *
 * Every write runs as the signed-in user, so Row Level Security (not these
 * checks) decides who may change what: a campus admin simply cannot touch another
 * campus's rows. Failures redirect back with ?error= so no client JS is needed.
 */

function back(path: string, error?: string, ok?: string): never {
  const params = new URLSearchParams();
  if (error) params.set('error', error);
  if (ok) params.set('ok', ok);
  const qs = params.toString();
  redirect(qs ? `${path}?${qs}` : path);
}

function text(formData: FormData, key: string, max = 2000) {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  return supabase;
}

// ------------------------------------------------------------------ applications

export async function changeApplicationStatus(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/admissions/${id}`;
  const supabase = await authed();

  const next = text(formData, 'status', 30) as ApplicationStatus;
  if (!ALL_STATUSES.includes(next)) back(path, 'Choose a valid status.');

  const { data: current } = await supabase.from('admission_applications').select('status').eq('id', id).maybeSingle();
  if (!current) back('/admin/admissions', 'Application not found, or you do not have access to it.');
  const from = (current as { status: ApplicationStatus }).status;
  if (!NEXT_STATUSES[from].includes(next)) back(path, `An application that is “${from}” cannot be moved to “${next}”.`);

  const assessment = text(formData, 'assessment_date', 10);
  const patch: { status: ApplicationStatus; decision_note: string | null; assessment_date?: string | null } = {
    status: next,
    decision_note: text(formData, 'decision_note', 1000) || null,
  };
  if (next === 'assessment') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(assessment)) back(path, 'Choose the assessment date.');
    patch.assessment_date = assessment;
  }

  const { data, error } = await supabase.from('admission_applications').update(patch).eq('id', id).select('id');
  if (error) back(path, 'Could not update the application. Please try again.');
  if (!data || data.length === 0) back(path, 'You do not have permission to change this application.');

  revalidatePath('/admin/admissions');
  back(path, undefined, 'Status updated.');
}

export async function saveApplicationNotes(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/admissions/${id}`;
  const supabase = await authed();
  const { data, error } = await supabase
    .from('admission_applications')
    .update({ internal_notes: text(formData, 'internal_notes', 4000) || null })
    .eq('id', id)
    .select('id');
  if (error || !data || data.length === 0) back(path, 'Could not save the notes.');
  back(path, undefined, 'Notes saved.');
}

export async function enrolApplication(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/admissions/${id}`;
  const supabase = await authed();
  const { error } = await supabase.rpc('enrol_application', { p_application_id: id });
  if (error) back(path, error.code === 'P0001' ? error.message : 'Could not enrol this child. Please try again.');
  revalidatePath('/admin/admissions');
  revalidatePath('/admin/students');
  back(path, undefined, 'Child enrolled. The admission number has been issued.');
}

// ------------------------------------------------------------------ campuses

function slugify(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function optional(formData: FormData, key: string, max = 500) {
  return text(formData, key, max) || null;
}

function checkUrl(value: string | null, label: string, path: string) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) throw new Error('bad');
    return url.toString();
  } catch {
    back(path, `${label} does not look like a valid web address.`);
  }
}

export async function createCampus(formData: FormData) {
  const path = '/admin/campuses';
  const supabase = await authed();

  const name = text(formData, 'name', 120);
  const code = text(formData, 'code', 6).toUpperCase();
  if (name.length < 3) back(path, 'Enter the school’s name.');
  if (!/^[A-Z]{2,6}$/.test(code)) back(path, 'The school code must be 2–6 capital letters, e.g. JSA.');
  const slug = slugify(name);
  if (!slug) back(path, 'That name cannot be turned into a web address. Try another.');

  const { data: campus, error } = await supabase
    .from('campuses')
    .insert({
      name, code, slug,
      tagline: optional(formData, 'tagline', 160),
      description: optional(formData, 'description', 4000),
      address: optional(formData, 'address', 200),
      town: optional(formData, 'town', 80),
      phone: optional(formData, 'phone', 40),
      email: optional(formData, 'email', 120),
      map_url: checkUrl(optional(formData, 'map_url', 400), 'The map link', path),
      website_url: checkUrl(optional(formData, 'website_url', 300), 'The website', path),
      paybill_number: optional(formData, 'paybill_number', 20),
      till_number: optional(formData, 'till_number', 20),
      paybill_account_format: optional(formData, 'paybill_account_format', 80),
      kcb_till_number: optional(formData, 'kcb_till_number', 30),
      kcb_paybill_number: optional(formData, 'kcb_paybill_number', 30),
      kcb_account_format: optional(formData, 'kcb_account_format', 80),
      payment_instructions: optional(formData, 'payment_instructions', 600),
      admissions_open: formData.get('admissions_open') === 'on',
      is_active: true,
      logo_url: null,
      image_url: null,
      sort_order: 100,
    })
    .select('id')
    .single();

  if (error || !campus) {
    if (error?.code === '23505') back(path, 'A school with that name or code already exists.');
    if (error?.code === '42501') back(path, 'Only group administrators can add schools.');
    back(path, 'Could not add the school. Please try again.');
  }

  // Classes ticked on the form (default: all of them).
  const gradeIds = formData.getAll('grade_id').filter((v): v is string => typeof v === 'string');
  if (gradeIds.length > 0) {
    await supabase.from('campus_grades').insert(gradeIds.map((grade_id) => ({ campus_id: campus.id, grade_id, capacity: 30 })));
  }
  revalidatePath('/schools');
  revalidatePath('/');
  back(`/admin/campuses/${campus.id}`, undefined, 'School added. You can fine-tune its classes and capacity below.');
}

export async function updateCampus(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/campuses/${id}`;
  const supabase = await authed();
  const name = text(formData, 'name', 120);
  if (name.length < 3) back(path, 'Enter the school’s name.');

  const { data, error } = await supabase
    .from('campuses')
    .update({
      name,
      tagline: optional(formData, 'tagline', 160),
      description: optional(formData, 'description', 4000),
      address: optional(formData, 'address', 200),
      town: optional(formData, 'town', 80),
      phone: optional(formData, 'phone', 40),
      email: optional(formData, 'email', 120),
      map_url: checkUrl(optional(formData, 'map_url', 400), 'The map link', path),
      website_url: checkUrl(optional(formData, 'website_url', 300), 'The website', path),
      paybill_number: optional(formData, 'paybill_number', 20),
      till_number: optional(formData, 'till_number', 20),
      paybill_account_format: optional(formData, 'paybill_account_format', 80),
      kcb_till_number: optional(formData, 'kcb_till_number', 30),
      kcb_paybill_number: optional(formData, 'kcb_paybill_number', 30),
      kcb_account_format: optional(formData, 'kcb_account_format', 80),
      payment_instructions: optional(formData, 'payment_instructions', 600),
      admissions_open: formData.get('admissions_open') === 'on',
      is_active: formData.get('is_active') === 'on',
    })
    .eq('id', id)
    .select('id');
  if (error || !data || data.length === 0) back(path, 'Could not save. Only group administrators can edit school details.');
  revalidatePath('/schools');
  revalidatePath('/');
  back(path, undefined, 'School details saved.');
}

export async function saveCampusGrades(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/campuses/${id}`;
  const supabase = await authed();
  const { data: grades } = await supabase.from('grade_levels').select('id');
  const rows: { campus_id: string; grade_id: string; capacity: number }[] = [];
  const removed: string[] = [];

  for (const g of (grades ?? []) as { id: string }[]) {
    if (formData.get(`offer_${g.id}`) === 'on') {
      const cap = Number(text(formData, `capacity_${g.id}`, 5));
      rows.push({ campus_id: id, grade_id: g.id, capacity: Number.isInteger(cap) && cap >= 0 && cap <= 500 ? cap : 30 });
    } else {
      removed.push(g.id);
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('campus_grades').upsert(rows, { onConflict: 'campus_id,grade_id' });
    if (error) back(path, 'Could not save the classes.');
  }
  if (removed.length > 0) {
    const { error } = await supabase.from('campus_grades').delete().eq('campus_id', id).in('grade_id', removed);
    if (error) back(path, 'Could not save the classes.');
  }
  revalidatePath('/schools');
  revalidatePath('/admissions/apply');
  back(path, undefined, 'Classes saved.');
}
