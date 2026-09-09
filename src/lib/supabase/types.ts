/**
 * Database types.
 *
 * Written by hand to match supabase/migrations/0001_init.sql through
 * 0004_scholarships.sql.
 *
 * The shape below is not arbitrary: supabase-js constrains the schema
 * generic to `GenericSchema`, which requires Tables / Views / Functions /
 * Enums / CompositeTypes, and each table to carry a Relationships array.
 * If any of those are missing the constraint fails and every query result
 * silently degrades to `never` — which shows up as errors like
 * "Property 'role' does not exist on type 'never'".
 *
 * Once the Supabase CLI is set up you can generate this instead:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

export type UserRole = 'admin' | 'editor' | 'teacher' | 'student' | 'parent';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  location: string;
  description: string;
  image_url: string | null;
  image_hint: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  body: string | null;
  published_at: string;
  image_url: string | null;
  image_hint: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageRow {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  image_hint: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export type ScholarshipRequestStatus = 'pending' | 'approved' | 'declined';

export interface ScholarshipRequestRow {
  id: string;
  parent_name: string;
  phone: string;
  email: string;
  student_name: string;
  student_level: string;
  reason: string;
  status: ScholarshipRequestStatus;
  created_at: string;
}

export type SponsorRequestStatus = 'pending' | 'contacted' | 'matched' | 'declined';

export interface SponsorRequestRow {
  id: string;
  sponsor_name: string;
  organization: string | null;
  phone: string;
  email: string;
  message: string | null;
  status: SponsorRequestStatus;
  created_at: string;
}

export type ActiveScholarshipStatus = 'active' | 'completed';

export interface ActiveScholarshipRow {
  id: string;
  student_name: string;
  student_level: string | null;
  sponsor_name: string;
  sponsor_email: string | null;
  sponsor_phone: string | null;
  notes: string | null;
  start_date: string;
  status: ActiveScholarshipStatus;
  scholarship_request_id: string | null;
  sponsor_request_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns the database fills in itself, so they are optional on insert. */
type Generated = 'id' | 'created_at' | 'updated_at';

type Insertable<Row> = Omit<Row, Generated & keyof Row> &
  Partial<Pick<Row, Generated & keyof Row>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insertable<EventRow>;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      blog_posts: {
        Row: BlogPostRow;
        Insert: Insertable<BlogPostRow>;
        Update: Partial<BlogPostRow>;
        Relationships: [];
      };
      gallery_images: {
        Row: GalleryImageRow;
        Insert: Insertable<GalleryImageRow>;
        Update: Partial<GalleryImageRow>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: Insertable<ContactMessageRow>;
        Update: Partial<ContactMessageRow>;
        Relationships: [];
      };
      scholarship_requests: {
        Row: ScholarshipRequestRow;
        Insert: Insertable<ScholarshipRequestRow>;
        Update: Partial<ScholarshipRequestRow>;
        Relationships: [];
      };
      sponsor_requests: {
        Row: SponsorRequestRow;
        Insert: Insertable<SponsorRequestRow>;
        Update: Partial<SponsorRequestRow>;
        Relationships: [];
      };
      active_scholarships: {
        Row: ActiveScholarshipRow;
        Insert: Insertable<ActiveScholarshipRow>;
        Update: Partial<ActiveScholarshipRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
      can_edit_content: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<never, never>;
  };
}
