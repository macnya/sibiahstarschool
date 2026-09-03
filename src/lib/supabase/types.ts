/**
 * Database types.
 *
 * These are written by hand to match supabase/migrations/0001_init.sql.
 * Once the Supabase CLI is set up you can generate them instead, which
 * keeps them in sync automatically:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 *
 * If you change the SQL, change this file too, or the types will lie to you.
 */

export type UserRole = 'admin' | 'editor' | 'teacher' | 'student' | 'parent';

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

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      events: Table<EventRow>;
      blog_posts: Table<BlogPostRow>;
      gallery_images: Table<GalleryImageRow>;
      contact_messages: Table<ContactMessageRow>;
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
