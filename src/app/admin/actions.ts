'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SITE_CONTENT_PAGES, type SiteContentPage } from '@/lib/site-content/defaults';

/**
 * Content CRUD.
 *
 * Every write goes through the user's own session, so Row Level Security
 * is the real authorisation boundary — these actions cannot be used to
 * escalate privileges even if called directly. The role check below is
 * a convenience for error messages, not the security control.
 */

export type ActionState = { error: string | null; ok?: boolean };

async function requireEditor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/staff-login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    throw new Error('You do not have permission to change content.');
  }
  return supabase;
}

/** "Annual Sports Day" -> "annual-sports-day" */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function fieldErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

// --- events -----------------------------------------------------------

const eventSchema = z.object({
  title: z.string().trim().min(3, 'Give the event a title.'),
  event_date: z.string().min(1, 'Pick a date.'),
  location: z.string().trim().min(1, 'Add a location.'),
  description: z.string().trim().min(10, 'Add a short description.'),
  image_url: z.string().trim().url('Image URL must be a full URL.').or(z.literal('')),
  image_hint: z.string().trim().optional(),
  published: z.coerce.boolean(),
});

export async function saveEvent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireEditor();
  const id = formData.get('id') as string | null;

  const parsed = eventSchema.safeParse({
    title: formData.get('title'),
    event_date: formData.get('event_date'),
    location: formData.get('location'),
    description: formData.get('description'),
    image_url: formData.get('image_url') ?? '',
    image_hint: formData.get('image_hint') ?? '',
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) return { error: fieldErrors(parsed.error) };

  const values = {
    ...parsed.data,
    image_url: parsed.data.image_url || null,
    image_hint: parsed.data.image_hint || null,
    slug: slugify(parsed.data.title),
  };

  const { error } = id
    ? await supabase.from('events').update(values).eq('id', id)
    : await supabase.from('events').insert(values);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Another event already uses that title.' };
    }
    return { error: error.message };
  }

  revalidatePath('/events');
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export async function deleteEvent(formData: FormData) {
  const supabase = await requireEditor();
  await supabase.from('events').delete().eq('id', String(formData.get('id')));
  revalidatePath('/events');
  revalidatePath('/admin/events');
}

// --- blog posts -------------------------------------------------------

const postSchema = z.object({
  title: z.string().trim().min(3, 'Give the post a title.'),
  author: z.string().trim().min(2, 'Add an author.'),
  excerpt: z.string().trim().min(10, 'Add a short excerpt.'),
  body: z.string().optional(),
  published_at: z.string().min(1, 'Pick a publish date.'),
  image_url: z.string().trim().url('Image URL must be a full URL.').or(z.literal('')),
  image_hint: z.string().trim().optional(),
  published: z.coerce.boolean(),
});

export async function savePost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireEditor();
  const id = formData.get('id') as string | null;

  const parsed = postSchema.safeParse({
    title: formData.get('title'),
    author: formData.get('author'),
    excerpt: formData.get('excerpt'),
    body: formData.get('body') ?? '',
    published_at: formData.get('published_at'),
    image_url: formData.get('image_url') ?? '',
    image_hint: formData.get('image_hint') ?? '',
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) return { error: fieldErrors(parsed.error) };

  const values = {
    ...parsed.data,
    body: parsed.data.body || null,
    image_url: parsed.data.image_url || null,
    image_hint: parsed.data.image_hint || null,
    slug: slugify(parsed.data.title),
  };

  const { error } = id
    ? await supabase.from('blog_posts').update(values).eq('id', id)
    : await supabase.from('blog_posts').insert(values);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Another post already uses that title.' };
    }
    return { error: error.message };
  }

  revalidatePath('/blog');
  revalidatePath('/admin/blog');
  redirect('/admin/blog');
}

export async function deletePost(formData: FormData) {
  const supabase = await requireEditor();
  await supabase.from('blog_posts').delete().eq('id', String(formData.get('id')));
  revalidatePath('/blog');
  revalidatePath('/admin/blog');
}

// --- gallery ----------------------------------------------------------

const imageSchema = z.object({
  image_url: z.string().trim().url('Upload an image or paste a full URL.'),
  alt_text: z.string().trim().min(3, 'Describe the image for screen readers.'),
  caption: z.string().trim().optional(),
  image_hint: z.string().trim().optional(),
  sort_order: z.coerce.number().int().min(0),
  published: z.coerce.boolean(),
});

export async function saveGalleryImage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireEditor();
  const id = formData.get('id') as string | null;

  const parsed = imageSchema.safeParse({
    image_url: formData.get('image_url'),
    alt_text: formData.get('alt_text'),
    caption: formData.get('caption') ?? '',
    image_hint: formData.get('image_hint') ?? '',
    sort_order: formData.get('sort_order') || 0,
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) return { error: fieldErrors(parsed.error) };

  const values = {
    ...parsed.data,
    caption: parsed.data.caption || null,
    image_hint: parsed.data.image_hint || null,
  };

  const { error } = id
    ? await supabase.from('gallery_images').update(values).eq('id', id)
    : await supabase.from('gallery_images').insert(values);

  if (error) return { error: error.message };

  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
  return { error: null, ok: true };
}

