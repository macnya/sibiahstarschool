/**
 * Database types.
 *
 * Written by hand to match supabase/migrations/0001_init.sql.
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export type EventRow = {
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

export type BlogPostRow = {
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

export type GalleryImageRow = {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  image_hint: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export type SiteContentRow = {
  page: string;
  content: Json;
  updated_at: string;
}

/** Columns the database fills in itself, so they are optional on insert. */
type Generated = 'id' | 'created_at' | 'updated_at';

type Insertable<Row> = Omit<Row, Generated & keyof Row> &
  Partial<Pick<Row, Generated & keyof Row>>;

export type Database = {
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
      site_content: {
        Row: SiteContentRow;
        Insert: Partial<SiteContentRow> & Pick<SiteContentRow, 'page'>;
        Update: Partial<SiteContentRow>;
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