export async function deleteGalleryImage(formData: FormData) {
  const supabase = await requireEditor();
  const id = String(formData.get('id'));

  // Remove the stored file too, if it lives in our bucket. Otherwise
  // deleted photos accumulate in storage and count against your quota.
  const { data: row } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (row?.image_url) {
    const marker = '/storage/v1/object/public/media/';
    const at = row.image_url.indexOf(marker);
    if (at !== -1) {
      const path = row.image_url.slice(at + marker.length);
      await supabase.storage.from('media').remove([path]);
    }
  }

  await supabase.from('gallery_images').delete().eq('id', id);
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}

// --- contact messages -------------------------------------------------

export async function toggleMessageHandled(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('contact_messages')
    .update({ handled: formData.get('handled') === 'true' })
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/messages');
}

export async function deleteMessage(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('contact_messages')
    .delete()
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/messages');
}

// --- scholarship requests (parents applying) ---------------------------

export async function updateScholarshipStatus(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('scholarship_requests')
    .update({ status: String(formData.get('status')) })
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/scholarships');
}

export async function deleteScholarshipRequest(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('scholarship_requests')
    .delete()
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/scholarships');
}

// --- sponsor requests (prospective sponsors) ----------------------------

export async function updateSponsorStatus(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('sponsor_requests')
    .update({ status: String(formData.get('status')) })
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/scholarships');
}

export async function deleteSponsorRequest(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('sponsor_requests')
    .delete()
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/scholarships');
}

// --- active scholarships (matched student + sponsor pairs) ---------------
//
// Created directly by staff once a match is agreed, so this uses the
// same plain <form action={fn}> pattern as the toggles above rather than
// the useActionState-driven forms events/posts/gallery use — there's no
// separate client form component to keep field-level errors in sync
// with, since the admin page itself renders this inline.

export async function createActiveScholarship(formData: FormData) {
  const supabase = await requireEditor();

  const student_name = String(formData.get('student_name') ?? '').trim();
  const sponsor_name = String(formData.get('sponsor_name') ?? '').trim();
  const start_date = String(formData.get('start_date') ?? '').trim();
  if (!student_name || !sponsor_name || !start_date) {
    // The form fields are marked required, so this only fires on a
    // direct/malformed submission — nothing useful to show a user here.
    return;
  }

  const student_level = String(formData.get('student_level') ?? '').trim() || null;
  const sponsor_email = String(formData.get('sponsor_email') ?? '').trim() || null;
  const sponsor_phone = String(formData.get('sponsor_phone') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const scholarship_request_id = String(formData.get('scholarship_request_id') ?? '').trim() || null;
  const sponsor_request_id = String(formData.get('sponsor_request_id') ?? '').trim() || null;

  const { error } = await supabase.from('active_scholarships').insert({
    student_name,
    student_level,
    sponsor_name,
    sponsor_email,
    sponsor_phone,
    notes,
    start_date,
    scholarship_request_id,
    sponsor_request_id,
  });

  if (error) console.error('createActiveScholarship:', error.message);

  // Matching a request usually means it's no longer "pending" — mark
  // whichever source requests were linked as matched/approved so they
  // drop out of the pending queues automatically.
  if (scholarship_request_id) {
    await supabase.from('scholarship_requests').update({ status: 'approved' }).eq('id', scholarship_request_id);
  }
  if (sponsor_request_id) {
    await supabase.from('sponsor_requests').update({ status: 'matched' }).eq('id', sponsor_request_id);
  }

  revalidatePath('/admin/scholarships');
}

export async function updateActiveScholarshipStatus(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('active_scholarships')
    .update({ status: String(formData.get('status')) })
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/scholarships');
}

export async function deleteActiveScholarship(formData: FormData) {
  const supabase = await requireEditor();
  await supabase
    .from('active_scholarships')
    .delete()
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/scholarships');
}

// --- site content -------------------------------------------------------
//
// Unlike the forms above, the content editor works with a nested JSON
// object (headings, paragraphs, repeatable lists) rather than flat form
// fields, so this is a plain server action the client calls directly with
// a JS object instead of a <form action> + FormData. Next.js server
// actions support both.

const PUBLIC_PATH_BY_PAGE: Record<SiteContentPage, string> = {
  home: '/',
  about: '/about',
  admissions: '/admissions',
  facilities: '/facilities',
  curriculum: '/curriculum',
  contact: '/contact',
};

export async function updateSiteContent(
  page: SiteContentPage,
  content: Record<string, unknown>
): Promise<ActionState> {
  if (!SITE_CONTENT_PAGES.includes(page)) {
    return { error: 'Unknown page.' };
  }

  const supabase = await requireEditor();
  const { error } = await supabase
    .from('site_content')
    .upsert({ page, content });

  if (error) return { error: error.message };

  revalidatePath(PUBLIC_PATH_BY_PAGE[page]);
  revalidatePath(`/admin/content/${page}`);
  return { error: null, ok: true };
}
